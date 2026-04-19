'use client';

import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import type { Photo } from '@/lib/mock-data';

interface Props {
  photos: Photo[];
  columns?: 3 | 4;
  onPhotoClick?: (photo: Photo) => void;
  showSelectionBorders?: boolean;
}

export default function PhotoGrid({
  photos,
  columns = 4,
  onPhotoClick,
  showSelectionBorders = true,
}: Props) {
  return (
    <div
      className={clsx(
        'grid gap-4',
        columns === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      )}
    >
      {photos.map((photo) => {
        const selected = photo.selection === 'selected';
        const rejected = photo.selection === 'rejected';
        return (
          <button
            key={photo.id}
            onClick={() => onPhotoClick?.(photo)}
            className={clsx(
              'group relative overflow-hidden rounded-xl border bg-[#1a1a2e] text-left transition',
              showSelectionBorders && selected && 'border-emerald-500 ring-2 ring-emerald-500/30',
              showSelectionBorders && rejected && 'border-red-500/60',
              (!showSelectionBorders || (!selected && !rejected)) && 'border-white/5 hover:border-white/20',
            )}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-violet-900/30 to-blue-900/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumb_url}
                alt={photo.title}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
            {showSelectionBorders && selected && (
              <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" />
              </span>
            )}
            {showSelectionBorders && rejected && (
              <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
                <X className="h-4 w-4" />
              </span>
            )}
            <div className="flex items-center justify-between px-3 py-2 text-xs text-white/60">
              <span>{photo.title}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
