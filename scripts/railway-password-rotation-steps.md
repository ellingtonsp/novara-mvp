# Railway Password Rotation - Detailed Steps

## Method 1: Edit the PGPASSWORD Variable
1. Click on the `PGPASSWORD` row (where you see `*******`)
2. Click the three dots menu (⋮) on the right side of the PGPASSWORD row
3. Select "Edit"
4. Delete the current value and enter a new secure password
5. Click Save/Update

## Method 2: Generate New Password
1. Click on the three dots menu (⋮) next to PGPASSWORD
2. Look for "Regenerate" or "Generate new value" option
3. If not available, use Method 1 above

## Method 3: Use Raw Editor
1. Click the "Raw Editor" button (you can see it in your screenshot)
2. Find the PGPASSWORD line
3. Replace the value with a new secure password
4. Save the changes

## After Changing Password:
1. The DATABASE_URL will automatically update with the new password
2. All services using this database will restart automatically
3. Copy the new DATABASE_URL value for your local .env file

## Recommended New Password:
Generate a strong password with:
- At least 20 characters
- Mix of uppercase, lowercase, numbers, and symbols
- No dictionary words

Example command to generate one:
```bash
openssl rand -base64 32
```