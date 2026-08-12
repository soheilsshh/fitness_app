import { lazyPage } from "@/lib/lazy-page";

const NotificationSettingsClient = lazyPage(() =>
  import("./_components/NotificationSettingsClient")
);

export default function NotificationsPage() {
  return <NotificationSettingsClient />;
}
