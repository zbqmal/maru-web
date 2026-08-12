"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query/query-client";

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;
