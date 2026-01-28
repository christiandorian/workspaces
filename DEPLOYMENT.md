# Deployment Guide for Q-Chat on Vercel

## Prerequisites
- Vercel account
- OpenAI API key

## Steps to Deploy

### 1. Push to GitHub
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `christiandorian/workspaces`
4. Click "Import"

### 3. Configure Environment Variables
**CRITICAL:** Add your OpenAI API key in Vercel's dashboard:

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...` (your actual OpenAI API key)
   - **Environment**: Select all (Production, Preview, Development)
3. Click "Save"

### 4. Deploy
1. Go to the **Deployments** tab
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

## Troubleshooting

### API Endpoints Return 404
- Make sure `server.js` is NOT in `.vercelignore`
- Check that `vercel.json` exists and is configured correctly
- Verify environment variables are set in Vercel dashboard

### OpenAI API Key Not Found
- Go to Vercel dashboard → Settings → Environment Variables
- Make sure `OPENAI_API_KEY` is set for all environments
- Redeploy after adding environment variables

### Functions Timeout
- Vercel has a 10-second timeout for free tier
- Consider upgrading if processing large PDFs

## Local Development

To run locally:
```bash
npm install
npm start
```

Make sure `.env` file has your API key:
```env
OPENAI_API_KEY=sk-proj-...your-key-here
```

## Files Required for Deployment
- ✅ `server.js` - Express server
- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Dependencies
- ✅ All frontend files (HTML, CSS, JS)
- ❌ `.env` - Local only (use Vercel env vars)
- ❌ `node_modules` - Will be installed by Vercel
