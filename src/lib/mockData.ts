import { Tenant, Profile, Course, Topic, CognitiveProfile, Question, ProctoringEvent, ClassTopicPulse } from './types';

export const INITIAL_TENANTS: Tenant[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Alpha Academy', slug: 'alpha', created_at: '2026-01-01T00:00:00Z' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Beta Institute', slug: 'beta', created_at: '2026-01-01T00:00:00Z' }
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    email: 'student@alpha.test',
    full_name: 'Alice Student',
    role: 'student',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    email: 'student@beta.test',
    full_name: 'Bob Beta',
    role: 'student',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444441',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    email: 'instructor@alpha.test',
    full_name: 'Dr. Sarah Stone',
    role: 'instructor',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '55555555-5555-5555-5555-555555555551',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@alpha.test',
    full_name: 'Arthur Admin',
    role: 'tenant_admin',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    tenant_id: null,
    email: 'super@demo.test',
    full_name: 'Sam Superadmin',
    role: 'super_admin',
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    instructor_id: '44444444-4444-4444-4444-444444444441',
    title: 'Data Structures & Algorithms',
    code: 'CS-201',
    description: 'Core computer science fundamentals covering arrays, lists, trees, graphs, and dynamic programming.',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    instructor_id: '44444444-4444-4444-4444-444444444441',
    title: 'Intro to Python',
    code: 'PY-101',
    description: 'Beginner friendly programming concepts in modern Python 3.',
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_ENROLLMENTS = [
  { course_id: 'c1111111-1111-1111-1111-111111111111', student_id: '33333333-3333-3333-3333-333333333331' },
  { course_id: 'c2222222-2222-2222-2222-222222222222', student_id: '33333333-3333-3333-3333-333333333332' }
];

