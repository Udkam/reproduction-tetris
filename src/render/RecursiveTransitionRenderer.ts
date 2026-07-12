import { Container, Graphics } from "pixi.js";
import { lerp } from "../animation/easing";
import type { EntityOccurrenceAddress, PortOccurrenceAddress, WorldAddress } from "../core/types";
import type { Rect2D, Size2D } from "../projection/types";
import { getWorldCameraBounds } from "./metrics";
import { Camera2D, type CameraState } from "./Camera2D";

export type RecursiveTransitionDirection = "enter" | "exit";

/** Exact addressed geometry for one portal bridge in root-space coordinates. */
export interface AddressedPortalGeometry {
  readonly port: PortOccurrenceAddress;
  readonly outerWorld: { readonly address: WorldAddress; readonly rootBounds: Rect2D; readonly depth: number };
  readonly innerWorld: { readonly address: WorldAddress; readonly rootBounds: Rect2D; readonly depth: number };
  readonly container: { readonly occurrence: EntityOccurrenceAddress; readonly rootBounds: Rect2D };
  readonly aperture: { readonly rootBounds: Rect2D };
}

export interface RecursiveTransitionGeometry {
  readonly viewport: Size2D;
  readonly target: AddressedPortalGeometry;
}

/** Renders aperture/camera values from controller-owned normalized progress. */
export class RecursiveTransitionRenderer {
  private readonly apertureEffect = new Graphics();
  private direction: RecursiveTransitionDirection | null = null;

  constructor(
    private readonly camera: Camera2D,
    private cameraRoot: Container,
    private effectLayer: Container,
  ) {
    this.apertureEffect.label = "recursive-transition-aperture";
    this.effectLayer.addChild(this.apertureEffect);
  }

  setLayers(cameraRoot: Container, effectLayer: Container) {
    this.cameraRoot = cameraRoot;
    this.effectLayer = effectLayer;
    this.effectLayer.addChild(this.apertureEffect);
  }

  start(direction: RecursiveTransitionDirection) {
    this.direction = direction;
  }

  applyProgress(progress: number, geometry: RecursiveTransitionGeometry) {
    if (!this.direction) return;
    const canonicalProgress = transitionProgressForDirection(this.direction, progress);
    // Preserve a real parent rim at the midpoint. This remains a pure sample
    // of controller progress, with exact outer/inner endpoint equality.
    const cameraProgress = visibilityPreservingProgress(canonicalProgress);
    const cameraState = interpolateCamera(
      getOuterCameraState(this.camera, geometry),
      getInnerCameraState(this.camera, geometry),
      cameraProgress,
    );
    this.camera.setState(cameraState);
    this.camera.applyTo(this.cameraRoot);
    this.drawApertureEffect(canonicalProgress, geometry, cameraState);
    if (progress === 1) {
      this.direction = null;
      this.apertureEffect.clear();
    }
  }

  cancel() {
    this.direction = null;
    this.apertureEffect.clear();
  }

  get isActive() {
    return this.direction !== null;
  }

  private drawApertureEffect(progress: number, geometry: RecursiveTransitionGeometry, cameraState: CameraState) {
    this.apertureEffect.clear();
    if (progress <= 0 || progress >= 1) return;
    const active = Math.sin(progress * Math.PI);
    const ring = interpolateRect(geometry.target.container.rootBounds, geometry.target.aperture.rootBounds, Math.min(1, progress * 1.25));
    this.apertureEffect
      .roundRect(ring.x, ring.y, ring.width, ring.height, Math.max(2, 8 / cameraState.scale))
      .stroke({ color: 0xc5e5ff, width: Math.max(2, 5 / cameraState.scale), alpha: 0.3 + active * 0.7 });
  }
}

export function transitionProgressForDirection(direction: RecursiveTransitionDirection, progress: number) {
  const normalized = Math.max(0, Math.min(1, progress));
  return direction === "enter" ? normalized : 1 - normalized;
}

export function visibilityPreservingProgress(progress: number) {
  const normalized = Math.max(0, Math.min(1, progress));
  // The portal midpoint must still expose a real parent shell, not merely its
  // oversized floor. A cubic camera curve preserves that context while the
  // aperture/entity blend remains at the exact canonical progress.
  return normalized * normalized * normalized;
}

function getOuterCameraState(camera: Camera2D, geometry: RecursiveTransitionGeometry) {
  const target = geometry.target.outerWorld;
  return camera.getFitState(geometry.viewport, getWorldCameraBounds(target.rootBounds, target.depth), {
    margin: Math.max(44, Math.min(geometry.viewport.width, geometry.viewport.height) * 0.08),
    maxScale: 1.05,
  });
}

function getInnerCameraState(camera: Camera2D, geometry: RecursiveTransitionGeometry) {
  const target = geometry.target.innerWorld;
  return camera.getFitState(geometry.viewport, getWorldCameraBounds(target.rootBounds, target.depth), {
    margin: Math.max(26, Math.min(geometry.viewport.width, geometry.viewport.height) * 0.1),
    maxScale: 5.5,
  });
}

function interpolateCamera(from: CameraState, to: CameraState, progress: number): CameraState {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress), scale: lerp(from.scale, to.scale, progress) };
}

function interpolateRect(from: Rect2D, to: Rect2D, progress: number): Rect2D {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress), width: lerp(from.width, to.width, progress), height: lerp(from.height, to.height, progress) };
}
