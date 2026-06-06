import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

/* ═══════════════════════════════════════════════════════
   AI Mock Interview API — Comprehensive
   GET  /api/ai/mock-interview?userId=xxx
   POST /api/ai/mock-interview  { action, ... }

   Architecture:
   Student → Interview Setup → Question Generator → Interview Session → Evaluation Engine → Feedback Report

   Actions:
   - "start"           → Generate personalized interview questions, create session
   - "submit_answer"   → Evaluate answer in real-time, return feedback + score
   - "complete"        → Finalize interview, generate report, update skill graph
   ═══════════════════════════════════════════════════════ */

// ==================== TYPES ====================

interface InterviewQuestionData {
  id: string
  question: string
  questionType: 'conceptual' | 'practical' | 'scenario' | 'behavioral' | 'definition' | 'comparison'
  topic: string
  difficulty: string
  orderIndex: number
}

interface InterviewSessionData {
  id: string
  domain: string
  difficulty: string
  type: string
  status: string
  questions: InterviewQuestionData[]
}

interface EvaluationResult {
  score: number
  feedback: string
  idealAnswer: string
}

interface DomainInfo {
  id: string
  name: string
  icon: string
  sessions: number
  avgScore: number
  weakAreas: string[]
}

interface InterviewReport {
  overallScore: number
  accuracy: number
  completeness: number
  clarity: number
  confidence: number
  strengths: string[]
  weaknesses: string[]
  feedback: string
  recommendations: {
    type: 'lesson' | 'quiz' | 'practice' | 'revision'
    topic: string
    reason: string
  }[]
  skillUpdates: {
    topic: string
    previousMastery: number
    newMastery: number
    direction: 'improved' | 'needs_revision'
  }[]
}

// ==================== DOMAIN CONFIGURATION ====================

const DOMAIN_CONFIG: Record<string, { name: string; icon: string; topics: string[]; behavioralTopics?: string[] }> = {
  python: {
    name: 'Python',
    icon: '💻',
    topics: ['Variables & Data Types', 'Control Flow', 'Functions & Scope', 'OOP Concepts', 'Decorators & Generators', 'Error Handling', 'File I/O', 'Modules & Packages', 'List Comprehensions', 'Lambda Functions'],
    behavioralTopics: ['Problem-Solving Approach', 'Debugging Methodology', 'Code Quality Practices'],
  },
  machine_learning: {
    name: 'Machine Learning',
    icon: '🧠',
    topics: ['Supervised Learning', 'Unsupervised Learning', 'Classification', 'Regression', 'Neural Networks', 'Model Evaluation', 'Feature Engineering', 'Hyperparameter Tuning', 'Overfitting & Regularization', 'Cross-Validation'],
    behavioralTopics: ['ML Project Workflow', 'Data Ethics', 'Model Deployment Considerations'],
  },
  web_development: {
    name: 'Web Development',
    icon: '🌐',
    topics: ['HTML & CSS', 'JavaScript Fundamentals', 'React Components', 'REST APIs', 'State Management', 'Responsive Design', 'Authentication', 'Performance Optimization', 'Database Design', 'Security Best Practices'],
    behavioralTopics: ['Development Workflow', 'Code Review Practices', 'Agile Methodology'],
  },
  data_science: {
    name: 'Data Science',
    icon: '📊',
    topics: ['Descriptive Statistics', 'Probability Theory', 'Data Cleaning', 'Data Visualization', 'Hypothesis Testing', 'Pandas & NumPy', 'Feature Selection', 'A/B Testing', 'Statistical Modeling', 'ETL Pipelines'],
    behavioralTopics: ['Data-Driven Decision Making', 'Communicating Results', 'Stakeholder Management'],
  },
  general: {
    name: 'General',
    icon: '🎯',
    topics: ['Problem Solving', 'Critical Thinking', 'Communication', 'Teamwork', 'Time Management', 'Adaptability', 'Leadership', 'Creativity'],
    behavioralTopics: ['Conflict Resolution', 'Working Under Pressure', 'Career Goals'],
  },
}

// ==================== FALLBACK QUESTION TEMPLATES ====================

