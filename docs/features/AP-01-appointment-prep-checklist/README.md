# AP-01 — Cycle-Aware Appointment Prep Checklist

**Status:** ⬜ Pending (Sprint 1)  
**Epic:** E2 Insight Polish  
**Story Points:** 2  
**Priority:** High (pulled ahead into Sprint 1)

## Overview

After the first check-in, users crave a tangible payoff that feels practical, not just "data captured." This feature surfaces a **personalized prep checklist** based on the user's current IVF cycle stage (e.g., baseline scan, stimulation, retrieval, transfer). It lists actionable to-dos, clinic questions, and comfort tips they can complete **before** their next appointment.

## User Journey

1. **User completes first daily check-in** → Receives AI insight
2. **Checklist card appears immediately** → Personalized based on `cycle_stage`
3. **User interacts with checklist items** → Mark complete, track progress
4. **Completion celebration** → Confetti + "Great prep! Tomorrow you'll get an updated list"
5. **Progress persists** → localStorage + server storage for continuity

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Users interacting with ≥1 checklist item on Day 0 | — | **≥60%** |
| D1 retention uplift among checklist users | — | **+5 ppt** vs non-interactors |
| Self-reported preparedness (week-2 survey) | 3.6/5 | **≥4.2/5** |

## Technical Implementation

### Frontend Components
- `ChecklistCard.tsx` - Main checklist display with checkboxes
- `ChecklistProgress.tsx` - Linear progress bar
- `ChecklistExport.tsx` - PDF export (feature flagged)

### Backend Changes
- Add `prep_checklist` JSONB column to `Users` table
- API endpoint: `POST /api/checklist/update`
- Schema: `{ cycle_stage: 'stimulation', completed_ids: ['stim_meds'] }`

### Analytics Events
```typescript
track('checklist_shown', { cycle_stage, environment });
track('checklist_item_completed', { item_id, environment });
track('checklist_completed', { cycle_stage, environment });
```

## Cycle Stage Mapping

| `cycle_stage` | Items |
|---------------|-------|
| `baseline` | Ultrasound confirmation, insurance docs, hydration |
| `stimulation` | Medication alarms, protein snacks, nurse questions |
| `retrieval` | Comfort items, transportation, post-procedure prep |
| `transfer` | Bladder prep, comfort measures, post-transfer care |

## Dependencies
- ✅ Cycle stage captured in onboarding
- 🔄 PDF export library (`jspdf`) - feature flagged
- ⬜ Nurse review of checklist items

## Testing Plan
- Unit tests for cycle stage mapping
- Integration tests for persistence
- E2E tests for user interaction flow
- PDF export testing (feature flagged)

## Files Modified
- `frontend/src/components/ChecklistCard.tsx` (new)
- `frontend/src/components/ChecklistProgress.tsx` (new)
- `backend/database/migrations/add_prep_checklist.sql` (new)
- `backend/routes/checklist.js` (new)
- `frontend/src/lib/analytics.ts` (update)

## Definition of Done
- [ ] Mapping table validated by nurse review
- [ ] Checklist card implemented + responsive styling
- [ ] Events visible in PostHog
- [ ] PDF export behind flag and QA-approved
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Documentation complete 