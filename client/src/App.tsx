import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin-dashboard";
import InstructorDashboard from "@/pages/instructor-dashboard";
import InstructorEarningsPage from "@/pages/instructor-earnings";
import InstructorSchedulePage from "@/pages/instructor-schedule";
import InstructorSettingsPage from "@/pages/instructor-settings";
import InstructorStudentsPage from "@/pages/instructor-students";
import Landing from "@/pages/landing";
import LessonsPage from "@/pages/lessons";
import NotFound from "@/pages/not-found";
import PaymentsPage from "@/pages/payments";
import SettingsPage from "@/pages/settings";
import StudentDashboard from "@/pages/student-dashboard";
import UsersPage from "@/pages/users";
import { QueryClientProvider } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";

// Router component with authentication logic
// Referenced from javascript_log_in_with_replit blueprint
function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show landing page while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Custom sidebar width for better content display
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Render appropriate dashboard based on user role
  const DashboardComponent =
    user?.role === "instructor"
      ? InstructorDashboard
      : user?.role === "super_admin"
      ? AdminDashboard
      : StudentDashboard;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {user && <AppSidebar user={user} />}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-testid="button-logout"
                className="hover-elevate active-elevate-2"
              >
                <a href="/api/logout" className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </a>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={DashboardComponent} />
              {user?.role === "super_admin" && (
                <>
                  <Route path="/users" component={UsersPage} />
                  <Route path="/all-lessons" component={LessonsPage} />
                  <Route path="/all-payments" component={PaymentsPage} />
                  <Route path="/settings" component={SettingsPage} />
                </>
              )}
              {user?.role === "instructor" && (
                <>
                  <Route
                    path="/instructor-schedule"
                    component={InstructorSchedulePage}
                  />
                  <Route
                    path="/instructor-students"
                    component={InstructorStudentsPage}
                  />
                  <Route
                    path="/instructor-earnings"
                    component={InstructorEarningsPage}
                  />
                  <Route
                    path="/instructor-settings"
                    component={InstructorSettingsPage}
                  />
                </>
              )}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
