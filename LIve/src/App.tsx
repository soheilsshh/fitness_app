import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import NotFound from "./pages/NotFound";

// Lazy load heavy components for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminWorkflows = lazy(() => import("./pages/AdminWorkflows"));
const TaskChat = lazy(() => import("./pages/TaskChat"));
const AIPage = lazy(() => import("./pages/AIPage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const ThankYouPage = lazy(() => import("./pages/ThankYouPage"));

// PERFORMANCE OPTIMIZATION: Configure QueryClient with cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds
      staleTime: 30 * 1000,
      // Keep data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus only for critical queries
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      <div className="text-lg text-muted-foreground">در حال بارگذاری...</div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<RegisterPage />} />
            <Route path="/webinar" element={<Index />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/workflows" element={<AdminWorkflows />} />
            <Route path="/admin/tasks/chat" element={<TaskChat />} />
            {/* AI Landing Page */}
            <Route path="/ai" element={<AIPage />} />
            {/* Payment Pages */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
