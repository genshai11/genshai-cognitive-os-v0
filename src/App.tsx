import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import Index from "./pages/Index";
import Advisors from "./pages/Advisors";
import Chat from "./pages/Chat";
import PersonaChat from "./pages/PersonaChat";
import Library from "./pages/Library";
import History from "./pages/History";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PersonaManager from "./pages/admin/PersonaManager";
import FrameworkManager from "./pages/admin/FrameworkManager";
import BookManager from "./pages/admin/BookManager";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/advisors" element={<Advisors />} />
            <Route path="/chat/:advisorId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/persona/:personaId" element={<ProtectedRoute><PersonaChat /></ProtectedRoute>} />
            <Route path="/library" element={<Library />} />
            <Route path="/history" element={<History />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/personas" element={<AdminRoute><PersonaManager /></AdminRoute>} />
            <Route path="/admin/frameworks" element={<AdminRoute><FrameworkManager /></AdminRoute>} />
            <Route path="/admin/books" element={<AdminRoute><BookManager /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AnalyticsDashboard /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
