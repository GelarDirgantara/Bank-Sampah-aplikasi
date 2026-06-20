/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Banknote, 
  Search, 
  CircleAlert, 
  MapPin, 
  Phone, 
  Clock, 
  Undo, 
  User, 
  CheckCircle2, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight 
} from "lucide-react";
import { Nasabah, Withdrawal } from "../types";

interface PenarikanSaldoProps {
  token: string;
  isAdmin: boolean;
}

export default function PenarikanSaldo({ token, isAdmin }: PenarikanSaldoProps) {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);
  const [jumlah, setJumlah] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load citizens (nasabah), withdrawals, and stats
  const [stats, setStats] = useState({
    totalSaldoTerkini: 0,
    totalSaldoDitarik: 0,
    totalSaldoKeseluruhan: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch citizens
        const nasRes = await fetch("/api/nasabah", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (nasRes.ok) {
          const list = await nasRes.json();
          if (Array.isArray(list)) {
            setNasabahList(list);
          }
        }

        // Fetch withdrawals
        const wdRes = await fetch("/api/withdrawals", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (wdRes.ok) {
          const list = await wdRes.json();
          if (Array.isArray(list)) {
            setWithdrawals(list);
          }
        }

        // Fetch stats
        const statsRes = await fetch("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statData = await statsRes.json();
          setStats({
            totalSaldoTerkini: statData.totalSaldoTerkini || 0,
            totalSaldoDitarik: statData.totalSaldoDitarik || 0,
            totalSaldoKeseluruhan: statData.totalSaldoKeseluruhan || 0
          });
        }
      } catch (err) {
        console.error("Gagal memuat data penarikan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, refreshTrigger]);

  // Seeker function for citizen lookup
  const filteredNasabah = searchQuery.trim() === "" || !Array.isArray(nasabahList)
    ? []
    : nasabahList.filter(n => {
        const nameMatch = n.nama && n.nama.toLowerCase().includes(searchQuery.toLowerCase());
        const addressMatch = n.alamat && n.alamat.toLowerCase().includes(searchQuery.toLowerCase());
        return !!(nameMatch || addressMatch);
      });

  const handleSelectNasabah = (n: Nasabah) => {
    setSelectedNasabah(n);
    setJumlah("");
    setSearchQuery("");
    setError(null);
    setSuccessMsg(null);
  };

  const handleDeselectNasabah = () => {
    setSelectedNasabah(null);
    setJumlah("");
    setError(null);
  };

  // Preset amounts helper
  const presetAmounts = [10000, 20000, 50000, 100000];

  const handleApplyPreset = (amt: number) => {
    if (!selectedNasabah) return;
    if (amt > selectedNasabah.saldo) {
      setError(`Jumlah Rp ${amt.toLocaleString("id-ID")} melebihi saldo warga.`);
      setJumlah(selectedNasabah.saldo.toString());
    } else {
      setError(null);
      setJumlah(amt.toString());
    }
  };

  const handleApplyAll = () => {
    if (!selectedNasabah) return;
    setError(null);
    setJumlah(selectedNasabah.saldo.toString());
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNasabah) return;

    const amt = Math.round(Number(jumlah));
    if (isNaN(amt) || amt <= 0) {
      setError("Jumlah penarikan harus berupa angka positif.");
      return;
    }

    if (amt > selectedNasabah.saldo) {
      setError(`Saldo tidak mencukupi. Saldo saat ini: Rp ${selectedNasabah.saldo.toLocaleString("id-ID")}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nasabahId: selectedNasabah.id,
          jumlah: amt
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal memproses penarikan saldo.");
      } else {
        setSuccessMsg(`Penarikan berhasil dicatat! Rp ${amt.toLocaleString("id-ID")} berhasil ditarik oleh ${selectedNasabah.nama}.`);
        setSelectedNasabah(data.updatedNasabah);
        setJumlah("");
        setRefreshTrigger(prev => prev + 1);
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMsg(null);
        }, 5000);
      }
    } catch (err) {
      console.error("Error submitting withdrawal:", err);
      setError("Terjadi kesalahan koneksi internet atau server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWithdrawal = async (id: string, citizenName: string, amt: number) => {
    if (!window.confirm(`Batalkan penarikan tunai Rp ${amt.toLocaleString("id-ID")} untuk ${citizenName} dan kembalikan saldonya?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/withdrawals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
        if (selectedNasabah) {
          // Refresh selected nasabah balance
          const updatedNasListRes = await fetch("/api/nasabah", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (updatedNasListRes.ok) {
            const list = await updatedNasListRes.json();
            const currentSelIdx = list.find((n: Nasabah) => n.id === selectedNasabah.id);
            if (currentSelIdx) setSelectedNasabah(currentSelIdx);
          }
        }
        alert(data.message || "Penarikan berhasil dibatalkan.");
      } else {
        alert(data.message || "Gagal membatalkan penarikan.");
      }
    } catch (err) {
      console.error("Error deleting withdrawal:", err);
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const filteredWithdrawals = !Array.isArray(withdrawals) ? [] : withdrawals.filter(w => {
    return w.nasabahNama.toLowerCase().includes(historyQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Banknote className="h-6 w-6 text-emerald-600" /> Penarikan Saldo RT 06
        </h1>
        <p className="text-sm text-slate-500 font-sans mt-0.5">
          Proses penarikan tunai saldo tabungan sampah warga RT 06 secara resmi, instan, aman, dan tercatat otomatis.
        </p>
      </div>

      {/* Grid of Aggregate Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-sm border border-emerald-600/10 relative overflow-hidden group">
          <div className="absolute right-3 bottom-0 text-white/5 group-hover:text-white/10 transition-colors">
            <Wallet className="h-32 w-32 -mr-4 -mb-4 shrink-0 transition-transform duration-500 group-hover:scale-110" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100 font-sans">
            Total Sisa Saldo RT 06 (Terkini)
          </p>
          <p className="text-2xl font-black leading-tight mt-1 font-sans">
            Rp {stats.totalSaldoTerkini.toLocaleString("id-ID")}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-100 bg-white/10 py-1 px-2.5 rounded-lg w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
            <span>Aktif di tabungan saat ini</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute right-3 bottom-0 text-slate-50 group-hover:text-slate-100 transition-colors">
            <ArrowUpRight className="h-32 w-32 -mr-4 -mb-4 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">
              Total Saldo yang Sudah Ditarik
            </p>
            <p className="text-2xl font-black text-slate-800 leading-tight mt-1 font-sans">
              Rp {stats.totalSaldoDitarik.toLocaleString("id-ID")}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-3 font-sans">
            Akumulasi penarikan warga keseluruhan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute right-3 bottom-0 text-slate-50 group-hover:text-slate-100 transition-colors">
            <TrendingUp className="h-32 w-32 -mr-4 -mb-4 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">
              Total Saldo Keseluruhan (Hasil Sampah)
            </p>
            <p className="text-2xl font-black text-slate-800 leading-tight mt-1 font-sans">
              Rp {stats.totalSaldoKeseluruhan.toLocaleString("id-ID")}
            </p>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-3 font-sans flex items-center gap-1">
            <span>✓</span> Sisa Saldo + Total Penarikan Warga
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Hand: Input/Select Form Column */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm lg:col-span-5 space-y-5">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3 block">
            FORM PENARIKAN SALDO TUNAI
          </h2>

          {!selectedNasabah ? (
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Langkah 1: Pilih Warga (Nasabah)
              </span>

              {/* Search Field */}
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-emerald-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama warga RT 06..."
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Filter Suggestion List */}
              {searchQuery.trim() !== "" && (
                <div className="border border-slate-200 bg-white rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 overflow-hidden relative z-10 animate-fade-in">
                  {filteredNasabah.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400 font-medium font-sans">
                      Warga dengan pencarian "{searchQuery}" tidak terdaftar.
                    </div>
                  ) : (
                    filteredNasabah.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNasabah(n)}
                        className="p-3.5 flex justify-between items-center hover:bg-emerald-50/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xs font-extrabold">
                            {n.nama.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-850 leading-tight">{n.nama}</h4>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">🏠 {n.alamat || "Alamat belum diinput"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-100">
                          PILIH
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Quick Select Panel when idle */}
              {searchQuery.trim() === "" && nasabahList.length > 0 && (
                <div className="pt-1 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                    PILIH CEPAT WARGA:
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {nasabahList.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleSelectNasabah(n)}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-250 border border-slate-100 rounded-xl flex items-center gap-2 text-left transition-all cursor-pointer group"
                      >
                        <div className="h-7 w-7 bg-white shrink-0 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white rounded-lg flex items-center justify-center text-xs font-black transition-all">
                          {n.nama.charAt(0)}
                        </div>
                        <div className="truncate min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-slate-800 block truncate leading-tight group-hover:text-emerald-950">
                            {n.nama}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                            Rp {n.saldo.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 leading-normal">
                <CircleAlert className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Silakan cari atau pilih warga di atas terlebih dahulu untuk memproses transaksi pencairan saldo tabungan sampahnya.</span>
              </div>
            </div>
          ) : (
            /* Selected Citizen Panel & Amount Form */
            <form onSubmit={handleSubmitWithdrawal} className="space-y-4 animate-fade-in animate-duration-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Langkah 2: Tentukan Jumlah Penarikan
              </span>

              {/* Selected Resident Card summary */}
              <div className="p-4 bg-emerald-500/[0.04] rounded-2xl border-l-4 border-emerald-600 flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 bg-emerald-600 rounded-xl text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {selectedNasabah.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-850 leading-tight">{selectedNasabah.nama}</h3>
                    <div className="flex flex-col text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                      <span className="flex items-center gap-1 font-sans">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {selectedNasabah.alamat || "Alamat belum diinput"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Saldo Terkini</span>
                    <span className="text-xs font-black text-slate-800">Rp {selectedNasabah.saldo.toLocaleString("id-ID")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeselectNasabah}
                    className="p-1 px-2 text-[10px] bg-white hover:bg-rose-50 border border-slate-200 rounded-lg text-rose-600 font-extrabold cursor-pointer hover:border-rose-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Warning/Success Alert inside form */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl/90 text-[11px] font-semibold text-rose-800 flex items-center gap-2 leading-snug animate-fade-in">
                  <CircleAlert className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl/90 text-[11px] font-bold text-emerald-800 flex items-center gap-2 leading-snug animate-fade-in shadow-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 font-sans block">
                  Jumlah Penarikan (Cash Out):
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 font-sans">Rp</span>
                  </div>
                  <input
                    type="number"
                    required
                    value={jumlah}
                    onChange={(e) => {
                      setError(null);
                      setJumlah(e.target.value);
                    }}
                    placeholder="Contoh: 50000"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-250 rounded-xl text-xs font-bold font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 bg-white"
                  />
                </div>
              </div>

              {/* Presets and All button */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PILIH CEPAT JUMLAH:</span>
                <div className="flex flex-wrap gap-1.5">
                  {presetAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={selectedNasabah.saldo < amt}
                      onClick={() => handleApplyPreset(amt)}
                      className={`p-1.5 px-2.5 rounded-lg text-[10px] font-black cursor-pointer transition-all border ${
                        selectedNasabah.saldo < amt 
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      Rp {amt.toLocaleString("id-ID")}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={selectedNasabah.saldo <= 0}
                    onClick={handleApplyAll}
                    className={`p-1.5 px-3 rounded-lg text-[10px] font-black cursor-pointer transition-all border ${
                      selectedNasabah.saldo <= 0
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                    }`}
                  >
                    Tarik Semua ({selectedNasabah.saldo <= 0 ? "Rp 0" : `Rp ${selectedNasabah.saldo.toLocaleString("id-ID")}`})
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || !jumlah || Number(jumlah) <= 0 || Number(jumlah) > selectedNasabah.saldo}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold text-white text-center transition-all shadow shadow-emerald-600/10 cursor-pointer ${
                  submitting || !jumlah || Number(jumlah) <= 0 || Number(jumlah) > selectedNasabah.saldo
                    ? "bg-slate-300 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 active:translate-y-0.5"
                }`}
              >
                {submitting ? "Memproses Transaksi..." : "Konfirmasi Tarik Tunai Saldo"}
              </button>
            </form>
          )}
        </div>

        {/* Right Hand: History List Column */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide block">
              HISTORY PENARIKAN SALDO KESELURUHAN ({filteredWithdrawals.length} Transaksi)
            </h2>
            
            {/* Direct match query */}
            <div className="relative rounded-lg shrink-0 w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Cari nama warga..."
                className="block w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-450"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-sans">
              Menghubungkan ke server data penarikan...
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Clock className="h-8 w-8 text-slate-300" />
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-normal">Log Penarikan Kosong</h3>
              <p className="text-[10px] text-slate-400 leading-normal max-w-sm">
                Belum ada kas tunai warga yang ditarik, atau tidak ada pencarian warga yang cocok dengan "{historyQuery}".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th scope="col" className="px-3 py-2.5 text-left text-[9px] font-black text-slate-450 uppercase tracking-wider">Tanggal</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[9px] font-black text-slate-450 uppercase tracking-wider">Warga RT 06</th>
                    <th scope="col" className="px-3 py-2.5 text-right text-[9px] font-black text-slate-450 uppercase tracking-wider">Jumlah ditarik</th>
                    <th scope="col" className="px-3 py-2.5 text-left text-[9px] font-black text-slate-450 uppercase tracking-wider">Petugas</th>
                    <th scope="col" className="px-3 py-2.5 text-center text-[9px] font-black text-slate-450 uppercase tracking-wider">Status</th>
                    {isAdmin && <th scope="col" className="px-2 py-2.5 text-center text-[9px] font-black text-slate-450 uppercase tracking-wider">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="px-3 py-3 text-[10px] font-medium text-slate-450 whitespace-nowrap">
                        {new Date(w.tanggal).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs font-black text-slate-800">{w.nasabahNama}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">ID: {w.nasabahId}</span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-xs font-black text-emerald-800 bg-emerald-50/[0.15]">
                        Rp {w.jumlah.toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-3 text-[10px] text-slate-500 whitespace-nowrap">
                        {w.inputByNama || "Petugas Timbang"}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800">
                          ✓ Sukses WA
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-2 py-3 text-center whitespace-nowrap/80">
                          <button
                            type="button"
                            onClick={() => handleDeleteWithdrawal(w.id, w.nasabahNama, w.jumlah)}
                            title="Batalkan penarikan& kembalikan saldo"
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-500 border border-transparent hover:border-rose-600 rounded-lg cursor-pointer transition-all"
                          >
                            <Undo className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
