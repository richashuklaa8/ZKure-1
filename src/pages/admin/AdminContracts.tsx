import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminContracts: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Contract Status</h1><Badge variant="amber">Not configured</Badge></div><p className="mt-1 text-sm text-slate-500">No deployed contract addresses or Sepolia RPC are configured for this application.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">No chain calls have been made</h2><p className="mt-1 text-sm text-amber-900">Contract telemetry, proof verification, record anchoring, and payout routes are unavailable until real contract artifacts and an RPC signer are provided.</p></div></Card>
  </div>
);
