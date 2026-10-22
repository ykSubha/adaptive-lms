-- ==============================================================================
-- Adaptive Tenant LMS - Supabase Seed Data
-- ==============================================================================

-- 1. Tenants
insert into public.tenants (id, name, slug) values
('11111111-1111-1111-1111-111111111111', 'Alpha Academy', 'alpha'),
('22222222-2222-2222-2222-222222222222', 'Beta Institute', 'beta')
on conflict (id) do nothing;

-- 2. Auth Users & Profiles
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
insert into public.courses (id, tenant_id, instructor_id, title, code, description) values
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'Computer Science Core (DSA, ML & Data Science)', 'CSE-401', 'Comprehensive curriculum covering Data Structures & Algorithms, Machine Learning fundamentals, Data Science pipelines, and Operating Systems.')
on conflict (id) do nothing;

insert into public.courses (id, tenant_id, instructor_id, title, code, description) values
('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', 'Intro to Python', 'PY-101', 'Beginner friendly programming concepts in modern Python 3.')
on conflict (id) do nothing;

-- 4. Course Enrollments
insert into public.course_enrollments (course_id, student_id) values
('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331'),
('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332')
on conflict (course_id, student_id) do nothing;

-- 5. Topics
insert into public.topics (id, course_id, name) values
('t-dsa', 'c1111111-1111-1111-1111-111111111111', 'Data Structures & Algorithms (DSA)'),
('t-ml', 'c1111111-1111-1111-1111-111111111111', 'Machine Learning (ML)'),
('t-ds', 'c1111111-1111-1111-1111-111111111111', 'Data Science & Analytics (DS)'),
('t-os', 'c1111111-1111-1111-1111-111111111111', 'Operating Systems & Networks'),
('t-py-vars', 'c2222222-2222-2222-2222-222222222222', 'Variables & Data Types'),
('t-py-loops', 'c2222222-2222-2222-2222-222222222222', 'Conditionals & Loops')
on conflict (id) do nothing;

-- 6. Cognitive Profiles (Alpha Student - DSA 0.820 Green, DS 0.580 Yellow, OS 0.440 Yellow, ML 0.280 Red)
insert into public.cognitive_profiles (student_id, course_id, topic_id, trust_score, attempt_count, last_updated) values
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 0.820, 8, now()),
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't-ds', 0.580, 5, now()),
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't-os', 0.440, 3, now()),
('33333333-3333-3333-3333-333333333331', 'c1111111-1111-1111-1111-111111111111', 't-ml', 0.280, 2, now())
on conflict (student_id, topic_id) do nothing;

