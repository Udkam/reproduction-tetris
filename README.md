# Signal Foundry

An original, polished falling-block puzzle study built with React, TypeScript,
Vite, and PixiJS. The project reproduces the familiar strategic rules of the
genre while using original presentation, audio, naming, and interface design.

```bash
npm.cmd install
npm.cmd run dev
```

## Controls

- Move: `Left` / `Right` or `A` / `D`
- Soft drop: `Down` or `S`
- Hard drop: `Space`
- Rotate clockwise: `Up`, `X`, or `W`
- Rotate counter-clockwise: `Z`
- Hold: `C` or `Shift`
- Pause: `P` or `Escape`
- Restart: `R`

Portrait and landscape touch controls are provided automatically on compact viewports. Audio, reduced motion, and high-contrast rendering can be changed from the interface.

Quality gates:

```bash
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Browser evidence and hashed screenshots are recorded in
`docs/qa/tetris-browser-evidence.json` and `docs/screenshots/tetris/`.

The endless-runner study and recursive-puzzle archive live in the separate
`reproduction-temple-run` and `reproduction-patricks-parabox` repositories.
