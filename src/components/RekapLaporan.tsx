import React, { useState, useEffect } from "react";
import { 
  Printer, 
  Download, 
  Calendar, 
  Search, 
  Trash2, 
  TrendingUp, 
  FileSpreadsheet, 
  ShoppingBag,
  User,
  MapPin,
  Clock,
  ArrowRightLeft,
  Wallet
} from "lucide-react";
import { Transaction, Nasabah, Withdrawal } from "../types";
import Logo from "./Logo";

// Helper to format currency
const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(value);
};

// Helper for beautiful Indonesian date format (e.g. "Sabtu, 20 Juni 2026")
const formatIndonesianDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (e) {
    return dateString;
  }
};

// Simple helper to get short Indonesian date
const formatShortIndoDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  } catch (e) {
    return dateString;
  }
};

interface RekapLaporanProps {
  token: string;
}

export default function RekapLaporan({ token }: RekapLaporanProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<"setoran" | "penarikan-ledger">("setoran");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    // Current month start
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [nasabahMap, setNasabahMap] = useState<Record<string, Nasabah>>({});

  useEffect(() => {
    loadReportData();
  }, [token]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Fetch all transactions
      const txRes = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let txData = [];
      if (txRes.ok) {
        const json = await txRes.json();
        if (Array.isArray(json)) {
          txData = json;
        }
      }
      setTransactions(txData);

      // Fetch all withdrawals
      const wdRes = await fetch("/api/withdrawals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let wdData = [];
      if (wdRes.ok) {
        const json = await wdRes.json();
        if (Array.isArray(json)) {
          wdData = json;
        }
      }
      setWithdrawals(wdData);

      // Fetch nasabah to fetch addresses
      const nRes = await fetch("/api/nasabah", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (nRes.ok) {
        const nData = await nRes.json();
        if (Array.isArray(nData)) {
          const mapping: Record<string, Nasabah> = {};
          nData.forEach((n) => {
            mapping[n.id] = n;
          });
          setNasabahMap(mapping);
        }
      }
    } catch (err) {
      console.error("Gagal memuat rekap data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on date range & search query
  const filteredTx = transactions.filter((tx) => {
    // Date filter
    const txDateOnly = tx.tanggal.split("T")[0];
    const isWithinDate = txDateOnly >= startDate && txDateOnly <= endDate;

    // Search filter (Nasabah Name or Inputter Name or ID)
    const matchesSearch = searchQuery.trim() === "" ||
      tx.nasabahNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.inputByNama && tx.inputByNama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (nasabahMap[tx.nasabahId]?.alamat && nasabahMap[tx.nasabahId].alamat.toLowerCase().includes(searchQuery.toLowerCase()));

    return isWithinDate && matchesSearch;
  });

  // Filter withdrawals based on date range & search query
  const filteredWd = withdrawals.filter((wd) => {
    const wdDateOnly = wd.tanggal.split("T")[0];
    const isWithinDate = wdDateOnly >= startDate && wdDateOnly <= endDate;

    const matchesSearch = searchQuery.trim() === "" ||
      wd.nasabahNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wd.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wd.inputByNama && wd.inputByNama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (nasabahMap[wd.nasabahId]?.alamat && nasabahMap[wd.nasabahId].alamat.toLowerCase().includes(searchQuery.toLowerCase()));

    return isWithinDate && matchesSearch;
  });

  const totalWithdrawalFiltered = filteredWd.reduce((sum, wd) => sum + wd.jumlah, 0);

  // Group withdrawals
  const groupedWdByDate: Record<string, Withdrawal[]> = {};
  filteredWd.forEach((wd) => {
    const wdDate = wd.tanggal.split("T")[0];
    if (!groupedWdByDate[wdDate]) {
      groupedWdByDate[wdDate] = [];
    }
    groupedWdByDate[wdDate].push(wd);
  });

  // Combine dates from both sets
  const allEncounteredDates = Array.from(new Set([
    ...filteredTx.map(tx => tx.tanggal.split("T")[0]),
    ...filteredWd.map(wd => wd.tanggal.split("T")[0])
  ])).sort((a, b) => b.localeCompare(a));

  // Calculate stats based on filtered data
  const totalWeightFiltered = filteredTx.reduce((sum, tx) => {
    const txWeight = tx.items.reduce((itemSum, item) => itemSum + item.beratKg, 0);
    return sum + txWeight;
  }, 0);

  const totalPayoutFiltered = filteredTx.reduce((sum, tx) => sum + tx.total, 0);
  const totalUniqueWargaFiltered = new Set(filteredTx.map(tx => tx.nasabahId)).size;

  // Group transactions by date
  const groupedByDate: Record<string, Transaction[]> = {};
  filteredTx.forEach((tx) => {
    const txDate = tx.tanggal.split("T")[0];
    if (!groupedByDate[txDate]) {
      groupedByDate[txDate] = [];
    }
    groupedByDate[txDate].push(tx);
  });

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Compute materials breakdown for a specific date
  const getMaterialBreakdownForDate = (txs: Transaction[]) => {
    const breakdown: Record<string, { weight: number; label: string; unit: string }> = {};
    txs.forEach((tx) => {
      tx.items.forEach((item) => {
        const materialId = item.jenisSampah;
        const cleanName = item.namaSampah || materialId;
        const weightSymbol = cleanName.toLowerCase().includes("oli") ? "liter" : "kg";

        if (!breakdown[materialId]) {
          breakdown[materialId] = { weight: 0, label: cleanName, unit: weightSymbol };
        }
        breakdown[materialId].weight += item.beratKg;
      });
    });
    return Object.values(breakdown);
  };

  // Export to Premium XML Sheet (Natively opens in Excel with beautiful gridlines and table colors)
  const handleExportExcelPremium = () => {
    if (activeTab === "setoran") {
      if (filteredTx.length === 0) {
        alert("Tidak ada data setoran dalam range filter untuk diunduh.");
        return;
      }

      // Generate HTML designed for Excel with borders, backgrounds, and specific table column layout
      let htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Laporan Setoran Sampah</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; }
    th { background-color: #065f46; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 12px 10px; font-size: 13px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; font-family: Arial, sans-serif; vertical-align: top; }
    .title-banner { font-size: 16px; font-weight: bold; color: #014737; padding: 10px 0 5px 0; }
    .info-text { font-size: 11px; color: #475569; padding-bottom: 15px; font-style: italic; }
    .num { text-align: right; }
    .text-center { text-align: center; }
    .total-row { font-weight: bold; background-color: #ecfdf5; }
    .total-text { font-weight: bold; color: #065f46; font-size: 13px; }
    .bg-zebra { background-color: #f8fafc; }
    .badge { font-family: monospace; font-size: 10px; padding: 2px 5px; background-color: #f1f5f9; border-radius: 4px; color: #475569; }
  </style>
</head>
<body>
  <div class="title-banner">LAPORAN DETAIL REKAPITULASI TIMBANGAN & SETORAN WARGA RT 06</div>
  <div class="info-text">
    Periode Pencarian: <strong>${formatShortIndoDate(startDate)} sampai ${formatShortIndoDate(endDate)}</strong><br>
    Unit Kerja: <strong>Grup No. 23 Kecamatan • RT 06 RW 14 Pondok Duta Depok</strong><br>
    Diunduh Pada: <strong>${new Date().toLocaleDateString("id-ID")} • Oleh: Petugas Aplikasi</strong>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 120px; background-color: #065f46; color: white;">ID Transaksi</th>
        <th style="width: 150px; background-color: #065f46; color: white;">Hari, Tanggal</th>
        <th style="width: 180px; background-color: #065f46; color: white;">Nama Nasabah / Warga</th>
        <th style="width: 180px; background-color: #065f46; color: white;">Alamat Rumah / Blok</th>
        <th style="width: 350px; background-color: #065f46; color: white;">Rincian Berat & Timbangan Sampah</th>
        <th style="width: 110px; background-color: #065f46; color: white; text-align: right;">Total Berat (Kg/Ltr)</th>
        <th style="width: 120px; background-color: #065f46; color: white; text-align: right;">Total Nilai (Rp)</th>
        <th style="width: 120px; background-color: #065f46; color: white;">Petugas Timbang</th>
      </tr>
    </thead>
    <tbody>
`;

      let totalOverallWeight = 0;
      let totalOverallAmount = 0;

      filteredTx.forEach((tx, idx) => {
        const formattedDate = formatIndonesianDate(tx.tanggal.split("T")[0]);
        const formattedTime = new Date(tx.tanggal).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const nasabahAlamat = nasabahMap[tx.nasabahId]?.alamat || "-";
        
        const itemsDetail = tx.items.map(item => {
          const unit = item.namaSampah.toLowerCase().includes("oli") ? "liter" : "kg";
          return `• ${item.namaSampah}: ${item.beratKg} ${unit} @ Rp ${item.hargaPerKg.toLocaleString("id-ID")}`;
        }).join("<br>");

        const totalWeight = tx.items.reduce((sum, item) => sum + item.beratKg, 0);
        totalOverallWeight += totalWeight;
        totalOverallAmount += tx.total;

        const rowClass = idx % 2 === 1 ? 'class="bg-zebra"' : '';

        htmlContent += `
      <tr ${rowClass}>
        <td style="font-family: monospace; font-weight: bold; color: #1e293b; background-color: #f1f5f9; text-align: center;">${tx.id}</td>
        <td>${formattedDate} • ${formattedTime} WIB</td>
        <td style="font-weight: bold; color: #0f172a;">${tx.nasabahNama}</td>
        <td>${nasabahAlamat}</td>
        <td>${itemsDetail}</td>
        <td style="text-align: right; font-weight: bold; color: #1e293b;">${totalWeight.toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold; color: #047857;">Rp ${tx.total.toLocaleString("id-ID")}</td>
        <td style="color: #64748b;">${tx.inputByNama || "Admin"}</td>
      </tr>
`;
      });

      // Insert Summation Row
      htmlContent += `
      <tr class="total-row">
        <td colspan="5" style="text-align: right; font-weight: bold; padding: 12px; background-color: #d1fae5; border-top: 2px solid #059669;">REKAPITULASI TOTAL:</td>
        <td style="text-align: right; font-weight: bold; background-color: #d1fae5; border-top: 2px solid #059669; color: #065f46; font-size: 13px;">${totalOverallWeight.toFixed(2)} Kg/Ltr</td>
        <td style="text-align: right; font-weight: bold; background-color: #d1fae5; border-top: 2px solid #059669; color: #065f46; font-size: 13px;">Rp ${totalOverallAmount.toLocaleString("id-ID")}</td>
        <td style="background-color: #d1fae5; border-top: 2px solid #059669;"></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

      const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_SetoranPremium_${startDate}_s_d_${endDate}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      if (filteredWd.length === 0) {
        alert("Tidak ada data penarikan tunai dalam range filter untuk diunduh.");
        return;
      }

      // Generate HTML designed for Excel (Withdrawals)
      let htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Buku Kas Keluar</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; }
    th { background-color: #9a3412; color: #ffffff; font-weight: bold; border: 1px solid #b45309; padding: 12px 10px; font-size: 13px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; font-family: Arial, sans-serif; vertical-align: top; }
    .title-banner { font-size: 16px; font-weight: bold; color: #7c2d12; padding: 10px 0 5px 0; }
    .info-text { font-size: 11px; color: #475569; padding-bottom: 15px; font-style: italic; }
    .num { text-align: right; }
    .total-row { font-weight: bold; background-color: #fffbeb; }
    .bg-zebra { background-color: #fcf8f2; }
  </style>
</head>
<body>
  <div class="title-banner">LAPORAN BUKU KAS KELUAR / PENARIKAN SALDO KAS RT 06</div>
  <div class="info-text">
    Periode Pencarian: <strong>${formatShortIndoDate(startDate)} sampai ${formatShortIndoDate(endDate)}</strong><br>
    Unit Kerja: <strong>Buku Rekening Bendahara RT 06 Pondok Duta Depok</strong><br>
    Diunduh Pada: <strong>${new Date().toLocaleDateString("id-ID")} • Oleh: Petugas Aplikasi</strong>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 120px; background-color: #9a3412; color: white;">ID Pencairan</th>
        <th style="width: 160px; background-color: #9a3412; color: white;">Hari, Tanggal</th>
        <th style="width: 220px; background-color: #9a3412; color: white;">Nama Nasabah / Warga RT 06</th>
        <th style="width: 220px; background-color: #9a3412; color: white;">Alamat Rumah / Blok</th>
        <th style="width: 150px; background-color: #9a3412; color: white;">Metode & Media</th>
        <th style="width: 155px; background-color: #9a3412; color: white; text-align: right;">Jumlah Penarikan (Rp)</th>
        <th style="width: 150px; background-color: #9a3412; color: white;">Otoritas / Bendahara</th>
      </tr>
    </thead>
    <tbody>
`;

      let totalOverallAmount = 0;

      filteredWd.forEach((wd, idx) => {
        const formattedDate = formatIndonesianDate(wd.tanggal.split("T")[0]);
        const formattedTime = new Date(wd.tanggal).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const nasabahAlamat = nasabahMap[wd.nasabahId]?.alamat || "-";
        
        totalOverallAmount += wd.jumlah;
        const rowClass = idx % 2 === 1 ? 'class="bg-zebra"' : '';

        htmlContent += `
      <tr ${rowClass}>
        <td style="font-family: monospace; font-weight: bold; color: #1e293b; background-color: #fef3c7; text-align: center;">${wd.id}</td>
        <td>${formattedDate} • ${formattedTime} WIB</td>
        <td style="font-weight: bold; color: #7c2d12;">${wd.nasabahNama}</td>
        <td>${nasabahAlamat}</td>
        <td>Cash / Tunai RT</td>
        <td style="text-align: right; font-weight: bold; color: #be123c;">- Rp ${wd.jumlah.toLocaleString("id-ID")}</td>
        <td style="color: #64748b;">${wd.inputByNama || "Bendahara"}</td>
      </tr>
`;
      });

      // Total summation row
      htmlContent += `
      <tr class="total-row">
        <td colspan="5" style="text-align: right; font-weight: bold; padding: 12px; background-color: #fffbeb; border-top: 2px solid #b45309;">TOTAL OUTFLOW KAS RT:</td>
        <td style="text-align: right; font-weight: bold; background-color: #fffbeb; border-top: 2px solid #b45309; color: #b45309; font-size: 13px;">- Rp ${totalOverallAmount.toLocaleString("id-ID")}</td>
        <td style="background-color: #fffbeb; border-top: 2px solid #b45309;"></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

      const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_KasKeluarPremium_${startDate}_s_d_${endDate}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Export to Standard raw CSV (UTF-8 compatible)
  const handleExportCSV = () => {
    if (activeTab === "setoran") {
      if (filteredTx.length === 0) {
        alert("Tidak ada data dalam range filter untuk diunduh.");
        return;
      }

      // Build headers
      let csvContent = "";
      csvContent += "=== REKAPITULASI TRANSAKSI HARIAN - SAHABAT SAMPAH DUTA ===\r\n";
      csvContent += `Periode: ${formatShortIndoDate(startDate)} s.d. ${formatShortIndoDate(endDate)}\r\n`;
      csvContent += "Grup / Bank Sampah: Grup No. 23 - Bank Sampah Pondok Duta RT 06 RW 14 Depok\r\n\r\n";
      
      // Table Headers (Standard comma CSV rules)
      csvContent += "ID Transaksi,Tanggal,Nama Nasabah,Alamat,Rincian Sampah (Jenis/Berat/Nilai),Total Berat (kg/liter),Total Nilai (Rp),Petugas Timbang\r\n";

      // Row loop
      filteredTx.forEach((tx) => {
        const formattedDate = formatShortIndoDate(tx.tanggal);
        const nasabahAlamat = nasabahMap[tx.nasabahId]?.alamat || "-";
        
        // Rincian Sampah list string format
        const itemsDetail = tx.items.map(item => `${item.namaSampah} (${item.beratKg} ${item.namaSampah.toLowerCase().includes("oli") ? "liter" : "kg"} @ Rp${item.hargaPerKg})`).join(" | ");
        const totalWeight = tx.items.reduce((sum, item) => sum + item.beratKg, 0);

        // Escape quotes and commas
        const cleanNama = `"${tx.nasabahNama.replace(/"/g, '""')}"`;
        const cleanAlamat = `"${nasabahAlamat.replace(/"/g, '""')}"`;
        const cleanItems = `"${itemsDetail.replace(/"/g, '""')}"`;
        const cleanPetugas = `"${(tx.inputByNama || "Admin").replace(/"/g, '""')}"`;

        csvContent += `${tx.id},${formattedDate},${cleanNama},${cleanAlamat},${cleanItems},${totalWeight},${tx.total},${cleanPetugas}\r\n`;
      });

      // Standard CSV trigger with UTF-8 BOM so Excel opens commas perfectly
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Rekap_Setoran_RT06_${startDate}_ke_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      if (filteredWd.length === 0) {
        alert("Tidak ada data penarikan/kas dalam range filter untuk diunduh.");
        return;
      }

      // Build headers
      let csvContent = "";
      csvContent += "=== REKAPITULASI PENARIKAN SALDO & BUKU KAS - SAHABAT SAMPAH DUTA ===\r\n";
      csvContent += `Periode: ${formatShortIndoDate(startDate)} s.d. ${formatShortIndoDate(endDate)}\r\n`;
      csvContent += "Grup / Bank Sampah: Grup No. 23 - Bank Sampah Pondok Duta RT 06 RW 14 Depok\r\n\r\n";
      
      csvContent += "ID Pencairan,Tanggal,Nama Nasabah,Alamat,Jumlah Penarikan (Rp),Petugas Otoritas\r\n";

      // Row loop
      filteredWd.forEach((wd) => {
        const formattedDate = formatShortIndoDate(wd.tanggal);
        const nasabahAlamat = nasabahMap[wd.nasabahId]?.alamat || "-";
        
        // Escape quotes
        const cleanNama = `"${wd.nasabahNama.replace(/"/g, '""')}"`;
        const cleanAlamat = `"${nasabahAlamat.replace(/"/g, '""')}"`;
        const cleanPetugas = `"${(wd.inputByNama || "Bendahara").replace(/"/g, '""')}"`;

        csvContent += `${wd.id},${formattedDate},${cleanNama},${cleanAlamat},${wd.jumlah},${cleanPetugas}\r\n`;
      });

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Rekap_KasKeluar_RT06_${startDate}_ke_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Handle browser native print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Rekapitasi & Pembukuan Kas RT
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Grup Bank Sampah No. 23 • Kelola, unduh, dan cetak pembukuan setoran timbangan & penarikan saldo kas warga secara rapi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            id="rekap-excel-premium-btn"
            onClick={handleExportExcelPremium}
            className="flex items-center gap-2 px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer border border-emerald-600/30"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-100" />
            <span>Unduh Excel Premium</span>
          </button>
          <button
            id="rekap-excel-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3  py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-slate-200"
          >
            <Download className="h-4 w-4" />
            <span>CSV Data</span>
          </button>
          <button
            id="rekap-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 print:hidden gap-6">
        <button
          id="rekap-tab-setoran"
          onClick={() => setActiveTab("setoran")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "setoran"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          1. LAPORAN PENERIMAAN / SETORAN TIMBANGAN ({filteredTx.length})
        </button>
        <button
          id="rekap-tab-penarikan"
          onClick={() => setActiveTab("penarikan-ledger")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "penarikan-ledger"
              ? "border-amber-600 text-amber-800"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          2. LAPORAN PENGELUARAN / PENARIKAN SALDO KAS RT ({filteredWd.length})
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Dari Tanggal
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Sampai Tanggal
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Cari Nama / Alamat Warga
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="filter-search-query"
                type="text"
                placeholder="Nama nasabah, alamat, atau petugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERED RECAP SUMMARY CARD STATS */}
      {activeTab === "setoran" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          {/* Total Weight */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Sampah Disetor</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{totalWeightFiltered.toFixed(2)} Kg</p>
            </div>
          </div>

          {/* Total Payout */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/40 rounded-2xl p-5 border border-blue-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600/10 text-blue-700">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Penerimaan Bruto</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{formatIDR(totalPayoutFiltered)}</p>
            </div>
          </div>

          {/* Active Residents */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 rounded-2xl p-5 border border-indigo-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Warga Berpartisipasi</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{totalUniqueWargaFiltered} Orang</p>
            </div>
          </div>

          {/* Total Records */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-600/10 text-amber-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Transaksi</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{filteredTx.length} Setoran</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          {/* Total Withdrawals */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 rounded-2xl p-5 border border-amber-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-600/10 text-amber-700">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Dana Ditarik</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{formatIDR(totalWithdrawalFiltered)}</p>
            </div>
          </div>

          {/* Remaining Reserves */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/40 rounded-2xl p-5 border border-teal-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-600/10 text-teal-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Selisih Kas Cadangan</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{formatIDR(totalPayoutFiltered - totalWithdrawalFiltered)}</p>
            </div>
          </div>

          {/* Unique citizens */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/40 rounded-2xl p-5 border border-purple-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600/10 text-purple-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Warga Menarik Dana</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{new Set(filteredWd.map(w => w.nasabahId)).size} Orang</p>
            </div>
          </div>

          {/* Withdraw counts */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 rounded-2xl p-5 border border-rose-100 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-600/10 text-rose-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Frekuensi Tarik</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{filteredWd.length} Kali Pencairan</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto pb-4" />
          <p className="text-xs font-semibold text-slate-500">Menyusun rekapitulasi laporan setoran...</p>
        </div>
      ) : activeTab === "setoran" ? (
        filteredTx.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center p-6">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 print:hidden">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-700">Tidak ada transaksi setoran ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Silakan sesuaikan tanggal di filter panel, ganti nama pencarian, atau buat transaksi setoran baru.
            </p>
          </div>
        ) : (
          /* MAIN REPORT CONTAINER */
          <div id="print-area" className="space-y-8">
            {/* PRINT-ONLY HEADER */}
            <div className="hidden print:flex print:flex-col items-center justify-center text-center pb-6 border-b-2 border-slate-800 mb-6">
              <Logo size="lg" showText={true} />
              <div className="mt-4">
                <h2 className="text-xl font-bold text-slate-900 border-t pt-2 mt-2">
                  LAPORAN REKAPITULASI TIMBANGAN & SETORAN WARGA
                </h2>
                <p className="text-xs text-slate-500 font-bold tracking-wide mt-1 uppercase">
                  Grup No. 23 Kecamatan • RT 06 RW 14 Depok • Tanggal: {formatShortIndoDate(startDate)} s.d. {formatShortIndoDate(endDate)}
                </p>
              </div>
            </div>

            {/* Render Dates Chronologically Grouped */}
            {sortedDates.map((date) => {
              const dateTxList = groupedByDate[date];
              if (!dateTxList || dateTxList.length === 0) return null;
              const totalWeightOfDate = dateTxList.reduce((sum, tx) => sum + tx.items.reduce((itemSum, item) => itemSum + item.beratKg, 0), 0);
              const totalCashOfDate = dateTxList.reduce((sum, tx) => sum + tx.total, 0);
              const materialBreakdown = getMaterialBreakdownForDate(dateTxList);

              return (
                <div key={date} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden break-inside-avoid">
                  {/* Daily Accordion/Card Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-none">
                          {formatIndonesianDate(date)}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                          {dateTxList.length} Transaksi Terproses
                        </p>
                      </div>
                    </div>

                    {/* Daily Total Summaries */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200/50 px-3 py-1 rounded-full text-[10px] font-black tracking-wide">
                        Total Setoran: {totalWeightOfDate.toFixed(2)} Kg
                      </span>
                      <span className="bg-blue-100/80 text-blue-800 border border-blue-200/50 px-3 py-1 rounded-full text-[10px] font-black tracking-wide">
                        Total Nilai: {formatIDR(totalCashOfDate)}
                      </span>
                    </div>
                  </div>

                  {/* Material breakdown sub-bar for the day */}
                  <div className="bg-slate-100/40 px-5 py-3 border-b border-slate-100">
                    <span className="text-slate-500 text-[9px] uppercase font-black tracking-wider block mb-1.5 shadow-none pb-0">
                      Rincian Kategori Terkumpul Hari Ini:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {materialBreakdown.map((mb, i) => (
                        <span key={i} className="bg-white border border-slate-200/60 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                          {mb.label}: <strong className="text-slate-800">{mb.weight.toFixed(1)} {mb.unit}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sub table for that date's transactions */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10pt] font-black uppercase tracking-wider">
                          <th className="py-3 px-5 text-slate-500">ID</th>
                          <th className="py-3 px-5 text-slate-500">Waktu</th>
                          <th className="py-3 px-5 text-slate-500">Nama Nasabah</th>
                          <th className="py-3 px-5 text-slate-500">Alamat / RT</th>
                          <th className="py-3 px-5 text-slate-500">Rincian / Timbangan</th>
                          <th className="py-3 px-5 text-right text-slate-500">Total (Rp)</th>
                          <th className="py-3 px-5 text-slate-500 print:hidden">Petugas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {dateTxList.map((tx) => {
                          const nasabah = nasabahMap[tx.nasabahId];
                          const txTime = new Date(tx.tanggal).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit"
                          });

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/40 transition">
                              <td className="py-3.5 px-5 font-mono font-bold text-slate-500 text-[10px]">
                                {tx.id}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-semibold flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {txTime}
                              </td>
                              <td className="py-3.5 px-5 font-black text-slate-800">
                                {tx.nasabahNama}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-medium">
                                {nasabah?.alamat || "Blok C No. 12"}
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="flex flex-col gap-0.5 max-w-sm">
                                  {tx.items.map((item, id) => (
                                    <span key={id} className="text-slate-600 font-semibold">
                                      • {item.namaSampah}: <strong className="text-slate-900">{item.beratKg} {item.namaSampah.toLowerCase().includes("oli") ? "liter" : "kg"}</strong> @ {formatIDR(item.hargaPerKg)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-right font-black text-slate-900 text-sm">
                                {formatIDR(tx.total)}
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 font-bold print:hidden">
                                <span className="flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                                  {tx.inputByNama ? tx.inputByNama.split(" ")[0] : "Admin"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* PRINT-ONLY SIGNATURE SECTION */}
            <div className="hidden print:grid grid-cols-2 mt-16 pt-8 border-t border-dashed border-slate-350 text-center gap-10">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Menggetahui,</p>
                <h4 className="text-xs font-extrabold text-slate-800 mt-14 uppercase">Iwan Budianto</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Ketua RT 06 Pondok Duta</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Petugas Bank Sampah,</p>
                <h4 className="text-xs font-extrabold text-slate-800 mt-14 uppercase">Agus Santoso</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Petugas Timbang / Admin</p>
              </div>
            </div>
          </div>
        )
      ) : (
        filteredWd.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center p-6 bg-slate-50">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 print:hidden">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-700">Tidak ada penarikan saldo ditemukan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Silakan sesuaikan filter tanggal atau lakukan pencarian lain di panel atas.
            </p>
          </div>
        ) : (
          /* MAIN REPORT CONTAINER (PENARIKAN) */
          <div id="print-area-penarikan" className="space-y-8 animate-fade-in">
            {/* PRINT-ONLY HEADER */}
            <div className="hidden print:flex print:flex-col items-center justify-center text-center pb-6 border-b-2 border-slate-800 mb-6">
              <Logo size="lg" showText={true} />
              <div className="mt-4">
                <h2 className="text-xl font-bold text-slate-900 border-t pt-2 mt-2">
                  LAPORAN PENGELUARAN / PENARIKAN SALDO KAS RT
                </h2>
                <p className="text-xs text-slate-500 font-bold tracking-wide mt-1 uppercase text-amber-800">
                  Buku Kas Keluar RT 06 Pondok Duta • Tanggal: {formatShortIndoDate(startDate)} s.d. {formatShortIndoDate(endDate)}
                </p>
              </div>
            </div>

            {/* Render Dates Chronologically Grouped */}
            {allEncounteredDates.filter(d => (groupedWdByDate[d] || []).length > 0).map((date) => {
              const dateWdList = groupedWdByDate[date] || [];
              const totalCashOfDate = dateWdList.reduce((sum, wd) => sum + wd.jumlah, 0);

              return (
                <div key={date} className="bg-white rounded-2xl border border-amber-100/60 shadow-xs overflow-hidden break-inside-avoid">
                  {/* Daily Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight leading-none">
                          {formatIndonesianDate(date)}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                          {dateWdList.length} Penarikan Tunai
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 border border-amber-200/50 px-3 py-1 rounded-full text-[10px] font-black tracking-wide">
                        Total Keluar: - {formatIDR(totalCashOfDate)}
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-amber-100 bg-slate-50 text-slate-400 text-[10pt] font-black uppercase tracking-wider">
                          <th className="py-3 px-5 text-slate-500">ID Pencairan</th>
                          <th className="py-3 px-5 text-slate-500">Waktu</th>
                          <th className="py-3 px-5 text-slate-500">Nama Nasabah Warga</th>
                          <th className="py-3 px-5 text-slate-500">Alamat Rumah RT</th>
                          <th className="py-3 px-5 text-slate-500">Metode / Media</th>
                          <th className="py-3 px-5 text-right text-slate-500">Jumlah Tarik (Rp)</th>
                          <th className="py-3 px-5 text-slate-500 print:hidden">Petugas Otoritas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {dateWdList.map((wd) => {
                          const nasabah = nasabahMap[wd.nasabahId];
                          const wdTime = new Date(wd.tanggal).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit"
                          });

                          return (
                            <tr key={wd.id} className="hover:bg-amber-50/5 transition">
                              <td className="py-3.5 px-5 font-mono font-bold text-slate-500 text-[10px]">
                                {wd.id}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-semibold flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {wdTime}
                              </td>
                              <td className="py-3.5 px-5 font-black text-slate-800">
                                {wd.nasabahNama}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 font-medium">
                                {nasabah?.alamat || "RT 06 Pondok Duta"}
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="inline-block px-2 py-0.5 bg-slate-50 text-slate-650 rounded border border-slate-200 text-[9px] font-bold">
                                  Cash / Tunai RT
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-right font-black text-rose-700 text-sm">
                                - {formatIDR(wd.jumlah)}
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 font-bold print:hidden">
                                <span className="flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                                  {wd.inputByNama ? wd.inputByNama.split(" ")[0] : "Bendahara"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* PRINT-ONLY SIGNATURE SECTION */}
            <div className="hidden print:grid grid-cols-2 mt-16 pt-8 border-t border-dashed border-slate-350 text-center gap-10">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Menggetahui,</p>
                <h4 className="text-xs font-extrabold text-slate-800 mt-14 uppercase">Iwan Budianto</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Ketua RT 06 Pondok Duta</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Petugas Otoritas,</p>
                <h4 className="text-xs font-extrabold text-slate-800 mt-14 uppercase">Agus Santoso</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Petugas Bendahara RT</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
