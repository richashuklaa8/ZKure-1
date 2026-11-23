import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminExplorer: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Blockchain Explorer</h1><Badge variant="amber">No chain data</Badge></div><p className="mt-1 text-sm text-slate-500">No RPC endpoint or deployed contract is configured.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">No transactions or blocks are reported</h2><p className="mt-1 text-sm text-amber-900">The explorer API returns an empty result until the application is connected to a real chain indexer.</p></div></Card>
  </div>
);
