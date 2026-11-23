import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimTimeline } from '../../components/common/ClaimTimeline';

export const HospitalSubmittedClaims: React.FC = () => {
  const { claims } = useArogyaZK();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const filteredClaims = claims.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.patientId.toLowerCase().includes(search.toLowerCase()) ||
      c.billFileName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalClaimed = claims.reduce((acc, c) => acc + c.claimAmount, 0);
  const settledClaims = claims.filter((c) => c.status === 'Approved');
  const totalSettled = settledClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Submitted Hospital Claims</h1>
            <Badge variant="teal">Apollo Spectra Registry</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Ledger of claims dispatched to insurance privacy guards with cryptographic settlement tracking
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Total Billed Volume</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">
            INR {totalClaimed.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{claims.length} submitted claims</div>
        </Card>
        <Card className="p-4 border-teal-200 bg-teal-50/40">
          <div className="text-xs font-semibold text-teal-800">Settled to Hospital Account</div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">
            INR {totalSettled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-teal-700 mt-0.5">{settledClaims.length} payouts received</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {claims.filter((c) => c.status === 'Pending').length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Under Insurer Privacy Guard</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by claim ID, patient, or invoice name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['All', 'Approved', 'Pending', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-[#142D4E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Claims Table / Cards */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2.5">Claim ID</th>
                <th className="py-2.5">Patient ID</th>
                <th className="py-2.5">Treatment Date</th>
                <th className="py-2.5">Amount (INR)</th>
                <th className="py-2.5">Bill Document</th>
                <th className="py-2.5">ZK Proof</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((c) => {
                const isExpanded = expandedClaimId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-[#142D4E]">{c.id}</td>
                      <td className="py-3.5 font-mono text-slate-700">{c.patientId}</td>
                      <td className="py-3.5 text-slate-600">{c.treatmentDate}</td>
                      <td className="py-3.5 font-semibold text-slate-900">
                        INR {c.claimAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-slate-500">{c.billFileName}</td>
                      <td className="py-3.5 font-mono text-teal-700 font-medium">
                        {c.zkProof.proofId}
                      </td>
                      <td className="py-3.5">
                        <Badge
                          variant={
                            c.status === 'Approved'
                              ? 'teal'
                              : c.status === 'Pending'
                              ? 'amber'
                              : 'rose'
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => setExpandedClaimId(isExpanded ? null : c.id)}
                          className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-4 bg-slate-50 border-y border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                Verification Timeline
                              </h4>
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <ClaimTimeline steps={c.timeline} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                Settlement Details
                              </h4>
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 font-mono">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">Insurer:</span>
                                  <span className="font-sans text-slate-900 font-medium">{c.insurerName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">Hospital Signature:</span>
                                  <span className="text-slate-600 text-[11px]">{c.hospitalSignature.slice(0, 20)}...</span>
                                </div>
                                {c.settlementTxHash && (
                                  <div className="flex justify-between pt-1 border-t border-slate-100">
                                    <span className="text-slate-400 font-sans">Settlement Tx:</span>
                                    <span className="text-teal-700 font-bold text-[11px]">{c.settlementTxHash.slice(0, 20)}...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
