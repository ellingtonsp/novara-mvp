# BUG-017: Dashboard Tooltip Disappears Too Quickly

**Priority**: 🟢 Small  
**Status**: ✅ Resolved  
**Reported**: 2025-08-01  
**Resolved**: 2025-08-01  
**Reporter**: @stephen  
**Component**: UI/Tooltip Component  

## Description
The information tooltip (ℹ️) on the Dashboard metrics disappears too quickly after clicking or hovering, not giving users enough time to read the tooltip content. This may be browser-specific (observed in Chrome) but affects the user's ability to understand what each metric means.

## Screenshots
- Shows tooltip icon (ℹ️) next to "Medication Adherence"
- Tooltip appears briefly then disappears
- Users can't read full explanation

## Steps to Reproduce
1. Navigate to Dashboard/Insights tab
2. Find any metric with info icon (e.g., Medication Adherence)
3. Click or hover over the ℹ️ icon
4. Observe tooltip appears then quickly disappears
5. Not enough time to read content

## Expected Behavior
- Tooltip should remain visible for adequate reading time
- Click: Stay open until clicked elsewhere or X button
- Hover: Remain visible while hovering + delay before closing
- Standard delay: 3-5 seconds after mouse leaves

## Actual Behavior
- Tooltip disappears almost immediately
- Users can't read the information
- May need multiple attempts to read content
- Frustrating experience

## Technical Details
- Component: MetricTooltip or similar
- May be browser-specific (Chrome)
- Possible issues:
  - Timeout too short
  - Event handling conflicts
  - CSS transition timing

## Browser Testing Needed
- Chrome (confirmed issue)
- Safari (test needed)
- Firefox (test needed)
- Mobile browsers (test needed)

## Suggested Fix
```javascript
// For hover tooltips
onMouseLeave={() => {
  setTimeout(() => {
    setTooltipVisible(false);
  }, 3000); // 3 second delay
}}

// For click tooltips
onClick={() => {
  setTooltipVisible(true);
  // Don't auto-hide, wait for outside click
}}

// Add click-outside handler
useClickOutside(tooltipRef, () => {
  setTooltipVisible(false);
});
```

## Impact
- Users miss important metric explanations
- Reduces understanding of dashboard data
- May lead to misinterpretation of metrics
- Accessibility concern for slower readers

## Additional Recommendations
1. Consider tooltip display method:
   - Click for mobile (persistent)
   - Hover for desktop (with delay)
2. Add close button (X) for click tooltips
3. Ensure tooltips are keyboard accessible
4. Test with screen readers
5. Consider making display time configurable

---

## ✅ **RESOLUTION**

**Date Resolved**: 2025-08-01

### **Solution Implemented**
Implemented the suggested timeout approach with proper cleanup:

1. **3-second delay**: Added 3-second delay before tooltip closes after mouse leaves
2. **Hover persistence**: Tooltip stays open when hovering over the tooltip itself
3. **Proper cleanup**: Uses timeout refs to prevent memory leaks and race conditions
4. **Click behavior**: Clicking clears any pending timeouts for immediate interaction

### **Technical Implementation**
Modified `MetricTooltip.tsx`:

```javascript
const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Clear timeout on component unmount
useEffect(() => {
  return () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };
}, [isOpen]);

// Trigger button hover handlers
onMouseEnter={() => {
  if (closeTimeoutRef.current) {
    clearTimeout(closeTimeoutRef.current);
  }
  setIsOpen(true);
}}
onMouseLeave={() => {
  // Add 3-second delay before closing
  closeTimeoutRef.current = setTimeout(() => {
    setIsOpen(false);
  }, 3000);
}}

// Tooltip content hover handlers
onMouseEnter={() => {
  // Clear timeout when hovering over tooltip
  if (closeTimeoutRef.current) {
    clearTimeout(closeTimeoutRef.current);
  }
}}
onMouseLeave={() => {
  // Start close timeout when leaving tooltip
  closeTimeoutRef.current = setTimeout(() => {
    setIsOpen(false);
  }, 3000);
}}
```

### **Key Features**
- **3-second delay**: Users have adequate time to read tooltip content
- **Hover continuity**: Moving from trigger to tooltip doesn't close it
- **Click override**: Clicking clears delays for immediate interaction
- **Memory safety**: Proper timeout cleanup prevents memory leaks
- **Race condition prevention**: Clears pending timeouts before setting new ones

### **Files Modified**
- `frontend/src/components/MetricTooltip.tsx`

### **Impact**
- Users can now fully read tooltip information without rushing
- Smooth interaction experience between trigger and tooltip
- No more frustration with disappearing tooltips
- Better accessibility for users who need more time to read
- Improved understanding of dashboard metrics and their meanings