export type ProjectStatus = 'draft' | 'selecting' | 'selection_done' | 'studio_editing' | 'client_reviewing' | 'completed'
export type SelectionStatus = 'selected' | 'pending'

export interface Project {
  id: string
  studio_id: string
  name: string
  client_name: string
  client_email: string
  deadline: string | null
  custom_message: string | null
  status: ProjectStatus
  share_token: string
  drive_link: string | null
  drive_link_originals: string | null
  revision_used: boolean
  unread_for_studio: boolean
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  project_id: string
  storage_path: string
  filename: string
  sort_order: number
  width: number | null
  height: number | null
  size_bytes: number | null
  created_at: string
}

export interface RetouchedPhoto {
  id: string
  project_id: string
  storage_path: string
  filename: string
  sort_order: number
  created_at: string
}

export interface Selection {
  id: string
  project_id: string
  photo_id: string
  status: SelectionStatus
  comment: string | null
  submitted_at: string | null
}

export interface Annotation {
  id: string
  project_id: string
  photo_id: string
  pin_number: number
  x_pct: number
  y_pct: number
  comment: string | null
  created_at: string
}

export interface RevisionRequest {
  id: string
  project_id: string
  message: string
  created_at: string
}

export interface RevisionSelection {
  id: string
  project_id: string
  retouched_photo_id: string
  comment: string | null
  created_at: string
}

export interface RevisionAnnotation {
  id: string
  project_id: string
  retouched_photo_id: string
  pin_number: number
  x_pct: number
  y_pct: number
  comment: string | null
  created_at: string
}

export interface Submission {
  id: string
  project_id: string
  selected_count: number
  total_count: number
  pin_count: number
  created_at: string
}

export interface Notification {
  id: string
  studio_id: string
  project_id: string | null
  type: 'selection_submitted' | 'revision_requested'
  message: string
  is_read: boolean
  created_at: string
}

export interface PhotoWithUrl extends Photo {
  signedUrl: string
}

export interface RetouchedPhotoWithUrl extends RetouchedPhoto {
  signedUrl: string
}

export interface AnnotationPin {
  id?: string
  pin_number: number
  x_pct: number
  y_pct: number
  comment: string
}

export interface SubmitPayload {
  selectedPhotoIds: string[]
  annotations: Record<string, AnnotationPin[]> // photoId -> pins
}
