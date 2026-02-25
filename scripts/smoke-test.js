#!/usr/bin/env node
/**
 * Smoke test — hits health endpoints and login.
 * Run with: node scripts/smoke-test.js
 * Requires: services running, MONGO_URI set in user-service.
 */
const USER = process.env.USER_SERVICE_URL || 'http://localhost:5004'
const CONTENT = process.env.CONTENT_SERVICE_URL || 'http://localhost:5002'

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 100)}`)
  }
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  let failed = 0
  console.log('Smoke test — critical paths\n')

  const { ok: h1, status: s1 } = await fetch(`${USER}/health`).then((r) => ({ ok: r.ok, status: r.status })).catch((e) => { console.error('user-service /health:', e.message); return { ok: false, status: 0 } })
  if (h1) console.log('✓ user-service /health')
  else { console.log('✗ user-service /health', s1); failed++ }

  const { ok: h2 } = await fetch(`${CONTENT}/health`).then((r) => ({ ok: r.ok })).catch((e) => { console.error('content-service /health:', e.message); return { ok: false } })
  if (h2) console.log('✓ content-service /health')
  else { console.log('✗ content-service /health'); failed++ }

  const loginRes = await fetchJson(`${USER}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'smoke_test_user_xyz', password: 'invalid' }),
  }).catch((e) => { console.error('login:', e.message); return { ok: false } })
  if (loginRes.ok === false && (loginRes.status === 401 || loginRes.status === 400)) {
    console.log('✓ login rejects invalid credentials')
  } else if (loginRes.ok) {
    console.log('✓ login (test user exists)')
  } else {
    console.log('✗ login unexpected', loginRes.status)
    failed++
  }

  console.log(failed ? `\n${failed} failed` : '\nAll passed')
  process.exit(failed ? 1 : 0)
}

main()
