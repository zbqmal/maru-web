import { Suspense } from "react";
import type { Metadata } from "next";
import InvitationContent from "./invitation-content";
import LoadingSpinner from "@/components/ui/loading-spinner";

export const metadata: Metadata = { title: "그룹 초대 — MARU" };

const InvitePage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <LoadingSpinner label="초대 링크를 확인하는 중..." />
        </div>
      }
    >
      <InvitationContent />
    </Suspense>
  );
};

export default InvitePage;
