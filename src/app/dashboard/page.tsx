'use client';

import Link from 'next/link';
import { Plus, FolderKanban, Package, Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import { projects, stats } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">안녕하세요, 스튜디오님</h1>
            <p className="mt-1 text-sm text-white/50">오늘도 멋진 사진 부탁드려요</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2 text-sm font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> 새 프로젝트
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
          <StatCard icon={<FolderKanban className="h-5 w-5" />} label="활성 프로젝트" value={stats.active} tint="violet" />
          <StatCard icon={<Package className="h-5 w-5" />} label="이번달 납품" value={stats.monthlyDelivered} tint="blue" />
          <StatCard icon={<Clock className="h-5 w-5" />} label="셀렉 대기중" value={stats.pendingSelection} tint="emerald" />
        </div>

        <h2 className="text-sm font-medium text-white/60 mb-3">프로젝트</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-2xl border border-white/5 bg-[#1a1a2e] p-5 hover:border-violet-500/40 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">{p.client}</p>
                  <h3 className="font-medium group-hover:text-violet-300 transition">{p.name}</h3>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {p.shootDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> {p.photoCount}장
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon, label, value, tint,
}: { icon: React.ReactNode; label: string; value: number; tint: 'violet' | 'blue' | 'emerald' }) {
  const tints = {
    violet: 'bg-violet-500/15 text-violet-400',
    blue: 'bg-blue-500/15 text-blue-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
  };
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tints[tint]} mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
