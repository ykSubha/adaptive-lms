-- ==============================================================================
-- Adaptive Tenant LMS - Supabase Schema
-- Multi-tenant adaptive learning platform with role-based RLS and proctoring
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tenants Table
create table if not exists public.tenants (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    created_at timestamptz default now() not null
);

-- 2. User Roles Enum
create type public.user_role as enum ('student', 'instructor', 'tenant_admin', 'super_admin');

-- 3. Profiles Table (linked to auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    tenant_id uuid references public.tenants(id) on delete cascade,
    email text not null,
    full_name text not null,
    role public.user_role not null default 'student',
    created_at timestamptz default now() not null
);

-- 4. Courses Table
create table if not exists public.courses (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    instructor_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    code text not null,
    description text default '',
    created_at timestamptz default now() not null
);

-- 5. Course Enrollments
create table if not exists public.course_enrollments (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid not null references public.courses(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    enrolled_at timestamptz default now() not null,
    unique(course_id, student_id)
);

-- 6. Course Topics
create table if not exists public.topics (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid not null references public.courses(id) on delete cascade,
    name text not null,
    created_at timestamptz default now() not null
);

-- 7. Questions Table
create table if not exists public.questions (
    id uuid primary key default uuid_generate_v4(),
    course_id uuid not null references public.courses(id) on delete cascade,
    topic_id uuid not null references public.topics(id) on delete cascade,
    question_text text not null,
    options jsonb not null, -- array of strings: ["Option A", "Option B", ...]
    correct_answer text not null,
    explanation text not null default '',
    difficulty numeric(3, 2) not null default 0.50, -- 0.10 to 1.00
    created_at timestamptz default now() not null
);

-- 8. Cognitive Profiles (Per-Student, Per-Topic Trust Score)
-- Trust score is an Exponential Moving Average (EMA) between 0.0 and 1.0
create table if not exists public.cognitive_profiles (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid not null references public.profiles(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    topic_id uuid not null references public.topics(id) on delete cascade,
    trust_score numeric(4, 3) not null default 0.500,
    attempt_count int not null default 0,
    last_updated timestamptz default now() not null,
    unique(student_id, topic_id)
);

-- 9. Proctoring Events Table
create table if not exists public.proctoring_events (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid not null references public.tenants(id) on delete cascade,
    course_id uuid not null references public.courses(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    flag_type text not null check (flag_type in ('tab_switch', 'focus_loss', 'eye_diversion', 'mobile_detected', 'multiple_faces', 'face_missing')),
    confidence numeric(3, 2) not null default 0.85,
    severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
    status text not null default 'pending' check (status in ('pending', 'dismissed', 'confirmed')),
    reviewed_by uuid references public.profiles(id),
    reviewed_at timestamptz,
    created_at timestamptz default now() not null
);

-- 10. Student Answers History
create table if not exists public.quiz_submissions (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid not null references public.profiles(id) on delete cascade,
    question_id uuid not null references public.questions(id) on delete cascade,
    selected_option text not null,
    is_correct boolean not null,
    response_time_ms integer not null,
    created_at timestamptz default now() not null
);

-- ==============================================================================
-- Views
-- ==============================================================================

-- class_topic_pulse: Average trust per topic for instructors
create or replace view public.class_topic_pulse as
select
    c.id as course_id,
    c.title as course_title,
    t.id as topic_id,
    t.name as topic_name,
    round(coalesce(avg(cp.trust_score), 0.500)::numeric, 3) as avg_trust,
    count(distinct cp.student_id)::integer as student_count
from public.courses c
join public.topics t on t.course_id = c.id
left join public.cognitive_profiles cp on cp.topic_id = t.id and cp.course_id = c.id
group by c.id, c.title, t.id, t.name;

-- ==============================================================================
-- Row-Level Security (RLS)
-- ==============================================================================

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.cognitive_profiles enable row level security;
alter table public.proctoring_events enable row level security;
alter table public.quiz_submissions enable row level security;

-- Helper functions for RLS
create or replace function public.current_profile()
returns public.profiles as $$
    select * from public.profiles where id = auth.uid() limit 1;
$$ language sql stable security definer;

-- --- Tenants RLS ---
-- Super admins can select and create tenants.
-- Users can see their own tenant.
create policy "Super admin can select all tenants"
    on public.tenants for select
    using ((select role from public.current_profile()) = 'super_admin');

create policy "Super admin can insert tenants"
    on public.tenants for insert
    with check ((select role from public.current_profile()) = 'super_admin');

create policy "Users can select own tenant"
    on public.tenants for select
    using (id = (select tenant_id from public.current_profile()));

-- --- Profiles RLS ---
-- Super admin can only see their own profile. Super admin must NOT see student/course data.
-- Users can see profiles in their tenant.
-- Tenant admins can insert/update profiles in their tenant.
create policy "Users can read profiles in own tenant"
    on public.profiles for select
    using (
        auth.uid() = id
        or (tenant_id = (select tenant_id from public.current_profile()) and (select role from public.current_profile()) != 'super_admin')
    );

create policy "Tenant admins can insert profiles in own tenant"
    on public.profiles for insert
    with check (
        tenant_id = (select tenant_id from public.current_profile())
        and (select role from public.current_profile()) = 'tenant_admin'
    );

create policy "Tenant admins can update profiles in own tenant"
    on public.profiles for update
    using (
        tenant_id = (select tenant_id from public.current_profile())
        and (select role from public.current_profile()) = 'tenant_admin'
    );

-- --- Courses RLS ---
-- Students see courses they are enrolled in.
-- Instructors see courses they teach.
-- Tenant admin sees courses in their tenant.
-- Super admin CANNOT see courses.
create policy "Course access policy"
    on public.courses for select
    using (
        (select role from public.current_profile()) != 'super_admin'
        and tenant_id = (select tenant_id from public.current_profile())
        and (
            (select role from public.current_profile()) = 'tenant_admin'
            or instructor_id = auth.uid()
            or id in (select course_id from public.course_enrollments where student_id = auth.uid())
        )
    );

create policy "Tenant admin can create courses in own tenant"
    on public.courses for insert
    with check (
        (select role from public.current_profile()) = 'tenant_admin'
        and tenant_id = (select tenant_id from public.current_profile())
    );

-- --- Course Enrollments RLS ---
create policy "Enrollment select policy"
    on public.course_enrollments for select
    using (
        (select role from public.current_profile()) != 'super_admin'
        and (
            student_id = auth.uid()
            or course_id in (select id from public.courses where instructor_id = auth.uid() or tenant_id = (select tenant_id from public.current_profile()))
        )
    );

create policy "Tenant admin can create enrollments"
    on public.course_enrollments for insert
    with check (
        (select role from public.current_profile()) = 'tenant_admin'
    );

-- --- Topics RLS ---
create policy "Topics select policy"
    on public.topics for select
    using (
        (select role from public.current_profile()) != 'super_admin'
        and course_id in (select id from public.courses)
    );

-- --- Questions RLS ---
create policy "Questions select policy"
    on public.questions for select
    using (
        (select role from public.current_profile()) != 'super_admin'
        and course_id in (select id from public.courses)
    );

-- --- Cognitive Profiles RLS ---
create policy "Student reads own cognitive profile"
    on public.cognitive_profiles for select
    using (
        student_id = auth.uid()
        or course_id in (select id from public.courses where instructor_id = auth.uid())
    );

-- --- Proctoring Events RLS ---
-- Students can INSERT but cannot SELECT events!
create policy "Students can insert proctoring events"
    on public.proctoring_events for insert
    with check (
        student_id = auth.uid()
        and tenant_id = (select tenant_id from public.current_profile())
    );

-- Instructors can select events for courses they teach.
-- Beta admin or other tenants cannot see Alpha instructor's events.
create policy "Instructors can select proctoring events for own courses"
    on public.proctoring_events for select
    using (
        (select role from public.current_profile()) = 'instructor'
        and course_id in (select id from public.courses where instructor_id = auth.uid())
    );

-- Instructors can update proctoring events for own courses (Dismiss / Confirm)
create policy "Instructors can update proctoring events for own courses"
    on public.proctoring_events for update
    using (
        (select role from public.current_profile()) = 'instructor'
        and course_id in (select id from public.courses where instructor_id = auth.uid())
    );

-- --- Quiz Submissions RLS ---
create policy "Students can insert their submissions"
    on public.quiz_submissions for insert
    with check (student_id = auth.uid());

create policy "Students can view their submissions"
    on public.quiz_submissions for select
    using (student_id = auth.uid());

-- ==============================================================================
-- Adaptive Engine & Quiz RPC Functions
-- ==============================================================================

-- 1. next_question(p_course_id uuid)
-- Selects question from the student's weakest topic with appropriate difficulty,
-- or introduces new topics, and returns why it was selected.
create or replace function public.next_question(p_course_id uuid)
returns jsonb
language plpgsql
security invoker
as $$
declare
    v_student_id uuid;
    v_weakest_topic_id uuid;
    v_weakest_topic_name text;
    v_weakest_trust numeric;
    v_question record;
    v_why text;
begin
    v_student_id := auth.uid();
    if v_student_id is null then
        raise exception 'Authentication required';
    end if;

    -- Ensure cognitive profiles exist for all topics in the course for this student
    insert into public.cognitive_profiles (student_id, course_id, topic_id, trust_score, attempt_count)
    select v_student_id, p_course_id, t.id, 0.500, 0
    from public.topics t
    where t.course_id = p_course_id
    on conflict (student_id, topic_id) do nothing;

    -- Find the weakest topic for this student in this course
    select cp.topic_id, t.name, cp.trust_score
    into v_weakest_topic_id, v_weakest_topic_name, v_weakest_trust
    from public.cognitive_profiles cp
    join public.topics t on t.id = cp.topic_id
    where cp.student_id = v_student_id and cp.course_id = p_course_id
    order by cp.trust_score asc, cp.attempt_count asc
    limit 1;

    -- If no topic found, grab any topic from course
    if v_weakest_topic_id is null then
        select id, name into v_weakest_topic_id, v_weakest_topic_name
        from public.topics
        where course_id = p_course_id
        limit 1;
        v_weakest_trust := 0.500;
    end if;

    -- Pick a question from this topic targeting difficulty near student's trust score
    -- If trust is low (< 0.45), pick a lower difficulty question (<= 0.50)
    -- If trust is high (> 0.65), pick a higher difficulty question (>= 0.60)
    select q.id, q.course_id, q.topic_id, q.question_text, q.options, q.difficulty
    into v_question
    from public.questions q
    where q.topic_id = v_weakest_topic_id
    order by abs(q.difficulty - v_weakest_trust) asc, random()
    limit 1;

    -- Fallback to any question in the course if none found in topic
    if v_question.id is null then
        select q.id, q.course_id, q.topic_id, q.question_text, q.options, q.difficulty
        into v_question
        from public.questions q
        where q.course_id = p_course_id
        order by random()
        limit 1;
    end if;

    if v_question.id is null then
        return jsonb_build_object('error', 'No questions available for this course');
    end if;

    -- Compose explanation string for "Why this question?"
    v_why := 'Selected based on your mastery in topic "' || v_weakest_topic_name ||
             '" (current trust score: ' || to_char(v_weakest_trust, '0.99') || '). ' ||
             'Calibrated at difficulty ' || to_char(v_question.difficulty, '0.99') || ' to adapt to your learning curve.';

    return jsonb_build_object(
        'id', v_question.id,
        'course_id', v_question.course_id,
        'topic_id', v_question.topic_id,
        'question_text', v_question.question_text,
        'options', v_question.options,
        'difficulty', v_question.difficulty,
        'topic_name', v_weakest_topic_name,
        'why', v_why
    );
end;
$$;

-- 2. submit_answer(p_question_id uuid, p_selected text, p_response_ms int)
-- Evaluates answer, updates cognitive_profiles using Exponential Moving Average,
-- and records submission history.
create or replace function public.submit_answer(
    p_question_id uuid,
    p_selected text,
    p_response_ms integer
)
returns jsonb
language plpgsql
security invoker
as $$
declare
    v_student_id uuid;
    v_question record;
    v_is_correct boolean;
    v_current_trust numeric;
    v_new_trust numeric;
    v_alpha numeric := 0.35; -- EMA smoothing factor
    v_score_val numeric;
begin
    v_student_id := auth.uid();
    if v_student_id is null then
        raise exception 'Authentication required';
    end if;

    -- Retrieve question details
    select id, course_id, topic_id, correct_answer, explanation, difficulty
    into v_question
    from public.questions
    where id = p_question_id;

    if v_question.id is null then
        raise exception 'Question not found';
    end if;

    v_is_correct := (trim(lower(p_selected)) = trim(lower(v_question.correct_answer)));

    -- Target score for this attempt (1.0 for correct, 0.0 for incorrect)
    if v_is_correct then
        v_score_val := 1.0;
    else
        v_score_val := 0.0;
    end if;

    -- Get current trust score from cognitive profile
    select trust_score into v_current_trust
    from public.cognitive_profiles
    where student_id = v_student_id and topic_id = v_question.topic_id;

    if v_current_trust is null then
        v_current_trust := 0.500;
    end if;

    -- Exponential Moving Average: new_trust = alpha * score + (1 - alpha) * current_trust
    -- If response time was excessively fast on a wrong answer (guess), penalize slightly
    v_new_trust := round((v_alpha * v_score_val + (1.0 - v_alpha) * v_current_trust)::numeric, 3);
    if v_new_trust < 0.050 then v_new_trust := 0.050; end if;
    if v_new_trust > 0.990 then v_new_trust := 0.990; end if;

    -- Upsert cognitive profile
    insert into public.cognitive_profiles (
        student_id, course_id, topic_id, trust_score, attempt_count, last_updated
    ) values (
        v_student_id, v_question.course_id, v_question.topic_id, v_new_trust, 1, now()
    )
    on conflict (student_id, topic_id) do update set
        trust_score = v_new_trust,
        attempt_count = public.cognitive_profiles.attempt_count + 1,
        last_updated = now();

    -- Record quiz submission
    insert into public.quiz_submissions (
        student_id, question_id, selected_option, is_correct, response_time_ms
    ) values (
        v_student_id, p_question_id, p_selected, v_is_correct, coalesce(p_response_ms, 0)
    );

    return jsonb_build_object(
        'is_correct', v_is_correct,
        'correct_answer', v_question.correct_answer,
        'explanation', v_question.explanation,
        'updated_trust_score', v_new_trust,
        'topic_id', v_question.topic_id
    );
end;
$$;
