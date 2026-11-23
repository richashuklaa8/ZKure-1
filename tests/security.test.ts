import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const testDir = mkdtempSync(path.join(os.tmpdir(), 'arogyazk-security-'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(testDir, 'security.db');
process.env.BOOTSTRAP_ADMIN_EMAIL = 'security-admin@example.test';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'Security-Test-Admin-Password-1';
process.env.RECORD_ENCRYPTION_KEY = 'a'.repeat(64);

const [{ app }, { db }] = await Promise.all([import('../server/index.js'), import('../server/db.js')]);
const server = app.listen(0, '127.0.0.1');
let baseUrl = '';
let adminToken = '';
let patientToken = '';
let hospitalToken = '';
let insurerToken = '';
let createdRecordId = '';

before(async () => {
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test API listener did not bind to a TCP port');
  baseUrl = `http://127.0.0.1:${address.port}/api`;
  adminToken = await login('security-admin@example.test', 'Security-Test-Admin-Password-1');
  await createUser('patient-security@example.test', 'Patient-Test-Password-123', 'Patient', 'PAT-9041');
  await createUser('hospital-security@example.test', 'Hospital-Test-Password-123', 'Hospital', 'HSP-402');
  await createUser('insurer-security@example.test', 'Insurer-Test-Password-123', 'Insurer', 'Star Shield Health Assurance');
  patientToken = await login('patient-security@example.test', 'Patient-Test-Password-123');
  hospitalToken = await login('hospital-security@example.test', 'Hospital-Test-Password-123');
  insurerToken = await login('insurer-security@example.test', 'Insurer-Test-Password-123');
});

after(() => {
  server.close();
  db.close();
  rmSync(testDir, { recursive: true, force: true });
});

async function login(email: string, password: string) {
  const response = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  assert.equal(response.status, 200);
  const responseBody = await response.json() as Record<string, unknown>;
  assert.equal('token' in responseBody, false, 'session token must not be returned to browser JavaScript');
  const sessionCookie = response.headers.get('set-cookie')?.match(/azk_session=([^;]+)/)?.[1];
  assert.ok(sessionCookie, 'login should issue an HttpOnly session cookie');
  return decodeURIComponent(sessionCookie);
}

async function createUser(email: string, password: string, role: string, linkedId: string) {
  const response = await fetch(`${baseUrl}/admin/users`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, role, linkedId }) });
  assert.equal(response.status, 201);
}

test('sensitive records endpoint rejects unauthenticated requests', async () => {
  const response = await fetch(`${baseUrl}/records`);
  assert.equal(response.status, 401);
});

test('all sensitive API route groups require authentication', async () => {
  const requests: Array<[string, string]> = [
    ['GET', '/patient/profile'], ['GET', '/records'], ['GET', '/records/REC-test/decrypt'], ['POST', '/records'],
    ['GET', '/permissions'], ['POST', '/permissions/grant'], ['POST', '/permissions/revoke/PRM-test'],
    ['GET', '/claims'], ['GET', '/claims/CLM-test'], ['POST', '/claims'], ['POST', '/claims/CLM-test/settle'], ['POST', '/claims/CLM-test/reject'],
    ['GET', '/hospitals'], ['POST', '/hospitals'], ['POST', '/hospitals/HSP-test/approve'],
    ['GET', '/break-glass'], ['POST', '/break-glass/request'], ['POST', '/break-glass/EMG-test/sign'],
    ['GET', '/contracts'], ['GET', '/audit-logs'], ['GET', '/blockchain/blocks'], ['GET', '/blockchain/transactions'],
    ['POST', '/admin/users']
  ];
  for (const [method, route] of requests) {
    const response = await fetch(`${baseUrl}${route}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
    assert.equal(response.status, 401, `${method} ${route} should require authentication`);
  }
});

test('roles cannot read another role’s registry endpoints', async () => {
  const response = await fetch(`${baseUrl}/hospitals`, { headers: { Authorization: `Bearer ${patientToken}` } });
  assert.equal(response.status, 403);
});

test('expired sessions are rejected', async () => {
  const digest = crypto.createHash('sha256').update(patientToken).digest('hex');
  db.prepare('UPDATE auth_sessions SET expiresAt=? WHERE tokenHash=?').run(Date.now() - 1, digest);
  const response = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${patientToken}` } });
  assert.equal(response.status, 401);
  patientToken = await login('patient-security@example.test', 'Patient-Test-Password-123');
});

