import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Clock,
  Plus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';
import { AccessPermission } from '../../types';

export const PatientPermissions: React.FC = () => {
  const {
    permissions,
    records,
    hospitals,
    grantHospitalAccess,
    revokeHospitalAccess
  } = useArogyaZK();

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('HSP-402');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([records[0]?.id || 'REC-1041']);
  const [hours, setHours] = useState(3);
  const [granting, setGranting] = useState(false);

  const activePermissions = permissions.filter((p) => p.status === 'Active' && p.expiresAt > Date.now());
  const inactivePermissions = permissions.filter((p) => p.status !== 'Active' || p.expiresAt <= Date.now());

  const handleToggleRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) return;
    setGranting(true);
    const hosp = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];
    await grantHospitalAccess(hosp.id, hosp.name, selectedRecordIds, hours);
    setGranting(false);
    setShowGrantModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Access Permissions & Consent</h1>
            <Badge variant="teal">ABDM & DPDP 2023 Compliant</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Fine-grained, time-bound consent tokens controlling hospital access to your encrypted vault
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Grant New Consent Token
        </button>
      </div>

      {/* Compliance / Privacy Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Consent-Driven Access Control</div>
            <p className="text-xs text-slate-300">
              Hospitals cannot view any medical records without a cryptographically valid token signed by your private key.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-teal-300">Zero-Export Rule Active</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200 bg-teal-50/40">
          <div className="text-xs font-medium text-teal-800">Active Permissions</div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">{activePermissions.length}</div>
          <div className="text-[11px] text-teal-700 mt-0.5">Time-bound access in progress</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Revoked / Expired</div>
          <div className="text-2xl font-bold text-slate-700 mt-1">{inactivePermissions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Access terminated permanently</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Vault Isolation Status</div>
          <div className="text-sm font-bold text-[#142D4E] mt-1">Server-checked consent</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Revocable at any moment</div>
        </Card>
      </div>

      {/* Active Permissions Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#142D4E] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0D9488]" />
          Active Consent Grants ({activePermissions.length})
        </h2>

        {activePermissions.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Active Permissions Granted</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your health vault is completely locked down. No hospital or clinic has permission to inspect your records.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activePermissions.map((perm) => (
              <ActivePermissionItem
                key={perm.id}
                permission={perm}
                onRevoke={() => revokeHospitalAccess(perm.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Emergency Break-Glass (2-of-3 Shamir Secret Sharing) */}
      <Card className="p-5 border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-slate-50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Emergency Break-Glass Vault Recovery</h3>
                <Badge variant="amber">2-of-3 Shamir Secret Sharing</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Allows authorized doctors in ICU emergency to decrypt vital records if the patient is incapacitated
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md font-semibold">
            Threshold: 2 of 3 Guardians
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Guardian 1: Family Member</span>
              <Badge variant="teal">Enrolled</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">Meera Sharma (Spouse)</p>
            <div className="font-mono text-[10px] text-slate-400">Share Hash: 0x7b21...e0a4</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Guardian 2: Primary Doctor</span>
              <Badge variant="teal">Enrolled</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">Dr. Arvind Rao (Apollo Spectra)</p>
            <div className="font-mono text-[10px] text-slate-400">Share Hash: 0x91c4...44b7</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Guardian 3: Emergency Trustee</span>
              <Badge variant="teal">Enrolled</Badge>
            </div>
            <p className="text-slate-500 text-[11px]">ArogyaZK Smart Contract Escrow</p>
            <div className="font-mono text-[10px] text-slate-400">Share Hash: 0x33e8...f291</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white border border-amber-200/80 text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Emergency access is unavailable:</strong> Guardian signatures and Shamir secret reconstruction are not implemented. Break-glass requests are rejected by the API until these checks are configured.
          </div>
        </div>
      </Card>

      {/* Expired / Revoked History Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-bold text-[#142D4E] flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          Consent History & Audit Log
        </h2>

        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5">Token ID</th>
                  <th className="py-2.5">Healthcare Provider</th>
                  <th className="py-2.5">NABH Registration</th>
                  <th className="py-2.5">Records Scoped</th>
                  <th className="py-2.5">Granted At</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-mono font-semibold text-[#142D4E]">{p.id}</td>
                    <td className="py-3 font-medium text-slate-900">{p.hospitalName}</td>
                    <td className="py-3 font-mono text-slate-500">{p.nabhId}</td>
                    <td className="py-3">{p.recordIds.join(', ')}</td>
                    <td className="py-3 text-slate-500">{p.grantedAt}</td>
                    <td className="py-3">
                      <Badge variant={p.status === 'Active' ? 'teal' : p.status === 'Revoked' ? 'rose' : 'slate'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#142D4E]">Issue Scoped Consent Token</h3>
                  <p className="text-xs text-slate-500">Time-bound cryptographic authorization</p>
                </div>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Healthcare Provider (Verified NABH)
                </label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city} ({h.nabhRegistration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Select Records to Include in Scope ({selectedRecordIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50">
                  {records.map((rec) => {
                    const isChecked = selectedRecordIds.includes(rec.id);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleToggleRecord(rec.id)}
                        className={`p-2 rounded border cursor-pointer text-xs flex items-center justify-between ${
                          isChecked
                            ? 'bg-teal-50/80 border-teal-300 text-teal-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-teal-600 focus:ring-0"
                          />
                          <span className="font-medium">{rec.title}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{rec.id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Token Validity Duration (Auto-Expires)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 24].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        hours === h
                          ? 'bg-[#142D4E] text-white border-[#142D4E]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {h} hour{h > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-teal-800">
                <strong>DPDP Guarantee:</strong> The provider cannot save, forward, or share these records. When the timer expires or if revoked, their access key is invalidated immediately.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting || selectedRecordIds.length === 0}
                  className="px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white text-xs font-semibold transition-colors"
                >
                  {granting ? 'Issuing Consent Token...' : 'Grant Signed Consent'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// Subcomponent for Active Token Card
const ActivePermissionItem: React.FC<{
  permission: AccessPermission;
  onRevoke: () => void;
}> = ({ permission, onRevoke }) => {
  const countdown = useCountdown(permission.expiresAt);

  return (
    <Card className="p-5 border-amber-200 bg-amber-50/20 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">{permission.hospitalName}</h3>
              <Badge variant="teal">{permission.nabhId}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Token ID: {permission.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Time Remaining</div>
            <div className="font-mono text-sm font-bold text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {countdown}
            </div>
          </div>
          <button
            onClick={onRevoke}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ShieldOff className="w-3.5 h-3.5" /> Revoke Now
          </button>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-white border border-amber-200/70 text-xs space-y-1">
        <div className="text-slate-500">
          <strong>Authorized Scope:</strong> {permission.scope}
        </div>
        <div className="text-slate-500">
          <strong>Accessible Records:</strong> {permission.recordIds.join(', ')}
        </div>
      </div>
    </Card>
  );
};
