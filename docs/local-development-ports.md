# Novara MVP - Local Development Port Strategy

## 🚀 **Quick Start**

**Default command (use this):**
```bash
./scripts/start-local.sh
```

**Your URLs:**
- **Frontend**: http://localhost:4200/
- **Backend**: http://localhost:9002/
- **Health**: http://localhost:9002/api/health

## 🔒 **Port Strategy**

### **✅ Stable Ports (Current)**
| Service | Port | Conflict Risk | Notes |
|---------|------|---------------|-------|
| Frontend | 4200 | 🟢 5% | Angular default, less crowded |
| Backend | 9002 | 🟢 1% | High range, rarely used |

### **❌ Problematic Ports (Avoid)**
| Service | Port | Conflict Risk | Why Avoid |
|---------|------|---------------|-----------|
| Frontend | 3000 | 🔴 90% | React/Next.js/Express default |
| Frontend | 3001 | 🟡 60% | Common fallback |
| Backend | 3002 | 🟡 40% | Near conflict zone |

## 📋 **Commands Reference**

### **Primary Commands**
```bash
# Start development (recommended)
./scripts/start-local.sh

# Stop development
./scripts/kill-local-servers.sh
```

### **Alternative Commands**
```bash
# Direct stable port startup
./scripts/start-dev-stable.sh

# Check what's running
ps aux | grep -E "(node|vite)" | grep -v grep
lsof -i :4200 :9002
```

### **Commands to AVOID**
```bash
# ❌ These default to problematic 3000s:
cd frontend && npm run dev    # Defaults to port 3000
npm start                     # May conflict
./scripts/start-dev.sh       # Uses 3000s ports
```

## 🔧 **Troubleshooting**

### **If Ports Are Occupied**
```bash
# Check what's using the ports
lsof -i :4200 :9002

# Kill specific processes
kill -9 $(lsof -ti :4200)
kill -9 $(lsof -ti :9002)

# Or use our cleanup script
./scripts/kill-local-servers.sh
```

### **Port Conflict Prevention**
1. **Always use our scripts** - Don't run npm commands directly
2. **Clean shutdown** - Use `./scripts/kill-local-servers.sh` 
3. **Check before starting** - Verify ports are free
4. **Consistent workflow** - Stick to `./scripts/start-local.sh`

## 📊 **Why These Ports?**

### **Port 4200 (Frontend)**
- Angular's default port
- Much less crowded than 3000
- Stable across different tools

### **Port 9002 (Backend)**
- High port range (9000+)
- Rarely used by other services
- No conflicts with databases or common tools

### **Evidence of 3000s Problems**
Your terminal history shows repeated conflicts:
```
Error: listen EADDRINUSE: address already in use :::3000
Port 3000 is in use, trying another one...
zsh: killed     npm run dev
```

## ✅ **Result**

**Before (3000s)**: Constant port conflicts, random assignments, unreliable startup
**After (4200/9002)**: Stable, predictable, conflict-free development

---

**Remember**: When someone says "run local", always use `./scripts/start-local.sh`! 