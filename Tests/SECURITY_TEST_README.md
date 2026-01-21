# Authentication Security Test Suite

This directory contains comprehensive test cases for identifying security vulnerabilities in the Brookfield System's authentication flow, particularly focusing on email verification bypass and other security leaks.

## 📋 Test Files

### 1. **auth.security.test.js** - Core Security Tests
Main test file covering the primary authentication vulnerabilities.

#### Test Suites Included:
- **Email Verification Bypass** - Tests if users can login without email verification
  - Direct login without verification
  - Null/Undefined IsEmailVerified field bypass
  - Loose equality comparison vulnerabilities
  
- **Email Verification Process Vulnerabilities** - Tests the verification endpoint
  - Exposed verification token endpoint
  - Token reuse attacks
  - Expired token handling
  
- **Injection Vulnerabilities** - Tests for NoSQL injection
  - Email field NoSQL injection
  - Password field NoSQL injection
  - Operator injection ($ne, $gt, $regex)
  
- **Authentication Bypass Techniques** - Tests common bypass methods
  - Missing credentials
  - Case sensitivity bypass
  - Empty/null field bypass
  
- **Token-based Vulnerabilities** - Tests JWT/token security
  - Invalid token validation
  - Expired token handling
  - Authorization middleware application
  
- **Password Security** - Tests password requirements
  - Weak password acceptance
  - Password in error messages
  
- **User Enumeration** - Tests for information disclosure
  - Different error messages for existing/non-existing users
  - Password reset enumeration

### 2. **advanced.security.test.js** - Advanced Attack Scenarios
Advanced test cases simulating real-world attacks.

#### Test Suites Included:
- **Unauthorized Email Verification Attack** - Tests cross-user verification
  - Verifying someone else's email
  - Immediate login after verification
  
- **Database Manipulation** - Tests direct database access
  - Setting IsEmailVerified directly
  - Missing field validations
  
- **Token Manipulation** - Tests JWT manipulation
  - Modified JWT payload
  - Authorization header edge cases
  - Refresh token endpoint protection
  
- **Race Conditions** - Tests concurrent access issues
  - Simultaneous email verification
  - Simultaneous login during verification
  
- **Business Logic Bypass** - Tests workflow circumvention
  - Accessing features before email verification
  - Password reset on unverified accounts
  
- **Information Disclosure** - Tests response leakage
  - Sensitive data in responses
  - Error stack trace exposure
  
- **Default Credentials & Backdoors** - Tests for default accounts
  - Common default credentials
  - Backdoor endpoint detection

## 🚀 Running the Tests

### Install Dependencies (if not already installed)
```bash
npm install jest supertest
```

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
# Core security tests
npm test -- Tests/auth.security.test.js

# Advanced security tests
npm test -- Tests/advanced.security.test.js
```

### Run Tests with Verbose Output
```bash
npm test -- Tests/auth.security.test.js --verbose
```

### Run Specific Test Suite
```bash
# Email verification bypass tests
npm test -- Tests/auth.security.test.js --testNamePattern="Email Verification Bypass"

