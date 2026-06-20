// seed/seed.js
// Creates the initial CEO account in Firebase.
// Run: node seed/seed.js
// Requires: VITE_ env vars set in .env.local (read via dotenv)

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Manually load .env.local (dotenv not in devDeps, keep it simple)
function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k && v.length) process.env[k.trim()] = v.join('=').trim()
    }
  } catch { console.error('Could not read .env.local'); process.exit(1) }
}

loadEnv()

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID
const API_KEY    = process.env.VITE_FIREBASE_API_KEY

if (!PROJECT_ID || !API_KEY) {
  console.error('Missing VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY in .env.local')
  process.exit(1)
}

// ── CEO account to create ──────────────────────────────────────────────────
// CHANGE THESE before running:
const CEO_EMAIL = 'ceo@dreamwash.rw'
const CEO_PWD   = 'DreamWash2025!'
const CEO_NAME  = 'Fresh Boy'

const REST_BASE = `https://identitytoolkit.googleapis.com/v1`
const FS_BASE   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error?.message || JSON.stringify(data.error))
  return data
}

async function main() {
  console.log('🚀 Dream Wash — Seed script')
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Creating CEO: ${CEO_EMAIL}\n`)

  // 1. Create Auth user via REST API
  let uid
  try {
    const res = await post(
      `${REST_BASE}/accounts:signUp?key=${API_KEY}`,
      { email: CEO_EMAIL, password: CEO_PWD, returnSecureToken: true }
    )
    uid = res.localId
    console.log(`✅ Auth user created: ${uid}`)
  } catch (err) {
    if (err.message.includes('EMAIL_EXISTS')) {
      // Sign in to get UID
      const res = await post(
        `${REST_BASE}/accounts:signInWithPassword?key=${API_KEY}`,
        { email: CEO_EMAIL, password: CEO_PWD, returnSecureToken: true }
      )
      uid = res.localId
      console.log(`ℹ️  CEO already exists. UID: ${uid}`)
    } else {
      throw err
    }
  }

  // 2. Write Firestore user document via REST
  const fsUrl = `${FS_BASE}/users/${uid}`
  const r = await fetch(fsUrl + '?currentDocument.exists=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Use the signIn token for auth — sign in again to get a fresh token
    },
  })
  // Firestore REST requires auth token — use Admin SDK or manual approach
  // Simpler: use the Firebase Auth REST to get an ID token, then call Firestore REST
  const signIn = await post(
    `${REST_BASE}/accounts:signInWithPassword?key=${API_KEY}`,
    { email: CEO_EMAIL, password: CEO_PWD, returnSecureToken: true }
  )
  const token = signIn.idToken

  const fsWrite = await fetch(`${FS_BASE}/users/${uid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        name:      { stringValue: CEO_NAME },
        email:     { stringValue: CEO_EMAIL },
        role:      { stringValue: 'ceo' },
        createdAt: { timestampValue: new Date().toISOString() },
      }
    })
  })

  if (fsWrite.ok) {
    console.log(`✅ Firestore profile created for ${CEO_NAME}`)
  } else {
    const err = await fsWrite.json()
    // If profile already exists, that's fine
    if (err.error?.status === 'ALREADY_EXISTS' || err.error?.code === 409) {
      console.log(`ℹ️  Firestore profile already exists`)
    } else {
      console.error('⚠️  Firestore write error:', err.error?.message)
      console.log('   You may need to create the Firestore profile manually.')
      console.log(`   In Firebase Console → Firestore → users/${uid}`)
      console.log(`   Add fields: name="${CEO_NAME}", email="${CEO_EMAIL}", role="ceo"`)
    }
  }

  console.log('\n✅ Seed complete!')
  console.log(`\n   CEO Login:\n   Email:    ${CEO_EMAIL}\n   Password: ${CEO_PWD}`)
  console.log('\n   Access dashboard at: http://localhost:3000/admin')
  console.log('   ⚠️  Change the password after first login!\n')
}

main().catch(err => { console.error('Seed failed:', err.message); process.exit(1) })
