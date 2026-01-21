# ⚡ MongoDB Setup - Quick Reference

## 🚀 Fastest Way (Recommended) - MongoDB Atlas

```
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Start free"
3. Create account
4. Create cluster (free tier)
5. Click "Connect" → "Drivers" → "Node.js"
6. Copy connection string
7. Add to .env: MONGODB_URI=your_string
8. Done! ✅
```

**Time:** 5 minutes  
**Cost:** Free (5GB storage)  
**Setup:** No installation needed

---

## 💻 If You Prefer Local Installation

### Windows
```bash
# 1. Download:
https://www.mongodb.com/try/download/community

# 2. Run installer (Choose "Install as Service")

# 3. Open Command Prompt and run:
mongod

# Done! ✅
```

**Time:** 10 minutes  
**Cost:** Free

### macOS
```bash
brew install mongodb-community
brew services start mongodb-community
# Done! ✅
```

**Time:** 5 minutes  
**Cost:** Free

### Linux
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
# Done! ✅
```

**Time:** 5 minutes  
**Cost:** Free

---

## 🐳 If You Have Docker

```bash
docker run -d -p 27017:27017 mongo
# Done! ✅
```

**Time:** 2 minutes  
**Cost:** Free

---

## ✅ Verify MongoDB is Running

**For Local MongoDB:**
```bash
mongosh  # or 'mongo' in older versions
# Should see: >
```

**For Atlas:**
```bash
# Should see in console:
# Connected to MongoDB Atlas
```

---

## 🎯 Which Option Should I Choose?

| Option | Setup Time | Installation | Cost | Best For |
|--------|-----------|--------------|------|----------|
| **Atlas (Cloud)** | 5 min | ❌ No | Free | ⭐ Easiest! |
| **Windows Local** | 10 min | ✅ Yes | Free | Development |
| **macOS Local** | 5 min | ✅ Yes | Free | Development |
| **Linux Local** | 5 min | ✅ Yes | Free | Development |
| **Docker** | 2 min | ✅ Yes (Docker) | Free | Docker users |

**Recommendation:** Use **MongoDB Atlas** - no installation needed!

---

## 📝 .env File Configuration

### For Local MongoDB
```
MONGODB_URI=mongodb://localhost:27017/brookfield_test
NODE_ENV=test
```

### For MongoDB Atlas
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brookfield_test
NODE_ENV=test
```

---

## 🚀 Run Tests

Once MongoDB is set up:

```bash
npm test -- Tests/auth.security.test.js
```

---

## ❓ Common Issues

### "mongod: command not found"
→ Use MongoDB Atlas (no installation needed)  
→ Or follow Windows/macOS/Linux installation steps above

### "Connection refused on port 27017"
→ MongoDB is not running  
→ Start it: `mongod` (for local)  
→ Or check Atlas connection string

### "Test timeout"
→ MongoDB taking too long to respond  
→ Check internet (if using Atlas)  
→ Check connection string in .env

---

## 📞 Quick Help

**Question:** My MongoDB won't start  
**Answer:** Use Atlas instead - no installation needed!

**Question:** I need MongoDB running right now  
**Answer:** Use Atlas - 5 minutes to set up

**Question:** I want to use Docker  
**Answer:** `docker run -d -p 27017:27017 mongo`

---

## ✨ Next Steps

1. **Choose option above** (Atlas recommended)
2. **Set up MongoDB** (5-10 minutes)
3. **Run tests:** `npm test -- Tests/auth.security.test.js`
4. **Review results** and fix issues

---

**Need detailed help?** → See [`../MONGODB_SETUP.md`](../MONGODB_SETUP.md)
