export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export const uploadFileToPresignedUrl = (
  uploadUrl: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
) =>
  new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      onProgress?.({
        percent: Math.min(99, Math.round((event.loaded / event.total) * 100)),
        loaded: event.loaded,
        total: event.total,
      });
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.({ percent: 100, loaded: file.size, total: file.size });
        resolve();
        return;
      }

      reject(new Error("사진 업로드에 실패했어요."));
    };

    request.onerror = () => reject(new Error("사진 업로드에 실패했어요."));
    request.onabort = () => reject(new Error("사진 업로드가 취소되었어요."));
    request.ontimeout = () => reject(new Error("사진 업로드 시간이 초과되었어요."));

    request.open("PUT", uploadUrl);
    request.withCredentials = false;
    request.setRequestHeader("Content-Type", file.type);
    request.send(file);
  });
