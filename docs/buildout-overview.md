# Novara MVP – Comprehensive Buildout Overview (July 2025)

---

## 1. Product Vision & Mission
**Mission:** Accelerate fertility patients' access to accurate insights, compassionate support, and effective treatments by delivering high-quality software rapidly and safely.

**Vision:** To be the most trusted digital companion for fertility journeys, blending evidence-based insights with compassionate, personalized support.

---

## 2. Core Features

### Shipped (Production-Ready)
- **User Authentication & Onboarding:** Secure signup, JWT auth, profile creation, journey stage capture
- **Daily Check-in System:** Multi-mood selection, confidence tracking, concern dropdown, free-text notes, validation
- **Personalized Insight Engine v1:** 7-day trend analysis, confidence monitoring, recurring concern detection, streaks, emotional complexity, 9 insight types, smart selection algorithm
- **Engagement Analytics Infrastructure:** Action tracking (viewed, clicked, dismissed, refreshed, liked, saved), per-user engagement rates, API endpoints
- **Mobile-First Design:** Responsive, touch-optimized, accessible, brand-aligned UI

### In Progress
- **Advanced Insights & Analytics (Story 4):**
  - Weekly/monthly trend analysis
  - Cycle stage correlation
  - Cross-metric analysis
  - Engagement dashboard (KPI tracking, funnel analysis)
  - ML-based personalization, A/B testing

### Planned
- **Journey Timeline:** Visual progress, milestones, appointments
- **Smart Recommendations:** AI guidance, proactive alerts, content library
- **Community Connect:** Peer matching, expert Q&A, crisis support

---

## 3. Key User Journeys
- **Onboarding:** Signup → Profile setup → Journey stage selection → Dashboard
- **Daily Check-in:** Mood selection → Confidence sliders → Concerns/notes → Submit → Immediate personalized insight
- **Insight Engagement:** View insight → Take action (like, save, dismiss, refresh) → Analytics tracking
- **Progress Review:** View trends, streaks, and engagement analytics (in progress)

---

## 4. Technical Architecture (High-Level)
- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS, Shadcn/ui, PWA support, custom theming
- **Backend:** Node.js + Express, JWT auth, Airtable integration, CORS, health monitoring
- **Data:** Airtable (Users, DailyCheckins, InsightEngagement), SQLite (local dev)
- **DevOps:** Cursor IDE, GitHub, Railway (backend), Vercel (frontend), automated scripts, comprehensive testing

---

## 5. Known Gaps & Opportunities
- **Check-in Messaging:** Needs more dynamic, personalized feedback (see recent feedback)
- **Sentiment Flexibility:** Free text field should support both positive and negative reflections
- **Analytics Dashboard:** In progress, needs user-facing visualizations
- **Community Features:** Not yet implemented
- **Content Library:** Planned for future proactive support

---

## 6. Recent Feedback & Iteration Areas
- **Check-in Messaging Improvements:**
  - High overall confidence scores (e.g., 10/10) now explicitly acknowledged in user feedback
  - Free text field is being updated to flexibly interpret both positive and negative sentiment, not just worries
  - Messaging logic is being enhanced for more personalized, validating responses
- **User-Centered Iteration:** Ongoing feedback loop with real users to refine tone, content, and feature prioritization

---

## 7. Next Steps for User Story Development
- **Map user journeys for new features:** Journey Timeline, Smart Recommendations, Community Connect
- **Define acceptance criteria for advanced analytics and insight personalization**
- **Develop user stories for flexible check-in messaging and sentiment analysis**
- **Prioritize stories based on user impact and technical feasibility**
- **Document edge cases and validation criteria for all new features**

---

**This overview is structured for easy porting into external AI tools for user story and requirements development.** 