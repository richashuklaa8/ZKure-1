import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const HospitalVerification: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Claim Verification</h1><Badge variant="amber">Unavailable</Badge></div><p className="mt-1 text-sm text-slate-500">No witness or proof is generated in this workspace.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5">
      <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
      <div><h2 className="font-semibold text-amber-950">Proof generation is not configured</h2><p className="mt-1 text-sm text-amber-900">A Circom circuit, witness generator, Groth16 proving key, and hospital signing key are required. Claim submission returns an unavailable response until those services are installed.</p></div>
    </Card>
  </div>
);
