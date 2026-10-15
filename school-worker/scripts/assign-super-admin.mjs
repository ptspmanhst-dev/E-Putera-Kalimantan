#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const result = {};
  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const cleaned = line.startsWith('export ') ? line.slice(7) : line;
    const equalsIndex = cleaned.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = cleaned.slice(0, equalsIndex).trim();
    let value = cleaned.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function loadEnv() {
  return {
    ...parseEnvFile(path.join(repoRoot, '.env.local')),
    ...parseEnvFile(path.join(repoRoot, 'school-worker', '.dev.vars')),
  };
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function findServiceAccount() {
  const envKey =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envKey && existsSync(envKey)) return envKey;

  const candidates = [
    path.join(repoRoot, 'service-account.json'),
    path.join(repoRoot, 'firebase-service-account.json'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  const files = readdirSync(repoRoot).filter(
    (f) => f.endsWith('.json') && (f.includes('adminsdk') || f.includes('service-account'))
  );
  return files.length > 0 ? path.join(repoRoot, files[0]) : null;
}

async function main() {
  const env = loadEnv();
  const targetEmail = process.argv[2]?.trim().toLowerCase();
  const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

  if (!targetEmail || targetEmail.startsWith('-')) {
    console.log('\n=============================================================');
    console.log(' Prosedur Otorisasi Super Admin (Operasi Terkendali)');
    console.log('=============================================================');
    console.log('Penggunaan:');
    console.log('  cd school-worker && node scripts/assign-super-admin.mjs <email-pengguna>');
    console.log('Contoh:');
    console.log('  cd school-worker && node scripts/assign-super-admin.mjs ptspmanhst@gmail.com\n');
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || 'dev-mechanic-jq6d2';
  const saPath = findServiceAccount();

  if (!saPath) {
    console.error('\n❌ Kunci Service Account Firebase belum ditemukan.');
    console.error('Langkah mengunduhnya:');
    console.error(`1. Buka Firebase Console > Project Settings > Service accounts:`);
    console.error(`   https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`);
    console.error('2. Klik tombol "Generate new private key" (Hasilkan kunci privat baru).');
    console.error('3. Simpan berkas JSON tersebut di root proyek dengan nama: service-account.json');
    console.error('4. Jalankan kembali perintah ini:');
    console.error(`   cd school-worker && node scripts/assign-super-admin.mjs ${targetEmail}\n`);
    process.exit(1);
  }

  const saContent = JSON.parse(readFileSync(saPath, 'utf8'));
  initializeApp({
    credential: cert(saContent),
    projectId,
  });

  const auth = getAuth();
  console.log(`\n🔍 Memverifikasi data pengguna di project "${projectId}"...`);

  let user;
  try {
    user = await auth.getUserByEmail(targetEmail);
  } catch (err) {
    if (err?.code === 'auth/user-not-found') {
      console.error(`\n❌ Pengguna dengan email "${targetEmail}" TIDAK DITEMUKAN di Firebase Authentication.`);
      console.error('Pastikan pengguna telah mendaftar / dibuat di menu Authentication > Users terlebih dahulu.\n');
      process.exit(1);
    }
    throw err;
  }

  const existingClaims = user.customClaims || {};

  console.log('\n-------------------------------------------------------------');
  console.log(' VERIFIKASI IDENTITAS PENGGUNA TERPERIKSA:');
  console.log(` - Email       : ${user.email}`);
  console.log(` - UID         : ${user.uid}`);
  console.log(` - Email Verified: ${user.emailVerified ? 'Ya' : 'Belum'}`);
  console.log(` - Project ID  : ${projectId}`);
  console.log(' - Klaim saat ini:');
  console.log(JSON.stringify(existingClaims, null, 2));
  console.log('-------------------------------------------------------------');

  if (existingClaims.super_admin === true) {
    console.log('\nℹ️ Akun ini SUDAH memiliki custom claim super_admin: true.');
    console.log('Jika aplikasi masih menampilkan error, silakan logout dan login kembali untuk memperbarui ID token JWT.\n');
    process.exit(0);
  }

  // Preserve existing claims to prevent overwriting other important permissions
  const updatedClaims = {
    ...existingClaims,
    super_admin: true,
    role: 'super_admin',
  };

  console.log('\nKlaim baru yang akan disimpan (klaim lama dipertahankan):');
  console.log(JSON.stringify(updatedClaims, null, 2));

  if (!autoConfirm) {
    const confirmation = await prompt('\n⚠️ Konfirmasi eksplisit: Tetapkan hak akses Super Admin untuk UID di atas? (Ketik "YA" untuk konfirmasi): ');
    if (confirmation !== 'YA' && confirmation !== 'ya') {
      console.log('\n❌ Tindakan dibatalkan. Tidak ada perubahan yang dilakukan pada akun.\n');
      process.exit(0);
    }
  }

  console.log('\n🔐 Menyimpan custom claims ke Firebase Authentication...');
  await auth.setCustomUserClaims(user.uid, updatedClaims);

  const refreshedUser = await auth.getUser(user.uid);
  const verifiedClaims = refreshedUser.customClaims || {};

  if (verifiedClaims.super_admin !== true) {
    throw new Error('Gagal memverifikasi penyimpanan klaim super_admin pada Firebase.');
  }

  console.log('\n✅ BERHASIL!');
  console.log(`Hak akses Super Admin (super_admin: true) telah diverifikasi dan aktif untuk UID ${user.uid}.`);
  console.log('💡 Penting: Pengguna wajib logout dan login kembali agar token sesi Firebase diperbarui dengan klaim baru.\n');
}

main().catch((err) => {
  console.error('\nTerjadi kesalahan tak terduga:', err);
  process.exit(1);
});
