import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WhiteLabelProvider } from "@/hooks/useWhiteLabel";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import TimeTracking from "@/pages/TimeTracking";
import Automations from "@/pages/Automations";
import Contacts from "@/pages/Contacts";
import GoogleAds from "@/pages/GoogleAds";
import SalesBoard from "@/pages/SalesBoard";
import Integrations from "@/pages/Integrations";
import ActivityLog from "@/pages/ActivityLog";
import Settings from "@/pages/Settings";
import GetAcceptDemo from "@/pages/GetAcceptDemo";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import LandingPage from "@/pages/LandingPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <WhiteLabelProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/time" element={<TimeTracking />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/google-ads" element={<GoogleAds />} />
                <Route path="/sales" element={<SalesBoard />} />
                <Route path="/getaccept" element={<GetAcceptDemo />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/users" element={<UserManagement />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </AuthProvider>
    </WhiteLabelProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
