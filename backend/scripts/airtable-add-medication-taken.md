# Airtable Schema Update Required

## DailyCheckins Table

Please add the following field to the DailyCheckins table in Airtable:

### Field: medication_taken
- **Type**: Checkbox
- **Default**: Unchecked (false)
- **Description**: Tracks whether user took their medication for the day

## How to Add in Airtable:

1. Go to your Airtable base
2. Open the DailyCheckins table
3. Click the `+` button to add a new field
4. Name it: `medication_taken`
5. Choose field type: "Checkbox"
6. Leave default as unchecked
7. Save the field

## Note on Data Mapping:
- Checked (true) = User took medication ("yes")
- Unchecked (false) = User didn't take medication or didn't track
- The backend will need to be updated to handle boolean values

## Verification:

After adding, run:
```bash
cd backend && node scripts/validate-airtable-schema.js
```

This will confirm the field was added correctly.