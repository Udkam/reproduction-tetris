import type { Container } from "pixi.js";
import type { Rect2D, Size2D } from "../projection/types";

export interface CameraState {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface FitWorldOptions {
  readonly margin: number;
  readonly minScale?: number;
  readonly maxScale?: number;
}

interface CameraTransition {
  readonly from: CameraState;
  readonly to: CameraState;
}

interface CameraImpact {
  readonly offsetX: number;
  readonly offsetY: number;
}

/** Consumes controller progress only; it never advances time independently. */
export class Camera2D {
  private state: CameraState = { x: 0, y: 0, scale: 1 };
  private transition: CameraTransition | null = null;
  private impact: CameraImpact | null = null;
  private impactOffset = { x: 0, y: 0 };

  get current() {
    return { ...this.state };
  }

  get hasActiveEffects() {
    return this.transition !== null || this.impact !== null;
  }

  fitWorld(viewport: Size2D, worldBounds: Rect2D, options: FitWorldOptions) {
    const next = this.getFitState(viewport, worldBounds, options);
    this.setState(next);
    return next;
  }

  getFitState(viewport: Size2D, worldBounds: Rect2D, options: FitWorldOptions): CameraState {
    const availableWidth = Math.max(1, viewport.width - options.margin * 2);
    const availableHeight = Math.max(1, viewport.height - options.margin * 2);
    const rawScale = Math.min(availableWidth / worldBounds.width, availableHeight / worldBounds.height);
    const minScale = options.minScale ?? 0.05;
    const maxScale = options.maxScale ?? 2;
    const scale = Math.min(maxScale, Math.max(minScale, rawScale));

    return {
      x: viewport.width * 0.5 - (worldBounds.x + worldBounds.width * 0.5) * scale,
      y: viewport.height * 0.5 - (worldBounds.y + worldBounds.height * 0.5) * scale,
      scale,
    };
  }

  getFollowState(
    viewport: Size2D,
    worldBounds: Rect2D,
    targetBounds: Rect2D,
    options: FitWorldOptions & { readonly followStrength?: number },
  ): CameraState {
    const fit = this.getFitState(viewport, worldBounds, options);
    const followStrength = Math.min(1, Math.max(0, options.followStrength ?? 0.5));
    const worldCenter = { x: worldBounds.x + worldBounds.width * 0.5, y: worldBounds.y + worldBounds.height * 0.5 };
    const targetCenter = { x: targetBounds.x + targetBounds.width * 0.5, y: targetBounds.y + targetBounds.height * 0.5 };
    const focus = {
      x: lerp(worldCenter.x, targetCenter.x, followStrength),
      y: lerp(worldCenter.y, targetCenter.y, followStrength),
    };

    return { x: viewport.width * 0.5 - focus.x * fit.scale, y: viewport.height * 0.5 - focus.y * fit.scale, scale: fit.scale };
  }

  setState(state: CameraState) {
    this.state = { ...state };
    this.transition = null;
    this.impact = null;
    this.impactOffset = { x: 0, y: 0 };
  }

  beginFollowTransition(target: CameraState) {
    this.transition = { from: this.current, to: { ...target } };
  }

  beginImpact(offsetX: number, offsetY: number) {
    this.impact = { offsetX, offsetY };
  }

  applyProgress(progress: number) {
    const normalized = Math.max(0, Math.min(1, progress));
    if (this.transition) {
      this.state = interpolateCamera(this.transition.from, this.transition.to, smoothstep(normalized));
    }
    if (this.impact) {
      const falloff = Math.sin(normalized * Math.PI) * (1 - normalized);
      this.impactOffset = { x: this.impact.offsetX * falloff, y: this.impact.offsetY * falloff };
    }
  }

  settle() {
    if (this.transition) {
      this.state = { ...this.transition.to };
    }
    this.transition = null;
    this.impact = null;
    this.impactOffset = { x: 0, y: 0 };
  }

  cancelTransition() {
    this.transition = null;
    this.impact = null;
    this.impactOffset = { x: 0, y: 0 };
  }

  applyTo(container: Container) {
    container.position.set(this.state.x + this.impactOffset.x, this.state.y + this.impactOffset.y);
    container.scale.set(this.state.scale);
  }
}

function smoothstep(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function interpolateCamera(from: CameraState, to: CameraState, progress: number): CameraState {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress), scale: lerp(from.scale, to.scale, progress) };
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}
