/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Tag, 
  Plus, 
  Edit, 
  X, 
  Lock, 
  Unlock, 
  RotateCcw, 
  BadgeAlert,
  Save,
  Trash2,
  AlertCircle
} from "lucide-react";
import { PriceListItem, StaffRole } from "../types";

interface KelolaHargaProps {
  token: string;
  userRole: StaffRole;
}

export default function KelolaHarga({ token, userRole }: KelolaHargaProps) {
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PriceListItem | null>(null);

  // Form states
  const [namaSampah, setNamaSampah] = useState("");
  const [harga, setHarga] = useState(0);
  const [satuan, setSatuan] = useState("kg");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === StaffRole.ADMIN;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/price-list", {
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
          console.error("Gagal parse price list JSON", e);
        }
      }
      setPriceList(data);
    } catch (err) {
      console.error("Error loading price list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenAdd = () => {
    setNamaSampah("");
    setHarga(0);
    setSatuan("kg");
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: PriceListItem) => {
    setSelectedItem(item);
    setNamaSampah(item.namaSampah);
    setHarga(item.harga);
    setSatuan(item.satuan);
    setFormError(null);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    if (!namaSampah || harga === undefined || !satuan) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/price-list", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ namaSampah, harga: Number(harga), satuan })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal menambahkan jenis sampah.");
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Ada gangguan.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    if (!namaSampah || harga === undefined || !satuan) {
      setFormError("Semua field wajib diisi.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/price-list/${selectedItem?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ namaSampah, harga: Number(harga), satuan })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah harga.");
      }

      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Ada gangguan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-emerald-600" /> Daftar Price List Sampah
          </h1>
          <p className="text-sm text-slate-500">
            Daftar harga sisa anorganik per kilogram / per liter yang menjadi acuan tabungan warga.
          </p>
        </div>

        {isAdmin ? (
          <button
            id="add-category-price-btn"
            onClick={handleOpenAdd}
            className="py-2.5 px-4 bg-emerald-750 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Kategori Baru</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 py-2 px-3.5 rounded-xl inline-flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 shrink-0" /> Lihat Saja (Read-Only)
          </span>
        )}
      </div>

      {/* Core table content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-505 select-none font-mono">
          <span>KATEGORI SAMPAH DIAKTIFKAN</span>
          {isAdmin ? (
            <span className="text-emerald-700 font-sans flex items-center gap-1 text-[10px]">
              <Unlock className="h-3 w-3" /> Anda diizinkan mengubah harga
            </span>
          ) : (
            <span className="text-gray-550 font-sans flex items-center gap-1 text-[10px]">
              <Lock className="h-3 w-3" /> Harga dikunci oleh Admin RT
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">
            Sedang mengambil daftar harga sampah...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">No.</th>
                  <th className="py-3 px-6">Jenis Sampah</th>
                  <th className="py-3 px-6">Satuan</th>
                  <th className="py-3 px-6 text-right">Harga per Satuan</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {priceList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-4 px-6 font-black text-slate-800 leading-none">
                      {item.namaSampah}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-semibold">{item.satuan}</td>
                    <td className="py-4 px-6 text-right font-black text-slate-800 font-mono">
                      Rp {item.harga.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      {isAdmin ? (
                        <button
                          id={`edit-price-btn-${item.id}`}
                          onClick={() => handleOpenEdit(item)}
                          className="py-1 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 inline-flex items-center gap-1 transition-colors cursor-pointer focus:outline-none"
                        >
                          <Edit className="h-3.5 w-3.5 text-slate-400" /> Atur Harga
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-serif italic">No Permission</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warnings & Help banners */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed font-sans">
          <p className="font-bold mb-1">Pemberitahuan Audit Harga Semut:</p>
          Perubahan harga sampah tidak merusak atau mencederai data akumulasi transaksi historis warga yang telah lalu. Setiap transaksi yang telah tersimpan mengunci harga sisa per kilogram/liter secara permanen pada saat transaksi diinput.
        </div>
      </div>

      {/* 1. Modal: ADD CATEGORY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Tambah Kategori Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-slate-200">
                <X className="h-4 w-4 text-slate-450" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r-md font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Nama Jenis Sampah</label>
                <input
                  type="text"
                  required
                  value={namaSampah}
                  onChange={(e) => setNamaSampah(e.target.value)}
                  placeholder="Contoh: Plastik Bening Lembaran"
                  className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Harga (Rupiah)</label>
                  <input
                    type="number"
                    required
                    value={harga}
                    onChange={(e) => setHarga(Number(e.target.value))}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-extrabold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Satuan</label>
                  <select
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="liter">liter</option>
                    <option value="pcs">pcs (Butir)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-emerald-750 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: EDIT CATEGORY */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Atur Formula Harga</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-slate-200">
                <X className="h-4 w-4 text-slate-455" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r-md font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Nama Jenis Sampah</label>
                <input
                  type="text"
                  required
                  value={namaSampah}
                  onChange={(e) => setNamaSampah(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Harga Baru (Rupiah)</label>
                  <input
                    type="number"
                    required
                    value={harga}
                    onChange={(e) => setHarga(Number(e.target.value))}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-extrabold focus:outline-none font-mono text-emerald-800 bg-emerald-50/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Satuan</label>
                  <input
                    type="text"
                    disabled
                    value={satuan}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-emerald-750 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  {saving ? "Mematangkan..." : "Ubah Harga"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
