/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Staff, StaffRole, Nasabah, Transaction, PriceListItem, NotificationLog, Withdrawal, CollectionSchedule } from "./src/types.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to JSON Database file
const DB_FILE = path.join(process.cwd(), "db.json");

// Define structure for our local database.
interface LocalDB {
  staff: Staff[];
  nasabah: Nasabah[];
  transactions: Transaction[];
  priceList: PriceListItem[];
  notificationsLog: NotificationLog[];
  withdrawals: Withdrawal[];
  schedule?: CollectionSchedule;
}

// Default initial seed data matching requirements & diagrams perfectly
const DEFAULT_PRICE_LIST: PriceListItem[] = [
  // KERTAS
  { id: "kertas-dus", namaSampah: "Dus", harga: 1500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "kertas-putih-hvs", namaSampah: "Kertas Putih/ Kertas HVS", harga: 2000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "kertas-koran-utuh", namaSampah: "Kertas Koran Utuh", harga: 3000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "kertas-duplek-karton", namaSampah: "Duplek/ Karton/ Kertas Boncos", harga: 500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "kertas-semen", namaSampah: "Kertas Semen", harga: 1300, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "kertas-majalah-buku", namaSampah: "Majalah / Buku", harga: 1000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "kertas-tetra-pack", namaSampah: "Bungkus Susu Cair/ Tetra Pack", harga: 100, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },

  // PLASTIK
  { id: "plastik-gelas-a", namaSampah: "Gelas A (kondisi bersih)", harga: 4000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-gelas-b-monti", namaSampah: "Gelas B /Monti (gelas ada tulisan/ sablon)", harga: 1500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-botol-a-galon-le-minerale", namaSampah: "Botol A & Galon Le Minerale (bersih tanpa label & tutup)", harga: 3000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-botol-b", namaSampah: "Botol B (botol air mineral masih ada label & tutupnya)", harga: 2000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-emberan-warna", namaSampah: "Emberan Warna Lunak & Keras", harga: 1500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-galon-aqua", namaSampah: "Galon Aqua", harga: 4000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-kristal-bening", namaSampah: "Kristal Bening/ Toples Kue Lebaran / Bungkus Kaset Bening", harga: 3500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-keping-cd", namaSampah: "Keping CD", harga: 3500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-tutup-galon", namaSampah: "Tutup Galon Isi Ulang / LD", harga: 3500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-tutup-botol", namaSampah: "Tutup Botol Air Mineral / Tutup Botol Plastik Lainnya", harga: 2500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-kresek-asoy", namaSampah: "Kresek / Asoy", harga: 100, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-bening-bersih", namaSampah: "Plastik Bening Bersih (tidak ada tulisan & gambar)", harga: 700, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-selopan-refil-minyak", namaSampah: "Plastik Selopan /Refil bekas Minyak Goreng", harga: 250, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-karpet-talang-jas-hujan", namaSampah: "Karpet Talang /Jas Hujan/ Kolam Air Anak/ Selang/ Ban", harga: 300, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-kulit-kabel", namaSampah: "Kulit Kabel", harga: 500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "plastik-sepatu-sandal", namaSampah: "Sepatu / Sandal", harga: 200, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },

  // LOGAM
  { id: "logam-kawat-spring-bed-besar", namaSampah: "Kawat Spring Bed Besar", harga: 10000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-kawat-spring-bed-kecil", namaSampah: "Kawat Sprng Bed Kecil/Sedang", harga: 5000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-wajan-penggorengan", namaSampah: "Wajan / Penggorengan/ Regulator/ Keran Besi", harga: 5000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-besi-super-tebal", namaSampah: "Besi Super / Tebal/ Besi Untuk Cor", harga: 3500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-besi-kosong-tipis", namaSampah: "Besi Kosong /Tipis/ Paku/ Kawat/ Stainlees", harga: 2500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-kaleng", namaSampah: "Kaleng", harga: 1500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-alumunium-panci", namaSampah: "Alumunium /Panci/ Bekas Minuman Ringan/Plat Mobil a/ Motor", harga: 9000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-tembaga", namaSampah: "Tembaga", harga: 60000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-seng", namaSampah: "Seng", harga: 800, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "logam-aki-kiloan", namaSampah: "Aki (per kilo)", harga: 7000, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },

  // PECAH BELAH
  { id: "belah-botol-kecap", namaSampah: "Botol Kecap Utuh atau sejenisnya (bukan botol sirup)", harga: 250, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "belah-beling-bening", namaSampah: "Beling Bening / Beling Pecah Bening", harga: 350, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "belah-botol-warna-kaca", namaSampah: "Botol Warna / Beling Pecah Warna / Kaca", harga: 200, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },

  // LAIN-LAIN
  { id: "lain-mesin-cuci", namaSampah: "Mesin Cuci", harga: 30000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-tv-tabung-kecil", namaSampah: "TV Tabung / Layar Datar 14 - 21 inc", harga: 10000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-tv-tabung-besar", namaSampah: "TV Tabung / Layar Datar 21 inc ke atas", harga: 20000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-kulkas-1-pintu", namaSampah: "Kulkas 1 pintu", harga: 30000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-kulkas-2-pintu", namaSampah: "Kulkas 2 pintu", harga: 50000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-komputer-set", namaSampah: "Komputer 1 set cpu + monitor", harga: 50000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-laptop-utuh", namaSampah: "Laptop Utuh", harga: 40000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-handphone", namaSampah: "Handphone", harga: 3000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-ac-komplit", namaSampah: "AC Komplit outdoor & indoor", harga: 250000, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-karung-besar", namaSampah: "Karung Besar (50 kg ke atas)", harga: 600, satuan: "satuan", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },
  { id: "lain-karung-kecil", namaSampah: "Karung Kecil (per kilo)", harga: 500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" },

  // MINYAK
  { id: "minyak-jelantah", namaSampah: "Minyak Jelantah", harga: 5500, satuan: "kg", updatedAt: "2026-10-01T08:00:00Z", updatedBy: "admin" }
];

const DEFAULT_STAFF: (Staff & { passwordHash: string })[] = [
  { id: "staff-1", username: "admin", nama: "Iwan Budianto (Ketua RT)", role: StaffRole.ADMIN, createdAt: "2026-05-01T07:00:00Z", passwordHash: "admin" },
  { id: "staff-2", username: "petugas", nama: "Agus Santoso (Petugas Timbang)", role: StaffRole.PETUGAS, createdAt: "2026-05-02T08:30:00Z", passwordHash: "petugas" }
];

const DEFAULT_NASABAH: Nasabah[] = [
  { id: "nasabah-1", nama: "Ira", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-2", nama: "Wati Rahmat", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-3", nama: "Yulia", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-4", nama: "Ina Toni", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-5", nama: "Mita", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-6", nama: "Ida Hendar", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-7", nama: "Fitri", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-8", nama: "Henny", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-9", nama: "Puji", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-10", nama: "Titin", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-11", nama: "Emi", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-12", nama: "Tiwi Diah", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-13", nama: "Sisi", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-14", nama: "Effita", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-15", nama: "Nanik W", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-16", nama: "Mimo", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-17", nama: "Nani Muchtar", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-18", nama: "Nurul Agus", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-19", nama: "Nyimas", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-20", nama: "Dewi Putu", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-21", nama: "Yuni Bambang", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-22", nama: "Nainggolan", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" },
  { id: "nasabah-23", nama: "Yuni", nomorHp: "", alamat: "", saldo: 0, totalBeratKg: 0, totalTransaksi: 0, createdBy: "staff-1", createdAt: "2026-06-20T06:00:00Z" }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const DEFAULT_NOTIFICATIONS: NotificationLog[] = [];

// Helper to load db
function readDB(): LocalDB {
  let db: LocalDB;
  if (!fs.existsSync(DB_FILE)) {
    db = {
      staff: DEFAULT_STAFF.map(({ passwordHash, ...rest }) => rest), // Keep staff for API representation
      nasabah: DEFAULT_NASABAH,
      transactions: DEFAULT_TRANSACTIONS,
      priceList: DEFAULT_PRICE_LIST,
      notificationsLog: DEFAULT_NOTIFICATIONS,
      withdrawals: [],
      schedule: {
        tanggal: "2026-07-04",
        waktu: "08:00 - 11:30 WIB",
        keterangan: "Sesuai dengan perjanjian dengan Bank Sampah Pusat, pengumpulan sampah rutin dilakukan setiap 2 minggu sekali.",
        updatedAt: new Date().toISOString()
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    return db;
  }
  const data = fs.readFileSync(DB_FILE, "utf-8");
  db = JSON.parse(data);

  // Auto-initialize withdrawals if not present
  if (!db.withdrawals) {
    db.withdrawals = [];
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  // Auto-initialize schedule if not present
  if (!db.schedule) {
    db.schedule = {
      tanggal: "2026-07-04",
      waktu: "08:00 - 11:30 WIB",
      keterangan: "Sesuai dengan perjanjian dengan Bank Sampah Pusat, pengumpulan sampah rutin dilakukan setiap 2 minggu sekali.",
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  // Auto-migrate to the new 48-item price list if it has the older small set
  if (!db.priceList || db.priceList.length < 20) {
    db.priceList = DEFAULT_PRICE_LIST;
    if (db.transactions) {
      db.transactions = db.transactions.map(tx => ({
        ...tx,
        items: tx.items.map(item => {
          let nid = item.jenisSampah;
          if (nid === "plastik") nid = "plastik-botol-b";
          if (nid === "kardus") nid = "kertas-duplek-karton";
          if (nid === "kertas") nid = "kertas-putih-hvs";
          if (nid === "oli") nid = "minyak-jelantah";
          if (nid === "aluminium") nid = "logam-alumunium-panci";
          if (nid === "besi") nid = "logam-besi-kosong-tipis";
          return { ...item, jenisSampah: nid };
        })
      }));
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  // Auto-migrate and update to the new 23-nasabah list
  const firstNasabahIsIra = db.nasabah && db.nasabah[0] && db.nasabah[0].nama === "Ira";
  if (!db.nasabah || db.nasabah.length < 15 || !firstNasabahIsIra) {
    db.nasabah = DEFAULT_NASABAH;
    db.transactions = DEFAULT_TRANSACTIONS;
    db.notificationsLog = DEFAULT_NOTIFICATIONS;
    db.withdrawals = [];
    db.schedule = {
      tanggal: "2026-07-04",
      waktu: "08:00 - 11:30 WIB",
      keterangan: "Sesuai dengan perjanjian dengan Bank Sampah Pusat, pengumpulan sampah rutin dilakukan setiap 2 minggu sekali.",
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }
  return db;
}

// Helper to save db
function writeDB(data: LocalDB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Ensure database is initialized at start
readDB();

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Post auth login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password harus diisi." });
  }

  // Look up in DEFAULT_STAFF (pre-encrypted or plaintext match for convenience of demonstration)
  const staffMatch = DEFAULT_STAFF.find(
    (s) => s.username === username.toLowerCase() && s.passwordHash === password
  );

  if (!staffMatch) {
    return res.status(401).json({ message: "Username atau password salah." });
  }

  // Generate simple bearer mock token
  const token = `mock-token-${staffMatch.id}-${Date.now()}`;
  res.json({
    token,
    staff: {
      id: staffMatch.id,
      username: staffMatch.username,
      nama: staffMatch.nama,
      role: staffMatch.role,
      createdAt: staffMatch.createdAt
    }
  });
});

// Middleware for mock auth tokens
function getAuthHeader(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
}

// Helper to parse role from token
function getRoleFromToken(token: string): { id: string; role: StaffRole; nama: string } | null {
  if (!token) return null;
  if (!token.startsWith("mock-token-")) return null;
  const parts = token.split("-");
  if (parts.length < 4) return null;
  // Join back any pieces of staff ID that contain hyphens
  const staffId = parts.slice(2, parts.length - 1).join("-");
  const staff = DEFAULT_STAFF.find((s) => s.id === staffId);
  if (!staff) return null;
  return { id: staff.id, role: staff.role, nama: staff.nama };
}

// Auth guard middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = getAuthHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Token tidak ditemukan." });
  }
  const staff = getRoleFromToken(token);
  if (!staff) {
    return res.status(401).json({ message: "Token kadaluarsa atau tidak valid." });
  }
  (req as any).user = staff;
  next();
};

// Admin only guard middleware
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== StaffRole.ADMIN) {
    return res.status(403).json({ message: "Akses ditolak. Fitur ini memerlukan akses Admin Penuh." });
  }
  next();
};

// 1. Core Nasabah Routes (CRUD)
app.get("/api/nasabah", authenticate, (req, res) => {
  const db = readDB();
  res.json(db.nasabah);
});

app.post("/api/nasabah", authenticate, requireAdmin, (req, res) => {
  const { nama, nomorHp, alamat, saldoAwal } = req.body;
  if (!nama || !nomorHp || !alamat) {
    return res.status(400).json({ message: "Nama, Nomor HP, dan Alamat harus diisi." });
  }

  const db = readDB();
  const id = `nasabah-${Date.now()}`;
  const newNasabah: Nasabah = {
    id,
    nama,
    nomorHp,
    alamat,
    saldo: Number(saldoAwal) || 0,
    totalBeratKg: 0,
    totalTransaksi: 0,
    createdBy: (req as any).user.id,
    createdAt: new Date().toISOString()
  };

  db.nasabah.push(newNasabah);
  writeDB(db);

  res.status(201).json(newNasabah);
});

app.put("/api/nasabah/:id", authenticate, requireAdmin, (req, res) => {
  const { nama, nomorHp, alamat } = req.body;
  const { id } = req.params;

  const db = readDB();
  const idx = db.nasabah.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Data nasabah tidak ditemukan." });
  }

  db.nasabah[idx] = {
    ...db.nasabah[idx],
    nama: nama || db.nasabah[idx].nama,
    nomorHp: nomorHp || db.nasabah[idx].nomorHp,
    alamat: alamat || db.nasabah[idx].alamat,
  };

  writeDB(db);
  res.json(db.nasabah[idx]);
});

app.delete("/api/nasabah/:id", authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const idx = db.nasabah.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Data nasabah tidak ditemukan." });
  }

  // Delete transactions related to this customer or keep them for historical purposes?
  // Let's filter out customer but keep database consistent
  db.nasabah.splice(idx, 1);
  writeDB(db);

  res.json({ message: "Nasabah berhasil dihapus." });
});

// 2. Price List Routes
app.get("/api/price-list", authenticate, (req, res) => {
  const db = readDB();
  res.json(db.priceList);
});

app.put("/api/price-list/:id", authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { harga, namaSampah, satuan } = req.body;

  if (harga === undefined || isNaN(Number(harga)) || Number(harga) < 0) {
    return res.status(400).json({ message: "Harga harus berupa angka positif." });
  }

  const db = readDB();
  const idx = db.priceList.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Kategori sampah tidak ditemukan dalam daftar harga." });
  }

  db.priceList[idx] = {
    ...db.priceList[idx],
    namaSampah: namaSampah || db.priceList[idx].namaSampah,
    harga: Number(harga),
    satuan: satuan || db.priceList[idx].satuan,
    updatedAt: new Date().toISOString(),
    updatedBy: (req as any).user.id
  };

  writeDB(db);
  res.json(db.priceList[idx]);
});

