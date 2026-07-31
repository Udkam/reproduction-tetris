# Third-party font notices

TetraMorph packages all gameplay fonts locally. The application does not request a
font CDN at runtime.

## WenYuan Sans SC VF

- Source: <https://github.com/takushun-wu/WenYuanFonts>, release `v1.000`.
- License: SIL Open Font License 1.1; see
  [`licenses/fonts/WenYuanFonts-OFL.md`](licenses/fonts/WenYuanFonts-OFL.md).
- Local artifact: `src/assets/fonts/TetraMorphUISans-subset.otf`.
- Modification: the release OTF was subset to the glyphs used by the current
  application. Because the upstream license reserves the WenYuan family names, this
  derivative is renamed **TetraMorph UI Sans**.
- Source release SHA-256:
  `BD8BDF83222F23EA95475F86E4B57A1D289D5A7E0639C5EC10E5A108D96B2447`.
- Packaged subset SHA-256:
  `F1F9B4C35C41726765D61A300C0D63AEC6DA1B18F017472AE14C86391209233B`.

## Smiley Sans

- Source: <https://github.com/atelier-anchor/smiley-sans>, release `v2.0.1`.
- License: SIL Open Font License 1.1; see
  [`licenses/fonts/SmileySans-OFL.txt`](licenses/fonts/SmileySans-OFL.txt).
- Local artifact: the unmodified release file
  `src/assets/fonts/SmileySans-Oblique.woff2`.
- Source archive SHA-256:
  `299C0BE6C960AE37361762ECA76F7D0CD516615435BB96C0D4B98A1E70178A07`.
- Packaged file SHA-256:
  `731F22973349404B15A88A99EF3B5DD4104C0965C23B7E485C1F11E84FEA99E2`.

## Barlow Semi Condensed

- Package: `@fontsource/barlow-semi-condensed` `5.3.0`.
- Upstream: <https://github.com/jpt/barlow>.
- Packaged subsets: Latin normal weights 400, 500, 600, 700, and 800.
- License: SIL Open Font License 1.1; see
  [`licenses/fonts/BarlowSemiCondensed-OFL.txt`](licenses/fonts/BarlowSemiCondensed-OFL.txt).

## Fira Code Variable

- Package: `@fontsource-variable/fira-code` `5.3.0`.
- Upstream: <https://github.com/tonsky/FiraCode>.
- License: SIL Open Font License 1.1; see
  [`licenses/fonts/FiraCode-OFL.txt`](licenses/fonts/FiraCode-OFL.txt).

## Playwrite New Zealand Basic

- Package: `@fontsource/playwrite-nz-basic` `5.3.0`.
- Upstream: Google Fonts Playwrite project.
- License: SIL Open Font License 1.1; see
  [`licenses/fonts/PlaywriteNZBasic-OFL.txt`](licenses/fonts/PlaywriteNZBasic-OFL.txt).
