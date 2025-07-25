# Novara Product Roadmap  
*(v2025-07-24)*

---

## 🌱 Sprint 1  —  “Instrument & Retain”  (2 weeks, ≈20 SP)

| Epic | ID | Story (Done = all true) | SP |
|------|----|-------------------------|----|
| **E1 Advanced Analytics** | **AN-01** | Event tracking for signup, check-in, insight view & share → PostHog funnels | 5 |
| **E2 Insight Polish** | **CM-01** | Positive-reflection NLP so good-day check-ins feel recognised | 3 |
| | **ON-01** | Auto-detect “speed-tapper” → switch to 3-field onboarding | 3 |
| | **VP-01** | ROI banner: “5× check-ins → 15 % ↑ med-adherence” under logo | 2 |
| **E3 Growth Loops** | **GR-01** | Welcome micro-insight email within 10 min of signup | 2 |
| | **ON-02** | Delay push-permission prompt until after first insight | 2 |
| **E4 Compliance Hardening** | **CO-01** | Encrypt all PII at rest (Postgres AES-256) + key-rotation doc | 5 |

**Sprint Goal:** Prove we can measure activation, delight early adopters, and answer HIPAA questions.

---

## 🚀 Sprint 2  —  “Predict & Personalize”  (2 weeks, ≈20 SP)

| Epic | ID | Story (Done = all true) | SP |
|------|----|-------------------------|----|
| **E1 Advanced Analytics** | **AN-02** | Nightly churn-risk flag (logistic model, AUC ≥ 0.70) | 5 |
| | **AN-03** | Weekly mood-trajectory card with sparkline & tooltip | 3 |
| **E2 Insight Polish** | **CM-02** | Dynamic message templates by tone (A/B testable) | 3 |
| | **TM-01** | Sentiment-aware copy variants chosen by last two check-ins | 3 |
| **E3 Growth Loops** | **GR-02** | Time-windowed daily nudge (push/email) | 3 |
| | **GR-03** | Streak badges at 3 / 7 / 14 days | 2 |
| | **RE-01** | Fast-lane single-tap check-in email for at-risk users | 3 |
| **E4 Compliance Hardening** | **CO-02** | Migrate from Airtable to managed Postgres (zero-loss, ≤200 ms) | 8 |

**Sprint Goal:** Predict churn, deepen personalization, and finish the data-platform move.

---

## 🔭 Later / Icebox

| Epic | ID | Story | Notes |
|------|----|-------|-------|
| **E4** | **VP-02** | HIPAA “Data encrypted, nurse-vetted” badge in onboarding | Only if trust surveys lag |
| **E3** | (Future) Referral codes & rewards | Dependent on D30 retention ≥ 30 % |
| **E1** | (Future) Insight impact A/B harness | After PostHog funnels prove stable |
| **Clinic Pilot** | (TBD) B2B dashboard for partner clinics | Requires compliance sign-off |

---

### Release Themes

1. **Measure Everything** – Instrument first, guess never.  
2. **Delight Early** – Short onboarding, insight that feels “human.”  
3. **Keep Them Coming Back** – Timely nudges, streak mechanics, churn rescue.  
4. **Earn Trust** – HIPAA-ready storage and transparent data messaging.  

> **Rule of Thumb:** If a proposed feature doesn’t boost activation, retention, or compliance, it parks in Icebox.