const FALLBACK_QUESTIONS: Record<string, Record<string, { question: string; questionType: InterviewQuestionData['questionType']; topic: string; idealAnswer: string }[]>> = {
  python: {
    beginner: [
      { question: 'What are the basic data types in Python? Explain each briefly.', questionType: 'conceptual', topic: 'Variables & Data Types', idealAnswer: 'Python has several basic data types: int (integers like 5), float (decimals like 3.14), str (strings like "hello"), bool (True/False), list (ordered mutable collection), tuple (ordered immutable collection), dict (key-value pairs), and set (unordered unique elements).' },
      { question: 'How does a for loop differ from a while loop in Python? Give an example of each.', questionType: 'comparison', topic: 'Control Flow', idealAnswer: 'A for loop iterates over a sequence (list, string, range) with a known number of iterations. A while loop repeats as long as a condition is True, with potentially unknown iterations. For: for i in range(5): print(i). While: while x > 0: x -= 1.' },
      { question: 'Write a Python function that takes a list of numbers and returns the average.', questionType: 'practical', topic: 'Functions & Scope', idealAnswer: 'def calculate_average(numbers): return sum(numbers) / len(numbers) if numbers else 0. This handles the empty list case and uses built-in sum() and len() functions.' },
      { question: 'What is the difference between a list and a tuple in Python?', questionType: 'comparison', topic: 'Variables & Data Types', idealAnswer: 'Lists are mutable (can be modified after creation) using square brackets []. Tuples are immutable (cannot be changed) using parentheses (). Lists have methods like append(), remove(); tuples do not. Tuples are faster and can be used as dictionary keys.' },
      { question: 'Explain what a dictionary is in Python and how to add, access, and remove a key-value pair.', questionType: 'conceptual', topic: 'Variables & Data Types', idealAnswer: 'A dictionary is an unordered collection of key-value pairs. Add: my_dict["key"] = "value". Access: my_dict["key"] or my_dict.get("key"). Remove: del my_dict["key"] or my_dict.pop("key").' },
    ],
    intermediate: [
      { question: 'Explain the concept of decorators in Python. How would you create a simple timing decorator?', questionType: 'conceptual', topic: 'Decorators & Generators', idealAnswer: 'Decorators are functions that modify the behavior of other functions without changing their code. They use the @decorator syntax. A timing decorator wraps a function, records start time, calls the function, records end time, and prints the duration. It uses functools.wraps to preserve metadata.' },
      { question: 'What is the difference between __init__ and __new__ in Python classes?', questionType: 'comparison', topic: 'OOP Concepts', idealAnswer: '__new__ is called to create a new instance (it allocates memory and returns the object), while __init__ is called to initialize the already-created instance. __new__ is a class method, __init__ is an instance method. __new__ is rarely overridden except in metaclasses or singleton patterns.' },
      { question: 'You have a function that processes a large file. How would you use generators to make it memory-efficient?', questionType: 'scenario', topic: 'Decorators & Generators', idealAnswer: 'Instead of reading the entire file into memory, use a generator that yields one line at a time: def read_large_file(filepath): with open(filepath) as f: for line in f: yield line.strip(). This processes one line at a time, keeping memory usage constant regardless of file size.' },
      { question: 'Explain Python\'s GIL (Global Interpreter Lock) and its implications for multi-threaded programs.', questionType: 'conceptual', topic: 'Modules & Packages', idealAnswer: 'The GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously. It means CPU-bound multi-threaded Python programs cannot achieve true parallelism. Solutions include using multiprocessing, asyncio for I/O-bound tasks, or C extensions that release the GIL.' },
      { question: 'Write a context manager that temporarily redirects stdout to a file.', questionType: 'practical', topic: 'Error Handling', idealAnswer: 'Use contextlib.contextmanager decorator: @contextmanager def redirect_stdout(filepath): import sys; original = sys.stdout; f = open(filepath, "w"); sys.stdout = f; try: yield; finally: sys.stdout = original; f.close(). Usage: with redirect_stdout("output.txt"): print("goes to file")' },
    ],
    advanced: [
      { question: 'Explain Python\'s descriptor protocol and how it enables property(), classmethod(), and staticmethod().', questionType: 'conceptual', topic: 'OOP Concepts', idealAnswer: 'Descriptors are objects with __get__, __set__, or __delete__ methods. When accessed as class attributes, these methods are called. property() creates a data descriptor with getter/setter/deleter. classmethod() and staticmethod() are non-data descriptors that modify method binding. Descriptors power much of Python\'s OOP machinery.' },
      { question: 'Design a plugin system using Python metaclasses that auto-discovers and registers classes.', questionType: 'scenario', topic: 'OOP Concepts', idealAnswer: 'Create a metaclass with __init__ that registers each class in a registry dict. class PluginMeta(type): plugins = {}; def __init__(cls, name, bases, attrs): super().__init__(name, bases, attrs); if name != "Plugin": PluginMeta.plugins[name] = cls. Then class Plugin(metaclass=PluginMeta): pass. Each subclass auto-registers.' },
      { question: 'How would you implement a memory-efficient, lazily-evaluated data pipeline using generator expressions and itertools?', questionType: 'practical', topic: 'Decorators & Generators', idealAnswer: 'Chain generator expressions with itertools: import itertools as it; lines = (line.strip() for line in open("data.txt")); parsed = (parse(line) for line in lines if line); filtered = (item for item in parsed if item.value > threshold); batched = it.batched(filtered, 100). Each step is lazy—no data loaded until consumed. Memory stays constant.' },
      { question: 'Explain the difference between __getattribute__ and __getattr__. When would you use each?', questionType: 'comparison', topic: 'OOP Concepts', idealAnswer: '__getattribute__ is called for EVERY attribute access (can cause infinite recursion if misused). __getattr__ is called only when normal attribute lookup fails. Use __getattribute__ for complete control over all access; use __getattr__ for dynamic attributes or fallback behavior. Most custom logic should use __getattr__ or properties.' },
      { question: 'Describe how Python\'s import system works from sys.meta_path finders to module spec creation.', questionType: 'conceptual', topic: 'Modules & Packages', idealAnswer: 'Import starts with sys.meta_path finders (BuiltinImporter, FrozenImporter, PathFinder). PathFinder uses sys.path hooks to find path entry finders. The finder creates a ModuleSpec. The loader (from spec) executes the module code. Meta path finders can customize import behavior entirely, enabling lazy imports, virtual modules, etc.' },
    ],
  },
  machine_learning: {
    beginner: [
      { question: 'What is the difference between supervised and unsupervised learning? Give examples of each.', questionType: 'comparison', topic: 'Supervised Learning', idealAnswer: 'Supervised learning uses labeled data (input-output pairs) to learn a mapping: classification (spam detection) and regression (price prediction). Unsupervised learning finds patterns in unlabeled data: clustering (customer segmentation) and dimensionality reduction (PCA). Semi-supervised combines both.' },
      { question: 'Explain what a decision tree is and how it makes splits.', questionType: 'conceptual', topic: 'Classification', idealAnswer: 'A decision tree splits data based on feature values to maximize information gain (or minimize impurity). For classification, it uses Gini impurity or entropy. For regression, it minimizes variance. Each internal node tests a feature, branches represent outcomes, and leaves give predictions. It recursively splits until a stopping criterion.' },
      { question: 'What is overfitting and how can you detect it in your model?', questionType: 'conceptual', topic: 'Overfitting & Regularization', idealAnswer: 'Overfitting occurs when a model learns training data noise rather than the underlying pattern, performing well on training but poorly on test data. Detect by comparing training vs validation accuracy—a large gap indicates overfitting. Remedies include regularization, more training data, cross-validation, early stopping, and simpler models.' },
      { question: 'A company wants to predict customer churn. What type of ML problem is this and what algorithms would you consider?', questionType: 'scenario', topic: 'Classification', idealAnswer: 'Customer churn prediction is a binary classification problem (churn/not churn). Consider logistic regression (baseline, interpretable), random forest (handles non-linearity, feature importance), gradient boosting (XGBoost/LightGBM for best performance), or neural networks. Start simple, then increase complexity as needed.' },
      { question: 'What is the confusion matrix and which metrics can you derive from it?', questionType: 'conceptual', topic: 'Model Evaluation', idealAnswer: 'A confusion matrix shows TP, FP, TN, FN counts. From it derive: Accuracy = (TP+TN)/Total, Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = 2*P*R/(P+R), Specificity = TN/(TN+FP). Choose metrics based on problem: precision for spam, recall for disease detection.' },
    ],
    intermediate: [
      { question: 'Explain the bias-variance tradeoff. How does model complexity affect each?', questionType: 'conceptual', topic: 'Overfitting & Regularization', idealAnswer: 'Bias is error from oversimplifying assumptions (underfitting). Variance is error from sensitivity to training data fluctuations (overfitting). As complexity increases, bias decreases but variance increases. The sweet spot minimizes total error. Regularization adds controlled bias to reduce variance. Cross-validation finds the optimal complexity.' },
      { question: 'Compare Random Forest and Gradient Boosting. When would you prefer one over the other?', questionType: 'comparison', topic: 'Classification', idealAnswer: 'Random Forest builds independent trees in parallel (bagging), reducing variance. Gradient Boosting builds sequential trees where each corrects previous errors (boosting), reducing bias. RF is more robust, easier to tune, parallelizable. GB often achieves higher accuracy but is more sensitive to hyperparameters and prone to overfitting. Prefer RF for robustness, GB for maximum accuracy.' },
      { question: 'You are training a neural network and the loss plateaus. Describe your troubleshooting approach.', questionType: 'scenario', topic: 'Neural Networks', idealAnswer: 'Check: 1) Learning rate (try schedule or reduce), 2) Gradient flow (vanishing/exploding—try BatchNorm, skip connections), 3) Architecture (widen/deepen, try different activation), 4) Data issues (shuffle, augment, check labels), 5) Optimizer (try Adam if using SGD), 6) Regularization (reduce dropout if too aggressive), 7) Initialize properly (He/Xavier).' },
      { question: 'Explain cross-validation. Why is k-fold preferred over a simple train/test split?', questionType: 'conceptual', topic: 'Cross-Validation', idealAnswer: 'Cross-validation partitions data into k folds, trains on k-1, tests on 1, rotating. K-fold gives: more reliable performance estimate (averages over k splits), uses all data for both training and testing, provides variance estimate. Simple split is fast but unreliable with small datasets. Common k=5 or 10; stratified for class imbalance.' },
      { question: 'How would you handle a dataset with severe class imbalance (e.g., 99% negative, 1% positive)?', questionType: 'scenario', topic: 'Classification', idealAnswer: 'Approaches: 1) Resampling: SMOTE for oversampling minority, undersampling majority, 2) Class weights in loss function (penalize minority misclassification more), 3) Different thresholds (optimize F1/PR-AUC instead of accuracy), 4) Ensemble methods (balanced bagging), 5) Anomaly detection framing. Evaluate using precision-recall AUC, not accuracy.' },
    ],
    advanced: [
      { question: 'Derive the gradient of the cross-entropy loss with softmax from first principles. Why is it numerically stable to compute the softmax and loss together?', questionType: 'conceptual', topic: 'Neural Networks', idealAnswer: 'Softmax: p_i = exp(z_i)/sum(exp(z_j)). Cross-entropy: L = -sum(y_i * log(p_i)). Gradient: dL/dz_i = p_i - y_i (the softmax output minus the one-hot target). Computing together is numerically stable because we can use the log-sum-exp trick: subtract max(z) before exponentiation, preventing overflow/underflow in the intermediate exp() computation.' },
      { question: 'Explain the attention mechanism in transformers. How does self-attention differ from cross-attention?', questionType: 'conceptual', topic: 'Neural Networks', idealAnswer: 'Attention computes weighted values: Attention(Q,K,V) = softmax(QK^T/√d_k)V. Self-attention: Q, K, V all from same sequence (each position attends to all others). Cross-attention: Q from one sequence, K,V from another (e.g., decoder attends to encoder outputs). Multi-head attention runs multiple in parallel with different projections, capturing diverse relationships.' },
      { question: 'Design a hyperparameter optimization pipeline that efficiently searches a large space with limited compute budget.', questionType: 'scenario', topic: 'Hyperparameter Tuning', idealAnswer: 'Use Bayesian optimization (e.g., Optuna) with: 1) Define search space with priors (log-uniform for learning rates), 2) TPE sampler for efficient exploration, 3) Early stopping (pruning) for unpromising trials, 4) Multi-objective optimization (accuracy vs latency), 5) Warm-start from previous studies, 6) Distributed trials across GPUs. Start broad, then narrow around promising regions.' },
      { question: 'Compare the computational complexity of different attention mechanisms: standard, linear, and flash attention.', questionType: 'comparison', topic: 'Neural Networks', idealAnswer: 'Standard attention: O(n²d) time and O(n²) memory—quadratic in sequence length. Linear attention (Performers, Linear Transformer): O(nd²) by approximating softmax kernel—good for very long sequences. Flash Attention: O(n²d) compute but O(n) memory via tiling and kernel fusion—same math, much faster in practice due to reduced HBM reads/writes. Flash Attention 2 further optimizes parallelism.' },
      { question: 'Explain how gradient accumulation and mixed precision training work. What are the tradeoffs?', questionType: 'conceptual', topic: 'Neural Networks', idealAnswer: 'Gradient accumulation: Forward/backward pass on micro-batches, accumulate gradients, then update—simulates larger batch size on limited GPU memory. Mixed precision: Use FP16 for forward/backward (2x throughput, 50% memory), FP32 master weights for accuracy—loss scaling prevents gradient underflow. Tradeoffs: Accumulation adds latency per step; mixed precision can cause instability for some architectures (need loss scaling tuning).' },
    ],
  },
  web_development: {
    beginner: [
      { question: 'What is the difference between HTML elements and HTML attributes? Give examples.', questionType: 'comparison', topic: 'HTML & CSS', idealAnswer: 'Elements define structure and content (e.g., <p>, <div>, <h1>). Attributes provide additional information about elements (e.g., class, id, href, src). Example: <a href="url" class="link">Text</a> — <a> is the element, href and class are attributes.' },
      { question: 'Explain the CSS box model. What are its components?', questionType: 'conceptual', topic: 'HTML & CSS', idealAnswer: 'The box model describes how elements are rendered: Content (actual text/image), Padding (space between content and border), Border (around padding), Margin (space outside border). box-sizing: border-box includes padding and border in the element\'s width/height, making layouts more predictable.' },
      { question: 'What is the DOM and how does JavaScript interact with it?', questionType: 'conceptual', topic: 'JavaScript Fundamentals', idealAnswer: 'The DOM (Document Object Model) is a tree representation of HTML. JavaScript interacts via APIs: document.getElementById(), querySelector(), createElement(). It can modify content (textContent, innerHTML), styles (style property), attributes, and structure (appendChild, removeChild). Events are handled via addEventListener().' },
      { question: 'Create a simple React component that displays a counter with increment and decrement buttons.', questionType: 'practical', topic: 'React Components', idealAnswer: 'function Counter() { const [count, setCount] = useState(0); return (<div><p>Count: {count}</p><button onClick={() => setCount(c => c+1)}>+</button><button onClick={() => setCount(c => c-1)}>-</button></div>); }. Uses useState hook for state, functional updates to avoid stale closures.' },
      { question: 'What is responsive design and how do you achieve it?', questionType: 'conceptual', topic: 'Responsive Design', idealAnswer: 'Responsive design ensures websites work on all screen sizes. Techniques: CSS media queries (@media), flexible layouts (flexbox, grid), responsive images (srcset), viewport meta tag, relative units (%, rem, vh/vw), mobile-first approach. CSS frameworks like Tailwind provide responsive utilities (sm:, md:, lg:).' },
    ],
    intermediate: [
      { question: 'Explain React hooks rules. Why can\'t hooks be called inside conditionals or loops?', questionType: 'conceptual', topic: 'React Components', idealAnswer: 'Hooks must be called in the same order every render. React relies on call order to match state to hooks (internal linked list). If hooks are conditional, the order changes between renders, causing state mismatch bugs. The linter rule enforces this. Solution: move conditionals inside the hook callback, not around the hook call.' },
      { question: 'What are REST API design best practices? How would you design a CRUD API for a "courses" resource?', questionType: 'conceptual', topic: 'REST APIs', idealAnswer: 'Best practices: Use nouns for resources (/courses), HTTP methods for actions (GET=list/get, POST=create, PUT=update, DELETE=remove), proper status codes (200, 201, 400, 404), pagination, filtering, versioning (/api/v1/), consistent error format. CRUD: GET /courses, GET /courses/:id, POST /courses, PUT /courses/:id, DELETE /courses/:id.' },
      { question: 'You notice your React app is slow when rendering a list of 10,000 items. How would you optimize it?', questionType: 'scenario', topic: 'Performance Optimization', idealAnswer: 'Approaches: 1) Virtualization (react-window/react-virtualized)—only render visible items, 2) React.memo for list items to prevent unnecessary re-renders, 3) Pagination instead of showing all items, 4) useMemo for computed/filtered data, 5) Key prop using stable IDs (not index), 6) Debounce search input, 7) Code split heavy components with React.lazy.' },
      { question: 'Explain the difference between JWT and session-based authentication. What are the tradeoffs?', questionType: 'comparison', topic: 'Authentication', idealAnswer: 'Session-based: Server stores session, client gets cookie with session ID. JWT: Server issues signed token, client stores it, server validates signature. Sessions: easier to revoke, server memory overhead, CSRF risk. JWT: stateless, scalable, no server storage, but harder to revoke, token size overhead, XSS risk if stored in localStorage. Use httpOnly cookies for JWT to mitigate XSS.' },
      { question: 'How does CSS Grid differ from Flexbox? When would you use each?', questionType: 'comparison', topic: 'HTML & CSS', idealAnswer: 'Flexbox is one-dimensional (row OR column). Grid is two-dimensional (rows AND columns). Use Flexbox for: navigation, card rows, centering, aligning items within a container. Use Grid for: page layouts, dashboard grids, complex 2D layouts, overlapping elements. They can be nested: Grid for overall layout, Flexbox for component internals.' },
    ],
    advanced: [
      { question: 'Explain how React Server Components work. What problems do they solve compared to client components?', questionType: 'conceptual', topic: 'React Components', idealAnswer: 'RSC run on the server, reducing client JS bundle. They can directly access databases, file systems, and server APIs. Client components (marked "use client") hydrate and run in browser. RSC solve: bundle size, waterfall requests, direct backend access. They stream HTML, enabling progressive loading. Tradeoff: no useState/useEffect in server components, no browser APIs.' },
      { question: 'Design a real-time collaborative editing system. How would you handle concurrent edits and conflict resolution?', questionType: 'scenario', topic: 'State Management', idealAnswer: 'Use Operational Transformation (OT) or CRDTs (Conflict-free Replicated Data Types). OT: transforms operations based on concurrent edits—used by Google Docs. CRDTs: mathematically guarantee convergence without coordination—simpler but larger state. Architecture: WebSocket for real-time sync, server as authority, client-side optimistic updates, version vectors for ordering, undo support via operation inversion.' },
      { question: 'Explain the Critical Rendering Path. How would you optimize Time to First Byte (TTFB) and Largest Contentful Paint (LCP)?', questionType: 'conceptual', topic: 'Performance Optimization', idealAnswer: 'CRP: HTML parse → DOM → CSSOM → Render Tree → Layout → Paint → Composite. TTFB: CDN, edge functions, server caching, connection pooling, streaming SSR. LCP: preload hero images, optimize images (WebP/AVIF, responsive srcset), avoid layout shifts (set dimensions), reduce render-blocking resources, use fetchpriority="high" on LCP image, early hint (103) responses.' },
      { question: 'Compare Next.js App Router SSR, SSG, ISR, and CSR. When is each appropriate?', questionType: 'comparison', topic: 'React Components', idealAnswer: 'SSR: Server renders on each request—dynamic, personalized pages. SSG: Build-time rendering—static content, fastest, CDN-cacheable. ISR: SSG + revalidation—static but updates on interval or on-demand. CSR: Client renders—interactive dashboards, auth-gated pages. Choose: SSG for blogs/docs, ISR for product pages, SSR for personalized feeds, CSR for real-time dashboards.' },
      { question: 'How would you implement a micro-frontend architecture? What are the key challenges?', questionType: 'scenario', topic: 'State Management', idealAnswer: 'Approaches: Module Federation (webpack 5), single-spa, or iframe-based. Key challenges: Shared dependencies (dedupe React), CSS isolation (shadow DOM or CSS modules), shared state (custom events, pub/sub, or shared store), routing coordination, consistent UI (shared design system), deployment independence, performance overhead. Use Module Federation for best DX; single-spa for framework flexibility.' },
    ],
  },
  data_science: {
    beginner: [
      { question: 'What is the difference between mean, median, and mode? When would you use each?', questionType: 'comparison', topic: 'Descriptive Statistics', idealAnswer: 'Mean: average, sensitive to outliers. Median: middle value, robust to outliers. Mode: most frequent value. Use mean for symmetric distributions without outliers. Use median for skewed data or when outliers exist (house prices, income). Use mode for categorical data or finding the most common value.' },
      { question: 'Explain what a p-value is in simple terms.', questionType: 'conceptual', topic: 'Hypothesis Testing', idealAnswer: 'A p-value is the probability of observing results at least as extreme as the actual results, assuming the null hypothesis is true. A small p-value (typically <0.05) suggests the observed data is unlikely under the null hypothesis, leading us to reject it. It does NOT measure the probability that the hypothesis is true.' },
      { question: 'You have a dataset with missing values. What strategies can you use to handle them?', questionType: 'scenario', topic: 'Data Cleaning', idealAnswer: 'Strategies: 1) Deletion: drop rows/columns (if few missing), 2) Mean/median/mode imputation (simple but reduces variance), 3) Forward/backward fill (time series), 4) Interpolation (linear, spline), 5) KNN imputation (uses similar rows), 6) Model-based imputation (MICE), 7) Flag as missing (add indicator column). Choice depends on missingness mechanism: MCAR, MAR, or MNAR.' },
      { question: 'What is the normal distribution and why is it important in statistics?', questionType: 'conceptual', topic: 'Probability Theory', idealAnswer: 'The normal distribution is a bell-shaped curve symmetric around the mean, defined by mean (μ) and standard deviation (σ). Important because: Central Limit Theorem (sample means approach normal), many natural phenomena follow it, statistical tests assume it (t-test, ANOVA), 68-95-99.7 rule for confidence intervals.' },
      { question: 'What are the most common types of data visualizations and when would you use each?', questionType: 'conceptual', topic: 'Data Visualization', idealAnswer: 'Bar chart: categorical comparisons. Line chart: trends over time. Scatter plot: relationships between two variables. Histogram: distribution of a continuous variable. Box plot: distribution summary and outliers. Heatmap: correlation matrix or 2D data. Pie chart: proportional composition (use sparingly). Choose based on data type and question being answered.' },
    ],
    intermediate: [
      { question: 'Explain the Central Limit Theorem and its practical implications for data analysis.', questionType: 'conceptual', topic: 'Probability Theory', idealAnswer: 'CLT states that the sampling distribution of the mean approaches normal as sample size increases, regardless of population distribution. Practical implications: can use z-tests and t-tests, confidence intervals are valid, sample sizes of 30+ often sufficient, enables inference about population parameters from samples. Key assumption: independent, identically distributed samples.' },
      { question: 'Compare Type I and Type II errors. How do you balance them in practice?', questionType: 'comparison', topic: 'Hypothesis Testing', idealAnswer: 'Type I (α): false positive—rejecting true null (convicting innocent). Type II (β): false negative—failing to reject false null (releasing guilty). Power = 1-β. Tradeoff: decreasing α increases β. Balance by: choosing α based on consequence severity (medical: lower α), increasing sample size to reduce both, using one-tailed tests when appropriate, calculating required sample size for desired power.' },
      { question: 'Design an A/B testing framework for a new feature on an e-commerce site.', questionType: 'scenario', topic: 'A/B Testing', idealAnswer: 'Framework: 1) Define hypothesis and metrics (conversion rate, revenue per user), 2) Determine sample size (power analysis: α=0.05, power=0.8, MDE), 3) Random assignment (stratified for balance), 4) Run for sufficient duration (full business cycles), 5) Analyze: check SRM, then compare metrics (z-test, Bayesian), 6) Check for novelty effect and segment analysis, 7) Decision: ship if statistically AND practically significant.' },
      { question: 'How would you use Pandas to clean and transform a messy real-world dataset?', questionType: 'practical', topic: 'Pandas & NumPy', idealAnswer: 'Steps: df.info()/describe() for overview, df.isnull().sum() for missing data, df.duplicated() for duplicates, df.columns = [clean names] for renaming, df[\'col\'].astype() for type conversion, pd.to_datetime() for dates, df.fillna()/dropna() for missing values, df.replace() for inconsistent values, df.groupby()+agg() for aggregation, df.merge() for joining, df.pivot_table() for reshaping. Profile with pandas-profiling first.' },
      { question: 'Explain feature selection techniques. How do you decide which features to keep?', questionType: 'conceptual', topic: 'Feature Selection', idealAnswer: 'Three categories: 1) Filter methods: correlation, chi-square, mutual information (fast, model-independent), 2) Wrapper methods: forward/backward selection, recursive feature elimination (model-dependent, slower but better), 3) Embedded methods: Lasso (L1 regularization), tree feature importance (built into model). Decision: start with filter for quick screening, then wrapper/embedded for final selection. Consider domain knowledge, multicollinearity, and computational cost.' },
    ],
    advanced: [
      { question: 'Explain the difference between Bayesian and Frequentist approaches to statistical inference.', questionType: 'comparison', topic: 'Statistical Modeling', idealAnswer: 'Frequentist: parameters are fixed, probability is long-run frequency, uses p-values and confidence intervals. Bayesian: parameters are random variables with prior distributions, probability is degree of belief, updates prior with data to get posterior via Bayes\' theorem. Bayesian provides richer inference (full posterior distribution), incorporates prior knowledge, naturally handles small samples. Frequentist is simpler, objective, computationally easier. Modern: often combine both.' },
      { question: 'Design a causal inference study to measure the effect of a training program on employee performance.', questionType: 'scenario', topic: 'Statistical Modeling', idealAnswer: 'Approaches: 1) RCT (gold standard): random assignment to treatment/control, 2) Difference-in-Differences: compare pre-post changes between groups, 3) Propensity score matching: match treated/untreated on observables, 4) Regression discontinuity: exploit cutoff in assignment, 5) Instrumental variables: find variable affecting treatment but not outcome directly. Key: identify confounders, test parallel trends assumption, check for selection bias, report ATE/ATT with confidence intervals.' },
      { question: 'Explain how to handle concept drift in a production ML model monitoring pipeline.', questionType: 'conceptual', topic: 'ETL Pipelines', idealAnswer: 'Concept drift: relationship between features and target changes over time. Detection: monitor prediction distribution, feature distribution (KS test, PSI), model performance metrics over time windows, online drift detection (ADWIN, DDM). Handling: 1) Periodic retraining (scheduled), 2) Online learning (incremental updates), 3) Ensemble with weighted recent models, 4) Feature engineering to capture temporal patterns, 5) Alert system with automated rollback. Log everything for root cause analysis.' },
      { question: 'Derive the maximum likelihood estimator for the parameters of a linear regression model. What assumptions are required?', questionType: 'conceptual', topic: 'Statistical Modeling', idealAnswer: 'Assuming y = Xβ + ε where ε ~ N(0, σ²I), the likelihood is L(β,σ²) = (2πσ²)^(-n/2) exp(-||y-Xβ||²/(2σ²)). Log-likelihood: l = -n/2 log(2πσ²) - (y-Xβ)ᵀ(y-Xβ)/(2σ²). Setting ∂l/∂β = 0 gives β̂ = (XᵀX)⁻¹Xᵀy (same as OLS). Setting ∂l/∂σ² = 0 gives σ̂² = RSS/n. Assumptions: linearity, independence, homoscedasticity, normality of errors, no multicollinearity.' },
      { question: 'Compare PCA, t-SNE, and UMAP for dimensionality reduction. When is each appropriate?', questionType: 'comparison', topic: 'Descriptive Statistics', idealAnswer: 'PCA: linear, preserves global structure, fast, deterministic, interpretable (variance explained). t-SNE: nonlinear, preserves local structure (clusters), slow O(n²), non-deterministic, no global structure preservation. UMAP: nonlinear, preserves both local and global structure, faster than t-SNE, more reproducible, supports embedding new points. Use PCA for preprocessing/interpretation, t-SNE for cluster visualization, UMAP for general-purpose visualization and as preprocessing for clustering.' },
    ],
  },
  general: {
    beginner: [
      { question: 'Tell me about a time you solved a difficult problem. What was your approach?', questionType: 'behavioral', topic: 'Problem Solving', idealAnswer: 'Should describe: the specific problem, their analysis process, steps taken, tools/methods used, collaboration if any, and the outcome. Key: structured thinking, persistence, learning from the process.' },
      { question: 'How do you prioritize tasks when you have multiple deadlines?', questionType: 'behavioral', topic: 'Time Management', idealAnswer: 'Should mention: urgency vs importance matrix, breaking down large tasks, setting realistic timelines, communicating about constraints, and being flexible when priorities change.' },
      { question: 'What motivates you to learn new things?', questionType: 'behavioral', topic: 'Adaptability', idealAnswer: 'Should show genuine curiosity, growth mindset, and ability to connect learning to real-world applications. Mention specific examples of self-directed learning.' },
      { question: 'How do you handle feedback, especially when it\'s critical?', questionType: 'behavioral', topic: 'Communication', idealAnswer: 'Should demonstrate: active listening, not taking it personally, asking clarifying questions, creating an action plan, and following up on improvements.' },
      { question: 'Describe a situation where you had to work with someone you disagreed with.', questionType: 'behavioral', topic: 'Teamwork', idealAnswer: 'Should show: empathy, finding common ground, focusing on goals rather than personalities, professional communication, and reaching a constructive resolution.' },
    ],
    intermediate: [
      { question: 'Describe a situation where you had to make a decision with incomplete information.', questionType: 'behavioral', topic: 'Critical Thinking', idealAnswer: 'Should describe: how they gathered available information, assessed risks, made assumptions explicit, decided with confidence, and prepared contingency plans.' },
      { question: 'How do you approach learning a completely new technology or domain?', questionType: 'behavioral', topic: 'Adaptability', idealAnswer: 'Should mention: structured learning plan, hands-on practice, building projects, reading documentation, seeking mentorship, and time-boxing exploration.' },
      { question: 'Tell me about a project that didn\'t go as planned. What did you learn?', questionType: 'behavioral', topic: 'Problem Solving', idealAnswer: 'Should demonstrate: honest self-reflection, identifying root causes, taking responsibility, concrete lessons learned, and how they applied those lessons subsequently.' },
      { question: 'How do you communicate technical concepts to non-technical stakeholders?', questionType: 'behavioral', topic: 'Communication', idealAnswer: 'Should mention: using analogies, focusing on impact/outcomes rather than technical details, visual aids, checking understanding, and adapting language to the audience.' },
      { question: 'Describe your approach to mentoring or helping a struggling team member.', questionType: 'behavioral', topic: 'Leadership', idealAnswer: 'Should show: patience, asking questions to understand the root cause, providing structured guidance, pairing on tasks, encouraging independence, and following up.' },
    ],
    advanced: [
      { question: 'Describe a time you had to influence a decision without having direct authority.', questionType: 'behavioral', topic: 'Leadership', idealAnswer: 'Should demonstrate: building credibility through expertise, data-driven arguments, understanding stakeholder motivations, coalition building, and patience with organizational dynamics.' },
      { question: 'How do you balance technical debt with feature delivery in a fast-paced environment?', questionType: 'behavioral', topic: 'Problem Solving', idealAnswer: 'Should mention: quantifying tech debt impact, prioritizing by risk, allocating dedicated time (e.g., 20%), making the case with data, and integrating refactoring into feature work incrementally.' },
      { question: 'Tell me about a time you had to pivot your approach mid-project. What triggered the change?', questionType: 'behavioral', topic: 'Adaptability', idealAnswer: 'Should show: recognizing signals early, not being attached to the original plan, assessing the new situation, communicating the pivot clearly, and maintaining team morale through change.' },
      { question: 'How do you foster a culture of continuous improvement in your team?', questionType: 'behavioral', topic: 'Leadership', idealAnswer: 'Should mention: regular retrospectives, blameless post-mortems, celebrating learning from failures, setting improvement metrics, providing learning resources, and leading by example.' },
      { question: 'Describe your strategy for managing burnout—both for yourself and your team.', questionType: 'behavioral', topic: 'Teamwork', idealAnswer: 'Should mention: recognizing early signs, sustainable pacing, workload distribution, encouraging breaks and boundaries, psychological safety, and normalizing asking for help.' },
    ],
  },
}

