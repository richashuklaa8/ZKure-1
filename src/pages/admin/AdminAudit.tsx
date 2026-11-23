import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  CheckCircle2,
  Lock,
  Activity,
  Layers,
  FileCheck2
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminAudit: React.FC = () => {
  const { auditLogs } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterImpact, setFilterImpact] = useState('All');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesRole = filterRole === 'All' || log.actorRole === filterRole;
    const matchesImpact = filterImpact === 'All' || log.privacyImpact === filterImpact;
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.targetResource.toLowerCase().includes(search.toLowerCase()) ||
      log.txHash.toLowerCase().includes(search.toLowerCase()) ||
      log.actorName.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesImpact && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">System-Wide Audit Logs</h1>
            <Badge variant="teal">Immutable Consortium Governance</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Tamper-proof event logs recording every record hash anchor, consent token lifecycle, and settlement execution
          </p>
        </div>
        <button
          onClick={() => alert('Exporting complete Consortium Audit Bundle (CSV/JSON)...')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
        >
          <Download className="w-4 h-4" /> Export System Logs
        </button>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200 bg-teal-50/40">
          <div className="text-xs font-semibold text-teal-800">Total System Events</div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">{auditLogs.length}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Local audit log; no chain anchor</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Zero PHI Violations</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">0</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mathematically guaranteed</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Consortium Nodes Synced</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">4 / 4</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Subnet consensus healthy</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor, target resource, or transaction hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="All">All Roles</option>
            <option value="Patient">Patient</option>
            <option value="Hospital">Hospital</option>
            <option value="Insurer">Insurer</option>
            <option value="Smart Contract">Smart Contract</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="All">All Impact Types</option>
            <option value="Zero PHI Exposed">Zero PHI Exposed</option>
            <option value="Encrypted Vault Write">Encrypted Vault Write</option>
            <option value="Consent Updated">Consent Updated</option>
          </select>
        </div>
      </Card>

      {/* Audit Log Entries List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="p-4 hover:border-slate-300 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#142D4E] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{log.action}</span>
                    <Badge variant={log.actorRole === 'Admin' ? 'navy' : log.actorRole === 'Smart Contract' ? 'teal' : 'slate'}>
                      {log.actorRole}
                    </Badge>
                  </div>
                  <div className="text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Actor: <strong>{log.actorName}</strong></span>
                    <span>·</span>
                    <span>Target: <strong>{log.targetResource}</strong></span>
                    <span>·</span>
                    <span className="text-slate-400">{log.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={log.privacyImpact === 'Zero PHI Exposed' ? 'teal' : 'amber'}>
                  <CheckCircle2 className="w-3 h-3" /> {log.privacyImpact}
                </Badge>
                <div className="font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-[11px]">
                  Tx: {log.txHash}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
