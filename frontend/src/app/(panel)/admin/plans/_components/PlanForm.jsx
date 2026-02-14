"use client";

import { useMemo, useState } from "react";
import { FiSave, FiPercent, FiTag } from "react-icons/fi";

function cn(...xs) {
    return xs.filter(Boolean).join(" ");
}

function formatNumber(v) {
    try {
        return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
    } catch {
        return String(v ?? 0);
    }
}

function formatWithSeparator(v) {
    const num = Number(String(v).replace(/,/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US");
}

function removeSeparator(v) {
    return String(v).replace(/,/g, "");
}

function PriceField({ label, value, onChange }) {
    const [display, setDisplay] = useState(formatWithSeparator(value || ""));

    const handleChange = (e) => {
        const raw = removeSeparator(e.target.value);
        if (!/^\d*$/.test(raw)) return; // فقط عدد

        setDisplay(formatWithSeparator(raw));
        onChange(Number(raw));
    };

    return (
        <label className="block">
            <div className="mb-2 text-[11px] font-bold text-zinc-400">{label}</div>
            <input
                value={display}
                onChange={handleChange}
                inputMode="numeric"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="مثال: 2,400,000"
            />
        </label>
    );
}




export default function PlanForm({ mode = "create", initialValue, onSubmit, submitText }) {
    const [value, setValue] = useState(initialValue);

    const price = Number(value.price || 0);
    const discountPrice = Number(value.discountPrice || 0);
    const discountPercent = Number(value.discountPercent || 0);
    const durationDays = Number(value.durationDays || 0);


    const computed = useMemo(() => {
        const finalPrice = discountPrice > 0 ? discountPrice : price;
        const hasDiscount = discountPercent > 0 || discountPrice > 0;
        return { finalPrice, hasDiscount };
    }, [price, discountPrice, discountPercent]);

    const setField = (k, v) => setValue((p) => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...value,
            price: Number(value.price || 0),
            discountPrice: Number(value.discountPrice || 0),
            discountPercent: Number(value.discountPercent || 0),
            durationDays: Number(value.durationDays || 0), // NEW
        };


        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header card */}
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="text-base font-extrabold text-white">اطلاعات پلن</div>
                        <div className="mt-1 text-sm text-zinc-300">
                            عنوان، توضیحات و اطلاعات قیمت‌گذاری
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Price box */}
                        <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-[11px] text-zinc-300">
                            <div className="flex items-center gap-2">
                                <FiTag className="text-emerald-200" />
                                قیمت نهایی:{" "}
                                <span className="font-extrabold text-white">
                                    {formatNumber(computed.finalPrice)}
                                </span>
                            </div>
                            <div className="mt-2 text-zinc-400">
                                {computed.hasDiscount ? "دارای تخفیف" : "بدون تخفیف"}
                            </div>
                        </div>

                        {/* ✅ Plan type box */}
                        <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 text-[11px] text-zinc-300">
                            <div className="mb-2 text-zinc-400">نوع پلن</div>

                            <div className="inline-flex overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                <PlanTypeBtn
                                    active={value.planType === "workout"}
                                    onClick={() => setField("planType", "workout")}
                                >
                                    تمرین
                                </PlanTypeBtn>

                                <PlanTypeBtn
                                    active={value.planType === "nutrition"}
                                    onClick={() => setField("planType", "nutrition")}
                                >
                                    تغذیه
                                </PlanTypeBtn>

                                <PlanTypeBtn
                                    active={value.planType === "both"}
                                    onClick={() => setField("planType", "both")}
                                >
                                    هر دو
                                </PlanTypeBtn>
                            </div>

                        </div>
                    </div>
                </div>


                {/* Fields */}
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
                        <Field
                            label="عنوان"
                            value={value.title}
                            onChange={(v) => setField("title", v)}
                            placeholder="مثال: پلن حرفه‌ای"
                            required
                        />

                        <Field
                            label="اسم دوره"
                            value={value.courseName}
                            onChange={(v) => setField("courseName", v)}
                            placeholder="مثال: دوره بدنسازی ۸ هفته‌ای"
                        />


                        <div className="md:col-span-2">
                            <TextArea
                                label="توضیحات"
                                value={value.description}
                                onChange={(v) => setField("description", v)}
                                placeholder="توضیحات دوره را بنویسید..."
                                rows={5}
                            />
                        </div>


                        <div className="md:col-span-2">
                            <TextArea
                                label="ویژگی‌های دوره / متن توضیحی"
                                value={value.featuresText}
                                onChange={(v) => setField("featuresText", v)}
                                placeholder={"هر خط یک ویژگی...\n• دسترسی کامل\n• پشتیبانی\n• ..."}
                                rows={6}
                            />
                        </div>
                    </div>


                    <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4 space-y-3">
                        <div className="text-sm font-extrabold text-white">قیمت‌گذاری</div>


                        <Field
                            label="مدت زمان دوره (روز)"
                            value={String(value.durationDays ?? "")}
                            onChange={(v) => setField("durationDays", v.replace(/[^\d]/g, ""))}
                            type="text"
                            placeholder="مثال: 30"
                        />

                        <PriceField
                            label="قیمت اصلی"
                            value={value.price}
                            onChange={(num) => setField("price", num)}
                        />

                        <PriceField
                            label="قیمت با تخفیف"
                            value={value.discountPrice}
                            onChange={(num) => setField("discountPrice", num)}
                        />




                        <Field
                            label="درصد تخفیف"
                            icon={<FiPercent />}
                            value={String(value.discountPercent ?? "")}
                            onChange={(v) => setField("discountPercent", v)}
                            type="number"
                            placeholder="مثال: 20"
                        />

                        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-200">
                            <input
                                type="checkbox"
                                checked={Boolean(value.isPopular)}
                                onChange={(e) => setField("isPopular", e.target.checked)}
                                className="h-4 w-4"
                            />
                            <span className="font-bold">پلن محبوب (Popular)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end">
                <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                >
                    <FiSave />
                    {submitText || (mode === "create" ? "ساخت پلن" : "ذخیره تغییرات")}
                </button>
            </div>
        </form>
    );
}

function Field({ label, value, onChange, placeholder, type = "text", required, icon }) {
    return (
        <label className="block">
            <div className="mb-2 text-[11px] font-bold text-zinc-400">{label}</div>
            <div className="relative">
                {icon ? (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        {icon}
                    </span>
                ) : null}
                <input
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    type={type}
                    required={required}
                    className={cn(
                        "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40",
                        icon ? "pr-10" : ""
                    )}
                />
            </div>
        </label>
    );
}

function TextArea({ label, value, onChange, placeholder, rows = 5 }) {
    return (
        <label className="block">
            <div className="mb-2 text-[11px] font-bold text-zinc-400">{label}</div>
            <textarea
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
            />
        </label>
    );
}

function PlanTypeBtn({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "px-3 py-2 text-xs font-extrabold transition",
                active ? "bg-white text-zinc-950" : "text-zinc-200 hover:bg-white/10",
            ].join(" ")}
        >
            {children}
        </button>
    );
}
