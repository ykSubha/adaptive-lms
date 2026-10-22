import { Tenant, Profile, Course, Topic, CognitiveProfile, Question, ProctoringEvent, ClassTopicPulse } from './types';

export const INITIAL_TENANTS: Tenant[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'School of Computing & Engineering', slug: 'alpha', created_at: '2026-01-01T00:00:00Z' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Department of Information Sciences', slug: 'beta', created_at: '2026-01-01T00:00:00Z' }
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    email: 'student@alpha.test',
    full_name: 'Alice Vance',
    role: 'student',
    knowledge_score: 74,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    email: 'student@beta.test',
    full_name: 'Bob Chen',
    role: 'student',
    knowledge_score: 62,
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
    full_name: 'Arthur Mitchell',
    role: 'tenant_admin',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    tenant_id: null,
    email: 'super@demo.test',
    full_name: 'Samuel Hayes',
    role: 'super_admin',
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    instructor_id: '44444444-4444-4444-4444-444444444441',
    title: 'Computer Science Core (DSA, ML & Data Science)',
    code: 'CSE-401',
    description: 'Comprehensive curriculum covering Data Structures & Algorithms, Machine Learning fundamentals, Data Science pipelines, and Operating Systems.',
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
  { id: 't-dsa', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Data Structures & Algorithms (DSA)', created_at: '2026-01-01T00:00:00Z' },
  { id: 't-ml', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Machine Learning (ML)', created_at: '2026-01-01T00:00:00Z' },
  { id: 't-ds', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Data Science & Analytics (DS)', created_at: '2026-01-01T00:00:00Z' },
  { id: 't-os', course_id: 'c1111111-1111-1111-1111-111111111111', name: 'Operating Systems & Networks', created_at: '2026-01-01T00:00:00Z' },
  { id: 't-py-vars', course_id: 'c2222222-2222-2222-2222-222222222222', name: 'Variables & Data Types', created_at: '2026-01-01T00:00:00Z' },
  { id: 't-py-loops', course_id: 'c2222222-2222-2222-2222-222222222222', name: 'Conditionals & Loops', created_at: '2026-01-01T00:00:00Z' }
];

export const INITIAL_COGNITIVE_PROFILES: CognitiveProfile[] = [
  { id: 'cp-1', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't-dsa', trust_score: 0.820, attempt_count: 8, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-2', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't-ds', trust_score: 0.580, attempt_count: 5, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-3', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't-os', trust_score: 0.440, attempt_count: 3, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-4', student_id: '33333333-3333-3333-3333-333333333331', course_id: 'c1111111-1111-1111-1111-111111111111', topic_id: 't-ml', trust_score: 0.280, attempt_count: 2, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-5', student_id: '33333333-3333-3333-3333-333333333332', course_id: 'c2222222-2222-2222-2222-222222222222', topic_id: 't-py-vars', trust_score: 0.720, attempt_count: 5, last_updated: '2026-01-01T00:00:00Z' },
  { id: 'cp-6', student_id: '33333333-3333-3333-3333-333333333332', course_id: 'c2222222-2222-2222-2222-222222222222', topic_id: 't-py-loops', trust_score: 0.460, attempt_count: 3, last_updated: '2026-01-01T00:00:00Z' }
];

export const INITIAL_QUESTIONS: Question[] = [
  // --- TOPIC: DSA (Data Structures & Algorithms) ---
  {
    id: 'dsa-1',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'What is the time complexity to access an element by index in a contiguous array?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correct_answer: 'O(1)',
    explanation: 'Arrays store elements in contiguous memory locations, allowing direct memory offset computation in constant O(1) time.',
    difficulty: 0.20
  },
  {
    id: 'dsa-2',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'Which algorithm detects cycles in a linked list using two pointers moving at different speeds?',
    options: ['Floyd Cycle-Finding (Tortoise and Hare)', 'Dijkstra Algorithm', 'Kruskal Algorithm', 'Boyer-Moore Voting'],
    correct_answer: 'Floyd Cycle-Finding (Tortoise and Hare)',
    explanation: 'Floyd cycle detection moves a slow pointer by 1 step and a fast pointer by 2 steps. If a cycle exists, they meet.',
    difficulty: 0.45
  },
  {
    id: 'dsa-3',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'In a standard Binary Search Tree (BST), what traversal order outputs the keys in ascending order?',
    options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
    correct_answer: 'In-order',
    explanation: 'In-order traversal visits left subtree, root, then right subtree, which yields sorted values for a valid BST.',
    difficulty: 0.35
  },
  {
    id: 'dsa-4',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'What two key properties must a problem exhibit for Dynamic Programming to be applicable?',
    options: ['Optimal substructure and overlapping subproblems', 'Greedy choice and linearity', 'Divide and conquer and randomness', 'Memoization and recursion depth'],
    correct_answer: 'Optimal substructure and overlapping subproblems',
    explanation: 'Dynamic Programming requires that optimal solutions to subproblems form optimal overall solutions, and subproblems recur frequently.',
    difficulty: 0.50
  },
  {
    id: 'dsa-5',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'What is the average time complexity of QuickSort on an array of size n?',
    options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'],
    correct_answer: 'O(n log n)',
    explanation: 'QuickSort divides the problem recursively with an average balanced partition leading to O(n log n) expected time.',
    difficulty: 0.40
  },
  {
    id: 'dsa-6',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'Which data structure is primarily used to implement Breadth-First Search (BFS) on a graph?',
    options: ['Queue', 'Stack', 'Priority Queue', 'Disjoint Set'],
    correct_answer: 'Queue',
    explanation: 'BFS explores vertices level by level in First-In-First-Out (FIFO) order, which is implemented using a Queue.',
    difficulty: 0.30
  },
  {
    id: 'dsa-7',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-dsa',
    question_text: 'In the 0/1 Knapsack problem with n items and capacity W, what is the standard DP time complexity?',
    options: ['O(n * W)', 'O(2^n)', 'O(n + W)', 'O(W^2)'],
    correct_answer: 'O(n * W)',
    explanation: 'The 2D dynamic programming grid computes n rows for W columns, leading to pseudo-polynomial O(n * W) time.',
    difficulty: 0.70
  },

  // --- TOPIC: ML (Machine Learning) ---
  {
    id: 'ml-1',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'What term describes a model that performs exceptionally on training data but poorly on unseen test data?',
    options: ['Overfitting', 'Underfitting', 'High Bias', 'Data Leakage'],
    correct_answer: 'Overfitting',
    explanation: 'Overfitting occurs when a model learns noise and details of the training set rather than the underlying general relationship.',
    difficulty: 0.25
  },
  {
    id: 'ml-2',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'Which regularization technique adds the sum of absolute values of coefficients (L1 penalty) to the loss function?',
    options: ['Lasso Regularization', 'Ridge Regularization', 'Dropout', 'Batch Normalization'],
    correct_answer: 'Lasso Regularization',
    explanation: 'Lasso (L1) regularization penalizes absolute weights, often driving redundant feature coefficients strictly to zero.',
    difficulty: 0.45
  },
  {
    id: 'ml-3',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'What activation function outputs values in the range (0, 1), making it ideal for binary classification probability outputs?',
    options: ['Sigmoid', 'ReLU', 'Leaky ReLU', 'Tanh'],
    correct_answer: 'Sigmoid',
    explanation: 'The sigmoid function f(x) = 1 / (1 + e^-x) maps any real value into the probabilistic interval (0, 1).',
    difficulty: 0.30
  },
  {
    id: 'ml-4',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'Which metric is calculated as True Positives divided by (True Positives + False Negatives)?',
    options: ['Recall (Sensitivity)', 'Precision', 'F1-Score', 'Specificity'],
    correct_answer: 'Recall (Sensitivity)',
    explanation: 'Recall measures the proportion of actual positive cases that were correctly identified by the classifier.',
    difficulty: 0.40
  },
  {
    id: 'ml-5',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'What optimizer maintains per-parameter adaptive learning rates based on both first and second moments of gradients?',
    options: ['Adam Optimizer', 'Vanilla SGD', 'Momentum SGD', 'Adagrad'],
    correct_answer: 'Adam Optimizer',
    explanation: 'Adaptive Moment Estimation (Adam) combines momentum and RMSprop heuristics to adapt parameter learning rates dynamically.',
    difficulty: 0.60
  },
  {
    id: 'ml-6',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'In decision trees, what metric evaluates the purity of a node based on entropy reduction?',
    options: ['Information Gain', 'Gini Impurity', 'Variance Reduction', 'Log Loss'],
    correct_answer: 'Information Gain',
    explanation: 'Information Gain computes the reduction in entropy achieved by partitioning samples on a given attribute.',
    difficulty: 0.50
  },
  {
    id: 'ml-7',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ml',
    question_text: 'What algorithm is an unsupervised learning technique used for clustering observations into k centroid partitions?',
    options: ['K-Means Clustering', 'K-Nearest Neighbors', 'Support Vector Machine', 'Linear Discriminant Analysis'],
    correct_answer: 'K-Means Clustering',
    explanation: 'K-Means partitions data into k non-overlapping clusters by iteratively assigning points to the nearest cluster centroid.',
    difficulty: 0.35
  },

  // --- TOPIC: DS (Data Science & Analytics) ---
  {
    id: 'ds-1',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ds',
    question_text: 'According to the Central Limit Theorem, what distribution does the sample mean approach as sample size n grows large?',
    options: ['Normal (Gaussian) Distribution', 'Uniform Distribution', 'Poisson Distribution', 'Exponential Distribution'],
    correct_answer: 'Normal (Gaussian) Distribution',
    explanation: 'The Central Limit Theorem guarantees that sample averages approach a bell-shaped Normal distribution regardless of the underlying population distribution.',
    difficulty: 0.30
  },
  {
    id: 'ds-2',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ds',
    question_text: 'In exploratory data analysis, which visual plot displays the median, quartiles, and outliers of a numerical feature?',
    options: ['Box Plot (Whisker Plot)', 'Scatter Plot', 'Heatmap', 'Pie Chart'],
    correct_answer: 'Box Plot (Whisker Plot)',
    explanation: 'Box plots illustrate five-number summaries (minimum, Q1, median, Q3, maximum) and flag values outside 1.5 * IQR as outliers.',
    difficulty: 0.25
  },
  {
    id: 'ds-3',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ds',
    question_text: 'What type of error is committed when a test rejects the null hypothesis even though the null hypothesis is true?',
    options: ['Type I Error (False Positive)', 'Type II Error (False Negative)', 'Sampling Bias', 'Measurement Error'],
    correct_answer: 'Type I Error (False Positive)',
    explanation: 'A Type I error (alpha level) occurs when you conclude an effect exists when in reality the null hypothesis holds true.',
    difficulty: 0.50
  },
  {
    id: 'ds-4',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ds',
    question_text: 'In SQL data manipulation, what clause filters groups created by the GROUP BY statement?',
    options: ['HAVING', 'WHERE', 'FILTER', 'LIMIT'],
    correct_answer: 'HAVING',
    explanation: 'The WHERE clause filters individual rows before grouping, whereas the HAVING clause filters aggregate groups afterwards.',
    difficulty: 0.35
  },
  {
    id: 'ds-5',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ds',
    question_text: 'What dimensional reduction technique projects high-dimensional features along orthogonal directions of maximum variance?',
    options: ['Principal Component Analysis (PCA)', 't-SNE', 'Random Projection', 'Linear Regression'],
    correct_answer: 'Principal Component Analysis (PCA)',
    explanation: 'PCA performs eigendecomposition on the covariance matrix to identify orthogonal principal components capturing maximal sample variance.',
    difficulty: 0.65
  },
  {
    id: 'ds-6',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-ds',
    question_text: 'What scaling method rescales numerical data so that the resulting distribution has a mean of 0 and standard deviation of 1?',
    options: ['Standardization (Z-score Scaling)', 'Min-Max Normalization', 'Robust Scaling', 'Decimal Scaling'],
    correct_answer: 'Standardization (Z-score Scaling)',
    explanation: 'Standardization calculates (x - mean) / std, ensuring zero mean and unit variance across features.',
    difficulty: 0.30
  },

  // --- TOPIC: OS & Systems ---
  {
    id: 'os-1',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-os',
    question_text: 'Which of the following is NOT one of the four Coffman conditions necessary for a deadlock to occur?',
    options: ['Preemption allowed', 'Mutual Exclusion', 'Hold and Wait', 'Circular Wait'],
    correct_answer: 'Preemption allowed',
    explanation: 'The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock is prevented.',
    difficulty: 0.40
  },
  {
    id: 'os-2',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-os',
    question_text: 'What hardware component translates virtual page addresses into physical frame memory addresses in modern CPUs?',
    options: ['Memory Management Unit (MMU)', 'Arithmetic Logic Unit (ALU)', 'Instruction Register', 'Control Unit'],
    correct_answer: 'Memory Management Unit (MMU)',
    explanation: 'The MMU, aided by the Translation Lookaside Buffer (TLB), performs hardware translation from virtual to physical memory.',
    difficulty: 0.35
  },
  {
    id: 'os-3',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-os',
    question_text: 'In Unix process management, which system call creates a duplicate child process of the calling process?',
    options: ['fork()', 'exec()', 'clone()', 'spawn()'],
    correct_answer: 'fork()',
    explanation: 'fork() duplicates the calling process, creating an exact copy child process with a distinct Process Identifier (PID).',
    difficulty: 0.25
  },
  {
    id: 'os-4',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-os',
    question_text: 'What scheduling anomaly occurs in First-Come-First-Serve (FCFS) when short processes wait behind a long CPU-intensive process?',
    options: ['Convoy Effect', 'Belady Anomaly', 'Starvation', 'Priority Inversion'],
    correct_answer: 'Convoy Effect',
    explanation: 'The convoy effect happens in non-preemptive FCFS when a huge CPU-bound process causes all subsequent I/O and short processes to stall.',
    difficulty: 0.45
  },
  {
    id: 'os-5',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    topic_id: 't-os',
    question_text: 'Which transport layer protocol provides reliable, connection-oriented, ordered byte-stream delivery with congestion control?',
    options: ['TCP', 'UDP', 'ICMP', 'IGMP'],
    correct_answer: 'TCP',
    explanation: 'Transmission Control Protocol (TCP) establishes a 3-way handshake and handles sequence numbers, retransmissions, and flow control.',
    difficulty: 0.20
  },

  // --- TOPIC: Python (Beta Tenant) ---
  {
    id: 'py-1',
    course_id: 'c2222222-2222-2222-2222-222222222222',
    topic_id: 't-py-vars',
    question_text: 'Which of the following is an immutable data type in Python?',
    options: ['tuple', 'list', 'dict', 'set'],
    correct_answer: 'tuple',
    explanation: 'Tuples in Python cannot be modified after creation, making them immutable.',
    difficulty: 0.25
  },
  {
    id: 'py-2',
    course_id: 'c2222222-2222-2222-2222-222222222222',
    topic_id: 't-py-loops',
    question_text: 'What keyword is used to exit a loop prematurely in Python?',
    options: ['break', 'continue', 'pass', 'return'],
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
    flag_type: 'mobile_detected',
    confidence: 0.94,
    severity: 'high',
    status: 'pending',
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Vance', email: 'student@alpha.test' },
    course: { title: 'Computer Science Core (DSA, ML & Data Science)', code: 'CSE-401' }
  },
  {
    id: 'f1111111-1111-1111-1111-111111111102',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    student_id: '33333333-3333-3333-3333-333333333331',
    flag_type: 'eye_diversion',
    confidence: 0.78,
    severity: 'medium',
    status: 'pending',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Vance', email: 'student@alpha.test' },
    course: { title: 'Computer Science Core (DSA, ML & Data Science)', code: 'CSE-401' }
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
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Vance', email: 'student@alpha.test' },
    course: { title: 'Computer Science Core (DSA, ML & Data Science)', code: 'CSE-401' }
  },
  {
    id: 'f1111111-1111-1111-1111-111111111104',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    course_id: 'c1111111-1111-1111-1111-111111111111',
    student_id: '33333333-3333-3333-3333-333333333331',
    flag_type: 'focus_loss',
    confidence: 0.60,
    severity: 'medium',
    status: 'confirmed',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    student: { full_name: 'Alice Vance', email: 'student@alpha.test' },
    course: { title: 'Computer Science Core (DSA, ML & Data Science)', code: 'CSE-401' }
  }
];
