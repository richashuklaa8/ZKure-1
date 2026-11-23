import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AccessPermission,
  AuditLogEntry,
  BreakGlassSession,
  HospitalEntity,
  InsuranceClaim,
  MedicalRecord,
  UserRole
} from '../types';
import {
  fetchHealth,
  fetchPatientProfile,
  fetchRecordsFromDB,
  saveRecordToDB,
  fetchPermissionsFromDB,
  grantPermissionToDB,
  revokePermissionInDB,
  fetchClaimsFromDB,
  submitClaimToDB,
  settleClaimInDB,
  rejectClaimInDB,
  fetchHospitalsFromDB,
  approveHospitalInDB,
  fetchAuditLogsFromDB,
  fetchBreakGlassFromDB,
  requestBreakGlassInDB,
  signBreakGlassInDB,
  loginApi,
  currentUserApi,
  logoutApi
} from '../services/api';

interface ArogyaZKContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  backendConnected: boolean;
  patientProfile: {
    id: string;
    name: string;
    zkId: string;
    policyNumber: string;
    insurerName: string;
    planName: string;
    coverageLimit: number;
    validTill: string;
  };
  records: MedicalRecord[];
  permissions: AccessPermission[];
  claims: InsuranceClaim[];
  hospitals: HospitalEntity[];
  auditLogs: AuditLogEntry[];
  breakGlassSessions: BreakGlassSession[];
  uploadAndEncryptRecord: (input: {
    title: string;
    category: MedicalRecord['category'];
    hospitalName: string;
    clinicalNotes: string;
  }) => Promise<MedicalRecord>;
  grantHospitalAccess: (hospitalId: string, hospitalName: string, recordIds: string[], hours: number) => Promise<void>;
  revokeHospitalAccess: (permissionId: string) => void;
  submitHospitalClaim: (input: {
    patientId: string;
    diagnosisCode: string;
    diagnosisSummary: string;
    treatmentDate: string;
    billFileName: string;
    claimAmount: number;
    recordId: string;
  }) => Promise<InsuranceClaim>;
  submitPatientClaim: (input: {
    hospitalId: string;
    hospitalName: string;
    treatmentType: string;
    treatmentDate: string;
    claimAmount: number;
    billFileName: string;
    recordId: string;
  }) => Promise<InsuranceClaim>;
  approveAndSettleClaim: (claimId: string) => Promise<void>;
  rejectClaim: (claimId: string, reason: string) => void;
  approveHospitalEntity: (hospitalId: string) => void;
  requestEmergencyBreakGlass: (doctorName: string, icuReason: string) => Promise<void>;
  signEmergencyBreakGlass: (sessionId: string, guardianNumber: number) => Promise<void>;
}

const ArogyaZKContext = createContext<ArogyaZKContextValue | null>(null);

