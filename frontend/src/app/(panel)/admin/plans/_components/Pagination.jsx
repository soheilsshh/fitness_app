"use client";

import PanelPagination from "@/app/(panel)/_shared/Pagination";

export default function Pagination({ page, totalPages, onChange, onPage }) {
  const handlePage = onChange || onPage;
  if (!handlePage) return null;

  return (
    <PanelPagination page={page} totalPages={totalPages} onPage={handlePage} />
  );
}
