# ON-01: Dynamic Onboarding Length (Speed‑Tap Detection)

## Overview

Pilot testing shows a subset of users race through onboarding and abandon when faced with multiple sliders and questions. This story introduces a **speed-tap detector** that shortens onboarding to a 3-field "fast lane" when users tap through >3 inputs in under 10 seconds.

**Goal**: Uplift completion rate among time-sensitive users without harming those who prefer the full flow.

## Epic Context
- **Epic**: E2 Insight Polish
- **Sprint**: Sprint 1 "Instrument & Retain" 
- **Story Points**: 3
- **Status**: 🟡 In Progress

## Success Metrics
| **Metric** | **Baseline** | **Target** |
| --- | --- | --- |
| Overall onboarding completion | 72% | **≥80%** |
| Completion for fast-path cohort | 60% | **≥70%** |
| Avg onboarding time (fast users) | 45s | **≤30s** |

## User Story
| **Role** | **Need** | **Benefit** |
| --- | --- | --- |
| Speed-tapper (Alex archetype) | Skip lengthy onboarding questions when they're in a hurry | Less friction → higher completion and first check-in |

## Acceptance Criteria
1. **Detection rule**: if user performs ≥3 taps/inputs in any 10-second rolling window *before* reaching screen 3, flag as fast_onboard = true
2. When flagged, app **immediately navigates** to abbreviated flow (3 required fields). Total time-to-completion ≤30s median
3. Standard users see no change; full flow unaffected
4. Events fired:
   - onboarding_path_selected { path: 'fast' | 'standard' }
   - onboarding_completed { path, completion_ms }
5. Fast-path users show ≥10% improvement in onboarding completion vs. baseline within 1-week A/B
6. Unit tests cover boundary cases (e.g., 3 taps in 9.9s = fast; 3 taps in 10.1s = standard)
7. No Core Web Vitals regressions (LCP, CLS unchanged ±5%)

## Technical Approach

### Speed-Tap Detection Heuristic
```typescript
let tapTimes: number[] = [];
function recordTap() {
  tapTimes.push(Date.now());
  tapTimes = tapTimes.filter(t => Date.now() - t <= 10000);
  if (tapTimes.length >= 3 && currentStep < 3) {
    triggerFastPath();
  }
}
```

### Fast Path UI
- Render as separate **FastOnboarding.tsx** component
- Fields: email, cycle_stage (select), primary_concern (select)
- Display copy: "Short on time? No problem—just give us the basics."
- After submit ➜ proceed to **Welcome** screen (same as standard flow)

### Routing Logic
| **Condition** | **Route** |
| --- | --- |
| fast_onboard === true | /onboard/fast |
| else | /onboard/standard |

## Dependencies
- ✅ track() util from AN-01
- ✅ Route guards in React Router

## Risks & Mitigations
| **Risk** | **Likelihood** | **Mitigation** |
| --- | --- | --- |
| False positives (power users tapping slowly) | Low | Require >3 taps within <8-10s; tweak window after data review |
| Confusion switching flows mid-stream | Medium | Show transitional toast: "We've streamlined these last questions." |

## Definition of Done
- [ ] Heuristic implemented and unit-tested
- [ ] FastOnboarding UI styling complete
- [ ] Analytics events visible in PostHog
- [ ] A/B flag enabled to measure uplift
- [ ] Docs in /docs/onboarding/ON-01.md

## Related Files
- [User Journey](./user-journey.md)
- [API Endpoints](./api-endpoints.md)
- [Database Schema](./database-schema.md)
- [Deployment Notes](./deployment-notes.md)
- [Functional Logic](./functional-logic.md) 