import React, { useState } from 'react';
import {
  FolderCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  FilePlus2,
  Lock,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';

export const HospitalAuthorizedRecords: React.FC = () => {
  const {
    patientProfile,
    records,
    permissions,
    setActiveTab,
    setRole
  } = useArogyaZK();

  const [inspectingRecordId, setInspectingRecordId] = useState<string | null>(null);

  const activeConsent = permissions.find(
    (p) => p.hospitalId === 'HSP-402' && p.status === 'Active' && p.expiresAt > Date.now()
  );

  const countdown = useCountdown(activeConsent?.expiresAt ?? null);
  const authorizedRecords = records.filter((r) => r.sharedWithHospitalId === 'HSP-402');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Authorized Patient Records</h1>
            <Badge variant="teal">Time-Bound Scoped Access</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Patient health documents decrypted under valid consent token for claim attestation
          </p>
        </div>
      </div>

      {/* Consent Status Card */}
      {!activeConsent ? (
        <Card className="p-6 border-rose-200 bg-rose-50/60 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="font-bold text-rose-900 text-base">
            No Active Patient Consent Available
          </h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            You do not currently have an active cryptographic consent token from patient{' '}
            {patientProfile.name} ({patientProfile.id}). All record access is locked.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setRole('patient')}
              className="px-4 py-2 rounded-lg bg-[#142D4E] text-white text-xs font-semibold hover:bg-[#1D3E6B]"
            >
              Switch to Patient to Grant 3h Access
            </button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-teal-200 bg-teal-50/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-teal-900">
                Active Authorization: {patientProfile.name} ({patientProfile.id})
              </div>
              <p className="text-xs text-teal-700">
                Scope: Read shared diagnostics & discharge summary for claim attestation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-teal-900 bg-teal-100/80 px-3 py-1.5 rounded-lg border border-teal-300">
            <Clock className="w-4 h-4 text-teal-700" />
            Expires in {countdown}
          </div>
        </Card>
      )}

      {/* Authorized Records Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">
          Authorized Documents Available for Attestation ({authorizedRecords.length})
        </h2>

        {authorizedRecords.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-xs text-slate-500">
              No medical records are currently authorized. Ask the patient to share records from their Health Vault.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authorizedRecords.map((rec) => (
              <Card key={rec.id} className="p-5 flex flex-col justify-between space-y-4 border-teal-200">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{rec.title}</h3>
                        <p className="text-xs text-slate-500">
                          {rec.hospitalName} · {rec.date}
                        </p>
                      </div>
                    </div>
                    <Badge variant="teal">{rec.category}</Badge>
                  </div>

                  <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400 font-sans">Record ID:</span>
                      <span className="font-semibold text-slate-800">{rec.id}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400 font-sans">Anchor Hash:</span>
                      <span className="text-teal-700">{rec.sha256Hash.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consent Window:</span>
                      <span className="text-amber-800 font-medium">Valid until expiry</span>
                    </div>
                  </div>

                  {inspectingRecordId === rec.id && (
                    <div className="mt-3 p-3.5 rounded-lg bg-white border border-teal-300 text-xs space-y-2">
                      <div className="font-bold text-teal-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> Decrypted Clinical Summary
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Diagnostic finding: Normal left ventricular systolic function. EF 60%. Mild exertion angina resolved under observation. Prescribed daycare recovery protocol.
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        Note: claim proof compilation is unavailable until the Groth16 proving service is configured.
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      setInspectingRecordId(inspectingRecordId === rec.id ? null : rec.id)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {inspectingRecordId === rec.id ? 'Close Inspection' : 'Inspect Details'}
                  </button>

                  <button
                    onClick={() => setActiveTab('create-claim')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" /> Create Claim with Record
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
