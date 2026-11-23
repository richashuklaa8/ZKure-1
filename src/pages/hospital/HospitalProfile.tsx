import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const HospitalProfile: React.FC = () => (
  <div className="space-y-6">
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-[#142D4E]">Hospital Profile</h1><Badge variant="amber">Credentials not verified</Badge></div><p className="mt-1 text-sm text-slate-500">Only the hospital account linked to this session is authorized by the API.</p></div>
    <Card className="flex gap-4 border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Provider credentials are not independently verified</h2><p className="mt-1 text-sm text-amber-900">This repository has no NABH verification service, hospital signing key registry, or settlement wallet integration.</p></div></Card>
  </div>
);
