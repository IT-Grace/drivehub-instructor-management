// Database storage implementation
// Referenced from javascript_database and javascript_log_in_with_replit blueprints

import {
  instructors,
  lessons,
  payments,
  students,
  users,
  type InsertInstructor,
  type InsertLesson,
  type InsertPayment,
  type InsertStudent,
  type Instructor,
  type Lesson,
  type Payment,
  type Student,
  type UpsertUser,
  type User,
} from "@shared/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "./db";

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
  updateInstructor(
    id: string,
    instructor: Partial<InsertInstructor>
  ): Promise<Instructor>;

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
  getAllStudents(): Promise<Student[]>;
  getAllLessons(): Promise<Lesson[]>;
  getAllPayments(): Promise<Payment[]>;
  createUser(user: Omit<UpsertUser, "id">): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
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

  async getStudentsByInstructor(instructorUserId: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.instructorId, instructorUserId));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(
    id: string,
    student: Partial<InsertStudent>
  ): Promise<Student> {
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

  async updateInstructor(
    id: string,
    instructor: Partial<InsertInstructor>
  ): Promise<Instructor> {
    const [updated] = await db
      .update(instructors)
      .set({ ...instructor, updatedAt: new Date() })
      .where(eq(instructors.id, id))
      .returning();
    return updated;
  }

  // ==========================================
  // LESSON OPERATIONS
  // ==========================================

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
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
        and(gte(lessons.scheduledAt, start), lte(lessons.scheduledAt, end))
      )
      .orderBy(lessons.scheduledAt);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(
    id: string,
    lesson: Partial<InsertLesson>
  ): Promise<Lesson> {
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
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(
    id: string,
    payment: Partial<InsertPayment>
  ): Promise<Payment> {
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
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getAllLessons(): Promise<Lesson[]> {
    return await db.select().from(lessons).orderBy(desc(lessons.scheduledAt));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async createUser(user: Omit<UpsertUser, "id">): Promise<User> {
    const [created] = await db
      .insert(users)
      .values({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        ...user,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
