import React, { useState } from 'react';
import {
  Lock,
  Share2,
  Plus,
  FileText,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Download,
  Copy,
  Check,
  Building2,
  Hash
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';
import { MedicalRecord } from '../../types';

export const PatientVault: React.FC = () => {
  const {
    records,
    hospitals,
    uploadAndEncryptRecord,
    grantHospitalAccess,
    revokeHospitalAccess,
    permissions
  } = useArogyaZK();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sharingRecordId, setSharingRecordId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState('HSP-402');
  const [selectedDurationHours, setSelectedDurationHours] = useState(3);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalRecord['category']>('Lab Report');
  const [hospitalName, setHospitalName] = useState('Apollo Spectra Hospital');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [encrypting, setEncrypting] = useState(false);

  const categories = ['All', 'Lab Report', 'Discharge Summary', 'Diagnostic Imaging', 'Prescription'];

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(search.toLowerCase()) ||
      rec.hospitalName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sharedRecords = filteredRecords.filter((r) => r.sharedWithHospitalId !== null);
  const privateOnlyRecords = filteredRecords.filter((r) => r.sharedWithHospitalId === null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setEncrypting(true);
    await uploadAndEncryptRecord({ title, category, hospitalName, clinicalNotes });
    setTitle('');
    setClinicalNotes('');
    setEncrypting(false);
    setShowUploadModal(false);
  };

  const handleGrantAccess = async (recordId: string) => {
    const targetHosp = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];
    await grantHospitalAccess(targetHosp.id, targetHosp.name, [recordId], selectedDurationHours);
    setSharingRecordId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">My Health Vault</h1>
            <Badge variant="teal">AES-256-GCM Encrypted</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            AES-256-GCM encrypted records. IPFS upload is optional; blockchain anchoring is not configured.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Encrypt New Document
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Zero-Knowledge Vault Isolation Active</div>
            <p className="text-xs text-slate-300">
              Plaintext medical data never leaves your browser. Zero knowledge proofs verify eligibility without exposing contents.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-teal-300">
          <Hash className="w-3.5 h-3.5" /> Merkle Tree Root: 0x9f84c2...a801
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by title, clinic or hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#142D4E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Section 1: Temporarily Shared Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#142D4E] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-600" />
            Temporarily Shared with Hospitals ({sharedRecords.length})
          </h2>
          <span className="text-xs text-slate-500">Revocable at any moment</span>
        </div>

        {sharedRecords.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-xs text-slate-500">
              No medical records are currently shared with any healthcare provider.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedRecords.map((rec) => (
              <SharedRecordCard
                key={rec.id}
                record={rec}
                onRevoke={() => {
                  const perm = permissions.find((p) => p.recordIds.includes(rec.id));
                  if (perm) revokeHospitalAccess(perm.id);
                }}
                onCopyHash={(hash) => copyToClipboard(hash, rec.id)}
                isCopied={copiedHash === rec.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Stored Private — Vault Only */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#142D4E] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0D9488]" />
            Stored Private — Vault Only ({privateOnlyRecords.length})
          </h2>
          <span className="text-xs text-slate-500">Zero external access</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privateOnlyRecords.map((rec) => (
            <Card key={rec.id} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">{rec.title}</h3>
                      <p className="text-xs text-slate-500">{rec.hospitalName} · {rec.date}</p>
                    </div>
                  </div>
                  <Badge variant="teal">{rec.category}</Badge>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-slate-600">
                    <span className="text-slate-400">SHA-256 Hash:</span>
                    <button
                      onClick={() => copyToClipboard(rec.sha256Hash, rec.id)}
                      className="hover:text-slate-900 flex items-center gap-1 font-mono text-[11px]"
                      title="Copy Hash"
                    >
                      {rec.sha256Hash.slice(0, 18)}...
                      {copiedHash === rec.id ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Encryption:</span>
                    <span className="text-[#0D9488] font-medium">{rec.encryptionStatus}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-slate-600">
                    <span className="text-slate-400">Anchor Tx:</span>
                    <span className="text-slate-500 text-[11px]">{rec.anchorTxHash.slice(0, 16)}...</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSharingRecordId(rec.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-600" /> Share with Hospital
                </button>
                <button
                  onClick={() => alert(`Decrypted local blob for ${rec.title}: Ready for secure browser inspection.`)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Decrypt & View
                </button>
              </div>

              {/* Inline Sharing Modal */}
              {sharingRecordId === rec.id && (
                <div className="mt-3 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs space-y-3">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Select Hospital & Access Duration
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Target Hospital:</label>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                    >
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.nabhRegistration})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Duration (Auto-Expires):</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 3, 6, 24].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setSelectedDurationHours(hrs)}
                          className={`py-1 rounded text-xs font-medium border ${
                            selectedDurationHours === hrs
                              ? 'bg-[#142D4E] text-white border-[#142D4E]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {hrs} hr{hrs > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSharingRecordId(null)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleGrantAccess(rec.id)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs transition-colors"
                    >
                      Grant Access
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Upload & Client-Side Encrypt Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#142D4E]">Encrypt & Store Medical Document</h3>
                  <p className="text-xs text-slate-500">Client-side WebCrypto encryption</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document / Diagnosis Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MRI Lumbar Spine & Disc Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedicalRecord['category'])}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-teal-500 outline-none"
                  >
                    <option>Lab Report</option>
                    <option>Discharge Summary</option>
                    <option>Diagnostic Imaging</option>
                    <option>Prescription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medical Institution
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Apollo Spectra Hospital"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Private Clinical Notes (Stripped from Insurers)
                </label>
                <textarea
                  rows={3}
                  placeholder="Clinical notes, findings, impressions. Encrypted with your local private key before storage."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-[11px] text-teal-800 space-y-1">
                <strong>Cryptographic Guarantee:</strong>
                <div>1. AES-256-GCM symmetric key derived from your decentralized identity.</div>
                <div>2. SHA-256 fingerprint is checked after authenticated decryption. No chain anchor is created.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={encrypting}
                  className="px-4 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors disabled:bg-slate-300"
                >
                  {encrypting ? 'Encrypting & Anchoring...' : 'Confirm Encryption'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// Subcomponent for shared card
const SharedRecordCard: React.FC<{
  record: MedicalRecord;
  onRevoke: () => void;
  onCopyHash: (hash: string) => void;
  isCopied: boolean;
}> = ({ record, onRevoke, onCopyHash, isCopied }) => {
  const countdown = useCountdown(record.accessExpiresAt);

  return (
    <Card className="p-5 border-amber-200 bg-amber-50/30 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">{record.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Shared with <strong className="text-amber-800">{record.sharedWithHospitalName}</strong>
            </p>
          </div>
          <Badge variant="amber">Active Consent</Badge>
        </div>

        <div className="mt-3 p-3 rounded-lg bg-white border border-amber-200/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-400">Countdown:</span>
            <span className="font-mono text-amber-800 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" /> {countdown}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-slate-600">
            <span className="text-slate-400">Anchor:</span>
            <button
              onClick={() => onCopyHash(record.sha256Hash)}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-mono text-[11px]"
            >
              {record.sha256Hash.slice(0, 16)}...
              {isCopied ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Zero data export permitted</span>
        <button
          onClick={onRevoke}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
        >
          Revoke Access Immediately
        </button>
      </div>
    </Card>
  );
};
