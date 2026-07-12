import { AudioManager, type AudioPlayback } from "../audio/AudioManager";
import type { AudioCue } from "../animation/transitions";
import type { PublicCommand } from "../core/commands";
import type { SimulationSession } from "../core/history";
import { createProjectionFromSimulationState } from "../projection/simulationProjection";
import { PixiApp } from "../render/PixiApp";
import { EventPipeline, type EventPipelineResult } from "./EventPipeline";
import { InteractionPrototype } from "./InteractionPrototype";
import { VisualTransactionController, type CommandSubmissionOutcome } from "./VisualTransactionController";

export interface RuntimeAudioFacade {
  playAll(cues: readonly AudioCue[]): void;
}

export interface GameRuntimeOptions {
  readonly session: SimulationSession;
  readonly manualProgress?: boolean;
  readonly audio?: RuntimeAudioFacade;
}

/**
 * Fixture-agnostic runtime composition. Its controller is the only authority
 * for command buffering and visual lifetime; Pixi, camera, and animation only
 * sample the controller's normalized progress.
 */
export class GameRuntime {
  private readonly pipeline = new EventPipeline();
  private readonly controller = new VisualTransactionController();
  private readonly audio: RuntimeAudioFacade;
  private pixiApp: PixiApp | null = null;
  private interactionPrototype: InteractionPrototype | null = null;
  private session: SimulationSession;
  private lastPipelineResult: EventPipelineResult | null = null;
  private destroyed = false;
  private instanceToken = 0;

  constructor(private readonly host: HTMLElement, private readonly options: GameRuntimeOptions) {
    this.session = options.session;
    this.audio = options.audio ?? new AudioManager();
  }

  async start() {
    const token = ++this.instanceToken;
    const pixiApp = new PixiApp(
      this.host,
      createProjectionFromSimulationState(this.session.present),
      this.controller,
      { manualProgress: this.options.manualProgress === true },
    );
    await pixiApp.init();

    // React StrictMode can tear down this instance while Pixi initializes.
    // A stale async completion may never attach canvas/input/ticker state.
    if (this.destroyed || token !== this.instanceToken) {
      pixiApp.destroy();
      return;
    }

    this.pixiApp = pixiApp;
    pixiApp.render(createProjectionFromSimulationState(this.session.present));
    this.interactionPrototype = new InteractionPrototype({ onCommand: (command) => this.submit(command) });
    this.interactionPrototype.start();
  }

  submit(command: PublicCommand): CommandSubmissionOutcome {
    if (this.destroyed || !this.pixiApp) return { kind: "destroyed" };
    return this.controller.submit(command, (nextCommand) => this.dispatch(nextCommand));
  }

  setManualProgress(progress: number) {
    if (!this.options.manualProgress || this.destroyed) return;
    this.controller.setProgress(progress);
  }

  cancelPresentation() {
    this.controller.cancel();
  }

  getQaSnapshot() {
    return {
      progress: this.controller.progress,
      result: this.lastPipelineResult,
      pixi: this.pixiApp?.getQaSnapshot() ?? null,
    };
  }

  get recentAudioPlayback(): readonly AudioPlayback[] {
    return this.audio instanceof AudioManager ? this.audio.recentPlayback : [];
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.instanceToken += 1;
    // Destroy invalidates before the display/input teardown, so no late ticker
    // or completion callback can commit p=1 or drain a buffered command.
    this.controller.destroy();
    this.interactionPrototype?.destroy();
    this.pixiApp?.destroy();
    this.interactionPrototype = null;
    this.pixiApp = null;
  }

  private dispatch(command: PublicCommand) {
    const pixiApp = this.pixiApp;
    if (this.destroyed || !pixiApp) return;

    const result = this.pipeline.dispatch(this.session, command);
    this.session = result.session;
    this.lastPipelineResult = result;
    // Establish the controller barrier before audio. A reentrant input from an
    // audio facade therefore sees the same reserved one-slot admission window.
    pixiApp.renderWithAnimation(result.previousProjection, result.nextProjection, result.animationPlan);
    // A buffered command has not reached this point yet; a rejected command
    // still presents its exact public event once through the same barrier.
    this.audio.playAll(result.animationPlan.audioCues);
  }
}
