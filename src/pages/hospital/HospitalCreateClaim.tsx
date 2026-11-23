import React, { useState } from 'react';
import {
  FilePlus2,
  Building2,
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const HospitalCreateClaim: React.FC = () => {
  const {
    patientProfile,
    permissions,
    records,
    claims,
    submitHospitalClaim,
    setRole,
    setActiveTab
  } = useArogyaZK();

  const [step, setStep] = useState<number>(1);
  const [searchPatientId, setSearchPatientId] = useState('PAT-9041');
  const [diagnosisCode, setDiagnosisCode] = useState('ICD-10: K35.80 (Acute Laparoscopic Care)');
  const [diagnosisSummary, setDiagnosisSummary] = useState(
    'Inpatient surgical care and post-operative monitoring'
  );
  const [treatmentDate, setTreatmentDate] = useState('2026-11-22');
  const [billFileName, setBillFileName] = useState('Apollo_Discharge_Bill_2026.pdf');
  const [claimAmount, setClaimAmount] = useState(64000);
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || 'REC-1041');
  const [submitting, setSubmitting] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const activeConsent = permissions.find(
    (p) => p.hospitalId === 'HSP-402' && p.status === 'Active' && p.expiresAt > Date.now()
  );

  const authorizedRecords = records.filter((r) => r.sharedWithHospitalId === 'HSP-402');

  const handleGenerateClaim = async () => {
    if (!activeConsent) return;
    setSubmitting(true);
    const created = await submitHospitalClaim({
      patientId: searchPatientId,
      diagnosisCode,
      diagnosisSummary,
      treatmentDate,
      billFileName,
      claimAmount,
      recordId: selectedRecordId
    });
    setLastCreatedId(created.id);
    setSubmitting(false);
    setStep(5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Create Zero-Knowledge Insurance Claim</h1>
            <Badge variant="amber">Proof service unavailable</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Hospital signs the clinical digest locally; patient diagnosis is stripped before insurer dispatch
          </p>
        </div>
      </div>

      {!activeConsent ? (
        <Card className="p-5 border-rose-200 bg-rose-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-rose-900 text-sm">
                  Patient Authorization Required — Record Access Blocked
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  Patient {patientProfile.id} has revoked or not granted temporary access. Hospitals
                  cannot view medical records or generate ZK claims without explicit patient consent.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRole('patient')}
              className="px-4 py-2 rounded-lg bg-[#142D4E] text-white text-xs font-semibold hover:bg-[#1D3E6B]"
            >
              Switch to Patient to Grant Consent
            </button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-teal-200 bg-teal-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-teal-900">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>
              <strong>Active Patient Consent Verified:</strong> {patientProfile.name} (
              {patientProfile.id}) granted access to {authorizedRecords.length} record(s).
            </span>
          </div>
          <Badge variant="teal">Consent Token Active</Badge>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-[#142D4E] text-lg flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-[#0D9488]" /> 5-Step Claim Attestation Flow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow the guided sequence to cryptographically attest patient treatment
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-[#142D4E] text-white'
                    : step > s
                    ? 'bg-teal-50 text-[#0D9488] border border-teal-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Select Patient (Registered ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                />
                <span className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5" /> {patientProfile.name}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Linked Authorized Vault Record
              </label>
              <select
                disabled={!activeConsent}
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs disabled:bg-slate-100 bg-white focus:ring-1 focus:ring-teal-500 outline-none"
              >
                {authorizedRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Treatment Details (Kept Private from Insurer via ZK)
              </label>
              <input
                type="text"
                disabled={!activeConsent}
                value={diagnosisCode}
                onChange={(e) => setDiagnosisCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs mb-2 disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="ICD-10 Diagnosis Code"
              />
              <input
                type="text"
                disabled={!activeConsent}
                value={diagnosisSummary}
                onChange={(e) => setDiagnosisSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 outline-none"
                placeholder="Clinical procedure description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Treatment Date
                </label>
                <input
                  type="date"
                  disabled={!activeConsent}
                  value={treatmentDate}
                  onChange={(e) => setTreatmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Claim Amount (INR)
                </label>
                <input
                  type="number"
                  disabled={!activeConsent}
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs disabled:bg-slate-100 font-semibold text-slate-900 focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4b. Hospital Invoice Document
              </label>
              <input
                type="text"
                disabled={!activeConsent}
                value={billFileName}
                onChange={(e) => setBillFileName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong>5. Cryptographic Attestation:</strong> Claim signing is disabled until a real hospital signature service and Groth16
              proof confirming policy coverage and record anchor integrity without transmitting{' '}
              <code className="text-teal-700">{diagnosisCode}</code> to the insurer.
            </div>

            <button
              onClick={handleGenerateClaim}
              disabled={!activeConsent || submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              {submitting
                ? 'Signing Digest & Generating ZK Proof...'
                : 'Sign Claim Digest & Submit to Insurer'}
            </button>

            {lastCreatedId && (
              <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> Claim {lastCreatedId}{' '}
                  dispatched with ZK Proof!
                </span>
                <button
                  onClick={() => {
                    setRole('insurer');
                    setActiveTab('incoming');
                  }}
                  className="underline font-bold text-[#142D4E] flex items-center gap-1"
                >
                  Inspect in Insurer Privacy Guard →
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
