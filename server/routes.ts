// API routes for driving instructor management application
// Referenced from javascript_log_in_with_replit blueprint

import {
  insertLessonSchema,
  insertPaymentSchema,
  insertUserSchema,
} from "@shared/schema";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { isAuthenticated, requireRole, setupAuth } from "./replitAuth";
import { storage } from "./storage";

// Helper function to get user ID in both development and production
function getUserId(req: any): string {
  // In both development and production, get the user ID from the session
  return req.user.claims.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==========================================
  // AUTH MIDDLEWARE AND ROUTES
  // ==========================================

  await setupAuth(app);

  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "DriveWise API",
      version: "1.0.0",
    });
  });

  // Get authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==========================================
  // STUDENT ROUTES
  // ==========================================

  // Get student profile
  app.get(
    "/api/student/profile",
    isAuthenticated,
    requireRole("student"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        let student = await storage.getStudent(userId);

        // Create student profile if doesn't exist
        if (!student) {
          student = await storage.createStudent({ userId });
        }

        // Get assigned instructor information if available
        let assignedInstructor = null;
        if (student.instructorId) {
          const instructorUser = await storage.getUser(student.instructorId);
          if (instructorUser) {
            const instructorProfile = await storage.getInstructor(
              student.instructorId
            );
            assignedInstructor = {
              id: student.instructorId,
              firstName: instructorUser.firstName,
              lastName: instructorUser.lastName,
              email: instructorUser.email,
              phone: instructorProfile?.phone,
              licenseNumber: instructorProfile?.licenseNumber,
              specializations: instructorProfile?.specializations || [],
            };
          }
        }

        res.json({
          ...student,
          assignedInstructor,
        });
      } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ message: "Failed to fetch student profile" });
      }
    }
  );

  // Get student's upcoming lessons
  app.get(
    "/api/student/lessons/upcoming",
    isAuthenticated,
    requireRole("student"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const student = await storage.getStudent(userId);

        if (!student) {
          return res.json([]);
        }

        const lessons = await storage.getLessonsByStudent(student.id);
        const upcoming = lessons.filter(
          (l) =>
            new Date(l.scheduledAt) > new Date() && l.status === "scheduled"
        );

        res.json(upcoming);
      } catch (error) {
        console.error("Error fetching upcoming lessons:", error);
        res.status(500).json({ message: "Failed to fetch lessons" });
      }
    }
  );

  // Get student's payments
  app.get(
    "/api/student/payments/recent",
    isAuthenticated,
    requireRole("student"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const student = await storage.getStudent(userId);

        if (!student) {
          return res.json([]);
        }

        const payments = await storage.getPaymentsByStudent(student.id);
        res.json(payments.slice(0, 5));
      } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Failed to fetch payments" });
      }
    }
  );

  // ==========================================
  // INSTRUCTOR ROUTES
  // ==========================================

  // Get instructor's students
  app.get(
    "/api/instructor/students",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        let instructor = await storage.getInstructor(userId);

        if (!instructor) {
          instructor = await storage.createInstructor({ userId });
        }

        const students = await storage.getStudentsByInstructor(userId);

        // Get user information for each student
        const studentsWithUsers = await Promise.all(
          students.map(async (student) => {
            const user = await storage.getUser(student.userId);
            return {
              ...student,
              user: user
                ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImageUrl: user.profileImageUrl,
                  }
                : null,
            };
          })
        );

        res.json(studentsWithUsers);
      } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Failed to fetch students" });
      }
    }
  );

  // Update student by instructor
  app.patch(
    "/api/instructor/students/:id",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = getUserId(req);

        // Verify the instructor owns this student
        const students = await storage.getStudentsByInstructor(userId);
        const student = students.find((s) => s.id === id);

        if (!student) {
          return res.status(404).json({
            message: "Student not found or not assigned to this instructor",
          });
        }

        // Remove address from updates - only students can edit their address
        const { address, ...updateData } = req.body;

        const updatedStudent = await storage.updateStudent(id, updateData);
        res.json(updatedStudent);
      } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ message: "Failed to update student" });
      }
    }
  );

  // Get instructor's lessons for today
  app.get(
    "/api/instructor/lessons/today",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const instructor = await storage.getInstructor(userId);

        if (!instructor) {
          return res.json([]);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const lessons = await storage.getLessonsByDateRange(today, tomorrow);
        const instructorLessons = lessons.filter(
          (l) => l.instructorId === instructor.id
        );

        res.json(instructorLessons);
      } catch (error) {
        console.error("Error fetching today's lessons:", error);
        res.status(500).json({ message: "Failed to fetch lessons" });
      }
    }
  );

  // Get instructor's upcoming lessons
  app.get(
    "/api/instructor/lessons/upcoming",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const instructor = await storage.getInstructor(userId);

        if (!instructor) {
          return res.json([]);
        }

        const lessons = await storage.getLessonsByInstructor(instructor.id);
        const upcoming = lessons.filter(
          (l) =>
            new Date(l.scheduledAt) > new Date() && l.status === "scheduled"
        );

        res.json(upcoming);
      } catch (error) {
        console.error("Error fetching upcoming lessons:", error);
        res.status(500).json({ message: "Failed to fetch lessons" });
      }
    }
  );

  // Get instructor's all lessons
  app.get(
    "/api/instructor/lessons",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const instructor = await storage.getInstructor(userId);

        if (!instructor) {
          return res.json([]);
        }

        const lessons = await storage.getLessonsByInstructor(instructor.id);
        res.json(lessons);
      } catch (error) {
        console.error("Error fetching instructor lessons:", error);
        res.status(500).json({ message: "Failed to fetch lessons" });
      }
    }
  );

  // Get instructor's earnings
  app.get(
    "/api/instructor/earnings",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const instructor = await storage.getInstructor(userId);

        if (!instructor) {
          return res.json([]);
        }

        const lessons = await storage.getLessonsByInstructor(instructor.id);
        const completedLessons = lessons.filter(
          (l) => l.status === "completed"
        );

        // Calculate earnings based on completed lessons
        // Assuming a standard rate for now, could be customized per instructor
        const earnings = completedLessons.map((lesson) => ({
          id: lesson.id,
          date: lesson.scheduledAt,
          studentId: lesson.studentId,
          amount: 50, // Standard rate per lesson
          duration: lesson.duration,
          lessonType: lesson.lessonType,
        }));

        res.json(earnings);
      } catch (error) {
        console.error("Error fetching instructor earnings:", error);
        res.status(500).json({ message: "Failed to fetch earnings" });
      }
    }
  );

  // Get instructor settings
  app.get(
    "/api/instructor/settings",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const user = await storage.getUser(userId);
        let instructor = await storage.getInstructor(userId);

        if (!instructor) {
          instructor = await storage.createInstructor({ userId });
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const settings = {
          profile: {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: instructor.phone || "",
            licenseNumber: instructor.licenseNumber || "",
            bio: instructor.bio || "",
            specializations: instructor.specializations || [],
            hourlyRate: 45, // Default rate since not in schema yet
            availability: "weekdays", // Default availability since not in schema yet
            avatar: user.profileImageUrl,
          },
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            lessonReminders: true,
            studentUpdates: true,
            paymentNotifications: true,
            marketingEmails: false,
          },
          app: {
            theme: "system",
            language: "en",
            timezone: "UTC",
            dateFormat: "MM/DD/YYYY",
            currency: "USD",
          },
          security: {
            twoFactorEnabled: false,
          },
        };

        res.json(settings);
      } catch (error) {
        console.error("Error fetching instructor settings:", error);
        res.status(500).json({ message: "Failed to fetch settings" });
      }
    }
  );

  // Update instructor profile
  app.patch(
    "/api/instructor/profile",
    isAuthenticated,
    requireRole("instructor"),
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const {
          firstName,
          lastName,
          email,
          phone,
          licenseNumber,
          bio,
          specializations,
          // Note: hourlyRate and availability would need to be added to schema
        } = req.body;

        // Update user table
        await storage.updateUser(userId, {
          firstName,
          lastName,
          email,
        });

        // Update instructor table
        let instructor = await storage.getInstructor(userId);
        if (!instructor) {
          instructor = await storage.createInstructor({ userId });
        }

        await storage.updateInstructor(instructor.id, {
          phone,
          licenseNumber,
          bio,
          specializations,
        });

        res.json({ message: "Profile updated successfully" });
      } catch (error) {
        console.error("Error updating instructor profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  );

  // ==========================================
  // ADMIN ROUTES
  // ==========================================

  // Get admin dashboard stats
  app.get(
    "/api/admin/stats",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        const lessons = await storage.getAllLessons();
        const payments = await storage.getAllPayments();

        const stats = {
          totalUsers: users.length,
          totalStudents: users.filter((u) => u.role === "student").length,
          totalInstructors: users.filter((u) => u.role === "instructor").length,
          totalLessons: lessons.length,
          completedLessons: lessons.filter((l) => l.status === "completed")
            .length,
          totalRevenue: payments
            .filter((p) => p.status === "paid")
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
          pendingPayments: payments
            .filter((p) => p.status === "pending")
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        };

        res.json(stats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    }
  );

  // Get recent users
  app.get(
    "/api/admin/users/recent",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        res.json(users.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  // Get recent lessons
  app.get(
    "/api/admin/lessons/recent",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const lessons = await storage.getAllLessons();
        res.json(lessons.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent lessons:", error);
        res.status(500).json({ message: "Failed to fetch lessons" });
      }
    }
  );

  // Get pending payments
  app.get(
    "/api/admin/payments/pending",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const payments = await storage.getAllPayments();
        const pending = payments.filter((p) => p.status === "pending");
        res.json(pending.slice(0, 5));
      } catch (error) {
        console.error("Error fetching pending payments:", error);
        res.status(500).json({ message: "Failed to fetch payments" });
      }
    }
  );

  // Get all instructors for admin assignment
  app.get(
    "/api/admin/instructors",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        const instructors = users.filter((user) => user.role === "instructor");

        // Get instructor profiles for each instructor user
        const instructorProfiles = await Promise.all(
          instructors.map(async (user) => {
            const instructorProfile = await storage.getInstructor(user.id);
            return {
              id: instructorProfile?.id || null,
              userId: user.id,
              user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              },
              licenseNumber: instructorProfile?.licenseNumber,
              phone: instructorProfile?.phone,
              specializations: instructorProfile?.specializations || [],
              bio: instructorProfile?.bio,
            };
          })
        );

        res.json(instructorProfiles);
      } catch (error) {
        console.error("Error fetching instructors:", error);
        res.status(500).json({ message: "Failed to fetch instructors" });
      }
    }
  );

  // Get all students with instructor assignment info
  app.get(
    "/api/admin/students",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        const studentUsers = users.filter((user) => user.role === "student");

        // Get student profiles with instructor info for each student user
        const studentsWithInstructors = await Promise.all(
          studentUsers.map(async (user) => {
            const studentProfile = await storage.getStudent(user.id);
            let assignedInstructor = null;

            if (studentProfile?.instructorId) {
              const instructorUser = await storage.getUser(
                studentProfile.instructorId
              );
              if (instructorUser) {
                assignedInstructor = {
                  id: studentProfile.instructorId,
                  firstName: instructorUser.firstName,
                  lastName: instructorUser.lastName,
                };
              }
            }

            return {
              id: studentProfile?.id || null,
              userId: user.id,
              user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              },
              instructorId: studentProfile?.instructorId || null,
              assignedInstructor,
              phone: studentProfile?.phone,
              address: studentProfile?.address,
              hoursCompleted: studentProfile?.hoursCompleted || "0",
              totalHours: studentProfile?.totalHours || "40",
            };
          })
        );

        res.json(studentsWithInstructors);
      } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Failed to fetch students" });
      }
    }
  );

  // Full admin CRUD endpoints for users management
  app.get(
    "/api/admin/users",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const users = await storage.getAllUsers();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.get(
    "/api/admin/students",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const students = await storage.getAllStudents();
        res.json(students);
      } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Failed to fetch students" });
      }
    }
  );

  app.get(
    "/api/admin/payments",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const payments = await storage.getAllPayments();
        res.json(payments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Failed to fetch payments" });
      }
    }
  );

  app.get(
    "/api/admin/lessons",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const lessons = await storage.getAllLessons();
        res.json(lessons);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).json({ message: "Failed to fetch lessons" });
      }
    }
  );

  // User management CRUD endpoints
  app.post(
    "/api/admin/users",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const { instructorId, ...userData } = req.body;
        const validation = insertUserSchema.safeParse(userData);

        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid user data",
            errors: validation.error.errors,
          });
        }

        const user = await storage.createUser(validation.data);

        // If creating a student with instructor assignment, create student profile
        if (user.role === "student" && instructorId !== undefined) {
          await storage.createStudent({
            userId: user.id,
            instructorId:
              instructorId === "unassigned" || !instructorId
                ? null
                : instructorId,
          });
        }

        res.status(201).json(user);
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:id",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const { instructorId, ...userData } = req.body;

        // Update user information
        const user = await storage.updateUser(id, userData);

        // If user is a student and instructorId is provided, update student assignment
        if (user.role === "student" && instructorId !== undefined) {
          let student = await storage.getStudent(user.id);

          // Create student profile if it doesn't exist
          if (!student) {
            student = await storage.createStudent({
              userId: user.id,
              instructorId:
                instructorId === "unassigned" || !instructorId
                  ? null
                  : instructorId,
            });
          } else {
            // Update existing student with new instructor assignment
            await storage.updateStudent(student.id, {
              instructorId:
                instructorId === "unassigned" || !instructorId
                  ? null
                  : instructorId,
            });
          }
        }

        res.json(user);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  app.delete(
    "/api/admin/users/:id",
    isAuthenticated,
    requireRole("super_admin"),
    async (req: any, res) => {
      try {
        const { id } = req.params;
        await storage.deleteUser(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );

  // User settings endpoints
  app.get("/api/user/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // Mock settings data for now - in real implementation would be stored in database
      const settings = {
        profile: {
          firstName: req.user?.firstName || "",
          lastName: req.user?.lastName || "",
          email: req.user?.email || "",
          phone: "",
          address: "",
          bio: "",
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          lessonReminders: true,
          paymentReminders: true,
          marketingEmails: false,
        },
        app: {
          theme: "system",
          language: "en",
          timezone: "UTC",
          dateFormat: "MM/DD/YYYY",
          currency: "USD",
        },
        security: {
          twoFactorEnabled: false,
        },
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // Mock update - in real implementation would update database
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/user/password", isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      // Mock password update - in real implementation would hash and store
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.patch(
    "/api/user/notifications",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        // Mock update - in real implementation would update database
        res.json({ message: "Notifications updated successfully" });
      } catch (error) {
        console.error("Error updating notifications:", error);
        res.status(500).json({ message: "Failed to update notifications" });
      }
    }
  );

  app.patch(
    "/api/user/app-settings",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        // Mock update - in real implementation would update database
        res.json({ message: "App settings updated successfully" });
      } catch (error) {
        console.error("Error updating app settings:", error);
        res.status(500).json({ message: "Failed to update app settings" });
      }
    }
  );

  app.delete("/api/user/account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // Mock deletion - in real implementation would delete user and related data
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // ==========================================
  // LESSON MANAGEMENT ROUTES
  // ==========================================

  // Create lesson
  app.post("/api/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      // Get or create instructor
      let instructor = await storage.getInstructor(userId);
      if (!instructor) {
        instructor = await storage.createInstructor({ userId });
      }

      // Add instructor ID to the lesson data
      const lessonData = {
        ...req.body,
        instructorId: instructor.id,
      };

      const validation = insertLessonSchema.safeParse(lessonData);

      if (!validation.success) {
        console.error("Lesson validation failed:", validation.error.errors);
        console.error("Received data:", lessonData);
        return res.status(400).json({
          message: "Invalid lesson data",
          errors: validation.error.errors,
        });
      }

      const lesson = await storage.createLesson(validation.data);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.patch("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;

      console.log("Update lesson request body:", req.body);

      // Process the update data to handle date conversion
      const updateData = { ...req.body };

      // Convert scheduledAt string to Date object if present
      if (updateData.scheduledAt) {
        console.log(
          "Original scheduledAt:",
          updateData.scheduledAt,
          typeof updateData.scheduledAt
        );

        // Skip conversion if it's already a Date object
        if (updateData.scheduledAt instanceof Date) {
          console.log("scheduledAt is already a Date object");
        } else {
          // Handle both ISO string and datetime-local string formats
          const date = new Date(updateData.scheduledAt);
          if (isNaN(date.getTime())) {
            console.error("Invalid date provided:", updateData.scheduledAt);
            return res.status(400).json({ message: "Invalid date format" });
          }
          updateData.scheduledAt = date;
          console.log("Converted scheduledAt:", updateData.scheduledAt);
        }
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      console.log("Final updateData being sent to storage:", updateData);

      const lesson = await storage.updateLesson(id, updateData);
      res.json(lesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  // Delete lesson
  app.delete("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLesson(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // ==========================================
  // PAYMENT ROUTES
  // ==========================================

  // Create payment
  app.post("/api/payments", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertPaymentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid payment data",
          errors: validation.error.errors,
        });
      }

      const payment = await storage.createPayment(validation.data);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Update payment
  app.patch("/api/payments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.updatePayment(id, req.body);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
