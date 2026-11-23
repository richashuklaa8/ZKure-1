import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Search,
  Wallet,
  CheckCircle2,
  Building2,
  ExternalLink,
  Coins
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerSettlements: React.FC = () => {
  const { claims } = useArogyaZK();
  const [search, setSearch] = useState('');

  const settledClaims = claims.filter((c) => c.status === 'Settled' && !!c.settlementTxHash);
  const totalSettledAmount = settledClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  const settlementLedger = settledClaims.map((c, idx) => ({
    settleId: c.id,
    claimId: c.id,
    payee: c.hospitalName,
    wallet: '',
    amount: c.claimAmount,
    timestamp: c.submittedAt,
    txHash: c.settlementTxHash || '',
    status: 'Confirmed'
  }));

  const filteredLedger = settlementLedger.filter((item) => {
    return (
      item.settleId.toLowerCase().includes(search.toLowerCase()) ||
      item.claimId.toLowerCase().includes(search.toLowerCase()) ||
      item.payee.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Settlement History & Treasury</h1>
            <Badge variant="amber">Settlement unavailable</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            No insurer payout adapter is configured. This view lists only settlements backed by a real transaction hash.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
        >
          <Download className="w-4 h-4" /> Export Financial Reconciliation
        </button>
      </div>

      {/* Treasury Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50">
          <div className="text-xs font-semibold text-teal-800 flex items-center justify-between">
            <span>Escrow Liquidity Pool Balance</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-[#142D4E] mt-2">
            Not configured
          </div>
          <div className="text-[11px] text-teal-700 mt-1 font-mono">
            No settlement contract connected
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Total Claims Settled (YTD)</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-[#0D9488] mt-2">
            INR {totalSettledAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{settledClaims.length} successful payouts</div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>Reconciliation Discrepancy Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">0.00%</div>
          <div className="text-[11px] text-amber-700 mt-1">No chain audit configured</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search settlement records by Payout ID, Claim ID, or Hospital..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
        />
      </Card>

      {/* Ledger Table */}
      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2.5">Settlement ID</th>
                <th className="py-2.5">Claim ID</th>
                <th className="py-2.5">Healthcare Provider</th>
                <th className="py-2.5">Amount Disbursed</th>
                <th className="py-2.5">Rail</th>
                <th className="py-2.5">Transaction Hash</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((row) => (
                <tr key={row.settleId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 font-bold text-[#142D4E]">{row.settleId}</td>
                  <td className="py-3.5 font-mono text-slate-700">{row.claimId}</td>
                  <td className="py-3.5 font-medium text-slate-900">{row.payee}</td>
                  <td className="py-3.5 font-semibold text-[#0D9488]">
                    INR {row.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 text-slate-500">Smart Contract Escrow</td>
                  <td className="py-3.5 font-mono text-slate-500 text-[11px]">
                    {row.txHash.slice(0, 16)}...
                  </td>
                  <td className="py-3.5">
                    <Badge variant="teal">{row.status}</Badge>
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