# User enumeration tests
npm test -- Tests/auth.security.test.js --testNamePattern="User Enumeration"
```

### Run with Coverage Report
```bash
npm test -- Tests/auth.security.test.js --coverage
```

## ⚠️ Critical Issues Found

### 1. **EMAIL VERIFICATION BYPASS** (CRITICAL)
**Location:** `Middleware/AuthMiddelware.js` (Login function, line ~108)

**Current Code:**
```javascript
if(user.IsEmailVerified !=true){
    return next(new ErrorHandler('This email is not verified', 401))
}
```

**Issue:** 
- Uses loose inequality (`!=`) instead of strict (`!==`)
- Allows bypass when IsEmailVerified is `null` or `undefined`
- `null != true` evaluates to `true` (bypasses check)
- `undefined != true` evaluates to `true` (bypasses check)

**Fix:**
```javascript
if(user.IsEmailVerified !== true) {
    return next(new ErrorHandler('This email is not verified', 401))
}
// Or better:
if(!user.IsEmailVerified) {
    return next(new ErrorHandler('This email is not verified', 401))
}
```

### 2. **EXPOSED VERIFICATION TOKEN ENDPOINT** (CRITICAL)
**Location:** `Middleware/AuthMiddelware.js` (getVerificationTokenByEmail function)

**Issues:**
- No authentication required on `/api/v1/auth/get-verification-token`
- Anyone can retrieve verification tokens for any email
- Tokens can be used immediately to verify arbitrary accounts
- Enables account takeover attacks

**Recommendations:**
- Add authentication requirement
- Implement rate limiting
- Send verification link via email instead of exposing token
- Add CAPTCHA verification

### 3. **TOKEN REUSE VULNERABILITY** (HIGH)
**Location:** `Middleware/AuthMiddelware.js` (SendEmailVerification function)

**Issue:**
- Verification tokens are not invalidated after first use
- Same token can be used multiple times

**Fix:**
```javascript
const SendEmailVerification = wrapAsync(async (req,res,next)=>{
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')
    
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() }
    })
 
    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }

    user.IsEmailVerified = true
    // ADD THIS: Clear the token after use
    user.emailVerificationToken = undefined
    user.emailVerificationExpire = undefined
    await user.save()
    
    CreateAndSendTokens(user, 200, req, res)
})
```

### 4. **USER ENUMERATION** (MEDIUM)
**Location:** Multiple auth endpoints

**Issue:**
- Different error messages for existing vs. non-existing users
- Allows attackers to enumerate valid email addresses

**Current Code:**
```javascript
if (!user) {
    return next(new ErrorHandler('This email is not found', 401))
}
if(user.IsEmailVerified !=true){
    return next(new ErrorHandler('This email is not verified', 401))
}
```

**Fix:**
```javascript
if (!user || !await user.matchUserPassword(Password)) {
    return next(new ErrorHandler('Invalid credentials', 401))
}
// Always use same message for all failure cases
```

### 5. **NO RATE LIMITING** (MEDIUM)
No protection against brute force attacks on login/signup endpoints.

**Recommendation:**
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

router.post('/login', loginLimiter, Login);
router.post('/signup', rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }), signup);
```

### 6. **NO CSRF PROTECTION** (MEDIUM)
State-changing operations (logout, password reset) should use CSRF tokens.

### 7. **NO ACCOUNT LOCKOUT** (LOW)
No mechanism to lock accounts after multiple failed login attempts.

## 📊 Test Results Interpretation

### Understanding Test Output

When you run the tests, you'll see detailed output indicating:

**✅ PASS** - Security measure is properly implemented
**⚠️ FAIL** - Potential security vulnerability found
**🚨 CRITICAL** - Severe vulnerability that allows unauthorized access

### Common Issues to Look For

1. **Status Code 200 on Login**: User logged in without email verification
2. **Tokens in Response**: Successful authentication occurred when it shouldn't
3. **Different Error Messages**: Allows user enumeration attacks
4. **No Rate Limiting**: Endpoint can be attacked with brute force
5. **Exposed Endpoints**: Debug/admin endpoints accessible without auth

## 🔧 Configuration for Testing

### Environment Variables
Create a `.env.test` file:
```
MONGODB_URI=mongodb://localhost:27017/brookfield_test
NODE_ENV=test
JWT_TOKEN_SECRET=test_secret_key
JWT_REFRESH_TOKEN_SECRET=test_refresh_secret
JWT_TOKEN_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=9d
```

### Database Setup
Tests use separate test database. Ensure MongoDB is running:
```bash
# Windows
mongod

# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## 📝 Test Writing Guidelines

When adding new security tests:

1. **Be specific about the vulnerability**
   ```javascript
   it('VULNERABILITY: Specific attack vector description', async () => {
     // Test code
   });
   ```

2. **Log what you're testing**
   ```javascript
   console.log('\n🔓 Testing: Can attacker bypass X?');
   ```

3. **Show the impact**
   ```javascript
   if (vulnerability) {
     console.error('\n⚠️  CRITICAL: This allows attacker to do Y!');
   }
   ```

4. **Document the expected behavior**
   ```javascript
   // Should return 401, not bypass
   expect(response.status).toBe(401);
   ```

## 🛡️ Security Best Practices

Based on these tests, implement:

1. ✅ **Strict Equality Checks**: Use `!==` instead of `!=`
2. ✅ **Email Verification Required**: Block all operations until verified
3. ✅ **One-Time Tokens**: Invalidate tokens after use
4. ✅ **Rate Limiting**: Protect brute force attacks
5. ✅ **Generic Error Messages**: Prevent user enumeration
6. ✅ **CSRF Tokens**: Protect state-changing operations
7. ✅ **Account Lockout**: Lock after failed attempts
8. ✅ **Secure Headers**: Add helmet.js middleware
9. ✅ **HTTPS Only**: Use secure cookies
10. ✅ **Log Security Events**: Track auth failures

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Security](https://tools.ietf.org/html/rfc7519)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

## 📧 For Questions

Each test includes detailed comments explaining:
- What vulnerability is being tested
- How the attack works
- What the proper behavior should be
- How to fix the issue

Review the test output and comments for detailed findings.
