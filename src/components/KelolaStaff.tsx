/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  UserCheck, 
  X, 
  Key, 
  User, 
  UserCog, 
  AlertTriangle,
  Lock
} from "lucide-react";
import { Staff, StaffRole } from "../types";

interface KelolaStaffProps {
  token: string;
}

export default function KelolaStaff({ token }: KelolaStaffProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<StaffRole>(StaffRole.PETUGAS);
  const [password, setPassword] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/staff", {
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
          console.error("Gagal parse staff JSON", e);
        }
      }
      setStaffList(data);
    } catch (err) {
      console.error("Error loading staff accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenAdd = () => {
    setUsername("");
    setNama("");
    setRole(StaffRole.PETUGAS);
    setPassword("");
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    if (!username || !nama || !role || !password) {
      setFormError("Semua kolom isian wajib diisi.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, nama, role, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat akun.");
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Gagal sambungan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun petugas '${name}'?`)) {
      try {
        const response = await fetch(`/api/staff/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message);
        }

        fetchData();
      } catch (err: any) {
        alert(err.message || "Gagal menghapus.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <UserCog className="h-6 w-6 text-emerald-600" /> Kelola Akun Petugas Staf
          </h1>
          <p className="text-sm text-slate-500 font-sans">
            Membatasi hak akses aplikasi timbangan RT 06, memilah Admin Penuh atau Petugas Timbang.
          </p>
        </div>
        <button
          id="add-staff-modal-btn"
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-emerald-750 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Staff Baru</span>
        </button>
      </div>

      {/* Staff lists container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500 font-mono">
          <span>AKUN PETUGAS DAN ADMIN TERDAFTAR</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">
            Sedang mengambil daftar kredensial staf...
          </div>
        ) : (
          <div className="divide-y divide-slate-105 font-sans">
            {staffList.map((st) => {
              const isAdmin = st.role === StaffRole.ADMIN;
              return (
                <div key={st.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center ${
                      isAdmin ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 leading-none">
                        {st.nama}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          isAdmin ? "bg-emerald-100 text-emerald-805" : "bg-blue-100 text-blue-805"
                        }`}>
                          {isAdmin ? "Admin Penuh" : "Petugas"}
                        </span>
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-404 mt-2">
                        <span className="font-mono">User: @{st.username}</span>
                        <span>•</span>
                        <span>Terdaftar: {new Date(st.createdAt).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  {/* prevent deleting initial seed accounts inside safe layout */}
                  <div className="flex items-center">
                    <button
                      id={`delete-staff-btn-${st.id}`}
                      onClick={() => handleDeleteStaff(st.id, st.nama)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors cursor-pointer"
                      title="Hapus Akun Staf"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-505 p-4 rounded-xl flex gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-805 leading-relaxed">
          <p className="font-bold mb-1">Mengenal Hak Akses Peran:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Admin Penuh:</strong> Memegang hak penuh mendaftarkan warga, mengupdate pricelist harga sampah, membatalkan transaksi, dan memelihara kredensial tim petugas.</li>
            <li><strong>Petugas Timbang:</strong> Akses murni operasional lapangan untuk mencari warga, memasukkan timbangan sampah harian, dan mengecek daftar harga. Petugas dilarang keras mengubah profil warga atau memanipulasi pricelist.</li>
          </ul>
        </div>
      </div>

      {/* 1. Modal: ADD STAFF */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Daftarkan Petugas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-slate-200">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 font-sans">
              {formError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r-md font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Nama Lengkap Petugas</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Agus Santoso"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Username Login</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: agus04"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Kata Sandi (Password)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kunci masuk"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Tingkatan Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none"
                >
                  <option value={StaffRole.PETUGAS}>Petugas (Akses Timbangan + Baca Saja)</option>
                  <option value={StaffRole.ADMIN}>Admin Penuh (Hak Akses Penuh)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-505 rounded-lg text-xs font-bold hover:bg-slate-52 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-emerald-750 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  {saving ? "Mendaftarkan..." : "Daftarkan Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
