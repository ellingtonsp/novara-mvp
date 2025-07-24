# macOS Port Management Guide

## 🍎 **Why macOS is Different**

macOS has some unique behaviors that can cause port management issues:

### **Common macOS Issues**
1. **Aggressive Process Cleanup**: macOS may kill processes when memory pressure is high
2. **esbuild Orphans**: Vite's esbuild processes can become orphaned and hold ports
3. **System Process Interference**: macOS system processes can interfere with port binding
4. **Sleep/Wake Issues**: Ports may not be properly released after system sleep
5. **Docker/VM Conflicts**: Virtual machines and containers can hold ports

## 🛠️ **macOS Port Manager**

We've created a specialized port manager for macOS that handles these issues:

### **Available Commands**
```bash
# Check current status
./scripts/macos-port-manager.sh status

# Clean ports and processes
./scripts/macos-port-manager.sh clean

# Force cleanup (aggressive)
./scripts/macos-port-manager.sh force

# Verify ports are available
./scripts/macos-port-manager.sh verify
```

### **What It Does**
- ✅ Kills esbuild processes (common macOS issue)
- ✅ Cleans up orphaned Node.js processes
- ✅ Removes Vite processes
- ✅ Handles port conflicts
- ✅ Verifies cleanup success

## 🚀 **Prevention Strategies**

### **1. Always Use the macOS Port Manager**
```bash
# Before starting development
./scripts/macos-port-manager.sh clean

# After stopping development
./scripts/macos-port-manager.sh clean
```

### **2. Use Stable Ports**
We use ports 4200 and 9002 because:
- **Port 4200**: Angular default, less crowded than 3000
- **Port 9002**: High range, rarely used by other services
- **Avoid 3000-3002**: These are commonly used by other development tools

### **3. Proper Shutdown**
```bash
# Always use the proper shutdown script
./scripts/kill-local-servers.sh

# Or use the macOS port manager
./scripts/macos-port-manager.sh clean
```

### **4. Check Before Starting**
```bash
# Verify ports are free before starting
./scripts/macos-port-manager.sh verify

# If ports are busy, clean them
./scripts/macos-port-manager.sh clean
```

## 🔧 **Troubleshooting macOS Issues**

### **Issue: "Port Already in Use"**
```bash
# Check what's using the port
lsof -i :4200
lsof -i :9002

# Clean with macOS port manager
./scripts/macos-port-manager.sh clean

# If that doesn't work, force cleanup
./scripts/macos-port-manager.sh force
```

### **Issue: "Process Killed"**
```bash
# macOS may have killed the process due to memory pressure
# Check for orphaned processes
ps aux | grep -E "(node|vite|esbuild)" | grep -v grep

# Clean up orphans
./scripts/macos-port-manager.sh clean
```

### **Issue: "Cannot Bind to Port"**
```bash
# Check if port is actually free
./scripts/macos-port-manager.sh verify

# If not free, check what's using it
lsof -i :4200 :9002

# Force cleanup
./scripts/macos-port-manager.sh force
```

### **Issue: "Connection Refused"**
```bash
# Process may have been killed by macOS
# Restart the development environment
./scripts/start-dev-stable.sh
```

## 🛡️ **macOS-Specific Best Practices**

### **1. Memory Management**
- Close unnecessary applications before development
- Monitor Activity Monitor for memory pressure
- Restart development if system becomes sluggish

### **2. System Sleep/Wake**
- After waking from sleep, restart development
- macOS may not properly release ports after sleep
```bash
# After waking from sleep
./scripts/macos-port-manager.sh clean
./scripts/start-dev-stable.sh
```

### **3. Docker/VM Awareness**
- If using Docker or VMs, check if they're using ports
- Stop unnecessary containers before development
```bash
# Check Docker containers
docker ps

# Stop containers if needed
docker stop $(docker ps -q)
```

### **4. IDE Integration**
- Some IDEs (like Cursor) may start their own processes
- Check for IDE-related processes
```bash
# Check for IDE processes
ps aux | grep -E "(cursor|vscode|intellij)" | grep -v grep
```

## 📊 **Monitoring Tools**

### **Built-in Monitoring**
```bash
# Check port status
./scripts/macos-port-manager.sh status

# Monitor processes
ps aux | grep -E "(node|vite|esbuild)" | grep -v grep

# Check port usage
lsof -i :4200 :9002
```

### **System Monitoring**
```bash
# Check memory usage
top -l 1 | head -10

# Check network connections
netstat -an | grep LISTEN

# Check for port conflicts
sudo lsof -i -P | grep LISTEN
```

## 🔄 **Automated Solutions**

### **Pre-Start Check**
The `start-dev-stable.sh` script now automatically:
1. Runs macOS port manager cleanup
2. Verifies ports are available
3. Falls back to force cleanup if needed

### **Post-Stop Cleanup**
The `kill-local-servers.sh` script now:
1. Uses macOS port manager for cleanup
2. Falls back to basic cleanup if needed
3. Verifies cleanup success

## 🚨 **Emergency Procedures**

### **When Nothing Works**
```bash
# 1. Force cleanup everything
./scripts/macos-port-manager.sh force

# 2. Restart terminal/terminal app
# 3. Try again
./scripts/start-dev-stable.sh

# 4. If still failing, restart computer
```

### **System-Level Cleanup**
```bash
# Kill all Node.js processes (be careful!)
pkill -f "node"

# Kill all Vite processes
pkill -f "vite"

# Kill all esbuild processes
pkill -f "esbuild"

# Restart development
./scripts/start-dev-stable.sh
```

## 📋 **Daily Workflow for macOS**

### **Morning Setup**
```bash
# 1. Check system status
./scripts/macos-port-manager.sh status

# 2. Clean if needed
./scripts/macos-port-manager.sh clean

# 3. Start development
./scripts/start-dev-stable.sh
```

### **During Development**
```bash
# If you encounter issues:
./scripts/macos-port-manager.sh clean
./scripts/start-dev-stable.sh
```

### **End of Day**
```bash
# 1. Stop development
./scripts/kill-local-servers.sh

# 2. Verify cleanup
./scripts/macos-port-manager.sh verify
```

## 🎯 **Success Metrics**

### **What Success Looks Like**
- ✅ Ports 4200 and 9002 are always available
- ✅ No orphaned processes after shutdown
- ✅ Development starts reliably
- ✅ No "port already in use" errors

### **Warning Signs**
- ⚠️ Frequent "port already in use" errors
- ⚠️ Orphaned processes after shutdown
- ⚠️ Development fails to start
- ⚠️ System becomes sluggish during development

## 🔧 **Advanced Configuration**

### **Custom Port Ranges**
If you need to use different ports:
```bash
# Edit the port manager
nano scripts/macos-port-manager.sh

# Change these lines:
FRONTEND_PORT=4200
BACKEND_PORT=9002
```

### **Additional Process Types**
To handle other process types:
```bash
# Add to the kill_node_processes function
pkill -f "your-process-name" 2>/dev/null || true
```

---

## 🏆 **Summary**

macOS port management requires special attention due to:
- Aggressive process cleanup
- esbuild orphan processes
- System process interference
- Sleep/wake issues

Our macOS Port Manager handles these issues automatically, but you should:
1. **Always use the port manager** before starting development
2. **Monitor for warning signs** of port conflicts
3. **Use proper shutdown procedures** to prevent orphaned processes
4. **Restart development** if you encounter issues

This approach ensures **reliable, conflict-free development** on macOS. 