app.post("/api/price-list", authenticate, requireAdmin, (req, res) => {
  const { namaSampah, harga, satuan } = req.body;
  if (!namaSampah || harga === undefined || !satuan) {
    return res.status(400).json({ message: "Nama sampah, harga, dan satuan harus diisi." });
  }

  const db = readDB();
  const slug = namaSampah.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  // Prevent duplicate slug
  if (db.priceList.some((p) => p.id === slug)) {
    return res.status(400).json({ message: "Nama sampah sudah ada di dalam price list." });
  }

  const newItem: PriceListItem = {
    id: slug || `item-${Date.now()}`,
    namaSampah,
    harga: Number(harga),
    satuan,
    updatedAt: new Date().toISOString(),
    updatedBy: (req as any).user.id
  };

  db.priceList.push(newItem);
  writeDB(db);
  res.status(201).json(newItem);
});

// 3. Transactions Endpoint (CRITICAL ATOMIC LOGIC)
app.get("/api/transactions", authenticate, (req, res) => {
  const db = readDB();
  // Sort descending by date
  const sorted = [...db.transactions].sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  res.json(sorted);
});

app.post("/api/transactions", authenticate, (req, res) => {
  const { nasabahId, items } = req.body; // items is an array of { jenisSampah: string, beratKg: number }
  
  if (!nasabahId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Data nasabah ID dan item sampah setoran harus dikirim." });
  }

  const db = readDB();
  
  // 1. Fetch Nasabah
  const nasabahIdx = db.nasabah.findIndex((n) => n.id === nasabahId);
  if (nasabahIdx === -1) {
    return res.status(404).json({ message: "Nasabah tidak ditemukan." });
  }
  const nasabah = db.nasabah[nasabahIdx];

  // 2. Validate items and compute totals
  const mappedItems = items.map((basketItem: { jenisSampah: string; beratKg: number }, idx) => {
    const priceItem = db.priceList.find((p) => p.id === basketItem.jenisSampah);
    if (!priceItem) {
      throw new Error(`Jenis sampah '${basketItem.jenisSampah}' tidak terdaftar.`);
    }
    const berat = Number(basketItem.beratKg);
    if (isNaN(berat) || berat <= 0) {
      throw new Error("Berat sampah harus berupa angka positif.");
    }

    const subtotal = Math.round(berat * priceItem.harga);
    return {
      id: `tx-item-${Date.now()}-${idx}`,
      jenisSampah: priceItem.id,
      namaSampah: priceItem.namaSampah,
      beratKg: berat,
      hargaPerKg: priceItem.harga,
      subtotal
    };
  });

  const grandTotal = mappedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalBerat = mappedItems.reduce((sum, item) => sum + item.beratKg, 0);

  // 3. Update Nasabah Atomic Fields
  const oldSaldo = nasabah.saldo;
  const newSaldo = oldSaldo + grandTotal;

  db.nasabah[nasabahIdx] = {
    ...nasabah,
    saldo: newSaldo,
    totalBeratKg: Number((nasabah.totalBeratKg + totalBerat).toFixed(2)),
    totalTransaksi: nasabah.totalTransaksi + 1
  };

  // 4. Save Transaction Document
  const txId = `tx-${Date.now()}`;
  const nowStr = new Date().toISOString();
  const newTx: Transaction = {
    id: txId,
    nasabahId,
    nasabahNama: nasabah.nama,
    tanggal: nowStr,
    items: mappedItems,
    total: grandTotal,
    inputBy: (req as any).user.id,
    inputByNama: (req as any).user.nama,
    createdAt: nowStr
  };

  db.transactions.push(newTx);

  // 5. Generate SIMULATED WhatsApp Notification Log
  const cleanDateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  let msgLines = `Halo ${nasabah.nama}, Setoran sampah Anda pada ${cleanDateStr} berhasil dicatat:\n`;
  mappedItems.forEach((it) => {
    msgLines += `- ${it.beratKg} kg ${it.namaSampah} (Rp ${it.subtotal.toLocaleString("id-ID")})\n`;
  });
  msgLines += `Total: Rp ${grandTotal.toLocaleString("id-ID")}. Saldo Anda sekarang: Rp ${newSaldo.toLocaleString("id-ID")}. Terima kasih! - Bank Sampah Pondok Duta RT 06`;

  const notifId = `notif-${Date.now()}`;
  const newNotification: NotificationLog = {
    id: notifId,
    nasabahId,
    nasabahNama: nasabah.nama,
    nomorHp: nasabah.nomorHp,
    message: msgLines,
    status: "simulated",
    createdAt: nowStr
  };
  
  db.notificationsLog.push(newNotification);

  // Write all changes in one atomic file save
  writeDB(db);

  res.status(201).json({
    transaction: newTx,
    updatedNasabah: db.nasabah[nasabahIdx],
    simulatedNotification: newNotification
  });
});

