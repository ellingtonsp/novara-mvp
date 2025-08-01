# BUG-008: Code Variable Name Exposed in Daily Insight

**Priority**: 🟡 Medium  
**Status**: 🔄 Open  
**Reported**: 2025-08-01  
**Reporter**: @stephen  
**Component**: Daily Insights Display  

## Description
The Daily Insight feature is displaying raw code variable names to users. The insight shows "medication_side_effects" (with underscores) instead of properly formatted human-readable text like "medication side effects".

## Screenshots
- Daily Insight showing: "Even with 'medication_side_effects' on your mind..."
- Shows code-style formatting with underscores and quotes

## Steps to Reproduce
1. Complete daily check-in with medication concerns
2. View generated Daily Insight
3. Observe code-style variable name in the insight text
4. Note unprofessional appearance with underscores and quotes

## Expected Behavior
- All text should be human-readable
- No code variables or technical formatting
- Example: "Even with medication side effects on your mind..."
- Professional, polished content presentation

## Actual Behavior
- Raw variable name "medication_side_effects" displayed
- Includes programming-style underscores
- Wrapped in quotes unnecessarily
- Breaks immersion and appears unprofessional

## Technical Details
- Component: Daily Insights Display
- File: `/frontend/src/components/DailyInsightsDisplay.tsx`
- Issue in text generation or string formatting
- Variable interpolation not properly handled

## Possible Root Cause
- Direct variable name interpolation without formatting
- Missing text transformation function
- Template string not properly processed
- Could be backend or frontend issue

## Impact
- Reduces app professionalism
- Exposes technical implementation to users
- Breaks the conversational tone of insights
- May reduce user trust in AI-generated content

## Other Potential Occurrences
- Check all insight templates for similar issues
- Review any dynamic text generation
- Audit all user-facing strings for code exposure

## Suggested Fix
1. Add text transformation function to convert variable names:
   ```typescript
   const formatVariableName = (name: string) => {
     return name.replace(/_/g, ' ').toLowerCase();
   };
   ```
2. Remove unnecessary quotes from output
3. Review all insight templates
4. Add tests to prevent code language in user content
5. Consider using a proper template system with human-readable keys

## Testing Requirements
- Verify all possible insight variations
- Check for other instances of code exposure
- Test with different user concerns/inputs
- Ensure consistent formatting across all insights