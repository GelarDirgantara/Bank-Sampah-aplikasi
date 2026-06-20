/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum StaffRole {
  ADMIN = "admin",
  PETUGAS = "petugas"
}

export interface Staff {
  id: string;
  username: string; // Used for login
  nama: string;
  role: StaffRole;
  createdBy?: string;
  createdAt: string;
}

export interface Nasabah {
  id: string;
  nama: string;
  nomorHp: string;
  alamat: string;
  saldo: number;
  totalBeratKg: number;
  totalTransaksi: number;
  createdBy: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string; // unique item id inside the transaction basket
  jenisSampah: string; // price list item id
  namaSampah: string; // price list item nama
  beratKg: number;
  hargaPerKg: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  nasabahId: string;
  nasabahNama?: string; // cached for UI convenience
  tanggal: string;
  items: TransactionItem[];
  total: number;
  inputBy: string; // staff id
  inputByNama?: string; // staff name for UI convenience
  createdAt: string;
}

export interface PriceListItem {
  id: string; // Slug/slugified ID
  namaSampah: string;
  harga: number;
  satuan: string; // e.g., "kg", "liter"
  updatedAt: string;
  updatedBy: string;
}

export interface NotificationLog {
  id: string;
  nasabahId: string;
  nasabahNama: string;
  nomorHp: string;
  message: string;
  status: "simulated" | "sent";
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  nasabahId: string;
  nasabahNama: string;
  jumlah: number;
  tanggal: string;
  inputBy: string;
  inputByNama?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSsetoranHariIni: number; // in Rupiah
  totalSetoranBulanIni: number; // in Rupiah
  totalWeightKg: number;
  totalActiveNasabah: number;
  totalTransactionCount: number;
  totalSaldoTerkini?: number;
  totalSaldoDitarik?: number;
  totalSaldoKeseluruhan?: number;
}

export interface CollectionSchedule {
  tanggal: string;
  waktu: string;
  keterangan: string;
  updatedAt: string;
}

