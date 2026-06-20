/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  Phone, 
  MapPin, 
  Wallet, 
  User, 
  ArrowLeft,
  X,
  History,
  TrendingUp,
  Scale
} from "lucide-react";
import { Nasabah, Transaction, Withdrawal } from "../types";

interface KelolaNasabahProps {
  token: string;
}

export default function KelolaNasabah({ token }: KelolaNasabahProps) {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeProfileTab, setActiveProfileTab] = useState<"setoran" | "penarikan">("setoran");

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);

  // Profile Drawer state
  const [profileViewNasabah, setProfileViewNasabah] = useState<Nasabah | null>(null);

  // New fields
  const [nama, setNama] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [saldoAwal, setSaldoAwal] = useState(0);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/nasabah", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = [];
      if (res.ok) {
        try {
          const json = await res.json();
          if (Array.isArray(json)) {
            data = json;
          }
        } catch (e) {
          console.error("Gagal parse nasabah JSON", e);
        }
      }
      setNasabahList(data);

      // fetch transactions for historic views
      const txRes = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let txData = [];
      if (txRes.ok) {
        try {
          const json = await txRes.json();
          if (Array.isArray(json)) {
            txData = json;
          }
        } catch (e) {
          console.error("Gagal parse transactions JSON", e);
        }
      }
      setAllTransactions(txData);

      // fetch withdrawals for profile view
      const wdRes = await fetch("/api/withdrawals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let wdData = [];
      if (wdRes.ok) {
        try {
          const json = await wdRes.json();
          if (Array.isArray(json)) {
            wdData = json;
          }
        } catch (e) {
          console.error("Gagal parse withdrawals JSON", e);
        }
      }
      setAllWithdrawals(wdData);
    } catch (err) {
      console.error("Error loading nasabah list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Search logic
  const filteredNasabah = !Array.isArray(nasabahList) ? [] : nasabahList.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.nama && n.nama.toLowerCase().includes(q)) ||
      (n.alamat && n.alamat.toLowerCase().includes(q)) ||
      (n.nomorHp && n.nomorHp.includes(q))
    );
  });

  const handleOpenAdd = () => {
    setNama("");
    setNomorHp("");
    setAlamat("");
    setSaldoAwal(0);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (n: Nasabah, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drawer opening
    setSelectedNasabah(n);
    setNama(n.nama);
    setNomorHp(n.nomorHp);
    setAlamat(n.alamat);
    setFormError(null);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    if (!nama || !nomorHp || !alamat) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/nasabah", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nama, nomorHp, alamat, saldoAwal })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal mendaftarkan nasabah.");
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Koneksi salah.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    if (!nama || !nomorHp || !alamat) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/nasabah/${selectedNasabah?.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nama, nomorHp, alamat })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah profil.");
      }

      setShowEditModal(false);
      // Update inline states
      if (profileViewNasabah && profileViewNasabah.id === selectedNasabah?.id) {
        setProfileViewNasabah({ ...profileViewNasabah, nama, nomorHp, alamat });
      }
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Koneksi salah.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drawer opening
    if (window.confirm(`Apakah Anda yakin ingin menghapus data nasabah '${name}'?\nSemua histori timbangan miliknya akan kehilangan referensi.`)) {
      try {
        const response = await fetch(`/api/nasabah/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message);
        }
        if (profileViewNasabah && profileViewNasabah.id === id) {
          setProfileViewNasabah(null);
        }
        fetchData();
      } catch (err: any) {
        alert(err.message || "Gagal menghapus.");
      }
    }
  };

  // Get filtered transaction history for selected customer
  const getCustomerTransactions = (nasabahId: string) => {
    return allTransactions.filter((tx) => tx.nasabahId === nasabahId);
  };

  const getCustomerWithdrawals = (nasabahId: string) => {
    return allWithdrawals.filter((wd) => wd.nasabahId === nasabahId);
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kelola Data Nasabah</h1>
          <p className="text-sm text-slate-500">Mendaftarkan warga RT 06, mengubah alamat, dan meninjau histori setoran.</p>
        </div>
        <button
          id="add-nasabah-modal-btn"
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-emerald-750 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Nasabah Baru</span>
        </button>
      </div>

      {/* Main Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Directory Search List */}
        <div className={`lg:col-span-2 space-y-4 ${profileViewNasabah ? "hidden lg:block" : "block"}`}>
          
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              id="nasabah-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama nasabah, nomor HP, atau alamat rumah..."
              className="w-full text-xs font-sans text-slate-705 placeholder-slate-400 bg-transparent border-none focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-xs text-slate-400 hover:text-slate-650 p-1 rounded font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Directory container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Buku Warga ({filteredNasabah.length})</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Sedang mengunduh buku warga...
              </div>
            ) : filteredNasabah.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Tidak ada nasabah yang cocok dengan kata kunci "{searchQuery}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNasabah.map((nasabah) => (
                  <div
                    id={`nasabah-row-${nasabah.id}`}
                    key={nasabah.id}
                    onClick={() => setProfileViewNasabah(nasabah)}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer ${
                      profileViewNasabah?.id === nasabah.id ? "bg-emerald-50/40 border-l-4 border-emerald-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-sans">
                        {nasabah.nama.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">{nasabah.nama}</h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-450 mt-1 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" /> {nasabah.alamat}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" /> {nasabah.nomorHp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Saldo box */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Saldo Anda</span>
                        <span className="text-sm font-black text-slate-800">
                          Rp {nasabah.saldo.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Edit controls accessible to Admin Penuh */}
                      <div className="flex gap-1 shrink-0">
                        <button
                          id={`edit-nasabah-btn-${nasabah.id}`}
                          onClick={(e) => handleOpenEdit(nasabah, e)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ubah Profil"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          id={`delete-nasabah-btn-${nasabah.id}`}
                          onClick={(e) => handleDelete(nasabah.id, nasabah.nama, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Nasabah"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side / Drawer View: Customer Individual Audits & Stats */}
        {profileViewNasabah && (
          <div className="lg:col-span-1 bg-white rounded-2xl border-2 border-slate-100 shadow-md overflow-hidden sticky top-20 animate-fade-in">
            {/* Drawer header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileViewNasabah(null)}
                  className="lg:hidden p-1 mr-1 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Profil Audit Nasabah</h2>
              </div>
              <button
                onClick={() => setProfileViewNasabah(null)}
                className="hidden lg:block p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Info Cards */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-[linear-gradient(135deg,#059669,#10b981)] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shrink-0 select-none">
                  {profileViewNasabah.nama.charAt(0)}
                </div>
                <div>
                  <h3 className="text-md font-extrabold text-slate-800">{profileViewNasabah.nama}</h3>
                  <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400" /> {profileViewNasabah.alamat}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400" /> {profileViewNasabah.nomorHp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 3 statistics block */}
              <div className="grid grid-cols-3 gap-2 text-center mt-3">
                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <Wallet className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Saldo</span>
                  <span className="text-xs font-black text-slate-800">Rp {profileViewNasabah.saldo.toLocaleString("id-ID")}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <Scale className="h-4 w-4 text-teal-600 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Berat</span>
                  <span className="text-xs font-black text-slate-800">{profileViewNasabah.totalBeratKg} kg</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <History className="h-4 w-4 text-slate-550 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Setor</span>
                  <span className="text-xs font-black text-slate-800">{profileViewNasabah.totalTransaksi} kali</span>
                </div>
              </div>
            </div>

            {/* Profile bottom: List of customer's historical transactions & withdrawals */}
            <div className="p-5 space-y-3">
              <div className="flex border-b border-slate-100 pb-2 mb-2 gap-4">
                <button
                  id="tab-profile-setoran"
                  onClick={() => setActiveProfileTab("setoran")}
                  className={`text-xs font-black uppercase tracking-wider pb-1.5 border-b-2 transition-all font-sans cursor-pointer ${
                    activeProfileTab === "setoran"
                      ? "border-emerald-600 text-emerald-800"
                      : "border-transparent text-slate-400 hover:text-slate-650"
                  }`}
                >
                  Setoran Timbangan ({getCustomerTransactions(profileViewNasabah.id).length})
                </button>
                <button
                  id="tab-profile-penarikan"
                  onClick={() => setActiveProfileTab("penarikan")}
                  className={`text-xs font-black uppercase tracking-wider pb-1.5 border-b-2 transition-all font-sans cursor-pointer ${
                    activeProfileTab === "penarikan"
                      ? "border-amber-600 text-amber-800"
                      : "border-transparent text-slate-400 hover:text-slate-650"
                  }`}
                >
                  Penarikan Saldo ({getCustomerWithdrawals(profileViewNasabah.id).length})
                </button>
              </div>

              {activeProfileTab === "setoran" ? (
                getCustomerTransactions(profileViewNasabah.id).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-404">
                    Belum ada catatan setoran sampah dari rumah ini.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {getCustomerTransactions(profileViewNasabah.id).map((tx) => (
                      <div key={tx.id} className="p-3 border border-slate-100 rounded-xl shadow-sm text-xs bg-white flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">
                            {new Date(tx.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })} {new Date(tx.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="font-extrabold text-emerald-800">
                            + Rp {tx.total.toLocaleString("id-ID")}
                          </span>
                        </div>
                        
                        {/* item list badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tx.items.map((it, idx) => (
                            <span key={idx} className="inline-block px-1.5 py-0.5 bg-slate-50 text-slate-650 rounded text-[9px] border border-slate-100">
                              {it.beratKg}kg {it.namaSampah}
                            </span>
                          ))}
                        </div>

                        <div className="text-[9px] text-slate-400 text-right mt-2 font-medium">
                          Diinput: {tx.inputByNama || "Petugas"} • ID: {tx.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                getCustomerWithdrawals(profileViewNasabah.id).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-404">
                    Belum ada riwayat penarikan dana tabungan oleh warga ini.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {getCustomerWithdrawals(profileViewNasabah.id).map((wd) => (
                      <div key={wd.id} className="p-3 border border-amber-100 rounded-xl shadow-sm text-xs bg-amber-50/15 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">
                            {new Date(wd.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })} {new Date(wd.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="font-extrabold text-amber-800">
                            - Rp {wd.jumlah.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="text-[9px] text-slate-405 mt-2 flex justify-between items-center">
                          <span>Via: Cash / Tunai Bank Sampah RT</span>
                          <span>Diinput: {wd.inputByNama || "Ketua RT"}</span>
                        </div>
                        <div className="text-[9px] text-slate-350 text-right mt-1 font-mono">
                          ID: {wd.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                ID NASABAH: {profileViewNasabah.id}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal: ADD NASABAH */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-md font-bold text-slate-800">Mendaftarkan Nasabah Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-200">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-850 text-xs rounded-r-md font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Nama Lengkap Kepala Keluarga</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: H. Maryono"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Nomor Handphone (WhatsApp)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Digunakan untuk mengirim simulasi berita cetak saldo.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Alamat Blok Rumah (RT 06)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Blok C No. 12"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Saldo Deposit Awal (Rupiah)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    value={saldoAwal}
                    onChange={(e) => setSaldoAwal(Number(e.target.value))}
                    placeholder="0"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-750 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Daftarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: EDIT NASABAH */}
      {showEditModal && selectedNasabah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-md font-bold text-slate-800">Ubah Profil Nasabah</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-slate-200">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-850 text-xs rounded-r-md font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Nama Lengkap Kepala Keluarga</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Nomor Handphone (WhatsApp)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Alamat Blok Rumah (RT 06)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-750 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
