'use client';

import { ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImpersonationBannerProps {
  operatorName: string;
  targetName: string;
  onEnd: () => void;
}

export function ImpersonationBanner({ operatorName, targetName, onEnd }: ImpersonationBannerProps) {
  return (
    <div className="bg-rose-600 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4" />
        <span className="font-semibold">Mode Impersonate Aktif:</span>
        <span>
          Operator <strong>{operatorName}</strong> sedang menyamar sebagai <strong>{targetName}</strong>.
        </span>
      </div>
      <Button 
        variant="ghost" 
        onClick={onEnd}
        className="h-8 px-3 text-white hover:bg-rose-700 hover:text-white"
      >
        <X className="mr-2 size-3.5" />
        Akhiri Impersonasi
      </Button>
    </div>
  );
}
