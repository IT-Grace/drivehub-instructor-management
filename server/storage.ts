// Database storage implementation
// Referenced from javascript_database and javascript_log_in_with_replit blueprints

import {
  users,
  students,
  instructors,
  lessons,
  payments,
  type User,
  type UpsertUser,
  type Student,
  type InsertStudent,
  type Instructor,
  type InsertInstructor,
  type Lesson,
  type InsertLesson,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (REQUIRED for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Student operations
  getStudent(userId: string): Promise<Student | undefined>;
  getStudentById(id: string): Promise<Student | undefined>;
  getStudentsByInstructor(instructorId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  
  // Instructor operations
  getInstructor(userId: string): Promise<Instructor | undefined>;
  getInstructorById(id: string): Promise<Instructor | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  
  // Lesson operations
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByStudent(studentId: string): Promise<Lesson[]>;
  getLessonsByInstructor(instructorId: string): Promise<Lesson[]>;
  getLessonsByDateRange(start: Date, end: Date): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByStudent(studentId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllLessons(): Promise<Lesson[]>;
  getAllPayments(): Promise<Payment[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // ==========================================
  // USER OPERATIONS (REQUIRED FOR REPLIT AUTH)
  // ==========================================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ==========================================
  // STUDENT OPERATIONS
  // ==========================================
  
  async getStudent(userId: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId));
    return student;
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id));
    return student;
  }

  async getStudentsByInstructor(instructorId: string): Promise<Student[]> {
    const instructor = await this.getInstructor(instructorId);
    if (!instructor) return [];
    
    return await db
      .select()
      .from(students)
      .where(eq(students.instructorId, instructorId));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db
      .insert(students)
      .values(student)
      .returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updated] = await db
      .update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // INSTRUCTOR OPERATIONS
  // ==========================================
  
  async getInstructor(userId: string): Promise<Instructor | undefined> {
    const [instructor] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.userId, userId));
    return instructor;
  }

  async getInstructorById(id: string): Promise<Instructor | undefined> {
    const [instructor] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.id, id));
    return instructor;
  }

  async createInstructor(instructor: InsertInstructor): Promise<Instructor> {
    const [newInstructor] = await db
      .insert(instructors)
      .values(instructor)
      .returning();
    return newInstructor;
  }

  // ==========================================
  // LESSON OPERATIONS
  // ==========================================
  
  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id));
    return lesson;
  }

  async getLessonsByStudent(studentId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.studentId, studentId))
      .orderBy(desc(lessons.scheduledAt));
  }

  async getLessonsByInstructor(instructorId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.instructorId, instructorId))
      .orderBy(desc(lessons.scheduledAt));
  }

  async getLessonsByDateRange(start: Date, end: Date): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(
        and(
          gte(lessons.scheduledAt, start),
          lte(lessons.scheduledAt, end)
        )
      )
      .orderBy(lessons.scheduledAt);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db
      .insert(lessons)
      .values(lesson)
      .returning();
    return newLesson;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson> {
    const [updated] = await db
      .update(lessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return updated;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // ==========================================
  // PAYMENT OPERATIONS
  // ==========================================
  
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // ADMIN OPERATIONS
  // ==========================================
  
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllLessons(): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .orderBy(desc(lessons.scheduledAt));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