// ==================== BEHAVIORAL QUESTIONS ====================

const BEHAVIORAL_QUESTIONS: { question: string; topic: string; idealAnswer: string }[] = [
  { question: 'Tell me about a time you had to explain a complex technical concept to a non-technical person.', topic: 'Communication', idealAnswer: 'Should demonstrate: awareness of audience, use of analogies, patience, checking for understanding, and adapting communication style.' },
  { question: 'Describe a situation where you failed. What did you learn from it?', topic: 'Adaptability', idealAnswer: 'Should show: honest self-reflection, taking responsibility, specific lessons learned, and how the failure led to growth or process improvement.' },
  { question: 'How do you handle tight deadlines and pressure?', topic: 'Time Management', idealAnswer: 'Should mention: prioritization, breaking tasks down, communicating proactively about constraints, staying focused, and managing stress healthily.' },
  { question: 'Give an example of when you went above and beyond what was expected.', topic: 'Problem Solving', idealAnswer: 'Should describe: the baseline expectation, what extra they did, the motivation, and the positive outcome that resulted from the extra effort.' },
  { question: 'How do you stay updated with the latest developments in your field?', topic: 'Adaptability', idealAnswer: 'Should mention: specific sources (papers, blogs, courses), communities, hands-on experimentation, attending conferences/meetups, and applying new knowledge in practice.' },
]

