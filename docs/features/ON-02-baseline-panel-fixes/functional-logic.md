# Functional Logic: Baseline Panel Display

## Core Logic for Panel Display

### Should Show Baseline Panel?
```typescript
const shouldShowBaselinePanel = () => {
  // User must exist
  if (!user) return false;
  
  // Already completed baseline
  if (user.baseline_completed) return false;
  
  // Only for A/B test path users
  if (user.onboarding_path !== 'test') return false;
  
  // Check if user has meaningful data (existing user detection)
  const hasNickname = user.nickname && user.nickname.trim() !== '';
  const hasNonDefaultScores = 
    user.confidence_meds !== 5 || 
    user.confidence_costs !== 5 || 
    user.confidence_overall !== 5;
  const isExistingUser = hasNickname || hasNonDefaultScores || user.baseline_completed;
  
  // Don't show for existing users
  if (isExistingUser) return false;
  
  // Check dismissal state
  if (baselineDismissed) return false;
  
  return true;
};
```

## State Management Logic

### updateUser Function
```typescript
const updateUser = (updates: Partial<User>) => {
  if (!user) return;
  
  const updatedUser = { ...user, ...updates };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  setUser(updatedUser);
  console.log('✅ User data updated:', updates);
};
```

### Dismissal Tracking
```typescript
const [baselineDismissed, setBaselineDismissed] = useState(() => {
  return localStorage.getItem('baselinePanelDismissed') === 'true';
});

const handleDismiss = () => {
  setBaselineDismissed(true);
  localStorage.setItem('baselinePanelDismissed', 'true');
};
```

## Decision Tree
```
Start
  ↓
User exists? → No → Don't show
  ↓ Yes
Baseline completed? → Yes → Don't show
  ↓ No
Onboarding path = 'test'? → No → Don't show
  ↓ Yes
Has existing data? → Yes → Don't show
  ↓ No
Was dismissed? → Yes → Don't show
  ↓ No
SHOW PANEL
```

## Key Improvements
1. **No Page Reloads**: Updates happen in-place via Context
2. **Persistent Dismissal**: Stored in localStorage
3. **Smart Detection**: Identifies existing users by their data
4. **Field Mapping**: Handles primary_concern → primary_need
5. **Race Condition Prevention**: Atomic state updates