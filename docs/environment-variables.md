# Production Environment Variables Setup

## Backend Environment Variables (Railway)

Set these in Railway Dashboard → Backend Service → Variables:

```env
# Required Production Variables
NODE_ENV=production
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
JWT_SECRET=your_super_secure_64_character_jwt_secret_here

# Optional Configuration  
PORT=3000
API_RATE_LIMIT=100
LOG_LEVEL=info
```

## Frontend Environment Variables (Railway)

Set these in Railway Dashboard → Frontend Service → Variables:

```env
# Required Frontend Variables
NODE_ENV=production
VITE_API_URL=https://api.novarafertility.com
VITE_APP_ENV=production

# Optional Configuration
VITE_APP_NAME=Novara
VITE_APP_VERSION=1.0.0
```

## Security Setup

### Generate Secure JWT Secret
```bash
# Generate a 64-character random secret
openssl rand -base64 64

# Example output (use your own, don't use this one):
# 7X8K9L2M5N6Q8R1S4T7W0Y3Z6A9D2F5H8J1L4O7R0U3X6B9E2G5J8M1P4S7V0Y3
```

### Airtable API Key Security
1. Go to Airtable Account → API
2. Create a new API key with minimal permissions:
   - Read access to your base
   - Write access to your base
   - No access to other bases
3. Use this dedicated key for production

## Domain Configuration

### DNS Records Setup

For your domain registrar (where you bought novarafertility.com):

```dns
# Main website
Type: CNAME
Name: @ (or leave blank)
Value: your-frontend-service.railway.app

# WWW subdomain  
Type: CNAME
Name: www
Value: your-frontend-service.railway.app

# API subdomain
Type: CNAME  
Name: api
Value: your-backend-service.railway.app
```

### Railway Custom Domains

**Backend Service:**
- Add domain: `api.novarafertility.com`

**Frontend Service:**
- Add domain: `novarafertility.com` 
- Add domain: `www.novarafertility.com`

## Database Migration Strategy

### Current MVP Database
```env
# Use your existing Airtable base for immediate production
AIRTABLE_BASE_ID=your_current_development_base_id
AIRTABLE_API_KEY=your_current_api_key
```

### Future Clean Launch Database
```env
# When ready for clean launch, create new base and switch:
AIRTABLE_PROD_BASE_ID=your_future_production_base_id
AIRTABLE_PROD_API_KEY=your_future_prod_api_key
```

## Verification Commands

After deployment, test these endpoints:

```bash
# Backend health check
curl https://api.novarafertility.com/api/health

# Frontend accessibility
curl https://novarafertility.com/novara-mvp/

# Full system regression test  
npm run test:regression
```

## Security Checklist

- [ ] JWT secret is 64+ characters and randomly generated
- [ ] Airtable API key has minimal required permissions only
- [ ] All environment variables are set in Railway (not in code)
- [ ] HTTPS is enforced for all domains
- [ ] No secrets are committed to git repository
- [ ] Production API URL is correctly configured in frontend 