# 🗄️ MongoDB Setup Guide

MongoDB is required to run the security tests. Choose the option that works best for you.

## ⚡ Quick Options

### Option 1: MongoDB Atlas (Cloud) - Recommended ✅
**Best for:** Quick testing, no installation needed
**Cost:** Free tier available (5GB storage)
**Time:** 5 minutes

1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Start free" or "Sign up"
3. Create account (or login if you have one)
4. Create a cluster:
   - Select "Shared" (free)
   - Choose your region
   - Click "Create"
5. Wait for cluster to deploy (~3-5 minutes)
6. Click "Connect"
7. Choose "Drivers" → "Node.js"
8. Copy the connection string
9. In your `.env` file, add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brookfield_test
   ```
10. Run tests: `npm test -- Tests/auth.security.test.js`

### Option 2: MongoDB Community (Local) - Windows
**Best for:** Development, no internet required
**Cost:** Free
**Time:** 10 minutes

1. Download MongoDB Community Edition:
   https://www.mongodb.com/try/download/community

2. Run the installer
   - Choose "Custom"
   - Accept license agreement
   - Choose installation folder
   - Check "Run service as Local System User"
   - Check "Install MongoDB Compass" (optional)

3. Complete installation

4. Open Command Prompt and run:
   ```bash
   mongod
   ```

5. You should see:
   ```
   [network] waiting for connections on port 27017
   ```

6. Leave this terminal open while running tests

7. In another terminal, run:
   ```bash
   npm test -- Tests/auth.security.test.js
   ```

### Option 3: MongoDB Community - macOS
**Best for:** Mac users
**Cost:** Free
**Time:** 5 minutes

Install via Homebrew:
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
brew services list
```

Then run tests in your project terminal:
```bash
npm test -- Tests/auth.security.test.js
```

### Option 4: Docker (Any OS)
**Best for:** Docker users
**Cost:** Free
**Time:** 2 minutes (if Docker installed)

If you have Docker installed:
```bash
# Start MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo

# Run tests
npm test -- Tests/auth.security.test.js

# Stop MongoDB when done
docker stop mongodb
docker rm mongodb
```

### Option 5: MongoDB Atlas + Docker
**Best for:** Maximum flexibility

Use MongoDB Atlas (cloud) with Docker just running your app - no local MongoDB needed.

## ✅ Verify MongoDB is Running

### Check Connection
```bash
# If MongoDB is running, this should work:
# For local MongoDB
mongosh  # or 'mongo' in older versions

# You should see the MongoDB shell prompt
>
```

### Check `.env` Configuration
Make sure your `.env` file has:
```
MONGODB_URI=mongodb://localhost:27017/brookfield_test
```

Or for MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brookfield_test
```

## 🚀 Run Tests

Once MongoDB is running:

```bash
# In your project directory:
npm test -- Tests/auth.security.test.js

# With verbose output:
npm test -- Tests/auth.security.test.js --verbose
```

## ❓ Troubleshooting

### "mongod: command not found"
**Solution:** MongoDB is not installed or not in PATH
- Use Option 1 (MongoDB Atlas) - no installation needed
- Or follow installation instructions above

### "Error: connect ECONNREFUSED 127.0.0.1:27017"
**Solution:** MongoDB is not running
- Start MongoDB: `mongod` (if installed locally)
- Or check MongoDB Atlas connection string in `.env`

### "Port 27017 already in use"
**Solution:** MongoDB is already running or port is in use
- That's OK! Tests will work fine
- Or use different port: `mongod --port 27018`

### "Test timeout after 30000ms"
**Solution:** MongoDB connection is slow or not responding
- Check MongoDB is running
- Check internet connection (if using Atlas)
- Check connection string in `.env`

## 📝 Environment Variables

Create a `.env` file in your project root with:

### For Local MongoDB
```
MONGODB_URI=mongodb://localhost:27017/brookfield_test
NODE_ENV=test
JWT_TOKEN_SECRET=test_secret_key
JWT_REFRESH_TOKEN_SECRET=test_refresh_secret
JWT_TOKEN_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=9d
```

### For MongoDB Atlas
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/brookfield_test
NODE_ENV=test
JWT_TOKEN_SECRET=test_secret_key
JWT_REFRESH_TOKEN_SECRET=test_refresh_secret
JWT_TOKEN_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=9d
```

## 🎯 My Recommendation

**For this task, use MongoDB Atlas:**
- ✅ No installation needed
- ✅ Free tier available (5GB)
- ✅ Works immediately
- ✅ No local port conflicts
- ✅ Can access from anywhere

**Why not local MongoDB?**
- Requires installation
- Takes more time to setup
- Uses local disk space
- Can have port conflicts

## 📞 Still Having Issues?

### Check MongoDB Status
```bash
# Windows - Check if mongod service is running:
tasklist | findstr mongod

# macOS - Check service status:
brew services list

# Linux - Check service status:
sudo systemctl status mongod
```

### Test Connection
```bash
# If you have mongosh installed:
mongosh "mongodb://localhost:27017"

# Should connect successfully
```

### Try Atlas Instead
If local MongoDB won't work, just use Atlas (cloud):
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster
4. Get connection string
5. Add to `.env`
6. Run tests

## 🚀 Next Steps

1. **Choose your MongoDB option** (Atlas recommended)
2. **Set up MongoDB** (follow instructions above)
3. **Verify it's running** (see "Verify MongoDB is Running" section)
4. **Run tests**: `npm test -- Tests/auth.security.test.js`
5. **Review results** and fix issues

---

**Need help?** See the troubleshooting section above or open `Tests/SETUP_AND_RUN.md`
