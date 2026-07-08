import { Container, Graphics } from "pixi.js";
import type { Rect2D } from "../../projection/types";
import { getInteriorRect, getWorldMaterialMetrics } from "../materials";
import type { RenderPalette } from "../palette";

export interface WorldFramePrimitive {
  container: Container;
  contentLayer: Container;
  interiorRect: Rect2D;
}

export function createWorldFrame(rect: Rect2D, palette: RenderPalette, depth: number): WorldFramePrimitive {
  const container = new Container();
  container.label = `world-frame-depth-${depth}`;
  container.position.set(rect.x, rect.y);

  const frame = new Graphics();
  const contentLayer = new Container();
  const mask = new Graphics();

  const metrics = getWorldMaterialMetrics(rect);
  const inset = metrics.shellInset;
  const bevel = metrics.bevel;
  const interiorRect = getInteriorRect(rect, metrics);

  frame
    .roundRect(metrics.shadowOffset, metrics.shadowOffset * 1.15, rect.width, rect.height, metrics.shellRadius)
    .fill({ color: palette.shellShadow, alpha: 0.62 });
  frame.roundRect(0, 0, rect.width, rect.height, metrics.shellRadius).fill(palette.shell);
  frame
    .roundRect(inset, inset, rect.width - inset * 2, rect.height - inset * 2, metrics.trayRadius)
    .fill(palette.shellDark);
  frame
    .poly([
      inset + bevel,
      inset,
      rect.width - inset,
      inset,
      rect.width - inset - bevel,
      inset + bevel,
      inset + bevel,
      inset + bevel,
    ])
    .fill(palette.rim);
  frame
    .poly([
      rect.width - inset,
      inset,
      rect.width - inset,
      rect.height - inset,
      rect.width - inset - bevel,
      rect.height - inset - bevel,
      rect.width - inset - bevel,
      inset + bevel,
    ])
    .fill(palette.rimBright);
  frame
    .poly([
      inset,
      rect.height - inset,
      rect.width - inset,
      rect.height - inset,
      rect.width - inset - bevel,
      rect.height - inset - bevel,
      inset + bevel,
      rect.height - inset - bevel,
    ])
    .fill(palette.rimBright);
  frame
    .roundRect(interiorRect.x, interiorRect.y, interiorRect.width, interiorRect.height, metrics.interiorRadius)
    .fill(palette.interior);
  frame
    .roundRect(interiorRect.x, interiorRect.y, interiorRect.width, interiorRect.height * 0.38, metrics.interiorRadius)
    .fill({ color: palette.interiorShade, alpha: 0.2 });

  mask
    .roundRect(interiorRect.x, interiorRect.y, interiorRect.width, interiorRect.height, metrics.interiorRadius)
    .fill(0xffffff);
  mask.alpha = 0;
  contentLayer.mask = mask;

  container.addChild(frame, contentLayer, mask);

  return {
    container,
    contentLayer,
    interiorRect,
  };
}
