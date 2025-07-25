# Automated UX Feedback Loop – Persona Scenarios (July 2025)

> **Purpose:** Provide detailed, step-by-step usage scenarios for two key personas (Alex “One-and-Done” and Emily “Hopeful Planner”). These scripts are formatted for easy ingestion by external AI tools for further user-story development, sentiment analysis, or automated testing.

---

## Table of Contents
1. [Scenario 1 – Alex “One-and-Done”](#scenario-1--alex-one-and-done)
2. [Scenario 2 – Emily “Hopeful Planner”](#scenario-2--emily-hopeful-planner)
3. [Cross-Persona Insights](#cross-persona-insights)

---

## Scenario 1 – Alex “One-and-Done”

| Attribute | Detail |
|-----------|--------|
| **Goal** | Fast answers, minimal extra work |
| **Behavior Pattern** | Signs up, skims onboarding, logs one check-in, disappears |
| **Drop-off Risk** | High – no activity within first 48 h + onboarding email unopened |
| **Rescue Opportunity** | Same-day “fast-lane” nudge + concrete IVF success metric |

### Script – Day 0 (Signup & First Check-in)
| Step | Alex Action | System Response | Potential Friction | Alex’s Likely Reaction |
|------|-------------|-----------------|-------------------|-----------------------|
| 0.1 | Searches App Store ➜ Finds Novara link | Landing page loads <200 ms | None | ✨ Positive – fast load |
| 0.2 | Taps **“Get Started”** | Sign-up form (email + pw) | Form has 6 fields (looks long) | 😒 Mild friction – extra fields |
| 0.3 | Uses Gmail auto-fill | Instant field completion | None | ✅ Satisfied |
| 0.4 | Skips optional profile pic | Allowed | None | ✅ |
| 0.5 | Hits **“Continue”** | JWT issued ➜ Redirect to onboarding survey | Survey shows 5 sliders (meds/costs/overall etc.) | 🤔 “Another survey?” |
| 0.6 | Skips through sliders quickly (defaults mid) | Validation requires min selection | Minor extra taps | 😤 Annoyed by forced input |
| 0.7 | **Submits** | Dashboard ➜ Daily Check-in modal auto-opens | Good | 🙂 |
| 0.8 | Selects mood: *Anxious* | Immediate UI feedback | None | 👍 |
| 0.9 | Confidence slider overall → **4/10** | Real-time number shows | None | 👍 |
| 0.10 | Leaves free-text blank | Allowed | None | 🙂 |
| 0.11 | **Submit Check-in** | Personalized insight card appears (“We’re here to help…”) | Text heavy; no concrete IVF metric | 😐 Meh value perception |
| 0.12 | Push permission request appears | iOS prompt | Requests too soon | 🙅 Denies – push fatigue |

### Script – Day 1-2 (Drop-off Window)
| Time | Trigger | System Action | Potential Friction | Alex’s Likely Reaction |
|------|---------|--------------|-------------------|-----------------------|
| 24 h | Inactivity rule | Sends “Fast-lane 30-sec check-in” email | Email buried in Promotions | 📬 Unopened |
| 36 h | Insight engagement rule | In-app push “5× check-ins → 15 % higher med adherence” | No push permission | 🚫 Not delivered |
| 48 h | Churn signal | Flag user as “At-risk” | None | ‑ |

### Subjective Utility Analysis (Alex)
- **Perceived Value:** Low – didn’t see direct clinic-level benefit
- **Primary Friction:** Early push request, mandatory sliders, lack of ROI metric
- **Opportunity:** Condense onboarding, delay push permission until value proof, showcase IVF success stats prominently

---

## Scenario 2 – Emily “Hopeful Planner”

| Attribute | Detail |
|-----------|--------|
| **Goal** | Give herself best chance at healthy pregnancy |
| **Motivators** | Rapid, personal insights that feel human |
| **Preferred Tone** | Warm, candid, lightly humorous |
| **Success Metric** | 14 check-ins in 21 days + lower anxiety |

### Script – Day 0 (Signup & First Check-in)
| Step | Emily Action | System Response | Potential Friction | Emily’s Likely Reaction |
|------|--------------|-----------------|-------------------|-------------------------|
| 0.1 | Clicks ad in IVF support forum | Landing page loads <200 ms | None | 🙂 |
| 0.2 | Reads “Evidence-based insights” copy | High trust | None | 💜 Feels understood |
| 0.3 | Completes sign-up form | Smooth | None | ✅ |
| 0.4 | Onboarding survey – carefully sets sliders | Real-time color gradient | None | 🟣 Feels engaging |
| 0.5 | **Submits** | Dashboard ➜ Check-in modal | Good | 🙂 |
| 0.6 | Selects moods: *Hopeful, anxious* | Multi-select works | None | 👍 |
| 0.7 | Confidence slider overall → **7/10** | Shows number | None | 👍 |
| 0.8 | Free-text note: “Feeling nervous about meds schedule.” | Accepted | None | ✅ |
| 0.9 | **Submit** | Insight card: acknowledges mixed emotions, references meds confidence (3/10), overall confidence (7/10) | Tone warm, actionable coping tip | 🥰 High satisfaction |

### Script – Day 1-7 (Engagement Loop)
| Day | Trigger | System Action | Potential Friction | Emily’s Likely Reaction |
|-----|---------|--------------|-------------------|-------------------------|
| 1 | Daily 8 am push | Reminder uses friendly tone | None | 😊 Opens and completes check-in |
| 3 | Detected downward confidence trend | Sends supportive insight w/ coping tactic | None | 💜 Feels cared for |
| 5 | 5-day streak | Celebratory badge 🎉 | None | 🌟 Shares screenshot |
| 7 | Weekly summary email | Trend snapshot + small win highlight | None | 📝 Saves PDF for partner |

### Subjective Utility Analysis (Emily)
- **Perceived Value:** High – actionable insights, supportive tone, clear progress indicators
- **Primary Friction:** None significant; may desire deeper medical integration later
- **Opportunity:** Offer expert nurse Q&A after week-3 survey, surface community stories

---

## Cross-Persona Insights
| Theme | Finding | Recommendation |
|-------|---------|----------------|
| Onboarding Length | Long surveys deter “fast answers” personas | Implement dynamic, persona-based onboarding (short vs detailed) |
| Value Proof Timing | Immediate ROI signals increase retention | Show concrete success metrics by second screen |
| Push Notification Timing | Early push request = friction for Alex | Delay permission prompt until value moment |
| Sentiment-Aware Messaging | Emily responds well to emotionally nuanced feedback | Expand sentiment analysis to tailor tone per check-in |

---

**End of Automated UX Feedback Loop** 