-- 7. Questions (5-7 questions per topic)
-- DSA
insert into public.questions (id, course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('dsa-1', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 'What is the time complexity to access an element by index in a contiguous array?', '["O(1)", "O(n)", "O(log n)", "O(n^2)"]'::jsonb, 'O(1)', 'Arrays store elements in contiguous memory locations, allowing direct memory offset computation in constant O(1) time.', 0.20),
('dsa-2', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 'Which algorithm detects cycles in a linked list using two pointers moving at different speeds?', '["Floyd Cycle-Finding (Tortoise and Hare)", "Dijkstra Algorithm", "Kruskal Algorithm", "Boyer-Moore Voting"]'::jsonb, 'Floyd Cycle-Finding (Tortoise and Hare)', 'Floyd cycle detection moves a slow pointer by 1 step and a fast pointer by 2 steps. If a cycle exists, they meet.', 0.45),
('dsa-3', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 'In a standard Binary Search Tree (BST), what traversal order outputs the keys in ascending order?', '["Pre-order", "In-order", "Post-order", "Level-order"]'::jsonb, 'In-order', 'In-order traversal visits left subtree, root, then right subtree, which yields sorted values for a valid BST.', 0.35),
('dsa-4', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 'What two key properties must a problem exhibit for Dynamic Programming to be applicable?', '["Optimal substructure and overlapping subproblems", "Greedy choice and linearity", "Divide and conquer and randomness", "Memoization and recursion depth"]'::jsonb, 'Optimal substructure and overlapping subproblems', 'Dynamic Programming requires that optimal solutions to subproblems form optimal overall solutions, and subproblems recur frequently.', 0.50),
('dsa-5', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 'What is the average time complexity of QuickSort on an array of size n?', '["O(n log n)", "O(n^2)", "O(n)", "O(log n)"]'::jsonb, 'O(n log n)', 'QuickSort divides the problem recursively with an average balanced partition leading to O(n log n) expected time.', 0.40),
('dsa-6', 'c1111111-1111-1111-1111-111111111111', 't-dsa', 'Which data structure is primarily used to implement Breadth-First Search (BFS) on a graph?', '["Queue", "Stack", "Priority Queue", "Disjoint Set"]'::jsonb, 'Queue', 'BFS explores vertices level by level in First-In-First-Out (FIFO) order, which is implemented using a Queue.', 0.30)
on conflict (id) do nothing;

-- ML
insert into public.questions (id, course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('ml-1', 'c1111111-1111-1111-1111-111111111111', 't-ml', 'What term describes a model that performs exceptionally on training data but poorly on unseen test data?', '["Overfitting", "Underfitting", "High Bias", "Data Leakage"]'::jsonb, 'Overfitting', 'Overfitting occurs when a model learns noise and details of the training set rather than the underlying general relationship.', 0.25),
('ml-2', 'c1111111-1111-1111-1111-111111111111', 't-ml', 'Which regularization technique adds the sum of absolute values of coefficients (L1 penalty) to the loss function?', '["Lasso Regularization", "Ridge Regularization", "Dropout", "Batch Normalization"]'::jsonb, 'Lasso Regularization', 'Lasso (L1) regularization penalizes absolute weights, often driving redundant feature coefficients strictly to zero.', 0.45),
('ml-3', 'c1111111-1111-1111-1111-111111111111', 't-ml', 'What activation function outputs values in the range (0, 1), making it ideal for binary classification probability outputs?', '["Sigmoid", "ReLU", "Leaky ReLU", "Tanh"]'::jsonb, 'Sigmoid', 'The sigmoid function f(x) = 1 / (1 + e^-x) maps any real value into the probabilistic interval (0, 1).', 0.30),
('ml-4', 'c1111111-1111-1111-1111-111111111111', 't-ml', 'Which metric is calculated as True Positives divided by (True Positives + False Negatives)?', '["Recall (Sensitivity)", "Precision", "F1-Score", "Specificity"]'::jsonb, 'Recall (Sensitivity)', 'Recall measures the proportion of actual positive cases that were correctly identified by the classifier.', 0.40),
('ml-5', 'c1111111-1111-1111-1111-111111111111', 't-ml', 'What optimizer maintains per-parameter adaptive learning rates based on both first and second moments of gradients?', '["Adam Optimizer", "Vanilla SGD", "Momentum SGD", "Adagrad"]'::jsonb, 'Adam Optimizer', 'Adaptive Moment Estimation (Adam) combines momentum and RMSprop heuristics to adapt parameter learning rates dynamically.', 0.60)
on conflict (id) do nothing;

-- DS
insert into public.questions (id, course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('ds-1', 'c1111111-1111-1111-1111-111111111111', 't-ds', 'According to the Central Limit Theorem, what distribution does the sample mean approach as sample size n grows large?', '["Normal (Gaussian) Distribution", "Uniform Distribution", "Poisson Distribution", "Exponential Distribution"]'::jsonb, 'Normal (Gaussian) Distribution', 'The Central Limit Theorem guarantees that sample averages approach a bell-shaped Normal distribution regardless of the underlying population distribution.', 0.30),
('ds-2', 'c1111111-1111-1111-1111-111111111111', 't-ds', 'In exploratory data analysis, which visual plot displays the median, quartiles, and outliers of a numerical feature?', '["Box Plot (Whisker Plot)", "Scatter Plot", "Heatmap", "Pie Chart"]'::jsonb, 'Box Plot (Whisker Plot)', 'Box plots illustrate five-number summaries (minimum, Q1, median, Q3, maximum) and flag values outside 1.5 * IQR as outliers.', 0.25),
('ds-3', 'c1111111-1111-1111-1111-111111111111', 't-ds', 'What type of error is committed when a test rejects the null hypothesis even though the null hypothesis is true?', '["Type I Error (False Positive)", "Type II Error (False Negative)", "Sampling Bias", "Measurement Error"]'::jsonb, 'Type I Error (False Positive)', 'A Type I error (alpha level) occurs when you conclude an effect exists when in reality the null hypothesis holds true.', 0.50),
('ds-4', 'c1111111-1111-1111-1111-111111111111', 't-ds', 'In SQL data manipulation, what clause filters groups created by the GROUP BY statement?', '["HAVING", "WHERE", "FILTER", "LIMIT"]'::jsonb, 'HAVING', 'The WHERE clause filters individual rows before grouping, whereas the HAVING clause filters aggregate groups afterwards.', 0.35)
on conflict (id) do nothing;

-- OS
insert into public.questions (id, course_id, topic_id, question_text, options, correct_answer, explanation, difficulty) values
('os-1', 'c1111111-1111-1111-1111-111111111111', 't-os', 'Which of the following is NOT one of the four Coffman conditions necessary for a deadlock to occur?', '["Preemption allowed", "Mutual Exclusion", "Hold and Wait", "Circular Wait"]'::jsonb, 'Preemption allowed', 'The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock is prevented.', 0.40),
('os-2', 'c1111111-1111-1111-1111-111111111111', 't-os', 'What hardware component translates virtual page addresses into physical frame memory addresses in modern CPUs?', '["Memory Management Unit (MMU)", "Arithmetic Logic Unit (ALU)", "Instruction Register", "Control Unit"]'::jsonb, 'Memory Management Unit (MMU)', 'The MMU, aided by the Translation Lookaside Buffer (TLB), performs hardware translation from virtual to physical memory.', 0.35),
('os-3', 'c1111111-1111-1111-1111-111111111111', 't-os', 'In Unix process management, which system call creates a duplicate child process of the calling process?', '["fork()", "exec()", "clone()", "spawn()"]'::jsonb, 'fork()', 'fork() duplicates the calling process, creating an exact copy child process with a distinct Process Identifier (PID).', 0.25)
on conflict (id) do nothing;

-- 8. Seed Proctoring Events
insert into public.proctoring_events (id, tenant_id, course_id, student_id, flag_type, confidence, severity, status, created_at) values
('f1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'tab_switch', 0.85, 'high', 'pending', now() - interval '25 minutes'),
('f1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'focus_loss', 0.60, 'medium', 'pending', now() - interval '18 minutes')
on conflict (id) do nothing;
