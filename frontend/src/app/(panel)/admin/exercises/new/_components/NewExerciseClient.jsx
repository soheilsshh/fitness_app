"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { FiChevronLeft } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import ExerciseForm, {
  buildEmptyExercise,
  formToPayload,
} from "@/app/(panel)/admin/exercises/_components/ExerciseForm";

export default function NewExerciseClient() {
  const router = useRouter();
  const [form, setForm] = useState(buildEmptyExercise);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/admin/exercises", formToPayload(form));
      await Swal.fire({
        icon: "success",
        title: "ذخیره شد",
        text: "تمرین جدید ایجاد شد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
      router.push(`/admin/exercises/${res.data.id}`);
    } catch (err) {
      const message =
        err?.response?.data?.error || "ایجاد تمرین انجام نشد.";
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: message,
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
        >
          <FiChevronLeft />
          بازگشت
        </Link>
        <div className="text-lg font-extrabold text-white">تمرین جدید</div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <ExerciseForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel="ایجاد تمرین"
        />
      </div>
    </div>
  );
}
