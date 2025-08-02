# Bug Testing - Test Users & Steps

## PHQ-4 Testing Users

### Primary PHQ-4 Test User
- **Email:** `phq4-test@novara.com`
- **Password:** `(No password - test login only)`
- **User ID:** `871a5ddf-8b30-47bc-b50d-77922e6b509a`
- **Status:** Onboarding completed, ready for PHQ-4 assessment
- **Purpose:** Testing PHQ-4 smart scheduling and assessment flow
- **Sample Data:** 3 days of check-ins for realistic testing

### Secondary PHQ-4 Test User (BUG-009)
- **Email:** `bug009@test.com`
- **Password:** `Test123!`
- **User ID:** `d8592a8f-6b8a-4828-9aa4-f3a0bddc423b`
- **Status:** Onboarding completed, PHQ-4 ready
- **Purpose:** Can also be used for PHQ-4 testing alongside bug fixes

---

## BUG-009: Enhanced Daily Check-in Not Registering as Completed

**Test User:**
- Email: `bug009@test.com`
- Password: `Test123!`
- Status: Onboarding completed, ready for check-ins

**Steps to Reproduce:**
1. Login with test user
2. Go to Check-in tab
3. Complete Quick Daily Check-in (select mood, medication, confidence)
4. Click "Want to share more details?"
5. Complete all 4 Enhanced Check-in steps:
   - Step 1: Mood & Mental Health
   - Step 2: Treatment & Side Effects  
   - Step 3: Support & Coping
   - Step 4: Information Needs
6. Click "Complete Check-in"
7. Navigate to Home tab
8. Return to Check-in tab
9. **BUG**: Shows new check-in prompt instead of "Today's Check-in Complete!"

**Expected**: Should show completed check-in status
**Actual**: Prompts for new check-in

**Fix Applied**: Enhanced form now calls `onComplete()` after successful submission

---

## BUG-019: Check-in Completion Time Shows Incorrect Time

**Test User:** Same as BUG-009

**Steps to Reproduce:**
1. Complete any check-in (Quick or Enhanced)
2. Look at the "Today's Check-in Complete!" card
3. Check the time shown (e.g., "Checked in at 5:00 PM")

**Expected**: Shows actual completion time
**Actual**: Shows hardcoded "5:00 PM"

---

## BUG-001: Slider Handle Not Centered on Track

**Steps to Reproduce:**
1. Go to any check-in form
2. Look at confidence slider
3. Set to value 5

**Expected**: Handle centered on track
**Actual**: Handle appears offset

---

## BUG-003: Confidence Slider Interaction Issues

**Steps to Reproduce:**
1. Go to Quick Daily Check-in
2. Try to drag the confidence slider
3. Notice the center cross line

**Expected**: Smooth drag, no visual artifacts
**Actual**: Unresponsive drag, cross line artifact