app.delete("/api/transactions/:id", authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const txIdx = db.transactions.findIndex((t) => t.id === id);
  if (txIdx === -1) {
    return res.status(404).json({ message: "Transaksi tidak ditemukan." });
  }
  const tx = db.transactions[txIdx];

  // Atomic deduction: subtract balance, weight amount, and decrements records from Nasabah
  const nasabahIdx = db.nasabah.findIndex((n) => n.id === tx.nasabahId);
  if (nasabahIdx !== -1) {
    const nasabah = db.nasabah[nasabahIdx];
    const totalBerat = tx.items.reduce((sum, item) => sum + item.beratKg, 0);
    
    db.nasabah[nasabahIdx] = {
      ...nasabah,
      saldo: Math.max(0, nasabah.saldo - tx.total),
      totalBeratKg: Math.max(0, Number((nasabah.totalBeratKg - totalBerat).toFixed(2))),
      totalTransaksi: Math.max(0, nasabah.totalTransaksi - 1)
    };
  }

  db.transactions.splice(txIdx, 1);
  writeDB(db);

  res.json({ message: "Transaksi berhasil dibatalkan dan saldo dideposit balik." });
});

// 3b. Withdrawals Endpoint
app.get("/api/withdrawals", authenticate, (req, res) => {
  const db = readDB();
  const sorted = [...db.withdrawals].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  res.json(sorted);
});

