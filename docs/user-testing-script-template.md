# 🧪 User Testing Script Template

> **Use this template to generate comprehensive testing scripts for any user-facing changes**

## Pre-Test Setup

### 1. Environment Setup
```bash
# Use stable port strategy to avoid conflicts [[memory:4173922]]
./scripts/start-dev-stable.sh
```

### 2. Prerequisites
- [ ] Backend: http://localhost:9002/api/health (✅ Status: ok)
- [ ] Frontend: http://localhost:4200 (✅ Loading properly)
- [ ] Clean browser state (clear cache/localStorage if testing auth changes)
- [ ] Correct branch: `[BRANCH_NAME]` with latest changes

---

## 🎯 Test Scenarios

### Scenario 1: [PRIMARY_USER_FLOW]
**Objective**: [What are we testing and why]

**Steps**:
1. [Specific action with expected UI state]
2. [Next action with inputs/selections]
3. [Verification step with observable results]

**✅ Expected Results**:
- [Specific positive outcome]
- [UI state change]
- [Data persistence verification]

**❌ Should NOT see**:
- [Known issues this change should fix]
- [Error states or fallback behaviors]

### Scenario 2: [EDGE_CASE_OR_REGRESSION_TEST]
**Objective**: [What edge case or potential regression we're checking]

**Steps**:
1. [Setup steps for edge case]
2. [Action that triggers the edge case]
3. [Verification the system handles it correctly]

**✅ Expected Results**:
- [Graceful handling of edge case]
- [No system errors or crashes]

### Scenario 3: [INTEGRATION_TEST]
**Objective**: [How this change affects other system parts]

**Steps**:
1. [Test interaction with existing features]
2. [Verify no breaking changes to other flows]

---

## 🔍 Verification Checklist

### ✅ Core Functionality
- [ ] [Primary feature works as intended]
- [ ] [No regression in existing features]
- [ ] [Performance remains acceptable]
- [ ] [No console errors or warnings]

### ✅ User Experience  
- [ ] [UI is intuitive and responsive]
- [ ] [Error messages are helpful]
- [ ] [Loading states are appropriate]
- [ ] [Success feedback is clear]

### ✅ Data Integrity
- [ ] [Data saves correctly]
- [ ] [Data displays accurately]
- [ ] [User sessions persist properly]
- [ ] [API responses match expectations]

### ❌ Regression Prevention
- [ ] [No return of previously fixed bugs]
- [ ] [Authentication still secure]
- [ ] [Performance hasn't degraded]
- [ ] [Mobile responsiveness maintained]

---

## 🚨 Troubleshooting

### If [COMMON_ISSUE_1]:
1. **Check**: [Diagnostic step]
2. **Look for**: [Log messages or UI indicators]
3. **Solution**: [How to resolve or workaround]

### If [COMMON_ISSUE_2]:
1. **Check**: [Another diagnostic approach]
2. **Verify**: [Configuration or state check]
3. **Fix**: [Resolution steps]

### General Debugging:
1. **Browser Dev Tools**: Check Console, Network, Application tabs
2. **Backend Logs**: Look for error messages in terminal
3. **Clear State**: Remove localStorage, cookies, restart services
4. **Verify Branch**: Ensure you're testing the correct code version

---

## 📊 Success Criteria

### 🎉 Test PASSES if:
- ✅ [Primary objective achieved]
- ✅ [No regressions detected]  
- ✅ [User experience is smooth]
- ✅ [Performance is acceptable]
- ✅ [Error handling works properly]

### ❌ Test FAILS if:
- [Any blocking issues]
- [Performance degradation]
- [User confusion or frustration]
- [Data loss or corruption]
- [Security vulnerabilities]

---

## 🎯 Testing Timeline
- **Setup**: [X] minutes
- **Core Testing**: [Y] minutes  
- **Edge Cases**: [Z] minutes
- **Verification**: [W] minutes
- **Total**: ~[TOTAL] minutes

---

## 📝 Test Report Template

```
## Test Results for [CHANGE_DESCRIPTION]

**Date**: [DATE]
**Branch**: [BRANCH]
**Tester**: [NAME]

### Results Summary
- ✅/❌ Scenario 1: [RESULT]
- ✅/❌ Scenario 2: [RESULT]  
- ✅/❌ Scenario 3: [RESULT]

### Issues Found
1. [Issue description] - Severity: [High/Medium/Low]
2. [Issue description] - Severity: [High/Medium/Low]

### Recommendation
- [ ] ✅ APPROVED for deployment
- [ ] ❌ NEEDS FIXES before deployment
- [ ] ⚠️ APPROVED with minor issues to address post-deployment

**Notes**: [Additional observations or recommendations]
```

---

## 📋 When to Generate These Scripts

**Always create testing scripts for**:
- 🔐 Authentication/security changes
- 🎨 UI/UX modifications  
- 🔄 API endpoint changes
- 🐛 Bug fixes (verify fix + no regression)
- ✨ New features
- 📱 Mobile responsiveness updates
- ⚡ Performance optimizations
- 🔧 Configuration changes affecting users

**Script complexity should match**:
- **Simple fix** = Quick verification checklist
- **Feature change** = Comprehensive user journey
- **Major update** = Full regression test suite

---

*This template ensures consistent, thorough testing before any user-facing deployment* 🛡️ 