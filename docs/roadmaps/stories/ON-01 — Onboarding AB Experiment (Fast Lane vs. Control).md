*(Sprint 1 — Priority 1, **4 SP**)*

---

## **1 Overview**

We’ll replace the speed-tap heuristic with a **feature-flag A/B test**:

- **Control (path=‘control’)** – existing 6-question onboarding.
- **Test (path=‘test’)** – 3-question *Fast Lane* onboarding. Remaining baseline questions appear **after first check-in** in a one-time *Baseline Panel* before the first insight.

Goal: raise onboarding completion ≥10 ppt without sacrificing Day-0 insight quality or baseline data integrity.

Deliverables

1. PostHog feature flag fast_onboarding_v1 (50 % rollout).
2. Fast Lane onboarding component + Baseline Panel modal.
3. Analytics events for path selection, onboarding completion, and baseline completion.

---

## **2 User Story**

| **Role** | **Need** | **Benefit** |
| --- | --- | --- |
| Time-pressed new user | Shorter initial onboarding and ability to finish details later | Less friction now, trust-building interaction later |

---

## **3 Acceptance Criteria**

## **(Done = all true)**

1. **Flag logic**: 50 % of new sessions where isFeatureEnabled('fast_onboarding_v1') === true see Fast Lane; others see control.
2. Fast Lane shows only three required fields: email, cycle_stage, primary_concern.
3. After first successful check-in, Fast-Lane users must complete *Baseline Panel* (remaining 3 questions) **before** the first insight renders.
4. Events fired:
    - onboarding_path_selected { path: 'control' | 'test' }
    - onboarding_completed { path, completion_ms }
    - baseline_completed *(only test path)* { completion_ms }
5. Insight personalization uses full baseline data (either from control path or post-panel) — no placeholder insights.
6. PostHog funnel shows ≥10 ppt lift in onboarding_completed for test path after 200 sign-ups (one-sided 90 % CI).
7. Unit + E2E tests cover path split, modal gating, and fallback.

---

## **4 Success Metrics**

| **Metric** | **Baseline** | **Target** |
| --- | --- | --- |
| Onboarding completion (control) | 72 % | — |
| Onboarding completion (test) | — | **≥82 %** |
| Baseline completion rate (test) | — | **≥90 %** |
| D1 retention uplift (test) | — | **+5 ppt** vs control |

---

## **5 Technical Approach**

### **5.1 Feature Flag**

```
const isFastLane = posthog.isFeatureEnabled('fast_onboarding_v1');
track('onboarding_path_selected', { path: isFastLane ? 'test' : 'control', environment });
```

### **5.2 Fast Lane Component**

- File: OnboardingFast.tsx (reuse styles). Fields as table above.

### **5.3 Baseline Panel Modal**

- Trigger inside submitCheckin() if path==='test' && !user.baselineCompleted.
- Block insight rendering until baseline_completed.

### **5.4 Routing Diagram**

```
Signup → isFastLane? → [Fast Lane] → Check-in   ┐
                                          ├── Baseline Panel → Insight
Signup → Control   → [Full Onboarding]     ┘
```

### **5.5 Analytics**

```
track('baseline_completed', { completion_ms, environment });
```

---

## **6 Data & Privacy**

- No new PII; baseline questions identical to control.
- Fast-Lane users’ partial baseline stored in session until modal completion to avoid orphan records.

---

## **7 Testing Plan**

| **Test** | **Tool** | **Pass Criteria** |
| --- | --- | --- |
| Flag split | Jest | 50±5 % distribution across 1000 sessions |
| Fast path flow | Cypress | Baseline Panel blocks insight until completed |
| Control unaffected | Cypress | No modal shown; insight after onboarding |

---

## **8 Dependencies**

| **Dependency** | **Status** |
| --- | --- |
| PostHog feature flags | ✅ (Config UI) |
| CM-01 & AN-01 events | ✅ |

---

## **9 Risks & Mitigations**

| **Risk** | **Mitigation** |
| --- | --- |
| Users abandon at Baseline Panel | Keep panel <3 fields; friendly copy; progress bar |
| Flag mis-rollout skews data | Limit to staging first; monitor distribution analytics |

---

## **10 Definition of Done Checklist**

- Feature flag created and 50 % rollout staged.
- Fast Lane & Baseline Panel merged to main.
- Events visible in PostHog.
- Funnel uplift checked after 200 sign-ups.
- Docs /docs/onboarding/ON-01.md updated.

---

> Next:
>