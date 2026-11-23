import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  Scale,
  EyeOff,
  Building2,
  FilePlus2
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimsTrendChart } from '../../components/charts/ClaimsTrendChart';

export const InsurerOverview: React.FC = () => {
  const { claims, setActiveTab } = useArogyaZK();

  const totalClaims = claims.length;
  const approvedClaims = claims.filter((c) => c.status === 'Settled' && !!c.settlementTxHash);
  const pendingClaims = claims.filter((c) => c.status === 'Pending');
  const totalSettledAmount = approvedClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Insurer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] flex items-center justify-center text-white font-bold">
              SS
            </div>
            <h1 className="text-2xl font-bold text-[#142D4E]">Star Shield Health Assurance</h1>
            <Badge variant="amber">Claim services unavailable</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Claims are visible only within the assigned insurer account. Proof verification and payouts are not configured.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('incoming')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <FilePlus2 className="w-4 h-4" /> Review Pending Claims ({pendingClaims.length})
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('incoming')}>
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingClaims.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting settlement decision</div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('approved')}>
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Approved & Settled</span>
            <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">{approvedClaims.length}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">No verified claim proofs</div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('settlements')}>
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Total Payout Disbursed</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">
            INR {totalSettledAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Payout adapter not configured</div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-slate-300" onClick={() => setActiveTab('risk')}>
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Settlement speed</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">Unavailable</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">No payout adapter configured</div>
        </Card>
      </div>

      {/* Privacy Guard Architecture Callout */}
      <Card className="p-5 bg-gradient-to-r from-slate-900 via-[#142D4E] to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Claim verification is unavailable</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                  Prototype
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                The insurer view omits private diagnosis fields. Cryptographic proof verification, provider signatures, and on-chain duplicate checks are not configured, so claims cannot be approved or settled here.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('zk-verify')}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors shrink-0"
          >
            Launch ZK Verifier Studio
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Claims Trend Chart */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5">
            <h2 className="font-bold text-[#142D4E] text-base mb-3">
              Settlement Velocity & Volume Analytics
            </h2>
            <ClaimsTrendChart />
          </Card>
        </div>

        {/* Right: Quick Claims Queue */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#142D4E] text-sm">Incoming Claims Queue</h2>
              <button
                onClick={() => setActiveTab('incoming')}
                className="text-xs font-semibold text-[#0D9488] hover:underline"
              >
                View Full Queue
              </button>
            </div>

            <div className="space-y-3">
              {claims.slice(0, 3).map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => setActiveTab('incoming')}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] cursor-pointer transition-all bg-white text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#142D4E]">{claim.id}</span>
                    <Badge variant={claim.status === 'Approved' ? 'teal' : claim.status === 'Pending' ? 'amber' : 'rose'}>
                      {claim.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{claim.hospitalName}</span>
                    <strong className="text-slate-900">INR {claim.claimAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono text-[11px] text-teal-700">
                    <span>Proof: {claim.zkProof.proofId}</span>
                    <span className="text-slate-400 font-sans">{claim.treatmentDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
