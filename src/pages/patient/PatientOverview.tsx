import React, { useState } from 'react';
import {
  Lock,
  Plus,
  FileText,
  KeyRound,
  ShieldCheck,
  FileCheck2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PatientPrivacyIndicator } from '../../components/common/PatientPrivacyIndicator';
import { ClaimTimeline } from '../../components/common/ClaimTimeline';
import { MedicalRecord } from '../../types';

export const PatientOverview: React.FC = () => {
  const {
    setActiveTab,
    patientProfile,
    records,
    permissions,
    claims,
    uploadAndEncryptRecord,
    revokeHospitalAccess
  } = useArogyaZK();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<MedicalRecord['category']>('Lab Report');
  const [quickHospital, setQuickHospital] = useState('Apollo Spectra Hospital');
  const [isUploading, setIsUploading] = useState(false);

  const totalClaims = claims.length;
  const approvedClaims = claims.filter((c) => c.status === 'Approved').length;
  const pendingClaims = claims.filter((c) => c.status === 'Pending').length;
  const rejectedClaims = claims.filter((c) => c.status === 'Rejected').length;

  const sharedRecords = records.filter((r) => r.sharedWithHospitalId !== null);
  const privateOnlyRecords = records.filter((r) => r.sharedWithHospitalId === null);
  const latestClaim = claims[0];

  const handleQuickUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setIsUploading(true);
    await uploadAndEncryptRecord({
      title: quickTitle,
      category: quickCategory,
      hospitalName: quickHospital,
      clinicalNotes: 'Self-vault client-side encrypted document'
    });
    setQuickTitle('');
    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142D4E]">
            Welcome back, {patientProfile.name}
          </h1>
          <p className="text-sm text-slate-500">
            Patient ID: {patientProfile.id} · Zero-Knowledge Identity: {patientProfile.zkId}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('submit-claim')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#142D4E] text-[#142D4E] hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            Submit Direct Claim
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Encrypt & Store Record
          </button>
        </div>
      </div>

      <PatientPrivacyIndicator />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 cursor-pointer hover:border-slate-300 transition-colors" onClick={() => setActiveTab('history')}>
          <div className="text-xs font-medium text-slate-500">Total Claims</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">{totalClaims}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            View history <ArrowRight className="w-3 h-3" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Approved Claims</div>
          <div className="text-2xl font-bold text-[#0D9488] mt-1">{approvedClaims}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Proof verification unavailable</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingClaims}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">In Insurer Escrow</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-slate-300 transition-colors" onClick={() => setActiveTab('vault')}>
          <div className="text-xs font-medium text-slate-500">Encrypted Records</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">{records.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{sharedRecords.length} Shared / {privateOnlyRecords.length} Private</div>
        </Card>
        <Card className="p-4 col-span-2 lg:col-span-1 bg-gradient-to-br from-teal-50 to-slate-50 border-teal-200 cursor-pointer" onClick={() => setActiveTab('policies')}>
          <div className="text-xs font-semibold text-teal-800 flex items-center justify-between">
            <span>Active Policy</span>
            <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-[#142D4E] mt-1">{patientProfile.policyNumber}</div>
          <div className="text-[11px] text-teal-700 font-semibold mt-0.5">
            Cover: INR {patientProfile.coverageLimit.toLocaleString('en-IN')}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vault Preview & Quick Add */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[#142D4E] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0D9488]" /> Health Vault Segregation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Server-side AES-256-GCM encryption with integrity checks; no chain anchor is configured
                </p>
              </div>
              <button
                onClick={() => setActiveTab('vault')}
                className="text-xs font-semibold text-[#0D9488] hover:underline flex items-center gap-1"
              >
                Open Full Vault <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Shared Records preview */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="w-3.5 h-3.5" /> Temporarily Shared with Hospital ({sharedRecords.length})
                </span>
                <span className="text-[11px] text-slate-400">Time-Bound Active Access</span>
              </div>
              {sharedRecords.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No records currently shared. Your vault is completely isolated.
                </div>
              ) : (
                sharedRecords.slice(0, 2).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{rec.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        Anchor: {rec.sha256Hash.slice(0, 20)}... · {rec.category}
                      </div>
                    </div>
                    <Badge variant="amber">Shared: {rec.sharedWithHospitalName}</Badge>
                  </div>
                ))
              )}
            </div>

            {/* Private Records preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-teal-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Stored Private — Vault Only ({privateOnlyRecords.length})
                </span>
                <span className="text-[11px] text-slate-400">Zero External Access</span>
              </div>
              {privateOnlyRecords.slice(0, 2).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#142D4E] shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">{rec.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {rec.hospitalName} · {rec.date}
                      </div>
                    </div>
                  </div>
                  <Badge variant="teal">Private Vault</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Upload Form */}
          <Card className="p-5">
            <h3 className="font-bold text-[#142D4E] text-sm mb-1">
              Quick Encrypt & Anchor Document
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Client-side WebCrypto AES-GCM encryption before storing on decentralized storage.
            </p>
            <form onSubmit={handleQuickUpload} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Document title (e.g., Blood Test Panel)"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as MedicalRecord['category'])}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option>Lab Report</option>
                <option>Discharge Summary</option>
                <option>Diagnostic Imaging</option>
                <option>Prescription</option>
              </select>
              <input
                type="text"
                placeholder="Issuing Medical Centre"
                value={quickHospital}
                onChange={(e) => setQuickHospital(e.target.value)}
                className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <button
                type="submit"
                disabled={isUploading}
                className="md:col-span-2 py-2 px-4 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-slate-300 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  'Encrypting with WebCrypto & Anchoring...'
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Encrypt & Anchor SHA-256 Hash
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Right Column: Claim Tracker & Permissions */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#142D4E] text-sm">Active Claim Tracker</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Claim status from the API: {latestClaim?.id}
                </p>
              </div>
              <Badge variant={latestClaim?.status === 'Approved' ? 'teal' : latestClaim?.status === 'Pending' ? 'amber' : 'rose'}>
                {latestClaim?.status}
              </Badge>
            </div>
            {latestClaim ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Hospital:</span>
                    <strong className="text-slate-900">{latestClaim.hospitalName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 mt-1">
                    <span>Claim Amount:</span>
                    <strong className="text-slate-900">INR {latestClaim.claimAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 mt-1">
                    <span>ZK Proof:</span>
                    <span className="font-mono text-teal-700 font-semibold">{latestClaim.zkProof.proofId}</span>
                  </div>
                </div>
                <ClaimTimeline steps={latestClaim.timeline} />
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active claims found.</p>
            )}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-[#142D4E] hover:underline flex items-center gap-1"
              >
                View All {claims.length} Claims <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#142D4E] text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0D9488]" /> Active Permissions
              </h3>
              <button
                onClick={() => setActiveTab('permissions')}
                className="text-xs font-semibold text-[#0D9488] hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="space-y-3">
              {permissions.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{p.hospitalName}</span>
                    <Badge variant={p.status === 'Active' ? 'teal' : 'slate'}>{p.status}</Badge>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{p.scope}</p>
                  {p.status === 'Active' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-amber-700 font-medium">Time-bound access</span>
                      <button
                        onClick={() => revokeHospitalAccess(p.id)}
                        className="text-rose-600 font-semibold hover:underline text-[11px]"
                      >
                        Revoke Access
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
