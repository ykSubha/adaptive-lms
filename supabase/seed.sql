-- ==============================================================================
-- Adaptive Tenant LMS - Supabase Seed Data
-- ==============================================================================

-- 1. Tenants
insert into public.tenants (id, name, slug) values
('11111111-1111-1111-1111-111111111111', 'Alpha Academy', 'alpha'),
('22222222-2222-2222-2222-222222222222', 'Beta Institute', 'beta')
on conflict (id) do nothing;

-- 2. Auth Users & Profiles
-- Using fixed UUIDs for seed accounts
-- Passwords will be configured in Supabase or handled via email/pass auth.
-- IDs:
-- Alpha Student:    33333333-3333-3333-3333-333333333331
-- Beta Student:     33333333-3333-3333-3333-333333333332
-- Alpha Instructor: 44444444-4444-4444-4444-444444444441
-- Alpha Admin:      55555555-5555-5555-5555-555555555551
-- Super Admin:      99999999-9999-9999-9999-999999999999

-- Create auth.users records if running with superuser in local postgres/supabase
do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
        -- Insert auth.users
        insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        values
        ('33333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student@alpha.test', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Student"}', now(), now()),
        ('33333333-3333-3333-3333-333333333332', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student@beta.test', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bob Beta"}', now(), now()),
        ('44444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'instructor@alpha.test', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sarah Stone"}', now(), now()),
        ('55555555-5555-5555-5555-555555555551', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@alpha.test', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arthur Admin"}', now(), now()),
        ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'super@demo.test', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Superadmin"}', now(), now())
        on conflict (id) do nothing;
    end if;
end $$;

-- Insert into public.profiles
insert into public.profiles (id, tenant_id, email, full_name, role) values
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'student@alpha.test', 'Alice Student', 'student'),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'student@beta.test', 'Bob Beta', 'student'),
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'instructor@alpha.test', 'Dr. Sarah Stone', 'instructor'),
('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'admin@alpha.test', 'Arthur Admin', 'tenant_admin'),
('99999999-9999-9999-9999-999999999999', null, 'super@demo.test', 'Sam Superadmin', 'super_admin')
on conflict (id) do update set
    role = excluded.role,
    tenant_id = excluded.tenant_id,
    full_name = excluded.full_name;

-- 3. Courses
-- Alpha Tenant: "Data Structures" (taught by Dr. Stone)
-- Beta Tenant: "Intro to Python"
insert into public.courses (id, tenant_id, instructor_id, title, code, description) values
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'Data Structures & Algorithms', 'CS-201', 'Core computer science fundamentals covering arrays, lists, trees, graphs, and dynamic programming.')
on conflict (id) do nothing;

insert into public.courses (id, tenant_id, instructor_id, title, code, description) values
('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Intro to Python', 'PY-101', 'Beginner friendly programming concepts in modern Python 3.')
on conflict (id) do nothing;

-- 4. Course Enrollments
-- Alpha student enrolled in Data Structures ONLY
insert into public.course_enrollments (course_id, student_id) values
('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331')
on conflict (course_id, student_id) do nothing;

-- Beta student enrolled in Intro to Python ONLY
insert into public.course_enrollments (course_id, student_id) values
('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332')
on conflict (course_id, student_id) do nothing;

-- 5. Topics for Data Structures
insert into public.topics (id, course_id, name) values
('t1111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111111', 'Arrays & Strings'),
('t1111111-1111-1111-1111-111111111102', 'c1111111-1111-1111-1111-111111111111', 'Linked Lists'),
('t1111111-1111-1111-1111-111111111103', 'c1111111-1111-1111-1111-111111111111', 'Binary Search Trees'),
('t1111111-1111-1111-1111-111111111104', 'c1111111-1111-1111-1111-111111111111', 'Dynamic Programming')
on conflict (id) do nothing;

-- Topics for Intro to Python
insert into public.topics (id, course_id, name) values
('t2222222-2222-2222-2222-222222222201', 'c2222222-2222-2222-2222-222222222222', 'Variables & Data Types'),
('t2222222-2222-2222-2222-222222222202', 'c2222222-2222-2222-2222-222222222222', 'Conditionals & Loops'),
('t2222222-2222-2222-2222-222222222203', 'c2222222-2222-2222-2222-222222222222', 'Functions & Scope')
on conflict (id) do nothing;

-- 6. Initial Cognitive Profiles (Alpha Student - Heatmap Colors)
-- Arrays: 0.850 (Green)
-- Linked Lists: 0.550 (Yellow)
-- Binary Search Trees: 0.420 (Yellow/Orange)
-- Dynamic Programming: 0.220 (Red - Weakest Topic)
insert into public.cognitive_profiles (student_id, course_id, topic_id, trust_score, attempt_count, last_updated) values
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111101', 0.850, 8, now()),
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111102', 0.550, 4, now()),
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111103', 0.420, 3, now()),
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111104', 0.220, 2, now())
on conflict (student_id, topic_id) do nothing;

