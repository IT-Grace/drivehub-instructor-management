import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Payment, Student } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Car, Clock, DollarSign, GraduationCap } from "lucide-react";
import { useEffect } from "react";

export default function StudentDashboard() {
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

  const { data: studentData } = useQuery<Student>({
    queryKey: ["/api/student/profile"],
    enabled: isAuthenticated,
  });

  const { data: upcomingLessons = [] } = useQuery<Lesson[]>({
    queryKey: ["/api/student/lessons/upcoming"],
    enabled: isAuthenticated,
  });

  const { data: recentPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/student/payments/recent"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const hoursCompleted = parseFloat(studentData?.hoursCompleted || "0");
  const totalHours = parseFloat(studentData?.totalHours || "40");
  const progressPercentage = (hoursCompleted / totalHours) * 100;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">
          Track your progress and manage your driving lessons
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hours Completed
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-hours-completed"
            >
              {hoursCompleted}
            </div>
            <p className="text-xs text-muted-foreground">
              of {totalHours} required hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Lessons
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-upcoming-lessons"
            >
              {upcomingLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">scheduled lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-progress-percentage"
            >
              {Math.round(progressPercentage)}%
            </div>
            <p className="text-xs text-muted-foreground">towards completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-outstanding-amount"
            >
              $
              {recentPayments
                .filter((p) => p.status === "pending")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress
            value={progressPercentage}
            className="mb-2"
            data-testid="progress-bar-learning"
          />
          <p className="text-sm text-muted-foreground">
            {hoursCompleted} of {totalHours} hours completed •{" "}
            {(totalHours - hoursCompleted).toFixed(1)} hours remaining
          </p>
        </CardContent>
      </Card>

      {/* Assigned Instructor */}
      {(studentData as any)?.assignedInstructor && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-5 w-5" />
              Your Instructor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-lg">
                  {(studentData as any).assignedInstructor.firstName}{" "}
                  {(studentData as any).assignedInstructor.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(studentData as any).assignedInstructor.email}
                </p>
                {(studentData as any).assignedInstructor.phone && (
                  <p className="text-sm text-muted-foreground">
                    {(studentData as any).assignedInstructor.phone}
                  </p>
                )}
                {(studentData as any).assignedInstructor.specializations
                  ?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(
                      studentData as any
                    ).assignedInstructor.specializations.map(
                      (spec: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {spec}
                        </Badge>
                      )
                    )}
                  </div>
                )}
              </div>
              <Button size="sm" variant="outline">
                Contact Instructor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!(studentData as any)?.assignedInstructor && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                No instructor assigned yet
              </p>
              <p className="text-xs text-muted-foreground">
                Contact admin to get assigned to an instructor
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Upcoming Lessons</CardTitle>
            <Button size="sm" data-testid="button-book-lesson">
              Book Lesson
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingLessons.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No upcoming lessons scheduled
                </p>
                <Button variant="outline" size="sm">
                  Schedule Your First Lesson
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {new Date(lesson.scheduledAt).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <Badge
                          variant={
                            lesson.status === "scheduled"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {lesson.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {new Date(lesson.scheduledAt).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}{" "}
                        • {lesson.duration} min
                      </p>
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {lesson.lessonType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Payments</CardTitle>
            <Button
              size="sm"
              variant="outline"
              data-testid="button-view-all-payments"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No payment history
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                    data-testid={`card-payment-${payment.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.description || "Lesson payment"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        payment.status === "paid"
                          ? "default"
                          : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
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
