# 📦 Deploy PrivyRep to Vercel

Complete guide for deploying PrivyRep frontend to Vercel (recommended hosting platform).

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ A [Vercel account](https://vercel.com/signup) (free tier available)
- ✅ GitHub account with PrivyRep repository
- ✅ Node.js 20+ installed locally
- ✅ Project successfully building locally (`npm run build`)

---

## 🚀 Method 1: One-Click Deploy (Recommended)

The fastest way to deploy PrivyRep to Vercel.

### Step 1: Click Deploy Button

Click the button below or in the main README:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/huaguihai/PrivyRep)

### Step 2: Configure Repository

1. **Sign in to Vercel** (if not already signed in)
2. **Clone Repository**: Vercel will create a copy in your GitHub account
3. **Repository Name**: Keep as `PrivyRep` or customize
4. Click **Create**

### Step 3: Set Root Directory

⚠️ **Important**: PrivyRep uses a monorepo structure

1. In the deployment configuration, find **Root Directory**
2. Set to: `privyrep-frontend`
3. Framework Preset: `Vite` (should auto-detect)

### Step 4: Configure Environment Variables

Add the following environment variable:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_USE_V2` | `false` | Use V1 mode (recommended for demo) |

> 💡 **Tip**: Set to `true` only when Zama Relayer is confirmed operational

### Step 5: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build completion
3. 🎉 Your app is live!

---

## 🎯 Method 2: Import from GitHub Dashboard

Manual deployment through Vercel dashboard with more control.

### Step 1: Access Vercel Dashboard

1. Visit [vercel.com](https://vercel.com)
2. Sign in to your account
3. Click **Add New** → **Project**

### Step 2: Import Repository

1. **Import Git Repository** section
2. Select **GitHub** as provider
3. Authorize Vercel to access your repositories (if first time)
4. Search for `PrivyRep`
5. Click **Import**

### Step 3: Configure Project

**Project Name**:
```
privyrep
```
(or customize as needed)

**Framework Preset**:
```
Vite
```
(should auto-detect)

**Root Directory**:
```
privyrep-frontend
```
⚠️ **Critical**: Must specify this directory!

**Build Command**:
```bash
npm run build
```

**Output Directory**:
```
dist
```

**Install Command**:
```bash
npm install
```

### Step 4: Environment Variables

Click **Environment Variables** section and add:

```env
VITE_USE_V2=false
```

**Environment Options**:
- ✅ Production
- ✅ Preview
- ✅ Development

(Select all three)

### Step 5: Deploy

1. Review all settings
2. Click **Deploy**
3. Monitor build logs
4. Wait for deployment completion (2-3 minutes)

---

## 🛠️ Method 3: Deploy via Vercel CLI

For developers who prefer command-line deployment.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Verify installation:
```bash
vercel --version
```

### Step 2: Login to Vercel

```bash
vercel login
```

Choose your authentication method:
- Email
- GitHub
- GitLab
- Bitbucket

### Step 3: Navigate to Frontend Directory

```bash
cd /path/to/PrivyRep/privyrep-frontend
```

⚠️ **Important**: Must be in `privyrep-frontend` directory!

### Step 4: Initial Deployment (Preview)

```bash
vercel
```

**Interactive Setup**:

```
? Set up and deploy "~/PrivyRep/privyrep-frontend"? [Y/n] y
? Which scope do you want to deploy to? [Your Account]
? Link to existing project? [y/N] n
? What's your project's name? privyrep
? In which directory is your code located? ./
```

**Framework Detection**:
```
Auto-detected Project Settings (Vite):
- Build Command: npm run build
- Output Directory: dist
- Development Command: npm run dev
? Want to override the settings? [y/N] n
```

**Environment Variables**:
```
? Want to add environment variables? [y/N] y
? What's the name of the variable? VITE_USE_V2
? What's the value? false
? Add another environment variable? [y/N] n
```

Wait for deployment to complete.

### Step 5: Production Deployment

Once preview looks good, deploy to production:

```bash
vercel --prod
```

This deploys to your production domain.

---

## ⚙️ Configuration Files

### vercel.json (Optional)

Create `privyrep-frontend/vercel.json` for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_USE_V2": "false"
  },
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/",
      "status": 200
    }
  ]
}
```

Benefits:
- ✅ Consistent deployment settings
- ✅ SPA routing support
- ✅ Version control for configuration

---

## 🔧 Troubleshooting

### Build Fails: "Cannot find module"

**Problem**: Missing dependencies

