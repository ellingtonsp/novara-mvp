#!/bin/bash

# Staging Airtable Schema Validation for CM-01 Medication Status
API_KEY="patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7"
BASE_ID="appEOWvLjCn5c7Ght"
BASE_URL="https://api.airtable.com/v0"

echo "🔍 Validating Staging Airtable Schema for CM-01 Medication Status"
echo "================================================================"
echo "📊 Base ID: $BASE_ID"
echo "🌐 Environment: staging"

# Get Users table schema
echo -e "\n📡 Fetching Users table schema from staging Airtable..."
SCHEMA_RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/meta/bases/$BASE_ID/tables")

if [ $? -ne 0 ]; then
  echo "❌ Failed to fetch schema from Airtable"
  exit 1
fi

# Check if we got a valid response
if echo "$SCHEMA_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Airtable API Error:"
  echo "$SCHEMA_RESPONSE" | jq '.error'
  exit 1
fi

echo "✅ Successfully fetched schema"

# Extract Users table fields
echo -e "\n📋 Current Users Table Fields:"
USERS_FIELDS=$(echo "$SCHEMA_RESPONSE" | jq -r '.tables[] | select(.name == "Users") | .fields[] | "   • \(.name) (\(.type))"')

if [ -z "$USERS_FIELDS" ]; then
  echo "❌ ERROR: Users table not found in staging Airtable base"
  exit 1
fi

echo "$USERS_FIELDS"

# Check for medication status fields
echo -e "\n🧪 Checking for CM-01 Medication Status Fields:"

MEDICATION_STATUS_EXISTS=$(echo "$SCHEMA_RESPONSE" | jq -r '.tables[] | select(.name == "Users") | .fields[] | select(.name == "medication_status") | .name')
MEDICATION_STATUS_UPDATED_EXISTS=$(echo "$SCHEMA_RESPONSE" | jq -r '.tables[] | select(.name == "Users") | .fields[] | select(.name == "medication_status_updated") | .name')

MISSING_FIELDS=0

if [ -z "$MEDICATION_STATUS_EXISTS" ]; then
  echo "   ❌ MISSING: medication_status (singleSelect)"
  MISSING_FIELDS=$((MISSING_FIELDS + 1))
else
  echo "   ✅ EXISTS: medication_status"
fi

if [ -z "$MEDICATION_STATUS_UPDATED_EXISTS" ]; then
  echo "   ❌ MISSING: medication_status_updated (dateTime)"
  MISSING_FIELDS=$((MISSING_FIELDS + 1))
else
  echo "   ✅ EXISTS: medication_status_updated"
fi

if [ $MISSING_FIELDS -gt 0 ]; then
  echo -e "\n🚨 SCHEMA ISSUE FOUND:"
  echo "   $MISSING_FIELDS required fields are missing from staging Users table"
  echo -e "\n📝 Required Fields to Add:"
  
  if [ -z "$MEDICATION_STATUS_EXISTS" ]; then
    echo -e "\n   Field: medication_status"
    echo "   Type: Single select"
    echo "   Options: taking, starting_soon, between_cycles, not_applicable"
  fi
  
  if [ -z "$MEDICATION_STATUS_UPDATED_EXISTS" ]; then
    echo -e "\n   Field: medication_status_updated"
    echo "   Type: Date and time"
  fi
  
  echo -e "\n🛠️  Manual Action Required:"
  echo "   1. Go to Airtable staging base: https://airtable.com/base/$BASE_ID"
  echo "   2. Open Users table"
  echo "   3. Add the missing fields as shown above"
  echo "   4. Re-run this validation script"
  
  exit 1
else
  echo -e "\n🎉 SUCCESS: All required medication status fields exist in staging!"
  echo "   Staging Airtable schema is ready for CM-01 deployment"
  
  # Test medication status API compatibility
  echo -e "\n🧪 Testing Medication Status API Compatibility"
  echo "==============================================="
  
  # Test user creation with medication status
  TEST_EMAIL="test-staging-schema-$(date +%s)@example.com"
  
  echo "   Creating test user with medication status..."
  CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/$BASE_ID/Users" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"fields\": {
        \"email\": \"$TEST_EMAIL\",
        \"nickname\": \"SchemaTest\",
        \"confidence_meds\": 5,
        \"confidence_costs\": 7,
        \"confidence_overall\": 6,
        \"primary_need\": \"medication_guidance\",
        \"cycle_stage\": \"ivf_prep\",
        \"medication_status\": \"taking\",
        \"medication_status_updated\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
      }
    }")
  
  # Check if user creation was successful
  if echo "$CREATE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
    echo "   ✅ Schema compatibility test PASSED"
    echo "   Created test user: $USER_ID"
    
    # Clean up test user
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/$BASE_ID/Users/$USER_ID" \
      -H "Authorization: Bearer $API_KEY")
    echo "   🧹 Cleaned up test user"
    
    echo -e "\n🎉 STAGING SCHEMA VALIDATION COMPLETE"
    echo "===================================="
    echo "✅ All required fields exist"
    echo "✅ API compatibility confirmed"
    echo "✅ Ready for CM-01 staging deployment"
    exit 0
  else
    echo "   ❌ Schema compatibility test FAILED"
    echo "   Error response: $CREATE_RESPONSE"
    exit 1
  fi
fi 