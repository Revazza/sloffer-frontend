# Bug playbook (frontend)

Something looks or behaves wrongly. Fix the cause, not the symptom.

1. Reproduce first: write a failing test that shows the bug (component or hook test). If you cannot reproduce it from the task and the code, fail with a comment saying what you tried. Do not guess a fix.
2. Find the root cause and say it in one sentence (it goes in the PR). If the cause is in the backend (wrong or missing data), do not work around it in the UI: fail with a comment describing the backend problem.
3. Make the smallest change that fixes it. No refactors, restyling or unrelated cleanups.
4. The new test must pass now and must have failed before the fix. Keep it as the regression test.
5. PR body: symptom, root cause, fix, regression test. List other problems you noticed as follow-ups; do not fix them here.
