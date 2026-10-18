# Plan Implementasi Fitur UI yang Belum Tersedia

Berdasarkan audit API backend (`school-worker/src/api/`) dan struktur folder frontend (`/src/app/(portal)/`), ditemukan bahwa banyak fitur backend yang sudah siap namun belum memiliki antarmuka pengguna (UI) yang memadai di portal.

## Daftar Modul UI yang akan Diimplementasikan

Berikut adalah daftar modul yang akan dibangun di dalam `src/app/(portal)/`:

1.  **Modul Siswa (`/students`)**: CRUD data siswa, pendaftaran, dan penautan orang tua.
2.  **Modul Kelas (`/classes`)**: Pengelolaan data kelas dan konfigurasi biaya SPP.
3.  **Modul Mata Pelajaran (`/subjects`)**: Pengelolaan mata pelajaran dan relasi ke kelas.
4.  **Modul Keuangan (`/finance`)**: Pencatatan tagihan, invoice, dan riwayat pembayaran siswa.
5.  **Modul Penilaian (`/grades`)**: Antarmuka bagi admin/guru untuk input nilai tugas dan ujian.
6.  **Modul Pengumuman (`/notices`)**: Sistem manajemen pengumuman untuk sekolah.

## Tahapan Implementasi

1.  **Framework UI**: Menggunakan komponen dasar dari `components/ui` yang sudah ada (mengikuti standar Tailwind/shadcn).
2.  **Integrasi API**: Setiap modul akan memanggil API melalui proxy di `/src/app/api/` sesuai dengan implementasi backend.
3.  **Prioritas**:
    *   **Prioritas 1**: Modul Siswa & Kelas (Data inti operasional sekolah).
    *   **Prioritas 2**: Modul Penilaian & Keuangan (Fitur krusial untuk operasional harian).
    *   **Prioritas 3**: Modul Mata Pelajaran & Pengumuman (Fitur pendukung).

## Validasi
-   Setiap modul akan diverifikasi menggunakan `compile_applet`.
-   Memastikan isolasi *tenant* (keamanan Firestore) tetap terjaga saat implementasi UI baru.
