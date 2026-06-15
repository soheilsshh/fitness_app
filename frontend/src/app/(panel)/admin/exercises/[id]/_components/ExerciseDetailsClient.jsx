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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div dir="rtl" className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-4 text-sm text-muted-foreground">
        تمرین پیدا نشد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/exercises">
              <FiChevronLeft />
              بازگشت
            </Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          <FiTrash2 />
          {deleting ? "در حال حذف..." : "حذف"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          <CardDescription>ویرایش جزئیات تمرین</CardDescription>
        </CardHeader>
        <CardContent>
        <ExerciseForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel="ذخیره تغییرات"
          isEdit
        />
        </CardContent>
      </Card>
    </div>
  );
}
