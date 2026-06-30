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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
      router.push(`/admin/exercises/detail?id=${encodeURIComponent(res.data.id)}`);
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
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/exercises">
            <FiChevronLeft />
            بازگشت
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تمرین جدید</CardTitle>
          <CardDescription>فرم ایجاد تمرین جدید را تکمیل کنید.</CardDescription>
        </CardHeader>
        <CardContent>
        <ExerciseForm
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel="ایجاد تمرین"
        />
        </CardContent>
      </Card>
    </div>
  );
}
