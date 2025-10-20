import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Payment, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalLessons: number;
  completedLessons: number;
  totalRevenue: number;
  pendingPayments: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users/recent"],
    enabled: isAuthenticated,
  });

  const { data: recentLessons = [] } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lessons/recent"],
    enabled: isAuthenticated,
  });

  const { data: pendingPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments/pending"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalStudents || 0} students,{" "}
              {stats?.totalInstructors || 0} instructors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-total-lessons"
            >
              {stats?.totalLessons || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedLessons || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-total-revenue"
            >
              ${stats?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">all time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-pending-payments"
            >
              ${stats?.pendingPayments?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">awaiting collection</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Users</CardTitle>
            <Button size="sm" asChild data-testid="button-manage-users">
              <Link href="/users">Manage Users</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No users yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`card-user-${user.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Lessons</CardTitle>
            <Button
              size="sm"
              variant="outline"
              asChild
              data-testid="button-view-all-lessons"
            >
              <Link href="/all-lessons">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLessons.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No lessons scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border"
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {new Date(lesson.scheduledAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <Badge
                          variant={
                            lesson.status === "completed"
                              ? "default"
                              : lesson.status === "scheduled"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {lesson.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {lesson.lessonType} • {lesson.duration} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
