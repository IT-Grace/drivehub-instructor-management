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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Lesson, Student } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Calendar,
  Edit,
  Filter,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

// Extended Student type for API responses that include user information
interface StudentWithUser extends Student {
  user?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  } | null;
}

interface StudentFormData {
  phone: string;
  address: string; // Keep for display purposes but won't be sent in updates
  hoursCompleted: number;
  totalHours: number;
  notes: string;
}

export default function InstructorStudentsPage() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(
    null
  );
  const [viewingStudent, setViewingStudent] = useState<StudentWithUser | null>(
    null
  );
  const [formData, setFormData] = useState<StudentFormData>({
    phone: "",
    address: "",
    hoursCompleted: 0,
    totalHours: 40,
    notes: "",
  });

  // Fetch instructor's students
  const { data: students = [], isLoading } = useQuery<StudentWithUser[]>({
    queryKey: ["/api/instructor/students"],
    enabled: isAuthenticated,
  });

  // Fetch lessons to calculate student progress
  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ["/api/instructor/lessons"],
    enabled: isAuthenticated,
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StudentFormData>;
    }) => {
      // Remove address from data since instructors can't edit it
      const { address, ...updateData } = data;

      const response = await fetch(`/api/instructor/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update student`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/students"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Student updated successfully" });
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
      phone: "",
      address: "",
      hoursCompleted: 0,
      totalHours: 40,
      notes: "",
    });
    setEditingStudent(null);
  };

  const handleEdit = (student: StudentWithUser) => {
    setEditingStudent(student);
    setFormData({
      phone: student.phone || "",
      address: student.address || "",
      hoursCompleted: parseFloat(student.hoursCompleted) || 0,
      totalHours: parseFloat(student.totalHours) || 40,
      notes: student.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewProfile = (student: StudentWithUser) => {
    setViewingStudent(student);
    setIsProfileDialogOpen(true);
  };

  const getStudentLessons = (studentId: string) => {
    return lessons.filter((lesson) => lesson.studentId === studentId);
  };

  const getCompletedLessons = (studentId: string) => {
    return lessons.filter(
      (lesson) =>
        lesson.studentId === studentId && lesson.status === "completed"
    );
  };

  const getProgressPercentage = (student: StudentWithUser) => {
    const completed = parseFloat(student.hoursCompleted) || 0;
    const total = parseFloat(student.totalHours) || 40;
    return Math.round((completed / total) * 100);
  };

  const getProgressStatus = (percentage: number) => {
    if (percentage >= 90) return "near-completion";
    if (percentage >= 60) return "advanced";
    if (percentage >= 30) return "intermediate";
    return "beginner";
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const progressPercentage = getProgressPercentage(student);
    const matchesProgress =
      progressFilter === "all" ||
      (progressFilter === "beginner" && progressPercentage < 30) ||
      (progressFilter === "intermediate" &&
        progressPercentage >= 30 &&
        progressPercentage < 60) ||
      (progressFilter === "advanced" &&
        progressPercentage >= 60 &&
        progressPercentage < 90) ||
      (progressFilter === "near-completion" && progressPercentage >= 90);

    return matchesSearch && matchesProgress;
  });

  const getAverageProgress = () => {
    if (students.length === 0) return 0;
    const totalProgress = students.reduce(
      (sum, student) => sum + getProgressPercentage(student),
      0
    );
    return Math.round(totalProgress / students.length);
  };

  const getTotalLessonsThisWeek = () => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return lessons.filter((lesson) => {
      if (!lesson.scheduledAt) return false;
      const lessonDate = new Date(lesson.scheduledAt);
      return lessonDate >= startOfWeek && lessonDate <= endOfWeek;
    }).length;
  };

  if (isLoading) {
    return <div className="p-8">Loading students...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Students</h1>
        <p className="text-muted-foreground">
          Manage your students and track their progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageProgress()}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lessons This Week
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalLessonsThisWeek()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Near Completion
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => getProgressPercentage(s) >= 90).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={progressFilter} onValueChange={setProgressFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by progress" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="beginner">Beginner (&lt;30%)</SelectItem>
            <SelectItem value="intermediate">Intermediate (30-60%)</SelectItem>
            <SelectItem value="advanced">Advanced (60-90%)</SelectItem>
            <SelectItem value="near-completion">
              Near Completion (90%+)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Recent Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const progressPercentage = getProgressPercentage(student);
                const completedLessons = getCompletedLessons(student.id);
                const recentLesson =
                  completedLessons[completedLessons.length - 1];

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {student.user?.firstName && student.user?.lastName
                            ? `${student.user.firstName} ${student.user.lastName}`
                            : `Student ID: ${student.id.slice(0, 8)}...`}
                        </div>
                        {student.licenseNumber && (
                          <div className="text-sm text-muted-foreground">
                            License: {student.licenseNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={progressPercentage} className="w-20" />
                        <div className="text-xs text-muted-foreground">
                          {student.hoursCompleted}/{student.totalHours}h (
                          {progressPercentage}%)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {student.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        )}
                        {student.address && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {student.address.slice(0, 25)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recentLesson ? (
                        <div className="text-sm">
                          <div>
                            Last lesson:{" "}
                            {new Date(
                              recentLesson.scheduledAt
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-muted-foreground">
                            {recentLesson.lessonType}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No lessons yet
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          progressPercentage >= 90 ? "default" : "outline"
                        }
                      >
                        {getProgressStatus(progressPercentage).replace(
                          "-",
                          " "
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewProfile(student)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(student)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editingStudent?.user?.firstName && editingStudent?.user?.lastName
                ? `${editingStudent.user.firstName} ${editingStudent.user.lastName}`
                : "Student"}
            </DialogTitle>
            <DialogDescription>
              Update student information and progress.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="hoursCompleted">Hours Completed</Label>
                <Input
                  id="hoursCompleted"
                  type="number"
                  step="0.5"
                  value={formData.hoursCompleted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hoursCompleted: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                readOnly
                className="bg-muted text-muted-foreground"
                placeholder="Student's address for pickup/dropoff"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only students can edit their address
              </p>
            </div>
            <div>
              <Label htmlFor="totalHours">Total Required Hours</Label>
              <Input
                id="totalHours"
                type="number"
                value={formData.totalHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalHours: parseFloat(e.target.value) || 40,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Student progress notes, areas to focus on, etc."
                className="min-h-[100px]"
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
                editingStudent &&
                updateStudentMutation.mutate({
                  id: editingStudent.id,
                  data: formData,
                })
              }
              disabled={updateStudentMutation.isPending}
            >
              {updateStudentMutation.isPending
                ? "Updating..."
                : "Update Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewingStudent?.user?.firstName && viewingStudent?.user?.lastName
                ? `${viewingStudent.user.firstName} ${viewingStudent.user.lastName}`
                : "Student Profile"}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this student.
            </DialogDescription>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Student Name
                    </Label>
                    <p className="text-sm font-medium">
                      {viewingStudent.user?.firstName &&
                      viewingStudent.user?.lastName
                        ? `${viewingStudent.user.firstName} ${viewingStudent.user.lastName}`
                        : `Student ID: ${viewingStudent.id.slice(0, 8)}...`}
                    </p>
                  </div>
                  {viewingStudent.licenseNumber && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        License Number
                      </Label>
                      <p className="text-sm">{viewingStudent.licenseNumber}</p>
                    </div>
                  )}
                  {viewingStudent.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Phone
                      </Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        {viewingStudent.phone}
                      </div>
                    </div>
                  )}
                  {viewingStudent.address && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Address
                      </Label>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        {viewingStudent.address}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Learning Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">
                        Overall Progress
                      </Label>
                      <span className="text-sm font-medium">
                        {getProgressPercentage(viewingStudent)}%
                      </span>
                    </div>
                    <Progress
                      value={getProgressPercentage(viewingStudent)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>
                        {viewingStudent.hoursCompleted} hours completed
                      </span>
                      <span>{viewingStudent.totalHours} hours total</span>
                    </div>
                  </div>

                  <div>
                    <Badge
                      variant={
                        getProgressPercentage(viewingStudent) >= 90
                          ? "default"
                          : "outline"
                      }
                      className="text-sm"
                    >
                      {getProgressStatus(getProgressPercentage(viewingStudent))
                        .charAt(0)
                        .toUpperCase() +
                        getProgressStatus(getProgressPercentage(viewingStudent))
                          .slice(1)
                          .replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Lesson Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Lesson Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Total Lessons
                    </Label>
                    <p className="text-2xl font-bold">
                      {getStudentLessons(viewingStudent.id).length}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Completed Lessons
                    </Label>
                    <p className="text-2xl font-bold">
                      {getCompletedLessons(viewingStudent.id).length}
                    </p>
                  </div>
                </div>

                {/* Recent Lesson */}
                {(() => {
                  const completedLessons = getCompletedLessons(
                    viewingStudent.id
                  );
                  const recentLesson =
                    completedLessons[completedLessons.length - 1];
                  return (
                    recentLesson && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Last Lesson
                        </Label>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              recentLesson.scheduledAt
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span>{recentLesson.lessonType}</span>
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>

              {/* Notes */}
              {viewingStudent.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Notes</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">{viewingStudent.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProfileDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsProfileDialogOpen(false);
                if (viewingStudent) {
                  handleEdit(viewingStudent);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
