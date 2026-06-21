/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Search, 
  Trash2, 
  Plus, 
  Scale, 
  CircleAlert, 
  CheckCircle, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  Sparkles,
  ShoppingBag,
  MessageSquare,
  ArrowRight,
  CircleCheck,
  X
} from "lucide-react";
import { Nasabah, PriceListItem, TransactionItem } from "../types";

interface InputTransaksiProps {
  token: string;
}

interface NewBasketItem {
  jenisSampahId: string;
  beratKg: number;
}

export default function InputTransaksi({ token }: InputTransaksiProps) {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  
  // Searching/Selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null);

  // Basket editor state
  const [basket, setBasket] = useState<NewBasketItem[]>([]);
  const [currentJenisId, setCurrentJenisId] = useState("");
  const [currentBerat, setCurrentBerat] = useState<number | "">("");

  // Loading/process states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    txId: string;
    total: number;
    updatedBalance: number;
    whatsappMessage: string;
    nasabahNama: string;
    nomorHp: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch nasabah list
      const nRes = await fetch("/api/nasabah", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let nData = [];
      if (nRes.ok) {
        try {
          const json = await nRes.json();
          if (Array.isArray(json)) {
            nData = json;
          }
        } catch (e) {
          console.error("Gagal parse nasabah JSON", e);
        }
      }
      setNasabahList(nData);

      // Fetch active price list
      const pRes = await fetch("/api/price-list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let pData = [];
      if (pRes.ok) {
        try {
          const json = await pRes.json();
          if (Array.isArray(json)) {
            pData = json;
          }
        } catch (e) {
          console.error("Gagal parse price list JSON", e);
        }
      }
      setPriceList(pData);
      
      if (pData.length > 0) {
        setCurrentJenisId(pData[0].id);
      }
    } catch (err) {
      console.error("Error loading transaction data source:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Seeker function
  const filteredNasabah = searchQuery.trim() === "" || !Array.isArray(nasabahList)
    ? [] 
    : nasabahList.filter(n => {
        if (n.isActive === false) return false;
        const matchesName = n.nama && n.nama.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAddress = n.alamat && n.alamat.toLowerCase().includes(searchQuery.toLowerCase());
        return !!(matchesName || matchesAddress);
      });

  const handleSelectNasabah = (n: Nasabah) => {
    setSelectedNasabah(n);
    setSearchQuery("");
    // Clear basket
    setBasket([]);
  };

  const handleDeselectNasabah = () => {
    setSelectedNasabah(null);
    setBasket([]);
    setServerError(null);
  };

  const handleAddWeightIncrement = (val: number) => {
    setCurrentBerat(prev => {
      const current = prev === "" ? 0 : prev;
      return Number((current + val).toFixed(2));
    });
  };

  const handleAddBasketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJenisId || currentBerat === "" || currentBerat <= 0) {
      return;
    }

    // Check if item already exists in the basket to combine weight
    const existingIdx = basket.findIndex(item => item.jenisSampahId === currentJenisId);
    if (existingIdx !== -1) {
      const updated = [...basket];
      updated[existingIdx].beratKg = Number((updated[existingIdx].beratKg + Number(currentBerat)).toFixed(2));
      setBasket(updated);
    } else {
      setBasket([...basket, { jenisSampahId: currentJenisId, beratKg: Number(currentBerat) }]);
    }

    // Reset weights
    setCurrentBerat("");
  };

  const handleRemoveBasketItem = (idx: number) => {
    const updated = [...basket];
    updated.splice(idx, 1);
    setBasket(updated);
  };

  // Compute live subtotal/totals for preview
  const getBasketDetails = () => {
    let grandTotal = 0;
    const items = basket.map(bItem => {
      const matchesPrice = priceList.find(p => p.id === bItem.jenisSampahId);
      const name = matchesPrice?.namaSampah || "Sampah Lainnya";
      const harga = matchesPrice?.harga || 0;
      const subtotal = Math.round(bItem.beratKg * harga);
      grandTotal += subtotal;
      return {
        ...bItem,
        name,
        harga,
        subtotal
      };
    });
    return { items, grandTotal };
  };

  const { items: basketPreviewItems, grandTotal: basketGrandTotal } = getBasketDetails();

  const handleSaveTransaction = async () => {
    if (!selectedNasabah || basket.length === 0) return;
    
    setSaving(true);
    setServerError(null);

    // Build items payload
    const payloadItems = basket.map(b => ({
      jenisSampah: b.jenisSampahId,
      beratKg: b.beratKg
    }));

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nasabahId: selectedNasabah.id,
          items: payloadItems
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal mencatat transaksi.");
      }

      // Success payload received
      setSuccessDetails({
        txId: data.transaction.id,
        total: data.transaction.total,
        updatedBalance: data.updatedNasabah.saldo,
        whatsappMessage: data.simulatedNotification.message,
        nasabahNama: selectedNasabah.nama,
        nomorHp: selectedNasabah.nomorHp
      });

      // Clear layout state
      setSelectedNasabah(null);
      setBasket([]);
      setSearchQuery("");
      setShowSuccessModal(true);
      
      // Refresh database records in lists
      fetchData();
    } catch (err: any) {
      setServerError(err.message || "Kesalahan sambungan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header element */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Scale className="h-6 w-6 text-emerald-600" /> Weighing Station / Timbang Sampah
        </h1>
        <p className="text-sm text-slate-500">Mencatat setoran warga, mengukur berat sampah otomatis, dan menyinkronkan saldo.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Menghubungkan stasiun timbangan...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Column 1 & 2: Main workflow content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Nasabah */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 font-mono">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">1</span> 
                CARI & PILIH WARGA (NASABAH)
              </h2>

              {!selectedNasabah ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-emerald-500" />
                    </div>
                    <input
                      id="tx-nasabah-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama warga RT 06... (Ketik nama atau pilih cepat di bawah)"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-555 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Realtime dropdown list */}
                  {searchQuery.trim() !== "" && (
                    <div className="border border-slate-200 bg-white rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 overflow-hidden animate-fade-in relative z-10">
                      {filteredNasabah.length === 0 ? (
                        <div className="p-5 text-center text-xs text-slate-400 font-medium">
                          Warga dengan pencarian "<span className="font-bold text-slate-600">{searchQuery}</span>" tidak terdaftar.
                        </div>
                      ) : (
                        filteredNasabah.map(n => (
                          <div
                            id={`search-nasabah-suggestion-${n.id}`}
                            key={n.id}
                            onClick={() => handleSelectNasabah(n)}
                            className="p-3.5 flex justify-between items-center hover:bg-emerald-50/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xs font-extrabold font-sans">
                                {n.nama.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-800 leading-tight">{n.nama}</h4>
                                <span className="text-[10px] text-slate-400 mt-1 block font-medium font-sans">🏠 {n.alamat || "Alamat belum diinput"}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100">
                              PILIH
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Quick-select Resident Panel when no search text is active */}
                  {searchQuery.trim() === "" && nasabahList.length > 0 && (
                    <div className="pt-2 animate-fade-in space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                        PILIH CEPAT WARGA RT 06 ({nasabahList.length} Terdaftar):
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {nasabahList.map(n => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleSelectNasabah(n)}
                            className="p-2.5 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-250 border border-slate-100 rounded-xl flex items-center gap-2.5 text-left transition-all cursor-pointer group shadow-sm hover:shadow-xs"
                          >
                            <div className="h-7 w-7 shrink-0 bg-white text-emerald-800 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl flex items-center justify-center text-xs font-black transition-all shadow-sm">
                              {n.nama.charAt(0)}
                            </div>
                            <div className="truncate min-w-0 flex-1">
                              <span className="text-xs font-extrabold text-slate-800 block truncate group-hover:text-emerald-950 leading-tight">
                                {n.nama}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate mt-0.5 font-medium">
                                {n.alamat || "Alamat belum diinput"}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                    <CircleAlert className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Pilih dengan mengklik nama warga di atas, atau ketik kata kunci pencarian di kolom pencari.</span>
                  </div>
                </div>
              ) : (
                /* Selected customer summary card */
                <div className="p-4.5 bg-emerald-500/[0.07] rounded-2xl border-l-4 border-emerald-600 flex justify-between items-center animate-fade-in shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-600 rounded-xl text-white flex items-center justify-center font-black text-md shadow">
                      {selectedNasabah.nama.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800">{selectedNasabah.nama}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-450" /> {selectedNasabah.alamat || "Alamat belum diinput"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-455" /> {selectedNasabah.nomorHp || "Nomor HP belum diinput"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Saldo RT 06</span>
                      <span className="text-xs font-black text-slate-800">Rp {selectedNasabah.saldo.toLocaleString("id-ID")}</span>
                    </div>
                    <button
                      onClick={handleDeselectNasabah}
                      className="p-1 px-2.5 text-[10px] bg-white hover:bg-rose-50 border border-slate-200 rounded-lg text-rose-600 font-black cursor-pointer hover:border-rose-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Weight entries (Visible only when resident selected) */}
            {selectedNasabah && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-slide-up">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 font-mono">
                  <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">2</span> 
                  TIMBANG & INPUT ITEM SAMPAH
                </h2>

                <form onSubmit={handleAddBasketItem} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {/* Category choices */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-slate-650 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" /> Jenis Kategori Sampah
                    </label>
                    <select
                      id="trash-category-selector"
                      value={currentJenisId}
                      onChange={(e) => setCurrentJenisId(e.target.value)}
                      className="block w-full text-xs font-semibold py-2.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {(() => {
                        const kertasItems = priceList.filter(p => p.id.startsWith("kertas-") || p.id === "kertas");
                        const plastikItems = priceList.filter(p => p.id.startsWith("plastik-") || p.id === "plastik");
                        const logamItems = priceList.filter(p => p.id.startsWith("logam-") || p.id === "besi" || p.id === "aluminium");
                        const belahItems = priceList.filter(p => p.id.startsWith("belah-") || p.id === "kaca");
                        const minyakItems = priceList.filter(p => p.id.startsWith("minyak-") || p.id === "oli");
                        const lainItems = priceList.filter(p => !p.id.startsWith("kertas-") && !p.id.startsWith("plastik-") && !p.id.startsWith("logam-") && !p.id.startsWith("belah-") && !p.id.startsWith("minyak-") && p.id !== "kertas" && p.id !== "plastik" && p.id !== "besi" && p.id !== "aluminium" && p.id !== "kaca" && p.id !== "oli");

                        return (
                          <>
                            {kertasItems.length > 0 && (
                              <optgroup label="1. KERTAS">
                                {kertasItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.namaSampah} (Rp {p.harga.toLocaleString("id-ID")}/{p.satuan})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {plastikItems.length > 0 && (
                              <optgroup label="2. PLASTIK">
                                {plastikItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.namaSampah} (Rp {p.harga.toLocaleString("id-ID")}/{p.satuan})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {logamItems.length > 0 && (
                              <optgroup label="3. LOGAM">
                                {logamItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.namaSampah} (Rp {p.harga.toLocaleString("id-ID")}/{p.satuan})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {belahItems.length > 0 && (
                              <optgroup label="4. PECAH BELAH">
                                {belahItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.namaSampah} (Rp {p.harga.toLocaleString("id-ID")}/{p.satuan})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {lainItems.length > 0 && (
                              <optgroup label="5. LAIN-LAIN">
                                {lainItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.namaSampah} (Rp {p.harga.toLocaleString("id-ID")}/{p.satuan})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {minyakItems.length > 0 && (
                              <optgroup label="6. MINYAK">
                                {minyakItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.namaSampah} (Rp {p.harga.toLocaleString("id-ID")}/{p.satuan})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </div>

                  {/* Weight entered */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-650 flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-emerald-600" /> Berat Sampah (kg/l)
                    </label>
                    <input
                      id="trash-weight-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={currentBerat}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentBerat(val === "" ? "" : Number(val));
                      }}
                      placeholder="0.00"
                      className="block w-full text-xs font-extrabold py-2.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center font-mono"
                      required
                    />
                  </div>

                  {/* Input submit button */}
                  <div>
                    <button
                      id="add-item-to-basket-btn"
                      type="submit"
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 border-none text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah</span>
                    </button>
                  </div>

                  {/* Convenient Touch speed-dial increments */}
                  <div className="col-span-1 sm:col-span-4 mt-2 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-slate-450 uppercase font-mono mr-1">Speed Dial:</span>
                    {["+0.25", "+0.5", "+1.0", "+5.0", "+10.0"].map((inc, i) => {
                      const decimalVal = parseFloat(inc.replace("+", ""));
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAddWeightIncrement(decimalVal)}
                          className="py-1 px-3 border border-slate-200 hover:bg-white hover:border-emerald-300 rounded-lg text-xs font-bold text-slate-650 bg-slate-100 shrink-0 transition-all select-none focus:outline-none"
                        >
                          {inc} kg
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCurrentBerat("")}
                      className="py-1 px-3 border border-dashed border-rose-200 hover:bg-rose-50 text-rose-550 rounded-lg text-xs font-bold select-none focus:outline-none"
                    >
                      Cari Ulang / Reset
                    </button>
                  </div>
                </form>

                {/* Basket review list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-705 flex items-center gap-1.5 font-sans">
                    <ShoppingBag className="h-4 w-4 text-slate-500" /> KULAS KERANJANG TIMBANGAN ({basket.length} Item)
                  </h3>

                  {basket.length === 0 ? (
                    <div className="p-8 text-center text-slate-404 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs font-medium">
                      Keranjang sampah masih kosong. Silakan hitung item diatas.
                    </div>
                  ) : (
                    <div className="border border-slate-100 bg-white rounded-xl overflow-hidden shadow-sm">
                      <div className="divide-y divide-slate-100">
                        {basketPreviewItems.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-extrabold text-slate-800 leading-snug block">{item.name}</span>
                              <span className="text-[11px] text-slate-450 font-medium block mt-1 font-mono">
                                {item.beratKg} kg × Rp {item.harga.toLocaleString("id-ID")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="font-black text-slate-800 font-mono">
                                Rp {item.subtotal.toLocaleString("id-ID")}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBasketItem(idx)}
                                className="p-1 text-slate-4 w-4 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Hapus baris"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cumulative basket total */}
                      <div className="p-4 bg-slate-100/50 flex justify-between items-center border-t border-slate-150">
                        <span className="text-xs font-black text-slate-650">Total Setoran Sampah</span>
                        <span className="text-md font-extrabold text-emerald-800 font-mono">
                          Rp {basketGrandTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saving transaction errors */}
                {serverError && (
                  <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-md text-xs font-medium">
                    {serverError}
                  </div>
                )}

                {/* Confirm submit actions */}
                {basket.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setBasket([])}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                    >
                      Batal Setoran
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTransaction}
                      disabled={saving}
                      className="px-5 py-2.5 bg-emerald-750 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-emerald-900/10 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                      <span>{saving ? "Memproses simpan..." : "Simpan dan Timbang"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Guide Panel */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider font-mono">Buku Panduan Petugas</h3>
            
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-sans mt-2">
              <p>📍 <strong>Langkah Alur Lapangan:</strong></p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Warga menyerahkan kantong sampah di timbangan RT 06.</li>
                <li>Petugas mencari dan memverifikasi nama warga di stasiun pencarian (Langkah 1).</li>
                <li>Sortir sampah berdasarkan kategori (Plastik, Kertas, Kardus, dll.).</li>
                <li>Timbang masing-masing jenis sampah, ketik nilai kg, dan masukkan ke keranjang (Langkah 2).</li>
                <li>Pastikan subtotal Rupiah sesuai, lalu klik <strong>Simpan dan Timbang</strong>.</li>
              </ol>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-xl mt-4">
                <span className="block text-xs font-extrabold text-blue-800 flex items-center gap-1 mb-1">
                  <MessageSquare className="h-4 w-4" /> Notifikasi WhatsApp Otomatis
                </span>
                <p className="text-[11px] text-blue-900 leading-snug">
                  Setelah setoran sukses disimpan, sistem secara otomatis akan mengirimkan pesan WhatsApp (simulasi) berisi kalkulasi setoran dan penambahan saldo kepada warga secara seketika!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL: Simulated WhatsApp Dispatch Viewer */}
      {showSuccessModal && successDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-800 text-white animate-scale-up">
            
            {/* Top confirmation banner */}
            <div className="p-6 bg-[linear-gradient(135deg,#059669,#10b981)] text-white text-center flex flex-col items-center gap-2">
              <div className="h-12 w-12 bg-white text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-md font-extrabold tracking-tight">Setoran Sampah Berhasil Dicatat!</h3>
              <p className="text-xs text-emerald-100">Menyimpan data, menambah saldo tabungan warga, dan menyiarkan berita.</p>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Receipt short summary */}
              <div className="grid grid-cols-2 gap-4 text-center bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">Nilai Setoran</span>
                  <span className="text-md font-extrabold text-emerald-400">+ Rp {successDetails.total.toLocaleString("id-ID")}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">Total Saldo Baru</span>
                  <span className="text-md font-extrabold text-white">Rp {successDetails.updatedBalance.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Chat bubble simulator layout block */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">
                  Simulasi Notifikasi WhatsApp yang Dikirim:
                </span>
                
                {/* Simulated WhatsApp Phone Layout */}
                <div className="bg-[#efeae2] text-slate-900 rounded-2xl overflow-hidden border border-slate-205 shadow-inner">
                  {/* WhatsApp top simulation greenbar */}
                  <div className="bg-[#075e54] text-white p-3 px-4 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] font-sans">
                        BD
                      </div>
                      <div>
                        <span className="font-extrabold block">Duta Sampah RT 06</span>
                        <span className="text-[9px] text-emerald-100/80 leading-none block">Online</span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-[#25d366] font-bold">DISPATCHED</span>
                  </div>

                  {/* Message container background */}
                  <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat min-h-[140px] flex flex-col justify-end">
                    
                    {/* Customer chat bubble */}
                    <div className="bg-[#d9fdd3] p-3 rounded-2xl rounded-tr-none shadow shadow-slate-300 ml-auto max-w-[85%] relative">
                      <p className="text-xs text-slate-850 whitespace-pre-wrap leading-relaxed font-sans select-text">
                        {successDetails.whatsappMessage}
                      </p>
                      
                      {/* timestamp block */}
                      <span className="text-[9px] text-slate-401 flex items-center justify-end gap-1 mt-1 font-semibold">
                        {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        <span className="text-blue-500 font-bold leading-none">✓✓</span>
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex justify-center">
                <button
                  id="success-ok-btn"
                  onClick={() => setShowSuccessModal(false)}
                  className="py-3 px-8 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center gap-2 transition-all"
                >
                  <CircleCheck className="h-4 w-4" />
                  <span>Selesai & Tutup</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
