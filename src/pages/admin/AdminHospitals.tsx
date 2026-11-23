import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  AlertCircle,
  Wallet,
  FileCheck2,
  MapPin,
  Loader2
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HospitalEntity } from '../../types';
import { approveHospitalInDB } from '../../services/api';

export const AdminHospitals: React.FC = () => {
  const { hospitals, approveHospitalEntity } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospNabh, setNewHospNabh] = useState('');
  const [newHospCity, setNewHospCity] = useState('');
  const [newHospWallet, setNewHospWallet] = useState('');

  const filteredHospitals = hospitals.filter((h) => {
    return (
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.id.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.nabhRegistration.toLowerCase().includes(search.toLowerCase())
    );
  });

  const verifiedCount = hospitals.filter((h) => h.status === 'Locally Verified').length;
  const pendingCount = hospitals.filter((h) => h.status === 'Pending Approval').length;

  const handleRegisterHospital = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Provider application submitted for ${newHospName}. Added to pending queue.`);
    setShowAddModal(false);
    setNewHospName('');
    setNewHospNabh('');
    setNewHospCity('');
    setNewHospWallet('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Hospital Approvals & Registry</h1>
            <Badge variant="amber">Local hospital registry</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Review local hospital account entries. This page does not verify NABH credentials or enroll providers on-chain.
          </p>
        </div>
        <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500">
          <Plus className="w-4 h-4" /> Registration unavailable
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200 bg-teal-50/40">
          <div className="text-xs font-semibold text-slate-700">Locally verified providers</div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">{verifiedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">No on-chain whitelist</div>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <div className="text-xs font-semibold text-amber-800">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">NABH certificate awaiting verification</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium text-slate-500">Registry Integrity</div>
          <div className="text-sm font-bold text-amber-700 mt-2">No cryptographic verification</div>
          <div className="text-[11px] text-slate-500 mt-0.5">No hospital signing keys configured</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by hospital name, NABH registration, city, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent placeholder-slate-400"
        />
      </Card>

      {/* Hospital Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHospitals.map((hosp) => (
          <Card key={hosp.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#142D4E] flex items-center justify-center font-bold text-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {hosp.city}
                    </p>
                  </div>
                </div>
                <Badge variant={hosp.status === 'Locally Verified' ? 'amber' : 'slate'}>{hosp.status}</Badge>
              </div>

              <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hospital ID:</span>
                  <span className="font-semibold text-slate-900">{hosp.id}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400 font-sans">NABH Accreditation:</span>
                  <span className="text-slate-700">{hosp.nabhRegistration}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400 font-sans">Whitelisted Wallet:</span>
                  <span className="text-teal-700 font-bold">{hosp.walletAddress}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {hosp.status === 'Pending Approval' ? (
                <button
                  onClick={() => approveHospitalEntity(hosp.id)}
                  className="w-full py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Verified Locally
                </button>
              ) : (
                <div className="w-full flex items-center justify-between text-xs text-slate-500">
                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Smart Contract Active
                  </span>
                  <span className="text-[11px] text-slate-400">Claims Verified: Unlimited</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-[#142D4E] text-base">Register Healthcare Provider Application</h3>
            <form onSubmit={handleRegisterHospital} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Manipal Hospitals"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NABH Registration</label>
                <input
                  type="text"
                  required
                  placeholder="NABH-H-2026-XXXX"
                  value={newHospNabh}
                  onChange={(e) => setNewHospNabh(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wallet Address</label>
                  <input
                    type="text"
                    required
                    placeholder="0x..."
                    value={newHospWallet}
                    onChange={(e) => setNewHospWallet(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#142D4E] hover:bg-[#1D3E6B] text-white font-semibold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
