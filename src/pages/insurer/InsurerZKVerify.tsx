import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerZKVerify: React.FC = () => {
  const { claims } = useArogyaZK();
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Proof Verification</h1><Badge variant="amber">Unavailable</Badge></div>
        <p className="mt-1 text-sm text-slate-500">Claims are not cryptographically verified by this application.</p>
      </div>
      <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
        <div><h2 className="font-semibold text-amber-950">Verifier integration is not configured</h2><p className="mt-1 text-sm text-amber-900">This repository has no Circom circuit, proving key, verification key, or deployed verifier contract. Claim submission and settlement remain disabled; no pairing check has run.</p></div>
      </Card>
      <Card className="p-5"><h2 className="text-sm font-bold text-[#142D4E]">Claims returned by the API</h2>
        {claims.length ? <ul className="mt-3 divide-y divide-slate-100">{claims.map((claim) => <li key={claim.id} className="flex justify-between py-3 text-sm"><span>{claim.id} · INR {claim.claimAmount.toLocaleString('en-IN')}</span><span className="text-amber-700">Unverified</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No claims available.</p>}
      </Card>
    </div>
  );
};