// ==================== VIVA QUESTIONS (short, direct) ====================

const VIVA_QUESTIONS: Record<string, { question: string; topic: string; idealAnswer: string }[]> = {
  python: [
    { question: 'What is PEP 8?', topic: 'Modules & Packages', idealAnswer: 'PEP 8 is Python\'s style guide—coding conventions for readable, consistent code including naming, indentation, and layout rules.' },
    { question: 'What does the "self" keyword refer to in a class?', topic: 'OOP Concepts', idealAnswer: 'self refers to the current instance of the class, allowing access to instance attributes and methods.' },
    { question: 'What is the difference between == and is?', topic: 'Variables & Data Types', idealAnswer: '== compares values for equality. is compares identity (same object in memory).' },
    { question: 'What is a lambda function?', topic: 'Lambda Functions', idealAnswer: 'An anonymous, single-expression function: lambda x: x + 1. Used for short, throwaway functions.' },
    { question: 'What is a list comprehension?', topic: 'List Comprehensions', idealAnswer: 'A concise way to create lists: [x**2 for x in range(10) if x % 2 == 0]. More readable and faster than loops.' },
  ],
  machine_learning: [
    { question: 'What is the difference between precision and recall?', topic: 'Model Evaluation', idealAnswer: 'Precision: TP/(TP+FP)—of predicted positives, how many are correct. Recall: TP/(TP+FN)—of actual positives, how many did we find.' },
    { question: 'What is gradient descent?', topic: 'Neural Networks', idealAnswer: 'An optimization algorithm that iteratively moves parameters in the direction of steepest decrease of the loss function (negative gradient) to minimize loss.' },
    { question: 'What is the curse of dimensionality?', topic: 'Feature Engineering', idealAnswer: 'As feature dimensions increase, data becomes sparse, distances become less meaningful, and model performance degrades. Requires more data exponentially.' },
    { question: 'What is regularization?', topic: 'Overfitting & Regularization', idealAnswer: 'Adding a penalty term to the loss function to discourage complex models. L1 (Lasso) promotes sparsity; L2 (Ridge) shrinks coefficients.' },
    { question: 'What is the difference between bagging and boosting?', topic: 'Classification', idealAnswer: 'Bagging: parallel independent models, reduces variance (Random Forest). Boosting: sequential error-correcting models, reduces bias (XGBoost, AdaBoost).' },
  ],
  web_development: [
    { question: 'What is CORS?', topic: 'REST APIs', idealAnswer: 'Cross-Origin Resource Sharing—a browser security mechanism controlling which domains can access resources. Requires server headers to allow cross-origin requests.' },
    { question: 'What is the virtual DOM?', topic: 'React Components', idealAnswer: 'A lightweight JS representation of the real DOM. React diffs the virtual DOM with the previous version and applies minimal real DOM updates for performance.' },
    { question: 'What does HTTP status code 404 mean?', topic: 'REST APIs', idealAnswer: '404 Not Found—the requested resource does not exist on the server.' },
    { question: 'What is CSS specificity?', topic: 'HTML & CSS', idealAnswer: 'The algorithm determining which CSS rule applies when multiple target the same element. Inline > ID > class > element. Calculated as a score.' },
    { question: 'What is a promise in JavaScript?', topic: 'JavaScript Fundamentals', idealAnswer: 'An object representing the eventual completion or failure of an async operation. States: pending, fulfilled, rejected. Chained with .then()/.catch().' },
  ],
  data_science: [
    { question: 'What is the difference between correlation and causation?', topic: 'Statistical Modeling', idealAnswer: 'Correlation measures statistical association between variables. Causation means one variable directly affects the other. Correlation does not imply causation.' },
    { question: 'What is a confidence interval?', topic: 'Hypothesis Testing', idealAnswer: 'A range of values that likely contains the true population parameter with a given probability (e.g., 95%). Wider intervals = more uncertainty.' },
    { question: 'What is standard deviation?', topic: 'Descriptive Statistics', idealAnswer: 'A measure of data spread around the mean. Low SD = data clustered near mean. High SD = data widely spread. Square root of variance.' },
    { question: 'What is survivorship bias?', topic: 'Data Cleaning', idealAnswer: 'Drawing conclusions from only successful/visible data while ignoring failures. Example: studying only successful companies ignores failed ones, skewing conclusions.' },
    { question: 'What is the difference between SQL JOIN types?', topic: 'ETL Pipelines', idealAnswer: 'INNER: matching rows only. LEFT: all left + matching right. RIGHT: all right + matching left. FULL: all rows from both. CROSS: cartesian product.' },
  ],
  general: [
    { question: 'What is the STAR method?', topic: 'Communication', idealAnswer: 'Situation, Task, Action, Result—a structured way to answer behavioral questions with specific examples.' },
    { question: 'What is active listening?', topic: 'Communication', idealAnswer: 'Fully focusing on the speaker, understanding their message, responding thoughtfully, and remembering key points. Avoids interrupting or planning your response while they speak.' },
    { question: 'What is a growth mindset?', topic: 'Adaptability', idealAnswer: 'The belief that abilities can be developed through effort and learning, as opposed to a fixed mindset that sees abilities as innate and unchangeable.' },
  ],
}