app.post("/api/withdrawals", authenticate, (req, res) => {
  const { nasabahId, jumlah } = req.body;
  
  if (!nasabahId || !jumlah) {
    return res.status(400).json({ message: "Nasabah ID dan jumlah penarikan harus dikirim." });
  }

  const amt = Math.round(Number(jumlah));
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ message: "Jumlah penarikan harus berupa angka positif." });
  }

  const db = readDB();
  const nasabahIdx = db.nasabah.findIndex((n) => n.id === nasabahId);
  if (nasabahIdx === -1) {
    return res.status(404).json({ message: "Nasabah tidak ditemukan." });
  }

  const nasabah = db.nasabah[nasabahIdx];
  if (nasabah.saldo < amt) {
    return res.status(400).json({ message: `Saldo tidak mencukupi. Saldo saat ini: Rp ${nasabah.saldo.toLocaleString("id-ID")}` });
  }

  // Deduct balance
  const oldSaldo = nasabah.saldo;
  const newSaldo = oldSaldo - amt;
  db.nasabah[nasabahIdx] = {
    ...nasabah,
    saldo: newSaldo
  };

  const wdId = `wd-${Date.now()}`;
  const nowStr = new Date().toISOString();
  const newWd: Withdrawal = {
    id: wdId,
    nasabahId,
    nasabahNama: nasabah.nama,
    jumlah: amt,
    tanggal: nowStr,
    inputBy: (req as any).user.id,
    inputByNama: (req as any).user.nama,
    createdAt: nowStr
  };

  db.withdrawals.push(newWd);

  // Generate simulated WA notification
  const cleanDateStr = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const msg = `Halo ${nasabah.nama}, Penarikan saldo tabungan sampah Anda sebesar Rp ${amt.toLocaleString("id-ID")} pada tanggal ${cleanDateStr} berhasil diproses.\nSisa saldo Anda sekarang: Rp ${newSaldo.toLocaleString("id-ID")}.\nTerima kasih! - Bank Sampah Pondok Duta RT 06`;

  const notifId = `notif-wd-${Date.now()}`;
  const newNotification: NotificationLog = {
    id: notifId,
    nasabahId,
    nasabahNama: nasabah.nama,
    nomorHp: nasabah.nomorHp,
    message: msg,
    status: "simulated",
    createdAt: nowStr
  };

  db.notificationsLog.push(newNotification);

  writeDB(db);

  res.status(201).json({
    withdrawal: newWd,
    updatedNasabah: db.nasabah[nasabahIdx],
    simulatedNotification: newNotification
  });
});

