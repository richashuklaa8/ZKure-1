import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from './db';

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use((req: Request, res: Response, next: () => void) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Request origin is not allowed' });
  next();
});

type AppRole = 'Patient' | 'Hospital' | 'Insurer' | 'Admin';
type AuthUser = { id: string; email: string; role: AppRole; linkedId: string | null };
declare global { namespace Express { interface Request { authUser?: AuthUser } } }

const scrypt = promisify(crypto.scrypt);
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const apiAttempts = new Map<string, { count: number; resetAt: number }>();
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/') || req.path === '/api/health') return next();
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = apiAttempts.get(key);
  if (current && current.resetAt > now && current.count >= 300) return res.status(429).json({ error: 'Request limit exceeded' });
  apiAttempts.set(key, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: current && current.resetAt > now ? current.resetAt : now + 60_000 });
  if (apiAttempts.size > 10000) for (const [ip, entry] of apiAttempts) if (entry.resetAt <= now) apiAttempts.delete(ip);
  next();
});
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const passwordHash = async (password: string, salt = crypto.randomBytes(16).toString('hex')) => {
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};
const passwordMatches = async (password: string, stored: string) => {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex || '')) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  return crypto.timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
};
const tokenDigest = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
function readSessionToken(req: Request) {
  const bearer = req.header('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (bearer) return bearer;
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('azk_session='));
  return cookie ? decodeURIComponent(cookie.slice('azk_session='.length)) : undefined;
}
async function uploadCiphertextToIpfs(ciphertext: Buffer): Promise<string | null> {
  const apiBase = process.env.IPFS_API_URL?.replace(/\/$/, '');
  if (!apiBase) return null;
  const apiUrl = new URL(apiBase);
  if (apiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) throw new Error('IPFS_API_URL must use HTTPS unless it targets localhost');
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(ciphertext)]), 'medical-record.enc');
  const headers = new Headers();
  if (process.env.IPFS_API_TOKEN) headers.set('Authorization', `Bearer ${process.env.IPFS_API_TOKEN}`);
  const response = await fetch(`${apiBase}/api/v0/add?pin=true&cid-version=1`, { method: 'POST', headers, body: form, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`IPFS upload failed (${response.status})`);
  const result = await response.json() as { Hash?: string; Cid?: { '/': string } };
  const cid = result.Hash || result.Cid?.['/'];
  const validCid = typeof cid === 'string' && (/^b[a-z2-7]{20,}$/i.test(cid) || /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid));
  if (!validCid) throw new Error('IPFS returned an invalid CID');
  return cid;
}
async function fetchCiphertextFromIpfs(cid: string): Promise<Buffer> {
  const apiBase = process.env.IPFS_API_URL?.replace(/\/$/, '');
  if (!apiBase) throw new Error('IPFS is not configured');
  const apiUrl = new URL(apiBase);
  if (apiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) throw new Error('IPFS_API_URL must use HTTPS unless it targets localhost');
  const headers = new Headers();
  if (process.env.IPFS_API_TOKEN) headers.set('Authorization', `Bearer ${process.env.IPFS_API_TOKEN}`);
  const response = await fetch(`${apiBase}/api/v0/cat?arg=${encodeURIComponent(cid)}`, { method: 'POST', headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`IPFS retrieval failed (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

// An initial administrator is provisioned only when explicit credentials are supplied.
if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD &&
    !db.prepare('SELECT 1 FROM app_users WHERE role = ?').get('Admin')) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.BOOTSTRAP_ADMIN_EMAIL.trim())) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
  if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(process.env.BOOTSTRAP_ADMIN_PASSWORD, salt, 64).toString('hex');
  db.prepare('INSERT INTO app_users (id,email,passwordHash,role,linkedId,createdAt) VALUES (?,?,?,?,?,?)')
    .run(crypto.randomUUID(), process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(), `${salt}:${derived}`, 'Admin', null, Date.now());
}

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const attemptKey = `${ip}:${email.slice(0, 254)}`;
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.resetAt > now && attempt.count >= 10) return res.status(429).json({ error: 'Too many login attempts; try again later' });
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = db.prepare('SELECT * FROM app_users WHERE email = ?').get(email) as any;
  const dummyHash = '00000000000000000000000000000000:' + '0'.repeat(128);
  const passwordValid = await passwordMatches(password.slice(0, 200), user?.passwordHash || dummyHash);
  const valid = !!user && password.length <= 200 && passwordValid;
  if (!valid) {
    loginAttempts.set(attemptKey, { count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1, resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + 15 * 60 * 1000 });
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  loginAttempts.delete(attemptKey);
  db.prepare('DELETE FROM auth_sessions WHERE expiresAt <= ?').run(now);
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO auth_sessions (tokenHash,userId,expiresAt,createdAt) VALUES (?,?,?,?)')
    .run(tokenDigest(token), user.id, now + sessionLifetimeMs, now);
  const secureCookie = process.env.NODE_ENV === 'production' || req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `azk_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${sessionLifetimeMs / 1000}${secureCookie}`);
  res.json({ expiresAt: now + sessionLifetimeMs, user: { id: user.id, email: user.email, role: user.role, linkedId: user.linkedId } });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = readSessionToken(req);
  if (token) db.prepare('DELETE FROM auth_sessions WHERE tokenHash = ?').run(tokenDigest(token));
  res.setHeader('Set-Cookie', 'azk_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');
  res.status(204).end();
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = readSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const user = db.prepare(`SELECT u.id,u.email,u.role,u.linkedId FROM auth_sessions s JOIN app_users u ON u.id=s.userId WHERE s.tokenHash=? AND s.expiresAt>?`).get(tokenDigest(token), Date.now());
  if (!user) return res.status(401).json({ error: 'Session is invalid or expired' });
  res.json(user);
});

function authenticate(req: Request, res: Response, next: () => void) {
  const token = readSessionToken(req);
  if (!token || token.length > 200) return res.status(401).json({ error: 'Authentication required' });
  const user = db.prepare(`SELECT u.id,u.email,u.role,u.linkedId FROM auth_sessions s JOIN app_users u ON u.id=s.userId WHERE s.tokenHash=? AND s.expiresAt>?`).get(tokenDigest(token), Date.now()) as AuthUser | undefined;
  if (!user) return res.status(401).json({ error: 'Session is invalid or expired' });
  req.authUser = user;
  next();
}

function allowRoles(...roles: AppRole[]) {
  return (req: Request, res: Response, next: () => void) => {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.authUser.role)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}

function recordKeyring(): { activeVersion: number; keys: Map<number, Buffer> } | null {
  try {
    const configured = process.env.RECORD_KEYRING_JSON;
    const raw: Record<string, string> = configured
      ? JSON.parse(configured)
      : (process.env.RECORD_ENCRYPTION_KEY ? { '1': process.env.RECORD_ENCRYPTION_KEY } : {});
    const keys = new Map<number, Buffer>();
    for (const [versionText, hex] of Object.entries(raw)) {
      const version = Number(versionText);
      if (!Number.isSafeInteger(version) || version < 1 || !/^[a-fA-F0-9]{64}$/.test(hex)) return null;
      keys.set(version, Buffer.from(hex, 'hex'));
    }
    const activeVersion = Number(process.env.RECORD_ACTIVE_KEY_VERSION || Math.max(...keys.keys()));
    if (!keys.size || !keys.has(activeVersion)) return null;
    return { activeVersion, keys };
  } catch { return null; }
}

app.post('/api/admin/users', authenticate, allowRoles('Admin'), async (req: Request, res: Response) => {
  const { email, password, role, linkedId } = req.body || {};
  const normalizedLinkedId = typeof linkedId === 'string' ? linkedId.trim() : null;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      typeof password !== 'string' || password.length < 12 || password.length > 200 ||
      !['Patient', 'Hospital', 'Insurer', 'Admin'].includes(role) || (role !== 'Admin' && !normalizedLinkedId)) {
    return res.status(400).json({ error: 'Provide a valid email, password (12–200 chars), role, and linkedId for non-admin roles' });
  }
  if (role !== 'Admin') {
    const linkedExists = role === 'Insurer'
      ? db.prepare('SELECT 1 FROM patients WHERE insurerName=?').get(normalizedLinkedId)
      : db.prepare(`SELECT 1 FROM ${role === 'Patient' ? 'patients' : 'hospitals'} WHERE id=?`).get(normalizedLinkedId);
    if (!linkedExists) return res.status(400).json({ error: 'linkedId does not identify an existing account record' });
  }
  try {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO app_users (id,email,passwordHash,role,linkedId,createdAt) VALUES (?,?,?,?,?,?)')
      .run(id, email.trim().toLowerCase(), await passwordHash(password), role, normalizedLinkedId, Date.now());
    return res.status(201).json({ id, email: email.trim().toLowerCase(), role, linkedId: normalizedLinkedId });
  } catch {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
});

app.post('/api/admin/records/rotate-key', authenticate, allowRoles('Admin'), (req: Request, res: Response) => {
  const keyring = recordKeyring();
  if (!keyring) return res.status(503).json({ error: 'Record keyring is not configured' });
  const targetKey = keyring.keys.get(keyring.activeVersion)!;
  const records = db.prepare('SELECT id,keyVersion,wrappedDataKey,wrappedKeyIv,wrappedKeyTag FROM medical_records').all() as any[];
  try {
    const rotate = db.transaction(() => {
      const update = db.prepare('UPDATE medical_records SET keyVersion=?,wrappedDataKey=?,wrappedKeyIv=?,wrappedKeyTag=? WHERE id=?');
      for (const record of records) {
        let dataKey: Buffer;
        if (record.wrappedDataKey && record.wrappedKeyIv && record.wrappedKeyTag && record.keyVersion) {
          const oldKey = keyring.keys.get(Number(record.keyVersion));
          if (!oldKey) throw new Error('A required old record key is unavailable');
          const unwrap = crypto.createDecipheriv('aes-256-gcm', oldKey, Buffer.from(record.wrappedKeyIv, 'hex'));
          unwrap.setAuthTag(Buffer.from(record.wrappedKeyTag, 'hex'));
          dataKey = Buffer.concat([unwrap.update(Buffer.from(record.wrappedDataKey, 'base64')), unwrap.final()]);
        } else {
          const legacyKey = process.env.RECORD_ENCRYPTION_KEY;
          if (!legacyKey || !/^[a-fA-F0-9]{64}$/.test(legacyKey)) throw new Error('A legacy record key is unavailable');
          dataKey = Buffer.from(legacyKey, 'hex');
        }
        const iv = crypto.randomBytes(12);
        const wrap = crypto.createCipheriv('aes-256-gcm', targetKey, iv);
        const wrapped = Buffer.concat([wrap.update(dataKey), wrap.final()]);
        update.run(keyring.activeVersion, wrapped.toString('base64'), iv.toString('hex'), wrap.getAuthTag().toString('hex'), record.id);
      }
    });
    rotate();
  } catch {
    return res.status(409).json({ error: 'Key rotation failed; no records were changed. Ensure every previous key version is present in the keyring.' });
  }
  appendAuditLog({ actorRole: 'Admin', actorName: req.authUser!.email, action: `Rewrapped record data keys to key version ${keyring.activeVersion}`, targetResource: `${records.length} medical records`, txHash: '', privacyImpact: 'Encryption key metadata rotated' });
  res.json({ rotated: records.length, activeKeyVersion: keyring.activeVersion });
});

// Helper: Append Audit Log to SQLite
function appendAuditLog(entry: {
  actorRole: string;
  actorName: string;
  action: string;
  targetResource: string;
  txHash: string;
  privacyImpact: string;
}) {
  const id = `AUD-${crypto.randomUUID()}`;
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  const now = Date.now();

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actorRole, actorName, action, targetResource, txHash, privacyImpact, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, timestamp, entry.actorRole, entry.actorName, entry.action, entry.targetResource, entry.txHash, entry.privacyImpact, now);
}

// -------------------------------------------------------------
// 1. Health & Architecture Info
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: 'Not configured',
    engine: 'Groth16 prover/verifier not configured',
    circuit: { status: 'No circuit or verification key is present in this repository' },
    database: {
      driver: 'node:sqlite (WAL mode)',
      status: 'connected'
    }
  });
});

// Health remains public. Every other API route is authenticated by default.
app.use('/api', authenticate);

// India-focused sample fixtures for the prototype. These never enter claim settlement.
app.get('/api/prototype/dataset', (req: Request, res: Response) => {
  const user = req.authUser!;
  let patients = db.prepare('SELECT * FROM prototype_patients ORDER BY id').all() as any[];
  let hospitals = db.prepare('SELECT * FROM prototype_hospitals ORDER BY id').all() as any[];
  let cases = db.prepare('SELECT * FROM prototype_cases ORDER BY id').all() as any[];
  if (user.role === 'Patient') {
    patients = patients.filter((p) => p.id === user.linkedId);
    const allowed = new Set(patients.map((p) => p.id));
    cases = cases.filter((c) => allowed.has(c.patientId));
    const hospitalIds = new Set(cases.map((c) => c.hospitalId));
    hospitals = hospitals.filter((h) => hospitalIds.has(h.id));
  } else if (user.role === 'Hospital') {
    hospitals = hospitals.filter((h) => h.id === user.linkedId);
    cases = cases.filter((c) => c.hospitalId === user.linkedId);
    const patientIds = new Set(cases.map((c) => c.patientId));
    patients = patients.filter((p) => patientIds.has(p.id));
  } else if (user.role === 'Insurer') {
    patients = patients.filter((p) => p.insurerName === user.linkedId);
    cases = cases.filter((c) => c.insurerName === user.linkedId);
    const hospitalIds = new Set(cases.map((c) => c.hospitalId));
    patients = patients.map(({ name: _name, city: _city, state: _state, ...policy }) => policy);
    hospitals = hospitals.filter((h) => hospitalIds.has(h.id));
  }
  res.json({
    datasetType: 'synthetic prototype data',
    disclaimer: 'All people, providers, policies and cases are fictional examples. Amounts are INR. Cases are not submitted claims; no signatures, proofs, settlements or blockchain transactions are represented.',
    currency: 'INR',
    insurers: user.role === 'Admin' ? prototypeInsurers : undefined,
    patients,
    hospitals,
    cases
  });
});

// -------------------------------------------------------------
// 2. Patient Profile
// -------------------------------------------------------------
app.get('/api/patient/profile', allowRoles('Patient'), (req: Request, res: Response) => {
  const patient = db.prepare('SELECT id,name,zkId,policyNumber,insurerName,planName,coverageLimit,spentAmount,validTill,didUri FROM patients WHERE id = ?').get(req.authUser?.linkedId || '');
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// -------------------------------------------------------------
// 3. Medical Records (FHIR + AES-256-GCM)
// -------------------------------------------------------------
app.get('/api/records', allowRoles('Patient', 'Hospital'), (req: Request, res: Response) => {
  const { category, sharedOnly } = req.query;
  const categories = ['All', 'Lab Report', 'Discharge Summary', 'Diagnostic Imaging', 'Prescription'];
  if ((category !== undefined && (typeof category !== 'string' || !categories.includes(category))) || (sharedOnly !== undefined && sharedOnly !== 'true' && sharedOnly !== 'false')) return res.status(400).json({ error: 'Invalid record filters' });
  let query = 'SELECT * FROM medical_records WHERE 1=1';
  const params: any[] = [];

  if (req.authUser?.role === 'Patient') {
    query += ' AND patientId = ?';
    params.push(req.authUser.linkedId);
  } else if (req.authUser?.role === 'Hospital') {
    query += ` AND sharedWithHospitalId = ? AND accessExpiresAt > ? AND EXISTS (
      SELECT 1 FROM access_permissions p WHERE p.patientId=medical_records.patientId
      AND p.hospitalId=? AND p.status='Active' AND p.expiresAt>? AND EXISTS (SELECT 1 FROM json_each(p.recordIds) AS permitted WHERE permitted.value=medical_records.id)
    )`;
    params.push(req.authUser.linkedId, Date.now(), req.authUser.linkedId, Date.now());
  }

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (sharedOnly === 'true') {
    query += ' AND sharedWithHospitalId IS NOT NULL';
  }

  query += ' ORDER BY createdAt DESC';
  const records = db.prepare(query).all(...params).map((record: any) => {
    const { clinicalNotesEncrypted, ciphertext, encryptionIv, authenticationTag, wrappedDataKey, wrappedKeyIv, wrappedKeyTag, keyVersion, fhirPayload, ...metadata } = record;
    if (!record.ciphertext || !record.encryptionIv || !record.authenticationTag) {
      metadata.encryptionStatus = 'Legacy demo; encryption not verified';
      metadata.sha256Hash = '';
      metadata.ipfsCid = '';
      metadata.anchorTxHash = '';
    }
    return metadata;
  });
  res.json(records);
});

app.post('/api/records', allowRoles('Patient'), async (req: Request, res: Response) => {
  const { title, category, hospitalName, clinicalNotes } = req.body;
  const categories = ['Lab Report', 'Discharge Summary', 'Diagnostic Imaging', 'Prescription'];
  if (typeof title !== 'string' || !title.trim() || title.length > 200 || typeof clinicalNotes !== 'string' || !clinicalNotes.trim() || clinicalNotes.length > 20000 || (category !== undefined && !categories.includes(category)) || (hospitalName !== undefined && (typeof hospitalName !== 'string' || hospitalName.length > 200))) {
    return res.status(400).json({ error: 'A title (max 200 chars) and clinicalNotes (max 20,000 chars) are required' });
  }

  const keyring = recordKeyring();
  if (!keyring) {
    return res.status(503).json({ error: 'Record encryption is not configured; record was not stored' });
  }

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.authUser?.linkedId || '') as any;
  if (!patient) return res.status(404).json({ error: 'Patient account is not linked to a patient profile' });
  const id = `REC-${crypto.randomUUID()}`;
  const now = Date.now();
  const date = new Date().toISOString().slice(0, 10);

  // Compute SHA-256 fingerprint
  const iv = crypto.randomBytes(12);
  const dataKey = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  const plaintext = Buffer.from(JSON.stringify({ title: title.trim(), clinicalNotes, timestamp: now }), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();
  const wrappedKeyIv = crypto.randomBytes(12);
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', keyring.keys.get(keyring.activeVersion)!, wrappedKeyIv);
  const wrappedDataKey = Buffer.concat([wrapCipher.update(dataKey), wrapCipher.final()]);
  const wrappedKeyTag = wrapCipher.getAuthTag();
  const hash = '0x' + crypto.createHash('sha256').update(plaintext).digest('hex');
  let ipfsCid: string | null;
  try { ipfsCid = await uploadCiphertextToIpfs(ciphertext); }
  catch { return res.status(502).json({ error: 'IPFS upload failed; record was not stored' }); }
  // No chain client is configured. Never invent an anchor transaction hash.
  const anchorTx = '';

  db.prepare(`
    INSERT INTO medical_records (
      id, patientId, title, category, date, hospitalName, encryptionStatus,
      sha256Hash, ipfsCid, anchorTxHash, sharedWithHospitalId, sharedWithHospitalName,
      accessExpiresAt, clinicalNotesEncrypted, ciphertext, encryptionIv, authenticationTag, keyVersion,
      wrappedDataKey, wrappedKeyIv, wrappedKeyTag, fhirPayload, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, patient.id, 'Encrypted medical record', category || 'Lab Report', date, '',
    ipfsCid ? 'AES-256-GCM Encrypted + IPFS' : 'AES-256-GCM Encrypted (local)', hash, ipfsCid || '', anchorTx, null, null, null,
    null, ciphertext.toString('base64'), iv.toString('hex'), authenticationTag.toString('hex'), keyring.activeVersion,
    wrappedDataKey.toString('base64'), wrappedKeyIv.toString('hex'), wrappedKeyTag.toString('hex'), null,
    now
  );

  appendAuditLog({
    actorRole: 'Patient',
    actorName: `Patient ${patient.id}`,
    action: ipfsCid ? 'Created AES-256-GCM encrypted medical record and uploaded ciphertext to IPFS' : 'Created AES-256-GCM encrypted medical record in local storage',
    targetResource: id,
    txHash: '',
    privacyImpact: 'Encrypted Vault Write'
  });

  // Never return encrypted payload or key material from the write endpoint.
  res.status(201).json({
    id, category, date,
    status: ipfsCid ? 'AES-256-GCM Encrypted + IPFS' : 'AES-256-GCM Encrypted (local)',
    createdAt: now
  });
});

app.get('/api/records/:id/decrypt', allowRoles('Patient', 'Hospital'), async (req: Request, res: Response) => {
  const record = db.prepare('SELECT * FROM medical_records WHERE id=?').get(req.params.id) as any;
  if (!record) return res.status(404).json({ error: 'Record not found' });
  if (req.authUser?.role === 'Patient' && record.patientId !== req.authUser.linkedId) return res.status(403).json({ error: 'Record is not owned by this patient' });
  if (req.authUser?.role === 'Hospital') {
    const permission = db.prepare(`SELECT 1 FROM access_permissions p WHERE patientId=? AND hospitalId=? AND status='Active' AND expiresAt>? AND EXISTS (SELECT 1 FROM json_each(p.recordIds) AS permitted WHERE permitted.value=?)`).get(record.patientId, req.authUser.linkedId, Date.now(), record.id);
    if (!permission) return res.status(403).json({ error: 'No active consent for this record' });
  }
  const keyring = recordKeyring();
  if (!keyring) return res.status(503).json({ error: 'Record decryption is not configured' });
  try {
    const encrypted = record.ipfsCid ? await fetchCiphertextFromIpfs(record.ipfsCid) : Buffer.from(record.ciphertext || '', 'base64');
    let dataKey: Buffer;
    if (record.wrappedDataKey && record.wrappedKeyIv && record.wrappedKeyTag && record.keyVersion) {
      const kek = keyring.keys.get(Number(record.keyVersion));
      if (!kek) return res.status(503).json({ error: 'Record encryption key version is unavailable; restore the matching key backup' });
      const unwrap = crypto.createDecipheriv('aes-256-gcm', kek, Buffer.from(record.wrappedKeyIv, 'hex'));
      unwrap.setAuthTag(Buffer.from(record.wrappedKeyTag, 'hex'));
      dataKey = Buffer.concat([unwrap.update(Buffer.from(record.wrappedDataKey, 'base64')), unwrap.final()]);
    } else {
      // Legacy rows used RECORD_ENCRYPTION_KEY directly as the data key.
      const legacyKey = process.env.RECORD_ENCRYPTION_KEY;
      if (!legacyKey || !/^[a-fA-F0-9]{64}$/.test(legacyKey)) return res.status(503).json({ error: 'Legacy record key is unavailable' });
      dataKey = Buffer.from(legacyKey, 'hex');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, Buffer.from(record.encryptionIv, 'hex'));
    decipher.setAuthTag(Buffer.from(record.authenticationTag, 'hex'));
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const actualHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    if (actualHash !== String(record.sha256Hash).replace(/^0x/, '')) return res.status(422).json({ error: 'Record integrity verification failed' });
    const payload = JSON.parse(plaintext.toString('utf8'));
    res.json({ id: record.id, sha256Hash: record.sha256Hash, title: payload.title, clinicalNotes: payload.clinicalNotes });
  } catch {
    res.status(422).json({ error: 'Encrypted record failed authentication or could not be retrieved' });
  }
});

// -------------------------------------------------------------
// 4. Access Permissions (ABDM / DPDP Consent Tokens)
// -------------------------------------------------------------
app.get('/api/permissions', allowRoles('Patient', 'Hospital'), (req: Request, res: Response) => {
  const permissionsQuery = req.authUser?.role === 'Patient'
    ? db.prepare('SELECT * FROM access_permissions WHERE patientId = ? ORDER BY rowid DESC').all(req.authUser.linkedId)
    : db.prepare("SELECT * FROM access_permissions WHERE hospitalId=? AND status='Active' AND expiresAt>? ORDER BY rowid DESC").all(req.authUser?.linkedId, Date.now());
  const permissions = permissionsQuery.map((p: any) => ({
    ...p,
    recordIds: JSON.parse(p.recordIds),
    status: p.status === 'Active' && p.expiresAt <= Date.now() ? 'Expired' : p.status
  }));
  res.json(permissions);
});

app.post('/api/permissions/grant', allowRoles('Patient'), (req: Request, res: Response) => {
  const { hospitalId, recordIds, hours } = req.body;
  if (typeof hospitalId !== 'string' || !Array.isArray(recordIds)) {
    return res.status(400).json({ error: 'Invalid permission payload' });
  }

  if (recordIds.length < 1 || recordIds.length > 100 || recordIds.some((id: unknown) => typeof id !== 'string')) return res.status(400).json({ error: 'recordIds must contain 1 to 100 record IDs' });
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.authUser?.linkedId || '') as any;
  if (!patient) return res.status(404).json({ error: 'Patient account is not linked to a patient profile' });
  const hospital = db.prepare("SELECT id,name,nabhRegistration FROM hospitals WHERE id=? AND status='Verified'").get(hospitalId) as any;
  if (!hospital) return res.status(400).json({ error: 'Hospital is not verified' });
  const ownedCount = (db.prepare(`SELECT COUNT(*) AS count FROM medical_records WHERE patientId=? AND id IN (${recordIds.map(() => '?').join(',')})`).get(patient.id, ...recordIds) as any)?.count;
  if (ownedCount !== recordIds.length) return res.status(403).json({ error: 'One or more records are not owned by this patient' });
  if (!Number.isInteger(Number(hours)) || Number(hours) < 1 || Number(hours) > 24) return res.status(400).json({ error: 'hours must be between 1 and 24' });
  const permId = `PRM-${crypto.randomUUID()}`;
  const now = Date.now();
  const expiresAt = now + Number(hours) * 3600 * 1000;
  const grantedAt = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  const txHash = '';

  const grantPermission = db.transaction(() => {
    db.prepare(`
    INSERT INTO access_permissions (
      id, patientId, hospitalId, hospitalName, nabhId, scope, recordIds, grantedAt, expiresAt, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      permId, patient.id, hospitalId, hospital.name, hospital.nabhRegistration,
      `Scoped read access for ${recordIds.length} record(s) — Zero export allowed`,
      JSON.stringify(recordIds), grantedAt, expiresAt, 'Active'
    );

    // These columns are a UI cache only; access is always authorized from permission rows.
    const updateRecord = db.prepare(`UPDATE medical_records
      SET sharedWithHospitalId = ?, sharedWithHospitalName = ?, accessExpiresAt = ? WHERE id = ?`);
    for (const rid of recordIds) updateRecord.run(hospitalId, hospital.name, expiresAt, rid);
  });
  grantPermission();

  appendAuditLog({
    actorRole: 'Patient',
    actorName: `${patient.name} (${patient.id})`,
    action: `Granted ${hours}h temporary access token to ${hospital.name}`,
    targetResource: recordIds.join(', '),
    txHash: txHash.slice(0, 14) + '...',
    privacyImpact: 'Consent Updated'
  });

  res.status(201).json({ id: permId, status: 'Active', expiresAt, hospitalName: hospital.name, nabhId: hospital.nabhRegistration });
});

app.post('/api/permissions/revoke/:id', allowRoles('Patient'), (req: Request, res: Response) => {
  const perm = db.prepare('SELECT * FROM access_permissions WHERE id = ? AND patientId = ?').get(req.params.id, req.authUser?.linkedId) as any;
  if (!perm) return res.status(404).json({ error: 'Permission not found' });

  const recordIds: string[] = JSON.parse(perm.recordIds);
  const revokePermission = db.transaction(() => {
    db.prepare("UPDATE access_permissions SET status = 'Revoked' WHERE id = ?").run(req.params.id);
    const refreshRecord = db.prepare(`UPDATE medical_records SET
      sharedWithHospitalId = (SELECT p.hospitalId FROM access_permissions p
        WHERE p.patientId=medical_records.patientId AND p.status='Active' AND p.expiresAt>?
          AND EXISTS (SELECT 1 FROM json_each(p.recordIds) j WHERE j.value=medical_records.id)
        ORDER BY p.expiresAt DESC LIMIT 1),
      sharedWithHospitalName = (SELECT p.hospitalName FROM access_permissions p
        WHERE p.patientId=medical_records.patientId AND p.status='Active' AND p.expiresAt>?
          AND EXISTS (SELECT 1 FROM json_each(p.recordIds) j WHERE j.value=medical_records.id)
        ORDER BY p.expiresAt DESC LIMIT 1),
      accessExpiresAt = (SELECT MAX(p.expiresAt) FROM access_permissions p
        WHERE p.patientId=medical_records.patientId AND p.status='Active' AND p.expiresAt>?
          AND EXISTS (SELECT 1 FROM json_each(p.recordIds) j WHERE j.value=medical_records.id))
      WHERE id=? AND patientId=?`);
    for (const rid of recordIds) refreshRecord.run(Date.now(), Date.now(), Date.now(), rid, perm.patientId);
  });
  revokePermission();

  const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.authUser?.linkedId || '') as any;

  appendAuditLog({
    actorRole: 'Patient',
    actorName: `${patient.name} (${patient.id})`,
    action: `Revoked access token ${perm.id} immediately`,
    targetResource: perm.hospitalName,
    txHash: '',
    privacyImpact: 'Consent Updated'
  });

  res.json({ message: 'Permission revoked successfully', id: perm.id });
});

// -------------------------------------------------------------
// 5. Insurance Claims (Groth16 + Two-Party Authorization + Hybrid Settlement)
// -------------------------------------------------------------
app.get('/api/claims', allowRoles('Patient', 'Hospital', 'Insurer'), (req: Request, res: Response) => {
  // Existing database rows were generated by the retired demo implementation, not real claim workflows.
  res.json([]);
});

app.get('/api/claims/:id', allowRoles('Patient', 'Hospital', 'Insurer'), (req: Request, res: Response) => {
  res.status(404).json({ error: 'Claim not found; legacy demonstration claims are not exposed' });
});

app.post('/api/claims', allowRoles('Hospital'), (_req: Request, res: Response) => res.status(503).json({ error: 'Claim submission is disabled until a real signature service and Groth16 prover/verifier are configured' }));

app.post('/api/claims/:id/settle', allowRoles('Insurer'), (_req: Request, res: Response) => res.status(503).json({ error: 'Settlement is disabled until a real insurer payout adapter is configured' }));

app.post('/api/claims/:id/reject', allowRoles('Insurer'), (_req: Request, res: Response) => res.status(503).json({ error: 'Claim decisions are disabled until an insurer authorization workflow is configured' }));

// 6. Hospital Registry (Depth-16 Merkle Tree)
// -------------------------------------------------------------
app.get('/api/hospitals', allowRoles('Hospital', 'Admin'), (_req: Request, res: Response) => {
  const hospitals = db.prepare('SELECT id,name,nabhRegistration,city,status,walletAddress,merkleLeafIndex,bondedCollateralInr FROM hospitals ORDER BY merkleLeafIndex ASC').all().map((hospital: any) => ({
    ...hospital,
    status: hospital.status === 'Verified' ? 'Locally Verified' : hospital.status,
    walletAddress: /^0x[a-fA-F0-9]{40}$/.test(hospital.walletAddress) ? hospital.walletAddress : ''
  }));
  res.json(hospitals);
});

app.post('/api/hospitals', allowRoles('Admin'), (req: Request, res: Response) => {
  const { name, nabhRegistration, city, walletAddress } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 200 || typeof nabhRegistration !== 'string' || !nabhRegistration.trim() || nabhRegistration.length > 100 || typeof city !== 'string' || !city.trim() || city.length > 120 || (walletAddress !== undefined && (typeof walletAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)))) return res.status(400).json({ error: 'Invalid hospital registration details' });
  const countRow = db.prepare('SELECT COUNT(*) as count FROM hospitals').get() as { count: number };
  const id = `HSP-${700 + countRow.count}`;

  db.prepare(`
    INSERT INTO hospitals (id, name, nabhRegistration, city, status, walletAddress, eddsaPublicKey, merkleLeafIndex, bondedCollateralInr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), nabhRegistration.trim(), city.trim(), 'Pending Approval', walletAddress || '', '', countRow.count, 500000);

  res.status(201).json({ id, status: 'Pending Approval' });
});

app.post('/api/hospitals/:id/approve', allowRoles('Admin'), (req: Request, res: Response) => {
  db.prepare("UPDATE hospitals SET status = 'Verified' WHERE id = ?").run(req.params.id);

  appendAuditLog({
    actorRole: 'Admin',
    actorName: 'ArogyaZK Network Governance',
    action: `Marked hospital ${req.params.id} as locally verified`,
    targetResource: req.params.id,
    txHash: '',
    privacyImpact: 'Consent Updated'
  });

  res.json({ message: 'Hospital marked verified in the local registry; no chain enrollment was performed', id: req.params.id, status: 'Locally Verified' });
});

// -------------------------------------------------------------
// 7. Emergency Break-Glass (2-of-3 Shamir Secret Sharing)
// -------------------------------------------------------------
app.get('/api/break-glass', allowRoles('Hospital'), (req: Request, res: Response) => {
  const sessions = db.prepare('SELECT * FROM break_glass_sessions WHERE hospitalId=? ORDER BY createdAt DESC').all(req.authUser?.linkedId);
  res.json(sessions);
});

app.post('/api/break-glass/request', allowRoles('Hospital'), (_req: Request, res: Response) => res.status(503).json({ error: 'Emergency access is disabled until guardian signatures and secret reconstruction are implemented' }));

app.post('/api/break-glass/:id/sign', allowRoles('Hospital'), (_req: Request, res: Response) => res.status(503).json({ error: 'Guardian signing is disabled until cryptographic share verification is configured' }));

// 8. Smart Contracts Telemetry & Blockchain Subnet
// -------------------------------------------------------------
app.get('/api/contracts', allowRoles('Admin'), (_req: Request, res: Response) => {
  res.json([]);
});

app.get('/api/audit-logs', allowRoles('Admin'), (req: Request, res: Response) => {
  const { role, impact } = req.query;
  const roles = ['Patient', 'Hospital', 'Insurer', 'Smart Contract', 'Admin', 'All'];
  const impacts = ['Zero PHI Exposed', 'Encrypted Vault Write', 'Consent Updated', 'All'];
  if ((role !== undefined && (typeof role !== 'string' || !roles.includes(role))) || (impact !== undefined && (typeof impact !== 'string' || !impacts.includes(impact)))) return res.status(400).json({ error: 'Invalid audit filters' });
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (role && role !== 'All') {
    query += ' AND actorRole = ?';
    params.push(role);
  }

  if (impact && impact !== 'All') {
    query += ' AND privacyImpact = ?';
    params.push(impact);
  }

  query += ' ORDER BY createdAt DESC';
  const logs = db.prepare(query).all(...params).filter((entry: any) => !entry.txHash && !['AUD-901', 'AUD-900', 'AUD-899'].includes(entry.id)).map((entry: any) => ({
    ...entry,
    txHash: '',
    action: /Groth16|on-chain|anchored/i.test(entry.action) ? 'Legacy demo event; operation has not been verified' : entry.action
  }));
  res.json(logs);
});

app.get('/api/blockchain/blocks', allowRoles('Admin'), (_req: Request, res: Response) => {
  res.json([]);
});

app.get('/api/blockchain/transactions', allowRoles('Admin'), (_req: Request, res: Response) => {
  res.json([]);
});

app.use((error: any, _req: Request, res: Response, _next: (error?: unknown) => void) => {
  const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ error: status === 413 ? 'Request body is too large' : status === 400 ? 'Invalid request body' : 'Internal server error' });
});

// Serve the built frontend when running the API server outside Vite.
const frontendDistPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get('/{*path}', (req: Request, res: Response, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(frontendIndexPath, (error) => {
      if (error) next(error);
    });
  });
}

// -------------------------------------------------------------
// Start Express Server
// -------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), HOST, () => {
    console.log(`[ArogyaZK Backend] Express server running at http://${HOST}:${PORT}`);
    console.log(`[ArogyaZK Backend] Database connected; cryptographic claim integrations are disabled until configured`);
  });
}

export { app };
