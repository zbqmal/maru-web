# M8 — Photo Upload and Media

## PR 1 — Diary Photo Picker and Preview

- Add photo selection to diary entry creation/editing.
- Validate obvious client-side file type/size constraints.
- Show local previews before upload.
- Allow selected files to be removed before upload.
- Add accessible file-input behavior.
- Add component tests.

## PR 2 — Direct S3 Upload Flow

- Request a presigned upload URL from the NestJS API.
- Upload image binaries directly from the browser to S3.
- Never expose AWS credentials in the frontend.
- Show per-file upload progress/state where practical.
- Handle upload failure and retry.
- Register uploaded photo metadata with the backend after successful upload.
- Add integration tests with mocked presigned/upload requests.

## PR 3 — Diary Photo Gallery

- Render diary-entry photos.
- Add responsive image layout/gallery behavior.
- Support multiple photos.
- Add image loading/error states.
- Add photo removal for the owner where supported.
- Refresh diary/feed cache after changes.
- Add tests.

## PR 4 — Profile Image Upload

- Enable the previously deferred profile image control.
- Reuse the presigned-upload flow.
- Show preview and replacement behavior.
- Integrate profile-image update/removal.
- Add tests.
