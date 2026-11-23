import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Search,
  Filter,
  Receipt,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimTimeline } from '../../components/common/ClaimTimeline';

export const PatientHistory: React.FC = () => {
  const { claims } = useArogyaZK();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(claims[0]?.id || null);

  const filteredClaims = claims.filter((c) => {
    const matchesFilter = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.hospitalName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalAmount = claims.reduce((acc, c) => acc + c.claimAmount, 0);
  const approvedAmount = claims
    .filter((c) => c.status === 'Approved')
    .reduce((acc, c) => acc + c.claimAmount, 0);
  const pendingAmount = claims
    .filter((c) => c.status === 'Pending')
    .reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Claim History & Settlements</h1>
            <Badge variant="amber">Local claim status</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Transparent tracking of zero-knowledge claims, smart contract verifications, and instant payouts
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Total Value Claimed</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">
            INR {totalAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{claims.length} claims submitted</div>
        </Card>
        <Card className="p-4 border-teal-200 bg-teal-50/30">
          <div className="text-xs font-semibold text-teal-800">Approved & Settled</div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">
            INR {approvedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-teal-700 mt-0.5">Instant cashless bank transfers</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            INR {pendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Queued in Insurer Privacy Guard</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by claim ID (e.g., CLM-2026-884) or hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['All', 'Approved', 'Pending', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-[#142D4E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Claims List with Expandable Cards */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => {
          const isExpanded = expandedClaimId === claim.id;
          return (
            <Card
              key={claim.id}
              className={`transition-all border ${
                isExpanded ? 'border-[#142D4E] shadow-sm' : 'border-slate-200'
              }`}
            >
              <div
                onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      claim.status === 'Approved'
                        ? 'bg-teal-50 text-[#0D9488]'
                        : claim.status === 'Pending'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#142D4E]">{claim.id}</span>
                      <Badge
                        variant={
                          claim.status === 'Approved'
                            ? 'teal'
                            : claim.status === 'Pending'
                            ? 'amber'
                            : 'rose'
                        }
                      >
                        {claim.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {claim.hospitalName} · Date: {claim.treatmentDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Claim Amount</div>
                    <div className="font-bold text-sm text-slate-900">
                      INR {claim.claimAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="p-6 border-t border-slate-200 bg-slate-50/40 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Timeline Tracker */}
                    <div className="lg:col-span-6 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Cryptographic Verification Timeline
                      </h4>
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <ClaimTimeline steps={claim.timeline} />
                      </div>
                    </div>

                    {/* Right: ZK Proof Artifacts & Settlement Info */}
                    <div className="lg:col-span-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Proof status (not verified)
                      </h4>

                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Proof Identifier:</span>
                          <span className="font-mono text-teal-700 font-semibold">
                            {claim.zkProof.proofId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Circuit Protocol:</span>
                          <span className="font-mono text-slate-900">{claim.zkProof.protocol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Public Signals:</span>
                          <div className="text-right font-mono text-[11px] text-slate-700">
                            {claim.zkProof.publicSignals.map((sig, i) => (
                              <div key={i}>{sig}</div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nullifier Hash:</span>
                          <span className="font-mono text-slate-600 text-[11px]">
                            {claim.zkProof.nullifierHash.slice(0, 20)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">On-chain verification:</span>
                          <span className="text-teal-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed Block #{19482110}
                          </span>
                        </div>

                        {claim.settlementTxHash && (
                          <div className="pt-2 border-t border-slate-100 flex justify-between">
                            <span className="text-slate-500">Settlement Tx Hash:</span>
                            <span className="font-mono text-slate-900 font-medium text-[11px]">
                              {claim.settlementTxHash.slice(0, 18)}...
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => alert(`Downloaded Cryptographic Attestation for ${claim.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Settlement Voucher
                        </button>
                        <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> 0 bytes diagnostic data revealed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
