"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiSearch, FiClipboard, FiPlus } from "react-icons/fi";
import PlanRow from "./PlanRow";
import FilterChip from "./FilterChip";
import { mockPlans } from "./plansMock";
import Pagination from "./Pagination";

export default function PlansClient() {
    const plans = mockPlans;

    const [query, setQuery] = useState("");
    const [tag, setTag] = useState("all"); // all | discounted | popular
    const [page, setPage] = useState(1);
    const pageSize = 8;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return plans
            .filter((p) => {
                if (tag === "discounted") return Number(p.discountPercent || 0) > 0 || Number(p.discountPrice || 0) > 0;
                if (tag === "popular") return Boolean(p.isPopular);
                return true;
            })
            .filter((p) => {
                if (!q) return true;
                const text = `${p.title || ""} ${p.subtitle || ""} ${p.courseName || ""}`.toLowerCase();
                return text.includes(q);
            });
    }, [plans, query, tag]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (pageSafe - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, pageSafe]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-lg font-extrabold text-white">پلن‌ها</div>
                    <div className="mt-1 text-sm text-zinc-300">پلن‌های فروش/دوره را مدیریت کنید</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200">
                        <FiClipboard className="text-emerald-200" />
                        تعداد: <span className="font-bold text-white">{filtered.length}</span>
                    </div>

                    <Link
                        href="/admin/plans/new"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                    >
                        <FiPlus />
                        ساخت پلن
                    </Link>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                {/* Search */}
                <div className="relative w-full md:max-w-md">
                    <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="جستجو با تیتر، ساب‌تیتر یا نام دوره..."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-3 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                    />
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-2">
                    <FilterChip active={tag === "all"} onClick={() => (setTag("all"), setPage(1))}>
                        همه
                    </FilterChip>
                    <FilterChip
                        active={tag === "discounted"}
                        onClick={() => (setTag("discounted"), setPage(1))}
                    >
                        تخفیف‌دار
                    </FilterChip>
                    <FilterChip
                        active={tag === "popular"}
                        onClick={() => (setTag("popular"), setPage(1))}
                    >
                        محبوب
                    </FilterChip>
                </div>
            </div>

            {/* List */}
            <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="hidden grid-cols-12 gap-2 border-b border-white/10 bg-zinc-950/40 px-4 py-3 text-[11px] text-zinc-400 md:grid">
                    <div className="col-span-5">پلن</div>
                    <div className="col-span-3">نام دوره</div>
                    <div className="col-span-2">قیمت</div>
                    <div className="col-span-2 text-left">وضعیت</div>
                </div>

                <div className="divide-y divide-white/10 bg-white/5">
                    {pageItems.length === 0 ? (
                        <div className="p-5 text-sm text-zinc-300">پلنی پیدا نشد.</div>
                    ) : (
                        pageItems.map((p) => <PlanRow key={p.id} plan={p} />)
                    )}
                </div>
            </div>

            <Pagination
                page={pageSafe}
                totalPages={totalPages}
                onPrev={() => setPage((x) => Math.max(1, x - 1))}
                onNext={() => setPage((x) => Math.min(totalPages, x + 1))}
            />
        </div>
    );
}
