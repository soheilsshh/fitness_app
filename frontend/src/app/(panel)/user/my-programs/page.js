import { lazyPage } from "@/lib/lazy-page";

const MyProgramsListClient = lazyPage(() => import("./_components/MyProgramsListClient"));

export default function MyProgramsPage() {
  return <MyProgramsListClient />;
}