export const INITIAL_TOPICS: Topic[] = [
  { id: 't1111111-1111-1111-1111-111111111101', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Arrays & Strings', created_at: '2026-01-01T00:00:00Z' },
  { id: 't1111111-1111-1111-1111-111111111102', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Linked Lists', created_at: '2026-01-01T00:00:00Z' },
  { id: 't1111111-1111-1111-1111-111111111103', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Binary Search Trees', created_at: '2026-01-01T00:00:00Z' },
  { id: 't1111111-1111-1111-1111-111111111104', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Dynamic Programming', created_at: '2026-01-01T00:00:00Z' },
  { id: 't2222222-2222-2222-2222-222222222201', course_id: 'c2222222-2222-2222-2222-222222222222', name: 'Variables & Data Types', created_at: '2026-01-01T00:00:00Z' },
  { id: 't2222222-2222-2222-2222-222222222202', course_id: 'c2222222-2222-2222-2222-222222222222', name: 'Conditionals & Loops', created_at: '2026-01-01T00:00:00Z' }
];

export const INITIAL_COGNITIVE_PROFILES: CognitiveProfile[] = [
  { id: 'cp-1', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't1111111-1111-1111-1111-111111111101', trust_score: 0.850, attempt_count: 8, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-2', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't1111111-1111-1111-1111-111111111102', trust_score: 0.550, attempt_count: 4, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-3', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't1111111-1111-1111-1111-111111111103', trust_score: 0.420, attempt_count: 3, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-4', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't1111111-1111-1111-1111-111111111104', trust_score: 0.220, attempt_count: 2, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-5', student_id: '33333333-3333-3333-3333-333333333332', course_id: 'c2222222-2222-2222-2222-222222222222', topic_id: 't2222222-2222-2222-2222-222222222201', trust_score: 0.700, attempt_count: 5, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-6', student_id: '33333333-3333-3333-3333-333333333332', course_id: 'c2222222-2222-2222-2222-222222222222', topic_id: 't2222222-2222-2222-2222-222222222202', trust_score: 0.480, attempt_count: 3, last_updated: '2026-01-01T00:00:00Z' }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111101',
    question_text: 'What is the time complexity to access an element by index in a contiguous array?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correct_answer: 'O(1)',
    explanation: 'Arrays store elements in contiguous memory locations, allowing direct memory offset computation in constant O(1) time.',
    difficulty: 0.20
  },
  {
    id: 'q2',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111101',
    question_text: 'Which algorithmic technique uses two pointers moving towards each other to solve palindrome checks in O(n) time?',
    options: ['Sliding Window', 'Two Pointers', 'Divide and Conquer', 'Backtracking'],
    correct_answer: 'Two Pointers',
    explanation: 'The two-pointer technique uses left and right indices converging to inspect paired characters.',
    difficulty: 0.45
  },
  {
    id: 'q3',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111102',
    question_text: 'What is the time complexity to insert a node at the head of a singly linked list?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    correct_answer: 'O(1)',
    explanation: 'Inserting at the head simply requires pointing the new node to the old head and updating the head pointer.',
    difficulty: 0.30
  },
  {
    id: 'q4',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111102',
    question_text: 'Which algorithm detects cycles in a linked list using two pointers moving at different speeds?',
    options: ['Floyd Cycle-Finding (Tortoise and Hare)', 'Dijkstra Algorithm', 'Kruskal Algorithm', 'Boyer-Moore Voting'],
    correct_answer: 'Floyd Cycle-Finding (Tortoise and Hare)',
    explanation: 'Floyd cycle detection moves a slow pointer by 1 step and a fast pointer by 2 steps. If a cycle exists, they meet.',
    difficulty: 0.60
  },
  {
    id: 'q5',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111103',
    question_text: 'In a standard Binary Search Tree (BST), what traversal order outputs the keys in ascending order?',
    options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
    correct_answer: 'In-order',
    explanation: 'In-order traversal visits left subtree, root, then right subtree, which yields sorted values for a valid BST.',
    difficulty: 0.40
  },
  {
    id: 'q6',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111103',
    question_text: 'What is the worst-case search time complexity in an unbalanced binary search tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
    correct_answer: 'O(n)',
    explanation: 'An unbalanced BST can degenerate into a linear linked list where lookup requires O(n) steps.',
    difficulty: 0.50
  },
  {
    id: 'q7',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111104',
    question_text: 'What two key properties must a problem exhibit for Dynamic Programming to be applicable?',
    options: ['Greedy choice and linearity', 'Optimal substructure and overlapping subproblems', 'Divide and conquer and randomness', 'Memoization and recursion depth'],
    correct_answer: 'Optimal substructure and overlapping subproblems',
    explanation: 'Dynamic Programming requires that optimal solutions to subproblems form optimal overall solutions, and subproblems recur frequently.',
    difficulty: 0.35
  },
  {
    id: 'q8',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111104',
    question_text: 'What is the core difference between memoization and tabulation in dynamic programming?',
    options: ['Memoization is top-down; tabulation is bottom-up', 'Memoization uses tables; tabulation uses queues', 'Tabulation requires recursion; memoization is iterative', 'There is no functional difference'],
    correct_answer: 'Memoization is top-down; tabulation is bottom-up',
    explanation: 'Memoization caches answers during recursive top-down calls, while tabulation builds an iterative table from base cases upward.',
    difficulty: 0.55
  },
  {
    id: 'q9',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't1111111-1111-1111-1111-111111111104',
    question_text: 'In the 0/1 Knapsack problem with n items and capacity W, what is the standard DP time complexity?',
    options: ['O(2^n)', 'O(n * W)', 'O(n + W)', 'O(W^2)'],
    correct_answer: 'O(n * W)',
    explanation: 'The 2D dynamic programming grid computes n rows for W columns, leading to pseudo-polynomial O(n * W) time.',
    difficulty: 0.75
  },
  {
    id: 'q10',
    course_id: 'c2222222-2222-2222-2222-222222222222',
    topic_id: 't2222222-2222-2222-2222-222222222201',
    question_text: 'Which of the following is an immutable data type in Python?',
    options: ['list', 'dict', 'tuple', 'set'],
    correct_answer: 'tuple',
    explanation: 'Tuples in Python cannot be modified after creation, making them immutable.',
    difficulty: 0.25
  },
  {
    id: 'q11',
    course_id: 'c2222222-2222-2222-2222-222222222222',
    topic_id: 't2222222-2222-2222-2222-222222222202',
    question_text: 'What keyword is used to exit a loop prematurely in Python?',
    options: ['continue', 'break', 'pass', 'return'],
    correct_answer: 'break',
    explanation: 'The break keyword terminates the innermost loop execution immediately.',
    difficulty: 0.20
  }
];

export const INITIAL_PROCTORING_EVENTS: ProctoringEvent[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111101',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    student_id: '33333333-3333-3333-3333-333333333331',
    flag_type: 'tab_switch',
    confidence: 0.85,
    severity: 'high',
    status: 'pending',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Student', email: 'student@alpha.test' },
    course: { title: 'Data Structures & Algorithms', code: 'CS-201' }
  },
  {
    id: 'f1111111-1111-1111-1111-111111111102',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    student_id: '33333333-3333-3333-3333-333333333331',
    flag_type: 'focus_loss',
    confidence: 0.60,
    severity: 'medium',
    status: 'pending',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Student', email: 'student@alpha.test' },
    course: { title: 'Data Structures & Algorithms', code: 'CS-201' }
  },
  {
    id: 'f1111111-1111-1111-1111-111111111103',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    student_id: '33333333-3333-3333-3333-333333333331',
    flag_type: 'tab_switch',
    confidence: 0.85,
    severity: 'high',
    status: 'pending',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Student', email: 'student@alpha.test' },
    course: { title: 'Data Structures & Algorithms', code: 'CS-201' }
  }
];
