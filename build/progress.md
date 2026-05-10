# Build Progress: Kumon Iligan Ops

[2026-05-10 10:02:00] 🔒 Security gate passed: 0 vulnerabilities, secrets scan clean, defaults compliant
[2026-05-10 10:02:00] 🏷️ Tagged release v0.1.0, POC build (CSV import/export, dashboards, teacher reply flow, role-aware UI)
[2026-05-10 10:02:00] 🚀 Deployed v0.1.0, build 023ebef6, smoke test FAILED (NEXTAUTH_URL pointed to PLACEHOLDER domain)
[2026-05-10 10:02:00] 🔄 Rolled back: live service remained on previous revision
[2026-05-10 10:07:00] 🔧 Fixed: _APP_URL in cloudbuild.yaml corrected to https://kumon-iligan.symph.co
[2026-05-10 10:07:00] 🔧 Fixed: added apps/ to .gcloudignore (was uploading 633MB due to duplicate node_modules in apps/main/)
[2026-05-10 10:08:00] 🏷️ Tagged release v0.1.1, fix NEXTAUTH_URL placeholder and gcloudignore bloat
[2026-05-10 10:10:00] 🚀 Deployed v0.1.1, revision kumon-iligan-frontend-00011-brh, build dbad48c1
[2026-05-10 10:10:00] ✅ Smoke test passed, https://kumon-iligan.symph.co/login loads correctly, Google OAuth button present, no functional errors
[2026-05-10 10:16:00] 🔧 Refactor: restructure to apps/web/ + apps/api/ (matches symph-crm/SneakerDoc pattern); fixed all PLACEHOLDER URLs in cloudbuild configs
[2026-05-10 10:16:00] 🏷️ Tagged release v0.1.2
[2026-05-10 10:20:00] 🚀 Deployed v0.1.2, revision kumon-iligan-frontend-00012-fvq, build 3f5c627d
[2026-05-10 10:20:00] ✅ Smoke test passed, login page intact after restructure, no regressions
[2026-05-11 07:29:00] 🔒 Security gate passed: 0 vulnerabilities, secrets scan clean
[2026-05-11 07:29:00] 🏷️ Tagged release v0.1.3, payment detail page, mobile data-card layout, fix money double-scaling
[2026-05-11 07:30:00] 🚀 Deployed v0.1.3, revision kumon-iligan-frontend-00013-btp, build 780f456a
[2026-05-11 07:30:00] ✅ Smoke test passed, login page loads correctly, no regressions
