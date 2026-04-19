'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { ArrowLeft, Link2, Check, CircleSlash, MessageSquare, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import PhotoGrid from '@/components/PhotoGrid';
import { getProject } from '@/lib/mock-data';

type Tab = 'originals' | 'selects' | 'versions';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = getProject(id);
  const [tab, setTab] = useState<Tab>('originals');
  const [copied, setCopied] = useState(false);

  if (!project) {
    return (
      <>
        <Navbar />
        <main className="flex-1 mx-auto max-w-6xl px-6 py-12">
          <p className="text-white/60">프로젝트를 찾을 수 없습니다.</p>
          <Link href="/dashboard" className="text-violet-400 text-sm">← 대시보드로</Link>
        </main>
      </>
    );
  }

  const selected = project.photos.filter((p) => p.selection === 'selected');

  const copyShareLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/demo-token`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> 대시보드
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-white/50">{project.client} · {project.shootDate}</p>
          </div>
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a2e] px-3 py-2 text-sm hover:border-violet-500/40 transition"
          >
            <Link2 className="h-4 w-4" />
            {copied ? '복사됨!' : '공유 링크 복사'}
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/5 mb-6">
          <TabBtn active={tab === 'originals'} onClick={() => setTab('originals')}>원본 사진</TabBtn>
          <TabBtn active={tab === 'selects'} onClick={() => setTab('selects')}>클라이언트 셀렉</TabBtn>
          <TabBtn active={tab === 'versions'} onClick={() => setTab('versions')}>보정본 업로드</TabBtn>
        </div>

        {tab === 'originals' && <PhotoGrid photos={project.photos} />}

        {tab === 'selects' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span>선택된 사진 {selected.length}장</span>
              <span className="text-white/20">·</span>
              <span>코멘트 {project.comments.length}개</span>
            </div>
            <PhotoGrid photos={selected} />
            <div>
              <h3 className="text-sm font-medium mb-3">클라이언트 코멘트</h3>
              <div className="space-y-2">
                {project.comments.map((c) => (
                  <div key={c.id} className="rounded-xl border border-white/5 bg-[#1a1a2e] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-violet-400" />
                      <span className="text-sm font-medium">{c.author}</span>
                      <span className="text-xs text-white/40">· {c.photoId}</span>
                      <span className="ml-auto text-xs text-white/40">{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-white/80">{c.text}</p>
                    <div className="mt-3 flex gap-2">
                      <button className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20">
                        <CircleSlash className="h-3.5 w-3.5" /> Hold
                      </button>
                      <button className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
                {project.comments.length === 0 && (
                  <p className="text-sm text-white/40">아직 코멘트가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'versions' && (
          <div className="space-y-4">
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a2e] px-4 py-2 text-sm hover:border-violet-500/40">
              <Upload className="h-4 w-4" /> 새 버전 업로드
            </button>
            <div className="relative space-y-3 border-l border-white/10 pl-6">
              {project.versions.length === 0 && (
                <p className="text-sm text-white/40">아직 업로드된 버전이 없습니다.</p>
              )}
              {project.versions.map((v) => (
                <div key={v.id} className="relative rounded-xl border border-white/5 bg-[#1a1a2e] p-4">
                  <span
                    className={clsx(
                      'absolute -left-[34px] top-5 flex h-6 w-6 items-center justify-center rounded-full',
                      v.status === 'done' ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white',
                    )}
                  >
                    {v.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{v.label}</p>
                      <p className="text-xs text-white/50 mt-0.5">{v.uploadedAt} · {v.photoCount}장</p>
                    </div>
                    <span
                      className={clsx(
                        'rounded-full border px-2.5 py-0.5 text-xs',
                        v.status === 'done'
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                          : 'border-violet-500/30 bg-violet-500/15 text-violet-400',
                      )}
                    >
                      {v.status === 'done' ? '완료' : '진행중'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2.5 text-sm border-b-2 -mb-px transition',
        active ? 'border-violet-500 text-white' : 'border-transparent text-white/50 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
