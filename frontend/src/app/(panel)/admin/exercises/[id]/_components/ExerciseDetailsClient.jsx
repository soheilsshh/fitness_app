"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { FiChevronLeft, FiTrash2 } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import ExerciseForm, {
  exerciseToForm,
  formToPayload,
} from "../../_components/ExerciseForm";

export default function ExerciseDetailsClient({ id }) {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/exercises/${id}`);
      setForm(exerciseToForm(res.data));
    } catch {
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    try {
      const res = await api.patch(
        `/admin/exercises/${id}`,
        formToPayload(form, { isEdit: true })
      );
      setForm(exerciseToForm(res.data));
      await Swal.fire({
        icon: "success",
        title: "ذخیره شد",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch (err) {
      const message = err?.response?.data?.error || "بروزرسانی انجام نشد.";
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

  const onDelete = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "حذف تمرین؟",
      text: "این عمل قابل بازگشت نیست.",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "انصراف",
      confirmButtonColor: "#f43f5e",
      background: "#0a0a0a",
      color: "#fff",
    });
    if (!result.isConfirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/exercises/${id}`);
      await Swal.fire({
        icon: "success",
        title: "حذف شد",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
      router.push("/admin/exercises");
    } catch {
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: "حذف انجام نشد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-400">
        در حال بارگذاری...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
        تمرین پیدا نشد.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/exercises"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10"
          >
            <FiChevronLeft />
            بازگشت
          </Link>
          <div className="text-lg font-extrabold text-white">{form.name}</div>
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-200 hover:bg-rose-400/15 disabled:opacity-50"
        >
          <FiTrash2 />
          {deleting ? "در حال حذف..." : "حذف"}
        </button>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
        <ExerciseForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel="ذخیره تغییرات"
          isEdit
        />
      </div>
    </div>
  );
}