app.delete("/api/withdrawals/:id", authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const wdIdx = db.withdrawals.findIndex((w) => w.id === id);
  if (wdIdx === -1) {
    return res.status(404).json({ message: "Data penarikan tidak ditemukan." });
  }

  const wd = db.withdrawals[wdIdx];
  const nasabahIdx = db.nasabah.findIndex((n) => n.id === wd.nasabahId);
  if (nasabahIdx !== -1) {
    const nasabah = db.nasabah[nasabahIdx];
    db.nasabah[nasabahIdx] = {
      ...nasabah,
      saldo: nasabah.saldo + wd.jumlah
    };
  }

  db.withdrawals.splice(wdIdx, 1);
  writeDB(db);

  res.json({ message: "Penarikan berhasil dibatalkan dan saldo dikembalikan." });
});

// 4. WhatsApp Notification API
app.get(["/api/notifications", "/api/notifications/logs"], authenticate, (req, res) => {
  const db = readDB();
  const sorted = [...db.notificationsLog].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

// 4b. Collection Schedule API
app.get("/api/schedule", authenticate, (req, res) => {
  const db = readDB();
  res.json(db.schedule);
});

app.put("/api/schedule", authenticate, requireAdmin, (req, res) => {
  const { tanggal, waktu, keterangan } = req.body;
  if (!tanggal || !waktu || !keterangan) {
    return res.status(400).json({ message: "Tanggal, waktu, dan keterangan wajib diisi." });
  }

  const db = readDB();
  db.schedule = {
    tanggal,
    waktu,
    keterangan,
    updatedAt: new Date().toISOString()
  };
  writeDB(db);

  res.json({ message: "Jadwal pengumpulan sampah 2 mingguan berhasil diperbarui.", schedule: db.schedule });
});

// 5. Staff Management APIs (For Admin only)
app.get("/api/staff", authenticate, requireAdmin, (req, res) => {
  // In our local mockup, let's load all Staff (using DEFAULT_STAFF or db structure)
  // Let's load them from DB
  const db = readDB();
  res.json(db.staff);
});

app.post("/api/staff", authenticate, requireAdmin, (req, res) => {
  const { username, nama, role, password } = req.body;
  if (!username || !nama || !role || !password) {
    return res.status(400).json({ message: "Username, Nama, Role, dan Password harus diisi." });
  }

  const db = readDB();
  if (db.staff.some((s) => s.username === username.toLowerCase())) {
    return res.status(400).json({ message: "Username staff sudah terdaftar." });
  }

  const newStaffId = `staff-${Date.now()}`;
  const newStaff: Staff = {
    id: newStaffId,
    username: username.toLowerCase(),
    nama,
    role: role as StaffRole,
    createdBy: (req as any).user.id,
    createdAt: new Date().toISOString()
  };

  db.staff.push(newStaff);
  
  // also push to custom system password matching system for runtime log-ability
  DEFAULT_STAFF.push({
    ...newStaff,
    passwordHash: password
  });

  writeDB(db);

  res.status(201).json(newStaff);
});

app.delete("/api/staff/:id", authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  // Cannot self delete
  if (id === (req as any).user.id) {
    return res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri." });
  }

  const db = readDB();
  const idx = db.staff.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Petugas / Staff tidak ditemukan." });
  }

  db.staff.splice(idx, 1);
  writeDB(db);

  // Sync default staff runtime lookup as well
  const defIdx = DEFAULT_STAFF.findIndex((s) => s.id === id);
  if (defIdx !== -1) DEFAULT_STAFF.splice(defIdx, 1);

  res.json({ message: "Akun petugas berhasil dihapus." });
});