// ==================== LLM HELPER ====================

async function generateQuestionsWithLLM(
  domain: string,
  difficulty: string,
  interviewType: string,
  weakTopics: string[],
  numQuestions: number,
): Promise<{ question: string; questionType: InterviewQuestionData['questionType']; topic: string; idealAnswer: string }[] | null> {
  try {
    const domainInfo = DOMAIN_CONFIG[domain]
    if (!domainInfo) return null

    const topicList = weakTopics.length > 0 ? weakTopics : domainInfo.topics.slice(0, 5)

    const typeInstruction = interviewType === 'behavioral'
      ? 'Generate behavioral/situational questions (STAR method). Focus on soft skills and past experiences.'
      : interviewType === 'viva'
        ? 'Generate short, direct viva-style questions expecting concise 1-2 sentence answers.'
        : interviewType === 'mixed'
          ? 'Mix technical and behavioral questions (about 60/40 split).'
          : 'Generate technical interview questions that test depth of understanding.'

    const prompt = `You are an expert interview question generator for the domain "${domainInfo.name}".

Generate exactly ${numQuestions} ${difficulty}-level interview questions.

Focus areas (student's weak topics): ${topicList.join(', ')}

${typeInstruction}

Question types to mix: conceptual, practical, scenario, comparison, definition, behavioral.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "the question text",
    "questionType": "conceptual|practical|scenario|comparison|definition|behavioral",
    "topic": "specific topic area",
    "idealAnswer": "what an excellent answer covers"
  }
]

Requirements:
- Questions must be personalized toward the student's weak topics
- Progressive difficulty (easier first, harder later)
- Clear, unambiguous questions
- Ideal answers should be concise (2-4 sentences)
- Mix question types appropriately`

    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: 'You are a precise JSON generator. Return only valid JSON arrays, no markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) return null

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) return null

    return parsed.map(q => ({
      question: q.question || '',
      questionType: validateQuestionType(q.questionType),
      topic: q.topic || topicList[0] || domainInfo.name,
      idealAnswer: q.idealAnswer || '',
    })).filter(q => q.question.length > 0)
  } catch (error) {
    console.error('[Mock Interview API] LLM question generation failed:', error)
    return null
  }
}

async function evaluateAnswerWithLLM(
  question: string,
  answer: string,
  idealAnswer: string,
  questionType: string,
  difficulty: string,
  topic: string,
): Promise<EvaluationResult | null> {
  try {
    const prompt = `You are an expert interview evaluator for the topic "${topic}" (${difficulty} level).

Question: ${question}

Student's Answer: ${answer}

Ideal Answer Reference: ${idealAnswer}

Evaluate the student's answer on these 4 criteria (each 0-100):

1. **Technical Accuracy** (40% weight): Is the technical content correct?
2. **Concept Coverage** (30% weight): Did they cover the key concepts expected?
3. **Communication** (20% weight): Is the answer clear, well-structured, and easy to follow?
4. **Use of Examples** (10% weight): Did they provide relevant examples or analogies?

Return ONLY valid JSON:
{
  "accuracy": 0-100,
  "completeness": 0-100,
  "communication": 0-100,
  "examples": 0-100,
  "feedback": "2-3 sentence constructive feedback highlighting strengths and areas for improvement",
  "idealAnswer": "an improved version of the ideal answer incorporating what the student did well"
}`

    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: 'You are a precise JSON generator. Return only valid JSON objects, no markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) return null

    let jsonStr = content.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonStr)

    const accuracy = clampScore(parsed.accuracy)
    const completeness = clampScore(parsed.completeness)
    const communication = clampScore(parsed.communication)
    const examples = clampScore(parsed.examples)

    const weightedScore = Math.round(
      accuracy * 0.4 + completeness * 0.3 + communication * 0.2 + examples * 0.1,
    )

    return {
      score: weightedScore,
      feedback: parsed.feedback || 'Answer evaluated.',
      idealAnswer: parsed.idealAnswer || idealAnswer,
    }
  } catch (error) {
    console.error('[Mock Interview API] LLM evaluation failed:', error)
    return null
  }
}

