# Chore playbook (frontend)

Maintenance with no visible or behavioral change: refactor, dependency bump, config, tooling, docs, test cleanup.

1. Behavior and appearance must not change. Existing tests must pass unchanged; edit a test only when it references something you renamed or moved.
2. No new features and no bug fixes mixed in. Note anything you spot as a follow-up in the PR.
3. Dependencies: bump only what the task names, update the lockfile, and run the full verify set from `CLAUDE.md` afterwards. Mention any breaking-change notes you handled.
4. Keep the diff small and reviewable. If the task is too big for one PR, do the first coherent part and list the rest as follow-ups in the PR.
5. Keep `CLAUDE.md`, README and config consistent with the code. No secrets.
6. PR body: what was changed, why it is safe (what proves behavior is unchanged), and how to verify.
