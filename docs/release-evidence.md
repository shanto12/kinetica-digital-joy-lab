# KINETICA production evidence

Verification date: July 14, 2026 (Central Time)

Production: [kinetica-digital-joy-lab.netlify.app](https://kinetica-digital-joy-lab.netlify.app)

| Release requirement | Result | Evidence method |
| --- | --- | --- |
| Lint, typecheck, rendered-output tests, Sites build, and Netlify build | Pass | Local locked-dependency release suite |
| Production dependency audit | Pass — 0 vulnerabilities | `npm audit --omit=dev` |
| Netlify production deployment | Pass — production state `ready` | Netlify deploy API and HTTPS request |
| Desktop layout and controls | Pass — 28/28 controls exercised, no horizontal overflow, no undersized targets | Real Chrome profile |
| Mobile layout and controls | Pass — 24/24 controls exercised at 390 × 844, no horizontal overflow, no undersized targets | Real Chrome profile with mobile viewport override |
| Pointer, keyboard, and persisted preferences | Pass — drag, arrow-key movement, skip link, pause/reload/resume | Real Chrome profile |
| Interaction stress | Pass — 20/20 rapid actions registered; transient spark nodes settled cleanly | Real Chrome profile |
| Browser console | Pass — no application errors or warnings | Real Chrome profile; extension-origin warnings excluded |
| Production routes and static assets | Pass — root and social card 200, unknown route 404, all discovered assets 200 | Direct HTTPS requests |
| Security headers and CSP | Pass | Live production response headers |
| Sites mirror | Pass | Sites deployment status |
| Authentication, logout/login, and password-manager behavior | Not applicable — the experience has no accounts or credential fields | Product architecture review |
| Forms | Not applicable — the experience contains no submission forms | Rendered DOM review |
| External APIs, databases, background jobs, and runner workflows | Not applicable — the experience is self-contained; Netlify only serves the Next.js application | Product architecture and deployment review |

The mobile result uses the user’s real Chrome profile with a viewport override; it is not a physical-device claim. The production pass also verified reduced-motion-aware behavior, semantic landmarks, visible focus treatment, and a single logical heading hierarchy.
