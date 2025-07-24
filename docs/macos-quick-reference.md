# macOS Port Management - Quick Reference

## 🚨 **When Local Breaks Again**

### **Quick Fix (Most Common)**
```bash
# 1. Clean everything
./scripts/macos-port-manager.sh clean

# 2. Start development
./scripts/start-dev-stable.sh
```

### **If That Doesn't Work**
```bash
# 1. Force cleanup
./scripts/macos-port-manager.sh force

# 2. Start development
./scripts/start-dev-stable.sh
```

### **Emergency Fix**
```bash
# 1. Kill everything
pkill -f "node"
pkill -f "vite"
pkill -f "esbuild"

# 2. Restart development
./scripts/start-dev-stable.sh
```

## 🔍 **Diagnosis Commands**

### **Check What's Wrong**
```bash
# Check port status
./scripts/macos-port-manager.sh status

# Check what's using ports
lsof -i :4200 :9002

# Check for orphaned processes
ps aux | grep -E "(node|vite|esbuild)" | grep -v grep
```

### **Check System Health**
```bash
# Check memory usage
top -l 1 | head -5

# Check network connections
netstat -an | grep LISTEN | grep -E "(4200|9002)"
```

## 🛠️ **Daily Commands**

### **Morning Setup**
```bash
./scripts/macos-port-manager.sh clean
./scripts/start-dev-stable.sh
```

### **End of Day**
```bash
./scripts/kill-local-servers.sh
```

### **When Issues Occur**
```bash
./scripts/macos-port-manager.sh clean
./scripts/start-dev-stable.sh
```

## 🍎 **Why macOS is Different**

- **Aggressive Process Cleanup**: macOS kills processes when memory is low
- **esbuild Orphans**: Vite processes can become orphaned
- **Sleep/Wake Issues**: Ports may not release after sleep
- **System Interference**: macOS system processes can interfere

## 🎯 **Prevention Tips**

1. **Always use proper shutdown**: `./scripts/kill-local-servers.sh`
2. **Check before starting**: `./scripts/macos-port-manager.sh status`
3. **Close unnecessary apps** before development
4. **Restart after sleep/wake** cycles
5. **Monitor memory usage** in Activity Monitor

## 📞 **When to Get Help**

- Ports still busy after force cleanup
- Development won't start after restart
- Frequent "port already in use" errors
- System becomes sluggish during development

---

**Remember**: The macOS Port Manager handles most issues automatically. Just run `./scripts/macos-port-manager.sh clean` when things break! 