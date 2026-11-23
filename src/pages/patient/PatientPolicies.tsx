import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Building2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientPolicies: React.FC = () => {
  const { patientProfile, claims, setActiveTab } = useArogyaZK();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const approvedClaimsTotal = claims
    .filter((c) => c.status === 'Approved')
    .reduce((sum, c) => sum + c.claimAmount, 0);

  const availableCoverage = Math.max(0, patientProfile.coverageLimit - approvedClaimsTotal);
  const percentageUtilized = Math.min(100, Math.round((approvedClaimsTotal / patientProfile.coverageLimit) * 100));

  const networkHospitals = [
    {
      id: 'HSP-402',
      name: 'Apollo Spectra Hospital',
      city: 'Bengaluru (Koramangala)',
      nabh: 'NABH-H-2024-8812',
      type: 'Super-Speciality & Daycare Surgery',
      status: 'Cashless Pre-Approved'
    },
    {
      id: 'HSP-219',
      name: 'Fortis Diagnostics',
      city: 'Mumbai (Mulund)',
      nabh: 'NABH-L-2023-4410',
      type: 'Advanced Pathology & Imaging',
      status: 'Cashless Pre-Approved'
    },
    {
      id: 'HSP-308',
      name: 'Sankara Eye Centre',
      city: 'Bengaluru (Kundalahalli)',
      nabh: 'NABH-E-2022-7719',
      type: 'Ophthalmology & Retinal Care',
      status: 'Cashless Pre-Approved'
    },
    {
      id: 'HSP-615',
      name: 'Medanta Super Speciality',
      city: 'Gurugram (Sector 38)',
      nabh: 'NABH-H-2026-9904',
      type: 'Cardiology & Multi-Organ Transplant',
      status: 'Cashless Pre-Approved'
    }
  ];

  const coveredTreatments = [
    { name: 'Cardiology & Inpatient Cardiac Care', limit: 'Up to Sum Insured', copay: '0% Co-pay' },
    { name: 'Laparoscopic & Daycare Procedures', limit: '100% Covered (No 24h rule)', copay: '0% Co-pay' },
    { name: 'Specialist Diagnostics & MRI/CT/OCT Scans', limit: 'Up to ₹50,000 / yr', copay: '0% Co-pay' },
    { name: 'Pre & Post Hospitalization (60/90 Days)', limit: 'Reimbursable via ZK proof', copay: '0% Co-pay' },
    { name: 'Emergency ICU & Road Ambulance', limit: 'Up to ₹10,000 per claim', copay: '0% Co-pay' }
  ];

  const handleDownloadCertificate = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#142D4E]">Insurance Policies</h1>
            <Badge variant="teal">Active & ZK-Anchored</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Cryptographic policy certificate verifying eligibility without exposing claims or private health history
          </p>
        </div>
        <button
          onClick={handleDownloadCertificate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
        >
          <Download className="w-4 h-4" />
          {downloadSuccess ? 'Certificate Downloaded!' : 'Download ZK Policy Certificate'}
        </button>
      </div>

      {/* Main Policy Card */}
      <Card className="p-6 bg-gradient-to-br from-[#142D4E] via-[#1D3E6B] to-[#0F233D] text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-300 font-semibold">
                  {patientProfile.insurerName}
                </span>
                <h2 className="text-xl font-bold tracking-tight">{patientProfile.planName}</h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-300">Policy Number</span>
              <div className="font-mono text-base font-bold text-white tracking-wider">
                {patientProfile.policyNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div>
              <div className="text-xs text-slate-300">Total Sum Insured</div>
              <div className="text-xl font-bold text-white mt-1">
                INR {patientProfile.coverageLimit.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-300">Utilized Claims</div>
              <div className="text-xl font-bold text-teal-300 mt-1">
                INR {approvedClaimsTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-300">Remaining Balance</div>
              <div className="text-xl font-bold text-white mt-1">
                INR {availableCoverage.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-300">Valid Through</div>
              <div className="text-xl font-bold text-slate-200 mt-1">{patientProfile.validTill}</div>
            </div>
          </div>

          {/* Coverage Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Coverage Utilization</span>
              <span>{percentageUtilized}% utilized</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(percentageUtilized, 4)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: ZK Cryptographic Leaf & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ZK Cryptographic Proof Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
              <h3 className="font-bold text-[#142D4E] text-sm">
                Policy Verification Status
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Policy details are prototype data. Cryptographic commitments and Groth16 policy verification are not configured in this repository.
            </p>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Policy root:</span>
                <span className="text-amber-700 font-semibold">Not configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Eligibility proof:</span>
                <span className="text-amber-700 font-semibold">Not verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Displayed limit:</span>
                <span className="text-slate-900">500000 INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duplicate claim protection:</span>
                <span className="text-amber-700">Unavailable</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Prototype policy details:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  These values are display data and are not backed by an on-chain policy commitment.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('submit-claim')}
              className="w-full py-2.5 px-4 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              Initiate Claim with this Policy <ChevronRight className="w-4 h-4" />
            </button>
          </Card>
        </div>

        {/* Benefits & Inclusions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-[#142D4E] text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0D9488]" />
              Covered Benefits & ZK-Preauthorized Treatments
            </h3>
            <div className="space-y-3">
              {coveredTreatments.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                    <span className="font-medium text-slate-900">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{item.limit}</span>
                    <Badge variant="teal">{item.copay}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cashless Network Hospitals */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#142D4E] text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0D9488]" />
                Cashless Network Hospitals (NABH Certified)
              </h3>
              <span className="text-xs text-slate-500">{networkHospitals.length} Empanelled</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {networkHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors text-xs space-y-2 bg-slate-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{hosp.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {hosp.city}
                      </p>
                    </div>
                    <Badge variant="teal">Instant ZK</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                    <span className="font-mono text-slate-500">{hosp.nabh}</span>
                    <span className="text-teal-700 font-medium">{hosp.status}</span>
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
