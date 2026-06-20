/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Scale, 
  Banknote,
  Users, 
  Tag, 
  UserCog, 
  MessageSquareCode, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  UserCheck,
  Printer
} from "lucide-react";
import { Staff, StaffRole } from "../types";
import Logo from "./Logo";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  staff: Staff;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  currentTab, 
  setTab, 
  staff, 
  onLogout,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {
  
  const isAdmin = staff.role === StaffRole.ADMIN;
  const [confirmLogout, setConfirmLogout] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [StaffRole.ADMIN, StaffRole.PETUGAS] },
    { id: "input-transaksi", label: "Input Transaksi", icon: Scale, roles: [StaffRole.ADMIN, StaffRole.PETUGAS] },
    { id: "penarikan-saldo", label: "Penarikan Saldo", icon: Banknote, roles: [StaffRole.ADMIN, StaffRole.PETUGAS] },
    { id: "rekap-laporan", label: "Rekap & Cetak Laporan", icon: Printer, roles: [StaffRole.ADMIN, StaffRole.PETUGAS] },
    { id: "kelola-nasabah", label: "Kelola Nasabah", icon: Users, roles: [StaffRole.ADMIN] },
    { id: "kelola-harga", label: "Daftar Harga & List", icon: Tag, roles: [StaffRole.ADMIN, StaffRole.PETUGAS] },
    { id: "kelola-staff", label: "Akses & Kelola Staf", icon: UserCog, roles: [StaffRole.ADMIN] },
    { id: "notifikasi-log", label: "Log Notifikasi WA", icon: MessageSquareCode, roles: [StaffRole.ADMIN, StaffRole.PETUGAS] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(staff.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/20">
        <Logo size="sm" showText={false} className="shrink-0" />
        <div>
          <h1 className="text-[14px] font-black text-white tracking-wide leading-none">
            Sahabat Sampah
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] font-sans uppercase tracking-widest text-emerald-400 font-black leading-none select-none">
              Duta
            </span>
            <span className="text-[8px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-1.5 py-0.5 rounded font-black select-none tracking-widest uppercase">
              GP 23
            </span>
          </div>
          <p className="text-[8px] text-slate-450 font-bold uppercase tracking-wider mt-1 leading-none font-mono">
            RT 06 RW 14 DEPOK
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-5 bg-slate-800/40 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl text-white shadow ${
            isAdmin ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
          }`}>
            {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-semibold text-slate-200 truncate">{staff.nama}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-emerald-400" : "bg-blue-400"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                isAdmin ? "text-emerald-400" : "text-blue-400"
              }`}>
                {isAdmin ? "Admin Penuh" : "Petugas"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`sidebar-nav-${item.id}`}
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center px-4.5 py-3.5 rounded-2xl text-xs font-bold font-sans tracking-wide transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/10 scale-[1.02]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 mr-3 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout Action Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button
          id="sidebar-nav-logout"
          onClick={() => {
            if (!confirmLogout) {
              setConfirmLogout(true);
              setTimeout(() => setConfirmLogout(false), 4000);
            } else {
              onLogout();
            }
          }}
          className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            confirmLogout 
              ? "bg-rose-600 text-white shadow-md shadow-rose-900/30 animate-pulse scale-102" 
              : "text-rose-450 hover:bg-rose-950/20 hover:text-rose-350"
          }`}
        >
          <LogOut className={`h-4 w-4 mr-3 shrink-0 ${confirmLogout ? "text-white" : "text-rose-450"}`} />
          {confirmLogout ? "Klik Sekali Lagi" : "Keluar (Logout)"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-5 sticky top-0 z-40 w-full shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showText={false} className="shrink-0" />
          <div>
            <h1 className="text-xs font-black text-white tracking-wide leading-tight">Sahabat Sampah Duta</h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wider">RT 06 RW 14 Depok • GRUP 23</p>
          </div>
        </div>
        <button
          id="mobile-hamburger-btn"
          aria-label="Toggle Menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 border border-slate-700 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 focus:outline-none"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0 shrink-0 select-none">
        <SidebarContent />
      </aside>

      {/* Mobile Floating Menu Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop click dismisses */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setMobileOpen(false)}
          />
          
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-slate-950 text-white z-50 animate-slide-right">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
