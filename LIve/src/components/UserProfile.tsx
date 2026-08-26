import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { User, Shield, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { usePermissions } from '@/hooks/usePermissions';
import StatusChip from "@/components/StatusChip";

const UserProfile: React.FC = () => {
  const { permissions, loading, username, isActive } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group permissions by category
  const permissionsByCategory: Record<string, string[]> = {};
  permissions.forEach(perm => {
    const category = perm.split('.')[0];
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push(perm);
  });

  const categoryNames: Record<string, string> = {
    dashboard: "داشبورد",
    users: "کاربران",
    sms: "پیام‌های SMS",
    avanak: "تماس‌های صوتی",
    workflow: "گردش‌کارها",
    settings: "تنظیمات",
    admin_users: "مدیریت کاربران ادمین",
  };

  const permissionNames: Record<string, string> = {
    "dashboard.view": "مشاهده داشبورد",
    "dashboard.export": "خروجی داشبورد",
    "dashboard.widget.online": "کارت کاربران آنلاین",
    "dashboard.widget.registrations": "کارت ثبت‌نام‌ها",
    "dashboard.widget.clicks": "کارت کلیک روی لینک",
    "dashboard.widget.viewers": "کارت بینندگان",
    "dashboard.widget.non_viewers": "کارت عدم تماشا",
    "dashboard.widget.overview": "نمودار آمار کلی",
    "dashboard.widget.registration_chart": "نمودار ثبت‌نام‌ها",
    "dashboard.widget.conversion_rate": "کارت نرخ تبدیل",
    "dashboard.widget.registration_to_view": "کارت ثبت‌نام به تماشا",
    "tasks.manage": "مدیریت کامل تسک‌ها",
    "tasks.collaborate": "همکاری در تسک‌ها",
    "users.view": "مشاهده کاربران",
    "users.export": "خروجی کاربران",
    "sms.view": "مشاهده پیام‌های SMS",
    "sms.create": "ایجاد پیام SMS",
    "sms.edit": "ویرایش پیام SMS",
    "sms.delete": "حذف پیام SMS",
    "sms.send": "ارسال SMS",
    "avanak.view": "مشاهده پیام‌های آوانک",
    "avanak.create": "ایجاد پیام آوانک",
    "avanak.edit": "ویرایش پیام آوانک",
    "avanak.delete": "حذف پیام آوانک",
    "workflow.view": "مشاهده گردش‌کارها",
    "workflow.create": "ایجاد گردش‌کار",
    "workflow.edit": "ویرایش گردش‌کار",
    "workflow.delete": "حذف گردش‌کار",
    "settings.view": "مشاهده تنظیمات",
    "settings.edit": "ویرایش تنظیمات",
    "settings.webinar": "مدیریت زمان‌بندی کارگاه",
    "settings.sms": "مدیریت تنظیمات پیامک",
    "settings.comments": "مدیریت کامنت‌ها",
    "admin_users.view": "مشاهده کاربران ادمین",
    "admin_users.create": "ایجاد کاربر ادمین",
    "admin_users.edit": "ویرایش کاربر ادمین",
    "admin_users.delete": "حذف کاربر ادمین",
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Profile header: banner strip + overlapping avatar, inline stat strip
          instead of a plain stacked info box + separate boxed tiles. */}
      <div className="fp-card fp-notch overflow-hidden">
        <div className="h-16 w-full bg-gradient-to-l from-[var(--fp-deep)] via-[var(--fp-brand)] to-[var(--fp-mid)] md:h-20" />
        <div className="px-5 pb-6 md:px-8">
          <div className="-mt-10 flex items-end gap-4 md:-mt-12">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-[var(--fp-brand)] to-[var(--fp-mid)] text-white shadow-lg md:h-24 md:w-24">
              <User className="h-9 w-9 md:h-10 md:w-10" />
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-foreground md:text-2xl">{username || "کاربر"}</h2>
              <div className="mt-1.5">
                {isActive ? (
                  <StatusChip tone="success" pulse>فعال</StatusChip>
                ) : (
                  <StatusChip tone="error">غیرفعال</StatusChip>
                )}
              </div>
            </div>
          </div>

          {/* Stat strip — inline numbers with dividers, not boxed pill tiles */}
          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-border pt-5">
            <div className="flex items-baseline gap-2">
              <span className="fp-hud-num gradient-text text-3xl">
                {permissions.length.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-muted-foreground">تعداد دسترسی‌ها</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="fp-hud-num gradient-text text-3xl">
                {Object.keys(permissionsByCategory).length.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-muted-foreground">دسته‌بندی‌ها</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`fp-hud-num text-3xl ${isActive ? 'text-success' : 'text-destructive'}`}>
                {isActive ? 'فعال' : 'غیرفعال'}
              </span>
              <span className="text-xs text-muted-foreground">وضعیت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions — grouped spine rows instead of a uniform boxed pill grid */}
      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            <h3 className="text-lg font-bold text-foreground">دسترسی‌های من</h3>
          </div>
          {permissions.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">هیچ دسترسی تعریف نشده است</p>
              <p className="text-muted-foreground/70 text-sm mt-1">لطفاً با مدیر سیستم تماس بگیرید</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="fp-spine rounded-xl bg-muted/40 py-3.5 ps-4 pe-3 md:ps-5">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                    {categoryNames[category] || category}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({perms.length.toLocaleString('fa-IR')})
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {perms.map((perm) => (
                      <div key={perm} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                        {permissionNames[perm] || perm}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info note — spine-accented callout instead of a boxed alert card */}
      <div
        className="fp-spine rounded-xl bg-muted/40 p-4"
        style={{ borderInlineStartColor: "hsl(var(--accent))" }}
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-accent" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-1">راهنما</p>
            <p className="text-muted-foreground">
              این صفحه دسترسی‌های شما را در سیستم نمایش می‌دهد.
              در صورت نیاز به دسترسی بیشتر، لطفاً با مدیر سیستم تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