// ==================== UTILITY FUNCTIONS ====================

function validateQuestionType(type: string): InterviewQuestionData['questionType'] {
  const validTypes: InterviewQuestionData['questionType'][] = ['conceptual', 'practical', 'scenario', 'behavioral', 'definition', 'comparison']
  return validTypes.includes(type as InterviewQuestionData['questionType']) ? type as InterviewQuestionData['questionType'] : 'conceptual'
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(score) || 0)))
}

function getWeakTopicsFromMastery(topicMasteries: { topicName: string; masteryScore: number; skillId: string | null }[]): string[] {
  return topicMasteries
    .filter(tm => tm.masteryScore < 50)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map(tm => tm.topicName)
}

function getFallbackQuestions(
  domain: string,
  difficulty: string,
  interviewType: string,
  weakTopics: string[],
  numQuestions: number,
): { question: string; questionType: InterviewQuestionData['questionType']; topic: string; idealAnswer: string }[] {
  const domainQuestions = FALLBACK_QUESTIONS[domain]
  if (!domainQuestions) {
    // Use general questions as final fallback
    return getFallbackQuestions('general', difficulty, interviewType, weakTopics, numQuestions)
  }

  let questions: { question: string; questionType: InterviewQuestionData['questionType']; topic: string; idealAnswer: string }[] = []

  if (interviewType === 'viva') {
    const vivaQs = VIVA_QUESTIONS[domain] || VIVA_QUESTIONS['general'] || []
    questions = vivaQs.map(q => ({ ...q, questionType: 'definition' as InterviewQuestionData['questionType'] }))
  } else if (interviewType === 'behavioral') {
    const behavioralQs = BEHAVIORAL_QUESTIONS
    const domainBehavioral = DOMAIN_CONFIG[domain]?.behavioralTopics || []
    questions = behavioralQs.map(q => ({ ...q, questionType: 'behavioral' as InterviewQuestionData['questionType'] }))
    // Add domain-specific behavioral if available
    if (domainBehavioral.length > 0) {
      questions = questions.slice(0, 3)
      for (const topic of domainBehavioral) {
        questions.push({
          question: `Tell me about your experience with ${topic.toLowerCase()}. How has it shaped your approach?`,
          topic,
          questionType: 'behavioral' as InterviewQuestionData['questionType'],
          idealAnswer: `Should demonstrate understanding of ${topic}, practical application, and reflective learning.`,
        })
      }
    }
  } else {
    // Technical or mixed
    const diffQuestions = domainQuestions[difficulty] || domainQuestions['intermediate'] || []
    questions = [...diffQuestions]

    // For mixed type, add some behavioral questions
    if (interviewType === 'mixed') {
      const behavioralQs = BEHAVIORAL_QUESTIONS.slice(0, 2)
      questions = [
        ...behavioralQs.map(q => ({ ...q, questionType: 'behavioral' as InterviewQuestionData['questionType'] })),
        ...questions.slice(0, numQuestions - 2),
      ]
    }

    // Prioritize weak topic questions
    if (weakTopics.length > 0) {
      const weakTopicQuestions = questions.filter(q => weakTopics.some(wt => q.topic.toLowerCase().includes(wt.toLowerCase()) || wt.toLowerCase().includes(q.topic.toLowerCase())))
      const otherQuestions = questions.filter(q => !weakTopics.some(wt => q.topic.toLowerCase().includes(wt.toLowerCase()) || wt.toLowerCase().includes(q.topic.toLowerCase())))
      questions = [...weakTopicQuestions, ...otherQuestions]
    }
  }

  // Ensure we have enough questions and trim to requested number
  if (questions.length === 0) {
    // Final fallback: generate generic questions
    const domainName = DOMAIN_CONFIG[domain]?.name || domain
    questions = [
      { question: `What are the fundamental concepts of ${domainName}?`, questionType: 'conceptual', topic: domainName, idealAnswer: `A comprehensive overview of ${domainName} fundamentals.` },
      { question: `Explain a common challenge in ${domainName} and how to overcome it.`, questionType: 'scenario', topic: domainName, idealAnswer: `Identifies a real challenge and provides a practical solution.` },
      { question: `Compare two approaches commonly used in ${domainName}.`, questionType: 'comparison', topic: domainName, idealAnswer: `Clearly articulates tradeoffs between the two approaches.` },
      { question: `How would you apply ${domainName} concepts to solve a real-world problem?`, questionType: 'practical', topic: domainName, idealAnswer: `Shows practical application and problem-solving ability.` },
      { question: `What recent developments in ${domainName} are you most excited about?`, questionType: 'conceptual', topic: domainName, idealAnswer: `Shows awareness of current trends and ability to evaluate their significance.` },
    ]
  }

  return questions.slice(0, numQuestions)
}

// ==================== DEMO DATA GENERATORS ====================

function generateDemoDashboard(userId: string) {
  const stats = {
    totalSessions: 5,
    avgScore: 72,
    bestScore: 88,
    domainsPracticed: ['python', 'machine_learning'],
  }

  const recentSessions = [
    { id: 'demo-session-1', domain: 'machine_learning', difficulty: 'intermediate', type: 'technical', score: 78, completedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'demo-session-2', domain: 'python', difficulty: 'intermediate', type: 'technical', score: 88, completedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'demo-session-3', domain: 'python', difficulty: 'beginner', type: 'mixed', score: 72, completedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: 'demo-session-4', domain: 'machine_learning', difficulty: 'beginner', type: 'technical', score: 55, completedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'demo-session-5', domain: 'web_development', difficulty: 'beginner', type: 'behavioral', score: 85, completedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  ]

  const domains: DomainInfo[] = [
    { id: 'python', name: 'Python', icon: '💻', sessions: 3, avgScore: 72, weakAreas: ['Decorators', 'Generators'] },
    { id: 'machine_learning', name: 'Machine Learning', icon: '🧠', sessions: 2, avgScore: 68, weakAreas: ['Neural Networks', 'Hyperparameter Tuning'] },
    { id: 'web_development', name: 'Web Development', icon: '🌐', sessions: 1, avgScore: 85, weakAreas: [] },
    { id: 'data_science', name: 'Data Science', icon: '📊', sessions: 0, avgScore: 0, weakAreas: [] },
  ]

  const personalization = {
    focusTopics: ['Classification', 'Neural Networks'],
    reason: 'Based on your Topic Mastery and Skill Graph, these are your weakest areas',
  }

  const skillContextForAI = `Student interview history: ${stats.totalSessions} sessions, avg score ${stats.avgScore}%, best ${stats.bestScore}%. Weak areas: Classification (45%), Neural Networks (8%). Strong: Python basics (85%). Recommended focus: ML fundamentals, deep learning basics.`

  return { stats, recentSessions, domains, personalization, skillContextForAI }
}

// ==================== DB DATA BUILDERS ====================

async function buildDashboardFromDB(userId: string) {
  try {
    const interviews = (await (db as any).mockInterview?.findMany({
      where: { studentId: userId },
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    })) ?? []

    const topicMasteries = await db.topicMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: 'asc' },
    })

    if (interviews.length === 0 && topicMasteries.length === 0) return null

    // Compute stats
    const completedInterviews = interviews.filter(i => i.status === 'completed')
    const totalSessions = completedInterviews.length
    const avgScore = totalSessions > 0
      ? Math.round(completedInterviews.reduce((sum, i) => sum + i.score, 0) / totalSessions)
      : 0
    const bestScore = totalSessions > 0
      ? Math.round(Math.max(...completedInterviews.map(i => i.score)))
      : 0
    const domainsPracticed = [...new Set(completedInterviews.map(i => i.domain))]

    const stats = { totalSessions, avgScore, bestScore, domainsPracticed }

    // Recent sessions
    const recentSessions = completedInterviews.slice(0, 5).map(i => ({
      id: i.id,
      domain: i.domain,
      difficulty: i.difficulty,
      type: i.interviewType,
      score: Math.round(i.score),
      completedAt: i.completedAt?.toISOString() || i.createdAt.toISOString(),
    }))

    // Domain summaries
    const domainIds = ['python', 'machine_learning', 'web_development', 'data_science']
    const domains: DomainInfo[] = domainIds.map(domainId => {
      const domainInterviews = completedInterviews.filter(i => i.domain === domainId)
      const config = DOMAIN_CONFIG[domainId]
      const domainTopics = topicMasteries.filter(tm => {
        const topicLower = tm.topicName.toLowerCase()
        return topicLower.includes(domainId.replace('_', ' ')) ||
          (domainId === 'python' && (topicLower.includes('python') || topicLower.includes('oop') || topicLower.includes('decorator'))) ||
          (domainId === 'machine_learning' && (topicLower.includes('regression') || topicLower.includes('classification') || topicLower.includes('neural') || topicLower.includes('machine'))) ||
          (domainId === 'web_development' && (topicLower.includes('html') || topicLower.includes('css') || topicLower.includes('javascript') || topicLower.includes('react'))) ||
          (domainId === 'data_science' && (topicLower.includes('statistic') || topicLower.includes('pandas') || topicLower.includes('visualization')))
      })

      const weakAreas = domainTopics
        .filter(tm => tm.masteryScore < 50)
        .sort((a, b) => a.masteryScore - b.masteryScore)
        .slice(0, 3)
        .map(tm => tm.topicName)

      return {
        id: domainId,
        name: config?.name || domainId,
        icon: config?.icon || '📚',
        sessions: domainInterviews.length,
        avgScore: domainInterviews.length > 0
          ? Math.round(domainInterviews.reduce((sum, i) => sum + i.score, 0) / domainInterviews.length)
          : 0,
        weakAreas,
      }
    })

    // Personalization based on weak topics
    const weakTopics = getWeakTopicsFromMastery(topicMasteries)
    const personalization = {
      focusTopics: weakTopics.length > 0 ? weakTopics : ['Classification', 'Neural Networks'],
      reason: weakTopics.length > 0
        ? `Based on your Topic Mastery and Skill Graph, these are your weakest areas: ${weakTopics.join(', ')}`
        : 'Based on your Topic Mastery and Skill Graph, these are your weakest areas',
    }

    // Build skill context for AI
    const topWeak = topicMasteries.filter(tm => tm.masteryScore < 50).slice(0, 3)
    const topStrong = topicMasteries.filter(tm => tm.masteryScore >= 75).slice(0, 3)
    const skillContextForAI = `Student interview history: ${totalSessions} sessions, avg score ${avgScore}%, best ${bestScore}%. ` +
      (topWeak.length > 0 ? `Weak areas: ${topWeak.map(t => `${t.topicName} (${Math.round(t.masteryScore)}%)`).join(', ')}. ` : '') +
      (topStrong.length > 0 ? `Strong areas: ${topStrong.map(t => `${t.topicName} (${Math.round(t.masteryScore)}%)`).join(', ')}. ` : '') +
      `Recommended focus: ${personalization.focusTopics.join(', ')}.`

    return { stats, recentSessions, domains, personalization, skillContextForAI }
  } catch (error) {
    console.error('[Mock Interview API] Dashboard DB build error:', error)
    return null
  }
}

