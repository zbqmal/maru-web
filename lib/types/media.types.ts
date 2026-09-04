export interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

export interface PhotoUploadState {
  status: "idle" | "requesting" | "uploading" | "uploaded" | "failed";
  progress: number;
  storageKey?: string;
  error?: string;
}
