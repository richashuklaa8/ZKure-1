import React from 'react';
import { ShieldCheck, ShieldOff, Clock } from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { useCountdown } from '../../hooks/useCountdown';

export const PatientPrivacyIndicator: React.FC = () => {
  const { permissions, revokeHospitalAccess } = useArogyaZK();
  const activePerm = permissions.find((p) => p.status === 'Active' && p.expiresAt > Date.now()) || null;
  const countdown = useCountdown(activePerm?.expiresAt ?? null);

  if (!activePerm) {
    return (
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Vault Locked — Zero External Access</div>
            <p className="text-xs text-slate-300">
              No hospital or insurer can read your encrypted records. Revocable at any time.
            </p>
          </div>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
          100% Patient Controlled
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#142D4E] text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-700">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">
              Active Access: {activePerm.hospitalName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-medium">
              {activePerm.recordIds.length} Records Scoped
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Accessible: {activePerm.recordIds.join(', ')} · Insurer sees zero medical diagnosis
          </p>
          <div className="flex items-center gap-1.5 text-xs text-teal-300 mt-1 font-mono">
            <Clock className="w-3.5 h-3.5" /> Expires in {countdown}
          </div>
        </div>
      </div>
      <button
        onClick={() => revokeHospitalAccess(activePerm.id)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
      >
        <ShieldOff className="w-3.5 h-3.5" />
        Revoke Access Immediately
      </button>
    </div>
  );
};
