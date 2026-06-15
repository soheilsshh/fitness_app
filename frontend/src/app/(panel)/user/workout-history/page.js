import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkoutHistoryPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <div className="text-start">
        <h2 className="text-lg font-semibold tracking-tight">تاریخچه تمرینات</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          سوابق تمرینات انجام‌شده در این بخش نمایش داده می‌شود.
        </p>
      </div>

      <Card className="border-dashed bg-gradient-to-t from-primary/5 to-card dark:bg-card">
        <CardHeader className="items-center text-center">
          <div className="mb-2 inline-flex size-12 items-center justify-center rounded-full bg-muted">
            <History className="size-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">به‌زودی</CardTitle>
          <CardDescription>
            این بخش به‌زودی اضافه می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6 text-center text-sm text-muted-foreground">
          پس از اتصال به API، تاریخچه تمرینات شما اینجا قابل مشاهده خواهد بود.
        </CardContent>
      </Card>
    </div>
  );
}
