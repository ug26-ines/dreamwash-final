# Dream Wash — Setup & Deployment Guide

## What's in this project

Three portals, one codebase:

| URL path | Portal | Who uses it |
|----------|--------|-------------|
| `/` | Client Portal | Customers tracking laundry |
| `/admin` or `/ceo` | CEO Dashboard | You (Fresh Boy) |
| `/pos` or `/staff` | Receptionist POS | Front-desk staff |

---

## Prerequisites

Install these first (one-time):

1. **Node.js 18+** — https://nodejs.org (download LTS version)
2. **Verify install** — open a terminal and run:
   ```
   node --version   # should show v18.x or higher
   npm --version    # should show 9.x or higher
   ```

---

## Step 1 — Install dependencies

```bash
cd dreamwash
npm install
```

This takes 1–2 minutes. You will see a progress bar.

---

## Step 2 — Verify Firebase credentials

Your `.env.local` file is already filled with your Firebase project credentials.
Open it to verify it looks like this:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=dreamwash-final.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dreamwash-final
...
```

If the file is missing or blank, copy `.env.local.example` to `.env.local`.

---

## Step 3 — Enable Firebase services (one-time, via Firebase Console)

### 3a. Enable Authentication

1. Go to https://console.firebase.google.com
2. Select your project: **dreamwash-final**
3. Left sidebar → **Build** → **Authentication**
4. Click **Get started**
5. Under "Sign-in method", click **Email/Password**
6. Toggle **Enable** → Save

### 3b. Create Firestore database

1. Left sidebar → **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (rules are already in firestore.rules)
4. Select region: **europe-west1** (closest to Rwanda)
5. Click **Done** — wait ~1 minute for it to provision

### 3c. Deploy Firestore security rules

In your terminal:
```bash
# Install Firebase CLI (one-time)
npm install -g firebase-tools

# Log in
firebase login

# Deploy rules and indexes only (no hosting yet)
firebase deploy --only firestore
```

---

## Step 4 — Create the CEO account

Run the seed script:

```bash
node seed/seed.js
```

Expected output:
```
🚀 Dream Wash — Seed script
Project: dreamwash-final
Creating CEO: ceo@dreamwash.rw

✅ Auth user created: abc123...
✅ Firestore profile created for Fresh Boy

✅ Seed complete!

   CEO Login:
   Email:    ceo@dreamwash.rw
   Password: DreamWash2025!

   Access dashboard at: http://localhost:3000/admin
   ⚠️  Change the password after first login!
```

**If the seed script fails** (Firestore permission error before rules are deployed):
1. Go to Firebase Console → Firestore → start database
2. Temporarily set rules to `allow read, write: if true;`
3. Run seed again
4. Then deploy the proper rules: `firebase deploy --only firestore`

---

## URL Architecture

Two separate things served from one Firebase Hosting deployment:

| URL | What loads | Who uses it |
|-----|------------|-------------|
| `dreamwash.rw/` | Marketing page (static HTML) | Public · Google · WhatsApp sharing |
| `dreamwash.rw/portal` | Client portal (React) | Customers tracking orders |
| `dreamwash.rw/admin` | CEO Dashboard (React) | You (Fresh Boy) |
| `dreamwash.rw/pos` | Receptionist POS (React) | Front-desk staff |

---

## Step 5 — Run the app locally

```bash
npm run dev
```

Vite opens at **http://localhost:3000/app.html** automatically.

| Portal | Local URL |
|--------|-----------|
| Client | http://localhost:3000/app.html |
| CEO    | http://localhost:3000/app.html → change URL to /admin in browser address bar |
| POS    | http://localhost:3000/app.html → change URL to /pos in browser address bar |

**To preview the marketing page locally:**
```bash
npx serve public -p 8080
```
Then open http://localhost:8080 — this is exactly what visitors see at your domain root.

---

## Step 6 — Create your first Receptionist account

1. Log into the CEO dashboard at http://localhost:3000/admin
2. Navigate to the **Staff** tab
3. Click **+ New Staff Account**
4. Fill in name, email, and password for the receptionist
5. Role: **receptionist**
6. Click **Create Account**

> ⚠️ **Note:** Creating a staff account via the dashboard currently signs the CEO out temporarily.
> This is a known limitation of using the Firebase Auth client SDK.
> Sign back in at http://localhost:3000/admin immediately after.
>
> **Production fix:** Use Firebase Admin SDK in a Cloud Function or the Firebase Console
> to create staff accounts without this side effect.

---

## Step 7 — Build for production (optional)

```bash
npm run build
```

Output goes to the `dist/` folder. This is what gets deployed.

### Deploy to Firebase Hosting (free):

```bash
firebase deploy
```

Your app will be live at:
- `https://dreamwash-final.web.app`
- `https://dreamwash-final.firebaseapp.com`

