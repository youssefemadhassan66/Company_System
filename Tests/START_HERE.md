# 🚀 Getting Started - Security Tests

## Quick Setup (5 minutes)

### Step 1: Start MongoDB

**Option A: MongoDB Not Installed?**
Use MongoDB Atlas (Free Cloud Version) - Recommended ✅
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (free tier)
4. Get connection string
5. Add to `.env`: `MONGODB_URI=your_connection_string`

**Option B: Install MongoDB Locally**
Windows:
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Install MongoDB as a Service"
4. Complete installation
5. Open Command Prompt and run: `mongod`

macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

Linux:
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

**Option C: Use Docker (if installed)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

You should see:
```
waiting for connections on port 27017
```

### Step 2: Run Tests
```bash
# In your project terminal, run:
npm test -- Tests/auth.security.test.js

# Or with verbose output:
npm test -- Tests/auth.security.test.js --verbose
```

### Step 3: Review Results
Look for vulnerabilities marked with:
- ✅ Green = Security working correctly
- ⚠️  Yellow = Vulnerability found
- 🚨 Red = Critical issue

### Step 4: Fix Issues
1. Read `Tests/SECURITY_TEST_README.md` for detailed explanations
2. Read `Tests/EMAIL_VERIFICATION_BYPASS_FIX.md` for the critical bug
3. Apply fixes from the documentation
4. Re-run tests to verify

## 📋 Files You Created

| File | Purpose | Priority |
|------|---------|----------|
| `auth.security.test.js` | 30+ core security tests | ✅ Run first |
| `advanced.security.test.js` | 15+ advanced attack tests | Run after core |
| `SETUP_AND_RUN.md` | Setup & troubleshooting | 📖 Read if issues |
| `SECURITY_TEST_README.md` | Complete vulnerability guide | 📖 Read for fixes |
| `EMAIL_VERIFICATION_BYPASS_FIX.md` | Critical bug fix guide | 🚨 Most important |
| `QUICK_REFERENCE.md` | Commands & FAQ | 📖 For reference |
| `README.md` | Overview | 📖 For context |
| `TEST_SUMMARY.md` | Test structure | 📖 For planning |

## 🎯 What to Do First

### Right Now
1. **MongoDB Setup (5-10 minutes)**
   - ⭐ Easiest: Use MongoDB Atlas (cloud, no installation)
   - See: [`../MONGODB_QUICK_SETUP.md`](../MONGODB_QUICK_SETUP.md)
   - Or: [`../MONGODB_SETUP.md`](../MONGODB_SETUP.md) for detailed guide

2. **Run Tests** (Once MongoDB is set up)
   ```bash
   npm test -- Tests/auth.security.test.js
   ```

### Once Tests Run
1. Review test output
2. Open `Tests/SECURITY_TEST_README.md`
3. Find your issues in that file
4. Follow the fix instructions

### For Critical Bug
1. Open `Tests/EMAIL_VERIFICATION_BYPASS_FIX.md`
2. Find vulnerable code (shown in file)
3. Apply recommended fix
4. Re-run tests

## ⚡ Commands You Need

```bash
# Start MongoDB (in separate terminal)
mongod

# Run security tests
npm test -- Tests/auth.security.test.js

# Run with verbose output
npm test -- Tests/auth.security.test.js --verbose

# Run specific test
npm test -- Tests/auth.security.test.js --testNamePattern="Email"

# Run advanced tests
npm test -- Tests/advanced.security.test.js
```

## ❓ Having Issues?

### Tests won't run
→ Open `Tests/SETUP_AND_RUN.md` - Troubleshooting section

### Don't understand output  
→ Open `Tests/QUICK_REFERENCE.md` - "Test Output Interpretation"

### Can't find vulnerable code
→ Open `Tests/SECURITY_TEST_README.md` - Shows exact code locations

### Need to fix something
→ Open `Tests/EMAIL_VERIFICATION_BYPASS_FIX.md` - Complete fix guide

## 📊 Test Structure

```
Your Tests/ folder contains:

1. TWO TEST FILES:
   ├─ auth.security.test.js (30+ tests)
   │  └─ Email verification, injection, tokens, etc.
   └─ advanced.security.test.js (15+ tests)
      └─ Advanced attacks, race conditions, etc.

2. FIVE DOCUMENTATION FILES:
   ├─ README.md (this overview)
   ├─ SETUP_AND_RUN.md (how to run)
   ├─ QUICK_REFERENCE.md (commands & FAQ)
   ├─ SECURITY_TEST_README.md (vulnerabilities guide)
   ├─ EMAIL_VERIFICATION_BYPASS_FIX.md (critical fix)
   └─ TEST_SUMMARY.md (test details)

3. CONFIGURATION FILES (updated):
   ├─ jest.config.json (Jest setup)
   └─ package.json (test script updated)
```

## ✅ Pre-Test Checklist

Before running tests:
- [ ] MongoDB installed or MongoDB Atlas account set up
- [ ] Node.js 14+ installed
- [ ] Dependencies installed: `npm install`
- [ ] MongoDB running: `mongod` (if using local)
- [ ] Terminal in project directory
- [ ] Read `Tests/SETUP_AND_RUN.md`

## 🎯 Expected Timeline

- **Understanding:** 5 minutes (read README.md)
- **Setup:** 5 minutes (start MongoDB, run npm test)
- **Initial Run:** 1-2 minutes (tests execute)
- **Review:** 10 minutes (read output and documentation)
- **Fix Issues:** 30 minutes (apply all fixes)
- **Verification:** 5 minutes (re-run tests)

**Total: ~1 hour** for first-time complete setup and fix

## 🚀 Next Step

1. **Right now:** Open `Tests/SETUP_AND_RUN.md`
2. **Follow the setup instructions**
3. **Run the first test**
4. **Review the results**
5. **Start fixing issues**

That's it! You have everything you need. 🔐

---

**Test Suite Version:** 1.0  
**Status:** Ready to use  
**Total Tests:** 45+  
**Documentation:** 2500+ words  
**Estimated Fix Time:** 1-2 hours for all issues
