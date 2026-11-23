import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const HospitalPatients: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Patient Directory</h1><Badge variant="amber">Unavailable</Badge></div><p className="mt-1 text-sm text-slate-500">Patient discovery is not enabled.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">No patient directory is exposed</h2><p className="mt-1 text-sm text-amber-900">Hospitals can retrieve only record IDs explicitly shared with their authenticated hospital account while consent remains active. Emergency access is disabled until real guardian signature and share reconstruction services exist.</p></div></Card>
  </div>
);
