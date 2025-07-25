# Scripts Directory Structure

This folder now groups automation scripts by responsibility to keep `package.json` and documentation concise.

| Sub-directory | Purpose |
|---------------|---------|
| `deploy/` | Deployment helpers (Vercel, Railway, validation wrappers) |
| `monitoring/` | Health-check, performance, and alerting scripts |
| `testing/` | One-off diagnostic or test harness scripts |
| `setup/` | One-time setup utilities (environment, hooks, branch protection) |

All original script paths remain **backwards-compatible** via lightweight stub wrappers that forward to the new location. Update references to the new paths when convenient." 