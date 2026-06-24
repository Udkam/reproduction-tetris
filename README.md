# Game-1 Reset Notice

This repository has been intentionally reset after the failed v8 reboot round.

There is no runnable game implementation on `main` right now. The current
`main` branch keeps only the minimum records needed to explain the failure,
preserve provenance, and support a clean future restart.

## Current Status

- Status: failed prototype, reset for reboot.
- Failed run: `v8-reboot-parabox-worldline-20260624-023038-2a151f`.
- Failed implementation branch: `reboot/parabox-worldline-v8-reboot-parabox-worldline-20260624-023038-2a151f`.
- Last pushed commit on failed branch before cleanup: `50b3d62`.
- Backup branch retained: `backup/pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`.
- Backup tag retained: `backup-pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`.

## What Was Removed From Main

The local working tree on `main` was wiped except for `.git`, then this minimal
documentation set was recreated. Removed content includes the old application
source, server code, build output, dependencies, generated review drafts, and
implementation-stage reboot documents.

## Next Reboot Rule

Do not continue from the failed v8 implementation. A future reboot should start
from this documentation-only `main` state, create a fresh run id and branch, and
write new design and implementation records honestly from that point forward.
