# VP-01 — ROI Banner

## Epic
**E2 Insight Polish** — Make check-ins feel valuable and insights feel personalized

## Story
As a new or hesitant user, I want to see evidence-based proof that regular check-ins lead to better health outcomes, so I feel motivated to build a consistent tracking habit.

## Acceptance Criteria
1. **Banner Display**
   - [ ] Show ROI message prominently below the Novara logo on dashboard
   - [ ] Text: "5× check-ins → 15% ↑ medication adherence"
   - [ ] Include subtle animation on first view to draw attention
   - [ ] Banner is dismissible but reappears after 7 days of inactivity

2. **Visual Design**
   - [ ] Use positive, motivating color scheme (green/blue gradients)
   - [ ] Include small icon representing improvement/growth
   - [ ] Ensure text is readable on all screen sizes
   - [ ] Maintain consistent styling with brand guidelines

3. **Behavioral Logic**
   - [ ] Show to all users on dashboard after signup
   - [ ] Hide permanently after user reaches 5 consecutive check-ins
   - [ ] Re-show if user becomes inactive for 7+ days
   - [ ] Track banner views and interactions via AN-01 events

4. **Content Variations**
   - [ ] A/B test different statistics based on user persona
   - [ ] For cycle trackers: "Daily tracking → 3× better symptom prediction"
   - [ ] For chronic conditions: "5× check-ins → 15% ↑ medication adherence"
   - [ ] Default to medication adherence stat if persona unknown

## Technical Considerations
- Implement as reusable React component
- Store dismissal state in user preferences
- Use PostHog for A/B testing and conversion tracking
- Ensure banner doesn't shift layout when appearing/disappearing

## Business Value
- **Activation**: Provides immediate social proof to new users
- **Retention**: Reminds lapsed users of the value proposition
- **Conversion**: Evidence-based messaging improves free→paid conversion

## Dependencies
- AN-01 event tracking must be implemented for analytics
- Requires coordination with design team for visual assets
- Copy should be reviewed by medical/legal for accuracy

## Definition of Done
- [ ] Component implemented and tested across all viewports
- [ ] A/B test configured with at least 2 variants
- [ ] Analytics events firing correctly
- [ ] Dismissal/reappearance logic working as specified
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance impact < 10ms render time

## Story Points: 2
Simple UI component with straightforward logic, main effort in design coordination and A/B setup.