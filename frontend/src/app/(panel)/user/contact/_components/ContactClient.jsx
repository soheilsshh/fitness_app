"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, MessageSquare } from "lucide-react";
import { api } from "@/lib/axios/client";
import MetaBadge from "@/app/(panel)/user/_components/ui/MetaBadge";
import PageHeader from "@/app/(panel)/user/_components/ui/PageHeader";
import PanelEmptyState from "@/app/(panel)/user/_components/ui/PanelEmptyState";
import ProgramOffer from "@/app/(panel)/user/_components/ProgramOffer";
import CoachSocialCards from "./CoachSocialCards";
import TicketCreateForm from "./TicketCreateForm";
import TicketsList from "./TicketsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function faNum(v) {
  return new Intl.NumberFormat("fa-IR").format(v ?? 0);
}

export default function ContactClient() {
  const [profile, setProfile] = useState(null);
  const [coach, setCoach] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState("");
  const [coachLoading, setCoachLoading] = useState(true);

  const assignedSlug = profile?.assignedCoachSlug || "";
  const assignedName = profile?.assignedCoachName || "";

  async function loadTickets() {
    setTicketsLoading(true);
    setTicketsError("");
    try {
      const res = await api.get("/me/tickets", { params: { page: 1, pageSize: 20 } });
      setTickets(res.data?.items || []);
      setTicketsTotal(res.data?.total || 0);
    } catch (err) {
      setTickets([]);
      setTicketsTotal(0);
      setTicketsError(err?.response?.data?.error || "بارگذاری تیکت‌ها ناموفق بود.");
    } finally {
      setTicketsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setCoachLoading(true);
      try {
        const me = await api.get("/me");
        if (cancelled) return;
        setProfile(me.data || null);

        const slug = me.data?.assignedCoachSlug;
        if (!slug) {
          setCoach(null);
          return;
        }

        try {
          const c = await api.get(`/coaches/${slug}`);
          if (cancelled) return;
          setCoach(c.data || null);
        } catch {
          if (!cancelled) setCoach(null);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setCoachLoading(false);
      }
    }

    load();
    loadTickets();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSendTicket = Boolean(profile?.assignedCoachId);

  const headerSubtitle = useMemo(() => {
    if (!profile) return "برای ارتباط با مربی و پیگیری تیکت‌ها";
    if (!profile.assignedCoachId) return "هنوز مربی برای شما تخصیص داده نشده است.";
    return "برای ارتباط با مربی و پیگیری تیکت‌ها";
  }, [profile]);

  return (
    <div dir="rtl" className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="ارتباط با مربی"
        description={headerSubtitle}
        meta={
          <MetaBadge
            icon={MessageSquare}
            label="تیکت‌ها:"
            value={faNum(ticketsTotal)}
          />
        }
      />

      {coachLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اطلاعات مربی</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : !canSendTicket ? (
        <PanelEmptyState
          icon={CreditCard}
          title="برای ارتباط با مربی، برنامه لازم است"
          description="پس از تهیه برنامه و تخصیص مربی، می‌توانید تیکت بفرستید."
        >
          <ProgramOffer />
        </PanelEmptyState>
      ) : (
        <CoachSocialCards coach={coach} assignedCoachName={assignedName} assignedCoachSlug={assignedSlug} />
      )}

      {canSendTicket ? (
      <div className="grid gap-4 lg:grid-cols-2">
        <TicketCreateForm
          disabled={!canSendTicket}
          assignedCoachName={assignedName}
          onCreated={() => loadTickets()}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">تیکت‌های قبلی</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketsList loading={ticketsLoading} error={ticketsError} items={tickets} />
          </CardContent>
        </Card>
      </div>
      ) : null}
    </div>
  );
}