-- 7. Questions
-- Data Structures: Arrays & Strings
insert into public.questions (course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111101', 'What is the time complexity to access an element by index in a contiguous array?', '["O(1)", "O(n)", "O(log n)", "O(n^2)"]'::jsonb, 'O(1)', 'Arrays store elements in contiguous memory locations, allowing direct memory offset computation in constant O(1) time.', 0.20),
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111101', 'Which algorithmic technique uses two pointers moving towards each other to solve palindrome checks in O(n) time?', '["Sliding Window", "Two Pointers", "Divide and Conquer", "Backtracking"]'::jsonb, 'Two Pointers', 'The two-pointer technique uses left and right indices converging to inspect paired characters.', 0.45);

-- Data Structures: Linked Lists
insert into public.questions (course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111102', 'What is the time complexity to insert a node at the head of a singly linked list?', '["O(1)", "O(n)", "O(log n)", "O(n log n)"]'::jsonb, 'O(1)', 'Inserting at the head simply requires pointing the new node to the old head and updating the head pointer.', 0.30),
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111102', 'Which algorithm detects cycles in a linked list using two pointers moving at different speeds?', '["Floyd Cycle-Finding (Tortoise and Hare)", "Dijkstra Algorithm", "Kruskal Algorithm", "Boyer-Moore Voting"]'::jsonb, 'Floyd Cycle-Finding (Tortoise and Hare)', 'Floyd cycle detection moves a slow pointer by 1 step and a fast pointer by 2 steps. If a cycle exists, they meet.', 0.60);

-- Data Structures: Binary Search Trees
insert into public.questions (course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111103', 'In a standard Binary Search Tree (BST), what traversal order outputs the keys in ascending order?', '["Pre-order", "In-order", "Post-order", "Level-order"]'::jsonb, 'In-order', 'In-order traversal visits left subtree, root, then right subtree, which yields sorted values for a valid BST.', 0.40),
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111103', 'What is the worst-case search time complexity in an unbalanced binary search tree?', '["O(1)", "O(log n)", "O(n)", "O(n^2)"]'::jsonb, 'O(n)', 'An unbalanced BST can degenerate into a linear linked list where lookup requires O(n) steps.', 0.50);

-- Data Structures: Dynamic Programming (Weakest Topic)
insert into public.questions (course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111104', 'What two key properties must a problem exhibit for Dynamic Programming to be applicable?', '["Greedy choice and linearity", "Optimal substructure and overlapping subproblems", "Divide and conquer and randomness", "Memoization and recursion depth"]'::jsonb, 'Optimal substructure and overlapping subproblems', 'Dynamic Programming requires that optimal solutions to subproblems form optimal overall solutions, and subproblems recur frequently.', 0.35),
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111104', 'What is the core difference between memoization and tabulation in dynamic programming?', '["Memoization is top-down; tabulation is bottom-up", "Memoization uses tables; tabulation uses queues", "Tabulation requires recursion; memoization is iterative", "There is no functional difference"]'::jsonb, 'Memoization is top-down; tabulation is bottom-up', 'Memoization caches answers during recursive top-down calls, while tabulation builds an iterative table from base cases upward.', 0.55),
('c1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111104', 'In the 0/1 Knapsack problem with n items and capacity W, what is the standard DP time complexity?', '["O(2^n)", "O(n * W)", "O(n + W)", "O(W^2)"]'::jsonb, 'O(n * W)', 'The 2D dynamic programming grid computes n rows for W columns, leading to pseudo-polynomial O(n * W) time.', 0.75);

-- Intro to Python Questions (Beta Tenant)
insert into public.questions (course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('c2222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222201', 'Which of the following is an immutable data type in Python?', '["list", "dict", "tuple", "set"]'::jsonb, 'tuple', 'Tuples in Python cannot be modified after creation, making them immutable.', 0.25),
('c2222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222202', 'What keyword is used to exit a loop prematurely in Python?', '["continue", "break", "pass", "return"]'::jsonb, 'break', 'The break keyword terminates the innermost loop execution immediately.', 0.20);

-- 8. Seed Proctoring Events
-- For Alpha instructor to review (course: Data Structures, student: Alice)
insert into public.proctoring_events (id, tenant_id, course_id, student_id, flag_type, confidence, severity, status, created_at) values
('f1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'tab_switch', 0.85, 'high', 'pending', now() - interval '25 minutes'),
('f1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'focus_loss', 0.60, 'medium', 'pending', now() - interval '18 minutes'),
('f1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'tab_switch', 0.85, 'high', 'pending', now() - interval '8 minutes')
on conflict (id) do nothing;
