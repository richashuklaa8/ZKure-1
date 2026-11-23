import React from 'react';
import {
  LayoutDashboard,
  Lock,
  FileCheck2,
  FilePlus2,
  KeyRound,
  History,
  ShieldAlert,
  Settings,
  Users,
  FolderCheck,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Scale,
  Receipt,
  Activity,
  Blocks
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const ROLE_MENUS: Record<Exclude<UserRole, 'public'>, NavItem[]> = {
  patient: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'vault', label: 'My Health Vault', icon: Lock },
    { id: 'policies', label: 'Insurance Policies', icon: FileCheck2 },
    { id: 'submit-claim', label: 'Submit a Claim', icon: FilePlus2 },
    { id: 'permissions', label: 'Access Permissions', icon: KeyRound },
    { id: 'history', label: 'Claim History', icon: History },
    { id: 'audit', label: 'Privacy & Audit Log', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings }
  ],
  hospital: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    { id: 'authorized', label: 'Authorized Records', icon: FolderCheck },
    { id: 'create-claim', label: 'Create Insurance Claim', icon: FilePlus2 },
    { id: 'verification', label: 'Claim Verification', icon: CheckCircle2 },
    { id: 'submitted', label: 'Submitted Claims', icon: History },
    { id: 'profile', label: 'Hospital Profile', icon: Building2 }
  ],
  insurer: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'incoming', label: 'Incoming Claims', icon: FilePlus2 },
    { id: 'zk-verify', label: 'ZK Verification', icon: ShieldCheck },
    { id: 'approved', label: 'Approved Claims', icon: CheckCircle2 },
    { id: 'settlements', label: 'Settlement History', icon: Receipt },
    { id: 'risk', label: 'Risk Monitoring', icon: Scale },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert }
  ],
  admin: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'hospitals', label: 'Hospital Approvals', icon: Building2 },
    { id: 'contracts', label: 'Smart Contract Status', icon: Activity },
    { id: 'explorer', label: 'Blockchain Explorer', icon: Blocks },
    { id: 'audit', label: 'System Audit Logs', icon: ShieldAlert }
  ]
};

export const Sidebar: React.FC = () => {
  const { role, activeTab, setActiveTab, setRole } = useArogyaZK();
  if (role === 'public') return null;

  const items = ROLE_MENUS[role];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        <div
          onClick={() => setRole('public')}
          className="h-16 px-5 border-b border-slate-200 flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#142D4E] flex items-center justify-center text-white font-bold text-sm">
            AZ
          </div>
          <div>
            <div className="font-bold text-[#142D4E] tracking-tight leading-none">ArogyaZK</div>
            <div className="text-[11px] text-slate-500 mt-0.5 capitalize">{role} Workspace</div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#142D4E] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-[#142D4E]">Zero-Knowledge Active</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Client-side AES-256 encryption & Groth16 proof circuit enabled.
          </p>
        </div>
      </div>
    </aside>
  );
};
