import { test, expect } from 'bun:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';

const secretKey = 'super_secret_test_key_at_least_32_chars!';
process.env.SUPER_ADMIN_JWT_SECRET = secretKey;
process.env.FIREBASE_PROJECT_ID = 'dev-mechanic-jq6d2';

const {
  SESSION_COOKIE,
  signSuperAdminPortalSession,
  verifySuperAdminPortalSession,
  verifySuperAdminFromRequest,
  sessionIsExpired,
} = await import('../src/lib/session.ts');

test('1. signSuperAdminPortalSession generates valid JWT containing super_admin claims', async () => {
  const token = await signSuperAdminPortalSession({
    sub: 'user-123',
    email: 'admin@school.edu',
  });

  assert.ok(typeof token === 'string' && token.length > 20);

  const payload = await verifySuperAdminPortalSession(token);
  assert.equal(payload.sub, 'user-123');
  assert.equal(payload.email, 'admin@school.edu');
  assert.equal(payload.super_admin, true);
  assert.equal(payload.role, 'super_admin');
});

test('2. verifySuperAdminPortalSession rejects invalid, tampered, or forged tokens', async () => {
  await assert.rejects(
    async () => verifySuperAdminPortalSession('invalid-random-token'),
    /Invalid Compact JWS|compact JWS/i,
  );

  await assert.rejects(
    async () => verifySuperAdminPortalSession('demo-super-admin-token'),
    /Invalid Compact JWS|compact JWS/i,
  );
});

test('3. verifySuperAdminPortalSession rejects tokens without super_admin claims', async () => {
  const nonAdminToken = await new SignJWT({
    super_admin: false,
    role: 'student',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('student-123')
    .setIssuer('yft-super-admin')
    .setAudience('yft-super-admin-session')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secretKey));

  await assert.rejects(
    async () => verifySuperAdminPortalSession(nonAdminToken),
    /Not a super admin session/,
  );
});

test('4. verifySuperAdminPortalSession strictly rejects tokens with role super_admin but missing super_admin: true boolean', async () => {
  const roleOnlyToken = await new SignJWT({
    role: 'super_admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin-without-boolean')
    .setIssuer('yft-super-admin')
    .setAudience('yft-super-admin-session')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secretKey));

  await assert.rejects(
    async () => verifySuperAdminPortalSession(roleOnlyToken),
    /Not a super admin session/,
  );
});

test('5. verifySuperAdminPortalSession strictly rejects string-valued claim super_admin: "true"', async () => {
  const stringClaimToken = await new SignJWT({
    super_admin: 'true',
    role: 'super_admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin-string-claim')
    .setIssuer('yft-super-admin')
    .setAudience('yft-super-admin-session')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secretKey));

  await assert.rejects(
    async () => verifySuperAdminPortalSession(stringClaimToken),
    /Not a super admin session/,
  );
});

test('6. verifySuperAdminPortalSession rejects tokens missing super_admin claim entirely', async () => {
  const missingClaimToken = await new SignJWT({
    name: 'Regular User',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('regular-user')
    .setIssuer('yft-super-admin')
    .setAudience('yft-super-admin-session')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secretKey));

  await assert.rejects(
    async () => verifySuperAdminPortalSession(missingClaimToken),
    /Not a super admin session/,
  );
});

test('7. verifySuperAdminPortalSession rejects expired tokens (exp in past)', async () => {
  const expiredToken = await new SignJWT({
    super_admin: true,
    role: 'super_admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin-expired')
    .setIssuer('yft-super-admin')
    .setAudience('yft-super-admin-session')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(new TextEncoder().encode(secretKey));

  await assert.rejects(
    async () => verifySuperAdminPortalSession(expiredToken),
    /JWTExpired|claim is expired|expired/i,
  );
});

test('8. verifySuperAdminPortalSession succeeds for legitimate Super Admin with boolean true', async () => {
  const validSuperAdminToken = await new SignJWT({
    super_admin: true,
    role: 'super_admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('legitimate-super-admin')
    .setIssuer('yft-super-admin')
    .setAudience('yft-super-admin-session')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secretKey));

  const payload = await verifySuperAdminPortalSession(validSuperAdminToken);
  assert.equal(payload.sub, 'legitimate-super-admin');
  assert.equal(payload.super_admin, true);
});

test('9. verifySuperAdminFromRequest returns false when cookie is missing or invalid', async () => {
  const reqWithoutCookie = {
    cookies: { get: () => undefined },
  };
  const res1 = await verifySuperAdminFromRequest(reqWithoutCookie);
  assert.equal(res1, false);

  const reqWithInvalidCookie = {
    cookies: { get: (name) => (name === SESSION_COOKIE ? { value: 'forged' } : undefined) },
  };
  const res2 = await verifySuperAdminFromRequest(reqWithInvalidCookie);
  assert.equal(res2, false);

  const validToken = await signSuperAdminPortalSession({ sub: 'admin-1' });
  const reqWithValidCookie = {
    cookies: { get: (name) => (name === SESSION_COOKIE ? { value: validToken } : undefined) },
  };
  const res3 = await verifySuperAdminFromRequest(reqWithValidCookie);
  assert.equal(res3, true);
});

test('10. sessionIsExpired correctly checks expiration timestamp', () => {
  const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 100 };
  assert.equal(sessionIsExpired(expiredPayload), true);

  const activePayload = { exp: Math.floor(Date.now() / 1000) + 1000 };
  assert.equal(sessionIsExpired(activePayload), false);
});

test('11. POST /api/session rejects missing token with HTTP 400 and no cookie', async () => {
  const { POST } = await import('../src/app/api/session/route.ts');
  const req = new Request('http://localhost:3000/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);

  const json = await res.json();
  assert.equal(json.error, 'Missing token');

  const setCookie = res.headers.get('set-cookie');
  assert.ok(!setCookie || !setCookie.includes('sa_session='));
});

test('12. POST /api/session rejects forged / demo tokens with HTTP 401 and no cookie', async () => {
  const { POST } = await import('../src/app/api/session/route.ts');
  const req = new Request('http://localhost:3000/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'demo-super-admin-token' }),
  });

  const res = await POST(req);
  assert.equal(res.status, 401);

  const json = await res.json();
  assert.equal(json.code, 'invalid_token');

  const setCookie = res.headers.get('set-cookie');
  assert.ok(!setCookie || !setCookie.includes('sa_session='));
});

test('13. POST /api/session returns HTTP 500 without leaking secrets when secret is missing', async () => {
  const origSecret = process.env.SUPER_ADMIN_JWT_SECRET;
  const origKey = process.env.SUPER_ADMIN_API_KEY;
  delete process.env.SUPER_ADMIN_JWT_SECRET;
  delete process.env.SUPER_ADMIN_API_KEY;

  try {
    const { POST } = await import('../src/app/api/session/route.ts');
    const req = new Request('http://localhost:3000/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'some-token' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 500);

    const json = await res.json();
    assert.equal(json.code, 'missing_session_secret');
    assert.ok(!JSON.stringify(json).includes(origSecret));

    const setCookie = res.headers.get('set-cookie');
    assert.ok(!setCookie || !setCookie.includes('sa_session='));
  } finally {
    process.env.SUPER_ADMIN_JWT_SECRET = origSecret;
    if (origKey) process.env.SUPER_ADMIN_API_KEY = origKey;
  }
});
