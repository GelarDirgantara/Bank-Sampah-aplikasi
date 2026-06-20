/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Scale, 
  TrendingUp, 
  Users, 
  Wallet, 
  Plus, 
  ArrowRight, 
  RefreshCw,
  Clock,
  Award,
  CircleCheck,
  Package,
  Calendar,
  Edit3,
  Save,
  XCircle,
  Info,
  Settings
} from "lucide-react";
import { Transaction, DashboardStats, Staff, StaffRole, CollectionSchedule } from "../types";

interface DashboardProps {
  token: string;
  staff: Staff;
  onNavigateToInput: () => void;
}

export default function Dashboard({ token, staff, onNavigateToInput }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Collection Schedule States
  const [schedule, setSchedule] = useState<CollectionSchedule | null>(null);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editTanggal, setEditTanggal] = useState("");
  const [editWaktu, setEditWaktu] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const isAdmin = staff.role === StaffRole.ADMIN;

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let statsData = null;
      if (statsRes.ok) {
        statsData = await statsRes.json();
      }

      // Fetch transactions (take recent 5)
      const txRes = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let txData = [];
      if (txRes.ok) {
        txData = await txRes.json();
      }

      // Fetch Collection Schedule
      const schedRes = await fetch("/api/schedule", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setSchedule(schedData);
        setEditTanggal(schedData.tanggal);
        setEditWaktu(schedData.waktu);
        setEditKeterangan(schedData.keterangan);
      }

      // Set clean states safely with correct types/fallbacks
      if (statsData && typeof statsData === "object" && "totalSsetoranHariIni" in statsData) {
        setStats(statsData);
      } else {
        setStats(null);
      }

      if (Array.isArray(txData)) {
        setRecentTransactions(txData.slice(0, 5));
      } else {
        setRecentTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setStats(null);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    setScheduleError("");
    setScheduleSuccess(false);

    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tanggal: editTanggal,
          waktu: editWaktu,
          keterangan: editKeterangan
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui jadwal.");
      }

      setSchedule(data.schedule);
      setScheduleSuccess(true);
      setTimeout(() => {
        setScheduleSuccess(false);
        setShowEditSchedule(false);
      }, 1500);
    } catch (err: any) {
      setScheduleError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div id="dashboard-loading" className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-550">Memuat data ringkasan RT 06...</span>
      </div>
    );
  }

  // Pre-configured custom colors/styles for items based on hierarchical prefixes
  const getSubColor = (jenis: string) => {
    const key = jenis.toLowerCase();
    if (key.startsWith("kertas")) {
      return { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" };
    }
    if (key.startsWith("plastik")) {
      return { bg: "bg-teal-50 text-teal-700", dot: "bg-teal-500" };
    }
    if (key.startsWith("logam")) {
      return { bg: "bg-zinc-105 text-zinc-700", dot: "bg-zinc-500" };
    }
    if (key.startsWith("belah")) {
      return { bg: "bg-purple-50 text-purple-700", dot: "bg-purple-500" };
    }
    if (key.startsWith("minyak")) {
      return { bg: "bg-slate-105 text-slate-800", dot: "bg-slate-705" };
    }
    if (key.startsWith("lain")) {
      return { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-600" };
    }
    
    switch (key) {
      case "plastik": return { bg: "bg-teal-50 text-teal-700", dot: "bg-teal-500" };
      case "besi": return { bg: "bg-zinc-105 text-zinc-700", dot: "bg-zinc-500" };
      case "kertas": return { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" };
      case "kardus": return { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-600" };
      case "aluminium": return { bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500" };
      case "kaca": return { bg: "bg-purple-50 text-purple-700", dot: "bg-purple-500" };
      case "oli": return { bg: "bg-slate-105 text-slate-800", dot: "bg-slate-705" };
      default: return { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
    }
  };

  // Safe default calculations if stats is missing or has missing properties
  const activeStats = {
    totalSsetoranHariIni: stats?.totalSsetoranHariIni ?? 0,
    totalSetoranBulanIni: stats?.totalSetoranBulanIni ?? 0,
    totalWeightKg: stats?.totalWeightKg ?? 0,
    totalActiveNasabah: stats?.totalActiveNasabah ?? 0,
    totalTransactionCount: stats?.totalTransactionCount ?? 0,
    totalSaldoTerkini: stats?.totalSaldoTerkini ?? 0,
    totalSaldoDitarik: stats?.totalSaldoDitarik ?? 0,
    totalSaldoKeseluruhan: stats?.totalSaldoKeseluruhan ?? 0
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Ringkasan Bank Sampah RT 06
          </h1>
          <p className="text-sm text-slate-500">
            Aktivitas pengumpulan dan timbangan sampah di Pondok Duta Depok.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="refresh-dashboard-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-650 transition-colors shadow-sm inline-flex items-center gap-1 cursor-pointer"
            title="SINKRON DATA"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span className="text-xs font-bold leading-none select-none hidden sm:inline">Refresh</span>
          </button>
          
          <button
            id="quick-route-input-btn"
            onClick={onNavigateToInput}
            className="py-2.5 px-4 bg-emerald-750 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-emerald-900/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Timbang Sampah</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Setoran Hari Ini</span>
              <span className="text-2xl font-black text-slate-800 block">
                Rp {activeStats.totalSsetoranHariIni.toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full inline-block">
                Nilai tabungan warga
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Total Bulan Ini</span>
              <span className="text-2xl font-black text-slate-800 block">
                Rp {activeStats.totalSetoranBulanIni.toLocaleString("id-ID")}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 py-0.5 px-2 rounded-full inline-block">
                Akumulasi transaksi
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Total Berat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Sampah Terkumpul</span>
              <span className="text-2xl font-black text-slate-800 block">
                {activeStats.totalWeightKg.toLocaleString("id-ID")} <span className="text-lg font-normal text-slate-500">kg</span>
              </span>
              <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 py-0.5 px-2 rounded-full inline-block">
                Berat bersih tertimbang
              </span>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-700">
              <Scale className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Total Kepala Keluarga (Nasabah) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Kepala Rumah Tangga</span>
              <span className="text-2xl font-black text-slate-800 block">
                {activeStats.totalActiveNasabah} <span className="text-lg font-normal text-slate-500">Rumah</span>
              </span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 py-0.5 px-2 rounded-full inline-block">
                Partisipasi warga RT 06
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-653">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Finansial & Saldo Tabungan Warga RT 06 */}
      <div className="bg-emerald-950/5 border border-emerald-900/10 p-6 rounded-3xl relative overflow-hidden shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-4 font-sans flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          IKHTISAR KEUANGAN & SALDO TABUNGAN WARGA (KORLAP RT 06)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1 bg-white p-4 rounded-2xl border border-emerald-100/40">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block font-sans">
              1. SISA SALDO TUNAI (TERKINI)
            </span>
            <span className="text-xl font-black text-slate-850 block font-sans">
              Rp {activeStats.totalSaldoTerkini.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-slate-450 block font-sans leading-relaxed">
              Jumlah dana cadangan milik warga yang mengendap di sistem tabungan saat ini.
            </span>
          </div>

          <div className="space-y-1 bg-white p-4 rounded-2xl border border-emerald-100/40">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block font-sans">
              2. TOTAL SALDO YANG SUDAH DITARIK
            </span>
            <span className="text-xl font-black text-emerald-800 block font-sans">
              Rp {activeStats.totalSaldoDitarik.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-slate-450 block font-sans leading-relaxed">
              Akumulasi pembayaran tunai / dana tabungan yang sudah dicairkan warga.
            </span>
          </div>

          <div className="space-y-1 bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100 block font-sans">
              3. TOTAL SALDO KESELURUHAN (OMSET TIMBANG)
            </span>
            <span className="text-xl font-black block font-sans text-emerald-100">
              Rp {activeStats.totalSaldoKeseluruhan.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-emerald-150 block font-sans leading-relaxed">
              Akumulasi omset tabungan yang dicatatkan dari seluruh transaksi timbang sampah.
            </span>
          </div>
        </div>
      </div>

      {/* Grid: SVG Graphic + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Interactive SVG Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Tren Volume Sampah RT 06</h2>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Skala Mingguan (Sampah Tertimbang dalam Kg)</p>
            </div>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 py-1 px-2.5 rounded-lg flex items-center gap-1 font-mono">
              <Clock className="w-3 w-3" /> JUNI 2026
            </span>
          </div>

          {/* Simple Highly Responsive Beautiful SVG Area Chart */}
          <div className="relative w-full h-56 pt-2">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Back grids */}
              <line x1="0" y1="170" x2="500" y2="170" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1.5" />
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1.5" />

              {/* Data curve area */}
              {/* Data points: (0, 150) June 10th (Weight 24kg) */}
              {/* June 10 (tx-1): 7kg. June 12 (tx-2): 10kg. June 15 (tx-3): 3kg. June 17 (mock): 5kg. June 20 (tx-4): 3.5kg */}
              <path
                d="M 50 170 C 100 120, 150 70, 200 130 C 250 150, 300 160, 350 90 C 400 110, 450 130, 450 130 L 450 170 L 50 170 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M 50 170 C 100 120, 150 70, 200 130 C 250 150, 300 160, 350 90 C 400 110, 450 130, 450 130"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Grid dots with badges */}
              <circle cx="50" cy="170" r="4" fill="#059669" stroke="#fff" strokeWidth="1.5" />
              <circle cx="100" cy="120" r="4" fill="#059669" stroke="#fff" strokeWidth="1.5" />
              <circle cx="150" cy="70" r="4" fill="#059669" stroke="#fff" strokeWidth="1.5" />
              <circle cx="200" cy="130" r="4" fill="#059669" stroke="#fff" strokeWidth="1.5" />
              <circle cx="350" cy="90" r="4" fill="#059669" stroke="#fff" strokeWidth="1.5" />
              <circle cx="450" cy="130" r="4" fill="#059669" stroke="#fff" strokeWidth="1.5" />

              {/* Text values */}
              <text x="100" y="105" className="text-[10px] font-bold fill-slate-500 font-mono" textAnchor="middle">7 kg</text>
              <text x="150" y="55" className="text-[10px] font-bold fill-slate-700 font-mono" textAnchor="middle">10 kg</text>
              <text x="200" y="115" className="text-[10px] font-bold fill-slate-500 font-mono" textAnchor="middle">3 kg</text>
              <text x="350" y="75" className="text-[10px] font-bold fill-slate-700 font-mono" textAnchor="middle">12.5 kg</text>
              <text x="450" y="115" className="text-[10px] font-bold fill-emerald-700 font-mono" textAnchor="middle">3.5 kg</text>

              {/* Label strings */}
              <text x="50" y="188" className="text-[9px] font-semibold text-slate-400 fill-slate-400 font-sans" textAnchor="middle">01 Jun</text>
              <text x="100" y="188" className="text-[9px] font-semibold text-slate-400 fill-slate-400 font-sans" textAnchor="middle">05 Jun</text>
              <text x="150" y="188" className="text-[9px] font-bold text-slate-600 fill-slate-700 font-sans" textAnchor="middle">10 Jun</text>
              <text x="200" y="188" className="text-[9px] font-bold text-slate-600 fill-slate-705" textAnchor="middle">12 Jun</text>
              <text x="350" y="188" className="text-[9px] font-bold text-slate-700 fill-slate-750 font-sans" textAnchor="middle">15 Jun</text>
              <text x="450" y="188" className="text-[9px] font-black text-emerald-700 fill-emerald-800 font-sans shadow-sm" textAnchor="middle">Hari Ini</text>
            </svg>
          </div>
          <div className="mt-2 text-center">
            <p className="text-[10px] text-slate-400">
              * Kurva diagram diatas adalah akumulasi berat setoran (kg) per tanggal timbangan aktif.
            </p>
          </div>
        </div>

        {/* Column 3: Composition Breakdown */}
        <div id="trash-breakdown-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-1">Komposisi Sampah Terkumpul</h2>
            <p className="text-[11px] text-slate-400 font-medium">Berdasarkan volume timbangan di lapangan.</p>
            
            <div className="space-y-4 mt-6">
              {/* Item 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Plastik Botol
                  </span>
                  <span>45% (42.5 kg)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: "45%" }} />
                </div>
              </div>

              {/* Item 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-750">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Kertas Koran
                  </span>
                  <span>25% (23.5 kg)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "25%" }} />
                </div>
              </div>

              {/* Item 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-750">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Kardus Sisa
                  </span>
                  <span>18% (17.2 kg)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "18%" }} />
                </div>
              </div>

              {/* Item 4 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-750">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-457" /> Besi & Metal
                  </span>
                  <span>12% (11.0 kg)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: "12%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Daur Ulang Pondok Duta</span>
          </div>
        </div>
      </div>

      {/* SCHEDULE OF WASTE COLLECTION (2 WEEKS AGREEMENT) */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/20 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <Calendar className="h-3 w-3" /> Info Jadwal Pengumpulan Sampah
            </span>
            <h2 className="text-lg font-black tracking-tight text-white leading-tight">
              Siklus Pengumpulan Sampah Rutin: 2 Minggu Sekali
            </h2>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed">
              Berdasarkan hasil kesepakatan dan perjanjian tertulis dengan <strong className="text-emerald-300">Bank Sampah Pusat</strong>, pengumpulan sampah anorganik warga RT 06 Pondok Duta dilakukan berkala dua minggu sekali agar efisiensi pengangkutan terjaga.
            </p>

            {schedule ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-2.5 bg-black/15 p-3 rounded-xl border border-white/5 font-mono">
                  <Calendar className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-emerald-300/80 font-bold uppercase block tracking-wider">TANGGAL BERIKUTNYA</span>
                    <strong className="text-xs text-white block mt-0.5">
                      {new Date(schedule.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-black/15 p-3 rounded-xl border border-white/5 font-mono">
                  <Clock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] text-emerald-300/80 font-bold uppercase block tracking-wider">JAM TIMBANG LAPANGAN</span>
                    <strong className="text-xs text-white block mt-0.5">{schedule.waktu}</strong>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-start gap-2 bg-black/10 p-3 rounded-xl border border-white/5 text-[11px] text-emerald-100 leading-relaxed">
                  <Info className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-emerald-300">Catatan Petugas Admin: </span>
                    {schedule.keterangan}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 italic">Membaca jadwal kerja timbangan...</p>
            )}
          </div>

          <div className="shrink-0">
            {isAdmin ? (
              <button
                id="edit-schedule-toggle-btn"
                onClick={() => setShowEditSchedule(!showEditSchedule)}
                className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-black tracking-wide inline-flex items-center gap-2 transition cursor-pointer shadow-sm border border-emerald-400/20"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Ubah Jadwal {showEditSchedule ? "Batal" : "(Admin)"}</span>
              </button>
            ) : (
              <div className="bg-black/15 p-4 rounded-xl border border-white/5 text-center max-w-[200px] text-[10px] text-emerald-200">
                Hubungi Admin RT06 jika ingin bernegosiasi terkait jadwal logistik pusat.
              </div>
            )}
          </div>
        </div>

        {/* INLINE ADMIN EDIT FORM CARD */}
        {showEditSchedule && isAdmin && (
          <div className="mt-6 pt-6 border-t border-white/10 text-slate-800">
            <form onSubmit={handleUpdateSchedule} className="bg-white rounded-xl p-5 shadow-inner space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2 border-b pb-2">
                <Settings className="h-4 w-4 text-emerald-600" /> PANEL PENGATURAN JADWAL TIMBANGAN RT
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-wider block">
                    Tanggal Pengumpulan Berikutnya
                  </label>
                  <input
                    id="schedule-input-date"
                    type="date"
                    required
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-wider block">
                    Jam / Waktu Pelaksanaan
                  </label>
                  <input
                    id="schedule-input-time"
                    type="text"
                    required
                    placeholder="Contoh: 08:00 - 11:30 WIB"
                    value={editWaktu}
                    onChange={(e) => setEditWaktu(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-wider block">
                    Pesan Pemberitahuan Warga RT 06
                  </label>
                  <textarea
                    id="schedule-input-desc"
                    required
                    rows={3}
                    placeholder="Masukkan alasan atau pesan info pengangkutan dari bank sampah pusat..."
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {scheduleError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-2 text-rose-700 text-[11px] font-medium rounded">
                  {scheduleError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditSchedule(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" /> Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-4 py-2 rounded-lg bg-emerald-750 hover:bg-emerald-800 text-white text-xs font-black tracking-wide transition flex items-center gap-1.5 cursor-pointer"
                >
                  {savingSchedule ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingSchedule ? "Menyimpan" : scheduleSuccess ? "Tersimpan!" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Row: Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">5 Setoran Sampah Terakhir</h2>
            <p className="text-[11px] text-slate-400 font-medium">Log timbangan berkala yang divalidasi staf petugas.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-flex items-center gap-1">
            <CircleCheck className="h-3.5 w-3.5" /> Live
          </span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada aktivitas transaksi sampah masuk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">Tanggal</th>
                  <th className="py-3 px-6">Nasabah</th>
                  <th className="py-3 px-6">Detail Setoran</th>
                  <th className="py-3 px-6 text-right">Nilai Rupiah</th>
                  <th className="py-3 px-6">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                      {new Date(tx.tanggal).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800 whitespace-nowrap">
                      {tx.nasabahNama}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {tx.items.map((it, idx) => {
                          const theme = getSubColor(it.jenisSampah);
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} mr-1 shrink-0`} />
                              {it.beratKg} kg {it.namaSampah}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-slate-800 whitespace-nowrap">
                      Rp {tx.total.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-500 font-medium flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-850 flex items-center justify-center text-[9px] font-extrabold font-mono">
                        {tx.inputByNama?.charAt(0) || "P"}
                      </div>
                      <span className="truncate max-w-[120px]">{tx.inputByNama}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fun Eco Fact footer banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 md:col-span-3 shadow-md">
          <div className="p-3 bg-slate-800 rounded-xl text-emerald-400 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-0.5">Penghargaan Lingkungan</h3>
            <p className="text-xs text-slate-300">
              Sampai hari ini, Bank Sampah Pondok Duta RT 06 telah mendaur ulang sampah anorganik senilai total jutaan Rupiah bersama partisipasi aktif warga. 🌿 Bumi hijau dimulai dari pemilahan sampah di rumah masing-masing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
