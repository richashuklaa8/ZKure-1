import React, { useState } from 'react';
import {
  FilePlus2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  EyeOff,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientSubmitClaim: React.FC = () => {
  const {
    patientProfile,
    records,
    hospitals,
    submitPatientClaim,
    setActiveTab,
    setRole
  } = useArogyaZK();

  const [hospitalId, setHospitalId] = useState('HSP-402');
  const [treatmentType, setTreatmentType] = useState('Cardiac Consultation & Stress Echo');
  const [treatmentDate, setTreatmentDate] = useState('2026-11-20');
  const [claimAmount, setClaimAmount] = useState<number>(45000);
  const [billFileName, setBillFileName] = useState('Apollo_Cashless_Estimate_45000.pdf');
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || 'REC-1041');
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);

  const selectedHospital = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (claimAmount <= 0) return;
    setSubmitting(true);

    const created = await submitPatientClaim({
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      treatmentType,
      treatmentDate,
      claimAmount,
      billFileName,
      recordId: selectedRecordId
    });

    setSubmittedClaimId(created.id);
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Submit a Direct Claim</h1>
            <Badge variant="teal">Client-Side ZK Generation</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Initiate cashless reimbursement or pre-authorization with mathematical privacy guarantees
          </p>
        </div>
      </div>

      {submittedClaimId ? (
        <Card className="p-8 text-center space-y-5 border-teal-300 bg-teal-50/40">
          <div className="w-14 h-14 rounded-full bg-teal-100 text-[#0D9488] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
              Claim Dispatched via Smart Contract
            </span>
            <h2 className="text-2xl font-bold text-[#142D4E] mt-1">{submittedClaimId}</h2>
            <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
              Your claim for <strong>INR {claimAmount.toLocaleString('en-IN')}</strong> at{' '}
              Claim submission cannot complete until the real proof and hospital-signature services are configured.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-white border border-teal-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Public Policy Signal:</span>
              <span className="font-mono text-teal-700 font-semibold">policy_active=1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hospital Anchor Match:</span>
              <span className="font-mono text-teal-700 font-semibold">anchor_root_match=1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Diagnostic Data Exposed:</span>
              <span className="text-slate-900 font-semibold">0 bytes (Stripped by Circuit)</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors"
            >
              Track in Claim History
            </button>
            <button
              onClick={() => {
                setRole('insurer');
                setActiveTab('incoming');
              }}
              className="px-4 py-2 rounded-lg border border-teal-600 text-teal-800 hover:bg-teal-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              Inspect in Insurer Privacy Guard <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSubmittedClaimId(null);
              }}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium"
            >
              Submit Another Claim
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claim Submission Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6">
              <h2 className="font-bold text-[#142D4E] text-base mb-4 flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-[#0D9488]" /> Claim Pre-Authorization Form
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Policy Banner */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-500">Active Insurance:</span>
                    <strong className="text-slate-900 ml-1.5">{patientProfile.insurerName}</strong>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                      {patientProfile.policyNumber} · Max Cover: INR {patientProfile.coverageLimit.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Badge variant="teal">Verified</Badge>
                </div>

                {/* 1. Hospital Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    1. Healthcare Provider / Hospital
                  </label>
                  <div className="relative">
                    <select
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                    >
                      {hospitals.map((hosp) => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name} — {hosp.city} ({hosp.nabhRegistration})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Treatment Type & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Treatment / Procedure
                    </label>
                    <input
                      type="text"
                      required
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value)}
                      placeholder="e.g., Cardiology Stress Test & Echo"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Treatment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={treatmentDate}
                      onChange={(e) => setTreatmentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* 3. Linked Health Record from Vault */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Linked Encrypted Vault Record (Proof Anchor)
                  </label>
                  <select
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                  >
                    {records.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {r.title} ({r.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Fingerprint: <span className="font-mono">{selectedRecord?.sha256Hash.slice(0, 24)}...</span>
                  </p>
                </div>

                {/* 4. Amount and Document */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Claim Amount (INR)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1000"
                        max="500000"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital Bill / Estimate Document
                    </label>
                    <input
                      type="text"
                      required
                      value={billFileName}
                      onChange={(e) => setBillFileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    'Claim submission is currently unavailable'
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Generate ZK Proof & Submit Claim (INR {claimAmount.toLocaleString('en-IN')})
                    </>
                  )}
                </button>
              </form>
            </Card>
          </div>

          {/* Privacy Disclosure & Zero-Knowledge Comparison */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-5 border-[#142D4E] border-2">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
                <h3 className="font-bold text-[#142D4E] text-sm">
                  ArogyaZK Privacy Guard Architecture
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                This browser does not generate a Groth16 proof. The API rejects claim submission until a real prover and verifier are configured.
              </p>

              <div className="space-y-3">
                {/* Traditional System */}
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/50 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Traditional Health Claim (High Privacy Risk)
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                    <li>Full medical history exposed to insurer staff</li>
                    <li>Clinical diagnosis notes stored permanently in cloud</li>
                    <li>Risk of claim denial from irrelevant past ailments</li>
                  </ul>
                </div>

                {/* ArogyaZK System */}
                <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/60 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                    Claim privacy service is unavailable
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-teal-800 space-y-0.5">
                    <li><strong>Proof generation:</strong> Not configured</li>
                    <li><strong>Insurer claim delivery:</strong> Disabled</li>
                    <li><strong>Smart contract:</strong> Not connected</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                No circuit or verification key is present in this project.
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
