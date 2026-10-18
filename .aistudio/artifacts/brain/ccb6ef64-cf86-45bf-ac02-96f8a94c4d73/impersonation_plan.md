# Plan Implementasi Fitur Impersonate

Fitur ini memungkinkan operator yang berwenang (misal: Developer) untuk masuk ke konteks akun pengguna lain untuk dukungan teknis atau pemeriksaan, dengan tetap menjaga jejak audit yang ketat.

## Komponen Teknis

1.  **Impersonation Engine (Server-side)**:
    *   Endpoint API `/api/super-admin/impersonate` (POST) untuk memulai sesi.
    *   Endpoint API `/api/super-admin/impersonate/end` (POST) untuk mengakhiri sesi.
    *   Penyimpanan sesi sementara di database D1 dengan pencatatan `original_operator_uid` dan `target_user_uid`.
2.  **Middleware RBAC/ABAC**:
    *   Memperbarui `auth-guards.ts` untuk memeriksa apakah sesi aktif adalah impersonasi.
    *   Jika aktif, sistem akan menggunakan `target_user` sebagai konteks otorisasi, tetapi *request* tetap dicatat atas nama `original_operator`.
3.  **Audit Trail (D1)**:
    *   Semua aksi selama sesi impersonasi dicatat dalam tabel `AuditLogs` di D1.
4.  **UI/UX**:
    *   Penambahan status impersonasi pada `AppShell`.
    *   Perubahan warna header saat impersonasi aktif (misal: `#f43f5e` - rose).

## Alur Implementasi

1.  **Backend (D1)**: Menambahkan tabel `ImpersonationSessions` untuk melacak sesi aktif.
2.  **API**: Implementasi logic pembuatan token impersonasi yang berisi klaim `impersonating: true`.
3.  **Frontend**: 
    *   Menambahkan tombol "Impersonate" di halaman `User Detail`.
    *   Modifikasi `AppShell` untuk mendeteksi token impersonasi dan mengubah warna tema.
4.  **Audit**: Memastikan setiap permintaan API melewati *interceptor* audit di backend.

## Keamanan
- Sesi berakhir otomatis saat browser ditutup (session cookie).
- Setiap aksi memiliki log audit di D1 dengan detail operator asli dan target.
- Tidak ada peningkatan hak akses permanen (hanya sesi sementara).
