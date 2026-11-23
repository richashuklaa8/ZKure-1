import React from 'react';
import {
  ShieldCheck,
  Building2,
  Blocks,
  Lock,
  Activity,
  ArrowRight,
  Server,
  Cpu,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminOverview: React.FC = () => {
  const { hospitals, approveHospitalEntity, auditLogs, claims, setActiveTab } = useArogyaZK();

  const pendingHospitals = hospitals.filter((h) => h.status === 'Pending Approval');

  return (
    <div className="space-y-6">
      {/* Admin Governance Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] flex items-center justify-center text-white font-bold">
              AZ
            </div>
            <h1 className="text-2xl font-bold text-[#142D4E]">ArogyaZK Network Governance</h1>
            <Badge variant="amber">Local admin console</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Local provider registry and administrative audit events. Chain verification is not configured.
          </p>
        </div>

        <Badge variant="navy">
          <Lock className="w-3.5 h-3.5" /> Admin Key Isolation: Zero Access to Patient Vaults
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-teal-200 bg-teal-50/40 cursor-pointer hover:border-teal-300" onClick={() => setActiveTab('contracts')}>
          <div className="text-xs font-semibold text-teal-800">Smart Contracts Status</div>
          <div className="text-sm font-bold text-amber-700 mt-1.5 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Not configured</div>
          <div className="text-[11px] text-amber-700 mt-1">No RPC or contract addresses</div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('hospitals')}>
          <div className="text-xs font-medium text-slate-500">Hospital accounts</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">{hospitals.length}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {pendingHospitals.length} Pending Approval
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('explorer')}>
          <div className="text-xs font-medium text-slate-500">Proofs verified on-chain</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">0</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Verifier unavailable</div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('audit')}>
          <div className="text-xs font-medium text-slate-500">Network Security Logs</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Local database events</div>
        </Card>
      </div>

      {/* Architecture Health Matrix */}
      <Card className="p-5">
        <h2 className="font-bold text-[#142D4E] text-base mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#0D9488]" /> Network Architecture & Core Services Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 space-y-1">
            <div className="flex justify-between font-semibold text-teal-900">
              <span>Groth16 Verifier</span>
              <span className="text-amber-700">Not configured</span>
            </div>
            <p className="text-[11px] text-slate-500">Circuit and verification key missing</p>
          </div>
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 space-y-1">
            <div className="flex justify-between font-semibold text-teal-900">
              <span>Settlement Escrow</span>
              <span className="text-amber-700">Not configured</span>
            </div>
            <p className="text-[11px] text-slate-500">No settlement contract configured</p>
          </div>
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 space-y-1">
            <div className="flex justify-between font-semibold text-teal-900">
              <span>Nullifier Tree</span>
              <span className="text-amber-700">Not configured</span>
            </div>
            <p className="text-[11px] text-slate-500">No nullifier registry configured</p>
          </div>
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 space-y-1">
            <div className="flex justify-between font-semibold text-teal-900">
              <span>Consent Registry</span>
              <span className="text-amber-700">Not configured</span>
            </div>
            <p className="text-[11px] text-slate-500">Consent is stored locally</p>
          </div>
        </div>
      </Card>

      {/* Pending Hospital Approvals Quick Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#142D4E] text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0D9488]" /> Healthcare Provider Applications
          </h2>
          <button
            onClick={() => setActiveTab('hospitals')}
            className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
          >
            Manage All Providers <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2.5">Hospital ID</th>
                <th className="py-2.5">Institution</th>
                <th className="py-2.5">NABH Registration</th>
                <th className="py-2.5">City</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-semibold text-[#142D4E]">{h.id}</td>
                  <td className="py-3 font-medium text-slate-900">{h.name}</td>
                  <td className="py-3 font-mono text-slate-600">{h.nabhRegistration}</td>
                  <td className="py-3">{h.city}</td>
                  <td className="py-3">
                    <Badge variant={h.status === 'Locally Verified' ? 'amber' : 'slate'}>{h.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    {h.status === 'Pending Approval' ? (
                      <button
                        onClick={() => approveHospitalEntity(h.id)}
                        className="px-3 py-1 rounded bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors shadow-sm"
                      >
                        Approve Provider
                      </button>
                    ) : (
                      <span className="text-teal-700 font-semibold text-xs flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Locally verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
