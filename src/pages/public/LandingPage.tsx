import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  UserCheck,
  ArrowRight,
  Building2,
  Landmark,
  CheckCircle2
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';

export const LandingPage: React.FC = () => {
  const { login } = useArogyaZK();
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const error = await login(email, password);
    setLoginError(error || '');
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-white font-bold flex items-center justify-center text-sm">
              AZ
            </div>
            <span className="font-bold text-lg text-[#142D4E] tracking-tight">ArogyaZK</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-[#142D4E]">Home</a>
            <a href="#how-it-works" className="hover:text-[#142D4E]">How It Works</a>
            <a href="#security" className="hover:text-[#142D4E]">Security</a>
            <a href="#portals" className="hover:text-[#142D4E]">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLoginOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#142D4E] hover:bg-slate-100"
            >
              Login
            </button>
            <button
              onClick={() => setLoginOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#142D4E] hover:bg-[#1D3E6B] text-white transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section id="home" className="max-w-7xl mx-auto px-6 pt-16 pb-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
            Healthcare workflow prototype · protected accounts
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#142D4E] tracking-tight leading-[1.15]">
            Your Health Data. Your Control. Your Claims.
          </h1>
          <p className="text-lg text-slate-600 mt-5 leading-relaxed max-w-2xl">
            Manage patient records and consent through authenticated workspaces. Record encryption is enabled when a server key is configured. Proof verification, insurer settlement, and emergency recovery remain unavailable until their cryptographic integrations are installed.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-8">
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white font-semibold text-sm transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
            >
              Explore Privacy Guard Demo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {[
            {
              icon: ShieldCheck,
              title: 'Role-gated workflows',
              desc: 'Patient, hospital, insurer, and admin routes require authenticated accounts with server-enforced roles.'
            },
            {
              icon: FileCheck2,
              title: 'Proof verification',
              desc: 'Claim submission is disabled until a real Groth16 circuit, proving key, and verification key are configured.'
            },
            {
              icon: Lock,
              title: 'Record integrity',
              desc: 'Encrypted records use AES-256-GCM and are checked against a SHA-256 digest before decryption.'
            },
            {
              icon: UserCheck,
              title: 'Patient-controlled medical records',
              desc: 'Patients can grant time-limited access to verified hospital accounts and revoke permissions.'
            }
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="p-5">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center mb-3.5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[#142D4E] text-sm">{pillar.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{pillar.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="portals" className="bg-[#F8FAFC] border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-bold text-[#142D4E]">Role-Based Enterprise Workspaces</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Sign in to the workspace assigned to your account. Selecting a role in the browser does not grant access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                role: 'patient' as const,
                title: 'Patient Dashboard',
                badge: 'Health Vault & Consent',
                icon: UserCheck,
                points: ['AES-256-GCM records when configured', 'Time-bound hospital access control', 'Claim status from the API']
              },
              {
                role: 'hospital' as const,
                title: 'Hospital Dashboard',
                badge: 'Provider Workflow',
                icon: Building2,
                points: ['Consent-gated record access', 'Claim creation waits for signature and proof services', 'Role-checked API access']
              },
              {
                role: 'insurer' as const,
                title: 'Insurer Privacy Guard',
                badge: 'Core ZK Innovation',
                icon: Landmark,
                points: ['View assigned claims', 'Proof checks remain disabled', 'Settlement requires a real payout adapter']
              },
              {
                role: 'admin' as const,
                title: 'Network Admin',
                badge: 'Governance & Audit',
                icon: ShieldCheck,
                points: ['NABH hospital registry approvals', 'Verifier contract health monitor', 'Zero access to patient vault keys']
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.role} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-9 h-9 rounded-lg bg-[#142D4E] text-white flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#142D4E]">{item.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {item.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="mt-6 w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-[#142D4E] hover:text-white text-[#142D4E] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Open {item.title} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <form onSubmit={submitLogin} className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <h2 id="login-title" className="text-xl font-bold text-[#142D4E]">Sign in to ArogyaZK</h2>
            <p className="mt-1 text-sm text-slate-500">Your account role determines which workspace you can access.</p>
            <label className="mt-5 block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label className="mt-4 block text-sm font-medium text-slate-700">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            {loginError && <p role="alert" className="mt-3 text-sm text-red-700">{loginError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setLoginOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600">Cancel</button><button disabled={busy} className="rounded-lg bg-[#142D4E] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
