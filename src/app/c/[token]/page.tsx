'use client';

import { use, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Camera, Check, X, CheckCircle2 } from 'lucide-react';
import { getProjectByToken, type Photo, type SelectionStatus } from '@/lib/mock-data';

export default function ClientGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const project = getProjectByToken(token);

  const [selections, setSelections] = useState<Record<string, SelectionStatus>>(() => {
    const init: Record<string, SelectionStatus> = {};
    project.photos.forEach((p) => { init[p.id] = 'pending'; });
    return init;
  });
  const [comments, setComments] = useState<Record<string, string>>({});
  const [active, setActive] = useState<Photo | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(selections).filter((s) => s === 'selected').length,
    [selections],
  );
  const total = project.photos.length;

  if (submitted) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">제출 완료!</h1>
          <p className="text-sm text-white/60">
            선택한 {selectedCount}장의 사진이 스튜디오로 전달되었어요. <br />보정 작업이 시작되면 알려드릴게요.
          </p>
        </div>
      </main>
    );
  }

  const setStatus = (id: string, status: SelectionStatus) => {
    setSelections((prev) => ({ ...prev, [id]: prev[id] === status ? 'pending' : status }));
  };

  return (
    <>
      <header className="border-b border-white/5 bg-[#0f0f17]/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
            <Camera className="h-4 w-4 text-white" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">사진 스튜디오</p>
            <p className="text-xs text-white/40">{project.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8 pb-28">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-5 mb-6">
          <h1 className="font-medium mb-1">사진을 선택하고 코멘트를 남겨주세요</h1>
          <p className="text-sm text-white/60">마음에 드는 사진을 선택하시고, 보정에 대한 요청사항을 남겨주세요.</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-white/60">
            선택 <span className="text-white font-medium">{selectedCount}</span> / {total}장
          </p>
          <div className="h-2 w-40 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
              style={{ width: `${(selectedCount / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {project.photos.map((photo) => {
            const status = selections[photo.id];
            return (
              <button
                key={photo.id}
                onClick={() => setActive(photo)}
                className={clsx(
                  'group relative overflow-hidden rounded-xl border bg-[#1a1a2e] transition',
                  status === 'selected' && 'border-emerald-500 ring-2 ring-emerald-500/30',
                  status === 'rejected' && 'border-red-500/60 opacity-60',
                  status === 'pending' && 'border-white/5 hover:border-white/20',
                )}
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.thumb_url} alt={photo.title} className="h-full w-full object-cover" />
                </div>
                {status === 'selected' && (
                  <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
                    <X className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#0f0f17]/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">{selectedCount}장 선택됨</p>
          <button
            onClick={() => setSubmitted(true)}
            disabled={selectedCount === 0}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            셀렉 제출
          </button>
        </div>
      </footer>

      {active && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[4/3] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.thumb_url.replace('/400/300', '/800/600')} alt={active.title} className="h-full w-full object-contain" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{active.title}</p>
                  <p className="text-xs text-white/50">{project.name}</p>
                </div>
                <button onClick={() => setActive(null)} className="text-white/50 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus(active.id, 'selected')}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition',
                    selections[active.id] === 'selected'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 hover:border-emerald-500/40',
                  )}
                >
                  <Check className="h-4 w-4" /> 선택
                </button>
                <button
                  onClick={() => setStatus(active.id, 'rejected')}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition',
                    selections[active.id] === 'rejected'
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-white/10 hover:border-red-500/40',
                  )}
                >
                  <X className="h-4 w-4" /> 제외
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/60">코멘트 (선택)</label>
                <textarea
                  value={comments[active.id] ?? ''}
                  onChange={(e) => setComments((prev) => ({ ...prev, [active.id]: e.target.value }))}
                  rows={3}
                  placeholder="예: 피부톤 따뜻하게, 배경 밝게..."
                  className="w-full rounded-lg border border-white/10 bg-[#0f0f17] px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
