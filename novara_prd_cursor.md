# 📄 Novara Core MVP – Product Requirements Document (PRD)

## 🧭 Overview
**Product:** Novara
**Goal:** Empower IVF patients (especially those TTC after loss) with emotionally intelligent reflections, insights, and lightweight tracking tools during treatment.
**Phase:** MVP Pilot
**Audience:** IVF patients in the U.S. and Canada, starting with Reddit and Facebook group communities

---

## 🎯 Objectives
1. **Emotional Value**: Deliver immediate and personalized insight to help users feel seen and supported
2. **Behavioral Engagement**: Foster lightweight daily tracking behavior without friction
3. **Clinical Support Utility**: Optionally provide weekly reflections (PHQ-4) for patients to share with providers
4. **Feedback Loops**: Collect sentiment and interaction data to inform product-market fit

---

## 🔍 Key Features

### 1. **User Onboarding Flow**
- 5-step onboarding survey capturing:
  - Emotional state
  - Confidence (meds, costs, overall)
  - Cycle stage
  - Primary concern
  - Consent checkbox
- Nickname + email captured for personalization
- POSTs to `POST /api/users`

### 2. **Daily Check-In**
- Minimal UI:
  - Mood emoji
  - Confidence slider (0-10)
  - Optional concern tags
  - Optional free-text
- Submits to `POST /api/checkins/daily`
- Triggers optional micro-insight based on content

### 3. **Micro-Insight Engine**
- JS-based rule engine for conditional content generation
- Uses flags:
  - Low confidence (<=4)
  - Matching concern tags
  - Primary need from onboarding
- Outputs a 1–2 sentence empathetic reflection
- Optional: pushes via MailerLite

### 4. **Weekly Reflection Survey**
- Sent after 7 days of onboarding
- Includes:
  - PHQ-4 questions (standardized)
  - Updated confidence scores
  - Optional open-text
- Data sent to `POST /api/checkins/weekly`
- Flagged scores may prompt clinical support suggestion

### 5. **Nudging & Retention**
- Inactive users (3+ days no check-in) flagged
- Triggers:
  - Friendly nudge email or push
  - “We’re here for you”–style re-engagement

### 6. **Pilot Dashboard (Internal Use)**
- Tracks:
  - Active users
  - Daily check-ins
  - Weekly survey completions
  - Common concerns
- Displays from Airtable via Glide or Notion

---

## 🏗️ Tech Stack
- **Frontend**: React + TypeScript (or Next.js)
- **Backend**: Node.js + Express (modularized)
- **Mobile**: React Native (Expo)
- **DB**: Airtable
- **Survey Tool**: Tally (connected via Zapier)
- **Email**: MailerLite + Zapier
- **Automation**: Zapier/Maker

---

## 📐 Design Principles
- **Warm, Grounded, Gentle UI**
- Daily friction < 30 seconds
- Clear separation of user data, logic, and insights
- Feature-based folder architecture (modular)

---

## 🚧 Known Risks
- Airtable scale limitations
- PHQ-4 must be clearly non-diagnostic
- Avoid overpromising therapeutic benefit
- GDPR/PHI boundaries need clarification for future expansion

---

## 🔄 Next Sprint Priorities
1. Finalize daily check-in logic + trigger micro-insight
2. Implement weekly reflection with PHQ-4
3. Hook up nudge system for silent users
4. Build dashboard for pilot analytics
5. Modularize backend services for long-term scale

---

## ✅ KPIs (Pilot Phase)
- 60% of users check in >3x in week 1
- 50% weekly reflection completion
- 25% re-engagement from nudge
- 30% submit feedback on insights

---

> This PRD is designed for direct import into Cursor and Claude workflows. Use feature-based prompts to build out each module.

