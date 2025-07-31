# Social Login User Flow

## Visual Flow Diagram

```
┌─────────────────┐
│   Home Page     │
│                 │
│ [Email SignUp]  │
│ [Apple Login]   │ ← New
│ [Google Login]  │ ← New
└────────┬────────┘
         │
    ┌────┴────┐
    │ Choice  │
    └────┬────┘
         │
┌────────┴────────────────────────┬─────────────────────────┐
│          Email Path             │      Social Path        │
│                                 │                         │
▼                                 ▼                         │
┌─────────────────┐               ┌──────────────────┐     │
│ Fast Onboarding │               │   OAuth Flow     │     │
│ - Email         │               │ - Provider Auth  │     │
│ - Cycle Stage   │               │ - Get Email/Name │     │
│ - Primary Need  │               └────────┬─────────┘     │
└────────┬────────┘                        │               │
         │                                 ▼               │
         │                        ┌──────────────────┐     │
         ▼                        │  Create Account  │     │
┌─────────────────┐               │ - Email from OAuth│    │
│ Baseline Panel  │               │ - Name → Nickname │    │
│ - Nickname      │               │ - Provider Info   │    │
│ - Confidence x3 │               │ - baseline = false│    │
│ - Top Concern   │               └────────┬─────────┘     │
└────────┬────────┘                        │               │
         │                                 │               │
         └────────────┬────────────────────┘               │
                      ▼                                     │
             ┌─────────────────┐                           │
             │   Dashboard     │                           │
             │                 │                           │
             │ Email Users:    │                           │
             │ ✓ Full Access   │                           │
             │                 │                           │
             │ Social Users:   │ ◄─────────────────────────┘
             │ ⚠️ Profile      │
             │   Incomplete    │
             └────────┬────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Profile Completion     │
         │ Modal (Social Only)    │
         │                        │
         │ - Cycle Stage          │
         │ - Primary Need         │
         │ - Confidence Scores    │
         │ - Nickname (optional)  │
         └────────────────────────┘
```

## Key Differences

### Email Signup (Current)
1. **Before Dashboard**: Collects all required info upfront
2. **Two-step process**: FastOnboarding → BaselinePanel
3. **Full access**: Once complete, all features available

### Social Login (New)
1. **Quick entry**: OAuth → Dashboard immediately
2. **Progressive**: Complete profile when ready
3. **Limited access**: Can browse but can't check-in until profile complete

## Implementation Priority

### Must Have (MVP)
- Apple Sign In (required for iOS)
- Profile completion modal
- Block check-ins until profile complete

### Nice to Have
- Google Sign In
- Pre-fill nickname from social profile
- Remember partial completion

### Future Enhancement
- Facebook Login
- LinkedIn (for professional audience)
- Account linking UI

## Component Structure

```
components/
├── auth/
│   ├── SocialLoginButtons.tsx      # Apple/Google buttons
│   ├── SocialAuthCallback.tsx      # OAuth callback handler
│   └── ProfileCompletionModal.tsx  # Collect missing fields
├── NovaraLanding.tsx               # Add social buttons
└── Dashboard.tsx                   # Show completion prompt
```

## State Management

```typescript
// User state after social login
{
  id: "uuid",
  email: "user@example.com",
  nickname: "John",  // From social provider or email prefix
  auth_provider: "apple",
  provider_id: "apple-user-id",
  
  // Missing required fields (null)
  cycle_stage: null,
  primary_need: null,
  confidence_meds: null,
  confidence_costs: null,
  confidence_overall: null,
  
  // Flags
  baseline_completed: false,
  email_verified: true,  // Social providers verify email
}
```

## Backend Endpoints

### New Endpoints
- `POST /api/auth/social/apple` - Apple OAuth callback
- `POST /api/auth/social/google` - Google OAuth callback  
- `GET /api/auth/social/link` - Link existing account

### Modified Endpoints
- `POST /api/users` - Accept social auth data
- `PUT /api/users/me` - Handle profile completion

## Security Considerations

1. **Token Validation**: Always validate OAuth tokens server-side
2. **Account Linking**: Verify email ownership before linking
3. **Rate Limiting**: Protect OAuth endpoints from abuse
4. **Data Privacy**: Only request necessary scopes from providers