# Airtable Schema Mapping

## Critical Fields Used in Production

### Users Table
**Currently Used:**
- ✅ `email` - User identifier
- ✅ `user_id` - Unique ID
- ✅ `created_at` - Registration date
- ✅ `nickname` - Display name

**Not Critical (Code has defaults):**
- `cycle_stage` - Defaults to 'baseline'
- `onboarding_path` - Defaults to null
- Other profile fields - Optional

### DailyCheckins Table
**Currently Used:**
- ✅ `user_id` - Links to user
- ✅ `mood_today` - Core tracking field
- ✅ `confidence_today` - Core tracking field  
- ✅ `primary_concern_today` - Optional field
- ✅ `date_submitted` - Critical for timezone handling
- ✅ `medication_taken` - New field (just added)

**Not Critical (Code handles missing):**
- All momentum fields - Default to null
- All confidence variants - Default to null
- Sentiment fields - Optional analytics
- `user_note` - Optional text field

### Key Findings:

1. **The code is defensive** - It uses `|| default` for missing fields
2. **Core functionality works** with just the basic fields
3. **New features gracefully degrade** when optional fields are missing

## Recommendations:

1. **Stage/Prod are functional** with current schema
2. **medication_taken field is added** - New feature will work
3. **No breaking changes** - Code handles missing fields
4. **Future additions** can be made incrementally

## Fields to Add Later (Non-Critical):
- `user_note` in DailyCheckins (for notes feature)
- `cycle_stage` in Users (for better personalization)
- `timezone` in Users (currently using browser timezone)