**Solution**:
```bash
cd privyrep-frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

If successful locally, redeploy to Vercel.

### Build Fails: "Root directory not found"

**Problem**: Incorrect root directory setting

**Solution**:
1. Go to **Project Settings** → **General**
2. Set **Root Directory** to: `privyrep-frontend`
3. Click **Save**
4. Redeploy

### Runtime Error: "FHE initialization failed"

**Problem**: Zama Relayer unavailable (V2 mode)

**Solution**:
1. Go to **Project Settings** → **Environment Variables**
2. Change `VITE_USE_V2` to `false`
3. Redeploy

### Wallet Connection Issues

**Problem**: RainbowKit configuration

**Solution**:
- Ensure Sepolia network is available
- Check wallet has Sepolia ETH
- Try different wallet (MetaMask, Coinbase Wallet)

### Blank Page After Deployment

**Problem**: SPA routing not configured

**Solution**:
1. Add `vercel.json` with routes configuration (see above)
2. Or use Vercel's automatic SPA detection
3. Redeploy

---

## 📝 Post-Deployment Checklist

After successful deployment:

### Test Core Functionality

- [ ] Connect wallet successfully
- [ ] Register encrypted identity (if using local crypto, may fail - expected)
- [ ] Submit verification request
- [ ] View verification history
- [ ] Check reputation score updates

### Update Repository Links

Update README.md with your live demo URL:

**English README** (`README.md`, line ~35):
```markdown
- **Live Demo**: [https://your-app.vercel.app](https://your-app.vercel.app)
```

**Chinese README** (`README_CN.md`, line ~35):
```markdown
- **在线 Demo**: [https://your-app.vercel.app](https://your-app.vercel.app)
```

Commit and push:
```bash
git add README.md README_CN.md
git commit -m "docs: add live demo URL"
git push origin main
```

### Share Your Deployment

- [ ] Copy deployment URL
- [ ] Test on different devices/browsers
- [ ] Share with Zama team (if submitting to Developer Program)

---

## 🌐 Custom Domain (Optional)

Want a custom domain instead of `*.vercel.app`?

### Step 1: Add Domain

1. Go to **Project Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `privyrep.com`)

### Step 2: Configure DNS

Add DNS records at your domain registrar:

**For root domain** (`privyrep.com`):
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain** (`app.privyrep.com`):
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Step 3: Verify

Wait for DNS propagation (5-48 hours). Vercel will auto-detect and issue SSL certificate.

---

## 🔄 Updating Your Deployment

### Automatic Deployment (Recommended)

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Vercel will:
1. Detect the push
2. Build automatically
3. Deploy to production
4. Notify you via email

### Manual Redeployment

**Via Dashboard**:
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** → **Redeploy**

**Via CLI**:
```bash
cd privyrep-frontend
vercel --prod
```

---

## 🎯 Performance Optimization

### Enable Analytics

1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. View real-time visitor data

### Enable Speed Insights

1. Go to **Speed Insights** tab
2. Enable feature
3. Monitor Core Web Vitals

---

## 📊 Monitoring

### Check Build Logs

If deployment fails:
1. Go to **Deployments** tab
2. Click failed deployment
3. View **Build Logs**
4. Identify error

### Runtime Logs

1. Go to **Logs** tab (under project)
2. Select **Runtime Logs**
3. Filter by time/severity

---

## ❓ Common Questions

### Q: Can I use the free tier?

**A**: Yes! Free tier includes:
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Perfect for demos

### Q: How do I enable V2 mode?

**A**:
1. Wait for Zama Relayer to be operational
2. Run `npm run check-relayer` in contracts folder
3. If 🟢 OPERATIONAL, update env var to `VITE_USE_V2=true`
4. Redeploy

### Q: Can I deploy contracts to Vercel?

**A**: No, Vercel is for frontend only. Smart contracts are already deployed on Sepolia. You only deploy the React app.

### Q: How to rollback a deployment?

**A**:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **⋯** → **Promote to Production**

---

## 🆘 Getting Help

If you encounter issues:

1. **Vercel Documentation**: https://vercel.com/docs
2. **Vercel Support**: https://vercel.com/support
3. **PrivyRep Issues**: https://github.com/huaguihai/PrivyRep/issues
4. **Zama Discord**: https://discord.gg/zama

---

## 🎉 Success!

Once deployed, you'll have:

✅ Live demo URL (e.g., `https://privyrep.vercel.app`)
✅ Automatic HTTPS
✅ Global CDN distribution
✅ Automatic deployments from GitHub
✅ Free hosting for your demo

**Next Steps**:
1. Test all features
2. Share your demo URL
3. Submit to Zama Developer Program
4. Record demo video

---

**Happy Deploying! 🚀**

Built with ❤️ using Zama FHEVM
