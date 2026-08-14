"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/api/auth";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";

export const useCurrentUserQuery = () =>
  useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
  });
