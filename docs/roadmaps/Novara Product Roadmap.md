# Novara Product Roadmap

## 🌱 Sprint 1 — "Instrument & Retain" (2 weeks, ≈22 SP)

| Epic | ID | Story (Status) | SP |
|---|----|----|----|
| **E1 Advanced Analytics** | **AN-01** | ✅ Event tracking for signup, check-in, insight view & share → PostHog funnels | 5 |
| **E2 Insight Polish** | **CM-01** | ✅ Positive-reflection NLP so good-day check-ins feel recognised | 3 |
|  | **ON-01** | ✅ Onboarding AB Experiment (Fast Lane vs. Control) - Core framework deployed | 3 |
|  | **AP-01** | ⬜ Cycle-Aware Appointment Prep Checklist - personalized prep based on cycle stage | 2 |
|  | **VP-01** | ⬜ ROI banner: "5× check-ins → 15 % ↑ med-adherence" under logo | 2 |
| **E3 Growth Loops** | **GR-01** | 🟡 Welcome micro-insight email within 10 min of signup | 2 |
|  | **ON-02** | ⬜ Delay push-permission prompt until after first insight | 2 |
| **E4 Compliance Hardening** | **CO-01** | 🟡 Encrypt all PII at rest (Postgres AES-256) + key-rotation doc | 5 |

**Sprint Goal:** Prove we can measure activation, delight early adopters with practical value, and answer HIPAA questions.

## ✅ Completed Features (Not Originally in Roadmap)

| Epic | ID | Story (Status) | SP |
|---|----|----|----|
| **E2 Insight Polish** | **AI-01** | ✅ Actionable Insights - AI-powered health pattern analysis | 5 |
| **E1 Advanced Analytics** | **UM-01** | ✅ User Metrics Dashboard - Visual health trends and patterns | 3 |
| **E5 User Research** | **UP-01** | ✅ User Persona Testing - Framework for persona validation | 2 |

**Note:** These features were implemented outside the original roadmap but add significant value to the product.

## Success Metrics (Quarterly)
- **Lead Time** < 2 weeks (idea → prod)
- **Defect Rate** < 5 % deployments needing hot-fixes
- **MTTD** < 30 min
- **MTTR** < 2 h

## Release Themes
1. **Measure Everything** – Instrument first, guess never
2. **Delight Early** – Short onboarding, human-feeling insights
3. **Keep Them Coming Back** – Timely nudges, streak mechanics, churn rescue
4. **Earn Trust** – HIPAA-ready storage and transparent data messaging

## Development Guidelines
- **ALWAYS map work** to an Epic/Story ID from this roadmap
- **PRIORITIZE current sprint stories** over future work/ice-box
- **VALIDATE** against sprint goals **before** implementing features
- **MEASURE impact** using the success metrics above
- **DOCUMENT epic/story context** in feature PRs and docs

## Roadmap Rule
> If a proposed feature doesn't boost **activation, retention, or compliance**, it parks in Icebox.

---

## 🚀 Sprint 2 Preview — "Predict & Personalize" (2 weeks, ≈20 SP)
- **AN-02** Nightly churn-risk flag (AUC ≥ 0.70) — 5 SP
- **AN-03** Weekly mood-trajectory card with sparkline — 3 SP
- **CM-02** Dynamic message templates by tone (A/B testable) — 3 SP
- **TM-01** Sentiment-aware copy variants (last two check-ins) — 3 SP
- **GR-02** Time-windowed daily nudge (push/email) — 3 SP
- **GR-03** Streak badges at 3 / 7 / 14 days — 2 SP
- **RE-01** Fast-lane single-tap check-in email for at-risk users — 3 SP
- **CO-02** Migrate from Airtable → managed Postgres (≤ 200 ms, zero-loss) — 8 SP

---

## Emerging Themes from Iteration (July 2025)
1. **Developer Productivity & Stability** — Non-hanging scripts, Cursor Rules automation, port-conflict mitigation.
2. **Observability by Default** — Health checks, structured logging, performance monitoring surfaced early regressions (e.g., missing **compression**, undefined **performanceMonitoring**).
3. **Security & Data Governance** — PII encryption, environment isolation, secret-management policies.
4. **Roadmap-Driven AI Alignment** — Cursor Rules now encode sprint priorities, ensuring tasks map to Epics/Stories.
5. **Technical Debt Reduction** — Schema migrations, local SQLite reliability, removal of flaky dependencies.
6. **A/B Testing Infrastructure** — ON-01 A/B test framework successfully deployed with deterministic 50/50 split and regression fixes applied.
7. **Practical Value Focus** — AP-01 introduces tangible, actionable value immediately after first check-in to reduce user anxiety and demonstrate practical utility.

---

## Continuous Update
- Reference `docs/roadmaps/Novara Product Roadmap.md` **every time** work is planned or reviewed.
- After each noteworthy iteration (feature completion, major bug-fix, sprint end), update **both**:
  1. This rule file (`roadmap.mdc`) – statuses, sprint context, emerging themes.
  2. The canonical roadmap markdown – tables, goals, themes.
- Use status badges: ✅ complete, 🟡 in-progress, ⬜ pending.
- Refresh release/emerging themes whenever new patterns arise.