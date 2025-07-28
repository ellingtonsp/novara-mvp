# AP-01 Functional Logic — Checklist Generation & Persistence

## 1️⃣ High-Level Flow
```mermaid
graph TD;
  A[User completes first check-in] --> B[Insight card rendered];
  B --> C[ChecklistCard displayed];
  C --> D{User marks item complete};
  D -- yes --> E[Update local state];
  E --> F[Call POST /api/checklist/update];
  F --> G[Server updates JSONB + returns new progress];
  G --> H[Progress bar animates];
  H --> I{All items complete?};
  I -- yes --> J[track("checklist_completed") + confetti];
  I -- no --> D;
```

## 2️⃣ Generation Algorithm
1. Fetch user `cycle_stage` from AuthContext (already in JWT claim).
2. Lookup checklist mapping table (`mapping.ts`).
3. Select first **3 items** in defined order.
4. Hydrate `completed` flag using `prep_checklist.completed_ids` from API.
5. Return to `ChecklistCard` component.

## 3️⃣ Persistence Rules
| Scenario | Action |
|----------|--------|
| Offline user marks item complete | Persist to `localStorage` queue; retry sync every 30 s. |
| Conflict (client & server edits) | Last-write-wins (timestamp compare) + merge `completed_ids`. |
| Cycle stage change | Hard-reset checklist; new mapping; analytics `checklist_reset`. |

## 4️⃣ Edge Cases & Guardrails
* **Unknown cycle_stage** → default `baseline` list + banner prompting user to select stage.
* **Checklist already 100 % complete** on load → show success banner instead of card.
* **Item count < 3** for a stage → pad with generic prep tips (hydration, rest).
* **localStorage quota exceeded** → fallback to server-only persistence, show toast.

## 5️⃣ Analytics Contract
| Event | Trigger | Props |
|-------|---------|-------|
| `checklist_shown` | Card mounted | `cycle_stage`, `item_ids` |
| `checklist_item_completed` | Checkbox toggled | `item_id`, `cycle_stage`, `new_state` |
| `checklist_completed` | All items done | `cycle_stage`, `completion_time_ms` |
| `checklist_reset` | Stage change | `prev_stage`, `next_stage` |

## 6️⃣ Feature Flags
* `checklist_pdf_v1` → toggles `ChecklistExport` button.
* `checklist_confetti_v2` → A/B test heavier animation vs. subtle check-mark bounce.

## 7️⃣ Security & Privacy
* No PII stored; only cycle stage + generic tips.
* API auth via existing JWT middleware.
* Rate-limit update endpoint to 10 req/min/user.

## 8️⃣ Implementation Todos
- [ ] Create `mapping.ts` static table + tests
- [ ] Implement persistence adapter (`prepChecklistService.ts`)
- [ ] Integrate optimistic UI updates
- [ ] Add confetti using `react-confetti` (flagged)

---
> **Risks**: Unreliable cycle stage leads to irrelevant suggestions → CTA to edit stage mitigates. Performance overhead minimal (<2 KB JSON per user). 