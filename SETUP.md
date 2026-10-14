# Adaptive Tenant LMS - Supabase & Local Setup Guide

This guide walks you through setting up your Supabase project, executing the database migrations and seed scripts, configuring authentication, and running the Next.js application.

---

## 1. Create a Supabase Project

1. Go to [database.new](https://database.new) or log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Enter a project name (e.g., `Adaptive-Tenant-LMS`), choose your preferred region, and set a database password.
4. Wait for the project initialization to complete.

---

## 2. Run Database Schema & Seed Scripts

### Step 2.1: Run `schema.sql`
1. In the Supabase Dashboard, open the **SQL Editor** from the left navigation bar.
2. Click **New query**.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste them into the SQL editor.
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
5. Confirm that the query executed successfully with zero errors. This creates:
   - Tables: `tenants`, `profiles`, `courses`, `course_enrollments`, `topics`, `questions`, `cognitive_profiles`, `proctoring_events`, `quiz_submissions`
   - Views: `class_topic_pulse`
   - RLS policies enforcing tenant isolation and role restrictions
   - Stored procedures: `next_question(p_course_id)` and `submit_answer(p_question_id, p_selected, p_response_ms)`

### Step 2.2: Run `seed.sql`
1. Open a new query in the **SQL Editor**.
2. Copy the entire contents of [`supabase/seed.sql`](./supabase/seed.sql) and paste them into the SQL editor.
3. Click **Run**.
4. Confirm execution. This seeds:
   - Tenants: `Alpha Academy` and `Beta Institute`
   - Test user profiles across all 4 roles
   - Courses: "Data Structures & Algorithms" (Alpha) and "Intro to Python" (Beta)
   - Topics, cognitive profile baselines with green/yellow/red trust scores, and questions
   - Initial proctoring review events for the instructor

---

## 3. Set Up Auth Users in Supabase

In the Supabase Dashboard:
1. Go to **Authentication** -> **Users**.
2. If your project environment did not insert users via SQL, click **Add user** -> **Create user** for each seed account:
   - `student@alpha.test` (Student - Alpha Tenant)
   - `student@beta.test` (Student - Beta Tenant)
   - `instructor@alpha.test` (Instructor - Alpha Tenant)
   - `admin@alpha.test` (Tenant Admin - Alpha Tenant)
   - `super@demo.test` (Super Admin - Platform)
3. Set their passwords to whatever password you prefer (e.g., `Password123!`).
4. Toggle **Auto Confirm Email** to ON so users can log in immediately without email confirmation.

> **Note on User IDs:** If you create users manually through the Supabase Dashboard, copy each generated user UUID and update their row in the `public.profiles` table with matching `id` and `email`.

---

## 4. Configure Environment Variables

1. In Supabase Dashboard, navigate to **Project Settings** -> **API**.
2. Copy the **Project URL** and the **anon (public)** key.
3. In this repository, create `.env.local` by copying `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   > **Security Requirement:** Only use the `anon` key. Never add or expose the `service_role` key anywhere in the application.

---

## 5. Install Dependencies and Run

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Verification Checklist

- **Student Flow (`student@alpha.test`)**:
  - Enrolled course is strictly **Data Structures**.
  - Heatmap displays per-topic trust score in green, yellow, or red based on EMA calculations.
  - Quiz flow pulls questions dynamically using `next_question`, displays "Why this question?", measures response time, and updates trust score via `submit_answer`.
  - Proctoring banner is visible; tab switches are debounced and logged without auto-failing.
  - Practice recommendations list targeted review questions using token similarity from `lib/recommend.ts`.
- **Instructor Flow (`instructor@alpha.test`)**:
  - Displays "Class Topic Pulse" bar chart with average trust scores.
  - Proctoring review table displays flags sorted by severity with **Confirm** and **Dismiss** actions.
- **Tenant Admin Flow (`admin@alpha.test`)**:
  - View and manage users and courses strictly for the Alpha tenant.
- **Super Admin Flow (`super@demo.test`)**:
  - View and create tenants on the platform. Student and course data is blocked.
