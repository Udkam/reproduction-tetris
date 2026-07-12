import type { PublicCommand } from "../core/commands";

export type CommandSubmissionOutcome =
  | { readonly kind: "dispatched" }
  | { readonly kind: "buffered" }
  | { readonly kind: "input-buffer-full" }
  | { readonly kind: "destroyed" };

export interface VisualTransactionOptions {
  readonly durationMs: number;
  readonly manualProgress?: boolean;
  readonly onProgress: (progress: number, running: boolean) => void;
  readonly onComplete: () => void;
}

interface ActiveVisualTransaction extends VisualTransactionOptions {
  readonly durationMs: number;
  readonly manualProgress: boolean;
  progress: number;
  completed: boolean;
}

interface BufferedSubmission {
  readonly command: PublicCommand;
  readonly dispatch: (command: PublicCommand) => void;
}

/** The sole V1 owner of visual transaction progress, completion, and buffering. */
export class VisualTransactionController {
  private active: ActiveVisualTransaction | null = null;
  private buffered: BufferedSubmission | null = null;
  /** Covers the complete dispatch callback, including visual start and audio. */
  private dispatchInProgress = false;
  private drainPending = false;
  private destroyed = false;

  get isActive() {
    return this.active !== null;
  }

  get progress() {
    return this.active?.progress ?? 1;
  }

  get hasBufferedCommand() {
    return this.buffered !== null;
  }

  submit(command: PublicCommand, dispatch: (command: PublicCommand) => void): CommandSubmissionOutcome {
    if (this.destroyed) {
      return { kind: "destroyed" };
    }
    if (this.active || this.dispatchInProgress) {
      if (!this.buffered) {
        this.buffered = { command, dispatch };
        return { kind: "buffered" };
      }
      return { kind: "input-buffer-full" };
    }
    this.dispatchReserved(command, dispatch);
    return { kind: "dispatched" };
  }

  start(options: VisualTransactionOptions) {
    if (this.destroyed) {
      return;
    }
    if (this.active) return;

    const active: ActiveVisualTransaction = {
      ...options,
      // A malformed duration is deliberately a synchronous presentation. It
      // must never create a NaN-busy transaction that strands the command
      // queue.
      durationMs: Number.isFinite(options.durationMs) && options.durationMs > 0 ? options.durationMs : 0,
      manualProgress: options.manualProgress === true,
      progress: 0,
      completed: false,
    };
    this.active = active;
    active.onProgress(0, true);

    if (active.durationMs === 0) {
      this.setProgress(1);
    }
  }

  advance(deltaMs: number) {
    const active = this.active;
    if (!active || active.manualProgress || this.destroyed) {
      return;
    }
    if (!Number.isFinite(deltaMs)) return;
    this.setProgress(active.progress + Math.max(0, deltaMs) / active.durationMs);
  }

  setProgress(progress: number) {
    const active = this.active;
    if (!active || this.destroyed) {
      return;
    }
    if (!Number.isFinite(progress)) return;
    active.progress = clamp01(progress);
    const complete = active.progress === 1;
    active.onProgress(active.progress, !complete);
    if (complete && this.active === active && !this.destroyed) {
      this.complete(active);
    }
  }

  cancel() {
    if (!this.active || this.destroyed) {
      return;
    }
    this.setProgress(1);
  }

  destroy() {
    this.destroyed = true;
    this.active = null;
    this.buffered = null;
    this.drainPending = false;
  }

  private complete(active: ActiveVisualTransaction) {
    if (active.completed || this.active !== active || this.destroyed) {
      return;
    }
    active.completed = true;
    // Keep the transaction busy during its completion callback. Commands
    // submitted re-entrantly therefore observe the same one-slot FIFO policy.
    active.onComplete();

    if (this.destroyed || this.active !== active) {
      return;
    }
    this.active = null;
    if (this.dispatchInProgress) {
      this.drainPending = true;
      return;
    }
    this.drainOne();
  }

  private dispatchReserved(command: PublicCommand, dispatch: (command: PublicCommand) => void) {
    this.dispatchInProgress = true;
    try {
      dispatch(command);
    } finally {
      this.dispatchInProgress = false;
      // A dispatch may buffer re-entrantly and then return without starting a
      // presentation. That zero-presentation path still owns the same FIFO
      // drain ordering even though complete() never set drainPending.
      if (!this.destroyed && !this.active && (this.drainPending || this.buffered !== null)) {
        this.drainPending = false;
        this.drainOne();
      }
    }
  }

  private drainOne() {
    if (this.destroyed || this.active || this.dispatchInProgress) return;
    const next = this.buffered;
    this.buffered = null;
    if (next) this.dispatchReserved(next.command, next.dispatch);
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
