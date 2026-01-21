# 🔐 Security Test Suite - Setup & Configuration

## ⚠️ Important: MongoDB Required

These tests require MongoDB to be running. Before running tests, ensure:

### Option 1: MongoDB Atlas (Cloud) - Recommended ✅
No installation needed! Free tier available.
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account and cluster (5 minutes)
3. Get connection string
4. Add to `.env`: `MONGODB_URI=your_connection_string`

### Option 2: Install MongoDB Locally
**See complete guide:** [`../MONGODB_SETUP.md`](../MONGODB_SETUP.md)

Windows:
```bash
# Download: https://www.mongodb.com/try/download/community
# Run installer → Install as Service
mongod
```

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

### Option 3: Docker
```bash
docker run -d -p 27017:27017 mongo
```

## 🚀 Running the Tests

### Prerequisites
1. **MongoDB running** (local or Atlas)
2. **Node.js 14+** installed
3. **Dependencies installed**: `npm install`

### Run Tests
```bash
# Run all security tests
npm test -- Tests/auth.security.test.js

# Run with verbose output
npm test -- Tests/auth.security.test.js --verbose

# Run specific test suite
npm test -- Tests/auth.security.test.js --testNamePattern="Email Verification"

# Run advanced tests
npm test -- Tests/advanced.security.test.js
```

## 📦 What the Tests Do

1. **Connect to MongoDB** - Creates a test database
2. **Run Security Tests** - Tests for vulnerabilities
3. **Clean Up** - Removes all test data
4. **Report Findings** - Shows vulnerabilities found

## 🔧 Configuration Files

### jest.config.json
- Configured for Node.js ES modules
- 30 second timeout for long-running tests
- Force exit after tests complete

### package.json
- Updated test script to support ES modules
- Uses Node.js experimental VM modules flag

## 🐛 Troubleshooting

### Issue: "Cannot use import statement outside a module"
**Solution:** This should be fixed with the updated jest.config.json and package.json scripts.

### Issue: Tests hang/timeout
**Solution:** MongoDB is not running
```bash
# Make sure MongoDB is running:
mongod
```

### Issue: "Connection timeout to MongoDB"
**Solution:** Check MongoDB connection string in .env:
```
MONGODB_URI=mongodb://localhost:27017/brookfield_test
```

### Issue: Port 27017 already in use
**Solution:** MongoDB is already running (OK) or another service is using it
```bash
# Check if mongod is running:
tasklist | findstr mongod  # Windows

# If needed, connect to different port:
mongod --port 27018
# Then update MONGODB_URI in .env
```

## 📝 Environment Setup

Create `.env.test` file (optional, for test-specific config):
```
MONGODB_URI=mongodb://localhost:27017/brookfield_test
NODE_ENV=test
JWT_TOKEN_SECRET=test_secret
JWT_REFRESH_TOKEN_SECRET=test_refresh_secret
JWT_TOKEN_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=9d
```

## ✅ Expected Output

When tests run successfully, you'll see:
```
✓ Email Verification Bypass (5 tests)
✓ Email Verification Process (3 tests)
✓ Injection Vulnerabilities (2 tests)
...
```

Then for each test:
```
✅ Login correctly blocked for unverified email
⚠️  SECURITY ISSUE: User logged in WITHOUT email verification!
```

## 📊 Test Output Explained

### Green ✅ Output
```
✅ Login correctly blocked for unverified email
```
Security measure is working correctly.

### Red ⚠️ Output  
```
⚠️  SECURITY ISSUE: User logged in WITHOUT email verification!
```
Vulnerability found - needs to be fixed.

### 🚨 Critical Output
```
🚨 CRITICAL: User2 email verified without confirmation!
```
Critical security vulnerability - fix immediately.

## 🎯 Next Steps

1. **Ensure MongoDB is running**
   ```bash
   mongod
   ```

2. **Run the tests**
   ```bash
   npm test -- Tests/auth.security.test.js
   ```

3. **Review the output** for vulnerabilities

4. **Fix issues** following the guides in:
   - `Tests/EMAIL_VERIFICATION_BYPASS_FIX.md`
   - `Tests/SECURITY_TEST_README.md`

5. **Re-run tests** to verify fixes

## 📞 Common Commands

```bash
# Run core security tests
npm test -- Tests/auth.security.test.js

# Run advanced security tests
npm test -- Tests/advanced.security.test.js

# Run specific test suite
npm test -- Tests/auth.security.test.js --testNamePattern="Email"

# Run with less output
npm test -- Tests/auth.security.test.js --silent

# Run with coverage
npm test -- Tests/auth.security.test.js --coverage
```

## ✨ Test Suite Files

- `auth.security.test.js` - Main security tests (30+ test cases)
- `advanced.security.test.js` - Advanced scenarios (15+ test cases)
- `jest.config.json` - Jest configuration
- `README.md` - Overview
- `QUICK_REFERENCE.md` - Quick reference guide
- `SECURITY_TEST_README.md` - Complete guide
- `EMAIL_VERIFICATION_BYPASS_FIX.md` - Critical bug fix

## 🚀 Quick Start

```bash
# 1. Start MongoDB
mongod

# 2. In another terminal, run tests
npm test -- Tests/auth.security.test.js

# 3. Review results
# Look for ⚠️ and 🚨 markers

# 4. Read fix guides
# Open Tests/SECURITY_TEST_README.md

# 5. Apply fixes
# Follow the code examples in documentation

# 6. Re-run tests
# npm test -- Tests/auth.security.test.js
```

## 📚 Learn More

- Read: `Tests/README.md` - Complete overview
- Read: `Tests/QUICK_REFERENCE.md` - Commands and FAQ
- Read: `Tests/EMAIL_VERIFICATION_BYPASS_FIX.md` - Critical bug details
- Read: `Tests/SECURITY_TEST_README.md` - All vulnerabilities explained

---

**Status:** Ready to run (requires MongoDB)  
**Test Cases:** 45+  
**Documentation:** 2500+ words
