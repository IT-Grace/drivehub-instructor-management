// API routes for driving instructor management application
// Referenced from javascript_log_in_with_replit blueprint

import { insertLessonSchema, insertPaymentSchema } from "@shared/schema";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { isAuthenticated, requireRole, setupAuth } from "./replitAuth";
import { storage } from "./storage";

// Helper function to get user ID in both development and production
function getUserId(req: any): string {
  if (process.env.NODE_ENV === "development") {
    return "dev-user-1";
  }
  return req.user.claims.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==========================================
  // AUTH MIDDLEWARE AND ROUTES
  // ==========================================

  await setupAuth(app);

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

        res.json(student);
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
        res.json(students);
      } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Failed to fetch students" });
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

  // ==========================================
  // LESSON MANAGEMENT ROUTES
  // ==========================================

  // Create lesson
  app.post("/api/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const validation = insertLessonSchema.safeParse(req.body);

      if (!validation.success) {
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
      const lesson = await storage.updateLesson(id, req.body);
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
