import React from 'react';
import { ShieldCheck, Database, LogOut } from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';

export const Topbar: React.FC = () => {
  const { role, logout, backendConnected } = useArogyaZK();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          <span className="font-medium text-slate-700">ArogyaZK v2</span>
          <span>· {role} workspace</span>
        </div>

        <span className="text-slate-300">|</span>

        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-teal-600" />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
            <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-teal-500' : 'bg-amber-500'} animate-pulse`} />
            {backendConnected ? 'SQLite DB Connected (WAL)' : 'Syncing Engine...'}
          </span>
        </div>
      </div>

      <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><LogOut className="h-4 w-4" /> Sign out</button>
    </header>
  );
};
