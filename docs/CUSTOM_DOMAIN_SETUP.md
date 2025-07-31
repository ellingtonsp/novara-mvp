# Custom Domain Setup Guide

This guide provides step-by-step instructions for setting up custom domains for Novara MVP.

## Current Domain Configuration

**Primary Domain**: novarafertility.com

| Subdomain | Service | Current Status | Target |
|-----------|---------|---------------|---------|
| novarafertility.com | Frontend | ✅ Working | Vercel |
| www.novarafertility.com | Frontend | ✅ Working | Vercel |
| api.novarafertility.com | Backend API | ❌ Misconfigured | Railway |

## Frontend Domain Setup (Vercel)

### Step 1: Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `novara-mvp`
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `novarafertility.com`
6. Vercel will provide DNS instructions

### Step 2: Configure DNS Records

Add these records at your domain registrar:

```dns
# Root domain
Type: A
Name: @
Value: 76.76.21.21

# Alternative (if A record doesn't work)
Type: ALIAS or ANAME
Name: @
Value: cname.vercel-dns.com

# WWW subdomain
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Verify Configuration

```bash
# Check DNS propagation
dig novarafertility.com
dig www.novarafertility.com

# Test HTTPS
curl -I https://novarafertility.com
curl -I https://www.novarafertility.com
```

### Step 4: Update Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```env
# Add your custom domain to any relevant configs
VITE_APP_URL=https://novarafertility.com
```

## Backend API Domain Setup (Railway)

### Step 1: Add Custom Domain in Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project: `novara-mvp`
3. Click on your backend service
4. Go to **Settings** → **Domains**
5. Click **Add Custom Domain**
6. Enter: `api.novarafertility.com`
7. Railway will provide a target domain like: `amazing-words-production.up.railway.app`

### Step 2: Configure DNS Record

Add this record at your domain registrar:

```dns
Type: CNAME
Name: api
Value: [Railway-provided-domain].up.railway.app
```

**Example:**
```dns
Type: CNAME
Name: api
Value: amazing-words-production.up.railway.app
```

### Step 3: Update Backend CORS

In Railway environment variables:

```env
CORS_ORIGIN=https://novara-mvp.vercel.app,https://novarafertility.com,https://www.novarafertility.com
API_BASE_URL=https://api.novarafertility.com
```

### Step 4: Update Frontend API URL

In Vercel environment variables:

```env
VITE_API_URL=https://api.novarafertility.com
```

### Step 5: Verify API Configuration

```bash
# Check DNS
dig api.novarafertility.com

# Test health endpoint
curl https://api.novarafertility.com/api/health

# Test CORS
curl -I https://api.novarafertility.com/api/health \
  -H "Origin: https://novarafertility.com"
```

## SSL Configuration

### Vercel (Frontend)
- SSL certificates are **automatically provisioned**
- Uses Let's Encrypt
- Renews automatically
- Supports both root and www

### Railway (Backend)
- SSL certificates are **automatically provisioned**
- Uses Let's Encrypt
- Renews automatically
- Works with custom domains

## DNS Provider Configuration Examples

### Cloudflare
```
# Root domain
Type: A
Name: @
Value: 76.76.21.21
Proxy: OFF (DNS only)

# WWW
Type: CNAME
Name: www
Value: cname.vercel-dns.com
Proxy: OFF (DNS only)

# API
Type: CNAME
Name: api
Value: your-app.up.railway.app
Proxy: OFF (DNS only)
```

### Namecheap
1. Go to Domain List → Manage
2. Advanced DNS tab
3. Add records:
   - A Record: @ → 76.76.21.21
   - CNAME: www → cname.vercel-dns.com
   - CNAME: api → your-app.up.railway.app

### GoDaddy
1. DNS Management
2. Add records with TTL 600 (10 minutes)
3. Wait for propagation

## Troubleshooting Domain Issues

### DNS Not Propagating

**Check propagation status:**
```bash
# Global DNS check
https://www.whatsmydns.net/#A/novarafertility.com

# Local check
nslookup novarafertility.com
dig novarafertility.com
```

**Common issues:**
- TTL too high (reduce to 300-600 seconds)
- Cached DNS (flush local DNS cache)
- Conflicting records (remove old ones)

### SSL Certificate Errors

**Frontend (Vercel):**
1. Remove domain from Vercel
2. Wait 5 minutes
3. Re-add domain
4. Vercel will reprovision certificate

**Backend (Railway):**
1. Check domain is properly pointed
2. Remove and re-add custom domain
3. Railway will reprovision

### CORS Issues with Custom Domain

**Quick fix:**
```javascript
// In backend/server.js, add to allowedOrigins:
'https://novarafertility.com',
'https://www.novarafertility.com',
'https://api.novarafertility.com'
```

**Environment variable fix:**
```env
CORS_ORIGIN=https://novarafertility.com,https://www.novarafertility.com
```

## Multiple Domain Setup

### Adding Additional Domains

**Frontend (Vercel):**
1. Add each domain in Vercel dashboard
2. Configure DNS for each
3. Update CORS to include all domains

**Example for multiple domains:**
```env
# Railway CORS
CORS_ORIGIN=https://novarafertility.com,https://www.novarafertility.com,https://app.novara.health,https://novara.health

# DNS Records for each domain
novarafertility.com → Vercel
novara.health → Vercel
app.novara.health → Vercel
api.novara.health → Railway
```

### Domain Redirects

**Redirect non-www to www:**
```javascript
// In Vercel, use vercel.json:
{
  "redirects": [
    {
      "source": "https://novarafertility.com/(.*)",
      "destination": "https://www.novarafertility.com/$1",
      "permanent": true
    }
  ]
}
```

## Best Practices

### 1. DNS Configuration
- Use low TTL (300-600) during setup
- Increase TTL after stable (3600+)
- Keep DNS provider credentials secure

### 2. SSL/Security
- Always use HTTPS
- Enable HSTS headers
- Regular certificate monitoring

### 3. Monitoring
- Set up uptime monitoring
- Monitor SSL expiration
- Track DNS resolution times

### 4. Documentation
- Document all domains and subdomains
- Keep DNS provider info accessible
- Track certificate expiration dates

## Migration Checklist

When migrating to a new domain:

- [ ] Purchase new domain
- [ ] Add to Vercel dashboard
- [ ] Configure DNS records
- [ ] Wait for DNS propagation
- [ ] Test frontend access
- [ ] Add API subdomain to Railway
- [ ] Configure API DNS record
- [ ] Update all environment variables
- [ ] Update CORS settings
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Notify users of change
- [ ] Set up redirects from old domain
- [ ] Monitor for issues

## Domain Management Tools

### Useful Services
- **DNS Checker**: https://www.whatsmydns.net
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Domain Tools**: https://mxtoolbox.com
- **Uptime Monitor**: https://uptimerobot.com

### Command Line Tools
```bash
# DNS queries
dig +short novarafertility.com
nslookup novarafertility.com
host novarafertility.com

# SSL certificate check
openssl s_client -connect novarafertility.com:443 -servername novarafertility.com

# HTTP headers
curl -I https://novarafertility.com
```

---

Last Updated: July 31, 2025