export const ArogyaZKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('public');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [hospitals, setHospitals] = useState<HospitalEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [breakGlassSessions, setBreakGlassSessions] = useState<BreakGlassSession[]>([]);

  const [patientProfile, setPatientProfile] = useState({ id: '', name: '', zkId: '', policyNumber: '', insurerName: '', planName: '', coverageLimit: 0, validTill: '' });

  // Sync with real backend SQLite database on mount
  useEffect(() => {
    let isMounted = true;
    async function initSync() {
      try {
        const sessionUser = await currentUserApi();
        if (sessionUser && isMounted) {
          const sessionRole = sessionUser.role.toLowerCase() as UserRole;
          setRoleState(sessionRole);
          if (sessionRole === 'patient') {
            const profile = await fetchPatientProfile();
            if (profile && isMounted) setPatientProfile(profile);
          }
        }
        const health = await fetchHealth();
        if (health && isMounted) {
          setBackendConnected(true);
        }

        const [dbRecords, dbClaims, dbPerms, dbHosps, dbLogs, dbBreakGlass] = await Promise.all([
          fetchRecordsFromDB(),
          fetchClaimsFromDB(),
          fetchPermissionsFromDB(),
          fetchHospitalsFromDB(),
          fetchAuditLogsFromDB(),
          fetchBreakGlassFromDB()
        ]);

        if (isMounted) {
          if (dbRecords && dbRecords.length > 0) setRecords(dbRecords);
          if (dbClaims && dbClaims.length > 0) setClaims(dbClaims);
          if (dbPerms && dbPerms.length > 0) setPermissions(dbPerms);
          if (dbHosps && dbHosps.length > 0) setHospitals(dbHosps);
          if (dbLogs && dbLogs.length > 0) setAuditLogs(dbLogs);
          if (dbBreakGlass) setBreakGlassSessions(dbBreakGlass);
        }
      } catch (err) {
        console.warn('Backend connection notice: using local cryptographic memory state', err);
      }
    }
    initSync();
    return () => { isMounted = false; };
  }, []);

  const setRole = (nextRole: UserRole) => {
    if (nextRole === 'public') {
      void logoutApi();
      setRoleState('public');
      setPatientProfile({ id: '', name: '', zkId: '', policyNumber: '', insurerName: '', planName: '', coverageLimit: 0, validTill: '' });
      setRecords([]); setPermissions([]); setClaims([]); setHospitals([]); setAuditLogs([]); setBreakGlassSessions([]);
      setActiveTab('overview');
      return;
    }
    // Role changes are granted only by the authenticated account, never by client-side selection.
    void currentUserApi().then((user) => {
      const authenticatedRole = user?.role.toLowerCase() as UserRole | undefined;
      if (authenticatedRole && authenticatedRole === nextRole) {
        setRoleState(authenticatedRole);
        setActiveTab('overview');
      }
    });
  };

  const login = async (email: string, password: string) => {
    const session = await loginApi(email, password);
    if (!session) return 'Invalid credentials or API unavailable';
    const nextRole = session.user.role.toLowerCase() as UserRole;
    setRoleState(nextRole);
    setActiveTab('overview');
    if (nextRole === 'patient') {
      const profile = await fetchPatientProfile();
      if (profile) setPatientProfile(profile);
    } else {
      setPatientProfile({ id: '', name: '', zkId: '', policyNumber: '', insurerName: '', planName: '', coverageLimit: 0, validTill: '' });
    }
    const [dbRecords, dbClaims, dbPerms, dbHosps, dbLogs] = await Promise.all([
      fetchRecordsFromDB(), fetchClaimsFromDB(), fetchPermissionsFromDB(), fetchHospitalsFromDB(), fetchAuditLogsFromDB()
    ]);
    if (dbRecords) setRecords(dbRecords);
    if (dbClaims) setClaims(dbClaims);
    if (dbPerms) setPermissions(dbPerms);
    if (dbHosps) setHospitals(dbHosps);
    if (dbLogs) setAuditLogs(dbLogs);
    return null;
  };
  const logout = async () => {
    await logoutApi();
    setRoleState('public');
    setPatientProfile({ id: '', name: '', zkId: '', policyNumber: '', insurerName: '', planName: '', coverageLimit: 0, validTill: '' });
    setRecords([]); setPermissions([]); setClaims([]); setHospitals([]); setAuditLogs([]); setBreakGlassSessions([]);
    setActiveTab('overview');
  };

  const appendAudit = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    setAuditLogs((prev) => [
      {
        ...entry,
        id: `AUD-${902 + prev.length}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST'
      },
      ...prev
    ]);
  };

  const uploadAndEncryptRecord = async (input: {
    title: string;
    category: MedicalRecord['category'];
    hospitalName: string;
    clinicalNotes: string;
  }) => {
    // 1. Try persisting directly to SQLite backend
    const saved = await saveRecordToDB(input);
    if (saved) {
      setRecords((prev) => [saved, ...prev]);
      appendAudit({
        actorRole: 'Patient',
        actorName: 'Patient account',
        action: `Created medical record (${saved.encryptionStatus})`,
        targetResource: saved.id,
        txHash: saved.anchorTxHash || '',
        privacyImpact: 'Encrypted Vault Write'
      });
      return saved;
    }

    throw new Error('Record was not saved. Check authentication and server encryption configuration.');
  };

  const grantHospitalAccess = async (
    hospitalId: string,
    hospitalName: string,
    recordIds: string[],
    hours: number
  ) => {
    // Sync with backend
    const granted = await grantPermissionToDB({ hospitalId, hospitalName, recordIds, hours });
    if (!granted) throw new Error('Permission was not granted by the server.');

    const expiresAt = granted.expiresAt;
    const perm: AccessPermission = {
      id: granted.id,
      hospitalId,
      hospitalName: granted.hospitalName,
      nabhId: granted.nabhId,
      scope: `Scoped read access for ${recordIds.length} record(s) — Zero export allowed`,
      recordIds,
      grantedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      expiresAt,
      status: 'Active'
    };

    setPermissions((prev) => [perm, ...prev]);
    setRecords((prev) =>
      prev.map((rec) =>
        recordIds.includes(rec.id)
          ? {
              ...rec,
              sharedWithHospitalId: hospitalId,
              sharedWithHospitalName: hospitalName,
              accessExpiresAt: expiresAt
            }
          : rec
      )
    );

    appendAudit({
      actorRole: 'Patient',
      actorName: `${patientProfile.name} (${patientProfile.id})`,
      action: `Granted ${hours}h temporary access to ${hospitalName}`,
      targetResource: recordIds.join(', '),
      txHash: '',
      privacyImpact: 'Consent Updated'
    });
  };

  const revokeHospitalAccess = async (permissionId: string) => {
    const revoked = await revokePermissionInDB(permissionId);
    if (!revoked) throw new Error('Permission was not revoked by the server.');

    const target = permissions.find((p) => p.id === permissionId);
    setPermissions((prev) =>
      prev.map((p) => (p.id === permissionId ? { ...p, status: 'Revoked' } : p))
    );
    if (target) {
      setRecords((prev) =>
        prev.map((rec) =>
          target.recordIds.includes(rec.id) && rec.sharedWithHospitalId === target.hospitalId
            ? {
                ...rec,
                sharedWithHospitalId: null,
                sharedWithHospitalName: null,
                accessExpiresAt: null
              }
            : rec
        )
      );
      appendAudit({
        actorRole: 'Patient',
        actorName: `${patientProfile.name} (${patientProfile.id})`,
        action: `Revoked access permission ${permissionId} immediately`,
        targetResource: target.hospitalName,
        txHash: '',
        privacyImpact: 'Consent Updated'
      });
    }
  };

  const submitHospitalClaim = async (input: {
    patientId: string;
    diagnosisCode: string;
    diagnosisSummary: string;
    treatmentDate: string;
    billFileName: string;
    claimAmount: number;
    recordId: string;
  }) => {
    // Try backend SQLite
    const saved = await submitClaimToDB({
      hospitalId: 'HSP-402',
      hospitalName: 'Apollo Spectra Hospital',
      diagnosisCode: input.diagnosisCode,
      diagnosisSummary: input.diagnosisSummary,
      treatmentDate: input.treatmentDate,
      billFileName: input.billFileName,
      claimAmount: input.claimAmount,
      recordId: input.recordId
    });

    if (saved) {
      setClaims((prev) => [saved, ...prev]);
      appendAudit({
        actorRole: 'Hospital',
        actorName: 'Apollo Spectra Hospital (HSP-402)',
        action: `Submitted Two-Party ZK claim ${saved.id} (INR ${input.claimAmount.toLocaleString('en-IN')})`,
        targetResource: saved.id,
        txHash: saved.zkProof.verificationTxHash || '',
        privacyImpact: 'Zero PHI Exposed'
      });
      return saved;
    }

    throw new Error('Claim submission is disabled until a real Groth16 prover and hospital signature service are configured.');
  };

  const submitPatientClaim = async (input: {
    hospitalId: string;
    hospitalName: string;
    treatmentType: string;
    treatmentDate: string;
    claimAmount: number;
    billFileName: string;
    recordId: string;
  }) => {
    // Try backend SQLite
    const saved = await submitClaimToDB({
      hospitalId: input.hospitalId,
      hospitalName: input.hospitalName,
      diagnosisCode: `Direct Claim: ${input.treatmentType}`,
      diagnosisSummary: `Patient direct pre-authorization for ${input.treatmentType}`,
      treatmentDate: input.treatmentDate,
      billFileName: input.billFileName,
      claimAmount: input.claimAmount,
      recordId: input.recordId
    });

    if (saved) {
      setClaims((prev) => [saved, ...prev]);
      appendAudit({
        actorRole: 'Patient',
        actorName: `${patientProfile.name} (${patientProfile.id})`,
        action: `Submitted direct cashless claim ${saved.id} (INR ${input.claimAmount.toLocaleString('en-IN')})`,
        targetResource: saved.id,
        txHash: saved.zkProof.verificationTxHash || '',
        privacyImpact: 'Zero PHI Exposed'
      });
      return saved;
    }

    throw new Error('Claim submission is disabled until a real Groth16 prover and hospital signature service are configured.');
  };

  const approveAndSettleClaim = async (claimId: string) => {
    const result = await settleClaimInDB(claimId);
    if (!result) throw new Error('Settlement is unavailable until insurer authentication and a real payout adapter are configured.');
    const fresh = await fetchClaimsFromDB();
    if (fresh) setClaims(fresh);
  };

  const rejectClaim = async (claimId: string, reason: string) => {
    const result = await rejectClaimInDB(claimId, reason);
    if (!result) throw new Error('Claim decisions are unavailable until an insurer decision service is configured.');

    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'Rejected',
              timeline: c.timeline.map((t) =>
                t.step === 5
                  ? {
                      ...t,
                      status: 'Completed',
                      timestamp: 'Just now',
                      detail: `Rejected: ${reason}`
                    }
                  : t
              )
            }
          : c
      )
    );
  };

  const approveHospitalEntity = async (hospitalId: string) => {
    const result = await approveHospitalInDB(hospitalId);
    if (!result) throw new Error('Hospital approval was not accepted by the server.');

    setHospitals((prev) =>
      prev.map((h) => (h.id === hospitalId ? { ...h, status: result.status || 'Locally Verified' } : h))
    );
    appendAudit({
      actorRole: 'Admin',
      actorName: 'ArogyaZK Network Governance',
      action: `Approved NABH provider registration for ${hospitalId}`,
      targetResource: hospitalId,
      txHash: '',
      privacyImpact: 'Zero PHI Exposed'
    });
  };

  const requestEmergencyBreakGlass = async (doctorName: string, icuReason: string) => {
    const res = await requestBreakGlassInDB({ doctorName, icuReason });
    if (!res) throw new Error('Emergency access is disabled until real guardian signing and secret reconstruction are configured.');
    const fresh = await fetchBreakGlassFromDB();
    if (fresh) setBreakGlassSessions(fresh);
    appendAudit({
      actorRole: 'Hospital',
      actorName: doctorName || 'Dr. Arvind Rao',
      action: `Initiated 2-of-3 Shamir Emergency Break-Glass access`,
      targetResource: res?.sessionId || 'EMG-SESSION',
      txHash: '',
      privacyImpact: 'Consent Updated'
    });
  };

  const signEmergencyBreakGlass = async (sessionId: string, guardianNumber: number) => {
    const result = await signBreakGlassInDB(sessionId, guardianNumber);
    if (!result) throw new Error('Guardian signing is disabled until verifiable shares and signatures are configured.');
    const fresh = await fetchBreakGlassFromDB();
    if (fresh) setBreakGlassSessions(fresh);
    appendAudit({
      actorRole: 'Smart Contract',
      actorName: 'BreakGlass.sol',
      action: `Guardian #${guardianNumber} authorized emergency share for ${sessionId}`,
      targetResource: sessionId,
      txHash: '',
      privacyImpact: 'Consent Updated'
    });
  };

  return (
    <ArogyaZKContext.Provider
      value={{
        role,
        setRole,
        login,
        logout,
        activeTab,
        setActiveTab,
        backendConnected,
        patientProfile,
        records,
        permissions,
        claims,
        hospitals,
        auditLogs,
        breakGlassSessions,
        uploadAndEncryptRecord,
        grantHospitalAccess,
        revokeHospitalAccess,
        submitHospitalClaim,
        submitPatientClaim,
        approveAndSettleClaim,
        rejectClaim,
        approveHospitalEntity,
        requestEmergencyBreakGlass,
        signEmergencyBreakGlass
      }}
    >
      {children}
    </ArogyaZKContext.Provider>
  );
};

export function useArogyaZK() {
  const ctx = useContext(ArogyaZKContext);
  if (!ctx) throw new Error('useArogyaZK must be used within ArogyaZKProvider');
  return ctx;
}
