# Adaptive Tenant LMS

**Adaptive Tenant LMS** is a secure, multi-tenant learning platform built with Next.js (App Router), TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js` and `@supabase/ssr`), and client-side proctoring.

The platform provides isolated multi-tenant management, adaptive assessment with real-time trust scoring using exponential moving averages, instructor analytics with proctoring audit trails, and token-based concept recommendations.

---

## Architecture & Technology Stack

- **Frontend / Framework**: Next.js 14+ (App Router), React 18+, TypeScript
- **Styling & UI**: Tailwind CSS, Lucide React Icons
- **Database & Authentication**: Supabase PostgreSQL with strict Row-Level Security (RLS) policies and PostgreSQL RPC functions
- **Client Library**: `@supabase/supabase-js` and `@supabase/ssr` (only using public anon key; never exposing service_role)
- **Trust Scoring Engine**: Exponential Moving Average (EMA) calculated inside PostgreSQL RPC functions
- **Recommendation Engine**: Custom token-frequency / TF-IDF similarity algorithm (`lib/recommend.ts`) without external paid AI APIs

---

## Role-Based Routing & Access Control

| Role | Access URL | Capabilities & Restrictions |
| :--- | :--- | :--- |
| **Student** | `/student` | View enrolled courses, topic trust-score heatmap, adaptive quiz with response timer, practice recommendations. |
| **Instructor** | `/instructor` | View taught courses, Class Topic Pulse bar chart, Proctoring Review table with Dismiss/Confirm flag workflow. |
| **Tenant Admin** | `/admin` | Manage and add courses and users strictly within the admin's tenant. |
| **Super Admin** | `/platform` | Manage and create tenants across the platform. Strictly blocked from viewing student or course data. |

---

## Implemented Features

### 1. Multi-Tenant Role Isolation & Authentication
- Next.js middleware and server-side session checks verifying user profile role and tenant ID.
- Dynamic layout showing current user name, role badge, and active tenant name.

### 2. Adaptive Student Quiz Flow & CSE Question Bank
- **Expanded CSE Curriculum**: Covers Data Structures & Algorithms (DSA), Machine Learning (ML), Data Science & Analytics (DS), and Operating Systems & Networks.
- **5-Question Capped Sessions**: Quizzes run as structured 5-question diagnostic assessments with progress tracking, avoiding endless loops, and finishing with an in-depth score and topic mastery breakdown.
- Dynamically fetches questions via `supabase.rpc("next_question", { p_course_id })`.
- Highlights the student's weakest topic with calibrated difficulty and a dynamic "Why this question?" explanation card.
- High-precision response time tracker (in milliseconds).
- Answer submission via `supabase.rpc("submit_answer", { p_question_id, p_selected, p_response_ms })`, computing real-time Exponential Moving Average updates to `cognitive_profiles`.

### 2.1 Institutional Portal Design
- Crisp, professional academic design inspired by institutional portals (referencing `ps.bitsathy.ac.in`).
- Clean white surfaces, slate borders, royal blue accents, and accessible typography with zero dark themes.

### 3. Client-Side Proctoring (`src/lib/proctor.ts`)
- Event listeners for `visibilitychange` (tab switching) and `window.blur` (focus loss).
- Configurable debounce timer to prevent duplicate event spamming.
- Non-returning, blind `INSERT` into `proctoring_events` respecting student RLS (students can insert but cannot query events).
- Transparent notice banner: *"Tab switches are logged and reviewed by your instructor."* (Zero automated failures).

### 4. Instructor Analytics & Flag Review
- Interactive Class Topic Pulse bar chart displaying average trust scores across topics.
- Proctoring flag review table with severity badges (High/Medium/Low), student identifiers, flag timestamps, and one-click **Confirm** and **Dismiss** status updates.

### 5. Practice Recommendation Engine (`lib/recommend.ts`)
- Analyzes course question texts using token frequency and similarity to target the student's weakest topic.
- Generates curated practice lists without requiring external AI APIs.

### 6. Admin & Platform Dashboards
- Tenant Admin (`/admin`): Add and inspect courses and students within the isolated tenant.
- Super Admin (`/platform`): Platform-level tenant provisioning.

---

## Development Setup

See [`SETUP.md`](./SETUP.md) for step-by-step instructions on setting up Supabase, executing migrations, configuring environment variables, and running the development server.
