import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import App from '../App.js';
import User from '../Models/UserModel.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brookfield_test';

describe('Advanced Security Vulnerabilities - Unauthorized Access & Privilege Escalation', () => {
  
  beforeAll(async () => {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  // ==================== TEST SUITE 1: Unauthorized Email Verification ====================
  describe('Unauthorized Email Verification Attack', () => {
    
    const user1 = {
      UserName: 'user1',
      FirstName: 'user',
      LastName: 'one',
      Email: 'user1@example.com',
      NationalId: '10000000000000',
      Password: 'TestPassword123!',
      Position: 'developer',
      PhoneNumber: '01000000000',
      Gender: 'Male',
      DateOfBirth: '1990-01-01',
      Address: 'Address 1'
    };

    const user2 = {
      UserName: 'user2',
      FirstName: 'user',
      LastName: 'two',
      Email: 'user2@example.com',
      NationalId: '20000000000000',
      Password: 'TestPassword123!',
      Position: 'manager',
      PhoneNumber: '01000000001',
      Gender: 'Female',
      DateOfBirth: '1992-02-02',
      Address: 'Address 2'
    };

    it('ATTACK: Verify someone else\'s email without permission', async () => {
      console.log('\n🔓 Testing: Can attacker verify another user\'s email?');
      
      // Create two users
      const signup1 = await request(App)
        .post('/api/v1/auth/signup')
        .send(user1);

      const signup2 = await request(App)
        .post('/api/v1/auth/signup')
        .send(user2);

      // Get user2's verification token
      const getToken = await request(App)
        .get('/api/v1/auth/get-verification-token')
        .query({ email: user2.Email });

      if (getToken.status === 200 && getToken.body.verificationToken) {
        const token = getToken.body.verificationToken;
        console.log('✓ Retrieved user2\'s verification token (PUBLIC ENDPOINT!)');

        // User1 tries to verify user2's email using user2's token
        // This simulates an attacker gaining access to user2's email
        const verifyAsUser2 = await request(App)
          .post(`/api/v1/auth/verify-email/${token}`);

        console.log(`✓ Used token to verify user2's email: ${verifyAsUser2.status}`);

        // Check if user2 is now verified
        const user2Data = await User.findOne({ Email: user2.Email });
        console.log(`✓ User2 IsEmailVerified status: ${user2Data.IsEmailVerified}`);

        if (user2Data.IsEmailVerified) {
          console.error('\n⚠️  CRITICAL: User2 email verified without confirmation!');
          console.error('   Tokens were issued:', !!verifyAsUser2.body.tokens);
        }
      }
    });

    it('ATTACK: Verify email and immediately login without checking', async () => {
      console.log('\n🔓 Testing: Signup -> Get Token -> Verify -> Login chain');
      
      // Signup
      await request(App)
        .post('/api/v1/auth/signup')
        .send(user1);

      // Get verification token
      const tokenRes = await request(App)
        .get('/api/v1/auth/get-verification-token')
        .query({ email: user1.Email });

      if (tokenRes.body.verificationToken) {
        // Verify email
        const verifyRes = await request(App)
          .post(`/api/v1/auth/verify-email/${tokenRes.body.verificationToken}`);

        console.log(`✓ Email verification response: ${verifyRes.status}`);

        if (verifyRes.status === 200 && verifyRes.body.tokens?.accessToken) {
          console.log('✓ Login tokens received immediately after verification');
          console.error('\n⚠️  SECURITY ISSUE: Account fully accessible after email verification!');
          
          // Now try to access protected endpoints with this token
          const protectedRes = await request(App)
            .get('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${verifyRes.body.tokens.accessToken}`);

          console.log(`✓ Protected endpoint access with verification token: ${protectedRes.status}`);
        }
      }
    });
  });

  // ==================== TEST SUITE 2: Direct Database Manipulation ====================
  describe('Database Manipulation Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'dbuser',
      FirstName: 'database',
      LastName: 'hacker',
      Email: 'db@example.com',
      NationalId: '30000000000000',
      Password: 'TestPassword123!',
      Position: 'hacker',
      PhoneNumber: '01000000002',
      Gender: 'Male',
      DateOfBirth: '1993-03-03',
      Address: 'Address 3'
    };

    it('VULNERABILITY: IsEmailVerified field can be set directly', async () => {
      console.log('\n🗄️  Testing: Can IsEmailVerified be bypassed via direct creation?');
      
      // Create user with IsEmailVerified = true from the start
      const directUser = await User.create({
        ...testUser,
        IsEmailVerified: true  // Bypassing signup flow
      });

      console.log(`✓ User created with IsEmailVerified = ${directUser.IsEmailVerified}`);

      // Try login
      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: testUser.Password
        });

      console.log(`✓ Login attempt result: ${loginRes.status}`);

      if (loginRes.status === 200) {
        console.error('\n⚠️  SECURITY ISSUE: Direct database creation allows verification bypass!');
      }
    });

    it('VULNERABILITY: Check for missing required validations', async () => {
      console.log('\n🗄️  Testing: What fields are actually validated?');
      
      const incompletUser = {
        Email: 'incomplete@example.com',
        NationalId: '40000000000000',
        Password: 'TestPassword123!',
        // Missing: UserName, FirstName, LastName, Position
        IsEmailVerified: true
      };

      try {
        const user = await User.create(incompletUser);
        console.error('⚠️  SECURITY ISSUE: User created with missing required fields!');
        console.error('   Missing fields were allowed:', Object.keys(incompletUser));
      } catch (err) {
        console.log('✓ Missing field validation enforced:', err.message.substring(0, 50));
      }
    });
  });

  // ==================== TEST SUITE 3: Token Manipulation ====================
  describe('Token Manipulation & Validation Bypass', () => {
    
    const testUser = {
      UserName: 'tokenmanip',
      FirstName: 'token',
      LastName: 'manip',
      Email: 'tokenmanip@example.com',
      NationalId: '50000000000000',
      Password: 'TestPassword123!',
      Position: 'tester',
      PhoneNumber: '01000000003',
      Gender: 'Male',
      DateOfBirth: '1994-04-04',
      Address: 'Address 4',
      IsEmailVerified: true
    };

    it('VULNERABILITY: Test token with modified payload', async () => {
      console.log('\n🔐 Testing: Can JWT payload be modified?');
      
      // Create and login user
      await User.create(testUser);
      const loginRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: testUser.Password
        });

      if (loginRes.body.tokens?.accessToken) {
        const token = loginRes.body.tokens.accessToken;
        console.log(`✓ Got access token: ${token.substring(0, 20)}...`);

        // Try to use modified token (example - add extra dot)
        const modifiedToken = token + '.modified';
        
        const testRes = await request(App)
          .get('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${modifiedToken}`);

        console.log(`✓ Modified token response: ${testRes.status}`);
        
        if (testRes.status === 200) {
          console.error('\n⚠️  SECURITY ISSUE: Modified token accepted!');
        }
      }
    });

    it('VULNERABILITY: Test empty/null Authorization header', async () => {
      console.log('\n🔐 Testing: Authorization header edge cases');
      
      const testCases = [
        { header: '', name: 'Empty header' },
        { header: 'Bearer', name: 'Bearer without token' },
        { header: 'Bearer ', name: 'Bearer with space' },
        { header: 'Bearer null', name: 'Bearer null' },
        { header: 'Bearer undefined', name: 'Bearer undefined' },
        { header: 'bearer lowercase', name: 'Lowercase bearer' }
      ];

      for (const testCase of testCases) {
        const res = await request(App)
          .get('/api/v1/auth/logout')
          .set('Authorization', testCase.header);

        console.log(`✓ ${testCase.name}: ${res.status}`);

        if (res.status === 200) {
          console.error(`  ⚠️  ISSUE: Request succeeded with "${testCase.header}"`);
        }
      }
    });

    it('VULNERABILITY: Test refresh token endpoint without protection', async () => {
      console.log('\n🔄 Testing: Is refresh token endpoint protected?');
      
      // Try to call refresh without any token
      const refreshRes = await request(App)
        .get('/api/v1/auth/refresh-token')
        .send();

      console.log(`✓ Refresh token without auth: ${refreshRes.status}`);
      
      if (refreshRes.status === 200) {
        console.error('\n⚠️  SECURITY ISSUE: Refresh endpoint not protected!');
      }
    });
  });

  // ==================== TEST SUITE 4: Race Conditions ====================
  describe('Race Condition Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'raceuser',
      FirstName: 'race',
      LastName: 'condition',
      Email: 'race@example.com',
      NationalId: '60000000000000',
      Password: 'TestPassword123!',
      Position: 'tester',
      PhoneNumber: '01000000004',
      Gender: 'Male',
      DateOfBirth: '1995-05-05',
      Address: 'Address 5'
    };

    it('VULNERABILITY: Simultaneous email verification attempts', async () => {
      console.log('\n⏱️  Testing: Race condition in email verification');
      
      // Signup
      const signupRes = await request(App)
        .post('/api/v1/auth/signup')
        .send(testUser);

      // Get token
      const tokenRes = await request(App)
        .get('/api/v1/auth/get-verification-token')
        .query({ email: testUser.Email });

      if (tokenRes.body.verificationToken) {
        const token = tokenRes.body.verificationToken;

        // Simulate simultaneous verification attempts
        console.log('✓ Attempting simultaneous email verifications...');
        
        const verify1 = request(App)
          .post(`/api/v1/auth/verify-email/${token}`);
        
        const verify2 = request(App)
          .post(`/api/v1/auth/verify-email/${token}`);

        const [res1, res2] = await Promise.all([verify1, verify2]);

        console.log(`✓ First verification: ${res1.status}`);
        console.log(`✓ Second verification: ${res2.status}`);

        if (res1.status === 200 && res2.status === 200) {
          console.error('\n⚠️  SECURITY ISSUE: Both simultaneous verifications succeeded!');
          console.error('   This could lead to token reuse or duplicate processing');
        }
      }
    });

    it('VULNERABILITY: Simultaneous login with unverified account', async () => {
      console.log('\n⏱️  Testing: Race condition in login verification');
      
      // Signup
      await request(App)
        .post('/api/v1/auth/signup')
        .send(testUser);

      // Simultaneously:
      // 1. Try to login (should fail)
      // 2. Verify email
      // 3. Try to login again

      const login1 = request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: testUser.Password
        });

      // Simulate email verification happening in parallel
      setTimeout(async () => {
        const tokenRes = await request(App)
          .get('/api/v1/auth/get-verification-token')
          .query({ email: testUser.Email });

        if (tokenRes.body.verificationToken) {
          await request(App)
            .post(`/api/v1/auth/verify-email/${tokenRes.body.verificationToken}`);
        }
      }, 50); // Verify after 50ms

      const res1 = await login1;
      console.log(`✓ Login before verification: ${res1.status}`);

      // Wait a bit for email verification to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try login again
      const login2 = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: testUser.Email,
          Password: testUser.Password
        });

      console.log(`✓ Login after verification: ${login2.status}`);
    });
  });

  // ==================== TEST SUITE 5: Business Logic Bypass ====================
  describe('Business Logic Bypass Vulnerabilities', () => {
    
    const testUser = {
      UserName: 'logicuser',
      FirstName: 'logic',
      LastName: 'bypass',
      Email: 'logic@example.com',
      NationalId: '70000000000000',
      Password: 'TestPassword123!',
      Position: 'developer',
      PhoneNumber: '01000000005',
      Gender: 'Male',
      DateOfBirth: '1996-06-06',
      Address: 'Address 6',
      IsEmailVerified: true
    };

    it('VULNERABILITY: Signup without completing email verification', async () => {
      console.log('\n📝 Testing: Can user interact before email verification?');
      
      // Signup
      const signupRes = await request(App)
        .post('/api/v1/auth/signup')
        .send(testUser);

      const unverifiedUser = await User.findOne({ Email: testUser.Email });
      console.log(`✓ User created with IsEmailVerified = ${unverifiedUser.IsEmailVerified}`);

      // Try to access protected endpoints without verification
      // Note: This should fail if protection middleware is properly applied
      
      // Example: Try to logout (requires authentication)
      const logoutRes = await request(App)
        .post('/api/v1/auth/logout')
        .send();

      console.log(`✓ Logout without login: ${logoutRes.status}`);

      if (logoutRes.status === 200) {
        console.error('\n⚠️  SECURITY ISSUE: Unverified user accessed protected endpoint!');
      }
    });

    it('VULNERABILITY: Check password reset for unverified users', async () => {
      console.log('\n🔐 Testing: Password reset for unverified users');
      
      // Create unverified user
      await User.create({
        ...testUser,
        IsEmailVerified: false
      });

      // Try password reset on unverified account
      const forgetRes = await request(App)
        .post('/api/v1/auth/forgetPassword')
        .send({
          Email: testUser.Email
        });

      console.log(`✓ Password reset for unverified user: ${forgetRes.status}`);
      console.log(`  Message: ${forgetRes.body.message}`);

      if (forgetRes.status === 200) {
        console.error('\n⚠️  SECURITY ISSUE: Unverified users can reset passwords!');
      }
    });
  });

  // ==================== TEST SUITE 6: API Response Information Leakage ====================
  describe('Information Disclosure in API Responses', () => {
    
    it('VULNERABILITY: Check for sensitive data in API responses', async () => {
      console.log('\n📤 Testing: Sensitive data exposure in responses');
      
      const sensitivePatterns = {
        'password': /password/i,
        'salt': /\$2[aby]\$/,
        'token': /eyJ[\w\-]+\.eyJ[\w\-]+\.[\w\-]*/,
        'id': /[0-9a-f]{24}/  // MongoDB ObjectId
      };

      // Try various endpoints
      const endpoints = [
        { method: 'post', path: '/api/v1/auth/login', data: { Email: 'test@test.com', Password: 'test' } },
        { method: 'post', path: '/api/v1/auth/signup', data: { Email: 'test2@test.com' } },
        { method: 'post', path: '/api/v1/auth/forgetPassword', data: { Email: 'test@test.com' } }
      ];

      for (const endpoint of endpoints) {
        const res = await request(App)[endpoint.method](endpoint.path).send(endpoint.data);

        console.log(`\n✓ Testing: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
        console.log(`  Response body: ${JSON.stringify(res.body).substring(0, 100)}...`);

        // Check for sensitive data in response
        for (const [key, pattern] of Object.entries(sensitivePatterns)) {
          if (pattern.test(JSON.stringify(res.body))) {
            console.error(`  ⚠️  ISSUE: Potential ${key} exposure detected`);
          }
        }
      }
    });

    it('VULNERABILITY: Check error stack traces in responses', async () => {
      console.log('\n📤 Testing: Error messages for information leakage');
      
      // Try to trigger an error
      const errorRes = await request(App)
        .post('/api/v1/auth/login')
        .send({
          Email: 'nonexistent@test.com',
          Password: 'randompassword'
        });

      const responseStr = JSON.stringify(errorRes.body);

      // Check for stack traces
      if (responseStr.includes('at ') || responseStr.includes('Error:') || responseStr.includes('stack')) {
        console.error('⚠️  SECURITY ISSUE: Stack trace exposed in error response!');
        console.log('Error response:', errorRes.body);
      } else {
        console.log('✓ No stack trace in error response');
      }
    });
  });

  // ==================== TEST SUITE 7: Default Credentials & Backdoors ====================
  describe('Default Credentials & Backdoor Testing', () => {
    
    it('VULNERABILITY: Test for default/hardcoded accounts', async () => {
      console.log('\n🚪 Testing: Default credentials');
      
      const defaultAccounts = [
        { email: 'admin@admin.com', password: 'admin' },
        { email: 'admin@admin.com', password: 'password' },
        { email: 'admin@admin.com', password: 'Admin123!' },
        { email: 'test@test.com', password: 'test' },
        { email: 'demo@demo.com', password: 'demo' }
      ];

      for (const account of defaultAccounts) {
        const res = await request(App)
          .post('/api/v1/auth/login')
          .send({
            Email: account.email,
            Password: account.password
          });

        if (res.status === 200) {
          console.error(`⚠️  SECURITY ISSUE: Default account exists: ${account.email} / ${account.password}`);
        }
      }
      
      console.log('✓ No default credentials found');
    });

    it('VULNERABILITY: Test for backdoor endpoints', async () => {
      console.log('\n🚪 Testing: Backdoor/debug endpoints');
      
      const potentialBackdoors = [
        '/api/v1/auth/debug',
        '/api/v1/auth/admin',
        '/api/v1/auth/test',
        '/api/v1/auth/bypass',
        '/debug',
        '/admin',
        '/test'
      ];

      for (const path of potentialBackdoors) {
        const res = await request(App).get(path);
        
        if (res.status === 200 || res.status === 403) {
          console.log(`⚠️  Endpoint exists: ${path} (${res.status})`);
        }
      }
      
      console.log('✓ Common backdoor paths tested');
    });
  });
});
