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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Student } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Edit,
  MapPin,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";

// Extended Student type for API responses that include user information
interface StudentWithUser extends Student {
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
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

export default function InstructorSchedulePage() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>({
    studentId: "",
    lessonType: "standard",
    scheduledAt: "",
    duration: 60,
    pickupLocation: "",
    notes: "",
  });

  // Fetch instructor's lessons
  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/instructor/lessons"],
    enabled: isAuthenticated,
  });

  // Fetch instructor's students
  const { data: students = [] } = useQuery<StudentWithUser[]>({
    queryKey: ["/api/instructor/students"],
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
          location: lessonData.pickupLocation, // Map pickupLocation to location
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
      setIsCreateDialogOpen(false);
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

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<LessonFormData>;
    }) => {
      const updateData: any = { ...data };

      // Handle scheduledAt conversion properly
      if (updateData.scheduledAt) {
        // If it's a datetime-local string (YYYY-MM-DDTHH:MM), convert to proper Date
        updateData.scheduledAt = new Date(updateData.scheduledAt).toISOString();
      }

      if (updateData.pickupLocation) {
        updateData.location = updateData.pickupLocation; // Map pickupLocation to location
        delete updateData.pickupLocation;
      }

      const response = await fetch(`/api/lessons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update lesson`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/lessons"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Lesson updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update lesson status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/lessons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          completedAt: status === "completed" ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update lesson status`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/lessons"] });
      toast({ title: "Success", description: "Lesson status updated" });
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
    setEditingLesson(null);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);

    // Convert UTC date to local datetime-local format
    let localDateTimeString = "";
    if (lesson.scheduledAt) {
      const date = new Date(lesson.scheduledAt);
      // Get local date and time components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      localDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setFormData({
      studentId: lesson.studentId,
      lessonType: lesson.lessonType || "standard",
      scheduledAt: localDateTimeString,
      duration: lesson.duration || 60,
      pickupLocation: lesson.location || "",
      notes: lesson.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (lessonId: string, status: string) => {
    updateStatusMutation.mutate({ id: lessonId, status });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      case "scheduled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTodaysLessons = () => {
    const today = new Date().toDateString();
    return lessons.filter(
      (lesson) =>
        lesson.scheduledAt &&
        new Date(lesson.scheduledAt).toDateString() === today
    );
  };

  const getUpcomingLessons = () => {
    const now = new Date();
    return lessons
      .filter(
        (lesson) =>
          lesson.scheduledAt &&
          new Date(lesson.scheduledAt) > now &&
          lesson.status === "scheduled"
      )
      .slice(0, 5);
  };

  const getWeeklyStats = () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const weekLessons = lessons.filter((lesson) => {
      if (!lesson.scheduledAt) return false;
      const lessonDate = new Date(lesson.scheduledAt);
      return lessonDate >= startOfWeek && lessonDate <= endOfWeek;
    });

    return {
      total: weekLessons.length,
      completed: weekLessons.filter((l) => l.status === "completed").length,
      scheduled: weekLessons.filter((l) => l.status === "scheduled").length,
      cancelled: weekLessons.filter((l) => l.status === "cancelled").length,
    };
  };

  if (isLoading) {
    return <div className="p-8">Loading schedule...</div>;
  }

  const todaysLessons = getTodaysLessons();
  const upcomingLessons = getUpcomingLessons();
  const weeklyStats = getWeeklyStats();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Schedule</h1>
        <p className="text-muted-foreground">
          Manage your lesson schedule and appointments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Lessons
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysLessons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {weeklyStats.completed} completed, {weeklyStats.scheduled}{" "}
              scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingLessons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(value) =>
          setViewMode(value as "day" | "week" | "month")
        }
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Lesson
              </Button>
            </DialogTrigger>
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
                          pickupLocation:
                            (selectedStudent as any)?.address || "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {(student as any).user?.firstName &&
                            (student as any).user?.lastName
                              ? `${(student as any).user.firstName} ${
                                  (student as any).user.lastName
                                }`
                              : `Student ID: ${student.id.slice(0, 8)}...`}
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
                        <SelectItem value="standard">
                          Standard Lesson
                        </SelectItem>
                        <SelectItem value="highway">
                          Highway Practice
                        </SelectItem>
                        <SelectItem value="parking">
                          Parking Practice
                        </SelectItem>
                        <SelectItem value="test_prep">
                          Test Preparation
                        </SelectItem>
                        <SelectItem value="refresher">
                          Refresher Course
                        </SelectItem>
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
                        setFormData({
                          ...formData,
                          scheduledAt: e.target.value,
                        })
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
                    placeholder="Student's pickup address (auto-filled from student profile)"
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only students can edit their pickup location after the
                    lesson is created
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
                  onClick={() => setIsCreateDialogOpen(false)}
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

        <TabsContent value="day" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {todaysLessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No lessons scheduled for today
                </p>
              ) : (
                <div className="space-y-4">
                  {todaysLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">
                            {lesson.scheduledAt
                              ? new Date(
                                  lesson.scheduledAt
                                ).toLocaleTimeString()
                              : "Time TBD"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Student: {lesson.studentId.slice(0, 8)}... •{" "}
                            {lesson.lessonType}
                          </div>
                          {lesson.location && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lesson.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getStatusBadgeVariant(lesson.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(lesson.status)}
                          {lesson.status.charAt(0).toUpperCase() +
                            lesson.status.slice(1)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEdit(lesson)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {lesson.status === "scheduled" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(lesson.id, "completed")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(lesson.id, "cancelled")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This Week's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        {lesson.scheduledAt ? (
                          <div>
                            <div>
                              {new Date(
                                lesson.scheduledAt
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(
                                lesson.scheduledAt
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          "TBD"
                        )}
                      </TableCell>
                      <TableCell>
                        Student: {lesson.studentId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lesson.lessonType || "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lesson.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {lesson.location.slice(0, 30)}...
                          </div>
                        ) : (
                          "TBD"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(lesson.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(lesson.status)}
                          {lesson.status.charAt(0).toUpperCase() +
                            lesson.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEdit(lesson)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {lesson.status === "scheduled" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(lesson.id, "completed")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(lesson.id, "cancelled")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Calendar view coming soon</p>
                <p className="text-sm">
                  Use week view to see detailed schedule
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Update lesson details and information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStudentId">Student</Label>
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
                <Label htmlFor="editLessonType">Lesson Type</Label>
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
                <Label htmlFor="editScheduledAt">Date & Time</Label>
                <Input
                  id="editScheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editDuration">Duration (minutes)</Label>
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
              <Label htmlFor="editPickupLocation">Pickup Location</Label>
              <Input
                id="editPickupLocation"
                value={formData.pickupLocation}
                readOnly
                className="bg-muted text-muted-foreground"
                placeholder="Student's pickup address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only the student can edit this after the lesson is created
              </p>
            </div>
            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
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
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingLesson &&
                updateLessonMutation.mutate({
                  id: editingLesson.id,
                  data: formData,
                })
              }
              disabled={updateLessonMutation.isPending}
            >
              {updateLessonMutation.isPending ? "Updating..." : "Update Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