// 6. Dashboard Stats Summary API
app.get("/api/dashboard/stats", authenticate, (req, res) => {
  const db = readDB();
  const txs = db.transactions;
  
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  let totalSsetoranHariIni = 0;
  let totalSetoranBulanIni = 0;
  let totalWeightKg = 0;

  txs.forEach((tx) => {
    const txDate = new Date(tx.tanggal);
    const txDateStr = tx.tanggal.split("T")[0];
    
    // Total weight
    const txWeight = tx.items.reduce((sum, item) => sum + item.beratKg, 0);
    totalWeightKg += txWeight;

    // Today's total
    if (txDateStr === todayStr) {
      totalSsetoranHariIni += tx.total;
    }

    // Month's total
    if (txDate.getMonth() === curMonth && txDate.getFullYear() === curYear) {
      totalSetoranBulanIni += tx.total;
    }
  });

  const totalActiveNasabah = db.nasabah.length;
  const totalTransactionCount = txs.length;

  // Withdrawal and Balance stats
  const totalSaldoTerkini = db.nasabah.reduce((sum, n) => sum + (n.saldo || 0), 0);
  const totalSaldoDitarik = db.withdrawals.reduce((sum, w) => sum + (w.jumlah || 0), 0);
  const totalSaldoKeseluruhan = totalSaldoTerkini + totalSaldoDitarik;

  res.json({
    totalSsetoranHariIni,
    totalSetoranBulanIni,
    totalWeightKg: Number(totalWeightKg.toFixed(1)),
    totalActiveNasabah,
    totalTransactionCount,
    totalSaldoTerkini,
    totalSaldoDitarik,
    totalSaldoKeseluruhan
  });
});

// -------------------------------------------------------------
// Vite and Static File Setup
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=================================================`);
    console.log(`Sahabat Sampah Duta Server is running on port ${PORT}`);
    console.log(`Development App URL: http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}

startServer();
