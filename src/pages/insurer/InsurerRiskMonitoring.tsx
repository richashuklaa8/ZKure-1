import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerRiskMonitoring: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Risk Monitoring</h1><Badge variant="amber">Not configured</Badge></div><p className="mt-1 text-sm text-slate-500">No fraud metrics are reported without a live claims verifier.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Duplicate prevention and provider signatures are unavailable</h2><p className="mt-1 text-sm text-amber-900">Claims are not accepted until signature verification, policy checks, and persistent replay protection are connected to a real verifier.</p></div></Card>
  </div>
);
