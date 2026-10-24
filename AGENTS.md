# Agent Instructions

## Git Workflow
- Do **NOT** run `git commit` or `git push`.
- The user will perform all commits and pushes to GitHub.
- Keep modifications in the working tree, build/test to verify correctness, and report changes back to the user for them to review, stage, commit, and push.

## Browser & Visual Verification
- Do **NOT** autonomously open the browser or spawn browser subagents to perform visual checks or capture UI screenshots unless explicitly requested by the user.
- The user will perform all visual checks directly in their own browser.
- Limit verification to build commands, test suites, linters, and code inspection.
