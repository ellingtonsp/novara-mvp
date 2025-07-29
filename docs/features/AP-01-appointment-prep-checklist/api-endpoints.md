# AP-01 API Endpoints

## Checklist Management Endpoints

### GET /api/checklist
**Purpose:** Retrieve user's current checklist state

**Authentication:** Required (JWT)

**Response:**
```json
{
  "cycle_stage": "stimulation",
  "items": [
    {
      "id": "stim_meds",
      "text": "Set phone alarm for tonight's injection",
      "completed": true,
      "completed_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "stim_snacks", 
      "text": "Prep post-shot high-protein snack",
      "completed": false,
      "completed_at": null
    }
  ],
  "progress": {
    "completed": 1,
    "total": 3,
    "percentage": 33
  }
}
```

### POST /api/checklist/update
**Purpose:** Update checklist item completion status

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "item_id": "stim_meds",
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "stim_meds",
    "text": "Set phone alarm for tonight's injection", 
    "completed": true,
    "completed_at": "2025-01-15T10:30:00Z"
  },
  "progress": {
    "completed": 1,
    "total": 3,
    "percentage": 33
  },
  "all_completed": false
}
```

### POST /api/checklist/reset
**Purpose:** Reset all checklist items (for new cycle stage)

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "cycle_stage": "retrieval"
}
```

**Response:**
```json
{
  "success": true,
  "cycle_stage": "retrieval",
  "items": [
    {
      "id": "ret_comfort",
      "text": "Pack comfort items for procedure",
      "completed": false,
      "completed_at": null
    }
  ]
}
```

## Database Schema

### Users Table Addition
```sql
ALTER TABLE Users ADD COLUMN prep_checklist JSONB DEFAULT '{}';
```

**Schema Structure:**
```json
{
  "cycle_stage": "stimulation",
  "completed_ids": ["stim_meds", "stim_snacks"],
  "last_updated": "2025-01-15T10:30:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid item_id",
  "message": "Item ID 'invalid_id' not found for cycle stage 'stimulation'"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Valid JWT token required"
}
```

### 404 Not Found
```json
{
  "error": "User not found",
  "message": "User checklist data not available"
}
```

## Analytics Events

### Checklist Shown
```javascript
track('checklist_shown', {
  cycle_stage: 'stimulation',
  environment: 'production',
  user_id: 'user_123'
});
```

### Item Completed
```javascript
track('checklist_item_completed', {
  item_id: 'stim_meds',
  cycle_stage: 'stimulation',
  environment: 'production',
  user_id: 'user_123'
});
```

### All Items Completed
```javascript
track('checklist_completed', {
  cycle_stage: 'stimulation',
  environment: 'production',
  user_id: 'user_123',
  completion_time: '2025-01-15T10:30:00Z'
});
```

## Testing Endpoints

### GET /api/checklist/test
**Purpose:** Test endpoint for development (bypasses auth)

**Query Parameters:**
- `cycle_stage` (optional): Override cycle stage for testing
- `email` (optional): Test user email

**Response:** Same as GET /api/checklist but with test data 