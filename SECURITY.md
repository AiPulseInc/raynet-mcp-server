# Security Guidelines

## 🔒 Credential Management

### Safe Workflow for Development

**STEP 1: Create your local .env file**
```bash
# Copy the template
cp .env.example .env

# Edit with your real credentials
nano .env
# or
code .env  # if using VS Code
```

**STEP 2: Add your credentials**
```env
RAYNET_INSTANCE_URL=https://app.raynetcrm.com/api/v2/
RAYNET_INSTANCE_NAME=your-actual-instance
RAYNET_USERNAME=your-real-email@company.com
RAYNET_API_KEY=your-actual-secret-key-here
```

**STEP 3: Verify it's gitignored**
```bash
# This should show .env is NOT staged
git status

# Should show .env in the ignore list
git check-ignore .env
# Output: .env
```

**STEP 4: Work with Claude Code**
```bash
# You can now tell me:
# "I've created the .env file with my credentials"

# I can help by:
# - Reading the .env file to configure the project
# - Testing API connections
# - Setting up configuration
# - Running scripts that use these credentials

# Your credentials stay LOCAL and are NEVER:
# - Committed to git
# - Shared publicly
# - Retained after our session
```

---

## ✅ What's Safe to Share

### Safe in Chat
- ✅ Instance URL (e.g., `https://app.raynetcrm.com/api/v2/`)
- ✅ Instance name (e.g., `my-company-crm`)
- ✅ Username/email (if you're comfortable)
- ✅ API endpoint paths
- ✅ Configuration questions

### NEVER Share in Chat
- ❌ API keys
- ❌ API tokens
- ❌ Passwords
- ❌ Secret keys
- ❌ Personal access tokens

---

## 🛡️ Security Features Already Implemented

### 1. Git Protection
```bash
# .gitignore includes:
.env
.env.local
.env.*.local
```

### 2. GitHub Secrets (for CI/CD)
Set these in GitHub UI, not in code:
- Go to: Settings → Secrets and variables → Actions
- Add secrets:
  - `RAYNET_TEST_API_KEY`
  - `RAYNET_TEST_USERNAME`
  - `RAILWAY_TOKEN`

### 3. Log Sanitization
Our logger automatically removes:
- API keys from logs
- Authorization headers
- Sensitive error details

### 4. Error Messages
Production errors don't expose:
- Internal paths
- Configuration details
- Credentials

---

## 🔍 How to Get Your Raynet API Credentials

### Step 1: Log in to Raynet CRM
Visit your Raynet instance (e.g., `https://your-company.raynetcrm.com`)

### Step 2: Navigate to API Settings
```
Settings → For Developers → API Keys
```

### Step 3: Generate API Key
1. Click "Generate New Key"
2. Give it a descriptive name (e.g., "MCP Server Development")
3. Copy the generated key immediately (you won't see it again)

### Step 4: Find Your Instance Name
Your instance name is in your Raynet URL:
```
https://my-company.raynetcrm.com
         ^^^^^^^^^^
         This is your instance name
```

---

## 🔄 Credential Rotation

### When to Rotate
- Every 90 days (recommended)
- If key is accidentally exposed
- When team members leave
- After security incidents

### How to Rotate
1. Generate new key in Raynet CRM
2. Update `.env` file locally
3. Update GitHub Secrets
4. Update Railway environment variables
5. Revoke old key in Raynet CRM

---

## 🚨 If Credentials Are Compromised

### Immediate Actions
1. **Revoke the API key** in Raynet CRM immediately
2. **Generate a new key**
3. **Update all deployments**
4. **Review recent API activity** in Raynet for suspicious actions
5. **Notify your team**

### If Committed to Git
```bash
# If you accidentally committed credentials to git:

# 1. Remove from git history (use git-filter-repo)
pip install git-filter-repo
git filter-repo --path .env --invert-paths

# 2. Force push (DANGEROUS - coordinate with team)
git push origin --force --all

# 3. Immediately revoke the exposed credentials
# 4. Generate new credentials
# 5. Never commit .env again (it's in .gitignore)
```

---

## 🧪 Testing with Credentials

### Use Separate Test Credentials
```env
# Development
RAYNET_API_KEY=dev-key-here

# Testing (separate account recommended)
RAYNET_TEST_API_KEY=test-key-here
```

### Test Safely
```bash
# Test API connection without exposing key
npm run test:connection

# Test with mock data (no real API calls)
npm run test:unit

# Integration tests (uses test credentials)
npm run test:integration
```

---

## 📋 Security Checklist

### Before First Commit
- [ ] `.env` file is in `.gitignore`
- [ ] `.env.example` has no real credentials
- [ ] No API keys in source code
- [ ] No credentials in comments

### Before Each Commit
- [ ] Run `git status` - verify .env not staged
- [ ] No hardcoded credentials in new code
- [ ] Secrets use environment variables

### Before Deployment
- [ ] Environment variables set in deployment platform
- [ ] Different credentials for prod/staging/dev
- [ ] API keys have appropriate permissions
- [ ] Logging doesn't expose secrets

### Regular Maintenance
- [ ] Rotate credentials every 90 days
- [ ] Review API access logs monthly
- [ ] Remove unused API keys
- [ ] Update dependencies for security patches

---

## 🤝 Working with Claude Code Securely

### What I Can Access
- ✅ Files in the local repository
- ✅ `.env` file (if you create it locally)
- ✅ Environment variables you set
- ✅ Output from commands you run

### What I Cannot Access
- ❌ Your filesystem outside the project
- ❌ Your password managers
- ❌ Your browser stored passwords
- ❌ GitHub Secrets (set via GitHub UI)
- ❌ Your data after session ends

### Best Practice Workflow
```bash
# 1. You create .env locally
cp .env.example .env
nano .env

# 2. Tell me it's ready
# "I've set up the .env file"

# 3. I can help configure
# I'll read .env and set up your project

# 4. Test together
npm run dev

# 5. Your credentials stay local and safe
```

---

## 📚 Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Raynet API Documentation](https://app.raynetcrm.com/api/doc/index-en.html)
- [12-Factor App Config](https://12factor.net/config)

---

## 📞 Security Contacts

If you discover a security vulnerability:
- **Email**: security@aipulse.inc (create this if needed)
- **GitHub**: Create a security advisory
- **Response time**: 24-48 hours

---

**Remember**: When in doubt, DON'T share credentials. Ask me how to configure things securely instead!
