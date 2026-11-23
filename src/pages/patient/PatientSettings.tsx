import React, { useState } from 'react';
import {
  Settings,
  KeyRound,
  ShieldCheck,
  Download,
  RefreshCw,
  Bell,
  Wallet,
  Lock,
  Check,
  UserCheck
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientSettings: React.FC = () => {
  const { patientProfile } = useArogyaZK();
  const [backedUp, setBackedUp] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [notifyConsentExpiry, setNotifyConsentExpiry] = useState(true);
  const [notifyClaimSettled, setNotifyClaimSettled] = useState(true);
  const [requirePassphrase, setRequirePassphrase] = useState(true);

  const handleBackupKeys = () => {
    setBackedUp(true);
    setTimeout(() => setBackedUp(false), 3000);
  };

  const handleRotateKey = () => {
    setRotated(true);
    setTimeout(() => setRotated(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Patient Settings & Identity</h1>
            <Badge variant="teal">Decentralized ID Verified</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your sovereign cryptographic keys, privacy preferences, and connected Web3 wallet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & DID */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity Card */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-[#142D4E] text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0D9488]" /> Sovereign Patient Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400">Full Name:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{patientProfile.name}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400">Patient Identifier:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{patientProfile.id}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400">ABHA Digital Health ID:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">91-4402-8819-2041</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400">Zero-Knowledge ID:</span>
                <div className="font-mono text-teal-700 font-bold text-xs mt-0.5">{patientProfile.zkId}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0D9488]" /> W3C DID Standard
              </div>
              <p className="text-[11px] text-teal-800">
                Your DID URI is: <code className="bg-teal-100/80 px-1 py-0.5 rounded">did:arogyazk:0x9041...E4B2</code>.
                No personal health information (PHI) is ever tied to your public address.
              </p>
            </div>
          </Card>

          {/* Cryptographic Key Management */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-[#142D4E] text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#0D9488]" /> Cryptographic Key Management
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">AES-256 Vault Backup Key</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">
                    Export your encrypted recovery key to decrypt your vault on a new browser or phone.
                  </p>
                </div>
                <button
                  onClick={handleBackupKeys}
                  className="px-3.5 py-2 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {backedUp ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Backed Up!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Export Key
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">ZK Prover Blinding Factor</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">
                    Rotate your zero-knowledge circuit salt to ensure claims cannot be linked by third parties.
                  </p>
                </div>
                <button
                  onClick={handleRotateKey}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {rotated ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600" /> Salt Rotated!
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Rotate Salt
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Preferences & Connected Wallet */}
        <div className="lg:col-span-5 space-y-6">
          {/* Notification & Security Preferences */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-[#142D4E] text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0D9488]" /> Privacy & Notification Controls
            </h3>

            <div className="space-y-3.5 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyConsentExpiry}
                  onChange={(e) => setNotifyConsentExpiry(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-900">Consent Expiry Warning</span>
                  <p className="text-slate-500 text-[11px]">
                    Alert 30 minutes before temporary hospital access token expires
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyClaimSettled}
                  onChange={(e) => setNotifyClaimSettled(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-900">Settlement Update Alerts</span>
                  <p className="text-slate-500 text-[11px]">
                    Settlement integrations are currently unavailable
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePassphrase}
                  onChange={(e) => setRequirePassphrase(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-900">Passphrase on Consent Signing</span>
                  <p className="text-slate-500 text-[11px]">
                    Prompt for local password before granting hospital access
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Connected Web3 Wallet */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-[#142D4E] text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#0D9488]" /> Blockchain Wallet
            </h3>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Network:</span>
                <span className="text-amber-700 font-semibold font-sans">Not configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Address:</span>
                <span className="text-slate-500 font-semibold">No wallet connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Relayer Gas:</span>
                <span className="text-slate-500 font-sans">Unavailable</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              No relayer or blockchain transaction service is configured.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
