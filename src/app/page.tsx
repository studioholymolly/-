'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Camera } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@studio.kr');
  const [password, setPassword] = useState('demo1234');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
            <Camera className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">사진 스튜디오</h1>
          <p className="text-sm text-white/50">클라이언트 협업 플랫폼</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-white/5 bg-[#1a1a2e] p-6">
          <div>
            <label className="mb-1.5 block text-xs text-white/60">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f0f17] px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              placeholder="email@studio.kr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/60">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f0f17] px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            로그인
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          데모 계정: demo@studio.kr / demo1234
        </p>
      </div>
    </main>
  );
}
