# GR-01 — Welcome Micro-Insight Email

## Epic
**E3 Growth Loops** — Create self-reinforcing user behaviors that drive retention

## Story
As a new user who just signed up, I want to receive a personalized insight within 10 minutes that demonstrates immediate value, so I understand what Novara can do for me and feel motivated to complete my first check-in.

## Acceptance Criteria
1. **Email Timing**
   - [ ] Email sent within 10 minutes of account creation
   - [ ] Fallback to 30 minutes if system is under load
   - [ ] No email sent if user completes first check-in before timer
   - [ ] Email cancelled if user unsubscribes during onboarding

2. **Content Generation**
   - [ ] Use signup questionnaire data to personalize content
   - [ ] Include one specific, actionable micro-insight based on:
     - Current date/season (e.g., "Winter vitamin D reminder")
     - Stated health goals (e.g., "Track energy dips after meals")
     - Demographic data (e.g., "Women 25-35 often miss these symptoms")
   - [ ] Fallback to general health tip if insufficient data

3. **Email Structure**
   - [ ] Subject: "Your first insight from Novara is ready, [Name]"
   - [ ] Personalized greeting using first name
   - [ ] One clear, actionable insight (2-3 sentences)
   - [ ] CTA button: "Start Your First Check-in"
   - [ ] PS section with quick win: "Takes less than 60 seconds"

4. **Tracking & Analytics**
   - [ ] Track email opens, clicks, and conversions
   - [ ] Measure time from email → first check-in
   - [ ] A/B test subject lines and insight types
   - [ ] Monitor unsubscribe rates

## Technical Considerations
- Implement email queue with retry logic
- Use SendGrid or similar for delivery reliability
- Template system for easy content updates
- Ensure GDPR/CAN-SPAM compliance
- Handle edge cases (invalid emails, bounces)

## Example Insights by Persona
1. **Cycle Tracker**: "Did you know? Tracking symptoms 5 days before your period helps identify PMS patterns 73% more accurately."
2. **Chronic Condition**: "Tip: Morning check-ins capture overnight symptoms doctors often ask about but we forget."
3. **Wellness Optimizer**: "Your peak performance window is likely 2-3 hours after waking. Track energy to find yours."

## Business Value
- **Activation**: 40% higher first check-in rates with welcome email
- **Retention**: Users who engage with welcome email have 2.5x 7-day retention
- **Education**: Sets expectations for value user will receive

## Dependencies
- Email service provider integration
- User preference center for unsubscribes
- CM-01 NLP system for insight generation (optional enhancement)
- AN-01 event tracking for analytics

## Definition of Done
- [ ] Email template created and responsive tested
- [ ] Queue system implemented with monitoring
- [ ] 3+ insight variants per persona created
- [ ] Analytics dashboard configured
- [ ] Load tested to ensure 10-minute SLA
- [ ] Compliance review completed
- [ ] A/B test framework ready

## Story Points: 2
Email infrastructure exists, main work is content strategy and queue timing logic.