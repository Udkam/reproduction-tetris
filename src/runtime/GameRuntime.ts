import { createStage3BSimulationProjection } from "../projection/simulationProjection";
import { PixiApp } from "../render/PixiApp";
import { InteractionPrototype } from "./InteractionPrototype";

export class GameRuntime {
  private readonly host: HTMLElement;
  private pixiApp: PixiApp | null = null;
  private interactionPrototype: InteractionPrototype | null = null;
  private destroyed = false;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  async start() {
    const pixiApp = new PixiApp(this.host);
    await pixiApp.init();

    if (this.destroyed) {
      pixiApp.destroy();
      return;
    }

    this.pixiApp = pixiApp;
    this.pixiApp.render(createStage3BSimulationProjection());
    this.interactionPrototype = new InteractionPrototype({
      onToggleRecursiveSpace: () => this.pixiApp?.toggleRecursiveTransition(),
    });
    this.interactionPrototype.start();
  }

  destroy() {
    this.destroyed = true;

    this.interactionPrototype?.destroy();
    this.pixiApp?.destroy();
    this.interactionPrototype = null;
    this.pixiApp = null;
  }
}
