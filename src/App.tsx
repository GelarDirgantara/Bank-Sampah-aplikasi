/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import KelolaNasabah from "./components/KelolaNasabah";
import InputTransaksi from "./components/InputTransaksi";
import KelolaHarga from "./components/KelolaHarga";
import KelolaStaff from "./components/KelolaStaff";
import NotifikasiLog from "./components/NotifikasiLog";
import RekapLaporan from "./components/RekapLaporan";
import PenarikanSaldo from "./components/PenarikanSaldo";
import { Staff, StaffRole } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [currentTab, setTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Restore session on load
    const storedToken = localStorage.getItem("dutabank_token");
    const storedStaff = localStorage.getItem("dutabank_staff");

    if (storedToken && storedStaff) {
      setToken(storedToken);
      setStaff(JSON.parse(storedStaff));
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (userToken: string, loggedStaff: Staff) => {
    localStorage.setItem("dutabank_token", userToken);
    localStorage.setItem("dutabank_staff", JSON.stringify(loggedStaff));
    setToken(userToken);
    setStaff(loggedStaff);
    setTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("dutabank_token");
    localStorage.removeItem("dutabank_staff");
    setToken(null);
    setStaff(null);
    setTab("dashboard");
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Mengkoneksikan RT 06 Bank Sampah...</p>
        </div>
      </div>
    );
  }

  // Not authenticated? Show Indonesian portal
  if (!token || !staff) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Role Gatekeepers
  const isAdmin = staff.role === StaffRole.ADMIN;

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard token={token} staff={staff} onNavigateToInput={() => setTab("input-transaksi")} />;
      case "input-transaksi":
        return <InputTransaksi token={token} />;
      case "penarikan-saldo":
        return <PenarikanSaldo token={token} isAdmin={isAdmin} />;
      case "kelola-nasabah":
        return isAdmin ? <KelolaNasabah token={token} /> : <Dashboard token={token} staff={staff} onNavigateToInput={() => setTab("input-transaksi")} />;
      case "kelola-harga":
        return <KelolaHarga token={token} userRole={staff.role} />;
      case "kelola-staff":
        return isAdmin ? <KelolaStaff token={token} /> : <Dashboard token={token} staff={staff} onNavigateToInput={() => setTab("input-transaksi")} />;
      case "notifikasi-log":
        return <NotifikasiLog token={token} />;
      case "rekap-laporan":
        return <RekapLaporan token={token} />;
      default:
        return <Dashboard token={token} staff={staff} onNavigateToInput={() => setTab("input-transaksi")} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Controller */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        staff={staff}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Primary Workspace Scroll wrapper */}
      <main id="main-workspace" className="flex-1 overflow-y-auto px-4 py-6 md:p-8 max-w-7xl mx-auto w-full">
        {renderTabContent()}
      </main>
    </div>
  );
}

