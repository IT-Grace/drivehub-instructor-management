// Data schema for driving instructor management application
// Referenced from javascript_log_in_with_replit and javascript_database blueprints

import { relations, sql } from "drizzle-orm";
import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// SESSION AND AUTH TABLES (REQUIRED FOR REPLIT AUTH)
// ==========================================

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - mandatory for Replit Auth, extended with role
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("student"), // student, instructor, super_admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional(),
  role: z.enum(["student", "instructor", "super_admin"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// ==========================================
// STUDENT MANAGEMENT TABLES
// ==========================================

export const students = pgTable("students", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  instructorId: varchar("instructor_id").references(() => users.id, {
    onDelete: "set null",
  }),
  licenseNumber: varchar("license_number"),
  phone: varchar("phone"),
  address: text("address"),
  hoursCompleted: decimal("hours_completed", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 })
    .notNull()
    .default("40"), // typical requirement
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// ==========================================
// INSTRUCTOR MANAGEMENT
// ==========================================

export const instructors = pgTable("instructors", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  licenseNumber: varchar("license_number"),
  phone: varchar("phone"),
  specializations: text("specializations").array(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInstructorSchema = createInsertSchema(instructors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInstructor = z.infer<typeof insertInstructorSchema>;
export type Instructor = typeof instructors.$inferSelect;

// ==========================================
// LESSON SCHEDULING
// ==========================================

export const lessons = pgTable("lessons", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  instructorId: varchar("instructor_id")
    .notNull()
    .references(() => instructors.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60), // minutes
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, completed, cancelled, pending
  lessonType: varchar("lesson_type", { length: 50 })
    .notNull()
    .default("standard"), // standard, highway, parking, test_prep
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons, {
  scheduledAt: z.coerce.date(),
  duration: z.number().min(30).max(240),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// ==========================================
// PAYMENT MANAGEMENT
// ==========================================

export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").references(() => lessons.id, {
    onDelete: "set null",
  }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, overdue, cancelled
  paymentMethod: varchar("payment_method", { length: 50 }),
  description: text("description"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments, {
  amount: z.coerce.number().positive(),
  dueDate: z.coerce.date().optional(),
  paidAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ==========================================
// RELATIONS
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  instructor: one(instructors, {
    fields: [users.id],
    references: [instructors.userId],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  instructor: one(users, {
    fields: [students.instructorId],
    references: [users.id],
  }),
  lessons: many(lessons),
  payments: many(payments),
}));

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  user: one(users, {
    fields: [instructors.userId],
    references: [users.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  student: one(students, {
    fields: [lessons.studentId],
    references: [students.id],
  }),
  instructor: one(instructors, {
    fields: [lessons.instructorId],
    references: [instructors.id],
  }),
  payment: one(payments, {
    fields: [lessons.id],
    references: [payments.lessonId],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  lesson: one(lessons, {
    fields: [payments.lessonId],
    references: [lessons.id],
  }),
}));
