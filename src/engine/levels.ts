// The level catalog. Each level introduces one new mechanic; the finale combines
// them. Layouts are validated by the solver in scripts/verify-levels.ts — `par`
// values are the optimal move counts reported there.
//
// Legend (see level.ts): # wall · space floor · . goal · $ crate · @ player
//   ~ ice · ^ pit · R/G/B/Y colored crate · r/g/b/y colored goal
//   1..9 pressure plate · D/E/F gate (group 1/2/3)

import type { LevelDef } from './level.js';
import { parseLevel } from './level.js';

export const LEVEL_DEFS: LevelDef[] = [
  {
    id: 'l1',
    name: '起步',
    subtitle: 'First Steps',
    par: 10,
    intro: '把每个箱子推到目标点（○）。只能推，不能拉。走错了？随时撤销或重开。',
    map: [
      '########',
      '#      #',
      '# @$ . #',
      '#      #',
      '# $  . #',
      '#      #',
      '########',
    ],
  },
  {
    id: 'l2',
    name: '薄冰',
    subtitle: 'Thin Ice',
    par: 14,
    intro: '箱子很沉，推上冰面（▒）会一直滑到撞墙才停。你穿着防滑靴，不受冰影响。',
    map: [
      '#########',
      '#.     .#',
      '#~~~~~~~#',
      '#~~~~~~~#',
      '#~~~~~~~#',
      '#  $ $  #',
      '#   @   #',
      '#########',
    ],
  },
  {
    id: 'l3',
    name: '深坑',
    subtitle: 'The Gap',
    par: 32,
    intro: '深坑（▦）你过不去，但把箱子推进坑里能将它填平。箱子是稀缺资源——省着用。',
    map: [
      '############',
      '#          #',
      '#@$ $ $^^ .#',
      '#          #',
      '############',
    ],
  },
  {
    id: 'l4',
    name: '机关',
    subtitle: 'Mechanism',
    par: 11,
    intro: '压力板（◇）被重物压住时，对应的闸门（▤）开启。你只有一个身位——停一个箱子顶门。',
    map: [
      '#########',
      '#   1   #',
      '#@$ $ D.#',
      '#       #',
      '#########',
    ],
  },
  {
    id: 'l5',
    name: '色彩',
    subtitle: 'Hues',
    par: 41,
    intro: '彩色箱子必须送到同色的目标点。注意它们会互相挡道——先想好顺序。',
    map: [
      '#########',
      '#       #',
      '# R G B #',
      '#       #',
      '#   @   #',
      '#       #',
      '# b g r #',
      '#       #',
      '#########',
    ],
  },
  {
    id: 'l6',
    name: '合流',
    subtitle: 'Confluence',
    par: 26,
    intro: '终章：颜色、闸门、深坑齐至。资源恰好够用，每一步都要算清。',
    map: [
      '#########',
      '#  1    #',
      '# R$ D r#',
      '#@      #',
      '# B  ^ b#',
      '#  $    #',
      '#       #',
      '#########',
    ],
  },
];

export const LEVELS = LEVEL_DEFS.map(parseLevel);

export function getLevel(id: string) {
  return LEVELS.find((l) => l.id === id);
}
