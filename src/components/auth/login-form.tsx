"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { getFirebaseAuth, getFirebaseConfigDiagnostics } from '@/lib/firebase';
import { storePortalToken } from '@/lib/portal-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const diagnostics = getFirebaseConfigDiagnostics();
  const firebaseReady = diagnostics.isConfigured;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
        if (!firebaseReady) {
          const details = diagnostics.missingVariables.length
            ? diagnostics.missingVariables.join(', ')
            : diagnostics.placeholderVariables.join(', ');
          throw new Error(
            `Konfigurasi Firebase belum lengkap (${details}). Harap lengkapi .env.local sebelum login.`,
          );
        }

        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const tokenResult = await credential.user.getIdTokenResult(true);
        const token = tokenResult.token;

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? 'Gagal membuat sesi Super Admin');
      }

      const data: any = await response.json();
      const sessionJwt = data.token;
      await storePortalToken(sessionJwt || token);
      toast.success('Selamat datang kembali');
      const targetUrl = sessionJwt ? `/dashboard?session=${encodeURIComponent(sessionJwt)}` : '/dashboard';
      window.location.href = targetUrl;
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Login gagal';
      if (
        message.includes('auth/api-key-not-valid') ||
        message.includes('api-key-not-valid') ||
        message.includes('please-pass-a-valid-api-key')
      ) {
        message =
          'Firebase API Key tidak valid atau belum diisi. Pastikan variabel NEXT_PUBLIC_FIREBASE_API_KEY di .env.local berisi API key resmi Firebase.';
      } else if (
        message.includes('auth/invalid-credential') ||
        message.includes('auth/user-not-found') ||
        message.includes('auth/wrong-password')
      ) {
        message = 'Email atau kata sandi tidak sesuai.';
      } else if (
        message.includes('auth/operation-not-allowed') ||
        message.includes('operation-not-allowed')
      ) {
        message =
          'Provider Email/Password belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > Sign-in method, lalu aktifkan opsi "Email/Password".';
      } else if (message.includes('auth/network-request-failed')) {
        message = 'Gagal terhubung ke layanan Firebase. Periksa koneksi internet Anda.';
      }
      toast.error(message, { duration: 8000 });
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6 text-left">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a2b3b]">
          Selamat Datang
        </h1>
        <p className="mt-2 text-sm text-[#7c8b9a]">
          Silakan masuk dengan akun terdaftar Anda.
        </p>
      </div>

      {/* Generic Login branding or remove if not needed */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-gray-900 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gray-500" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Akses Portal
            </h4>
            <p className="mt-1 text-xs text-gray-600">
              Gunakan akun resmi sekolah Anda untuk masuk ke sistem.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-[#7c8b9a]">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-[#eef1f5] bg-white px-4 text-sm text-[#1a2b3b] shadow-none placeholder:text-[#a0aec0] focus-visible:border-[#e56464] focus-visible:ring-1 focus-visible:ring-[#e56464]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-[#7c8b9a]">
              Password
            </Label>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-[#eef1f5] bg-white px-4 text-sm text-[#1a2b3b] shadow-none placeholder:text-[#a0aec0] focus-visible:border-[#e56464] focus-visible:ring-1 focus-visible:ring-[#e56464]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            defaultChecked
            className="size-4 rounded border-[#eef1f5] text-[#e56464] focus:ring-[#e56464]/20"
          />
          <Label htmlFor="remember" className="text-xs font-medium text-[#7c8b9a]">
            Remember this computer
          </Label>
        </div>

        <Button
          type="submit"
          className="coral-btn h-12 w-full rounded-xl text-base font-semibold shadow-none"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            "Log In"
          )}
        </Button>
      </form>
    </div>
  );
}
