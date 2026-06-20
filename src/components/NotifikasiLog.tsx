/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  MessageSquareCode, 
  Search, 
  Send, 
  Phone, 
  User, 
  Clock, 
  RefreshCw,
  MessageSquareX
} from "lucide-react";
import { NotificationLog } from "../types";

interface NotifikasiLogProps {
  token: string;
}

export default function NotifikasiLog({ token }: NotifikasiLogProps) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/logs", {
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
          console.error("Gagal parse notifications JSON", e);
        }
      }
      setLogs(data);
    } catch (err) {
      console.error("Error loading notifications feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Seeker filter
  const filteredLogs = !Array.isArray(logs) ? [] : logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.nasabahNama.toLowerCase().includes(q) ||
      log.nomorHp.includes(q) ||
      log.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquareCode className="h-6 w-6 text-emerald-600" /> Log Simulasi Notifikasi WA
          </h1>
          <p className="text-sm text-slate-500 font-sans">
            Menyimak semua rekaman siaran saldo dan struk timbangan digital yang diedarkan ke warga Pondok Duta.
          </p>
        </div>
        <button
          id="refresh-notification-logs-btn"
          onClick={fetchData}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold font-sans text-slate-600 inline-flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Sinkron Saluran
        </button>
      </div>

      {/* Seeker filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          id="notif-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama warga, nomor HP, atau isi pesan template..."
          className="w-full text-xs font-sans text-slate-705 placeholder-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      {/* Logs container list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Menghubungkan jalur log WhatsApp...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-150 flex flex-col items-center justify-center gap-2">
          <MessageSquareX className="h-10 w-10 text-slate-350" />
          <h3 className="text-xs font-bold text-slate-650">Log Notifikasi Kosong</h3>
          <p className="text-[11px] text-slate-450">Belum ada struk timbangan sampah yang disiarkan, atau filter "{searchQuery}" nihil.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100"
            >
              {/* Left hand: Details metadata */}
              <div className="md:w-64 p-5 bg-slate-50/60 shrink-0 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{log.nasabahNama}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-455 font-mono mb-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{log.nomorHp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-450 font-sans">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2 md:pt-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    <Send className="h-2 w-2 mr-1 animate-pulse" /> Terkirim Simulation
                  </span>
                </div>
              </div>

              {/* Right hand: Text layout */}
              <div className="flex-1 p-5 bg-white relative">
                {/* Simulated message layout bubble */}
                <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl text-xs text-slate-705 leading-relaxed font-sans whitespace-pre-wrap select-text selection:bg-emerald-150">
                  {log.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
