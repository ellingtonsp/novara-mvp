# ON-01 User Journey: Speed-Tapper Detection

## User Persona: Alex (Speed-Tapper)

**Background**: Alex is a busy professional who wants to try Novara but doesn't have time for lengthy onboarding. They prefer quick, efficient interactions.

## Journey Flow

### Standard Onboarding Path (Default)
1. **Landing Page** → User clicks "Get Started"
2. **Step 1: Email** → User enters email, taps "Continue"
3. **Step 2: Nickname** → User enters nickname, taps "Continue"
4. **Step 3: Confidence Sliders** → User adjusts sliders, taps "Continue"
5. **Step 4: Primary Need** → User selects need, taps "Continue"
6. **Step 5: Cycle Stage** → User selects stage, taps "Continue"
7. **Welcome Screen** → Personalized micro-insight

### Fast Onboarding Path (Triggered by Speed-Tap Detection)
1. **Landing Page** → User clicks "Get Started"
2. **Step 1: Email** → User enters email, taps "Continue" *(tap 1)*
3. **Step 2: Nickname** → User enters nickname, taps "Continue" *(tap 2)*
4. **Step 3: Confidence Sliders** → User quickly taps through *(tap 3)*
5. **🚀 FAST PATH TRIGGERED** → "Short on time? No problem—just give us the basics."
6. **Fast Step 1: Email** → Pre-filled from previous input
7. **Fast Step 2: Cycle Stage** → Dropdown selection
8. **Fast Step 3: Biggest Concern** → Dropdown selection
9. **Welcome Screen** → Same personalized micro-insight

## Speed-Tap Detection Logic

### Detection Window
- **Time Window**: 10-second rolling window
- **Tap Threshold**: ≥3 taps/inputs within window
- **Trigger Point**: Before reaching Step 3 (confidence sliders)
- **Rolling Filter**: Only count taps within last 10 seconds

### Tap Events Tracked
- Form field focus/blur
- Button clicks (Continue, Back)
- Slider adjustments
- Dropdown selections

### Transition Experience
When speed-tap is detected:
1. **Immediate Transition**: Show toast message
2. **Copy**: "We've streamlined these last questions for you."
3. **Visual Cue**: Smooth animation to fast path
4. **Data Preservation**: Carry forward already-entered data

## Analytics Events

### Path Selection
```javascript
track('onboarding_path_selected', {
  path: 'fast' | 'standard',
  trigger_reason: 'speed_tap' | 'manual' | 'default',
  tap_count: number,
  time_window_ms: number,
  environment: 'development' | 'staging' | 'production'
});
```

### Completion Tracking
```javascript
track('onboarding_completed', {
  path: 'fast' | 'standard',
  completion_ms: number,
  steps_completed: number,
  total_steps: number,
  environment: 'development' | 'staging' | 'production'
});
```

## Success Criteria

### User Experience
- **Seamless Transition**: No jarring UI changes
- **Data Preservation**: No loss of entered information
- **Clear Communication**: User understands the change
- **Consistent Outcome**: Same welcome experience

### Performance Metrics
- **Detection Accuracy**: <5% false positives
- **Transition Speed**: <500ms animation
- **Completion Rate**: ≥10% improvement for fast-path users
- **No Regression**: Standard path completion unchanged

## Edge Cases

### False Positive Prevention
- **Intentional Fast Users**: Users who naturally move quickly but thoughtfully
- **Mobile Network Issues**: Slow loading causing rapid taps
- **Accessibility**: Screen readers or assistive technology

### Fallback Scenarios
- **Detection Failure**: Graceful fallback to standard path
- **Partial Data**: Handle incomplete form submissions
- **Browser Compatibility**: Ensure cross-browser functionality

## Testing Scenarios

### Speed-Tap Detection
1. **3 taps in 9.9s** → Should trigger fast path
2. **3 taps in 10.1s** → Should remain standard path
3. **2 taps in 5s** → Should remain standard path
4. **4 taps in 8s** → Should trigger fast path

### User Experience
1. **Natural Speed User** → Should detect and transition smoothly
2. **Thoughtful User** → Should remain on standard path
3. **Mixed Behavior** → Should handle gracefully
4. **Mobile vs Desktop** → Should work consistently

### Analytics Validation
1. **Event Firing** → Verify all events are tracked
2. **Data Accuracy** → Confirm metrics are correct
3. **Performance Impact** → Ensure no regression
4. **A/B Testing** → Validate uplift measurements 