import React from 'react';
import { Building2, FilePlus2, FolderCheck, ShieldAlert } from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const HospitalOverview: React.FC = () => {
  const { records, claims, setActiveTab } = useArogyaZK();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Building2 className="h-6 w-6 text-[#142D4E]" /><h1 className="text-2xl font-bold text-[#142D4E]">Hospital Workspace</h1><Badge variant="amber">Proof service unavailable</Badge></div><p className="mt-1 text-sm text-slate-500">Records appear only while this authenticated hospital has active patient consent.</p></div><button onClick={() => setActiveTab('authorized')} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[#142D4E]"><FolderCheck className="h-4 w-4" /> Authorized records</button></div>
      <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Claim creation is disabled</h2><p className="mt-1 text-sm text-amber-900">No hospital signing key, Groth16 prover, verifier key, or settlement contract is configured. This workspace does not claim NABH verification or on-chain status.</p></div></Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><Card className="p-5"><div className="text-sm text-slate-500">Consent-scoped records</div><div className="mt-1 text-2xl font-bold text-[#142D4E]">{records.length}</div></Card><Card className="p-5"><div className="text-sm text-slate-500">Claims available</div><div className="mt-1 text-2xl font-bold text-[#142D4E]">{claims.length}</div></Card><Card className="p-5"><div className="text-sm text-slate-500">Verified proofs</div><div className="mt-1 text-2xl font-bold text-amber-700">0</div></Card></div>
      <button onClick={() => setActiveTab('create-claim')} disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600"><FilePlus2 className="h-4 w-4" /> Claim submission unavailable</button>
    </div>
  );
};
