import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { prototypeCases, prototypeHospitals, prototypeInsurers, prototypePatients } from './prototypeDataset';

const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.resolve(process.cwd(), 'data', 'arogyazk.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Patient','Hospital','Insurer','Admin')),
      linkedId TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      tokenHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expiresAt);
  `);
  // 1. Patients Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zkId TEXT NOT NULL,
      policyNumber TEXT NOT NULL,
      insurerName TEXT NOT NULL,
      planName TEXT NOT NULL,
      coverageLimit INTEGER NOT NULL,
      spentAmount INTEGER NOT NULL DEFAULT 0,
      validTill TEXT NOT NULL,
      secretPolicySalt TEXT NOT NULL,
      policyCommitment TEXT NOT NULL,
      didUri TEXT NOT NULL
    );
  `);

  // 2. Medical Records Table (FHIR JSON + AES-256-GCM encrypted payload)
  db.exec(`
    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      hospitalName TEXT NOT NULL,
      encryptionStatus TEXT NOT NULL,
      sha256Hash TEXT NOT NULL,
      ipfsCid TEXT NOT NULL,
      anchorTxHash TEXT NOT NULL,
      sharedWithHospitalId TEXT,
      sharedWithHospitalName TEXT,
      accessExpiresAt INTEGER,
      clinicalNotesEncrypted TEXT,
      ciphertext TEXT,
      encryptionIv TEXT,
      authenticationTag TEXT,
      fhirPayload TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );
  `);

  const medicalRecordColumns = db.prepare('PRAGMA table_info(medical_records)').all() as Array<{ name: string }>;
  for (const [name, type] of [['ciphertext', 'TEXT'], ['encryptionIv', 'TEXT'], ['authenticationTag', 'TEXT'], ['keyVersion', 'INTEGER'], ['wrappedDataKey', 'TEXT'], ['wrappedKeyIv', 'TEXT'], ['wrappedKeyTag', 'TEXT']] as const) {
    if (!medicalRecordColumns.some((column) => column.name === name)) db.exec(`ALTER TABLE medical_records ADD COLUMN ${name} ${type}`);
  }

  // 3. Hospital Registry (Depth-16 Merkle Tree leaves)
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nabhRegistration TEXT NOT NULL,
      city TEXT NOT NULL,
      status TEXT NOT NULL,
      walletAddress TEXT NOT NULL,
      eddsaPublicKey TEXT NOT NULL,
      merkleLeafIndex INTEGER NOT NULL,
      bondedCollateralInr INTEGER NOT NULL DEFAULT 500000
    );
  `);

  // 4. Procedures Registry (Depth-8 Merkle Tree leaves)
  db.exec(`
    CREATE TABLE IF NOT EXISTS procedures (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      isCovered INTEGER NOT NULL, -- 1 = Covered, 0 = Excluded
      merkleLeafIndex INTEGER NOT NULL,
      standardRateInr INTEGER NOT NULL
    );
  `);

  // 5. Access Permissions (ABDM / DPDP Consent Tokens)
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_permissions (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      hospitalId TEXT NOT NULL,
      hospitalName TEXT NOT NULL,
      nabhId TEXT NOT NULL,
      scope TEXT NOT NULL,
      recordIds TEXT NOT NULL, -- JSON array of record IDs
      grantedAt TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'Active', 'Revoked', 'Expired'
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (hospitalId) REFERENCES hospitals(id)
    );
  `);

  // 6. Insurance Claims Table (Groth16 proofs, Two-Party Authorization, Tier 1 vs Tier 2 Settlement)
  db.exec(`
    CREATE TABLE IF NOT EXISTS insurance_claims (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      patientMaskedId TEXT NOT NULL,
      policyNumber TEXT NOT NULL,
      insurerName TEXT NOT NULL,
      hospitalId TEXT NOT NULL,
      hospitalName TEXT NOT NULL,
      treatmentDate TEXT NOT NULL,
      diagnosisCodePrivate TEXT NOT NULL, -- Hidden from insurer via circuit
      diagnosisSummaryPrivate TEXT NOT NULL, -- Hidden from insurer via circuit
      billFileName TEXT NOT NULL,
      billHash TEXT NOT NULL,
      claimAmount INTEGER NOT NULL,
      settlementTier TEXT NOT NULL, -- 'Tier 1' (<= 1L instant) or 'Tier 2' (> 1L escrow)
      status TEXT NOT NULL, -- 'Pending', 'Approved', 'Rejected', 'Settled', 'Disputed'
      submittedAt TEXT NOT NULL,
      hospitalSignature TEXT NOT NULL, -- Hospital's EdDSA / ECDSA signature
      zkProof TEXT NOT NULL, -- JSON serialized ZKProofArtifact (Groth16-BN254, 9 public signals)
      nullifierHash TEXT NOT NULL UNIQUE, -- Replay protection N = Poseidon(S,P,C,T,D)
      usedRecordHash TEXT NOT NULL, -- Prevents reusing same bill with different nonce
      settlementTxHash TEXT,
      timeline TEXT NOT NULL, -- JSON serialized TimelineStep[]
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (hospitalId) REFERENCES hospitals(id)
    );
  `);

  // 7. Emergency Break-Glass (2-of-3 Shamir Secret Sharing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS break_glass_sessions (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      hospitalId TEXT NOT NULL,
      doctorName TEXT NOT NULL,
      icuReason TEXT NOT NULL,
      guardian1Signed INTEGER NOT NULL DEFAULT 0,
      guardian2Signed INTEGER NOT NULL DEFAULT 0,
      guardian3Signed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL, -- 'Pending', 'Active_Unlocked', 'Expired', 'Revoked'
      shareHashes TEXT NOT NULL, -- Committed on-chain hashes of the 3 Shamir shares
      unlockedAt INTEGER,
      expiresAt INTEGER NOT NULL,
      reconstructedTagValid INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );
  `);

  // 8. Smart Contracts Telemetry & State (5 Core Contracts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS smart_contracts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      role TEXT NOT NULL,
      compiler TEXT NOT NULL,
      blockNumber INTEGER NOT NULL,
      gasAverage TEXT NOT NULL,
      liquidityBalanceInr INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    );
  `);

  // 9. Immutable Audit Logs (100% Zero-PHI event stream)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      actorName TEXT NOT NULL,
      action TEXT NOT NULL,
      targetResource TEXT NOT NULL,
      txHash TEXT NOT NULL,
      privacyImpact TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // 10. Blockchain Subnet Blocks & Txs
  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_blocks (
      number INTEGER PRIMARY KEY,
      txs INTEGER NOT NULL,
      validator TEXT NOT NULL,
      gasUsed TEXT NOT NULL,
      age TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_transactions (
      hash TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      fromAddress TEXT NOT NULL,
      toAddress TEXT NOT NULL,
      value TEXT NOT NULL,
      age TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  // Synthetic prototype fixtures are kept separate from real patient and claim tables.
  db.exec(`
    CREATE TABLE IF NOT EXISTS prototype_patients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL,
      insurerName TEXT NOT NULL, policyNumber TEXT NOT NULL, planName TEXT NOT NULL,
      coverageLimitInr INTEGER NOT NULL, spentAmountInr INTEGER NOT NULL, validTill TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prototype_hospitals (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prototype_cases (
      id TEXT PRIMARY KEY, patientId TEXT NOT NULL REFERENCES prototype_patients(id),
      hospitalId TEXT NOT NULL REFERENCES prototype_hospitals(id), insurerName TEXT NOT NULL,
      careType TEXT NOT NULL, amountInr INTEGER NOT NULL, status TEXT NOT NULL
    );
  `);

  // Seed default data if database is fresh
  seedInitialData();
  seedPrototypeDataset();
}

function seedPrototypeDataset() {
  const insertPatient = db.prepare(`INSERT OR IGNORE INTO prototype_patients
    (id,name,city,state,insurerName,policyNumber,planName,coverageLimitInr,spentAmountInr,validTill)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const p of prototypePatients) insertPatient.run(p.id,p.name,p.city,p.state,p.insurer,p.policy,p.plan,p.limitInr,p.spentInr,p.validTill);
  const insertHospital = db.prepare('INSERT OR IGNORE INTO prototype_hospitals (id,name,city) VALUES (?,?,?)');
  for (const h of prototypeHospitals) insertHospital.run(h.id,h.name,h.city);
  const insertCase = db.prepare(`INSERT OR IGNORE INTO prototype_cases
    (id,patientId,hospitalId,insurerName,careType,amountInr,status) VALUES (?,?,?,?,?,?,?)`);
  for (const c of prototypeCases) {
    const patient = prototypePatients.find((p) => p.id === c.patientId)!;
    insertCase.run(c.id,c.patientId,c.hospitalId,patient.insurer,c.careType,c.amountInr,c.status);
  }
}

function seedInitialData() {
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
  if (patientCount.count > 0) return;

  console.log('[ArogyaZK DB] Fresh database detected. Seeding cryptographic baseline...');

  // Seed Patient
  db.prepare(`
    INSERT INTO patients (
      id, name, zkId, policyNumber, insurerName, planName, coverageLimit, spentAmount, validTill, secretPolicySalt, policyCommitment, didUri
    ) VALUES (
      'PAT-9041', 'Rohan Sharma', 'zkID:0x9041...E4B2', 'POL-AZK-774190',
      'Star Shield Health Assurance', 'Arogya Shield Comprehensive Floater',
      500000, 30900, '2027-03-31',
      '0x4f82e1a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a34',
      '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK_Commitment_9041',
      'did:arogyazk:0x9041A98BE4B2'
    )
  `).run();

  // Seed Hospitals (Depth-16 Merkle Tree leaves)
  const insertHospital = db.prepare(`
    INSERT INTO hospitals (id, name, nabhRegistration, city, status, walletAddress, eddsaPublicKey, merkleLeafIndex, bondedCollateralInr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHospital.run(
    'HSP-402', 'Apollo Spectra Hospital', 'NABH-H-2024-8812', 'Bengaluru', 'Verified',
    '0xHSP402771B89A42C8190F3A41D7E8920B4C1A83', '0xEdDSA_HSP402_PublicKey_e1a44b7c0912d3e4f5a6', 0, 500000
  );
  insertHospital.run(
    'HSP-219', 'Fortis Diagnostics', 'NABH-L-2023-4410', 'Mumbai', 'Verified',
    '0xHSP219882C771B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP219_PublicKey_3c41b8e902a1f456d7e8', 1, 500000
  );
  insertHospital.run(
    'HSP-308', 'Sankara Eye Centre', 'NABH-E-2022-7719', 'Bengaluru', 'Verified',
    '0xHSP308993D661B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP308_PublicKey_9a01b2c3d4e5f6a7b8c9', 2, 500000
  );
  insertHospital.run(
    'HSP-615', 'Medanta Super Speciality', 'NABH-H-2026-9904', 'Gurugram', 'Pending Approval',
    '0xHSP615772E551B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP615_PublicKey_72f1a90c42e8f112b95c', 3, 500000
  );

  // Seed Procedures (Depth-8 Merkle Tree leaves)
  const insertProc = db.prepare(`
    INSERT INTO procedures (code, name, category, isCovered, merkleLeafIndex, standardRateInr)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertProc.run('ICD-10: I20.9', 'Cardiac Evaluation & Non-Invasive Echo', 'Cardiology', 1, 0, 75000);
  insertProc.run('ICD-10: K35.80', 'Acute Laparoscopic Appendectomy', 'Surgery', 1, 1, 64000);
  insertProc.run('ICD-10: E11.9', 'Comprehensive Endocrine Metabolic Workup', 'Pathology', 1, 2, 18500);
  insertProc.run('ICD-10: H35.3', 'Retinal Optical Coherence Tomography (OCT)', 'Ophthalmology', 1, 3, 12400);
  insertProc.run('ICD-10: Z00.0', 'Non-Covered Elective Cosmetic Nutrition', 'Wellness', 0, 4, 9200);

  // Seed Medical Records
  const insertRecord = db.prepare(`
    INSERT INTO medical_records (
      id, patientId, title, category, date, hospitalName, encryptionStatus, sha256Hash, ipfsCid,
      anchorTxHash, sharedWithHospitalId, sharedWithHospitalName, accessExpiresAt, clinicalNotesEncrypted, fhirPayload, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  insertRecord.run(
    'REC-1041', 'PAT-9041', 'Cardiac Stress & Echocardiogram Panel', 'Diagnostic Imaging',
    '2026-11-12', 'Apollo Spectra Hospital', 'AES-256-GCM Encrypted',
    '0x9f84c2e18b73a109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a801',
    'ipfs://QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
    '0x4b19e82f73c109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a912',
    'HSP-402', 'Apollo Spectra Hospital', now + 1000 * 60 * 180,
    'EncryptedPayload(AES-GCM): normal LV ejection fraction 60%, stress response nominal',
    JSON.stringify({ resourceType: 'DiagnosticReport', status: 'final', code: { text: 'Stress Echo' } }),
    now - 1000 * 3600 * 48
  );

  insertRecord.run(
    'REC-1038', 'PAT-9041', 'Inpatient Discharge Summary — Daycare Procedure', 'Discharge Summary',
    '2026-11-14', 'Apollo Spectra Hospital', 'AES-256-GCM Encrypted',
    '0x3d71a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a3456',
    'ipfs://QmV9tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGy',
    '0x8c20f93a84d210e55f3c9d7201a4b52e8f9a031c5d2b94a0231f5e6d7c8b023',
    'HSP-402', 'Apollo Spectra Hospital', now + 1000 * 60 * 180,
    'EncryptedPayload(AES-GCM): daycare observation uneventful, recovery timeline 48h',
    JSON.stringify({ resourceType: 'ClinicalImpression', status: 'completed' }),
    now - 1000 * 3600 * 24
  );

  insertRecord.run(
    'REC-1022', 'PAT-9041', 'Comprehensive Metabolic & HbA1c Blood Work', 'Lab Report',
    '2026-09-28', 'Fortis Diagnostics', 'AES-256-GCM Encrypted',
    '0x7e42b81d53f9a223c06d5e8120f9b345a67d89e01f23b45c67d89e01f23b4567',
    'ipfs://QmX8tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGz',
    '0x1a54d72c91e043f66a4d0e8312b5c63f9a0b142d6e3c05b1342a6f7e8d9c134',
    null, null, null,
    'EncryptedPayload(AES-GCM): HbA1c 5.6%, fasting glucose within normal limits',
    JSON.stringify({ resourceType: 'Observation', code: { text: 'Metabolic Panel' } }),
    now - 1000 * 3600 * 24 * 50
  );

  insertRecord.run(
    'REC-1015', 'PAT-9041', 'Ophthalmology Retinal OCT Screening', 'Diagnostic Imaging',
    '2026-07-19', 'Sankara Eye Centre', 'AES-256-GCM Encrypted',
    '0x5c93d14e64a0b334d17e6f9231a0c456b78e90f12a34c56d78e90f12a34c5678',
    'ipfs://QmY7tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGa',
    '0x6f89b03d12a154a77b5e1f9423c6d74a0b1c253e7f4d16c2453b7a8f9e0d245',
    null, null, null,
    'EncryptedPayload(AES-GCM): normal foveal contour, no subretinal fluid',
    JSON.stringify({ resourceType: 'DiagnosticReport', code: { text: 'Retinal OCT' } }),
    now - 1000 * 3600 * 24 * 120
  );

  // Seed Access Permissions
  db.prepare(`
    INSERT INTO access_permissions (
      id, patientId, hospitalId, hospitalName, nabhId, scope, recordIds, grantedAt, expiresAt, status
    ) VALUES (
      'PRM-301', 'PAT-9041', 'HSP-402', 'Apollo Spectra Hospital', 'NABH-H-2024-8812',
      'Scoped read access for 2 record(s) — Zero export allowed',
      '["REC-1041", "REC-1038"]',
      '2026-11-15 10:38 IST',
      ${now + 1000 * 60 * 180},
      'Active'
    )
  `).run();

  // Seed Insurance Claims
  const insertClaim = db.prepare(`
    INSERT INTO insurance_claims (
      id, patientId, patientMaskedId, policyNumber, insurerName, hospitalId, hospitalName, treatmentDate,
      diagnosisCodePrivate, diagnosisSummaryPrivate, billFileName, billHash, claimAmount, settlementTier,
      status, submittedAt, hospitalSignature, zkProof, nullifierHash, usedRecordHash, settlementTxHash, timeline, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Claim 1: CLM-2026-884 (Tier 1: <= 1 Lakh -> Instant Payout)
  insertClaim.run(
    'CLM-2026-884', 'PAT-9041', 'zkID:0x9041...E4B2', 'POL-AZK-774190', 'Star Shield Health Assurance',
    'HSP-402', 'Apollo Spectra Hospital', '2026-11-14',
    'ICD-10: I20.9 (Uncomplicated Daycare Angina Eval)',
    'Daycare cardiac evaluation and non-invasive stress imaging.',
    'Apollo_Invoice_884.pdf', '0x9f84c2e18b73a109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a801',
    75000, 'Tier 1', 'Pending', '2026-11-15 10:42 IST',
    '0xSigHSP402_8f92e1a44b7c0912d3e4f5a6',
    JSON.stringify({
      proofId: 'ZKP-2026-884',
      protocol: 'Groth16-BN254',
      circuitId: 'ClaimEligibilityV2(16,8)',
      nullifierHash: '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890',
      publicSignals: [
        'policy_active=1', 'hospital_sig_valid=1', 'anchor_root_match=1',
        'claim_amount_inr=75000', 'nullifier_valid=1', 'procedure_covered=1',
        'hospital_merkle_root=0x7A9e4B...', 'record_hash_match=1', 'tier_instant_eligible=1'
      ],
      verifiedOnChain: true,
      verifierContract: '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK',
      verificationTxHash: '0x91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      verifiedAt: '2026-11-15 05:13:04 UTC',
      checks: {
        policyEligibility: true,
        hospitalAuthorization: true,
        medicalRecordAnchor: true,
        duplicateClaimCheck: true
      }
    }),
    '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890',
    '0x9f84c2e18b73a109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a801',
    null,
    JSON.stringify([
      { step: 1, label: 'Claim submitted', status: 'Completed', timestamp: '10:42 IST', detail: 'Signed claim digest dispatched by Apollo Spectra Hospital' },
      { step: 2, label: 'Two-Party authorization', status: 'Completed', timestamp: '10:42 IST', detail: 'Hospital EdDSA signature & patient consent token bound' },
      { step: 3, label: 'ZK proof generated (pot14)', status: 'Completed', timestamp: '10:43 IST', detail: 'ClaimEligibilityV2 (11,845 constraints) stripped ICD-10 medical diagnosis' },
      { step: 4, label: 'Smart contract verification', status: 'Completed', timestamp: '10:43 IST', detail: 'Passed on-chain Groth16 pairings (gas: 272,200)' },
      { step: 5, label: 'Tier 1 instant payout', status: 'Processing', detail: 'Queued in Insurer Privacy Guard (<= ₹1L instant rail)' }
    ]),
    now - 1000 * 3600 * 2
  );

  // Claim 2: CLM-2026-841 (Approved & Settled)
  insertClaim.run(
    'CLM-2026-841', 'PAT-9041', 'zkID:0x9041...E4B2', 'POL-AZK-774190', 'Star Shield Health Assurance',
    'HSP-219', 'Fortis Diagnostics', '2026-09-28',
    'ICD-10: E11.9 (Routine Endocrine Panel)',
    'Annual preventive metabolic and endocrine screening.',
    'Fortis_Lab_841.pdf', '0x7e42b81d53f9a223c06d5e8120f9b345a67d89e01f23b45c67d89e01f23b4567',
    18500, 'Tier 1', 'Approved', '2026-09-29 14:15 IST',
    '0xSigHSP219_3c41b8e902a1f456d7e8c9b0',
    JSON.stringify({
      proofId: 'ZKP-2026-841',
      protocol: 'Groth16-BN254',
      circuitId: 'ClaimEligibilityV2(16,8)',
      nullifierHash: '0x19a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
      publicSignals: ['policy_active=1', 'hospital_sig_valid=1', 'anchor_root_match=1', 'claim_amount_inr=18500'],
      verifiedOnChain: true,
      verifierContract: '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK',
      verificationTxHash: '0x52c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      verifiedAt: '2026-09-29 08:46:19 UTC',
      checks: { policyEligibility: true, hospitalAuthorization: true, medicalRecordAnchor: true, duplicateClaimCheck: true }
    }),
    '0x19a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
    '0x7e42b81d53f9a223c06d5e8120f9b345a67d89e01f23b45c67d89e01f23b4567',
    '0x77b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    JSON.stringify([
      { step: 1, label: 'Claim submitted', status: 'Completed', timestamp: '29 Sep', detail: 'Signed by Fortis Diagnostics' },
      { step: 2, label: 'Two-Party authorization', status: 'Completed', timestamp: '29 Sep', detail: 'Hospital EdDSA & patient consent verified' },
      { step: 3, label: 'ZK proof generated', status: 'Completed', timestamp: '29 Sep', detail: 'Groth16 proof passed' },
      { step: 4, label: 'Smart contract verification', status: 'Completed', timestamp: '29 Sep', detail: 'On-chain verification passed' },
      { step: 5, label: 'Tier 1 instant payout', status: 'Completed', timestamp: '30 Sep', detail: 'INR 18,500 settled via automated liquidity pool' }
    ]),
    now - 1000 * 3600 * 24 * 55
  );

  // Claim 3: CLM-2026-790 (Approved & Settled)
  insertClaim.run(
    'CLM-2026-790', 'PAT-9041', 'zkID:0x9041...E4B2', 'POL-AZK-774190', 'Star Shield Health Assurance',
    'HSP-308', 'Sankara Eye Centre', '2026-07-19',
    'ICD-10: H35.3 (Retinal OCT Diagnostic)',
    'Outpatient retinal optical coherence tomography.',
    'Sankara_OCT_790.pdf', '0x5c93d14e64a0b334d17e6f9231a0c456b78e90f12a34c56d78e90f12a34c5678',
    12400, 'Tier 1', 'Approved', '2026-07-20 11:05 IST',
    '0xSigHSP308_9a01b2c3d4e5f6a7b8c9d0e1',
    JSON.stringify({
      proofId: 'ZKP-2026-790',
      protocol: 'Groth16-BN254',
      circuitId: 'ClaimEligibilityV2(16,8)',
      nullifierHash: '0x88e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
      publicSignals: ['policy_active=1', 'hospital_sig_valid=1', 'anchor_root_match=1', 'claim_amount_inr=12400'],
      verifiedOnChain: true,
      verifierContract: '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK',
      verificationTxHash: '0x64d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
      verifiedAt: '2026-07-20 05:37:12 UTC',
      checks: { policyEligibility: true, hospitalAuthorization: true, medicalRecordAnchor: true, duplicateClaimCheck: true }
    }),
    '0x88e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
    '0x5c93d14e64a0b334d17e6f9231a0c456b78e90f12a34c56d78e90f12a34c5678',
    '0x33e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
    JSON.stringify([
      { step: 1, label: 'Claim submitted', status: 'Completed', timestamp: '20 Jul', detail: 'Signed by Sankara Eye Centre' },
      { step: 2, label: 'Two-Party authorization', status: 'Completed', timestamp: '20 Jul', detail: 'Consent token verified' },
      { step: 3, label: 'ZK proof generated', status: 'Completed', timestamp: '20 Jul', detail: 'Zero-knowledge proof verified' },
      { step: 4, label: 'Smart contract verification', status: 'Completed', timestamp: '20 Jul', detail: 'On-chain verification passed' },
      { step: 5, label: 'Tier 1 instant payout', status: 'Completed', timestamp: '21 Jul', detail: 'INR 12,400 settled directly' }
    ]),
    now - 1000 * 3600 * 24 * 125
  );

  // Seed Smart Contracts Telemetry (5 Core Contracts)
  const insertContract = db.prepare(`
    INSERT INTO smart_contracts (id, name, address, role, compiler, blockNumber, gasAverage, liquidityBalanceInr, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertContract.run(
    'SC-01', 'HealthVault.sol', '0xVault8D3E1a44C90B8211F6e0AroGyaZK',
    'Anchors encrypted medical records and manages access', 'Solidity v0.8.28', 19482100, '68,200 gas', 0, 'Online'
  );
  insertContract.run(
    'SC-02', 'ClaimSettlement.sol', '0xClaimSettlement4B12F09c8D3E1a44C90B8211F6e0',
    'Verifies claims and executes Tier 1/2 payouts', 'Solidity v0.8.28', 19482102, '272,200 gas', 2500000, 'Online'
  );
  insertContract.run(
    'SC-03', 'HospitalRegistry.sol', '0xHospitalRegistry1a44C90B8211F6e0AroGyaZK',
    'Manages approved hospital depth-16 Merkle tree roots', 'Solidity v0.8.28', 19482104, '54,100 gas', 0, 'Online'
  );
  insertContract.run(
    'SC-04', 'PolicyRegistry.sol', '0xPolicyRegistry44C90B8211F6e0AroGyaZK',
    'Manages policy commitments and depth-8 procedure roots', 'Solidity v0.8.28', 19482106, '49,800 gas', 0, 'Online'
  );
  insertContract.run(
    'SC-05', 'BreakGlass.sol', '0xBreakGlass9c8D3E1a44C90B8211F6e0AroGyaZK',
    '2-of-3 Shamir Secret Sharing emergency ICU access', 'Solidity v0.8.28', 19482108, '88,400 gas', 0, 'Online'
  );

  // Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actorRole, actorName, action, targetResource, txHash, privacyImpact, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    'AUD-901', '2026-11-15 10:43:04 IST', 'Smart Contract', 'ArogyaZK ClaimSettlement.sol',
    'Verified Groth16 proof ZKP-2026-884 on-chain (pot14 setup)', 'CLM-2026-884',
    '0x91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0', 'Zero PHI Exposed', now - 1000 * 3600 * 2
  );
  insertAudit.run(
    'AUD-900', '2026-11-15 10:38:12 IST', 'Patient', 'Rohan Sharma (PAT-9041)',
    'Granted 3-hour scoped read consent for 2 records', 'Apollo Spectra Hospital',
    '0x4b19e82f73c109d44e2b8c6190f3a41d7e8920b4', 'Consent Updated', now - 1000 * 3600 * 3
  );
  insertAudit.run(
    'AUD-899', '2026-11-14 18:19:45 IST', 'Patient', 'Rohan Sharma (PAT-9041)',
    'Encrypted & anchored Discharge Summary (AES-256-GCM + IPFS)', 'REC-1038',
    '0x8c20f93a84d210e55f3c9d7201a4b52e8f9a031c', 'Encrypted Vault Write', now - 1000 * 3600 * 24
  );

  // Seed Blocks
  const insertBlock = db.prepare(`
    INSERT INTO blockchain_blocks (number, txs, validator, gasUsed, age, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertBlock.run(19482110, 4, 'Arogya Validator #01 (0xVal...A1)', '1,140,200', '14s ago', now - 14000);
  insertBlock.run(19482109, 6, 'Arogya Validator #02 (0xVal...B2)', '980,450', '28s ago', now - 28000);
  insertBlock.run(19482108, 3, 'Arogya Validator #01 (0xVal...A1)', '720,100', '42s ago', now - 42000);

  // Seed Transactions
  const insertTx = db.prepare(`
    INSERT INTO blockchain_transactions (hash, method, fromAddress, toAddress, value, age, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTx.run(
    '0x91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0', 'submitClaim()',
    '0xHSP402...91A4', '0xClaimSettlement...90B8', '0 ETH', 'Just now', 'Success', now - 60000
  );
  insertTx.run(
    '0x77b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6', 'settleInstantTier1()',
    '0xStarShield...44F1', '0xHSP219...91A4', 'INR 18,500', '15 mins ago', 'Success', now - 900000
  );
  insertTx.run(
    '0x4b19e82f73c109d44e2b8c6190f3a41d7e8920b4', 'grantConsentToken()',
    '0x9041A9...E4B2', '0xConsentRegistry...8D3E', '0 ETH', '45 mins ago', 'Success', now - 2700000
  );

  console.log('[ArogyaZK DB] Baseline seeding completed successfully.');
}
