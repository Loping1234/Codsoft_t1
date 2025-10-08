# 🔒 SSL Certificate Error Fix Guide

## ❌ Error Overview
**Error**: `ERR_CERT_AUTHORITY_INVALID`  
**Location**: Supabase Storage Upload (`https://hviqrqnjtiheyxqmjwzv.supabase.co`)  
**Cause**: Your Supabase instance has an invalid or self-signed SSL certificate that your browser doesn't trust.

---

## ✅ Solutions (Choose One)

### **Solution 1: Verify Supabase Project (RECOMMENDED)**

Your Supabase project URL might be incorrect or the project might be paused/deleted.

#### Steps:
1. **Go to**: https://app.supabase.com/projects
2. **Check your project**:
   - Is it active and running?
   - Is the URL correct: `hviqrqnjtiheyxqmjwzv.supabase.co`?
3. **If project is paused**: Resume it
4. **If URL is wrong**: Update your `.env` file with the correct URL
5. **If project doesn't exist**: Create a new project

#### Update `.env` file:
```env
VITE_SUPABASE_URL=https://your-correct-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### **Solution 2: Create New Supabase Project**

If your current project has SSL issues, create a fresh project:

1. **Go to**: https://app.supabase.com
2. **Click**: "New Project"
3. **Configure**:
   - Name: `New Cap Study Platform`
   - Database Password: (choose strong password)
   - Region: (closest to you)
4. **Wait**: 2-3 minutes for project setup
5. **Get credentials**:
   - Go to: Settings → API
   - Copy: `Project URL` and `anon/public key`
6. **Update `.env`**:
```env
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

---

### **Solution 3: Configure Storage Bucket**

Your storage bucket might not be properly configured:

1. **Go to**: https://app.supabase.com/project/hviqrqnjtiheyxqmjwzv/storage/buckets
2. **Check if `documents` bucket exists**
3. **If not, create it**:
   - Name: `documents`
   - Public: ✅ Enable
   - File size limit: 52428800 (50MB)
4. **Set policies**:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'documents');

   -- Allow public reads
   CREATE POLICY "Allow public downloads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'documents');

   -- Allow users to delete their own files
   CREATE POLICY "Allow users to delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

---

### **Solution 4: Browser SSL Bypass (Chrome - Development Only)**

⚠️ **WARNING**: Only use for testing in development!

#### Chrome:
1. Navigate to: `chrome://flags/#allow-insecure-localhost`
2. Enable: "Allow invalid certificates for resources loaded from localhost"
3. Restart Chrome

#### Edge:
1. Navigate to: `edge://flags/#allow-insecure-localhost`
2. Enable the flag
3. Restart Edge

#### Firefox:
1. Navigate to: `about:config`
2. Accept the risk
3. Search for: `security.enterprise_roots.enabled`
4. Toggle to `true`

---

### **Solution 5: Use HTTP Proxy (Development)**

Create a proxy to bypass SSL issues:

#### Install Vite proxy:
```bash
npm install -D vite
```

#### Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/supabase': {
        target: 'https://hviqrqnjtiheyxqmjwzv.supabase.co',
        changeOrigin: true,
        secure: false, // Bypass SSL verification
        rewrite: (path) => path.replace(/^\/supabase/, '')
      }
    }
  }
})
```

#### Update `.env`:
```env
VITE_SUPABASE_URL=/supabase
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔍 Verify Your Fix

After applying a solution:

1. **Clear browser cache**: Ctrl + Shift + Delete
2. **Restart dev server**:
   ```bash
   npm run dev
   ```
3. **Check console**: Look for SSL errors
4. **Test upload**: Try uploading a small file (< 5MB)

---

## 🆘 If Nothing Works

### Option A: Use Local Storage (Temporary)
Switch to storing files locally instead of Supabase:

1. Update `database.ts` to use IndexedDB or localStorage
2. Store files as base64 strings
3. **Limitation**: Files will be lost on browser clear

### Option B: Use Alternative Storage
Switch to another storage provider:
- **Cloudinary**: Free tier available
- **Uploadcare**: Good for documents
- **Firebase Storage**: Alternative to Supabase

### Option C: Contact Supabase Support
- Email: support@supabase.com
- Discord: https://discord.supabase.com
- Provide:
  - Project ID: `hviqrqnjtiheyxqmjwzv`
  - Error: `ERR_CERT_AUTHORITY_INVALID`
  - Storage endpoint failing

---

## 📝 Current Implementation

I've already added better error handling to your code:

### `supabase.ts` Changes:
- ✅ Custom fetch with SSL error detection
- ✅ Helpful error messages
- ✅ Better debugging

### `database.ts` Changes:
- ✅ SSL error detection in upload
- ✅ Network error handling
- ✅ User-friendly error messages

---

## 🎯 Recommended Action Plan

**Start here** (in order):

1. ✅ **Verify Supabase project** (Solution 1) - 2 minutes
2. ✅ **Check storage bucket** (Solution 3) - 3 minutes
3. ✅ **Create new project** (Solution 2) - 5 minutes if needed
4. ⚠️ **Browser bypass** (Solution 4) - Only for testing
5. ❌ **Avoid HTTP proxy** (Solution 5) - Too complex

---

## 💡 Quick Test

After fixing, test with this small file:
1. Create a text file: `test.txt` with content "Hello World"
2. Try uploading it
3. Check browser console for errors
4. If successful, try a larger PDF/PPTX

---

## 🔧 Need More Help?

If you're still stuck:
1. **Share your Supabase dashboard screenshot** (hide sensitive keys)
2. **Check browser console** for any other errors
3. **Try from different browser** (Chrome vs Firefox)
4. **Check internet connection** and firewall settings

---

**Last Updated**: October 6, 2025  
**Status**: Error handling improved, awaiting Supabase project verification
