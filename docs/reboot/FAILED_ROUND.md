# Failed Round Record

Date: 2026-06-25

## Decision

The v8 reboot implementation is classified as failed by user decision. Work on
that implementation must stop. No further repair, visual polish, level tuning,
or UI iteration should continue on top of the failed v8 branch.

## Failed Run

- Run id: `v8-reboot-parabox-worldline-20260624-023038-2a151f`
- Failed branch: `reboot/parabox-worldline-v8-reboot-parabox-worldline-20260624-023038-2a151f`
- Last pushed failed-branch commit: `50b3d62`
- Repository remote: `https://github.com/Udkam/Game-1.git`

## Preserved Provenance

The following backup refs are intentionally retained unless the user asks to
remove them:

- Branch: `backup/pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`
- Tag: `backup-pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`

These refs preserve history for audit and rollback. They are not a continuation
base for the next implementation.

## Failure Reason

The user rejected the current round as not worth continuing. The correct next
move is not incremental patching. The repository should be reduced to records
only, then a future implementation should restart from a clean baseline.

Specific non-acceptance themes from the prior objective:

- Avoid continuing from a page-like homepage or dashboard structure.
- Avoid card-based chapter maps.
- Avoid ordinary wall-and-box sokoban level design.
- Avoid old character, drone, grid, and 2.5D visual language.
- Avoid claiming a vertical slice or full game is acceptable when the user has
  declared the result failed.

## Cleanup Performed

The `main` branch working tree was wiped except for `.git`, then only the
minimum documentation needed for handoff was recreated:

- `README.md`
- `codex.md`
- `docs/reboot/FAILED_ROUND.md`
- `docs/reboot/CURRENT_STATUS.md`

Removed from `main`:

- Old application code.
- Old server code.
- Build outputs.
- Dependency folders.
- Previous reboot implementation documents.
- Screenshots and generated review drafts from the failed run.

## Branch Cleanup Policy

Delete the failed remote reboot branch:

`origin/reboot/parabox-worldline-v8-reboot-parabox-worldline-20260624-023038-2a151f`

Do not delete backup refs unless the user explicitly asks for that separate
operation.

## Restart Rule

The next attempt must create a fresh run id and fresh branch. It should not copy
or continue implementation files from the failed v8 branch. Any future design or
build documents should clearly state that v8 was rejected and that the new work
starts from this documentation-only `main` baseline.
