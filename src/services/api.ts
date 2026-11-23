import { AuditLogEntry, HospitalEntity, InsuranceClaim, MedicalRecord } from '../types';

export const INITIAL_RECORDS: MedicalRecord[] = [];
export const INITIAL_CLAIMS: InsuranceClaim[] = [];
export const INITIAL_HOSPITALS: HospitalEntity[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

const API_BASE = '/api';

export type AuthSession = { expiresAt: number; user: { id: string; email: string; role: 'Patient' | 'Hospital' | 'Insurer' | 'Admin'; linkedId: string | null } };
export async function loginApi(email: string, password: string): Promise<AuthSession | null> {
  const res = await apiFetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!res.ok) return null;
  return await res.json() as AuthSession;
}
export async function currentUserApi(): Promise<AuthSession['user'] | null> {
  const res = await apiFetch(`${API_BASE}/auth/me`);
  if (!res.ok) return null;
  return await res.json();
}
export async function logoutApi() {
  await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}
async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}

export async function fetchHealth() {
  try {
    const res = await apiFetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPatientProfile() {
  try {
    const res = await apiFetch(`${API_BASE}/patient/profile`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRecordsFromDB(): Promise<MedicalRecord[] | null> {
  try {
    const res = await apiFetch(`${API_BASE}/records`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveRecordToDB(input: {
  title: string;
  category: MedicalRecord['category'];
  hospitalName: string;
  clinicalNotes: string;
}): Promise<MedicalRecord | null> {
  try {
    const res = await apiFetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPermissionsFromDB(): Promise<any[] | null> {
  try {
    const res = await apiFetch(`${API_BASE}/permissions`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function grantPermissionToDB(input: {
  hospitalId: string;
  hospitalName: string;
  recordIds: string[];
  hours: number;
}) {
  try {
    const res = await apiFetch(`${API_BASE}/permissions/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function revokePermissionInDB(id: string) {
  try {
    const res = await apiFetch(`${API_BASE}/permissions/revoke/${id}`, {
      method: 'POST'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchClaimsFromDB(): Promise<InsuranceClaim[] | null> {
  try {
    const res = await apiFetch(`${API_BASE}/claims`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitClaimToDB(input: {
  hospitalId: string;
  hospitalName: string;
  diagnosisCode: string;
  diagnosisSummary: string;
  treatmentDate: string;
  billFileName: string;
  claimAmount: number;
  recordId: string;
}): Promise<InsuranceClaim | null> {
  try {
    const res = await apiFetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function settleClaimInDB(claimId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/claims/${claimId}/settle`, {
      method: 'POST'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function rejectClaimInDB(claimId: string, reason: string) {
  try {
    const res = await apiFetch(`${API_BASE}/claims/${claimId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchHospitalsFromDB(): Promise<HospitalEntity[] | null> {
  try {
    const res = await apiFetch(`${API_BASE}/hospitals`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function approveHospitalInDB(hospitalId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/hospitals/${hospitalId}/approve`, {
      method: 'POST'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAuditLogsFromDB(role?: string, impact?: string): Promise<AuditLogEntry[] | null> {
  try {
    const params = new URLSearchParams();
    if (role && role !== 'All') params.append('role', role);
    if (impact && impact !== 'All') params.append('impact', impact);
    const res = await apiFetch(`${API_BASE}/audit-logs?${params.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchContractsFromDB() {
  try {
    const res = await apiFetch(`${API_BASE}/contracts`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchBreakGlassFromDB() {
  try {
    const res = await apiFetch(`${API_BASE}/break-glass`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function requestBreakGlassInDB(input: {
  patientId?: string;
  doctorName?: string;
  icuReason?: string;
}) {
  try {
    const res = await apiFetch(`${API_BASE}/break-glass/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function signBreakGlassInDB(sessionId: string, guardianNumber: number) {
  try {
    const res = await apiFetch(`${API_BASE}/break-glass/${sessionId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardianNumber })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

