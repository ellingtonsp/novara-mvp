*(Sprint 1 — Priority 1, 5 SP)*

---

## **1 Overview**

Implement foundational product-analytics instrumentation so Product & Growth teams can see **activation, retention, and feature usage funnels** in PostHog.  Four core events must fire from both web (React/TypeScript PWA) and mobile wrapper contexts.

---

## **2 User Story**

> As a **Product Manager**
> 
> I want **event tracking for signup, check-in submitted, insight viewed, and share action**
> 
> so that **I can analyse activation & retention funnels and make data-driven roadmap decisions.**

---

## **3 Acceptance Criteria**

## **(Done = all true)**

1. **Events fire** in <200 ms of action with zero UX lag.
2. **Payload schema** exactly matches the table in §5, including property names & types.
3. **Events appear in PostHog** within 30 s (99th percentile) and are correctly attributed to the active user_id.
4. **Backfill script** adds *“signup”* for existing pilot users (≤250 records).
5. **Dashboard** *Activation & Retention* shows D1/D7/D30 funnels using these events.
6. **Unit tests** cover success + failure paths for all four events (≥90 % branch).
7. **Pen-test** confirms no PII leakage outside encrypted channel (TLS 1.3).

---

## **4 Business Value & Success Metrics**

| **Metric** | **Baseline** | **Target after Sprint 1** |
| --- | --- | --- |
| Funnels available | None | 100 % events present ✔︎ |
| Instrumentation lag | — | <30 s end-to-end |
| Event loss rate | — | <0.5 % per day |

---

## **5 Event Taxonomy**

| **Event Name** | **Trigger** | **Required Props** | **Optional Props** | **Example** |
| --- | --- | --- | --- | --- |
| **signup** | Account created | user_id, signup_method | referrer, experiment_variants | {"user_id": "u_123", "signup_method": "email"} |
| **checkin_submitted** | User taps *Submit* on daily check-in | user_id, mood_score, symptom_flags[] | cycle_day, time_to_complete_ms | {"mood_score": 7, "cycle_day": 14} |
| **insight_viewed** | Insight card becomes ≥50 % visible | user_id, insight_id, insight_type | dwell_ms, cta_clicked | {"insight_id": "i_456", "insight_type": "stress_tip"} |
| **share_action** | Share button pressed anywhere | user_id, share_surface, destination | content_id | {"share_surface": "insight", "destination": "whatsapp"} |

---

## **6 Technical Implementation**

### **6.1 Frontend (React / TypeScript)**

```
import posthog from 'posthog-js';

function track(event: string, payload: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    posthog.capture(event, payload);
  } else {
    console.debug('PH-DEV', event, payload);
  }
}
```

- **Signup**: call in authService.createUser() success callback.
- **Check-in**: call inside submitCheckin() after DB write OK.
- **Insight viewed**: use IntersectionObserver (50 % threshold).
- **Share**: wrap existing navigator.share / link handler.

### **6.2 Backend (Node/Express)**

- For server-generated shares (e.g., email links), emit share_action via PostHog server-side client.
- Store event_id + timestamp in Postgres for debugging (optional).

### **6.3 Configuration**

| **Item** | **Value** |
| --- | --- |
| PostHog Project | novara-prod |
| API Key (env) | POSTHOG_API_KEY |
| Host | https://app.posthog.com |
| Cookie Domain | .novara.health |

---

## **7 Data Privacy & Compliance**

- No PH capture of names, emails, phone numbers.
- Use user_id (UUID) only.
- Ensure PH EU Data Residency flag disabled (HQ in US).
- Link event docs in HIPAA audit folder.

---

## **8 Dashboard Spec**

Create PostHog dashboard **“Activation & Retention”** with:

1. **Funnel:** signup → checkin_submitted (first) → insight_viewed.
2. **Retention:** People who performed signup and returned with checkin_submitted across D1/D7/D30.
3. **Breakdown filters:** signup_method, referrer.
    
    Share readonly link in #product-analytics Slack channel.
    

---

## **9 Testing Plan**

- **Unit:** Jest + React Testing Library mocks posthog.capture.
- **E2E:** Cypress script creates user, submits check-in, verifies events via PostHog API.
- **Load:** Simulate 500 events/min for 10 min; loss rate <0.5 %.

---

## **10 Dependencies**

| **Dep** | **Status** |
| --- | --- |
| PostHog prod project & keys | ✅ Created 2025-07-23 |
| ENV vars in Railway & Vercel | ⏳ Add before deploy |
| IntersectionObserver polyfill ≤ iOS 12 | 🔄 Install if mobile wrapper metrics require |

---

## **11 Risks & Mitigations**

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
| --- | --- | --- | --- |
| Event spam from dev/stage | Medium | Skews metrics | Filter by env property; block non-prod keys |
| PH JS adds 30 KB | Low | Slight CLS | Load via async defer; bundle-analyse |

---

## **12 Definition of Done Checklist**

- Code merged to main with unit tests ≥90 %.
- Env vars present in all prod environments.
- PostHog dashboard link shared.
- QA sign-off in Linear ticket.
- Docs in /docs/analytics/AN-01.md.

---

## **13 Stakeholders**

| **Role** | **Name** | **Responsibility** |
| --- | --- | --- |
| Product | Stephen (PO) | Approves metrics & AC |
| Engineering | Lynn (Lead Dev) | Implements & tests |
| Data | Javier | Validates event schema & dashboard |
| Compliance | Julie | Signs off HIPAA log entry |

---

> Next: After release, watch the D1 funnel for ≥50 % completion within first week. Use findings to reprioritize Sprint 2 churn-risk stories.