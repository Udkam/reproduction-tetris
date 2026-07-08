import type { Rect2D } from "../../projection/types";

export interface WorldMaterialMetrics {
  shadowOffset: number;
  shellRadius: number;
  trayRadius: number;
  shellInset: number;
  bevel: number;
  interiorRadius: number;
}

export function getWorldMaterialMetrics(rect: Rect2D): WorldMaterialMetrics {
  const shortSide = Math.min(rect.width, rect.height);

  return {
    shadowOffset: shortSide * 0.018,
    shellRadius: shortSide * 0.012,
    trayRadius: shortSide * 0.035,
    shellInset: shortSide * 0.12,
    bevel: shortSide * 0.045,
    interiorRadius: shortSide * 0.008,
  };
}

export function getInteriorRect(rect: Rect2D, metrics: WorldMaterialMetrics): Rect2D {
  const inset = metrics.shellInset + metrics.bevel;

  return {
    x: inset,
    y: inset,
    width: Math.max(1, rect.width - inset * 2),
    height: Math.max(1, rect.height - inset * 2),
  };
}
