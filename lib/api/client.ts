import { ApiError } from "@/lib/api/errors";

type RequestBody = BodyInit | Record<string, unknown> | unknown[] | null;

type ApiRequestOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: RequestBody;
};

const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is required.");
  }

  return baseUrl.replace(/\/$/, "");
};

const isJsonContentType = (contentType: string | null) => contentType?.includes("application/json");

const parseResponseData = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (isJsonContentType(contentType)) {
    return response.json();
  }

  return response.text();
};

const getRequestBody = (body: RequestBody | undefined, headers: Headers) => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof FormData || typeof body === "string" || body instanceof URLSearchParams) {
    return body;
  }

  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
};

const getErrorMessage = (fallbackMessage: string, errorData: unknown) => {
  if (typeof errorData === "string") {
    return errorData;
  }

  if (typeof errorData !== "object" || errorData === null) {
    return fallbackMessage;
  }

  if ("message" in errorData) {
    const message = errorData.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return fallbackMessage;
};

export const apiRequest = async <TResponse>(path: string, options: ApiRequestOptions = {}) => {
  const { body, headers: rawHeaders, ...requestInit } = options;
  const headers = new Headers(rawHeaders);
  headers.set("Accept", "application/json");

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...requestInit,
    body: getRequestBody(body, headers),
    headers,
    credentials: "include",
  });

  const data = await parseResponseData(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage("Failed to process request.", data), response.status, data);
  }

  return data as TResponse;
};
