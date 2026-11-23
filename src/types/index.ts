export type UserRole = 'public' | 'patient' | 'hospital' | 'insurer' | 'admin';

export interface MedicalRecord {
  id: string;
  title: string;
  category: 'Lab Report' | 'Discharge Summary' | 'Diagnostic Imaging' | 'Prescription';
  date: string;
  hospitalName: string;
  encryptionStatus: string;
  sha256Hash: string;
  anchorTxHash: string;
  sharedWithHospitalId: string | null;
  sharedWithHospitalName: string | null;
  accessExpiresAt: number | null;
}

export interface AccessPermission {
  id: string;
  hospitalId: string;
  hospitalName: string;
  nabhId: string;
  scope: string;
  recordIds: string[];
  grantedAt: string;
  expiresAt: number;
  status: 'Active' | 'Revoked' | 'Expired';
}

export interface TimelineStep {
  step: number;
  label: string;
  status: 'Completed' | 'Processing' | 'Pending';
  timestamp?: string;
  detail: string;
}

export interface ZKProofChecks {
  policyEligibility: boolean;
  hospitalAuthorization: boolean;
  medicalRecordAnchor: boolean;
  duplicateClaimCheck: boolean;
}

export interface ZKProofArtifact {
  proofId: string;
  protocol: string;
  circuitId: string;
  nullifierHash: string;
  publicSignals: string[];
  verifiedOnChain: boolean;
  verifierContract: string;
  verificationTxHash: string;
  verifiedAt: string;
  checks: ZKProofChecks;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  patientMaskedId: string;
  policyNumber: string;
  insurerName: string;
  hospitalId: string;
  hospitalName: string;
  treatmentDate: string;
  diagnosisCodePrivate: string;
  diagnosisSummaryPrivate: string;
  billFileName: string;
  billHash: string;
  claimAmount: number;
  settlementTier?: 'Tier 1' | 'Tier 2';
  status: 'Approved' | 'Pending' | 'Rejected' | 'Settled';
  submittedAt: string;
  hospitalSignature: string;
  zkProof: ZKProofArtifact;
  settlementTxHash?: string;
  timeline: TimelineStep[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: 'Patient' | 'Hospital' | 'Insurer' | 'Smart Contract' | 'Admin';
  actorName: string;
  action: string;
  targetResource: string;
  txHash: string;
  privacyImpact: 'Zero PHI Exposed' | 'Encrypted Vault Write' | 'Consent Updated';
}

export interface HospitalEntity {
  id: string;
  name: string;
  nabhRegistration: string;
  city: string;
  status: string;
  walletAddress: string;
}

export interface BreakGlassSession {
  id: string;
  patientId: string;
  hospitalId: string;
  doctorName: string;
  icuReason: string;
  guardian1Signed: number;
  guardian2Signed: number;
  guardian3Signed: number;
  status: 'Pending' | 'Active_Unlocked' | 'Expired' | 'Revoked';
  shareHashes: string;
  unlockedAt?: number | null;
  expiresAt: number;
  reconstructedTagValid: number;
  createdAt: number;
}

export interface SmartContractInfo {
  id: string;
  name: string;
  address: string;
  role: string;
  compiler: string;
  blockNumber: number;
  gasAverage: string;
  liquidityBalanceInr: number;
  status: string;
}

