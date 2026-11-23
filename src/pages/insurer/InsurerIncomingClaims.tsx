import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerIncomingClaims: React.FC = () => {
  const { claims } = useArogyaZK();
  return (
    <div className="space-y-6">
      <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Incoming Claims</h1><Badge variant="amber">Actions unavailable</Badge></div><p className="mt-1 text-sm text-slate-500">Claims shown here have not been proof-verified or settled.</p></div>
      <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Verification and settlement are disabled</h2><p className="mt-1 text-sm text-amber-900">This application has no configured Groth16 verifier, insurer authorization workflow, or payout adapter. No claim can be approved or rejected from this screen.</p></div></Card>
      <Card className="p-5"><h2 className="text-sm font-bold text-[#142D4E]">Claims queue ({claims.length})</h2>
        {claims.length ? <ul className="mt-3 divide-y divide-slate-100">{claims.map((claim) => <li key={claim.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{claim.id} · {claim.hospitalName} · INR {claim.claimAmount.toLocaleString('en-IN')}</span><Badge variant="amber">Unverified</Badge></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No claims available.</p>}
      </Card>
    </div>
  );
};
