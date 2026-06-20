/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Lock, KeyRound, Recycle, ShieldAlert, HelpCircle, Info, X } from "lucide-react";
import Logo from "./Logo";

interface LoginProps {
  onLoginSuccess: (token: string, staff: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogin = async (e: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const u = customUser || username;
    const p = customPass || password;

    if (!u || !p) {
      setError("Username dan password wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal.");
      }

      onLoginSuccess(data.token, data.staff);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sambungan.");
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickLogin = (role: "admin" | "petugas") => {
    if (role === "admin") {
      setUsername("admin");
      setPassword("admin");
      handleLogin({ preventDefault: () => {} } as any, "admin", "admin");
    } else {
      setUsername("petugas");
      setPassword("petugas");
      handleLogin({ preventDefault: () => {} } as any, "petugas", "petugas");
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Sahabat Sampah Duta Logo SVG */}
        <div className="mb-2">
          <Logo size="xl" showText={true} />
        </div>
        
        <span className="inline-block mt-3 px-3 py-1 bg-blue-105 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
          PWA Khusus Staf & Admin
        </span>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl border border-slate-100 sm:px-10">
          
          {error && (
            <div id="login-error-alert" className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-md flex items-start gap-2 animate-pulse">
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => handleLogin(e)}>
            <div>
              <label htmlFor="username-input" className="block text-sm font-semibold text-slate-700">
                Username Staf
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username-input"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin / petugas"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-sm font-semibold text-slate-700">
                Kata Sandi
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                id="login-btn-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/10 text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Menghubungkan..." : "Masuk Aplikasi"}
              </button>
            </div>
          </form>

          {/* Secure / Subtle Help Trigger at the bottom of the form block instead of ugly visible buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              id="help-login-trigger"
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-slate-400 hover:text-[#00A2AC] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer mx-auto"
            >
              <HelpCircle className="h-4 w-4" />
              Lupa Akun / Informasi Kredensial Staf?
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              * Khusus staf terdaftar RT 06 RW 14 Depok • Bank Sampah Pondok Duta.
            </p>
          </div>
        </div>
      </div>

      {/* Modern, Beautiful Portal Help Overlay Modal containing Staff Username/Password details */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Kredensial Petugas Resmi
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    RT 06 RW 14 PONDOK DUTA
                  </p>
                </div>
              </div>
              <button
                id="close-help-modal-btn"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list of staff usernames and passwords */}
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Gunakan akun resmi berikut ini untuk mengakses sistem administrasi Bank Sampah Duta:
              </p>

              {/* Account 1: Admin */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                    <h4 className="text-xs font-black text-slate-800 uppercase">AKUN ADMIN (KETUA RT)</h4>
                  </div>
                  <div className="mt-2 text-xs font-mono space-y-1 text-slate-600">
                    <div>Username: <span className="font-bold text-slate-900">admin</span></div>
                    <div>Kata Sandi: <span className="font-bold text-slate-900">admin</span></div>
                  </div>
                </div>
                <button
                  id="auto-login-admin-btn"
                  onClick={() => {
                    setShowHelpModal(false);
                    triggerQuickLogin("admin");
                  }}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm text-center"
                >
                  Masuk Admin
                </button>
              </div>

              {/* Account 2: Petugas */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-blue-500 rounded-full" />
                    <h4 className="text-xs font-black text-slate-800 uppercase">AKUN PETUGAS TIMBANG</h4>
                  </div>
                  <div className="mt-2 text-xs font-mono space-y-1 text-slate-600">
                    <div>Username: <span className="font-bold text-slate-900">petugas</span></div>
                    <div>Kata Sandi: <span className="font-bold text-slate-900">petugas</span></div>
                  </div>
                </div>
                <button
                  id="auto-login-petugas-btn"
                  onClick={() => {
                    setShowHelpModal(false);
                    triggerQuickLogin("petugas");
                  }}
                  className="px-3 py-2 bg-[#00A2AC] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-cyan-700 transition-colors cursor-pointer shadow-sm text-center"
                >
                  Masuk Petugas
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-400 font-semibold leading-relaxed">
              * Data tersimpan aman di database lokal. Harap hubungi Ketua RT jika ingin menambah staf baru.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
