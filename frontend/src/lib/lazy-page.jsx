import dynamic from "next/dynamic";
import { PageLoader } from "@/components/ui/page-loader";

/** Lazy-load a route client bundle into its own async chunk. */
export function lazyPage(loader, options = {}) {
  return dynamic(loader, {
    loading: () => <PageLoader />,
    ...options,
  });
}
