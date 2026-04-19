export type ProjectStatus = 'selecting' | 'editing' | 'done';
export type SelectionStatus = 'selected' | 'rejected' | 'pending';

export interface Photo {
  id: string;
  title: string;
  thumb_url: string;
  selection: SelectionStatus;
  comment?: string;
}

export interface Comment {
  id: string;
  photoId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Version {
  id: string;
  label: string;
  status: 'done' | 'progress';
  uploadedAt: string;
  photoCount: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  shootDate: string;
  status: ProjectStatus;
  photoCount: number;
  photos: Photo[];
  comments: Comment[];
  versions: Version[];
}

const makePhotos = (seedPrefix: string, count: number, selections: SelectionStatus[]): Photo[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${seedPrefix}-${i + 1}`,
    title: `IMG_${String(i + 1).padStart(4, '0')}`,
    thumb_url: `https://picsum.photos/seed/${seedPrefix}${i + 1}/400/300`,
    selection: selections[i] ?? 'pending',
  }));

export const projects: Project[] = [
  {
    id: 'p1',
    name: '김민수 · 이서연 웨딩',
    client: '김민수 / 이서연',
    shootDate: '2026-04-12',
    status: 'selecting',
    photoCount: 10,
    photos: makePhotos('wedding', 10, [
      'selected', 'pending', 'selected', 'rejected', 'pending',
      'selected', 'pending', 'rejected', 'pending', 'selected',
    ]),
    comments: [
      { id: 'c1', photoId: 'wedding-1', author: '신부', text: '이 컷 너무 좋아요! 액자로 쓸게요', createdAt: '2026-04-15' },
      { id: 'c2', photoId: 'wedding-3', author: '신부', text: '표정 조금만 밝게 보정 가능할까요?', createdAt: '2026-04-15' },
      { id: 'c3', photoId: 'wedding-6', author: '신랑', text: '배경 사람 지워주세요', createdAt: '2026-04-16' },
    ],
    versions: [],
  },
  {
    id: 'p2',
    name: '박지우 프로필 촬영',
    client: '박지우',
    shootDate: '2026-03-28',
    status: 'editing',
    photoCount: 8,
    photos: makePhotos('profile', 8, [
      'selected', 'selected', 'rejected', 'selected',
      'selected', 'pending', 'selected', 'rejected',
    ]),
    comments: [
      { id: 'c4', photoId: 'profile-1', author: '고객', text: '피부톤 좀 더 따뜻하게', createdAt: '2026-04-01' },
    ],
    versions: [
      { id: 'v1', label: 'v1', status: 'done', uploadedAt: '2026-04-05', photoCount: 5 },
      { id: 'v2', label: 'v2', status: 'progress', uploadedAt: '2026-04-15', photoCount: 5 },
    ],
  },
  {
    id: 'p3',
    name: '이현우 가족 사진',
    client: '이현우 가족',
    shootDate: '2026-02-14',
    status: 'done',
    photoCount: 12,
    photos: makePhotos('family', 12, [
      'selected', 'selected', 'selected', 'rejected', 'selected', 'selected',
      'rejected', 'selected', 'selected', 'pending', 'selected', 'selected',
    ]),
    comments: [
      { id: 'c5', photoId: 'family-2', author: '고객', text: '감사합니다!', createdAt: '2026-03-01' },
    ],
    versions: [
      { id: 'v1', label: 'v1', status: 'done', uploadedAt: '2026-02-20', photoCount: 9 },
      { id: 'v2', label: 'v2 (최종)', status: 'done', uploadedAt: '2026-02-25', photoCount: 9 },
    ],
  },
];

export const getProject = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

export const getProjectByToken = (_token: string): Project =>
  projects[0];

export const statusLabel: Record<ProjectStatus, string> = {
  selecting: '셀렉중',
  editing: '보정중',
  done: '완료',
};

export const stats = {
  active: 2,
  monthlyDelivered: 4,
  pendingSelection: 1,
};
