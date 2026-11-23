import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Download,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerApprovedClaims: React.FC = () => {
  const { claims } = useArogyaZK();
  const [search, setSearch] = useState('');

  const approvedClaims = claims.filter((c) => c.status === 'Approved');
  const filteredClaims = approvedClaims.filter((c) => {
    return (
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      c.patientMaskedId.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalSettled = approvedClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Approved Claims & Disbursements</h1>
            <Badge variant="amber">No confirmed settlements</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            No claims have a verified proof or confirmed payout in the configured services.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200 bg-teal-50/40">
          <div className="text-xs font-semibold text-teal-800">Total Settled Value</div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">
            INR {totalSettled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-teal-700 mt-0.5">Disbursed directly to hospital treasuries</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Approved Claims Count</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">{approvedClaims.length}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Proof verification unavailable</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Average Payout Time</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">&lt; 2 minutes</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Smart contract automated execution</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search approved claims by ID, hospital, or masked zkID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
        />
      </Card>

      {/* Approved Claims Table */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2.5">Claim ID</th>
                <th className="py-2.5">Beneficiary Masked zkID</th>
                <th className="py-2.5">Healthcare Provider</th>
                <th className="py-2.5">Claim Amount</th>
                <th className="py-2.5">ZK Proof Signal</th>
                <th className="py-2.5">Settlement Tx</th>
                <th className="py-2.5 text-right">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 font-bold text-[#142D4E]">{claim.id}</td>
                  <td className="py-3.5 font-mono text-teal-700">{claim.patientMaskedId}</td>
                  <td className="py-3.5 font-medium text-slate-900">{claim.hospitalName}</td>
                  <td className="py-3.5 font-semibold text-slate-900">
                    INR {claim.claimAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 font-mono text-slate-600">{claim.zkProof.proofId}</td>
                  <td className="py-3.5 font-mono text-slate-500 text-[11px]">
                    {claim.settlementTxHash ? claim.settlementTxHash.slice(0, 16) + '...' : '0x77b8c9d0...a7b8'}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => alert('No settlement voucher is available without a confirmed payout transaction.')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
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
