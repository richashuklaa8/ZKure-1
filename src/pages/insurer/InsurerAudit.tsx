import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerAudit: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Insurer Audit</h1><Badge variant="amber">Local log only</Badge></div><p className="mt-1 text-sm text-slate-500">This prototype does not issue regulatory or on-chain audit attestations.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Compliance status has not been assessed</h2><p className="mt-1 text-sm text-amber-900">Local audit events are not immutable, and no claim adjudication or blockchain verification is configured.</p></div></Card>
  </div>
);
