import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerDiaryPhoto, deleteDiaryPhoto } from "@/lib/api/diary";
import {
  useRegisterDiaryPhotoMutation,
  useDeleteDiaryPhotoMutation,
} from "@/hooks/use-diary-photos";
import { diaryContextQueryKey } from "@/hooks/use-diary-context";
import { groupDailyFeedQueryKey } from "@/hooks/use-group-daily-feed";
import type { DiaryContextResponse, DiaryPhoto } from "@/lib/api/diary";

jest.mock("@/lib/api/diary", () => ({
  ...jest.requireActual("@/lib/api/diary"),
  registerDiaryPhoto: jest.fn(),
  deleteDiaryPhoto: jest.fn(),
}));

const mockRegisterDiaryPhoto = registerDiaryPhoto as jest.MockedFunction<typeof registerDiaryPhoto>;
const mockDeleteDiaryPhoto = deleteDiaryPhoto as jest.MockedFunction<typeof deleteDiaryPhoto>;

const GROUP_ID = "g1";
const DATE = "2026-08-26";

const makePhoto = (overrides: Partial<DiaryPhoto> = {}): DiaryPhoto => ({
  id: "p1",
  diaryEntryId: "e1",
  uploadedByUserId: "u1",
  storageKey: "diary-entries/e1/photos/photo.png",
  mimeType: "image/png",
  width: 800,
  height: 600,
  sizeBytes: 1024,
  displayOrder: 0,
  createdAt: "2026-08-26T00:00:00.000Z",
  ...overrides,
});

const makeContextWithEntry = (photos: DiaryPhoto[]): DiaryContextResponse => ({
  questions: [],
  entry: {
    id: "e1",
    diaryDate: DATE,
    answers: [],
    photos,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  },
});

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

describe("useRegisterDiaryPhotoMutation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("appends the registered photo to the cached diary entry", async () => {
    const qc = makeQueryClient();
    const invalidateQueries = jest.spyOn(qc, "invalidateQueries");
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    qc.setQueryData(queryKey, makeContextWithEntry([]));

    const newPhoto = makePhoto();
    mockRegisterDiaryPhoto.mockResolvedValueOnce(newPhoto);

    const { result } = renderHook(() => useRegisterDiaryPhotoMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({
        diaryEntryId: "e1",
        input: {
          storageKey: newPhoto.storageKey,
          mimeType: newPhoto.mimeType,
          width: newPhoto.width,
          height: newPhoto.height,
          sizeBytes: newPhoto.sizeBytes,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = qc.getQueryData<DiaryContextResponse>(queryKey);
    expect(updated?.entry?.photos).toEqual([newPhoto]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: groupDailyFeedQueryKey(GROUP_ID, DATE),
    });
  });

  it("calls registerDiaryPhoto with the correct arguments", async () => {
    const qc = makeQueryClient();
    qc.setQueryData(diaryContextQueryKey(GROUP_ID, DATE), makeContextWithEntry([]));
    mockRegisterDiaryPhoto.mockResolvedValueOnce(makePhoto());

    const { result } = renderHook(() => useRegisterDiaryPhotoMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({
        diaryEntryId: "e1",
        input: {
          storageKey: "diary-entries/e1/photos/photo.png",
          mimeType: "image/png",
          width: 800,
          height: 600,
          sizeBytes: 1024,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRegisterDiaryPhoto).toHaveBeenCalledWith(GROUP_ID, "e1", {
      storageKey: "diary-entries/e1/photos/photo.png",
      mimeType: "image/png",
      width: 800,
      height: 600,
      sizeBytes: 1024,
    });
  });
});

describe("useDeleteDiaryPhotoMutation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("removes the deleted photo from the cached diary entry", async () => {
    const qc = makeQueryClient();
    const invalidateQueries = jest.spyOn(qc, "invalidateQueries");
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    const photo = makePhoto();
    qc.setQueryData(queryKey, makeContextWithEntry([photo]));

    mockDeleteDiaryPhoto.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useDeleteDiaryPhotoMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ diaryEntryId: "e1", photoId: photo.id });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = qc.getQueryData<DiaryContextResponse>(queryKey);
    expect(updated?.entry?.photos).toEqual([]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: groupDailyFeedQueryKey(GROUP_ID, DATE),
    });
  });

  it("calls deleteDiaryPhoto with the correct arguments", async () => {
    const qc = makeQueryClient();
    qc.setQueryData(diaryContextQueryKey(GROUP_ID, DATE), makeContextWithEntry([makePhoto()]));
    mockDeleteDiaryPhoto.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useDeleteDiaryPhotoMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ diaryEntryId: "e1", photoId: "p1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDeleteDiaryPhoto).toHaveBeenCalledWith(GROUP_ID, "e1", "p1");
  });

  it("exposes API errors", async () => {
    const qc = makeQueryClient();
    qc.setQueryData(diaryContextQueryKey(GROUP_ID, DATE), makeContextWithEntry([makePhoto()]));

    const error = new Error("삭제 권한이 없어요.");
    mockDeleteDiaryPhoto.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDeleteDiaryPhotoMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ diaryEntryId: "e1", photoId: "p1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});
