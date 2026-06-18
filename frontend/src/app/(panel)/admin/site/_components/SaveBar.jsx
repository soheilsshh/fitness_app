"use client";

import { FiSave } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function SaveBar({ saving, onSave }) {
  return (
    <Button
      type="button"
      onClick={onSave}
      disabled={saving}
    >
      <FiSave />
      {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
    </Button>
  );
}
