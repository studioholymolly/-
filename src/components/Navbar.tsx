'use client';

import Link from 'next/link';
import { Camera } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b border-white/5 bg-[#0f0f17]/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
            <Camera className="h-4 w-4 text-white" />
          </span>
          <span className="font-semibold">사진 스튜디오</span>
        </Link>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <span>스튜디오님</span>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
        </div>
      </div>
    </header>
  );
}
