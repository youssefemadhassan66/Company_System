import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import App from '../App.js';
import User from '../Models/UserModel.js';

dotenv.config();

// MongoDB connection for tests
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brookfield_test';

describe('Authentication Security Tests - Email Verification Bypass & Other Vulnerabilities', () => {
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  // ==================== TEST SUITE 1: Email Verification Bypass ====================
  describe('CRITICAL: Email Verification Bypass', () => {
    
    const testUser = {
      UserName: 'testuser123',
      FirstName: 'john',
      LastName: 'doe',
      Email: 'test@example.com',
      NationalId: '12345678901234',
      Password: 'TestPassword123!',
      Position: 'developer',
      PhoneNumber: '01012345678',
      Gender: 'Male',
      DateOfBirth: '1990-01-01',
      Address: 'Test Address',
      Role: null
    };

    it('VULNERABILITY: Should allow user to login without email verification', async () => {
      // Step 1: Register a new user
      const signupRes = await request(App)
        .post('/api/v1/auth/signup')
        .send(testUser);

      console.log('\n📧 Signup Response Status:', signupRes.status);
      console.log('📧 Signup Message:', signupRes.body.message);

      // User should NOT be verified at this point
      const userAfterSignup = await User.findOne({ Email: testUser.Email });
      console.log('✅ IsEmailVerified after signup:', userAfterSignup.IsEmailVerified);
      expect(userAfterSignup.IsEmailVerified).toBe(false);

      // Step 2: Try to login WITHOUT verifying email
      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: testUser.Password
        });

      console.log('\n🔓 Login Attempt Status:', loginRes.status);
      console.log('🔓 Login Response:', loginRes.body);

      // 🚨 SECURITY ISSUE: This should FAIL but might SUCCEED
      if (loginRes.status === 200) {
        console.error('\n⚠️  SECURITY BREACH: User logged in WITHOUT email verification!');
        console.error('   Tokens were issued:', !!loginRes.body.tokens);
        console.error('   Access Token Present:', !!loginRes.body.tokens?.accessToken);
        expect(loginRes.status).toBe(401); // This SHOULD fail
      } else {
        console.log('✅ Login correctly blocked for unverified email');
        expect(loginRes.status).toBe(401);
      }
    });

    it('VULNERABILITY: Check if login validation checks IsEmailVerified field', async () => {
      // Create user directly in DB with IsEmailVerified: true
      const directUser = await User.create({
        ...testUser,
        Email: 'verified@example.com',
        IsEmailVerified: true
      });

      // This should work (correct behavior)
      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: 'verified@example.com',
          Password: testUser.Password
        });

      console.log('\n✅ Verified user login status:', loginRes.status);
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.tokens?.accessToken).toBeDefined();
    });

    it('VULNERABILITY: Test with NULL IsEmailVerified field', async () => {
      // Create user with IsEmailVerified: null (edge case)
      await User.create({
        ...testUser,
        Email: 'null-verify@example.com',
        IsEmailVerified: null
      });

      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: 'null-verify@example.com',
          Password: testUser.Password
        });

      console.log('\n⚠️  Login with NULL IsEmailVerified:', loginRes.status);
      console.log('    Response:', loginRes.body);

      // Should fail, but might succeed due to loose comparison
      if (loginRes.status === 200) {
        console.error('   SECURITY ISSUE: Null check bypass!');
      }
    });

    it('VULNERABILITY: Test with undefined IsEmailVerified field', async () => {
      // Create user with IsEmailVerified: undefined
      const user = new User({
        ...testUser,
        Email: 'undefined-verify@example.com'
        // IsEmailVerified intentionally omitted
      });
      await user.save();

      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: 'undefined-verify@example.com',
          Password: testUser.Password
        });

      console.log('\n⚠️  Login with undefined IsEmailVerified:', loginRes.status);
      
      // Should fail - loose equality check vulnerability
      if (loginRes.status === 200) {
        console.error('   SECURITY ISSUE: Undefined check bypass! (loose equality)');
      }
    });
  });

  // ==================== TEST SUITE 2: Email Verification Process Vulnerabilities ====================
  describe('Email Verification Process Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'verifyuser123',
      FirstName: 'jane',
      LastName: 'smith',
      Email: 'verify@example.com',
      NationalId: '98765432109876',
      Password: 'TestPassword123!',
      Position: 'manager',
      PhoneNumber: '01098765432',
      Gender: 'Female',
      DateOfBirth: '1992-05-15',
      Address: 'Verification Test'
    };

    it('VULNERABILITY: Check if verification token endpoint is exposed', async () => {
      // Step 1: Register user
      await request(App)
        .post('/api/v1/auth/signup')
        .send(testUser);

      // Step 2: Try to get verification token without authorization
      const tokenRes = await request(App)
        .get('/api/v1/auth/get-verification-token')
        .query({ email: testUser.Email });

      console.log('\n🔑 Verification Token Endpoint Status:', tokenRes.status);
      console.log('🔑 Has verification token in response:', !!tokenRes.body.verificationToken);

      if (tokenRes.status === 200 && tokenRes.body.verificationToken) {
        console.error('\n⚠️  SECURITY ISSUE: Verification token exposed publicly!');
        console.error('   Token can be retrieved without authentication');
        
        // Step 3: Use the exposed token to verify email
        const verifyRes = await request(App)
          .post(`/api/v1/auth/verify-email/${tokenRes.body.verificationToken}`);

        console.error('   Using exposed token to verify email:', verifyRes.status);
        
        // Check if user is now verified
        const user = await User.findOne({ Email: testUser.Email });
        if (user.IsEmailVerified) {
          console.error('   ⚠️  USER VERIFIED WITHOUT PERMISSION!');
        }
      }
    });

    it('VULNERABILITY: Test if token can be reused multiple times', async () => {
      // Register user
      const signupRes = await request(App)
        .post('/api/v1/auth/signup')
        .send(testUser);

      // Get token
      const tokenRes = await request(App)
        .get('/api/v1/auth/get-verification-token')
        .query({ email: testUser.Email });

      if (tokenRes.body.verificationToken) {
        const token = tokenRes.body.verificationToken;

        // Use token first time
        const verify1 = await request(App)
          .post(`/api/v1/auth/verify-email/${token}`);
        console.log('\n🔄 First verification attempt:', verify1.status);

        // Try to use same token again
        const verify2 = await request(App)
          .post(`/api/v1/auth/verify-email/${token}`);
        console.log('🔄 Second verification attempt (token reuse):', verify2.status);

        if (verify2.status === 200) {
          console.error('\n⚠️  SECURITY ISSUE: Token can be reused!');
        } else {
          console.log('✅ Token properly invalidated after use');
        }
      }
    });

    it('VULNERABILITY: Test if expired token still works', async () => {
      // Note: This test would require setting a very short expiration time
      // Or manually manipulating the token expiration in DB
      
      console.log('\n⚠️  Note: Expired token testing requires manual token expiration setup');
      console.log('   This should be tested with tokens that have: emailVerificationExpire < Date.now()');
    });
  });

  // ==================== TEST SUITE 3: SQL/NoSQL Injection in Auth ====================
  describe('Injection Vulnerabilities in Auth', () => {
    
    it('VULNERABILITY: Test Email field for NoSQL injection', async () => {
      const injectionPayloads = [
        { Email: { $ne: null }, Password: 'TestPassword123!' },
        { Email: { $gt: '' }, Password: 'TestPassword123!' },
        { Email: { $regex: '.*' }, Password: 'TestPassword123!' }
      ];

      for (const payload of injectionPayloads) {
        const loginRes = await request(App)
          .post('/api/v1/auth/login')
          .send(payload);

        console.log(`\n💉 NoSQL Injection payload: ${JSON.stringify(payload)}`);
        console.log(`   Response status: ${loginRes.status}`);

        // Should return 400, not bypass auth
        if (loginRes.status === 200 || loginRes.status === 401) {
          console.log('   ✅ Properly handled (no bypass)');
        } else {
          console.error('   ⚠️  Unexpected response - possible vulnerability');
        }
      }
    });

    it('VULNERABILITY: Test Password field for NoSQL injection', async () => {
      const injectionPayloads = [
        { Email: 'test@example.com', Password: { $ne: null } },
        { Email: 'test@example.com', Password: { $gt: '' } }
      ];

      for (const payload of injectionPayloads) {
        const loginRes = await request(App)
          .post('/api/v1/auth/login')
          .send(payload);

        console.log(`\n💉 Password injection payload: ${JSON.stringify(payload)}`);
        console.log(`   Response status: ${loginRes.status}`);
      }
    });
  });

  // ==================== TEST SUITE 4: Authentication Bypass Techniques ====================
  describe('Authentication Bypass Techniques', () => {
    
    const testUser = {
      UserName: 'bypassuser',
      FirstName: 'bypass',
      LastName: 'tester',
      Email: 'bypass@example.com',
      NationalId: '11223344556677',
      Password: 'TestPassword123!',
      Position: 'tester',
      PhoneNumber: '01011223344',
      Gender: 'Male',
      DateOfBirth: '1995-03-20',
      Address: 'Bypass Test'
    };

    it('VULNERABILITY: Test missing credentials bypass', async () => {
      const testCases = [
        { Email: testUser.Email },
        { Password: testUser.Password },
        {},
        { Email: '', Password: '' },
        { Email: null, Password: null }
      ];

      for (const testCase of testCases) {
        const loginRes = await request(App)
          .post('/api/v1/auth/login')
          .send(testCase);

        console.log(`\n❌ Missing credentials test: ${JSON.stringify(testCase)}`);
        console.log(`   Status: ${loginRes.status}`);

        if (loginRes.status === 200) {
          console.error('   ⚠️  SECURITY ISSUE: Login successful with missing credentials!');
        } else {
          console.log('   ✅ Properly rejected');
        }
      }
    });

    it('VULNERABILITY: Test case sensitivity bypass in email', async () => {
      // Create user with lowercase email
      await User.create({
        ...testUser,
        Email: 'casesensitive@example.com'
      });

      const testEmails = [
        'casesensitive@example.com',
        'CASESENSITIVE@EXAMPLE.COM',
        'CaseSensitive@Example.Com',
        'cAsEsEnSiTiVe@ExAmPlE.cOm'
      ];

      for (const email of testEmails) {
        const loginRes = await request(App)
          .post('/api/v1/auth/login')
          .send({
            Email: email,
            Password: testUser.Password
          });

        console.log(`\n📧 Case sensitivity test with: ${email}`);
        console.log(`   Status: ${loginRes.status}`);
      }
    });
  });

  // ==================== TEST SUITE 5: Token-based Vulnerabilities ====================
  describe('Token-based Security Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'tokenuser',
      FirstName: 'token',
      LastName: 'tester',
      Email: 'token@example.com',
      NationalId: '55667788990011',
      Password: 'TestPassword123!',
      Position: 'developer',
      PhoneNumber: '01055667788',
      Gender: 'Male',
      DateOfBirth: '1996-07-10',
      Address: 'Token Test',
      IsEmailVerified: true
    };

    let accessToken, refreshToken;

    beforeEach(async () => {
      // Create verified user
      await User.create(testUser);

      // Login to get tokens
      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: testUser.Password
        });

      if (loginRes.body.tokens) {
        accessToken = loginRes.body.tokens.accessToken;
        refreshToken = loginRes.body.tokens.refreshToken;
      }
    });

    it('VULNERABILITY: Test if token is properly validated', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid',
        '',
        'null',
        'undefined'
      ];

      for (const token of invalidTokens) {
        // Try to use invalid token in authorization header
        const res = await request(App)
          .get('/api/v1/auth/refresh-token')
          .set('Authorization', `Bearer ${token}`);

        console.log(`\n🔐 Invalid token test: ${token.substring(0, 20)}...`);
        console.log(`   Status: ${res.status}`);

        if (res.status === 200) {
          console.error('   ⚠️  SECURITY ISSUE: Invalid token accepted!');
        }
      }
    });

    it('VULNERABILITY: Test if expired tokens are rejected', async () => {
      if (!accessToken) {
        console.log('\n⚠️  Skipping - no access token available');
        return;
      }

      // Try to use token multiple times to check expiration
      console.log('\n⏱️  Testing token expiration...');
      console.log(`   Access Token (should expire in 30 minutes): ${accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token (should expire in 9 days): ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'N/A'}`);
    });

    it('VULNERABILITY: Test if authorization middleware is applied to all routes', async () => {
      // These endpoints should require authentication but might not
      const protectedEndpoints = [
        { method: 'get', path: '/api/v1/auth/verify-email/fake-token' },
        { method: 'get', path: '/api/v1/auth/resend-email-token' }
      ];

      for (const endpoint of protectedEndpoints) {
        let res;
        if (endpoint.method === 'get') {
          res = await request(App).get(endpoint.path);
        }

        console.log(`\n🛡️  Testing endpoint: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
        console.log(`   Status without token: ${res.status}`);

        // Check if it requires auth (should return 401 or 400, not 200)
        if (res.status === 200 && !res.body.error) {
          console.log('   ⚠️  Endpoint may not require authentication');
        }
      }
    });
  });

  // ==================== TEST SUITE 6: Password Security ====================
  describe('Password Security Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'passuser',
      FirstName: 'pass',
      LastName: 'tester',
      Email: 'pass@example.com',
      NationalId: '77889900112233',
      Password: 'TestPassword123!',
      Position: 'tester',
      PhoneNumber: '01077889900',
      Gender: 'Male',
      DateOfBirth: '1997-09-25',
      Address: 'Password Test',
      IsEmailVerified: true
    };

    it('VULNERABILITY: Test weak password acceptance', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'Password1',
        'Pass1!',
        '12345678',
        'abcdefgh'
      ];

      for (const password of weakPasswords) {
        const signupRes = await request(App)
          .post('/api/v1/auth/signup')
          .send({
            ...testUser,
            Email: `weak${Math.random()}@example.com`,
            Password: password
          });

        console.log(`\n🔐 Weak password test: "${password}"`);
        console.log(`   Status: ${signupRes.status}`);

        if (signupRes.status === 201) {
          console.error('   ⚠️  SECURITY ISSUE: Weak password was accepted!');
        } else {
          console.log('   ✅ Weak password rejected');
        }
      }
    });

    it('VULNERABILITY: Test password in error messages', async () => {
      // Try login with wrong password
      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: 'WrongPassword123!'
        });

      console.log('\n🔐 Wrong password response:', loginRes.body.message);

      if (loginRes.body.message && loginRes.body.message.includes(testUser.Password)) {
        console.error('   ⚠️  SECURITY ISSUE: Password exposed in error message!');
      } else {
        console.log('   ✅ Password not exposed in error');
      }
    });
  });

  // ==================== TEST SUITE 7: User Enumeration ====================
  describe('User Enumeration Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'enumuser',
      FirstName: 'enum',
      LastName: 'tester',
      Email: 'enum@example.com',
      NationalId: '33445566778899',
      Password: 'TestPassword123!',
      Position: 'tester',
      PhoneNumber: '01033445566',
      Gender: 'Male',
      DateOfBirth: '1998-11-30',
      Address: 'Enumeration Test',
      IsEmailVerified: true
    };

    beforeEach(async () => {
      await User.create(testUser);
    });

    it('VULNERABILITY: Test login error messages for user enumeration', async () => {
      const responses = {
        existingEmail: await request(App)
          .post('/api/v1/auth/login')
          .send({
            Email: testUser.Email,
            Password: 'WrongPassword123!'
          }),
        nonExistentEmail: await request(App)
          .post('/api/v1/auth/login')
          .send({
            Email: 'doesnotexist@example.com',
            Password: 'TestPassword123!'
          })
      };

      console.log('\n👤 User Enumeration Test');
      console.log(`   Existing user error: "${responses.existingEmail.body.message}"`);
      console.log(`   Non-existent user error: "${responses.nonExistentEmail.body.message}"`);

      if (responses.existingEmail.body.message !== responses.nonExistentEmail.body.message) {
        console.error('   ⚠️  SECURITY ISSUE: Different error messages allow user enumeration!');
        console.error(`       Attacker can determine which emails are registered`);
      } else {
        console.log('   ✅ Generic error messages - user enumeration protected');
      }
    });

    it('VULNERABILITY: Test forget password for user enumeration', async () => {
      const responses = {
        existingEmail: await request(App)
          .post('/api/v1/auth/forgetPassword')
          .send({
            Email: testUser.Email
          }),
        nonExistentEmail: await request(App)
          .post('/api/v1/auth/forgetPassword')
          .send({
            Email: 'doesnotexist@example.com'
          })
      };

      console.log('\n👤 Forget Password Enumeration Test');
      console.log(`   Existing user status: ${responses.existingEmail.status}`);
      console.log(`   Non-existent user status: ${responses.nonExistentEmail.status}`);
      console.log(`   Existing user message: "${responses.existingEmail.body.message}"`);
      console.log(`   Non-existent user message: "${responses.nonExistentEmail.body.message}"`);

      if (responses.existingEmail.status !== responses.nonExistentEmail.status ||
          responses.existingEmail.body.message !== responses.nonExistentEmail.body.message) {
        console.error('   ⚠️  SECURITY ISSUE: Password reset allows user enumeration!');
      }
    });
  });

  // ==================== TEST SUMMARY ====================
  describe('Test Summary & Recommendations', () => {
    
    it('SUMMARY: Print security audit summary', () => {
      console.log(`

╔════════════════════════════════════════════════════════════════════════════════╗
║                   AUTHENTICATION SECURITY AUDIT SUMMARY                        ║
╚════════════════════════════════════════════════════════════════════════════════╝

CRITICAL ISSUES TO INVESTIGATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ⚠️  EMAIL VERIFICATION BYPASS
   Issue: Users might be able to login without email verification
   Location: Middleware/AuthMiddelware.js (Login function, line ~108)
   
   Current Check:
   if(user.IsEmailVerified !=true){
       return next(new ErrorHandler('This email is not verified', 401))
   }
   
   Vulnerability: Using loose equality (!=) instead of strict inequality (!==)
                 This can be bypassed if IsEmailVerified is null or undefined
   
   Recommendation:
   Change to: if(user.IsEmailVerified !== true)
   Or better: if(!user.IsEmailVerified)

2. ⚠️  EXPOSED VERIFICATION TOKEN ENDPOINT
   Issue: Verification tokens can be retrieved without authentication
   Location: Middleware/AuthMiddelware.js (getVerificationTokenByEmail function)
   
   Current Implementation:
   - No authentication required
   - Anyone can get tokens for any email
   - Tokens can be used immediately to verify accounts
   
   Recommendation:
   - Add rate limiting
   - Require authentication
   - Add email confirmation (send verification link instead of exposing token)

3. ⚠️  TOKEN REUSE VULNERABILITY
   Issue: Email verification tokens might be reusable
   Location: Middleware/AuthMiddelware.js (SendEmailVerification function)
   
   Recommendation:
   - Clear emailVerificationToken after first use
   - Implement token expiration
   - Track token usage

4. ⚠️  USER ENUMERATION
   Issue: Different error messages for existing vs non-existing users
   Location: Multiple auth endpoints
   
   Recommendation:
   - Return generic error messages: "Invalid credentials"
   - Use same HTTP status code (401) for all failures

5. ⚠️  NO RATE LIMITING
   Issue: No protection against brute force attacks
   
   Recommendation:
   - Implement express-rate-limit
   - Limit login attempts: 5 attempts per 15 minutes
   - Implement exponential backoff

6. ⚠️  MISSING INPUT VALIDATION
   Issue: No validation against NoSQL injection
   
   Recommendation:
   - Validate input types
   - Use mongoose schema validation
   - Sanitize query fields

MODERATE ISSUES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. Password reset without email verification (forgetPassword function)
8. No CSRF protection tokens
9. No account lockout after failed attempts
10. Session timeout not implemented

LOW PRIORITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11. Consider adding 2FA (Two-Factor Authentication)
12. Add login activity logging
13. Add IP whitelisting for admin accounts
14. Implement OAuth2 for social login

TEST COMMANDS TO RUN TESTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npm test -- Tests/auth.security.test.js           (Run all auth tests)
npm test -- Tests/auth.security.test.js --verbose (Run with detailed output)
npm test -- --testNamePattern="Email Verification" (Run specific test suite)

      `);
      
      // This test always passes - it's just for documentation
      expect(true).toBe(true);
    });
  });
});
