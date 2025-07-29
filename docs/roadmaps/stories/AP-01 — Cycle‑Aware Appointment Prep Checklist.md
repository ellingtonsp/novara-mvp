# AP-01 — Cycle‑Aware Appointment Prep Checklist

*(Candidate for Sprint 2 — 2 SP)*

---

\## 1 Overview
After the first check‑in, users crave a tangible payoff that feels practical, not just “data captured.” We’ll surface a **personalized prep checklist** based on the user’s current IVF cycle stage (e.g., baseline scan, stimulation, retrieval, transfer). It lists actionable to‑dos, clinic questions, and comfort tips they can complete **before** their next appointment.

Deliverables

1. **Checklist card** displayed immediately after first insight (Control & Fast‑Lane users).
2. Auto‑generated checklist items keyed off `cycle_stage` answered in onboarding.
3. “Mark done” interaction + PostHog events to track engagement.
4. PDF / email export option (optional, flag‑gated).

---

\## 2 User Story

| **Role**                    | **Need**                                                                                    | **Benefit**                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Newly onboarded IVF patient | A concise list of what to prepare for my next clinic visit based on where I am in the cycle | Saves mental overhead, reduces anxiety, shows Novara’s practical value instantly |

---

\## 3 Acceptance Criteria *(Done = all true)*

1. Checklist renders right after the first insight card for **all users** (control + fast path). No extra taps required.
2. At least **3 checklist items** populate, drawn from `cycle_stage` mapping table (see §5.1).
3. User can mark items complete; progress persists in localStorage + server (`prepChecklist` column in Postgres JSONB).
4. Events:

   * `checklist_shown` `{ cycle_stage }`
   * `checklist_item_completed` `{ item_id }`
   * `checklist_completed` when all items done.
5. Completion UX: confetti + copy “Great prep! Tomorrow you’ll get an updated list.”
6. Unit tests verify correct items for each cycle stage and completion persistence.

---

\## 4 Success Metrics

| Metric                                            | Baseline | Target                        |
| ------------------------------------------------- | -------- | ----------------------------- |
| Users interacting with ≥1 checklist item on Day 0 | —        | **≥60 %**                     |
| D1 retention uplift among checklist users         | —        | **+5 ppt** vs non‑interactors |
| Self‑reported preparedness (week‑2 survey)        | 3.6 / 5  | **≥4.2 / 5**                  |

---

\## 5 Technical Approach
\### 5.1 Checklist Mapping Table *(excerpt)*

| `cycle_stage` | Items (id → copy)                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `baseline`    | `bs_ultrasound` → “Confirm ultrasound time with clinic”<br>`bs_docs` → “Upload insurance pre‑auth letter”<br>`bs_water` → “Hydrate: aim for 2 L water today”                         |
| `stimulation` | `stim_meds` → “Set phone alarm for tonight’s injection”<br>`stim_snacks` → “Prep post‑shot high‑protein snack”<br>`stim_questions` → “Write down 2 questions for nurse about dosage” |
| `retrieval`   | etc.                                                                                                                                                                                 |

\### 5.2 Frontend Component

* **ChecklistCard.tsx** shows items with checkbox + info tooltip.
* Progress bar (linear) at top.
* Export button behind feature flag `checklist_pdf_v1`.

\### 5.3 Backend storage

* Add `prep_checklist` JSONB column to `Users` table (`{ cycle_stage: 'stimulation', completed_ids: ['stim_meds'] }`).

\### 5.4 Analytics Integration

```ts
track('checklist_shown', { cycle_stage, environment });
track('checklist_item_completed', { item_id, environment });
if (allDone) track('checklist_completed', { cycle_stage, environment });
```

---

\## 6 Data & Privacy

* No new PII; checklist items contain generic guidance.
* Export PDF includes only first name and items; HIPAA safe.

---

\## 7 Testing Plan

| Test              | Tool                | Pass criteria                   |
| ----------------- | ------------------- | ------------------------------- |
| Unit item mapping | Jest                | Each stage returns ≥3 items     |
| UI interaction    | Cypress             | Checkmark persists after reload |
| Export            | Jest + PDF snapshot | Flagged variant downloads PDF   |

---

\## 8 Dependencies

| Dependency                         | Status                  |
| ---------------------------------- | ----------------------- |
| Cycle stage captured in onboarding | ✅                       |
| PDF export lib (`jspdf`)           | 🔄 Only if flag enabled |

---

\## 9 Risks & Mitigations

| Risk                                      | Mitigation                                                   |
| ----------------------------------------- | ------------------------------------------------------------ |
| Wrong stage chosen → irrelevant checklist | Include “Edit cycle stage” link next to checklist title.     |
| Low engagement                            | AB test alternative copy; surface checklist earlier in flow. |

---

\## 10 Definition of Done Checklist

* [ ] Mapping table validated by nurse review.
* [ ] Checklist card implemented + responsive styling.
* [ ] Events visible in PostHog.
* [ ] PDF export behind flag and QA‑approved.
* [ ] Docs `/docs/value-hooks/AP-01.md` committed.

---

> **Next:** After data shows ≥60 % interaction, consider adding dynamic reminders (GR‑02) linked to any unchecked items.