Set up custom domains in Firebase Console → Hosting → Add custom domain.

---

## Firestore data structure

The app reads/writes these collections:

| Collection | Description |
|------------|-------------|
| `users` | Auth profiles (CEO, receptionist, client) |
| `orders` | All laundry orders |
| `clients` | Customer CRM (keyed by phone number) |
| `members` | 10k Club subscription members |
| `config` | Business settings (rates — CEO only) |
| `staff` | Staff records |
| `shifts` | Shift history |
| `auditLog` | Immutable audit trail |

---

## Security model

- **CEO** can read and write everything
- **Receptionists** can create/update orders and clients, read members, cannot see rates/margins
- **Clients** can only read their own orders and subscription status
- Firestore rules enforce all of this server-side — the frontend role checks are just UX

---

## Offline behavior

The app uses Firebase's `persistentLocalCache` with IndexedDB. This means:

- Orders submitted while offline are queued locally
- They sync to Firestore automatically when connection restores
- The POS shows a red "Offline" indicator in the topbar when disconnected
- Receptionists can continue taking orders during internet outages

---

## Troubleshooting

### Blank screen on `npm run dev`
- Check that `.env.local` exists and has all 7 `VITE_FIREBASE_*` variables
- Check browser console (F12) for errors
- Make sure Firestore is created in Firebase Console (Step 3b)

### "Permission denied" errors in console
- Firestore security rules haven't been deployed yet
- Run: `firebase deploy --only firestore`
- Or temporarily set rules to allow all while testing

### Login works but shows blank screen / infinite load
- The user's Firestore profile doc doesn't exist
- Run the seed script: `node seed/seed.js`
- Or manually add a document to `users/{uid}` with `role: "ceo"`

### "Missing or insufficient permissions" after login
- The logged-in user's `role` field in Firestore doesn't match the portal
- Check `users/{uid}` document in Firebase Console

### Port 3000 already in use
```bash
# Kill whatever is using port 3000, then restart
npx kill-port 3000
npm run dev
```

---

## Changing the WhatsApp number

Search for `250780000000` in these files and replace with the real number (digits only, no +):
- `src/portals/receptionist/ReceptionistPortal.jsx` (Z-Report)
- `src/portals/client/ClientPortal.jsx` (Book tab)
- `src/portals/client/ClientPortal.jsx` (Subscription join)

---

## Changing staff names in the POS dropdown

Open `src/portals/receptionist/ReceptionistPortal.jsx`, find:
```jsx
{['Unassigned','Claudine','Aline','Fidèle','Emmanuel','Esperance'].map(...)}
```
Replace the names array with your actual staff names.

---

## Firebase free tier limits (Spark plan)

| Resource | Free limit | Dream Wash usage |
|----------|------------|------------------|
| Firestore reads | 50,000/day | ~500 orders/day × 10 reads = fine |
| Firestore writes | 20,000/day | ~100 orders/day × 5 writes = fine |
| Firestore storage | 1 GiB | Years of orders |
| Hosting | 10 GB/month | Static files only |
| Auth users | Unlimited | ✅ |

You will comfortably stay within free limits for local testing and early operations.
