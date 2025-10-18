import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Student } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, DollarSign, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// Extended Student type for API responses that include user information
interface StudentWithUser extends Student {
  user?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
}

interface LessonFormData {
  studentId: string;
  lessonType: string;
  scheduledAt: string;
  duration: number;
  pickupLocation: string;
  notes: string;
}

export default function InstructorDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Schedule lesson dialog state
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [formData, setFormData] = useState<LessonFormData>({
    studentId: "",
    lessonType: "standard",
    scheduledAt: "",
    duration: 60,
    pickupLocation: "",
    notes: "",
  });

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

  const { data: students = [] } = useQuery<StudentWithUser[]>({
    queryKey: ["/api/instructor/students"],
    enabled: isAuthenticated,
  });

  const { data: todaysLessons = [] } = useQuery<Lesson[]>({
    queryKey: ["/api/instructor/lessons/today"],
    enabled: isAuthenticated,
  });

  const { data: upcomingLessons = [] } = useQuery<Lesson[]>({
    queryKey: ["/api/instructor/lessons/upcoming"],
    enabled: isAuthenticated,
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: LessonFormData) => {
      // Client-side validation
      if (!lessonData.studentId) {
        throw new Error("Please select a student");
      }
      if (!lessonData.scheduledAt) {
        throw new Error("Please select a date and time");
      }
      if (!lessonData.lessonType) {
        throw new Error("Please select a lesson type");
      }

      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lessonData,
          location: lessonData.pickupLocation,
          scheduledAt: new Date(lessonData.scheduledAt).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create lesson`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/lessons"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/instructor/lessons/today"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/instructor/lessons/upcoming"],
      });
      setIsScheduleDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Lesson scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      studentId: "",
      lessonType: "standard",
      scheduledAt: "",
      duration: 60,
      pickupLocation: "",
      notes: "",
    });
  };

  if (authLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const completedToday = todaysLessons.filter(
    (l) => l.status === "completed"
  ).length;
  const totalEarningsToday =
    todaysLessons.filter((l) => l.status === "completed").length * 50; // Estimate

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your students and schedule
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-total-students"
            >
              {students.length}
            </div>
            <p className="text-xs text-muted-foreground">active learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Lessons
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-todays-lessons"
            >
              {todaysLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedToday} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-upcoming-count"
            >
              {upcomingLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">scheduled lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-todays-earnings"
            >
              ${totalEarningsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              from {completedToday} lessons
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Today's Schedule</CardTitle>
            <Button
              size="sm"
              data-testid="button-add-lesson"
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              Add Lesson
            </Button>
          </CardHeader>
          <CardContent>
            {todaysLessons.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No lessons scheduled for today
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleDialogOpen(true)}
                >
                  Schedule a Lesson
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium font-mono">
                          {new Date(lesson.scheduledAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
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
                      <p className="text-sm text-muted-foreground">
                        {lesson.duration} min • {lesson.lessonType}
                      </p>
                      {lesson.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>My Students</CardTitle>
            <Button
              size="sm"
              variant="outline"
              data-testid="button-view-all-students"
              onClick={() => setLocation("/instructor-students")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No students assigned yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.slice(0, 5).map((student) => {
                  const initials =
                    `${student.user?.firstName?.[0] || ""}${
                      student.user?.lastName?.[0] || ""
                    }`.toUpperCase() || "S";
                  const hoursCompleted = parseFloat(student.hoursCompleted);
                  const totalHours = parseFloat(student.totalHours);
                  const progress = (hoursCompleted / totalHours) * 100;

                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover-elevate"
                      data-testid={`card-student-${student.id}`}
                    >
                      <Avatar>
                        <AvatarImage
                          src={student.user?.profileImageUrl || undefined}
                          className="object-cover"
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {student.user?.firstName} {student.user?.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Lesson Dialog */}
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Lesson</DialogTitle>
            <DialogDescription>
              Create a new lesson appointment with a student.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentId">Student</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => {
                    const selectedStudent = students.find(
                      (s) => s.id === value
                    );
                    setFormData({
                      ...formData,
                      studentId: value,
                      pickupLocation: selectedStudent?.address || "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.user?.firstName} {student.user?.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lessonType">Lesson Type</Label>
                <Select
                  value={formData.lessonType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lessonType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Lesson</SelectItem>
                    <SelectItem value="highway">Highway Practice</SelectItem>
                    <SelectItem value="parking">Parking Practice</SelectItem>
                    <SelectItem value="test_prep">Test Preparation</SelectItem>
                    <SelectItem value="refresher">Refresher Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledAt">Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="pickupLocation">Pickup Location</Label>
              <Input
                id="pickupLocation"
                value={formData.pickupLocation}
                readOnly
                className="bg-muted text-muted-foreground"
                placeholder="Student's pickup address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only students can edit this after the lesson is created
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Lesson focus, specific skills to practice, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createLessonMutation.mutate(formData)}
              disabled={createLessonMutation.isPending}
            >
              {createLessonMutation.isPending
                ? "Scheduling..."
                : "Schedule Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