async function startInterviewFromDB(
  userId: string,
  domain: string,
  difficulty: string,
  interviewType: string,
): Promise<InterviewSessionData | null> {
  try {
    // Get student's weak topics for personalization
    const topicMasteries = await db.topicMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: 'asc' },
    })

    const weakTopics = getWeakTopicsFromMastery(topicMasteries)
    const numQuestions = difficulty === 'advanced' ? 8 : difficulty === 'intermediate' ? 6 : 5

    // Try LLM generation first, fall back to templates
    let questions = await generateQuestionsWithLLM(domain, difficulty, interviewType, weakTopics, numQuestions)
    if (!questions || questions.length === 0) {
      questions = getFallbackQuestions(domain, difficulty, interviewType, weakTopics, numQuestions)
    }

    // Create the interview in DB
    const interview = await (db as any).mockInterview?.create({
      data: {
        studentId: userId,
        domain,
        difficulty,
        interviewType,
        status: 'in_progress',
        score: 0,
        accuracy: 0,
        completeness: 0,
        clarity: 0,
        confidence: 0,
      },
    })

    // Create questions in DB (only if interview was created)
    const interviewId = interview?.id ?? `interview-${Date.now()}`
    let questionRecords: any[] = []
    if (interview) {
      questionRecords = (await Promise.all(
        questions.map((q, index) =>
          (db as any).interviewQuestion?.create({
            data: {
              interviewId: interview.id,
              question: q.question,
              questionType: q.questionType,
              topic: q.topic,
              difficulty,
              idealAnswer: q.idealAnswer,
              orderIndex: index,
              score: 0,
            },
          }),
        ),
      )).filter(Boolean)
    }

    // If no DB records, build from generated questions
    if (!questionRecords || questionRecords.length === 0) {
      questionRecords = questions.map((q, index) => ({
        id: `q-${Date.now()}-${index}`,
        question: q.question,
        questionType: q.questionType,
        topic: q.topic,
        difficulty,
        orderIndex: index,
      }))
    }

    return {
      id: interviewId,
      domain,
      difficulty,
      type: interviewType,
      status: 'in_progress',
      questions: questionRecords.map((q: any) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType as InterviewQuestionData['questionType'],
        topic: q.topic || '',
        difficulty: q.difficulty,
        orderIndex: q.orderIndex,
      })),
    }
  } catch (error) {
    console.error('[Mock Interview API] Start interview DB error:', error)
    return null
  }
}