test('record metadata omits ciphertext and patient ownership is enforced', async () => {
  const created = await fetch(`${baseUrl}/records`, { method: 'POST', headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Test record', category: 'Lab Report', clinicalNotes: 'Confidential test notes' }) });
  assert.equal(created.status, 201);
  const record = await created.json() as { id: string };
  createdRecordId = record.id;
  const encryptedFields = db.prepare('SELECT ciphertext,encryptionIv,authenticationTag FROM medical_records WHERE id=?').get(createdRecordId) as { ciphertext: string; encryptionIv: string; authenticationTag: string };
  assert.match(encryptedFields.encryptionIv, /^[a-f0-9]{24}$/i);
  assert.match(encryptedFields.authenticationTag, /^[a-f0-9]{32}$/i);
  assert.ok(Buffer.from(encryptedFields.ciphertext, 'base64').length > 0);
  const listed = await fetch(`${baseUrl}/records`, { headers: { Authorization: `Bearer ${patientToken}` } });
  const rows = await listed.json() as Array<Record<string, unknown>>;
  const legacy = rows.find((row) => String(row.encryptionStatus).startsWith('Legacy demo'));
  if (legacy) {
    assert.equal(legacy.sha256Hash, '');
    assert.equal(legacy.ipfsCid, '');
    assert.equal(legacy.anchorTxHash, '');
  }
  const target = rows.find((row) => row.id === createdRecordId)!;
  assert.ok(target);
  assert.equal('ciphertext' in target, false);
  assert.equal('clinicalNotesEncrypted' in target, false);
  assert.equal(target.title, 'Encrypted medical record');
  const decrypted = await fetch(`${baseUrl}/records/${createdRecordId}/decrypt`, { headers: { Authorization: `Bearer ${patientToken}` } });
  assert.equal(decrypted.status, 200);
  assert.deepEqual(await decrypted.json(), { id: createdRecordId, sha256Hash: target.sha256Hash, title: 'Test record', clinicalNotes: 'Confidential test notes' });
  db.prepare(`INSERT INTO patients (id,name,zkId,policyNumber,insurerName,planName,coverageLimit,spentAmount,validTill,secretPolicySalt,policyCommitment,didUri) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('PAT-OTHER', 'Other Patient', 'zk-other', 'POL-other', 'Insurer', 'Plan', 1000, 0, '2027-12-31', 'salt', 'commitment', 'did:example:other');
  await createUser('other-patient@example.test', 'Other-Test-Password-123', 'Patient', 'PAT-OTHER');
  const otherToken = await login('other-patient@example.test', 'Other-Test-Password-123');
  const otherRows = await fetch(`${baseUrl}/records`, { headers: { Authorization: `Bearer ${otherToken}` } }).then((r) => r.json()) as Array<{ id: string }>;
  assert.equal(otherRows.some((row) => row.id === createdRecordId), false);
  const second = await fetch(`${baseUrl}/records`, { method: 'POST', headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Second test record', category: 'Lab Report', clinicalNotes: 'Another confidential note' }) });
  assert.equal(second.status, 201);
  const secondRecord = await second.json() as { id: string };
  const secondIv = (db.prepare('SELECT encryptionIv FROM medical_records WHERE id=?').get(secondRecord.id) as { encryptionIv: string }).encryptionIv;
  assert.notEqual(secondIv, encryptedFields.encryptionIv, 'every record must receive a fresh random IV');
});

test('invalid encryption key is rejected before a record is stored', async () => {
  const oldKey = process.env.RECORD_ENCRYPTION_KEY;
  const recordsBefore = (db.prepare('SELECT COUNT(*) AS count FROM medical_records').get() as { count: number }).count;
  process.env.RECORD_ENCRYPTION_KEY = 'not-a-32-byte-key';
  const response = await fetch(`${baseUrl}/records`, { method: 'POST', headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Should not persist', clinicalNotes: 'test' }) });
  process.env.RECORD_ENCRYPTION_KEY = oldKey;
  assert.equal(response.status, 503);
  const recordsAfter = (db.prepare('SELECT COUNT(*) AS count FROM medical_records').get() as { count: number }).count;
  assert.equal(recordsAfter, recordsBefore);
});

test('expired hospital consent blocks record decryption', async () => {
  const expiresAt = Date.now() - 1000;
  db.prepare(`INSERT INTO access_permissions (id,patientId,hospitalId,hospitalName,nabhId,scope,recordIds,grantedAt,expiresAt,status) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run('PRM-EXPIRED-TEST', 'PAT-9041', 'HSP-402', 'Apollo Spectra Hospital', 'NABH-TEST', 'read', JSON.stringify([createdRecordId]), 'test', expiresAt, 'Active');
  db.prepare('UPDATE medical_records SET sharedWithHospitalId=?,sharedWithHospitalName=?,accessExpiresAt=? WHERE id=?')
    .run('HSP-402', 'Apollo Spectra Hospital', expiresAt, createdRecordId);
  const response = await fetch(`${baseUrl}/records/${createdRecordId}/decrypt`, { headers: { Authorization: `Bearer ${hospitalToken}` } });
  assert.equal(response.status, 403);
});

test('tampered AES-GCM ciphertext fails authentication', async () => {
  const original = db.prepare('SELECT ciphertext FROM medical_records WHERE id=?').get(createdRecordId) as { ciphertext: string };
  const tampered = `${original.ciphertext.slice(0, -4)}AAAA`;
  db.prepare('UPDATE medical_records SET ciphertext=? WHERE id=?').run(tampered, createdRecordId);
  const response = await fetch(`${baseUrl}/records/${createdRecordId}/decrypt`, { headers: { Authorization: `Bearer ${patientToken}` } });
  assert.equal(response.status, 422);
});

test('claim proof and settlement endpoints fail closed without cryptographic adapters', async () => {
  const visibleClaims = await fetch(`${baseUrl}/claims`, { headers: { Authorization: `Bearer ${insurerToken}` } });
  assert.deepEqual(await visibleClaims.json(), [], 'legacy mock claims must not be exposed as live claims');
  const proofResponse = await fetch(`${baseUrl}/claims`, { method: 'POST', headers: { Authorization: `Bearer ${hospitalToken}` } });
  assert.equal(proofResponse.status, 503);
  const settleResponse = await fetch(`${baseUrl}/claims/unknown/settle`, { method: 'POST', headers: { Authorization: `Bearer ${insurerToken}` } });
  assert.equal(settleResponse.status, 503);
});

test('proof generation refuses to return a simulated proof', async () => {
  const { generateAndVerifyClaimZKProof } = await import('../src/services/zkProof.js');
  await assert.rejects(() => generateAndVerifyClaimZKProof(), /no Circom circuit, proving key, or verification key/);
});

test('legacy claim nullifier uniqueness prevents replay at the database boundary', () => {
  const source = db.prepare('SELECT * FROM insurance_claims ORDER BY createdAt LIMIT 1').get() as Record<string, unknown> | undefined;
  assert.ok(source, 'the seeded database should contain a fixture claim');
  assert.throws(() => {
    db.prepare(`INSERT INTO insurance_claims (id,patientId,patientMaskedId,policyNumber,insurerName,hospitalId,hospitalName,treatmentDate,diagnosisCodePrivate,diagnosisSummaryPrivate,billFileName,billHash,claimAmount,settlementTier,status,submittedAt,hospitalSignature,zkProof,nullifierHash,usedRecordHash,settlementTxHash,timeline,createdAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      'CLM-REPLAY-TEST', source.patientId, source.patientMaskedId, source.policyNumber, source.insurerName, source.hospitalId, source.hospitalName,
      source.treatmentDate, source.diagnosisCodePrivate, source.diagnosisSummaryPrivate, source.billFileName, source.billHash, source.claimAmount,
      source.settlementTier, 'Pending', source.submittedAt, source.hospitalSignature, source.zkProof, source.nullifierHash,
      source.usedRecordHash, null, source.timeline, Date.now()
    );
  }, /UNIQUE constraint failed/);
});