async function submitAnswerFromDB(
  userId: string,
  interviewId: string,
  questionId: string,
  answer: string,
): Promise<{ evaluation: EvaluationResult; nextQuestionIndex: number; isLast: boolean } | null> {
  try {
    // Get the interview and its questions
    const interview = await (db as any).mockInterview?.findUnique({
      where: { id: interviewId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    })

    if (!interview || interview.studentId !== userId) return null

    const currentQuestion = interview.questions.find(q => q.id === questionId)
    if (!currentQuestion) return null

    // Evaluate the answer using LLM, fall back to simple heuristic
    let evaluation: EvaluationResult

    const llmResult = await evaluateAnswerWithLLM(
      currentQuestion.question,
      answer,
      currentQuestion.idealAnswer || '',
      currentQuestion.questionType,
      currentQuestion.difficulty,
      currentQuestion.topic || '',
    )

    if (llmResult) {
      evaluation = llmResult
    } else {
      // Simple heuristic fallback: evaluate based on answer length and keyword matching
      evaluation = evaluateAnswerHeuristic(
        currentQuestion.question,
        answer,
        currentQuestion.idealAnswer || '',
        currentQuestion.topic || '',
      )
    }

    // Update the question in DB
    await (db as any).interviewQuestion?.update({
      where: { id: questionId },
      data: {
        studentAnswer: answer,
        evaluation: evaluation.feedback,
        score: evaluation.score,
        idealAnswer: evaluation.idealAnswer,
        feedback: evaluation.feedback,
      },
    })

    // Determine next question
    const currentIndex = interview.questions.findIndex(q => q.id === questionId)
    const nextQuestionIndex = currentIndex + 1
    const isLast = nextQuestionIndex >= interview.questions.length

    return { evaluation, nextQuestionIndex, isLast }
  } catch (error) {
    console.error('[Mock Interview API] Submit answer DB error:', error)
    return null
  }
}

async function completeInterviewFromDB(
  userId: string,
  interviewId: string,
): Promise<InterviewReport | null> {
  try {
    const interview = await (db as any).mockInterview?.findUnique({
      where: { id: interviewId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    })

    if (!interview || interview.studentId !== userId) return null

    const answeredQuestions = interview.questions.filter(q => q.studentAnswer)

    if (answeredQuestions.length === 0) return null

    // Compute overall scores
    const overallScore = Math.round(
      answeredQuestions.reduce((sum, q) => sum + q.score, 0) / answeredQuestions.length,
    )

    // Detailed metrics (simplified from question scores)
    const accuracy = Math.round(
      answeredQuestions.reduce((sum, q) => sum + Math.min(100, q.score * 1.1), 0) / answeredQuestions.length,
    )
    const completeness = Math.round(
      answeredQuestions.reduce((sum, q) => sum + Math.min(100, q.score * 0.95), 0) / answeredQuestions.length,
    )
    const clarity = Math.round(
      answeredQuestions.reduce((sum, q) => sum + Math.min(100, q.score * 0.9), 0) / answeredQuestions.length,
    )
    const confidence = Math.round(
      answeredQuestions.reduce((sum, q) => sum + Math.min(100, q.score * 0.85), 0) / answeredQuestions.length,
    )

    // Identify strengths and weaknesses from topics
    const topicScores = new Map<string, number[]>()
    for (const q of answeredQuestions) {
      if (q.topic) {
        const scores = topicScores.get(q.topic) || []
        scores.push(q.score)
        topicScores.set(q.topic, scores)
      }
    }

    const topicAvgs = new Map<string, number>()
    for (const [topic, scores] of topicScores) {
      topicAvgs.set(topic, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
    }

    const strengths: string[] = []
    const weaknesses: string[] = []

    for (const [topic, avg] of topicAvgs) {
      if (avg >= 70) strengths.push(`${topic} (${avg}%)`)
      else if (avg < 50) weaknesses.push(`${topic} (${avg}%)`)
    }

    if (strengths.length === 0) strengths.push('Attempted all questions')
    if (weaknesses.length === 0) weaknesses.push('Keep practicing to improve consistency')

    // Generate feedback
    let feedback = ''
    if (overallScore >= 80) {
      feedback = `Excellent performance! You scored ${overallScore}% overall. Your strong areas include ${strengths.slice(0, 2).join(', ')}. Continue building on this foundation.`
    } else if (overallScore >= 60) {
      feedback = `Good effort! You scored ${overallScore}% overall. You showed competence in ${strengths.slice(0, 2).join(', ')}. Focus on improving ${weaknesses.slice(0, 2).join(', ')} to reach the next level.`
    } else {
      feedback = `You scored ${overallScore}% overall. Key areas needing improvement: ${weaknesses.slice(0, 3).join(', ')}. Don't worry — practice makes perfect. Review the ideal answers and try again.`
    }

    // Generate recommendations
    const recommendations: InterviewReport['recommendations'] = []
    for (const [topic, avg] of topicAvgs) {
      if (avg < 50) {
        recommendations.push({ type: 'lesson', topic, reason: `Score of ${avg}% indicates foundational gaps in ${topic}` })
        recommendations.push({ type: 'quiz', topic, reason: `Practice quiz will reinforce ${topic} concepts` })
      } else if (avg < 70) {
        recommendations.push({ type: 'practice', topic, reason: `Score of ${avg}% suggests ${topic} needs more hands-on practice` })
      }
    }

    // Add revision for very weak areas
    for (const [topic, avg] of topicAvgs) {
      if (avg < 35) {
        recommendations.push({ type: 'revision', topic, reason: `Critical weakness in ${topic} (${avg}%) — revision session recommended before next interview` })
      }
    }

    // Update Skill Graph: adjust topic mastery based on interview results
    const skillUpdates: InterviewReport['skillUpdates'] = []
    for (const [topic, avgScore] of topicAvgs) {
      try {
        const existingMastery = await db.topicMastery.findFirst({
          where: { userId, topicName: { contains: topic, mode: 'insensitive' } },
        })

        if (existingMastery) {
          const previousMastery = Math.round(existingMastery.masteryScore)
          let newMastery: number

          if (avgScore > previousMastery) {
            // Interview score higher than current mastery — increase slightly (blend 30%)
            newMastery = Math.round(previousMastery * 0.7 + avgScore * 0.3)
          } else {
            // Interview score lower — flag for revision but don't decrease (just note it)
            newMastery = previousMastery
          }

          // Only update if there's a meaningful change
          if (newMastery !== previousMastery) {
            await db.topicMastery.update({
              where: { id: existingMastery.id },
              data: {
                masteryScore: newMastery,
                status: newMastery >= 90 ? 'mastered' : newMastery >= 75 ? 'strong' : newMastery >= 50 ? 'learning' : newMastery >= 25 ? 'weak' : 'not_started',
                trend: newMastery > previousMastery ? 'improving' : newMastery < previousMastery ? 'declining' : 'stable',
                updatedAt: new Date(),
              },
            })

            skillUpdates.push({
              topic,
              previousMastery,
              newMastery,
              direction: avgScore > previousMastery ? 'improved' : 'needs_revision',
            })
          } else {
            skillUpdates.push({
              topic,
              previousMastery,
              newMastery: previousMastery,
              direction: avgScore < previousMastery ? 'needs_revision' : 'improved',
            })
          }
        }
      } catch (err) {
        console.error('[Mock Interview API] Skill update error for topic:', topic, err)
      }
    }

    // Update interview record
    await (db as any).mockInterview?.update({
      where: { id: interviewId },
      data: {
        status: 'completed',
        score: overallScore,
        accuracy,
        completeness,
        clarity,
        confidence,
        feedback,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        completedAt: new Date(),
      },
    })

    return {
      overallScore,
      accuracy,
      completeness,
      clarity,
      confidence,
      strengths,
      weaknesses,
      feedback,
      recommendations,
      skillUpdates,
    }
  } catch (error) {
    console.error('[Mock Interview API] Complete interview DB error:', error)
    return null
  }
}

// ==================== HEURISTIC EVALUATION (FALLBACK) ====================

function evaluateAnswerHeuristic(
  question: string,
  answer: string,
  idealAnswer: string,
  topic: string,
): EvaluationResult {
  const answerLength = answer.trim().length
  const idealLength = idealAnswer.trim().length

  // Base score from answer length (minimum effort check)
  let baseScore = 0
  if (answerLength === 0) baseScore = 0
  else if (answerLength < 20) baseScore = 25
  else if (answerLength < 50) baseScore = 40
  else if (answerLength < 100) baseScore = 55
  else if (answerLength < 200) baseScore = 65
  else baseScore = 72

  // Keyword matching bonus
  const idealWords = idealAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  const answerLower = answer.toLowerCase()
  const matchCount = idealWords.filter(w => answerLower.includes(w)).length
  const keywordBonus = idealWords.length > 0 ? Math.min(20, Math.round((matchCount / idealWords.length) * 20)) : 0

  // Structure bonus (has sentences, lists, etc.)
  const hasStructure = answer.includes('\n') || answer.includes('1.') || answer.includes('-') || answer.includes(':')
  const structureBonus = hasStructure ? 8 : 0

  const score = clampScore(baseScore + keywordBonus + structureBonus)

  return {
    score,
    feedback: score >= 70
      ? `Good answer on ${topic}. You covered the key concepts well. Consider adding more specific examples to strengthen your response.`
      : score >= 50
        ? `Decent attempt on ${topic}. Your answer covers some aspects but could be more comprehensive. Review the ideal answer for areas you missed.`
        : `Your answer on ${topic} needs improvement. Try to include more specific details, examples, and structured explanations. Review the material and try again.`,
    idealAnswer: idealAnswer || `A comprehensive answer covering the key concepts of ${topic} with examples.`,
  }
}

// ==================== DEMO INTERVIEW SESSION ====================

function createDemoInterviewSession(
  domain: string,
  difficulty: string,
  interviewType: string,
): InterviewSessionData {
  const numQuestions = difficulty === 'advanced' ? 8 : difficulty === 'intermediate' ? 6 : 5
  const questions = getFallbackQuestions(domain, difficulty, interviewType, [], numQuestions)

  const sessionId = `demo-interview-${Date.now()}`

  return {
    id: sessionId,
    domain,
    difficulty,
    type: interviewType,
    status: 'in_progress',
    questions: questions.map((q, index) => ({
      id: `${sessionId}-q${index}`,
      question: q.question,
      questionType: q.questionType,
      topic: q.topic,
      difficulty,
      orderIndex: index,
    })),
  }
}

// ==================== MAIN HANDLERS ====================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 },
      )
    }

    // Try to build from DB
    let result = await buildDashboardFromDB(userId)

    // Fallback to demo data
    if (!result) {
      result = generateDemoDashboard(userId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Mock Interview API] GET error:', error)

    // Return demo data on error so the UI always works
    return NextResponse.json(generateDemoDashboard('demo-user'))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action field is required (start, submit_answer, complete)' },
        { status: 400 },
      )
    }

    switch (action) {
      case 'start': {
        const { userId, domain, difficulty, interviewType } = body as {
          userId: string
          domain: string
          difficulty: string
          interviewType: string
        }

        if (!userId || !domain) {
          return NextResponse.json(
            { error: 'userId and domain are required' },
            { status: 400 },
          )
        }

        const validDomain = DOMAIN_CONFIG[domain] ? domain : 'general'
        const validDifficulty = ['beginner', 'intermediate', 'advanced'].includes(difficulty) ? difficulty : 'intermediate'
        const validType = ['technical', 'behavioral', 'mixed', 'viva'].includes(interviewType) ? interviewType : 'technical'

        // Try DB first
        let interview = await startInterviewFromDB(userId, validDomain, validDifficulty, validType)

        if (!interview) {
          // Fallback to demo session (in-memory, not persisted)
          interview = createDemoInterviewSession(validDomain, validDifficulty, validType)
        }

        return NextResponse.json({ interview })
      }

      case 'submit_answer': {
        const { userId, interviewId, questionId, answer } = body as {
          userId: string
          interviewId: string
          questionId: string
          answer: string
        }

        if (!userId || !interviewId || !questionId || answer === undefined) {
          return NextResponse.json(
            { error: 'userId, interviewId, questionId, and answer are required' },
            { status: 400 },
          )
        }

        // Try DB evaluation
        const result = await submitAnswerFromDB(userId, interviewId, questionId, answer)

        if (result) {
          return NextResponse.json(result)
        }

        // Fallback: heuristic evaluation for demo/non-persisted sessions
        const evaluation = evaluateAnswerHeuristic(questionId, answer, '', 'General')
        return NextResponse.json({
          evaluation,
          nextQuestionIndex: 1,
          isLast: true,
        })
      }

      case 'complete': {
        const { userId, interviewId } = body as {
          userId: string
          interviewId: string
        }

        if (!userId || !interviewId) {
          return NextResponse.json(
            { error: 'userId and interviewId are required' },
            { status: 400 },
          )
        }

        // Try DB completion
        const report = await completeInterviewFromDB(userId, interviewId)

        if (report) {
          return NextResponse.json({ report })
        }

        // Fallback: generate a demo report
        const demoReport: InterviewReport = {
          overallScore: 65,
          accuracy: 68,
          completeness: 62,
          clarity: 70,
          confidence: 58,
          strengths: ['Attempted all questions', 'Good communication'],
          weaknesses: ['Needs more practice on core concepts'],
          feedback: 'You scored 65% overall. This is a solid starting point. Focus on building stronger foundations in the key topics, and practice articulating your understanding more clearly.',
          recommendations: [
            { type: 'lesson', topic: 'Core Concepts', reason: 'Foundational gaps detected' },
            { type: 'practice', topic: 'Applied Problems', reason: 'Hands-on practice needed' },
            { type: 'revision', topic: 'Key Topics', reason: 'Review session recommended' },
          ],
          skillUpdates: [],
        }

        return NextResponse.json({ report: demoReport })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: start, submit_answer, complete` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[Mock Interview API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 },
    )
  }
}
