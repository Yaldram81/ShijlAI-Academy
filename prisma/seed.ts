import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  // Clean existing data
  await prisma.peerReview.deleteMany();
  await prisma.studyGroupMember.deleteMany();
  await prisma.studyGroup.deleteMany();
  await prisma.discussionUpvote.deleteMany();
  await prisma.discussionReply.deleteMany();
  await prisma.discussionPost.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.sessionAttendee.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.payoutMethod.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.instructorSettings.deleteMany();
  await prisma.instructorProfile.deleteMany();
  await prisma.platformStats.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonBookmark.deleteMany();
  await prisma.lessonNote.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.tutorSession.deleteMany();
  await prisma.qAAnswer.deleteMany();
  await prisma.qAQuestion.deleteMany();
  await prisma.qASettings.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.parentLink.deleteMany();
  await prisma.user.deleteMany();
  await prisma.activityLog.deleteMany();

  // ==================== USERS ====================
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@shijlai.com',
      name: 'Shijl Admin',
      role: 'admin',
      bio: 'Platform administrator for ShijlAI Academy',
      language: 'en',
      xp: 0,
      level: 1,
      shijlCoins: 0,
      streak: 0,
      longestStreak: 0,
      passwordHash: 'h_pnskfj_7', // simpleHash('demo123')
      isVerified: true,
      authProvider: 'email',
    },
  });

  const instructor = await prisma.user.create({
    data: {
      email: 'sara.malik@shijlai.com',
      name: 'Dr. Sara Malik',
      role: 'instructor',
      bio: 'PhD in Applied Mathematics from LUMS. 10+ years of teaching experience in FSc and A-Level Mathematics and Physics. Passionate about making complex concepts accessible.',
      language: 'en',
      xp: 5000,
      level: 15,
      shijlCoins: 2000,
      streak: 45,
      longestStreak: 60,
      passwordHash: 'h_pnskfj_7', // simpleHash('demo123')
      isVerified: true,
      authProvider: 'email',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'ahmed.khan@shijlai.com',
      name: 'Ahmed Khan',
      role: 'student',
      bio: 'FSc Pre-Engineering student preparing for board exams. Also interested in programming and cloud computing.',
      language: 'en',
      xp: 2350,
      level: 8,
      shijlCoins: 750,
      streak: 12,
      longestStreak: 18,
      passwordHash: 'h_pnskfj_7', // simpleHash('demo123')
      isVerified: true,
      authProvider: 'email',
    },
  });

  // ==================== BADGES ====================
  console.log('Creating badges...');
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        name: 'First Login',
        description: 'Logged into ShijlAI Academy for the first time',
        icon: '🚀',
        category: 'achievement',
        xpReward: 50,
        coinReward: 10,
        requirement: JSON.stringify({ type: 'login', count: 1 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: 'First Course',
        description: 'Enrolled in your first course',
        icon: '📚',
        category: 'learning',
        xpReward: 100,
        coinReward: 25,
        requirement: JSON.stringify({ type: 'enrollment', count: 1 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Quiz Master',
        description: 'Score 100% on 5 quizzes',
        icon: '🧠',
        category: 'achievement',
        xpReward: 200,
        coinReward: 50,
        requirement: JSON.stringify({ type: 'perfect_quizzes', count: 5 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: '7-Day Streak',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streak',
        xpReward: 150,
        coinReward: 30,
        requirement: JSON.stringify({ type: 'streak', days: 7 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: '30-Day Streak',
        description: 'Maintain a 30-day learning streak',
        icon: '⚡',
        category: 'streak',
        xpReward: 500,
        coinReward: 100,
        requirement: JSON.stringify({ type: 'streak', days: 30 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Top Learner',
        description: 'Reach the top 10 on the leaderboard',
        icon: '🏆',
        category: 'social',
        xpReward: 300,
        coinReward: 75,
        requirement: JSON.stringify({ type: 'leaderboard', position: 10 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Course Completer',
        description: 'Complete your first course',
        icon: '🎓',
        category: 'achievement',
        xpReward: 250,
        coinReward: 60,
        requirement: JSON.stringify({ type: 'course_completed', count: 1 }),
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Certificate Earner',
        description: 'Earn your first certificate',
        icon: '📜',
        category: 'achievement',
        xpReward: 300,
        coinReward: 75,
        requirement: JSON.stringify({ type: 'certificate', count: 1 }),
      },
    }),
  ]);

  // Award some badges to student
  await Promise.all([
    prisma.userBadge.create({ data: { userId: student.id, badgeId: badges[0].id } }),
    prisma.userBadge.create({ data: { userId: student.id, badgeId: badges[1].id } }),
    prisma.userBadge.create({ data: { userId: student.id, badgeId: badges[3].id } }),
  ]);

  // ==================== COURSES ====================
  console.log('Creating courses...');

  // Course 1: FSc Mathematics
  const fscMath = await prisma.course.create({
    data: {
      title: 'FSc Mathematics – Part 1',
      description: 'Complete FSc Part 1 Mathematics course covering Number Systems, Sets & Functions, Matrices & Determinants, Quadratic Equations, Partial Fractions, Sequences & Series, and more. Aligned with Punjab Board curriculum.',
      category: 'FSc',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-math.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 156,
      rating: 4.7,
      estimatedDuration: 25,
      tags: JSON.stringify(["mathematics", "fsc", "algebra", "calculus"]),
      instructorId: instructor.id,
    },
  });

  // Course 2: O-Level Physics
  const oLevelPhysics = await prisma.course.create({
    data: {
      title: 'O-Level Physics – Complete Course',
      description: 'Comprehensive O-Level Physics course covering Mechanics, Thermal Physics, Waves, Electricity & Magnetism, and Atomic Physics. Includes past paper practice and exam techniques.',
      category: 'O-Levels',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-physics.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 203,
      rating: 4.8,
      estimatedDuration: 30,
      tags: JSON.stringify(["physics", "o-levels", "mechanics", "waves"]),
      instructorId: instructor.id,
    },
  });

  // Course 3: A-Level Computer Science
  const aLevelCS = await prisma.course.create({
    data: {
      title: 'A-Level Computer Science – 9618',
      description: 'Full A-Level Computer Science (9618) preparation covering Computational Thinking, Programming, Algorithms, Data Structures, Databases, and Networks. Includes Python and pseudocode examples.',
      category: 'A-Levels',
      level: 'advanced',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 89,
      rating: 4.6,
      estimatedDuration: 35,
      tags: JSON.stringify(["computer-science", "programming", "algorithms"]),
      instructorId: instructor.id,
    },
  });

  // Course 4: IELTS Preparation
  const ielts = await prisma.course.create({
    data: {
      title: 'IELTS Preparation – Academic & General',
      description: 'Complete IELTS preparation covering all four modules: Listening, Reading, Writing, and Speaking. Includes practice tests, strategies, and tips for achieving Band 7+.',
      category: 'IELTS',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-english.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 312,
      rating: 4.9,
      estimatedDuration: 20,
      tags: JSON.stringify(["ielts", "english", "academic", "listening", "reading", "writing"]),
      instructorId: instructor.id,
    },
  });

  // Course 5: AWS Cloud Certification
  const aws = await prisma.course.create({
    data: {
      title: 'AWS Cloud Practitioner Certification',
      description: 'Prepare for the AWS Certified Cloud Practitioner (CLF-C02) exam. Covers Cloud Concepts, Security, Technology, and Billing & Pricing. Hands-on labs included.',
      category: 'AWS',
      level: 'beginner',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 2999,
      isPublished: true,
      enrollmentCount: 2200,
      rating: 4.7,
      estimatedDuration: 18,
      tags: JSON.stringify(["aws", "cloud", "certification", "devops"]),
      instructorId: instructor.id,
    },
  });

  // Course 6: Python Programming
  const python = await prisma.course.create({
    data: {
      title: 'Python Programming – Zero to Hero',
      description: 'Learn Python from scratch to advanced level. Covers basics, data structures, OOP, file handling, web scraping, APIs, and project building. Perfect for beginners.',
      category: 'Programming',
      level: 'beginner',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 445,
      rating: 4.8,
      estimatedDuration: 22,
      tags: JSON.stringify(["python", "programming", "coding", "oop"]),
      instructorId: instructor.id,
    },
  });

  // ==================== MODULES & LESSONS ====================
  console.log('Creating modules and lessons...');

  // --- FSc Math Modules ---
  const fscMathMod1 = await prisma.module.create({
    data: { title: 'Number Systems', description: 'Real and complex number systems', order: 1, courseId: fscMath.id },
  });
  const fscMathMod2 = await prisma.module.create({
    data: { title: 'Sets, Functions & Groups', description: 'Set theory, functions, and group theory basics', order: 2, courseId: fscMath.id },
  });
  const fscMathMod3 = await prisma.module.create({
    data: { title: 'Matrices & Determinants', description: 'Matrix operations and determinants', order: 3, courseId: fscMath.id },
  });

  await Promise.all([
    prisma.lesson.create({ data: { title: 'Introduction to Real Numbers', description: 'Understanding the real number system', content: `# Introduction to Real Numbers\n\nThe **real number system** is the foundation of all mathematics. Let's explore the different types of real numbers.\n\n## Types of Numbers\n\n### Natural Numbers\nThese are counting numbers: 1, 2, 3, 4, ...\n\n### Whole Numbers\nNatural numbers plus zero: 0, 1, 2, 3, ...\n\n### Integers\nWhole numbers and their negatives: ..., -3, -2, -1, 0, 1, 2, 3, ...\n\n### Rational Numbers\nNumbers that can be expressed as p/q where q ≠ 0:\n- Fractions: 1/2, 3/4, -2/5\n- Terminating decimals: 0.5, 0.75\n- Repeating decimals: 0.333... = 1/3\n\n### Irrational Numbers\nNumbers that cannot be expressed as fractions:\n- √2 ≈ 1.41421356...\n- π ≈ 3.14159265...\n- e ≈ 2.71828182...\n\n## Key Properties\n\n| Property | Example |\n|----------|--------|\n| Commutative | a + b = b + a |\n| Associative | (a + b) + c = a + (b + c) |\n| Distributive | a(b + c) = ab + ac |\n\n> 💡 **Tip**: Every real number is either rational or irrational, but never both!`, type: 'text', duration: 25, order: 1, moduleId: fscMathMod1.id } }),
    prisma.lesson.create({ data: { title: 'Complex Numbers', description: 'Understanding imaginary and complex numbers', content: `# Complex Numbers\n\nWhen we try to solve x² + 1 = 0, we need a number whose square is -1. This leads us to **imaginary numbers**.\n\n## The Imaginary Unit\n\nWe define **i** such that:\n\n\`\`\`\ni² = -1\ni = √(-1)\n\`\`\`\n\n## Complex Number Definition\n\nA complex number has the form:\n\n**z = a + bi**\n\nwhere:\n- **a** is the real part\n- **b** is the imaginary part\n\n## Operations with Complex Numbers\n\n### Addition\n(a + bi) + (c + di) = (a + c) + (b + d)i\n\n### Multiplication\n(a + bi)(c + di) = (ac - bd) + (ad + bc)i\n\n### Conjugate\nThe conjugate of z = a + bi is **z̄ = a - bi**\n\n> 💡 z × z̄ = a² + b² (always real and positive!)`, type: 'text', duration: 30, order: 2, moduleId: fscMathMod1.id } }),
    prisma.lesson.create({ data: { title: 'Properties of Real Numbers', description: 'Order properties and completeness axiom', content: `# Properties of Real Numbers\n\n## Order Properties\n\nThe real numbers have a natural ordering. For any two real numbers a and b:\n\n1. **Trichotomy**: Exactly one of these holds: a < b, a = b, or a > b\n2. **Transitivity**: If a < b and b < c, then a < c\n3. **Addition**: If a < b, then a + c < b + c\n4. **Multiplication**: If a < b and c > 0, then ac < bc\n\n## Completeness Axiom\n\nEvery non-empty set of real numbers that has an upper bound has a **least upper bound** (supremum).\n\nThis is what distinguishes real numbers from rational numbers!\n\n### Example\nThe set {x ∈ ℚ : x² < 2} has no supremum in ℚ, but its supremum √2 exists in ℝ.\n\n## Absolute Value\n\n|a| = a if a ≥ 0\n|a| = -a if a < 0\n\n### Triangle Inequality\n|a + b| ≤ |a| + |b|`, type: 'text', duration: 20, order: 3, moduleId: fscMathMod1.id } }),

    prisma.lesson.create({ data: { title: 'Sets and Subsets', description: 'Introduction to set theory', content: `# Sets and Subsets\n\n## What is a Set?\n\nA **set** is a well-defined collection of distinct objects.\n\n### Notation\n- Roster: A = {1, 2, 3, 4, 5}\n- Set-builder: A = {x | x is a natural number less than 6}\n\n## Types of Sets\n\n- **Empty Set (∅)**: A set with no elements\n- **Singleton**: A set with exactly one element\n- **Finite**: A set with a countable number of elements\n- **Infinite**: A set with uncountable elements\n\n## Subsets\n\nSet A is a subset of B (A ⊆ B) if every element of A is also in B.\n\n### Important Results\n- n subsets of a set with n elements = **2ⁿ**\n- Proper subsets = 2ⁿ - 1\n- If A ⊆ B and B ⊆ A, then A = B`, type: 'text', duration: 20, order: 1, moduleId: fscMathMod2.id } }),
    prisma.lesson.create({ data: { title: 'Types of Functions', description: 'One-to-one, onto, and bijective functions', content: `# Types of Functions\n\n## Definition\nA **function** f: A → B maps each element of A to exactly one element of B.\n\n## Classification\n\n### One-to-One (Injective)\nf(a₁) = f(a₂) ⟹ a₁ = a₂\n\nEach element in the codomain is mapped by at most one element in the domain.\n\n### Onto (Surjective)\nFor every b ∈ B, there exists a ∈ A such that f(a) = b\n\n### Bijective\nA function that is both injective and surjective.\n\n## Examples\n\n| Function | Type |\n|----------|------|\n| f(x) = 2x (ℝ→ℝ) | Injective |\n| f(x) = x² (ℝ→ℝ₊) | Surjective |\n| f(x) = x + 1 (ℤ→ℤ) | Bijective |`, type: 'text', duration: 25, order: 2, moduleId: fscMathMod2.id } }),

    prisma.lesson.create({ data: { title: 'Matrix Operations', description: 'Addition, subtraction, and multiplication of matrices', content: `# Matrix Operations\n\n## Matrix Addition\n\nTwo matrices can be added only if they have the **same dimensions**.\n\n\`\`\`\n[a b]   [e f]   [a+e  b+f]\n[c d] + [g h] = [c+g  d+h]\n\`\`\`\n\n## Scalar Multiplication\n\n\`\`\`\nk × [a b]   [ka  kb]\n    [c d] = [kc  kd]\n\`\`\`\n\n## Matrix Multiplication\n\nFor A(m×n) × B(n×p) = C(m×p):\n\n\`\`\`\nC[i][j] = Σ A[i][k] × B[k][j]\n\`\`\`\n\n### Important Notes\n- AB ≠ BA (generally)\n- A(B + C) = AB + AC (distributive)\n- (AB)C = A(BC) (associative)\n- AI = A (identity matrix)`, type: 'text', duration: 35, order: 1, moduleId: fscMathMod3.id } }),
    prisma.lesson.create({ data: { title: 'Determinants', description: 'Calculating and using determinants', content: `# Determinants\n\n## 2×2 Determinant\n\n\`\`\`\n|a b|\n|c d| = ad - bc\n\`\`\`\n\n## 3×3 Determinant (Sarrus Rule)\n\n\`\`\`\n|a b c|\n|d e f| = a(ei-fh) - b(di-fg) + c(dh-eg)\n|g h i|\n\`\`\`\n\n## Properties of Determinants\n\n1. |Aᵀ| = |A|\n2. |AB| = |A||B|\n3. If two rows are identical, |A| = 0\n4. |kA| = kⁿ|A| for n×n matrix\n5. |I| = 1\n\n## Cramer's Rule\n\nFor a system Ax = b:\n\nx₁ = |A₁|/|A|, x₂ = |A₂|/|A|, ...\n\nwhere Aᵢ is A with column i replaced by b.`, type: 'text', duration: 30, order: 2, moduleId: fscMathMod3.id } }),
  ]);

  // --- O-Level Physics Modules ---
  const physMod1 = await prisma.module.create({
    data: { title: 'Mechanics', description: 'Forces, motion, and energy', order: 1, courseId: oLevelPhysics.id },
  });
  const physMod2 = await prisma.module.create({
    data: { title: 'Waves & Sound', description: 'Wave properties, light, and sound', order: 2, courseId: oLevelPhysics.id },
  });
  const physMod3 = await prisma.module.create({
    data: { title: 'Electricity & Magnetism', description: 'Electric circuits and electromagnetic effects', order: 3, courseId: oLevelPhysics.id },
  });

  await Promise.all([
    prisma.lesson.create({ data: { title: 'Motion & Forces', description: 'Newton\'s laws and equations of motion', content: `# Motion & Forces\n\n## Newton's Laws of Motion\n\n### First Law (Inertia)\nAn object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.\n\n### Second Law\n**F = ma**\n\nForce = mass × acceleration\n\n### Third Law\nFor every action, there is an equal and opposite reaction.\n\n## Equations of Motion\n\nFor uniform acceleration:\n1. v = u + at\n2. s = ut + ½at²\n3. v² = u² + 2as\n4. s = ½(u + v)t\n\nWhere:\n- u = initial velocity\n- v = final velocity\n- a = acceleration\n- s = displacement\n- t = time`, type: 'text', duration: 30, order: 1, moduleId: physMod1.id } }),
    prisma.lesson.create({ data: { title: 'Work, Energy & Power', description: 'Conservation of energy and power calculations', content: `# Work, Energy & Power\n\n## Work Done\n\n**W = F × d × cos(θ)**\n\nWhere:\n- W = work (Joules)\n- F = force (Newtons)\n- d = displacement (metres)\n- θ = angle between force and displacement\n\n## Energy\n\n### Kinetic Energy\n**KE = ½mv²**\n\n### Potential Energy (Gravitational)\n**PE = mgh**\n\n## Conservation of Energy\n\nEnergy cannot be created or destroyed, only transformed.\n\n**Total energy before = Total energy after**\n\n## Power\n\n**P = W/t** or **P = Fv**\n\nPower is the rate of doing work. Measured in Watts (W).\n\n1 Watt = 1 Joule per second`, type: 'text', duration: 25, order: 2, moduleId: physMod1.id } }),

    prisma.lesson.create({ data: { title: 'Wave Properties', description: 'Characteristics and behavior of waves', content: `# Wave Properties\n\n## What is a Wave?\n\nA wave is a **disturbance** that transfers energy without transferring matter.\n\n## Types of Waves\n\n| Type | Example | Medium |\n|------|---------|--------|\n| Transverse | Light, water ripples | EM/Vacuum |\n| Longitudinal | Sound | Air, solids |\n\n## Key Terms\n\n- **Amplitude (A)**: Maximum displacement from equilibrium\n- **Wavelength (λ)**: Distance between two consecutive peaks\n- **Frequency (f)**: Number of waves per second (Hz)\n- **Period (T)**: Time for one complete wave\n\n## Wave Equation\n\n**v = fλ**\n\n## Wave Behavior\n\n- **Reflection**: Wave bounces back\n- **Refraction**: Wave changes direction at boundary\n- **Diffraction**: Wave bends around obstacles\n- **Interference**: Waves superpose`, type: 'text', duration: 25, order: 1, moduleId: physMod2.id } }),
    prisma.lesson.create({ data: { title: 'Sound & Hearing', description: 'Properties of sound waves', content: `# Sound & Hearing\n\n## Sound Waves\n\nSound is a **longitudinal wave** that requires a medium to travel.\n\n- Speed in air: ~330 m/s\n- Cannot travel through vacuum\n\n## Properties\n\n- **Pitch**: Determined by frequency\n- **Loudness**: Determined by amplitude\n- **Quality/Timbre**: Determined by waveform\n\n## Speed of Sound\n\nv = 331 + 0.6T (T in °C)\n\n## Echo\n\nSound reflected off a surface. Minimum distance for echo = 17m (at room temperature).\n\n## Ultrasound\n\nSound waves above 20,000 Hz. Used in:\n- Medical imaging\n- Cleaning\n- SONAR`, type: 'text', duration: 20, order: 2, moduleId: physMod2.id } }),

    prisma.lesson.create({ data: { title: 'Electric Circuits', description: 'Current, voltage, and resistance', content: `# Electric Circuits\n\n## Key Quantities\n\n- **Current (I)**: Rate of flow of charge (Amperes)\n- **Voltage (V)**: Potential difference (Volts)\n- **Resistance (R)**: Opposition to current (Ohms)\n\n## Ohm's Law\n\n**V = IR**\n\n## Series Circuits\n\n- Same current throughout\n- V_total = V₁ + V₂ + V₃\n- R_total = R₁ + R₂ + R₃\n\n## Parallel Circuits\n\n- Same voltage across each branch\n- I_total = I₁ + I₂ + I₃\n- 1/R_total = 1/R₁ + 1/R₂ + 1/R₃\n\n## Electrical Power\n\n**P = IV = I²R = V²/R**`, type: 'text', duration: 30, order: 1, moduleId: physMod3.id } }),
    prisma.lesson.create({ data: { title: 'Electromagnetism', description: 'Magnetic fields and electromagnetic induction', content: `# Electromagnetism\n\n## Magnetic Fields\n\nA magnetic field is the region around a magnet where magnetic force acts.\n\n### Right-Hand Grip Rule\nPoint thumb in direction of current → fingers curl in direction of magnetic field.\n\n## Electromagnetic Induction\n\n**Faraday's Law**: An EMF is induced when magnetic flux through a circuit changes.\n\n### Factors Affecting Induced EMF\n1. Number of turns on the coil\n2. Rate of change of magnetic flux\n3. Strength of the magnet\n\n## Transformers\n\n**Vₛ/Vₚ = Nₛ/Nₚ**\n\nWhere:\n- Vₛ, Vₚ = secondary/primary voltage\n- Nₛ, Nₚ = number of turns\n\n### Efficiency\n\nEfficiency = (Power out / Power in) × 100%`, type: 'text', duration: 25, order: 2, moduleId: physMod3.id } }),
  ]);

  // --- A-Level Computer Science Modules ---
  const csMod1 = await prisma.module.create({
    data: { title: 'Computational Thinking', description: 'Algorithms, decomposition, and abstraction', order: 1, courseId: aLevelCS.id },
  });
  const csMod2 = await prisma.module.create({
    data: { title: 'Programming with Python', description: 'Python programming fundamentals and OOP', order: 2, courseId: aLevelCS.id },
  });
  const csMod3 = await prisma.module.create({
    data: { title: 'Data Structures & Algorithms', description: 'Arrays, lists, sorting, and searching', order: 3, courseId: aLevelCS.id },
  });

  await Promise.all([
    prisma.lesson.create({ data: { title: 'Algorithms & Flowcharts', description: 'Designing algorithms and flowchart notation', content: `# Algorithms & Flowcharts\n\n## What is an Algorithm?\n\nAn algorithm is a **step-by-step procedure** for solving a problem.\n\n## Flowchart Symbols\n\n| Symbol | Meaning |\n|--------|---------|\n| Oval | Start/End |\n| Rectangle | Process |\n| Diamond | Decision |\n| Parallelogram | Input/Output |\n| Arrow | Flow direction |\n\n## Writing Algorithms\n\n### Pseudocode Example: Finding Maximum\n\n\`\`\`\nINPUT array of numbers\nSET max = first number\nFOR each number in array\n    IF number > max THEN\n        SET max = number\n    ENDIF\nNEXT number\nOUTPUT max\n\`\`\`\n\n## Decomposition\n\nBreaking a complex problem into smaller, manageable sub-problems.\n\n## Abstraction\n\nHiding unnecessary details to focus on what's important.\n\n> 🎯 A map is an abstraction of the real world!`, type: 'text', duration: 25, order: 1, moduleId: csMod1.id } }),
    prisma.lesson.create({ data: { title: 'Boolean Logic & Gates', description: 'Logic gates, truth tables, and Boolean algebra', content: `# Boolean Logic & Gates\n\n## Basic Logic Gates\n\n### AND Gate\nOutput is 1 only when ALL inputs are 1\n\n| A | B | A AND B |\n|---|---|--------|\n| 0 | 0 |    0   |\n| 0 | 1 |    0   |\n| 1 | 0 |    0   |\n| 1 | 1 |    1   |\n\n### OR Gate\nOutput is 1 when ANY input is 1\n\n### NOT Gate\nInverts the input\n\n## Boolean Algebra Laws\n\n- **De Morgan's**: NOT(A AND B) = NOT(A) OR NOT(B)\n- **Commutative**: A AND B = B AND A\n- **Associative**: (A AND B) AND C = A AND (B AND C)\n- **Distributive**: A AND (B OR C) = (A AND B) OR (A AND C)\n\n## Combining Gates\n\nComplex circuits are built by combining basic gates.\n\nHalf Adder: XOR gate for sum, AND gate for carry.`, type: 'text', duration: 30, order: 2, moduleId: csMod1.id } }),

    prisma.lesson.create({ data: { title: 'Python Basics', description: 'Variables, data types, and control structures', content: `# Python Basics\n\n## Variables & Data Types\n\n\`\`\`python\n# Numbers\nage = 18          # int\nprice = 9.99      # float\n\n# Strings\nname = "Ahmed"    # str\n\n# Boolean\nis_student = True # bool\n\`\`\`\n\n## Input & Output\n\n\`\`\`python\nname = input("Enter name: ")\nprint(f"Hello, {name}!")\n\`\`\`\n\n## Control Structures\n\n### If-Else\n\`\`\`python\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C"\n\`\`\`\n\n### Loops\n\`\`\`python\n# For loop\nfor i in range(10):\n    print(i)\n\n# While loop\nwhile count > 0:\n    count -= 1\n\`\`\`\n\n## Lists\n\n\`\`\`python\nfruits = ["apple", "banana", "cherry"]\nfruits.append("date")\nprint(fruits[0])  # apple\n\`\`\``, type: 'text', duration: 35, order: 1, moduleId: csMod2.id } }),
    prisma.lesson.create({ data: { title: 'Object-Oriented Programming', description: 'Classes, objects, inheritance, and polymorphism', content: `# Object-Oriented Programming\n\n## Classes & Objects\n\n\`\`\`python\nclass Student:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n        self.courses = []\n    \n    def enroll(self, course):\n        self.courses.append(course)\n        print(f"{self.name} enrolled in {course}")\n\n# Create object\nstudent = Student("Ahmed", 18)\nstudent.enroll("Mathematics")\n\`\`\`\n\n## Inheritance\n\n\`\`\`python\nclass GraduateStudent(Student):\n    def __init__(self, name, age, thesis):\n        super().__init__(name, age)\n        self.thesis = thesis\n\`\`\`\n\n## Encapsulation\n\nHiding internal state and requiring interaction through methods.\n\n- **Public**: accessible from anywhere\n- **Private**: prefixed with __ (name mangling)\n- **Protected**: prefixed with _ (convention)\n\n## Polymorphism\n\nSame interface, different implementations.\n\n\`\`\`python\ndef describe(entity):\n    print(entity.get_description())\n\`\`\``, type: 'text', duration: 40, order: 2, moduleId: csMod2.id } }),

    prisma.lesson.create({ data: { title: 'Sorting Algorithms', description: 'Bubble sort, insertion sort, and merge sort', content: `# Sorting Algorithms\n\n## Bubble Sort\n\nCompare adjacent elements and swap if needed.\n\n\`\`\`python\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n\`\`\`\n\nTime: O(n²) | Space: O(1)\n\n## Insertion Sort\n\nBuild sorted array one element at a time.\n\n\`\`\`python\ndef insertion_sort(arr):\n    for i in range(1, len(arr)):\n        key = arr[i]\n        j = i - 1\n        while j >= 0 and arr[j] > key:\n            arr[j+1] = arr[j]\n            j -= 1\n        arr[j+1] = key\n\`\`\`\n\nTime: O(n²) | Space: O(1)\n\n## Merge Sort\n\nDivide and conquer approach.\n\nTime: O(n log n) | Space: O(n)`, type: 'text', duration: 35, order: 1, moduleId: csMod3.id } }),
    prisma.lesson.create({ data: { title: 'Searching Algorithms', description: 'Linear search and binary search', content: `# Searching Algorithms\n\n## Linear Search\n\nCheck each element sequentially.\n\n\`\`\`python\ndef linear_search(arr, target):\n    for i in range(len(arr)):\n        if arr[i] == target:\n            return i\n    return -1\n\`\`\`\n\nTime: O(n) | Space: O(1)\n\n## Binary Search\n\nRequires **sorted** array. Compare with middle element.\n\n\`\`\`python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\`\`\`\n\nTime: O(log n) | Space: O(1)\n\n## Comparison\n\n| Algorithm | Best | Average | Worst |\n|-----------|------|---------|-------|\n| Linear | O(1) | O(n) | O(n) |\n| Binary | O(1) | O(log n) | O(log n) |`, type: 'text', duration: 25, order: 2, moduleId: csMod3.id } }),
  ]);

  // --- IELTS Modules ---
  const ieltsMod1 = await prisma.module.create({
    data: { title: 'Listening Module', description: 'IELTS listening strategies and practice', order: 1, courseId: ielts.id },
  });
  const ieltsMod2 = await prisma.module.create({
    data: { title: 'Reading Module', description: 'IELTS reading techniques and question types', order: 2, courseId: ielts.id },
  });
  const ieltsMod3 = await prisma.module.create({
    data: { title: 'Writing Module', description: 'Task 1 and Task 2 writing strategies', order: 3, courseId: ielts.id },
  });

  await Promise.all([
    prisma.lesson.create({ data: { title: 'Listening Overview & Strategies', description: 'Understanding the IELTS Listening test format', content: `# IELTS Listening Overview\n\n## Test Format\n\n- **Duration**: 30 minutes + 10 minutes transfer time\n- **Sections**: 4 sections, 40 questions\n- **Audio played once only**\n\n## Section Breakdown\n\n| Section | Topic | Speakers |\n|---------|-------|----------|\n| 1 | Social/Everyday | 2 speakers |\n| 2 | Social/Training | 1 speaker |\n| 3 | Education/Training | 2-4 speakers |\n| 4 | Academic | 1 speaker |\n\n## Key Strategies\n\n1. **Read ahead**: Use the 30-second pauses to read upcoming questions\n2. **Predict answers**: Guess the type of word needed\n3. **Spell correctly**: Spelling must be exact\n4. **Watch word limits**: Follow "NO MORE THAN TWO WORDS" rules\n5. **Don't leave blanks**: Guess if unsure\n\n## Common Question Types\n\n- Multiple choice\n- Matching\n- Map/diagram labeling\n- Form/note completion\n- Sentence completion`, type: 'text', duration: 25, order: 1, moduleId: ieltsMod1.id } }),
    prisma.lesson.create({ data: { title: 'Listening Practice – Note Completion', description: 'Practice with note completion questions', content: `# Note Completion – Listening Practice\n\n## Strategy\n\n1. Read the notes before listening\n2. Identify what type of word is needed (noun, number, etc.)\n3. Listen for synonyms – the audio may use different words\n4. Check spelling and word count\n\n## Practice Example\n\n### Notes:\n\n**University Library Tour**\n- Opened in: ____1____\n- Number of floors: ____2____\n- Quiet study area: Floor ____3____\n- Loan period for books: ____4____ weeks\n- Fine per day: £____5____\n\n### Tips\n\n- Numbers are often spelled out in the audio\n- Dates may be said as "nineteen ninety-five" not "1995"\n- Pay attention to corrections: "The library opened in 1985... sorry, 1895"\n\n> 💡 The speaker may correct themselves – always use the corrected information!`, type: 'text', duration: 20, order: 2, moduleId: ieltsMod1.id } }),

    prisma.lesson.create({ data: { title: 'Reading Question Types', description: 'Understanding different IELTS reading question types', content: `# IELTS Reading Question Types\n\n## Academic Reading\n\n3 passages, 40 questions, 60 minutes.\n\n## Question Types\n\n### 1. Multiple Choice\nChoose the correct answer from options.\n\n### 2. True/False/Not Given\n- **True**: Statement agrees with the passage\n- **False**: Statement contradicts the passage\n- **Not Given**: Information not mentioned\n\n### 3. Matching Headings\nMatch paragraph headings to paragraphs.\n\n### 4. Matching Information\nFind which paragraph contains specific information.\n\n### 5. Sentence Completion\nComplete sentences using words from the passage.\n\n### 6. Summary/Notes Completion\nFill gaps in a summary using passage words.\n\n## Key Strategies\n\n1. Skim first for general understanding\n2. Read questions carefully\n3. Scan for keywords\n4. Don't spend too long on one question\n5. Answers appear in order (usually)`, type: 'text', duration: 25, order: 1, moduleId: ieltsMod2.id } }),

    prisma.lesson.create({ data: { title: 'Writing Task 1 – Academic', description: 'Describing charts, graphs, and diagrams', content: `# Writing Task 1 – Academic\n\n## Overview\n\n- **Time**: 20 minutes\n- **Words**: Minimum 150\n- **Task**: Describe visual information\n\n## Types of Visuals\n\n- Bar chart\n- Line graph\n- Pie chart\n- Table\n- Process diagram\n- Map\n\n## Structure\n\n### Introduction (1-2 sentences)\nParaphrase the question.\n\n### Overview (2-3 sentences)\nIdentify the **main trends** or features.\n\n### Details (2 paragraphs)\nSupport the overview with specific data.\n\n## Essential Vocabulary\n\n### Trends\n- **Increase**: rose, climbed, surged, grew\n- **Decrease**: fell, declined, dropped, decreased\n- **Stable**: remained steady, levelled off\n\n### Comparing\n- whereas, while, compared to, in contrast\n- the most significant, the largest proportion\n\n> ⚠️ Never give your opinion in Task 1! Only describe what you see.`, type: 'text', duration: 30, order: 1, moduleId: ieltsMod3.id } }),
    prisma.lesson.create({ data: { title: 'Writing Task 2 – Essay', description: 'Argumentative and discussion essays', content: `# Writing Task 2 – Essay\n\n## Overview\n\n- **Time**: 40 minutes\n- **Words**: Minimum 250\n- **Weight**: Double the marks of Task 1\n\n## Essay Types\n\n### 1. Opinion Essay\n"To what extent do you agree or disagree?"\n\n### 2. Discussion Essay\n"Discuss both views and give your opinion."\n\n### 3. Problem-Solution Essay\n"What problems does this cause? What solutions can you suggest?"\n\n### 4. Advantage-Disadvantage Essay\n"Do the advantages outweigh the disadvantages?"\n\n## Essay Structure\n\n\`\`\`\nIntroduction\n  - Hook\n  - Background\n  - Thesis statement\n\nBody Paragraph 1\n  - Topic sentence\n  - Explanation\n  - Example\n  - Result\n\nBody Paragraph 2\n  - Topic sentence\n  - Explanation\n  - Example\n  - Result\n\nConclusion\n  - Restate thesis\n  - Summary of main points\n  - Final thought\n\`\`\`\n\n## Band 7+ Tips\n\n1. Use a range of complex structures\n2. Include specific examples\n3. Address all parts of the question\n4. Maintain clear paragraphing\n5. Use academic vocabulary`, type: 'text', duration: 35, order: 2, moduleId: ieltsMod3.id } }),
  ]);

  // --- AWS Cloud Modules ---
  const awsMod1 = await prisma.module.create({
    data: { title: 'Cloud Concepts', description: 'Understanding cloud computing fundamentals', order: 1, courseId: aws.id },
  });
  const awsMod2 = await prisma.module.create({
    data: { title: 'Security & Compliance', description: 'AWS security model and compliance', order: 2, courseId: aws.id },
  });

  await Promise.all([
    prisma.lesson.create({ data: { title: 'What is Cloud Computing?', description: 'Introduction to cloud computing concepts', content: `# What is Cloud Computing?\n\n## Definition\n\nCloud computing is the **on-demand delivery** of IT resources over the internet with **pay-as-you-go** pricing.\n\n## 6 Advantages of Cloud\n\n1. **Trade upfront expense for variable expense**\n2. **Benefit from massive economies of scale**\n3. **Stop guessing capacity**\n4. **Increase speed and agility**\n5. **Stop spending money on running data centers**\n6. **Go global in minutes**\n\n## Cloud Service Models\n\n| Model | Description | Example |\n|-------|-------------|--------|\n| IaaS | Infrastructure as a Service | EC2, VPC |\n| PaaS | Platform as a Service | Elastic Beanstalk |\n| SaaS | Software as a Service | AWS WorkMail |\n\n## Cloud Deployment Models\n\n- **Public Cloud**: All AWS resources\n- **Private Cloud**: On-premises (VMware on AWS)\n- **Hybrid**: Mix of both\n- **Multi-Cloud**: Multiple providers`, type: 'text', duration: 25, order: 1, moduleId: awsMod1.id } }),
    prisma.lesson.create({ data: { title: 'AWS Global Infrastructure', description: 'Regions, Availability Zones, and Edge Locations', content: `# AWS Global Infrastructure\n\n## Key Components\n\n### Regions\n- Geographically separate areas\n- Each region has multiple Availability Zones\n- Choose based on: latency, compliance, cost, service availability\n\n### Availability Zones (AZs)\n- One or more discrete data centers\n- Redundant power, networking, connectivity\n- Connected through low-latency links\n\n### Edge Locations\n- Content delivery endpoints for CloudFront\n- More edge locations than regions\n\n## Well-Architected Framework\n\n5 Pillars:\n1. **Operational Excellence**\n2. **Security**\n3. **Reliability**\n4. **Performance Efficiency**\n5. **Cost Optimization**\n\n## Key Principle\n\n**Design for failure**: Assume everything can fail and design accordingly.`, type: 'text', duration: 20, order: 2, moduleId: awsMod1.id } }),

    prisma.lesson.create({ data: { title: 'AWS Shared Responsibility Model', description: 'Understanding security responsibilities', content: `# AWS Shared Responsibility Model\n\n## The Model\n\n### AWS Responsibility (Security OF the Cloud)\n- Physical security of data centers\n- Hardware infrastructure\n- Network infrastructure\n- Virtualization layer\n\n### Customer Responsibility (Security IN the Cloud)\n- Operating system patches\n- Application security\n- Security group rules\n- Data encryption\n- IAM user management\n\n## Key Services\n\n| Service | Type |\n|---------|------|\n| IAM | Identity & Access |\n| Security Groups | Network firewall |\n| KMS | Key management |\n| CloudTrail | API auditing |\n| GuardDuty | Threat detection |\n| Inspector | Vulnerability scanning |\n\n> 💡 Remember: "Security OF the Cloud" = AWS, "Security IN the Cloud" = You!`, type: 'text', duration: 20, order: 1, moduleId: awsMod2.id } }),
    prisma.lesson.create({ data: { title: 'IAM & Access Management', description: 'Managing users, roles, and permissions', content: `# IAM & Access Management\n\n## What is IAM?\n\n**Identity and Access Management** controls who can do what in your AWS account.\n\n## Key Concepts\n\n### Users\n- Individual people or applications\n- Each has unique credentials\n\n### Groups\n- Collection of users\n- Attach policies to groups\n\n### Roles\n- Temporary credentials\n- Used by AWS services\n- Cross-account access\n\n### Policies\n- JSON documents defining permissions\n- Least privilege principle\n\n## Best Practices\n\n1. ❌ Never use root account for daily tasks\n2. ✅ Use MFA on root account\n3. ✅ Follow least privilege principle\n4. ✅ Use groups to assign permissions\n5. ✅ Rotate credentials regularly\n6. ✅ Use roles for applications\n\n## Policy Example\n\n\`\`\`json\n{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": ["s3:GetObject"],\n      "Resource": "arn:aws:s3:::my-bucket/*"\n    }\n  ]\n}\n\`\`\``, type: 'text', duration: 30, order: 2, moduleId: awsMod2.id } }),
  ]);

  // --- Python Programming Modules ---
  const pyMod1 = await prisma.module.create({
    data: { title: 'Python Fundamentals', description: 'Getting started with Python programming', order: 1, courseId: python.id },
  });
  const pyMod2 = await prisma.module.create({
    data: { title: 'Data Structures', description: 'Lists, dictionaries, tuples, and sets', order: 2, courseId: python.id },
  });
  const pyMod3 = await prisma.module.create({
    data: { title: 'Advanced Python', description: 'File handling, APIs, and web scraping', order: 3, courseId: python.id },
  });

  await Promise.all([
    prisma.lesson.create({ data: { title: 'Getting Started with Python', description: 'Installation, setup, and first program', content: `# Getting Started with Python\n\n## Installation\n\nDownload Python from [python.org](https://python.org)\n\nVerify installation:\n\`\`\`bash\npython --version\n# Python 3.12.x\n\`\`\`\n\n## Your First Program\n\n\`\`\`python\nprint("Hello, World!")\nprint("Welcome to ShijlAI Academy!")\n\`\`\`\n\n## Variables\n\n\`\`\`python\n# Python is dynamically typed\nname = "Ahmed"        # str\nage = 18             # int\nheight = 5.9         # float\nis_student = True    # bool\n\n# Type checking\nprint(type(name))    # <class 'str'>\n\`\`\`\n\n## String Operations\n\n\`\`\`python\ngreeting = "Hello"\nname = "Ahmed"\nmessage = f"{greeting}, {name}!"  # f-string\nprint(message.upper())   # HELLO, AHMED!\nprint(len(message))      # 13\n\`\`\`\n\n## Basic Math\n\n\`\`\`python\nx = 10\ny = 3\nprint(x + y)   # 13\nprint(x / y)   # 3.333...\nprint(x // y)  # 3 (floor division)\nprint(x % y)   # 1 (modulo)\nprint(x ** y)  # 1000 (exponent)\n\`\`\``, type: 'text', duration: 30, order: 1, moduleId: pyMod1.id } }),
    prisma.lesson.create({ data: { title: 'Control Flow', description: 'Conditionals and loops in Python', content: `# Control Flow\n\n## Conditional Statements\n\n\`\`\`python\nscore = 85\n\nif score >= 90:\n    grade = "A+"\nelif score >= 80:\n    grade = "A"\nelif score >= 70:\n    grade = "B"\nelse:\n    grade = "C"\n\nprint(f"Grade: {grade}")\n\`\`\`\n\n## For Loops\n\n\`\`\`python\n# Iterating over a range\nfor i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\n# Iterating over a list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)\n\n# With enumerate\nfor index, fruit in enumerate(fruits):\n    print(f"{index}: {fruit}")\n\`\`\`\n\n## While Loops\n\n\`\`\`python\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\`\`\`\n\n## Break & Continue\n\n\`\`\`python\n# Break - exit loop\nfor num in range(10):\n    if num == 5:\n        break\n    print(num)  # 0,1,2,3,4\n\n# Continue - skip iteration\nfor num in range(5):\n    if num == 2:\n        continue\n    print(num)  # 0,1,3,4\n\`\`\``, type: 'text', duration: 30, order: 2, moduleId: pyMod1.id } }),

    prisma.lesson.create({ data: { title: 'Lists & Tuples', description: 'Working with sequences in Python', content: `# Lists & Tuples\n\n## Lists\n\nLists are **mutable** ordered collections.\n\n\`\`\`python\n# Creating lists\nnumbers = [1, 2, 3, 4, 5]\nmixed = [1, "hello", True, 3.14]\nnested = [[1, 2], [3, 4]]\n\n# Common operations\nnumbers.append(6)        # Add to end\nnumbers.insert(0, 0)    # Insert at index\nnumbers.remove(3)       # Remove by value\nnumbers.pop()           # Remove last\nnumbers.sort()          # Sort in place\nnumbers.reverse()       # Reverse\n\n# Slicing\nnumbers[1:4]    # Elements 1-3\nnumbers[:3]     # First 3\nnumbers[::2]    # Every 2nd element\n\`\`\`\n\n## List Comprehensions\n\n\`\`\`python\nsquares = [x**2 for x in range(10)]\nevens = [x for x in range(20) if x % 2 == 0]\n\`\`\`\n\n## Tuples\n\nTuples are **immutable** ordered collections.\n\n\`\`\`python\npoint = (3, 4)\ncolors = ("red", "green", "blue")\n\n# Unpacking\nx, y = point\n\`\`\`\n\n## When to Use What?\n\n| Feature | List | Tuple |\n|---------|------|-------|\n| Mutable | Yes | No |\n| Speed | Slower | Faster |\n| Use as dict key | No | Yes |`, type: 'text', duration: 30, order: 1, moduleId: pyMod2.id } }),
    prisma.lesson.create({ data: { title: 'Dictionaries & Sets', description: 'Key-value pairs and sets in Python', content: `# Dictionaries & Sets\n\n## Dictionaries\n\nDictionaries store **key-value pairs**.\n\n\`\`\`python\n# Creating dictionaries\nstudent = {\n    "name": "Ahmed",\n    "age": 18,\n    "courses": ["Math", "Physics"]\n}\n\n# Accessing values\nprint(student["name"])           # Ahmed\nprint(student.get("gpa", 0.0))   # 0.0 (default)\n\n# Modifying\nstudent["age"] = 19             # Update\nstudent["grade"] = "A"          # Add\n\n# Useful methods\nstudent.keys()    # All keys\nstudent.values()  # All values\nstudent.items()   # Key-value pairs\n\n# Iterating\nfor key, value in student.items():\n    print(f"{key}: {value}")\n\`\`\`\n\n## Dict Comprehensions\n\n\`\`\`python\nsquares = {x: x**2 for x in range(5)}\n# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}\n\`\`\`\n\n## Sets\n\nSets store **unique** elements.\n\n\`\`\`python\nfruits = {"apple", "banana", "cherry"}\nfruits.add("date")\nfruits.remove("banana")\n\n# Set operations\na = {1, 2, 3}\nb = {3, 4, 5}\na | b    # Union: {1,2,3,4,5}\na & b    # Intersection: {3}\na - b    # Difference: {1,2}\n\`\`\``, type: 'text', duration: 30, order: 2, moduleId: pyMod2.id } }),

    prisma.lesson.create({ data: { title: 'File Handling', description: 'Reading and writing files in Python', content: `# File Handling\n\n## Reading Files\n\n\`\`\`python\n# Read entire file\nwith open("data.txt", "r") as f:\n    content = f.read()\n\n# Read line by line\nwith open("data.txt", "r") as f:\n    for line in f:\n        print(line.strip())\n\n# Read all lines into list\nwith open("data.txt", "r") as f:\n    lines = f.readlines()\n\`\`\`\n\n## Writing Files\n\n\`\`\`python\n# Write (overwrites)\nwith open("output.txt", "w") as f:\n    f.write("Hello, World!\\n")\n\n# Append\nwith open("output.txt", "a") as f:\n    f.write("New line\\n")\n\`\`\`\n\n## Working with CSV\n\n\`\`\`python\nimport csv\n\n# Reading CSV\nwith open("data.csv", "r") as f:\n    reader = csv.DictReader(f)\n    for row in reader:\n        print(row["name"], row["score"])\n\n# Writing CSV\nwith open("output.csv", "w", newline="") as f:\n    writer = csv.DictWriter(f, fieldnames=["name", "score"])\n    writer.writeheader()\n    writer.writerow({"name": "Ahmed", "score": 95})\n\`\`\`\n\n## JSON Files\n\n\`\`\`python\nimport json\n\n# Writing\nwith open("data.json", "w") as f:\n    json.dump({"name": "Ahmed"}, f, indent=2)\n\n# Reading\nwith open("data.json", "r") as f:\n    data = json.load(f)\n\`\`\``, type: 'text', duration: 30, order: 1, moduleId: pyMod3.id } }),
    prisma.lesson.create({ data: { title: 'Working with APIs', description: 'Making HTTP requests in Python', content: `# Working with APIs\n\n## Using the requests Library\n\n\`\`\`python\nimport requests\n\n# GET request\nresponse = requests.get("https://api.example.com/data")\ndata = response.json()\n\n# POST request\npayload = {"name": "Ahmed", "course": "Python"}\nresponse = requests.post(\n    "https://api.example.com/students",\n    json=payload\n)\n\n# With headers\nheaders = {"Authorization": "Bearer YOUR_TOKEN"}\nresponse = requests.get(\n    "https://api.example.com/protected",\n    headers=headers\n)\n\`\`\`\n\n## Handling Responses\n\n\`\`\`python\n# Status codes\nif response.status_code == 200:\n    print("Success!")\nelif response.status_code == 404:\n    print("Not found")\n\n# Response attributes\nresponse.text       # Raw text\nresponse.json()    # Parsed JSON\nresponse.headers   # Response headers\n\`\`\`\n\n## Error Handling\n\n\`\`\`python\ntry:\n    response = requests.get(url, timeout=5)\n    response.raise_for_status()\n    data = response.json()\nexcept requests.Timeout:\n    print("Request timed out")\nexcept requests.ConnectionError:\n    print("Connection failed")\nexcept requests.HTTPError as e:\n    print(f"HTTP error: {e}")\n\`\`\``, type: 'text', duration: 30, order: 2, moduleId: pyMod3.id } }),
  ]);

  // ==================== QUIZZES & QUESTIONS ====================
  console.log('Creating quizzes and questions...');

  // FSc Math Quiz
  const mathQuiz = await prisma.quiz.create({
    data: {
      title: 'FSc Mathematics – Number Systems Quiz',
      description: 'Test your understanding of number systems, complex numbers, and their properties',
      type: 'practice',
      timeLimit: 20,
      passingScore: 70,
      courseId: fscMath.id,
    },
  });

  await Promise.all([
    prisma.question.create({
      data: {
        quizId: mathQuiz.id,
        text: 'Which of the following is an irrational number?',
        type: 'mcq',
        options: JSON.stringify(['3/4', '√2', '0.5', '2']),
        correctAnswer: '√2',
        explanation: '√2 cannot be expressed as a fraction p/q where q ≠ 0. It is approximately 1.41421356... which is non-terminating and non-repeating.',
        points: 1,
        order: 1,
      },
    }),
    prisma.question.create({
      data: {
        quizId: mathQuiz.id,
        text: 'The conjugate of 3 + 4i is:',
        type: 'mcq',
        options: JSON.stringify(['3 - 4i', '-3 + 4i', '-3 - 4i', '4 + 3i']),
        correctAnswer: '3 - 4i',
        explanation: 'The conjugate of a + bi is a - bi. So the conjugate of 3 + 4i is 3 - 4i.',
        points: 1,
        order: 2,
      },
    }),
    prisma.question.create({
      data: {
        quizId: mathQuiz.id,
        text: 'i² equals:',
        type: 'mcq',
        options: JSON.stringify(['1', '-1', 'i', '-i']),
        correctAnswer: '-1',
        explanation: 'By definition, i is the imaginary unit where i² = -1.',
        points: 1,
        order: 3,
      },
    }),
    prisma.question.create({
      data: {
        quizId: mathQuiz.id,
        text: 'True or False: Every real number is a complex number.',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: 'True',
        explanation: 'Every real number a can be written as a + 0i, which is a complex number with zero imaginary part.',
        points: 1,
        order: 4,
      },
    }),
    prisma.question.create({
      data: {
        quizId: mathQuiz.id,
        text: 'The product of (2 + 3i) and (2 - 3i) equals:',
        type: 'mcq',
        options: JSON.stringify(['4 + 9i', '13', '4 - 9i', '-5']),
        correctAnswer: '13',
        explanation: '(2 + 3i)(2 - 3i) = 4 - 6i + 6i - 9i² = 4 + 9 = 13. The product of a complex number and its conjugate is always real.',
        points: 2,
        order: 5,
      },
    }),
  ]);

  // Physics Quiz
  const physQuiz = await prisma.quiz.create({
    data: {
      title: 'O-Level Physics – Mechanics Quiz',
      description: 'Test your understanding of forces, motion, and energy',
      type: 'practice',
      timeLimit: 25,
      passingScore: 70,
      courseId: oLevelPhysics.id,
    },
  });

  await Promise.all([
    prisma.question.create({
      data: {
        quizId: physQuiz.id,
        text: 'According to Newton\'s Second Law, force equals:',
        type: 'mcq',
        options: JSON.stringify(['mass × velocity', 'mass × acceleration', 'weight × height', 'momentum × time']),
        correctAnswer: 'mass × acceleration',
        explanation: 'Newton\'s Second Law states F = ma, where F is force, m is mass, and a is acceleration.',
        points: 1,
        order: 1,
      },
    }),
    prisma.question.create({
      data: {
        quizId: physQuiz.id,
        text: 'A car accelerates from rest at 2 m/s². What is its velocity after 5 seconds?',
        type: 'mcq',
        options: JSON.stringify(['5 m/s', '10 m/s', '15 m/s', '25 m/s']),
        correctAnswer: '10 m/s',
        explanation: 'Using v = u + at, where u = 0, a = 2 m/s², t = 5s: v = 0 + 2×5 = 10 m/s',
        points: 2,
        order: 2,
      },
    }),
    prisma.question.create({
      data: {
        quizId: physQuiz.id,
        text: 'Kinetic energy is given by the formula:',
        type: 'mcq',
        options: JSON.stringify(['KE = mgh', 'KE = ½mv²', 'KE = Fd', 'KE = Pt']),
        correctAnswer: 'KE = ½mv²',
        explanation: 'Kinetic energy depends on mass and the square of velocity: KE = ½mv²',
        points: 1,
        order: 3,
      },
    }),
    prisma.question.create({
      data: {
        quizId: physQuiz.id,
        text: 'True or False: In a series circuit, the current is the same through all components.',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: 'True',
        explanation: 'In a series circuit, there is only one path for current flow, so the current is the same through all components.',
        points: 1,
        order: 4,
      },
    }),
    prisma.question.create({
      data: {
        quizId: physQuiz.id,
        text: 'What is the unit of power?',
        type: 'mcq',
        options: JSON.stringify(['Joule', 'Newton', 'Watt', 'Pascal']),
        correctAnswer: 'Watt',
        explanation: 'Power is measured in Watts (W). 1 Watt = 1 Joule per second.',
        points: 1,
        order: 5,
      },
    }),
  ]);

  // CS Quiz
  const csQuiz = await prisma.quiz.create({
    data: {
      title: 'A-Level CS – Algorithms Quiz',
      description: 'Test your knowledge of algorithms, sorting, and searching',
      type: 'practice',
      timeLimit: 20,
      passingScore: 70,
      courseId: aLevelCS.id,
    },
  });

  await Promise.all([
    prisma.question.create({
      data: {
        quizId: csQuiz.id,
        text: 'What is the time complexity of binary search?',
        type: 'mcq',
        options: JSON.stringify(['O(n)', 'O(n²)', 'O(log n)', 'O(1)']),
        correctAnswer: 'O(log n)',
        explanation: 'Binary search halves the search space with each comparison, giving it O(log n) time complexity.',
        points: 1,
        order: 1,
      },
    }),
    prisma.question.create({
      data: {
        quizId: csQuiz.id,
        text: 'The output of NOT(A AND B) is equivalent to:',
        type: 'mcq',
        options: JSON.stringify(['NOT A AND NOT B', 'NOT A OR NOT B', 'A AND B', 'A OR B']),
        correctAnswer: 'NOT A OR NOT B',
        explanation: 'This is De Morgan\'s Law: NOT(A AND B) = NOT(A) OR NOT(B)',
        points: 2,
        order: 2,
      },
    }),
    prisma.question.create({
      data: {
        quizId: csQuiz.id,
        text: 'Bubble sort has a worst-case time complexity of:',
        type: 'mcq',
        options: JSON.stringify(['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']),
        correctAnswer: 'O(n²)',
        explanation: 'Bubble sort uses nested loops, each iterating up to n times, giving O(n²) worst-case complexity.',
        points: 1,
        order: 3,
      },
    }),
    prisma.question.create({
      data: {
        quizId: csQuiz.id,
        text: 'True or False: Binary search works on unsorted arrays.',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: 'False',
        explanation: 'Binary search requires the array to be sorted because it relies on comparing with the middle element to eliminate half the search space.',
        points: 1,
        order: 4,
      },
    }),
  ]);

  // IELTS Quiz
  const ieltsQuiz = await prisma.quiz.create({
    data: {
      title: 'IELTS Preparation – Key Strategies Quiz',
      description: 'Test your knowledge of IELTS test format and strategies',
      type: 'practice',
      timeLimit: 15,
      passingScore: 70,
      courseId: ielts.id,
    },
  });

  await Promise.all([
    prisma.question.create({
      data: {
        quizId: ieltsQuiz.id,
        text: 'How many sections does the IELTS Listening test have?',
        type: 'mcq',
        options: JSON.stringify(['2', '3', '4', '5']),
        correctAnswer: '4',
        explanation: 'The IELTS Listening test has 4 sections with a total of 40 questions.',
        points: 1,
        order: 1,
      },
    }),
    prisma.question.create({
      data: {
        quizId: ieltsQuiz.id,
        text: 'In IELTS Writing Task 2, the minimum word count is:',
        type: 'mcq',
        options: JSON.stringify(['150 words', '200 words', '250 words', '300 words']),
        correctAnswer: '250 words',
        explanation: 'Writing Task 2 requires a minimum of 250 words. Writing fewer words will result in a penalty.',
        points: 1,
        order: 2,
      },
    }),
    prisma.question.create({
      data: {
        quizId: ieltsQuiz.id,
        text: 'True or False: The IELTS Listening audio is played twice.',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: 'False',
        explanation: 'The audio is played only ONCE. This is why previewing questions during the pauses is crucial.',
        points: 1,
        order: 3,
      },
    }),
    prisma.question.create({
      data: {
        quizId: ieltsQuiz.id,
        text: 'Which writing task carries more marks?',
        type: 'mcq',
        options: JSON.stringify(['Task 1', 'Task 2', 'Both equal', 'Depends on the test']),
        correctAnswer: 'Task 2',
        explanation: 'Task 2 is worth double the marks of Task 1, so you should spend about 40 minutes on Task 2 and 20 minutes on Task 1.',
        points: 1,
        order: 4,
      },
    }),
  ]);

  // AWS Quiz
  const awsQuiz = await prisma.quiz.create({
    data: {
      title: 'AWS Cloud Practitioner – Cloud Concepts Quiz',
      description: 'Test your understanding of cloud computing and AWS fundamentals',
      type: 'practice',
      timeLimit: 20,
      passingScore: 70,
      courseId: aws.id,
    },
  });

  await Promise.all([
    prisma.question.create({
      data: {
        quizId: awsQuiz.id,
        text: 'Which AWS service is used for content delivery?',
        type: 'mcq',
        options: JSON.stringify(['EC2', 'S3', 'CloudFront', 'Lambda']),
        correctAnswer: 'CloudFront',
        explanation: 'Amazon CloudFront is a Content Delivery Network (CDN) that delivers data with low latency.',
        points: 1,
        order: 1,
      },
    }),
    prisma.question.create({
      data: {
        quizId: awsQuiz.id,
        text: 'In the AWS Shared Responsibility Model, who is responsible for configuring security groups?',
        type: 'mcq',
        options: JSON.stringify(['AWS', 'Customer', 'Both equally', 'Third-party']),
        correctAnswer: 'Customer',
        explanation: 'Security group configuration is the customer\'s responsibility (Security IN the Cloud). AWS manages the infrastructure (Security OF the Cloud).',
        points: 1,
        order: 2,
      },
    }),
    prisma.question.create({
      data: {
        quizId: awsQuiz.id,
        text: 'What does IaaS stand for?',
        type: 'mcq',
        options: JSON.stringify(['Internet as a Service', 'Infrastructure as a Service', 'Integration as a Service', 'Identity as a Service']),
        correctAnswer: 'Infrastructure as a Service',
        explanation: 'IaaS provides virtualized computing resources over the internet, like EC2 instances.',
        points: 1,
        order: 3,
      },
    }),
    prisma.question.create({
      data: {
        quizId: awsQuiz.id,
        text: 'True or False: AWS Regions are physically separate geographic areas.',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: 'True',
        explanation: 'AWS Regions are separate geographic areas, each containing multiple Availability Zones.',
        points: 1,
        order: 4,
      },
    }),
  ]);

  // Python Quiz
  const pyQuiz = await prisma.quiz.create({
    data: {
      title: 'Python Programming – Basics Quiz',
      description: 'Test your Python fundamentals',
      type: 'practice',
      timeLimit: 15,
      passingScore: 70,
      courseId: python.id,
    },
  });

  await Promise.all([
    prisma.question.create({
      data: {
        quizId: pyQuiz.id,
        text: 'What is the output of: print(type(3.14))?',
        type: 'mcq',
        options: JSON.stringify(["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>"]),
        correctAnswer: "<class 'float'>",
        explanation: '3.14 is a floating-point number, so type() returns <class \'float\'>.',
        points: 1,
        order: 1,
      },
    }),
    prisma.question.create({
      data: {
        quizId: pyQuiz.id,
        text: 'Which method adds an element to the end of a list?',
        type: 'mcq',
        options: JSON.stringify(['add()', 'append()', 'insert()', 'push()']),
        correctAnswer: 'append()',
        explanation: 'The append() method adds an element to the end of a list. add() is for sets, insert() takes an index parameter.',
        points: 1,
        order: 2,
      },
    }),
    prisma.question.create({
      data: {
        quizId: pyQuiz.id,
        text: 'What does len([1, 2, 3, 4, 5]) return?',
        type: 'mcq',
        options: JSON.stringify(['4', '5', '6', 'Error']),
        correctAnswer: '5',
        explanation: 'len() returns the number of items in the list. This list has 5 elements.',
        points: 1,
        order: 3,
      },
    }),
    prisma.question.create({
      data: {
        quizId: pyQuiz.id,
        text: 'True or False: Tuples are mutable in Python.',
        type: 'true_false',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: 'False',
        explanation: 'Tuples are immutable. Once created, their elements cannot be changed. Use lists if you need mutability.',
        points: 1,
        order: 4,
      },
    }),
    prisma.question.create({
      data: {
        quizId: pyQuiz.id,
        text: 'What is the output of: print(10 // 3)?',
        type: 'mcq',
        options: JSON.stringify(['3.33', '3', '4', '3.0']),
        correctAnswer: '3',
        explanation: 'The // operator performs floor division, which returns the integer part of the quotient: 10 // 3 = 3.',
        points: 1,
        order: 5,
      },
    }),
  ]);

  // ==================== ENROLLMENTS ====================
  console.log('Creating enrollments...');

  const enrollment1 = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: fscMath.id,
      progress: 45,
      lastAccessed: new Date(),
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: python.id,
      progress: 72,
      lastAccessed: new Date(),
    },
  });

  const enrollment3 = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: ielts.id,
      progress: 20,
      lastAccessed: new Date(),
    },
  });

  // ==================== LESSON PROGRESS ====================
  console.log('Creating lesson progress...');

  // Get all lessons for enrolled courses
  const fscMathLessons = await prisma.lesson.findMany({
    where: { module: { courseId: fscMath.id } },
    orderBy: { order: 'asc' },
  });

  const pythonLessons = await prisma.lesson.findMany({
    where: { module: { courseId: python.id } },
    orderBy: { order: 'asc' },
  });

  const ieltsLessons = await prisma.lesson.findMany({
    where: { module: { courseId: ielts.id } },
    orderBy: { order: 'asc' },
  });

  // FSc Math progress (45% - some completed, some in progress)
  for (let i = 0; i < fscMathLessons.length; i++) {
    const lesson = fscMathLessons[i];
    if (i < 4) {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment1.id,
          lessonId: lesson.id,
          status: 'completed',
          timeSpent: lesson.duration * 60,
          completedAt: new Date(Date.now() - (fscMathLessons.length - i) * 86400000),
          xpEarned: 25,
        },
      });
    } else if (i < 5) {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment1.id,
          lessonId: lesson.id,
          status: 'in_progress',
          timeSpent: Math.floor(lesson.duration * 30),
        },
      });
    }
  }

  // Python progress (72% - most completed)
  for (let i = 0; i < pythonLessons.length; i++) {
    const lesson = pythonLessons[i];
    if (i < 4) {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment2.id,
          lessonId: lesson.id,
          status: 'completed',
          timeSpent: lesson.duration * 60,
          completedAt: new Date(Date.now() - (pythonLessons.length - i) * 86400000),
          xpEarned: 25,
        },
      });
    } else if (i < 5) {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment2.id,
          lessonId: lesson.id,
          status: 'in_progress',
          timeSpent: Math.floor(lesson.duration * 30),
        },
      });
    }
  }

  // IELTS progress (20% - just started)
  for (let i = 0; i < ieltsLessons.length; i++) {
    const lesson = ieltsLessons[i];
    if (i < 2) {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment3.id,
          lessonId: lesson.id,
          status: 'completed',
          timeSpent: lesson.duration * 60,
          completedAt: new Date(Date.now() - (ieltsLessons.length - i) * 86400000),
          xpEarned: 25,
        },
      });
    } else if (i < 3) {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment3.id,
          lessonId: lesson.id,
          status: 'in_progress',
          timeSpent: Math.floor(lesson.duration * 20),
        },
      });
    }
  }

  // ==================== QUIZ ATTEMPTS ====================
  console.log('Creating quiz attempts...');

  await prisma.quizAttempt.create({
    data: {
      userId: student.id,
      quizId: mathQuiz.id,
      score: 4,
      maxScore: 6,
      percentage: 66.7,
      passed: false,
      answers: JSON.stringify([
        { questionId: 'q1', answer: '√2', correct: true },
        { questionId: 'q2', answer: '3 - 4i', correct: true },
        { questionId: 'q3', answer: '-1', correct: true },
        { questionId: 'q4', answer: 'True', correct: true },
        { questionId: 'q5', answer: '4 + 9i', correct: false },
      ]),
      xpEarned: 50,
      completedAt: new Date(),
    },
  });

  await prisma.quizAttempt.create({
    data: {
      userId: student.id,
      quizId: pyQuiz.id,
      score: 5,
      maxScore: 5,
      percentage: 100,
      passed: true,
      answers: JSON.stringify([
        { questionId: 'q1', answer: "<class 'float'>", correct: true },
        { questionId: 'q2', answer: 'append()', correct: true },
        { questionId: 'q3', answer: '5', correct: true },
        { questionId: 'q4', answer: 'False', correct: true },
        { questionId: 'q5', answer: '3', correct: true },
      ]),
      xpEarned: 100,
      completedAt: new Date(),
    },
  });

  await prisma.quizAttempt.create({
    data: {
      userId: student.id,
      quizId: physQuiz.id,
      score: 3,
      maxScore: 5,
      percentage: 60,
      passed: false,
      answers: JSON.stringify([
        { questionId: 'q1', answer: 'mass × acceleration', correct: true },
        { questionId: 'q2', answer: '5 m/s', correct: false },
        { questionId: 'q3', answer: 'KE = ½mv²', correct: true },
        { questionId: 'q4', answer: 'True', correct: true },
        { questionId: 'q5', answer: 'Newton', correct: false },
      ]),
      xpEarned: 30,
      completedAt: new Date(),
    },
  });

  // ==================== DAILY ACTIVITY ====================
  console.log('Creating daily activity records...');

  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const xp = i < 7 ? Math.floor(Math.random() * 100) + 50 : Math.floor(Math.random() * 150) + 30;
    const lessons = Math.floor(Math.random() * 3) + (i < 7 ? 1 : 0);
    const quizzes = Math.random() > 0.6 ? 1 : 0;
    const time = (Math.floor(Math.random() * 120) + 30) * 60;

    await prisma.dailyActivity.create({
      data: {
        userId: student.id,
        date: dateStr,
        xpEarned: xp,
        lessonsCompleted: lessons,
        quizzesTaken: quizzes,
        timeSpent: time,
      },
    });
  }

  // ==================== ADDITIONAL COURSES (with prices for wishlist) ====================
  console.log('Creating additional courses with prices...');

  const dataScience = await prisma.course.create({
    data: {
      title: 'Data Science Fundamentals',
      description: 'Master data science with Python: Pandas, NumPy, Matplotlib, Scikit-learn, and real-world projects. From data analysis to machine learning. Covers statistics, data visualization, and predictive modeling.',
      category: 'Tech',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 1499,
      isPublished: true,
      enrollmentCount: 2100,
      rating: 4.8,
      estimatedDuration: 12,
      tags: JSON.stringify(["data-science", "python", "machine-learning", "pandas"]),
      instructorId: instructor.id,
    },
  });

  const djangoAPIs = await prisma.course.create({
    data: {
      title: 'Django REST APIs – Backend Development',
      description: 'Build production-ready REST APIs with Django and Django REST Framework. Authentication, deployment, testing, and best practices.',
      category: 'Tech',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 1999,
      isPublished: true,
      enrollmentCount: 891,
      rating: 4.7,
      estimatedDuration: 8,
      tags: JSON.stringify(["django", "rest-api", "backend", "python"]),
      instructorId: instructor.id,
    },
  });

  const uiuxDesign = await prisma.course.create({
    data: {
      title: 'UI/UX Design Masterclass',
      description: 'Learn UI/UX design from scratch. Master Figma, design systems, prototyping, user research, and build a professional portfolio.',
      category: 'Design',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 2499,
      isPublished: true,
      enrollmentCount: 3200,
      rating: 4.9,
      estimatedDuration: 15,
      tags: JSON.stringify(["ui-ux", "design", "figma", "prototyping"]),
      instructorId: instructor.id,
    },
  });

  const webDev = await prisma.course.create({
    data: {
      title: 'Full-Stack Web Development with React',
      description: 'Build full-stack web apps with React, Next.js, Node.js, and MongoDB. From HTML/CSS to deployment.',
      category: 'Tech',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 2999,
      isPublished: true,
      enrollmentCount: 567,
      rating: 4.7,
      estimatedDuration: 60,
      tags: JSON.stringify(["web-development", "react", "nextjs", "fullstack"]),
      instructorId: instructor.id,
    },
  });

  const gitCourse = await prisma.course.create({
    data: {
      title: 'Git & GitHub for Beginners',
      description: 'Master version control with Git and GitHub. Branching, merging, pull requests, and collaboration workflows.',
      category: 'Tech',
      level: 'beginner',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 892,
      rating: 4.9,
      estimatedDuration: 12,
      tags: JSON.stringify(["git", "github", "version-control", "collaboration"]),
      instructorId: instructor.id,
    },
  });

  const mathematics = await prisma.course.create({
    data: {
      title: 'O-Level Mathematics – Complete Preparation',
      description: 'Complete O-Level Mathematics preparation covering algebra, geometry, trigonometry, and statistics. Board exam focused.',
      category: 'Sciences',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-math.png',
      price: 999,
      isPublished: true,
      enrollmentCount: 423,
      rating: 4.5,
      estimatedDuration: 50,
      tags: JSON.stringify(["mathematics", "o-levels", "algebra", "geometry"]),
      instructorId: instructor.id,
    },
  });

  // ==================== NEW DIVERSE COURSES ====================
  console.log('Creating diverse course catalog...');

  // Course: TypeScript Complete Guide
  const typeScript = await prisma.course.create({
    data: {
      title: 'TypeScript Complete Guide',
      description: 'Master TypeScript from basics to advanced. Type system, generics, decorators, and building scalable applications with TypeScript and modern tooling.',
      category: 'Tech',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 1299,
      isPublished: true,
      enrollmentCount: 1400,
      rating: 4.6,
      estimatedDuration: 10,
      tags: JSON.stringify(["typescript", "javascript", "programming", "web-development"]),
      instructorId: instructor.id,
    },
  });

  // Course: Freelancing Masterclass
  const freelancing = await prisma.course.create({
    data: {
      title: 'Freelancing Masterclass – Start Your Career',
      description: 'Learn how to build a successful freelancing career on Upwork, Fiverr, and local platforms. Profile optimization, proposal writing, client management, and pricing strategies for Pakistani freelancers.',
      category: 'Business',
      level: 'beginner',
      language: 'bilingual',
      thumbnail: '/course-math.png',
      price: 999,
      isPublished: true,
      enrollmentCount: 5100,
      rating: 4.9,
      estimatedDuration: 5,
      tags: JSON.stringify(["freelancing", "upwork", "fiverr", "career"]),
      instructorId: instructor.id,
    },
  });

  // Course: IELTS Prep Academic
  const ieltsAcademic = await prisma.course.create({
    data: {
      title: 'IELTS Prep Academic – Band 7+ Strategy',
      description: 'Focused IELTS Academic preparation with proven strategies for Band 7+. Includes full-length practice tests, writing templates, speaking mock tests, and personalized feedback.',
      category: 'Language',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-english.png',
      price: 1499,
      isPublished: true,
      enrollmentCount: 3800,
      rating: 4.8,
      estimatedDuration: 20,
      tags: JSON.stringify(["ielts", "academic", "english", "band-7", "study-abroad"]),
      instructorId: instructor.id,
    },
  });

  // Course: Canva Design for Everyone
  const canvaDesign = await prisma.course.create({
    data: {
      title: 'Canva Design for Everyone',
      description: 'Create stunning designs with Canva — no design experience needed! Social media posts, presentations, flyers, logos, and more. Perfect for students, entrepreneurs, and content creators.',
      category: 'Design',
      level: 'beginner',
      language: 'bilingual',
      thumbnail: '/course-cs.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 4400,
      rating: 4.8,
      estimatedDuration: 3,
      tags: JSON.stringify(["canva", "design", "graphic-design", "social-media"]),
      instructorId: instructor.id,
    },
  });

  // Course: HTML & CSS Basics
  const htmlCss = await prisma.course.create({
    data: {
      title: 'HTML & CSS Basics – Build Your First Website',
      description: 'Learn HTML5 and CSS3 from scratch. Build responsive websites with modern layouts, Flexbox, Grid, and animations. No prior coding experience required.',
      category: 'Tech',
      level: 'beginner',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 8200,
      rating: 4.7,
      estimatedDuration: 4,
      tags: JSON.stringify(["html", "css", "web-development", "responsive"]),
      instructorId: instructor.id,
    },
  });

  // Course: Excel for Professionals
  const excel = await prisma.course.create({
    data: {
      title: 'Excel for Professionals – Spreadsheet Mastery',
      description: 'Master Microsoft Excel for professional use. Formulas, pivot tables, charts, VLOOKUP, data analysis, and automation with macros. Essential for business and finance careers.',
      category: 'Business',
      level: 'beginner',
      language: 'en',
      thumbnail: '/course-math.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 6100,
      rating: 4.6,
      estimatedDuration: 5,
      tags: JSON.stringify(["excel", "spreadsheets", "data-analysis", "business"]),
      instructorId: instructor.id,
    },
  });

  // Course: Public Speaking Mastery
  const publicSpeaking = await prisma.course.create({
    data: {
      title: 'Public Speaking Mastery – Confident Communication',
      description: 'Overcome stage fright and become a confident speaker. Presentation skills, body language, storytelling techniques, and persuasive communication for professionals and students.',
      category: 'Business',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-math.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 4400,
      rating: 4.8,
      estimatedDuration: 3,
      tags: JSON.stringify(["public-speaking", "communication", "presentation", "confidence"]),
      instructorId: instructor.id,
    },
  });

  // Course: React & Next.js Development
  const reactNextjs = await prisma.course.create({
    data: {
      title: 'React & Next.js Development – Modern Web Apps',
      description: 'Build production-ready web applications with React 19 and Next.js 16. Hooks, Server Components, App Router, API routes, authentication, and deployment strategies.',
      category: 'Tech',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-cs.png',
      price: 1999,
      isPublished: true,
      enrollmentCount: 2800,
      rating: 4.8,
      estimatedDuration: 14,
      tags: JSON.stringify(["react", "nextjs", "web-development", "javascript"]),
      instructorId: instructor.id,
    },
  });

  // Course: FSc Biology Part 1
  const fscBiology = await prisma.course.create({
    data: {
      title: 'FSc Biology Part 1 – Complete Course',
      description: 'Complete FSc Part 1 Biology covering Introduction, Cell Biology, Biological Molecules, Enzymes, Bioenergetics, Cell Cycle, and more. Aligned with Punjab Board curriculum.',
      category: 'Sciences',
      level: 'intermediate',
      language: 'en',
      thumbnail: '/course-physics.png',
      price: 0,
      isPublished: true,
      enrollmentCount: 1200,
      rating: 4.5,
      estimatedDuration: 20,
      tags: JSON.stringify(["biology", "fsc", "cell-biology", "biochemistry"]),
      instructorId: instructor.id,
    },
  });

  // Course: Creative Writing Workshop
  const creativeWriting = await prisma.course.create({
    data: {
      title: 'Creative Writing Workshop – Express Yourself',
      description: 'Unlock your creative writing potential. Fiction, poetry, essays, and storytelling techniques. Develop your unique voice and build a writing portfolio with guided exercises.',
      category: 'Arts',
      level: 'beginner',
      language: 'en',
      thumbnail: '/course-english.png',
      price: 799,
      isPublished: true,
      enrollmentCount: 1800,
      rating: 4.6,
      estimatedDuration: 6,
      tags: JSON.stringify(["creative-writing", "storytelling", "poetry", "fiction"]),
      instructorId: instructor.id,
    },
  });

  // ==================== MODULES & LESSONS FOR NEW COURSES ====================
  console.log('Creating modules and lessons for new courses...');

  // --- TypeScript Modules ---
  const tsMod1 = await prisma.module.create({
    data: { title: 'TypeScript Fundamentals', description: 'Getting started with TypeScript', order: 1, courseId: typeScript.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Introduction to TypeScript', description: 'Why TypeScript and setup', content: `# Introduction to TypeScript\n\n## What is TypeScript?\n\nTypeScript is a **typed superset of JavaScript** that compiles to plain JavaScript.\n\n## Why TypeScript?\n\n1. **Type Safety**: Catch errors at compile time\n2. **Better IDE Support**: Autocomplete, refactoring\n3. **Self-Documenting**: Types serve as documentation\n4. **Scalability**: Easier to maintain large codebases\n\n## Installation\n\n\`\`\`bash\nnpm install -g typescript\ntsc --version\n\`\`\`\n\n## First TypeScript File\n\n\`\`\`typescript\n// hello.ts\nlet message: string = "Hello, TypeScript!";\nconsole.log(message);\n\`\`\`\n\nCompile: \`tsc hello.ts\` → generates \`hello.js\`\n\n## tsconfig.json\n\n\`\`\`json\n{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "commonjs",\n    "strict": true\n  }\n}\n\`\`\``, type: 'text', duration: 30, order: 1, moduleId: tsMod1.id } }),
    prisma.lesson.create({ data: { title: 'Type Annotations & Interfaces', description: 'Working with types and interfaces', content: `# Type Annotations & Interfaces\n\n## Basic Types\n\n\`\`\`typescript\nlet name: string = "Ahmed";\nlet age: number = 22;\nlet isActive: boolean = true;\nlet items: string[] = ["a", "b", "c"];\n\`\`\`\n\n## Interfaces\n\n\`\`\`typescript\ninterface Student {\n  id: number;\n  name: string;\n  email: string;\n  enrolled?: boolean; // optional\n}\n\nconst student: Student = {\n  id: 1,\n  name: "Ahmed",\n  email: "ahmed@example.com"\n};\n\`\`\`\n\n## Type Aliases\n\n\`\`\`typescript\ntype Status = "active" | "inactive" | "pending";\ntype ID = string | number;\n\`\`\`\n\n> 💡 Use interfaces for object shapes, type aliases for unions and utility types.`, type: 'text', duration: 35, order: 2, moduleId: tsMod1.id } }),
    prisma.lesson.create({ data: { title: 'Generics & Advanced Types', description: 'Generic functions and conditional types', content: `# Generics & Advanced Types\n\n## Generic Functions\n\n\`\`\`typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n\nconst result = identity<string>("hello");\nconst num = identity(42); // inferred\n\`\`\`\n\n## Generic Interfaces\n\n\`\`\`typescript\ninterface ApiResponse<T> {\n  data: T;\n  status: number;\n  message: string;\n}\n\nconst userResponse: ApiResponse<Student> = {\n  data: { id: 1, name: "Ahmed", email: "a@b.com" },\n  status: 200,\n  message: "Success"\n};\n\`\`\`\n\n## Utility Types\n\n- \`Partial<T>\` — all properties optional\n- \`Required<T>\` — all properties required\n- \`Pick<T, K>\` — select properties\n- \`Omit<T, K>\` — exclude properties\n- \`Record<K, V>\` — key-value mapping`, type: 'text', duration: 40, order: 3, moduleId: tsMod1.id } }),
  ]);

  // --- Freelancing Modules ---
  const freeMod1 = await prisma.module.create({
    data: { title: 'Getting Started with Freelancing', description: 'Setting up your freelancing career', order: 1, courseId: freelancing.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Freelancing Landscape in Pakistan', description: 'Overview of freelancing opportunities', content: `# Freelancing Landscape in Pakistan\n\n## Why Freelancing?\n\nPakistan ranks **4th** globally on freelancing platforms with over 2 million active freelancers.\n\n## Top Platforms\n\n| Platform | Best For | Avg. Earnings |\n|----------|----------|---------------|\n| Upwork | Long-term projects | $20-50/hr |\n| Fiverr | Quick gigs | $5-500/project |\n| Freelancer.com | Competitions | Varies |\n| LinkedIn | Direct clients | $30-80/hr |\n\n## Popular Skills in Demand\n\n1. Web Development (React, Next.js)\n2. Mobile App Development\n3. Graphic Design & Video Editing\n4. Content Writing & SEO\n5. Data Science & AI\n\n## Getting Paid in Pakistan\n\n- **Payoneer** — Most popular\n- **JazzCash** — Local transfers\n- **Easypaisa** — Mobile wallet\n- **Bank Transfer** — Direct deposit\n\n> 💡 Start with smaller projects to build your rating, then increase your rates!`, type: 'text', duration: 25, order: 1, moduleId: freeMod1.id } }),
    prisma.lesson.create({ data: { title: 'Creating a Winning Profile', description: 'Profile optimization strategies', content: `# Creating a Winning Profile\n\n## Profile Photo\n- Professional headshot\n- Clean background\n- Friendly smile\n\n## Title & Overview\n\n**Bad**: "I do web development"\n**Good**: "Full-Stack React/Next.js Developer | 3+ Years | 50+ Projects"\n\n## Overview Formula\n\n1. **Hook**: Who you are and what you do\n2. **Value**: What problems you solve\n3. **Proof**: Results and testimonials\n4. **CTA**: Invite to contact\n\n## Portfolio Tips\n\n- Show 5-8 best projects\n- Include before/after screenshots\n- Add case studies with results\n- Link to live demos\n\n## Setting Your Rate\n\n| Experience | Hourly Rate (PKR) |\n|-----------|-------------------|\n| Beginner | 1,000 - 2,500 |\n| Intermediate | 2,500 - 5,000 |\n| Expert | 5,000 - 15,000 |`, type: 'text', duration: 20, order: 2, moduleId: freeMod1.id } }),
    prisma.lesson.create({ data: { title: 'Writing Proposals That Win', description: 'Proposal writing strategies', content: `# Writing Proposals That Win\n\n## The Winning Formula\n\n1. **Personalized greeting** — Use the client's name\n2. **Show understanding** — Repeat their problem in your words\n3. **Provide solution** — Brief outline of your approach\n4. **Share proof** — Relevant experience/examples\n5. **Clear timeline & budget** — Be specific\n6. **Call to action** — Suggest next steps\n\n## Common Mistakes\n\n❌ Generic copy-paste proposals\n❌ Focusing on yourself, not the client\n❌ Bidding too low or too high\n❌ Ignoring the job requirements\n\n## Proposal Template\n\n\`\`\`\nHi [Client Name],\n\nI understand you need [specific problem solved]. \nI've successfully completed [similar project] where I [result].\n\nMy approach:\n1. [Step 1]\n2. [Step 2]  \n3. [Step 3]\n\nTimeline: [X] days | Budget: [amount]\n\nLet's discuss further!\n\`\`\``, type: 'text', duration: 25, order: 3, moduleId: freeMod1.id } }),
  ]);

  // --- IELTS Academic Modules ---
  const ieltsAcadMod1 = await prisma.module.create({
    data: { title: 'Academic Writing Mastery', description: 'Band 7+ writing strategies', order: 1, courseId: ieltsAcademic.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Academic Writing Task 1 – Advanced', description: 'Complex chart and graph descriptions', content: `# Academic Writing Task 1 – Advanced\n\n## High-Scoring Structure\n\n### Introduction (1-2 sentences)\nParaphrase with sophisticated vocabulary.\n\n**Basic**: "The chart shows..."\n**Band 7+**: "The provided graphical representation illustrates..."\n\n### Overview (2-3 sentences)\nIdentify **2-3 main features**.\n\n**Key phrases**:\n- "A notable trend emerges..."\n- "What stands out is..."\n- "The most striking feature is..."\n\n### Details\nGroup data logically, compare and contrast.\n\n## Advanced Vocabulary\n\n| Basic | Band 7+ |\n|-------|--------|\n| goes up | experiences an upward trajectory |\n| goes down | undergoes a decline |\n| big | substantial / considerable |\n| small | negligible / marginal |\n| about | approximately |\n\n## Common Mistakes\n\n1. Including personal opinions\n2. Describing every data point\n3. Missing the overview\n4. Incorrect tense usage`, type: 'text', duration: 30, order: 1, moduleId: ieltsAcadMod1.id } }),
    prisma.lesson.create({ data: { title: 'Academic Writing Task 2 – Band 8 Templates', description: 'Essay templates for high scores', content: `# Academic Writing Task 2 – Band 8 Templates\n\n## Opinion Essay Template\n\n\`\`\`\n[Hook] It is widely debated whether [topic].\n\n[Thesis] I firmly believe that [position] because [reason 1] and [reason 2].\n\n[Body 1] The primary reason is [reason 1]. For instance, [example]. Consequently, [result].\n\n[Body 2] Furthermore, [reason 2]. A compelling illustration is [example]. This demonstrates that [conclusion].\n\n[Conclusion] In conclusion, [restate thesis]. [Final thought].\n\`\`\`\n\n## Cohesive Devices\n\n### Addition: furthermore, moreover, in addition\n### Contrast: nevertheless, conversely, notwithstanding\n### Cause/Effect: consequently, thereby, hence\n### Example: for instance, to illustrate, a case in point\n\n## Band 8 Checklist\n\n- [ ] Clear position throughout\n- [ ] Well-developed paragraphs\n- [ ] Range of complex structures\n- [ ] Appropriate academic vocabulary\n- [ ] No repetition of ideas\n- [ ] Clear paragraphing`, type: 'text', duration: 35, order: 2, moduleId: ieltsAcadMod1.id } }),
  ]);

  // --- Canva Design Modules ---
  const canvaMod1 = await prisma.module.create({
    data: { title: 'Getting Started with Canva', description: 'Canva basics and first designs', order: 1, courseId: canvaDesign.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Canva Interface & Templates', description: 'Navigating Canva and using templates', content: `# Canva Interface & Templates\n\n## Getting Started\n\n1. Sign up at canva.com (free account)\n2. Choose a design type\n3. Browse templates or start from scratch\n\n## Design Types\n\n| Type | Size (px) |\n|------|-----------|\n| Instagram Post | 1080 × 1080 |\n| Instagram Story | 1080 × 1920 |\n| YouTube Thumbnail | 1280 × 720 |\n| Facebook Cover | 820 × 312 |\n| Presentation | 1920 × 1080 |\n\n## Template Tips\n\n- Search by keyword ("education", "sale", "birthday")\n- Filter by color, style, or price\n- Customize everything — colors, fonts, images\n- Save your brand colors and fonts\n\n## Key Tools\n\n- **Text**: Add headings, subheadings, body text\n- **Elements**: Shapes, lines, graphics, photos\n- **Uploads**: Your own images and logos\n- **Background**: Solid colors, gradients, images`, type: 'text', duration: 20, order: 1, moduleId: canvaMod1.id } }),
    prisma.lesson.create({ data: { title: 'Design Principles for Non-Designers', description: 'Basic design rules anyone can follow', content: `# Design Principles for Non-Designers\n\n## 4 Key Principles (CRAP)\n\n### 1. Contrast\nMake important elements stand out.\n- Big vs small\n- Bold vs light\n- Dark vs light colors\n\n### 2. Repetition\nRepeat design elements for consistency.\n- Same fonts throughout\n- Consistent color scheme\n- Matching icon style\n\n### 3. Alignment\nEverything should align to something.\n- Left-align text for reading\n- Use grid lines in Canva\n- Keep margins consistent\n\n### 4. Proximity\nGroup related items together.\n- Title + subtitle close\n- Contact info grouped\n- Price + features together\n\n## Color Tips\n\n- Use 2-3 colors maximum\n- 60% primary, 30% secondary, 10% accent\n- Check contrast for readability\n\n## Font Tips\n\n- Maximum 2 fonts per design\n- Pair serif with sans-serif\n- Ensure readability at small sizes`, type: 'text', duration: 20, order: 2, moduleId: canvaMod1.id } }),
  ]);

  // --- HTML & CSS Modules ---
  const htmlCssMod1 = await prisma.module.create({
    data: { title: 'HTML Foundations', description: 'Learning HTML structure and elements', order: 1, courseId: htmlCss.id },
  });
  const htmlCssMod2 = await prisma.module.create({
    data: { title: 'CSS Styling & Layouts', description: 'Styling web pages with CSS', order: 2, courseId: htmlCss.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'HTML Structure & Elements', description: 'Basic HTML document structure', content: `# HTML Structure & Elements\n\n## Basic Document\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My First Website</title>\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>This is my first website.</p>\n</body>\n</html>\n\`\`\`\n\n## Common Elements\n\n| Element | Purpose |\n|---------|---------|\n| \`<h1>-<h6>\` | Headings |\n| \`<p>\` | Paragraphs |\n| \`<a href="">\` | Links |\n| \`<img src="" alt="">\` | Images |\n| \`<ul>/<ol>\` | Lists |\n| \`<div>\` | Container |\n| \`<section>\` | Section |\n\n## Forms\n\n\`\`\`html\n<form>\n  <label for="name">Name:</label>\n  <input type="text" id="name" required>\n  <button type="submit">Send</button>\n</form>\n\`\`\``, type: 'text', duration: 25, order: 1, moduleId: htmlCssMod1.id } }),
    prisma.lesson.create({ data: { title: 'CSS Selectors & Box Model', description: 'Styling elements with CSS', content: `# CSS Selectors & Box Model\n\n## Three Ways to Add CSS\n\n1. **Inline**: \`<p style="color: red;">\`\n2. **Internal**: \`<style>\` in \`<head>\`\n3. **External**: \`<link rel="stylesheet" href="style.css">\` ← Best!\n\n## Selectors\n\n\`\`\`css\n/* Element */\np { color: #333; }\n\n/* Class */\n.card { padding: 16px; }\n\n/* ID */\n#header { background: teal; }\n\n/* Descendant */\n.card p { font-size: 14px; }\n\`\`\`\n\n## Box Model\n\n\`\`\`\n┌──────────────────────────┐\n│        Margin            │\n│  ┌────────────────────┐  │\n│  │      Border        │  │\n│  │  ┌──────────────┐  │  │\n│  │  │   Padding    │  │  │\n│  │  │  ┌────────┐  │  │  │\n│  │  │  │Content │  │  │  │\n│  │  │  └────────┘  │  │  │\n│  │  └──────────────┘  │  │\n│  └────────────────────┘  │\n└──────────────────────────┘\n\`\`\`\n\n\`\`\`css\n.box {\n  width: 200px;\n  padding: 20px;\n  border: 2px solid #333;\n  margin: 10px;\n}\n\`\`\``, type: 'text', duration: 30, order: 1, moduleId: htmlCssMod2.id } }),
    prisma.lesson.create({ data: { title: 'Flexbox & Grid Layouts', description: 'Modern CSS layout techniques', content: `# Flexbox & Grid Layouts\n\n## Flexbox\n\nPerfect for **one-dimensional** layouts (row or column).\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: center; /* horizontal */\n  align-items: center;     /* vertical */\n  gap: 16px;\n}\n\`\`\`\n\n### Common Properties\n- \`flex-direction\`: row | column\n- \`justify-content\`: flex-start | center | space-between\n- \`align-items\`: stretch | center | flex-end\n- \`flex-wrap\`: nowrap | wrap\n\n## CSS Grid\n\nPerfect for **two-dimensional** layouts.\n\n\`\`\`css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n}\n\`\`\`\n\n### Responsive Grid\n\n\`\`\`css\n.grid {\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n}\n\`\`\`\n\n> 💡 Rule of thumb: Flexbox for components, Grid for page layouts!`, type: 'text', duration: 25, order: 2, moduleId: htmlCssMod2.id } }),
  ]);

  // --- Excel Modules ---
  const excelMod1 = await prisma.module.create({
    data: { title: 'Excel Essentials', description: 'Core Excel skills for professionals', order: 1, courseId: excel.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Formulas & Functions', description: 'Essential Excel formulas', content: `# Excel Formulas & Functions\n\n## Basic Formulas\n\n\`\`\`\n=SUM(A1:A10)       → Add values\n=AVERAGE(A1:A10)   → Average\n=COUNT(A1:A10)     → Count numbers\n=MAX(A1:A10)       → Largest value\n=MIN(A1:A10)       → Smallest value\n\`\`\`\n\n## VLOOKUP\n\n\`\`\`\n=VLOOKUP(lookup_value, table_range, column_index, FALSE)\n\`\`\`\n\nExample: Find a student's grade by roll number.\n\n| Roll | Name | Grade |\n|------|------|-------|\n| 101 | Ahmed | A |\n| 102 | Sara | B |\n\n\`=VLOOKUP(101, A1:C3, 3, FALSE)\` → "A"\n\n## IF Function\n\n\`\`\`\n=IF(score >= 90, "A", IF(score >= 80, "B", "C"))\n\`\`\`\n\n## COUNTIF & SUMIF\n\n\`\`\`\n=COUNTIF(range, criteria)   → Count matching cells\n=SUMIF(range, criteria, sum_range) → Sum matching cells\n\`\`\`\n\n> 💡 Use XLOOKUP instead of VLOOKUP in newer Excel versions!`, type: 'text', duration: 25, order: 1, moduleId: excelMod1.id } }),
    prisma.lesson.create({ data: { title: 'Pivot Tables & Charts', description: 'Data analysis and visualization', content: `# Pivot Tables & Charts\n\n## Creating a Pivot Table\n\n1. Select your data range\n2. Insert → Pivot Table\n3. Drag fields to areas:\n   - **Rows**: Categories to group by\n   - **Columns**: Sub-categories\n   - **Values**: Numbers to calculate\n   - **Filters**: Optional filtering\n\n## Example\n\n**Data**: Sales records with Date, Product, Region, Amount\n\n**Pivot**:\n- Rows: Product\n- Columns: Region\n- Values: Sum of Amount\n\n## Charts\n\n### Creating Charts\n1. Select data\n2. Insert → Chart\n3. Choose type and customize\n\n### Best Chart Types\n\n| Data Type | Chart |\n|-----------|-------|\n| Comparison | Bar/Column |\n| Trend | Line |\n| Proportion | Pie/Donut |\n| Distribution | Histogram |\n| Relationship | Scatter |\n\n## Tips\n- Keep charts simple\n- Use consistent colors\n- Always label axes\n- Add data labels for clarity`, type: 'text', duration: 20, order: 2, moduleId: excelMod1.id } }),
  ]);

  // --- Public Speaking Modules ---
  const speakingMod1 = await prisma.module.create({
    data: { title: 'Overcoming Fear & Building Confidence', description: 'Conquering stage fright', order: 1, courseId: publicSpeaking.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Understanding Stage Fright', description: 'Why we fear public speaking and how to manage it', content: `# Understanding Stage Fright\n\n## The Fear Response\n\nGlossophobia (fear of public speaking) affects **75%** of people.\n\n### Physical Symptoms\n- Racing heart\n- Sweaty palms\n- Shaking voice\n- Dry mouth\n- Butterflies in stomach\n\n### Why It Happens\n\nYour brain perceives the audience as a "threat" — it's the fight-or-flight response.\n\n## Management Techniques\n\n### Before Speaking\n1. **Practice aloud** at least 5 times\n2. **Visit the venue** beforehand\n3. **Deep breathing**: 4-7-8 technique\n4. **Power pose** for 2 minutes\n5. **Positive visualization**\n\n### During Speaking\n1. **Pause** before starting\n2. **Make eye contact** with friendly faces\n3. **Speak slowly** — you're faster than you think\n4. **Use notes**, don't memorize\n5. **Accept mistakes** — keep going\n\n> 💡 Nervousness and excitement produce the same physical response. Tell yourself: "I'm excited!" not "I'm nervous!"`, type: 'text', duration: 15, order: 1, moduleId: speakingMod1.id } }),
    prisma.lesson.create({ data: { title: 'The Power of Storytelling', description: 'Using stories to engage your audience', content: `# The Power of Storytelling\n\n## Why Stories Work\n\nStories activate multiple areas of the brain:\n- **Motor cortex**: "He grabbed the..."\n- **Sensory cortex**: "The smell of..."\n- **Frontal cortex**: Understanding meaning\n\nFacts activate only 2 brain areas. Stories activate 7+.\n\n## The Story Arc\n\n\`\`\`\n         ╱╲  Climax\n        ╱  ╲\n       ╱    ╲\n      ╱      ╲  Falling Action\n     ╱        ╲\n    ╱          ╲\n───╱            ╲───\nExposition    Resolution\n\`\`\`\n\n## Storytelling Framework\n\n1. **Hook**: Start with a surprising fact or question\n2. **Character**: Introduce someone relatable\n3. **Conflict**: Present the challenge\n4. **Resolution**: Show the outcome\n5. **Takeaway**: Connect to your message\n\n## Tips\n- Use specific details (not "a city" but "Lahore in July")\n- Include dialogue\n- Show, don't tell\n- Keep it under 2 minutes`, type: 'text', duration: 20, order: 2, moduleId: speakingMod1.id } }),
  ]);

  // --- React & Next.js Modules ---
  const reactMod1 = await prisma.module.create({
    data: { title: 'React Fundamentals', description: 'Core React concepts', order: 1, courseId: reactNextjs.id },
  });
  const reactMod2 = await prisma.module.create({
    data: { title: 'Next.js App Router', description: 'Building with Next.js', order: 2, courseId: reactNextjs.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Components & JSX', description: 'Building blocks of React', content: `# Components & JSX\n\n## What is React?\n\nReact is a **JavaScript library** for building user interfaces with reusable components.\n\n## Your First Component\n\n\`\`\`typescript\n// Greeting.tsx\ninterface GreetingProps {\n  name: string;\n}\n\nexport default function Greeting({ name }: GreetingProps) {\n  return <h1>Hello, {name}!</h1>;\n}\n\`\`\`\n\n## JSX Rules\n\n1. Return a **single root element**\n2. Use \`className\` instead of \`class\`\n3. Self-closing tags: \`<img />\`\n4. Expressions in curly braces: \`{variable}\`\n\n## Composing Components\n\n\`\`\`typescript\nexport default function App() {\n  return (\n    <div>\n      <Greeting name="Ahmed" />\n      <Greeting name="Sara" />\n    </div>\n  );\n}\n\`\`\`\n\n> 💡 Think of components as LEGO blocks — small, reusable pieces that combine into complex UIs.`, type: 'text', duration: 30, order: 1, moduleId: reactMod1.id } }),
    prisma.lesson.create({ data: { title: 'useState & useEffect', description: 'React hooks for state and side effects', content: `# useState & useEffect\n\n## useState — Managing State\n\n\`\`\`typescript\nimport { useState } from 'react';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}\n\`\`\`\n\n## useEffect — Side Effects\n\n\`\`\`typescript\nimport { useState, useEffect } from 'react';\n\nexport default function UserProfile({ userId }: { userId: string }) {\n  const [user, setUser] = useState(null);\n  \n  useEffect(() => {\n    fetch(\`/api/users/\${userId}\`)\n      .then(res => res.json())\n      .then(data => setUser(data));\n  }, [userId]); // runs when userId changes\n  \n  return <div>{user?.name}</div>;\n}\n\`\`\`\n\n## Effect Dependencies\n\n| Dependency | Behavior |\n|-----------|----------|\n| \`[]\` | Runs once on mount |\n| \`[dep]\` | Runs when dep changes |\n| No array | Runs every render |\n\n> ⚠️ Always include all used variables in the dependency array!`, type: 'text', duration: 35, order: 2, moduleId: reactMod1.id } }),
    prisma.lesson.create({ data: { title: 'Next.js App Router & Server Components', description: 'File-based routing and RSC', content: `# Next.js App Router & Server Components\n\n## File-Based Routing\n\n\`\`\`\napp/\n├── page.tsx          → /\n├── about/\n│   └── page.tsx      → /about\n├── courses/\n│   ├── page.tsx      → /courses\n│   └── [id]/\n│       └── page.tsx  → /courses/:id\n└── layout.tsx        → Shared layout\n\`\`\`\n\n## Server Components (Default)\n\n\`\`\`typescript\n// app/courses/page.tsx (Server Component)\nimport { db } from '@/lib/db';\n\nexport default async function CoursesPage() {\n  const courses = await db.course.findMany();\n  \n  return (\n    <div>\n      {courses.map(course => (\n        <CourseCard key={course.id} course={course} />\n      ))}\n    </div>\n  );\n}\n\`\`\`\n\n## Client Components\n\n\`\`\`typescript\n'use client'; // Required for interactivity\n\nimport { useState } from 'react';\n\nexport default function SearchBar() {\n  const [query, setQuery] = useState('');\n  return <input value={query} onChange={e => setQuery(e.target.value)} />;\n}\n\`\`\`\n\n> 💡 Use Server Components for data fetching, Client Components for interactivity!`, type: 'text', duration: 40, order: 1, moduleId: reactMod2.id } }),
  ]);

  // --- FSc Biology Modules ---
  const bioMod1 = await prisma.module.create({
    data: { title: 'Introduction & Cell Biology', description: 'Basics of life and cell structure', order: 1, courseId: fscBiology.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'Introduction to Biology', description: 'What is biology and why it matters', content: `# Introduction to Biology\n\n## What is Biology?\n\nBiology is the **scientific study of life** — from molecules to ecosystems.\n\n## Branches of Biology\n\n| Branch | Studies |\n|--------|---------|\n| Zoology | Animals |\n| Botany | Plants |\n| Microbiology | Microorganisms |\n| Genetics | Heredity & DNA |\n| Ecology | Ecosystems |\n| Anatomy | Body structure |\n| Physiology | Body functions |\n\n## Characteristics of Life\n\n1. **Organization** — Complex structure\n2. **Metabolism** — Chemical reactions\n3. **Growth** — Increase in size\n4. **Reproduction** — Producing offspring\n5. **Response to stimuli** — Reacting to environment\n6. **Homeostasis** — Maintaining balance\n7. **Evolution** — Change over generations\n\n## Scientific Method\n\n1. Observation → 2. Question → 3. Hypothesis → 4. Experiment → 5. Analysis → 6. Conclusion`, type: 'text', duration: 25, order: 1, moduleId: bioMod1.id } }),
    prisma.lesson.create({ data: { title: 'Cell Structure & Function', description: 'Prokaryotic and eukaryotic cells', content: `# Cell Structure & Function\n\n## Cell Theory\n\n1. All living things are made of cells\n2. Cell is the basic unit of life\n3. All cells come from pre-existing cells\n\n## Prokaryotic vs Eukaryotic\n\n| Feature | Prokaryotic | Eukaryotic |\n|---------|-------------|------------|\n| Nucleus | No | Yes |\n| Size | Small (1-5μm) | Larger (10-100μm) |\n| Organelles | Few | Many |\n| DNA | Circular | Linear |\n| Example | Bacteria | Animal/Plant |\n\n## Key Organelles\n\n### Nucleus\n- Control center of the cell\n- Contains DNA (genetic material)\n- Surrounded by nuclear membrane\n\n### Mitochondria\n- "Powerhouse of the cell"\n- Cellular respiration → ATP\n- Has own DNA\n\n### Ribosomes\n- Protein synthesis\n- Found on rough ER and free in cytoplasm\n\n### Endoplasmic Reticulum\n- **Rough ER**: Protein processing\n- **Smooth ER**: Lipid synthesis\n\n### Golgi Apparatus\n- Packaging and shipping proteins\n- Forms vesicles for transport`, type: 'text', duration: 35, order: 2, moduleId: bioMod1.id } }),
  ]);

  // --- Creative Writing Modules ---
  const writingMod1 = await prisma.module.create({
    data: { title: 'Finding Your Voice', description: 'Discovering your unique writing style', order: 1, courseId: creativeWriting.id },
  });
  await Promise.all([
    prisma.lesson.create({ data: { title: 'What Makes Good Writing?', description: 'Principles of effective creative writing', content: `# What Makes Good Writing?\n\n## The Three Pillars\n\n### 1. Clarity\nWrite so your reader understands on the first read.\n\n**Unclear**: "The thing that was done by him was good."\n**Clear**: "He did a great job."\n\n### 2. Voice\nYour unique way of expressing ideas.\n\n- Don't imitate — experiment\n- Read widely to absorb styles\n- Write like you speak (then edit)\n\n### 3. Revision\nWriting is rewriting.\n\n1. **First draft**: Get ideas down\n2. **Second draft**: Fix structure\n3. **Third draft**: Polish language\n4. **Final draft**: Read aloud\n\n## Writing Prompts\n\n1. Write about a memory from your childhood using all five senses\n2. Describe a place that scares you\n3. Write a letter to your future self\n4. Create a character who is the opposite of you\n5. Start with: "The door opened, and..."\n\n> ✒️ "There is nothing to writing. All you do is sit down at a typewriter and bleed." — Ernest Hemingway`, type: 'text', duration: 20, order: 1, moduleId: writingMod1.id } }),
    prisma.lesson.create({ data: { title: 'Fiction Writing Basics', description: 'Crafting characters and plots', content: `# Fiction Writing Basics\n\n## Character Development\n\n### Creating Characters\n1. **Physical description**: What do they look like?\n2. **Background**: Where are they from?\n3. **Motivation**: What do they want?\n4. **Flaw**: What holds them back?\n5. **Voice**: How do they speak?\n\n### Character Arc\n\n\`\`\`\nFlaw → Challenge → Growth → Change\n\`\`\`\n\nExample: A shy student → forced to present → discovers confidence → becomes a leader\n\n## Plot Structure\n\n### Three-Act Structure\n\n1. **Setup** (25%): Introduce world, characters, problem\n2. **Confrontation** (50%): Obstacles, conflicts, rising action\n3. **Resolution** (25%): Climax, solution, new normal\n\n## Show, Don't Tell\n\n**Telling**: "She was angry."\n**Showing**: "Her jaw tightened. She slammed the door shut, rattling the pictures on the wall."\n\n## Dialogue Tips\n\n- Each character should sound different\n- Use subtext (what they don't say)\n- Cut small talk — every line should reveal character or advance plot\n- Read dialogue aloud`, type: 'text', duration: 25, order: 2, moduleId: writingMod1.id } }),
  ]);

  // ==================== UPDATE ENROLLMENTS WITH STATUS ====================
  console.log('Updating enrollment statuses...');

  // Update existing enrollments with proper status
  await prisma.enrollment.update({
    where: { id: enrollment1.id },
    data: {
      status: 'active',
      lastAccessed: new Date(),
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollment2.id },
    data: {
      status: 'active',
      lastAccessed: new Date(Date.now() - 86400000), // yesterday
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollment3.id },
    data: {
      status: 'active',
      lastAccessed: new Date(Date.now() - 2 * 86400000), // 2 days ago
    },
  });

  // Add a 4th enrollment: completed O-Level Physics with certificate
  const enrollment4 = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: oLevelPhysics.id,
      progress: 100,
      status: 'completed',
      completedAt: new Date('2024-12-30'),
      lastAccessed: new Date('2024-12-30'),
    },
  });

  // Mark all O-Level Physics lessons as completed for this enrollment
  const oLevelPhysicsLessons = await prisma.lesson.findMany({
    where: { module: { courseId: oLevelPhysics.id } },
  });
  for (const lesson of oLevelPhysicsLessons) {
    await prisma.lessonProgress.create({
      data: {
        enrollmentId: enrollment4.id,
        lessonId: lesson.id,
        status: 'completed',
        timeSpent: lesson.duration * 60,
        completedAt: new Date('2024-12-30'),
        xpEarned: 25,
      },
    });
  }

  // Add a 5th enrollment: Web Dev (active, recently accessed)
  const enrollment5 = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: webDev.id,
      progress: 45,
      status: 'active',
      lastAccessed: new Date(Date.now() - 3 * 3600000), // 3 hours ago
    },
  });

  // Add a 6th enrollment: AWS Cloud (in-progress, 92% — almost certificate-ready)
  const enrollment6 = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: aws.id,
      progress: 92,
      status: 'active',
      lastAccessed: new Date(Date.now() - 1 * 86400000), // 1 day ago
    },
  });

  // ==================== CERTIFICATES ====================
  console.log('Creating certificates...');

  await prisma.certificate.create({
    data: {
      userId: student.id,
      courseId: oLevelPhysics.id,
      courseTitle: 'O-Level Physics – Complete Course',
      userName: 'Ahmed Khan',
      instructorName: 'Dr. Sara Malik',
      score: 88.5,
      certificateId: 'SHIJL-PHY-20241230-AK',
      verificationHash: '0xa3f7b2c1d4e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      templateType: 'completion',
    },
  });

  // Certificate for Git & GitHub for Beginners
  await prisma.certificate.create({
    data: {
      userId: student.id,
      courseId: gitCourse.id,
      courseTitle: 'Git & GitHub for Beginners',
      userName: 'Ahmed Khan',
      instructorName: 'Dr. Sara Malik',
      score: 92.0,
      certificateId: 'SHIJL-GIT-20250115-SA',
      verificationHash: '0xb4d8e2f6a1c3d5e7f9b0a2c4d6e8f0b2a4c6d8e0f1a3b5c7d9e1f3a5b7c9d0e2',
      templateType: 'completion',
    },
  });

  // Certificate for Python Programming – Zero to Hero (excellence for high score)
  await prisma.certificate.create({
    data: {
      userId: student.id,
      courseId: python.id,
      courseTitle: 'Python Programming – Zero to Hero',
      userName: 'Ahmed Khan',
      instructorName: 'Dr. Sara Malik',
      score: 96.5,
      certificateId: 'SHIJL-PY-20250210-EX',
      verificationHash: '0xc5e9f1a3b5d7c9e0f2a4b6d8c0e2f4a6b8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8',
      templateType: 'excellence',
    },
  });

  // ==================== WISHLIST ====================
  console.log('Creating wishlist entries...');

  await Promise.all([
    prisma.wishlist.create({
      data: { userId: student.id, courseId: dataScience.id },
    }),
    prisma.wishlist.create({
      data: { userId: student.id, courseId: djangoAPIs.id },
    }),
    prisma.wishlist.create({
      data: { userId: student.id, courseId: uiuxDesign.id },
    }),
    prisma.wishlist.create({
      data: { userId: student.id, courseId: mathematics.id },
    }),
    prisma.wishlist.create({
      data: { userId: student.id, courseId: gitCourse.id },
    }),
    prisma.wishlist.create({
      data: { userId: student.id, courseId: aLevelCS.id },
    }),
  ]);

  // ==================== PLATFORM STATS ====================
  console.log('Creating platform stats...');

  await prisma.platformStats.create({
    data: {
      totalUsers: 3,
      totalCourses: 12,
      totalEnrollments: 5,
      totalCertificates: 1,
      activeUsers: 2,
    },
  });

  console.log('✅ Seed data created successfully!');

  // ==================== NEW MODELS SEED DATA ====================
  console.log('Creating new model seed data...');

  // Instructor Profile
  await prisma.instructorProfile.create({
    data: {
      instructorId: instructor.id,
      headline: 'PhD Mathematics | FSc & A-Level Specialist',
      website: 'https://drsaramalik.com',
      linkedin: 'https://linkedin.com/in/drsaramalik',
      twitter: 'https://twitter.com/drsaramalik',
      youtube: 'https://youtube.com/@drsaramalik',
      expertise: JSON.stringify(['Mathematics', 'Physics', 'FSc', 'A-Levels', 'O-Levels']),
      languages: JSON.stringify([{ name: 'English', verified: true }, { name: 'Urdu', verified: true }]),
      ntn: '1234567-8',
      ntnVerified: true,
    },
  });

  // Instructor Settings
  await prisma.instructorSettings.create({
    data: {
      instructorId: instructor.id,
      notifyEnrollment: 'in-app',
      notifyQA: 'in-app',
      notifyReview: 'email',
      notifyAssignment: 'in-app',
      notifyMessage: 'in-app',
      notifyCourseApproved: 'email',
      notifyPayout: 'in-app',
      notifyPromotion: 'off',
      payoutSchedule: 'monthly',
      payoutThreshold: 2000,
      integrations: JSON.stringify({
        zoom: { connected: false },
        meet: { connected: false },
        mailchimp: { connected: false },
        zapier: { connected: false },
        webhooks: [],
      }),
    },
  });

  // Payout Method (Bank Transfer)
  await prisma.payoutMethod.create({
    data: {
      instructorId: instructor.id,
      type: 'bank_transfer',
      isDefault: true,
      isActive: true,
      bankName: 'Habib Bank Limited (HBL)',
      accountNumber: '****4523',
      accountHolder: 'Dr. Sara Malik',
      branchCode: '0123',
    },
  });

  // Transactions (Revenue)
  const txData = [
    { type: 'enrollment', amount: 3200, courseId: python.id, studentId: student.id, description: 'Enrollment - Python Programming' },
    { type: 'enrollment', amount: 2800, courseId: fscMath.id, studentId: student.id, description: 'Enrollment - FSc Mathematics' },
    { type: 'enrollment', amount: 3500, courseId: oLevelPhysics.id, studentId: student.id, description: 'Enrollment - O-Level Physics' },
    { type: 'enrollment', amount: 4200, courseId: ielts.id, studentId: student.id, description: 'Enrollment - IELTS Preparation' },
    { type: 'enrollment', amount: 2600, courseId: aLevelCS.id, studentId: student.id, description: 'Enrollment - A-Level CS' },
    { type: 'enrollment', amount: 2200, courseId: aws.id, studentId: student.id, description: 'Enrollment - AWS Cloud' },
    { type: 'refund', amount: -2800, courseId: fscMath.id, studentId: student.id, description: 'Refund - FSc Mathematics' },
    { type: 'payout', amount: -15000, instructorId: instructor.id, description: 'Monthly payout - January 2025' },
  ];

  for (const tx of txData) {
    await prisma.transaction.create({ data: tx });
  }

  // Payouts
  await prisma.payout.create({
    data: {
      instructorId: instructor.id,
      amount: 15000,
      currency: 'PKR',
      status: 'completed',
      method: 'bank_transfer',
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
      requestedAt: new Date('2025-02-01'),
      processedAt: new Date('2025-02-03'),
      completedAt: new Date('2025-02-05'),
    },
  });

  // Notifications
  const notifData = [
    { userId: instructor.id, type: 'enrollment', title: 'New Enrollment', content: 'Ahmed Khan enrolled in Python Programming', icon: '📚', courseId: python.id },
    { userId: instructor.id, type: 'qa', title: 'New Question', content: 'A student asked about recursion in Python', icon: '❓', courseId: python.id },
    { userId: instructor.id, type: 'review', title: 'New Review', content: 'Your course received a 5-star review', icon: '⭐', courseId: oLevelPhysics.id },
    { userId: instructor.id, type: 'payout', title: 'Payout Processed', content: 'PKR 15,000 payout has been processed to HBL ****4523', icon: '💰' },
    { userId: instructor.id, type: 'system', title: 'Platform Update', content: 'New AI tools are now available in your AI Tools Hub', icon: '🤖' },
  ];

  for (const n of notifData) {
    await prisma.notification.create({ data: n });
  }

  // Conversations & Messages
  const conv1 = await prisma.conversation.create({
    data: {
      type: 'direct',
      courseId: python.id,
      lastMessageAt: new Date(),
      lastMessageContent: 'Thank you, Dr. Malik! That really helped.',
    },
  });
  await prisma.conversationParticipant.create({ data: { conversationId: conv1.id, userId: instructor.id, role: 'admin' } });
  await prisma.conversationParticipant.create({ data: { conversationId: conv1.id, userId: student.id, role: 'member' } });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: student.id, content: 'Hi Dr. Malik, I have a question about the Python assignment.', type: 'text' } });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: instructor.id, content: 'Of course! What would you like to know?', type: 'text' } });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: student.id, content: 'How do I handle exceptions in file operations?', type: 'text' } });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: instructor.id, content: 'Great question! You can use try-except blocks. For example:\n\n```python\ntry:\n    with open("file.txt", "r") as f:\n        content = f.read()\nexcept FileNotFoundError:\n    print("File not found!")\nexcept Exception as e:\n    print(f"Error: {e}")\n```', type: 'text' } });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: student.id, content: 'Thank you, Dr. Malik! That really helped.', type: 'text' } });

  // Live Sessions
  await prisma.liveSession.create({
    data: {
      title: 'Python Live Q&A Session',
      description: 'Open Q&A for Python Programming students',
      courseId: python.id,
      instructorId: instructor.id,
      type: 'qa_session',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 60,
      status: 'scheduled',
      maxAttendees: 50,
    },
  });
  await prisma.liveSession.create({
    data: {
      title: 'FSc Math - Matrices Workshop',
      description: 'Hands-on workshop on Matrix Operations',
      courseId: fscMath.id,
      instructorId: instructor.id,
      type: 'workshop',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      duration: 90,
      status: 'scheduled',
      maxAttendees: 30,
    },
  });
  await prisma.liveSession.create({
    data: {
      title: 'O-Level Physics Office Hours',
      description: 'Drop-in office hours for physics questions',
      courseId: oLevelPhysics.id,
      instructorId: instructor.id,
      type: 'office_hours',
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      duration: 45,
      status: 'completed',
    },
  });

  // ==================== COMMUNITY DATA ====================
  console.log('Creating community data...');

  // Additional students for community
  const communityStudents = await Promise.all([
    prisma.user.create({ data: { email: 'ahmad.raza@shijlai.com', name: 'Ahmad Raza', role: 'student', xp: 6200, level: 18, shijlCoins: 1500, streak: 30, longestStreak: 45, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'fatima.sheikh@shijlai.com', name: 'Fatima Sheikh', role: 'student', xp: 5980, level: 17, shijlCoins: 1400, streak: 28, longestStreak: 40, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'bilal.khan@shijlai.com', name: 'Bilal Khan', role: 'student', xp: 5710, level: 16, shijlCoins: 1300, streak: 25, longestStreak: 35, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'ali.hassan@shijlai.com', name: 'Ali Hassan', role: 'student', xp: 5400, level: 15, shijlCoins: 1200, streak: 20, longestStreak: 30, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'zara.h@shijlai.com', name: 'Zara H.', role: 'student', xp: 5100, level: 14, shijlCoins: 1100, streak: 18, longestStreak: 25, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'usman.khan@shijlai.com', name: 'Usman Khan', role: 'student', xp: 4800, level: 13, shijlCoins: 1000, streak: 15, longestStreak: 22, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'sara.ahmed@shijlai.com', name: 'Sara Ahmed', role: 'student', xp: 4820, level: 13, shijlCoins: 980, streak: 12, longestStreak: 18, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'hassan.ali@shijlai.com', name: 'Hassan Ali', role: 'student', xp: 4500, level: 12, shijlCoins: 900, streak: 10, longestStreak: 15, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'aisha.noor@shijlai.com', name: 'Aisha Noor', role: 'student', xp: 4200, level: 11, shijlCoins: 850, streak: 8, longestStreak: 12, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
    prisma.user.create({ data: { email: 'omar.farooq@shijlai.com', name: 'Omar Farooq', role: 'student', xp: 3900, level: 10, shijlCoins: 780, streak: 7, longestStreak: 10, passwordHash: 'h_pnskfj_7', isVerified: true, authProvider: 'email' } }),
  ]);

  // Update student XP to match wireframe
  await prisma.user.update({ where: { id: student.id }, data: { xp: 4820 } });

  // Discussion Posts
  const now = new Date();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  const pinnedPost = await prisma.discussionPost.create({
    data: {
      courseId: python.id,
      userId: instructor.id,
      title: 'Welcome & Course Rules',
      content: 'Welcome to the Python Programming discussion board! 🎉\n\nPlease follow these rules:\n1. Be respectful to all members\n2. No sharing of assignment solutions\n3. Ask questions before giving up\n4. Help others when you can\n5. Use code blocks for sharing code\n\nHappy learning!',
      isPinned: true,
      upvotes: 42,
      replyCount: 5,
      lessonContext: 'General',
      createdAt: new Date(now.getTime() - 30 * dayMs),
    },
  });

  const post2 = await prisma.discussionPost.create({
    data: {
      courseId: python.id,
      userId: communityStudents[3].id, // Ali Hassan
      title: 'Why do we need closures when we have global variables?',
      content: 'I just learned about closures and I don\'t understand why we need them. Can\'t we just use global variables? What\'s the advantage of closures over globals?',
      upvotes: 24,
      replyCount: 8,
      lessonId: null,
      lessonContext: 'Lesson 3.2',
      createdAt: new Date(now.getTime() - 2 * hourMs),
    },
  });

  const post3 = await prisma.discussionPost.create({
    data: {
      courseId: python.id,
      userId: communityStudents[4].id, // Zara H.
      title: 'Sharing my calculator project — feedback welcome!',
      content: 'Hi everyone! I just finished the Section 2 calculator project. I added some extra features like memory functions and percentage calculation. Would love your feedback!\n\n```python\ndef calculator():\n    # My implementation\n    pass\n```',
      upvotes: 11,
      replyCount: 3,
      lessonContext: 'Section 2 Project',
      createdAt: new Date(now.getTime() - 5 * hourMs),
    },
  });

  const post4 = await prisma.discussionPost.create({
    data: {
      courseId: python.id,
      userId: communityStudents[0].id, // Ahmad Raza
      title: 'List comprehension vs traditional loops — which is faster?',
      content: 'I\'ve been using list comprehensions because they look cleaner, but are they actually faster than traditional for loops? I ran some benchmarks and was surprised by the results.',
      upvotes: 18,
      replyCount: 6,
      lessonContext: 'Lesson 4.1',
      createdAt: new Date(now.getTime() - 8 * hourMs),
    },
  });

  const post5 = await prisma.discussionPost.create({
    data: {
      courseId: fscMath.id,
      userId: communityStudents[1].id, // Fatima Sheikh
      title: 'Need help with matrix multiplication — exam tomorrow!',
      content: 'I\'m stuck on 3x3 matrix multiplication. Can someone walk me through an example step by step? My board exam is tomorrow and I keep making calculation errors.',
      upvotes: 15,
      replyCount: 4,
      lessonContext: 'Module 3 - Matrices',
      createdAt: new Date(now.getTime() - 1 * hourMs),
    },
  });

  // Discussion Replies
  await Promise.all([
    prisma.discussionReply.create({
      data: {
        postId: post2.id,
        userId: communityStudents[0].id,
        content: 'Great question! Closures are better because they avoid polluting the global namespace. With globals, any part of your code can accidentally modify the variable. Closures keep data private and encapsulated.',
        upvotes: 12,
        createdAt: new Date(now.getTime() - 1.5 * hourMs),
      },
    }),
    prisma.discussionReply.create({
      data: {
        postId: post2.id,
        userId: instructor.id,
        content: 'Think of it this way: global variables are like leaving your belongings in a public park — anyone can take or modify them. Closures are like having a private locker — only the function that owns it can access the contents. This is called **data encapsulation** and it\'s a fundamental concept in programming.',
        upvotes: 20,
        createdAt: new Date(now.getTime() - 1 * hourMs),
      },
    }),
    prisma.discussionReply.create({
      data: {
        postId: post3.id,
        userId: communityStudents[2].id,
        content: 'This looks really clean! I love the memory function. One suggestion: maybe add error handling for division by zero?',
        upvotes: 5,
        createdAt: new Date(now.getTime() - 4 * hourMs),
      },
    }),
  ]);

  // Study Groups
  const pythonGroup = await prisma.studyGroup.create({
    data: {
      name: 'Python Learners Pakistan',
      description: 'Daily challenges, code sharing, pair programming',
      emoji: '🐍',
      courseId: python.id,
      createdById: communityStudents[0].id,
      isActive: true,
      memberCount: 482,
      maxMembers: 500,
    },
  });

  const webDevGroup = await prisma.studyGroup.create({
    data: {
      name: 'Web Dev Study Circle',
      description: 'Weekly project reviews every Sunday 8PM',
      emoji: '🌐',
      courseId: null,
      createdById: communityStudents[2].id,
      isActive: true,
      memberCount: 234,
      maxMembers: 300,
    },
  });

  const fscGroup = await prisma.studyGroup.create({
    data: {
      name: 'FSc Board Exam Prep',
      description: 'Past papers, tips, and study schedules for FSc students',
      emoji: '📐',
      courseId: fscMath.id,
      createdById: communityStudents[1].id,
      isActive: true,
      memberCount: 356,
      maxMembers: 400,
    },
  });

  const ieltsGroup = await prisma.studyGroup.create({
    data: {
      name: 'IELTS Band 7+ Club',
      description: 'Speaking practice, writing reviews, mock tests',
      emoji: '🎯',
      courseId: ielts.id,
      createdById: communityStudents[5].id,
      isActive: true,
      memberCount: 178,
      maxMembers: 200,
    },
  });

  // Study Group Members — student is member of Python group, not WebDev group
  await Promise.all([
    prisma.studyGroupMember.create({ data: { groupId: pythonGroup.id, userId: student.id, role: 'member' } }),
    prisma.studyGroupMember.create({ data: { groupId: pythonGroup.id, userId: communityStudents[0].id, role: 'admin' } }),
    prisma.studyGroupMember.create({ data: { groupId: pythonGroup.id, userId: communityStudents[1].id, role: 'member' } }),
    prisma.studyGroupMember.create({ data: { groupId: pythonGroup.id, userId: communityStudents[2].id, role: 'member' } }),
    prisma.studyGroupMember.create({ data: { groupId: webDevGroup.id, userId: communityStudents[2].id, role: 'admin' } }),
    prisma.studyGroupMember.create({ data: { groupId: webDevGroup.id, userId: communityStudents[3].id, role: 'member' } }),
    prisma.studyGroupMember.create({ data: { groupId: fscGroup.id, userId: communityStudents[1].id, role: 'admin' } }),
    prisma.studyGroupMember.create({ data: { groupId: fscGroup.id, userId: student.id, role: 'member' } }),
    prisma.studyGroupMember.create({ data: { groupId: ieltsGroup.id, userId: communityStudents[5].id, role: 'admin' } }),
    prisma.studyGroupMember.create({ data: { groupId: ieltsGroup.id, userId: communityStudents[4].id, role: 'member' } }),
  ]);

  // Daily Activity for leaderboard time filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - dayMs).toISOString().split('T')[0];

  await Promise.all([
    // This week activities
    prisma.dailyActivity.create({ data: { userId: communityStudents[0].id, date: todayStr, xpEarned: 150, lessonsCompleted: 2, quizzesTaken: 1, timeSpent: 3600 } }),
    prisma.dailyActivity.create({ data: { userId: communityStudents[0].id, date: yesterdayStr, xpEarned: 200, lessonsCompleted: 3, quizzesTaken: 0, timeSpent: 5400 } }),
    prisma.dailyActivity.create({ data: { userId: communityStudents[1].id, date: todayStr, xpEarned: 180, lessonsCompleted: 2, quizzesTaken: 1, timeSpent: 4200 } }),
    prisma.dailyActivity.create({ data: { userId: communityStudents[2].id, date: todayStr, xpEarned: 120, lessonsCompleted: 1, quizzesTaken: 2, timeSpent: 3000 } }),
    prisma.dailyActivity.create({ data: { userId: communityStudents[3].id, date: yesterdayStr, xpEarned: 160, lessonsCompleted: 2, quizzesTaken: 1, timeSpent: 4800 } }),
  ]);

  // Assignments for peer review
  const pythonAssignment = await prisma.assignment.create({
    data: {
      title: 'Section 2 Assignment — Calculator App',
      description: 'Build a calculator application in Python',
      instructions: 'Create a calculator that supports basic arithmetic operations (+, -, *, /) and at least 2 advanced features.',
      type: 'peer-review',
      courseId: python.id,
      maxScore: 100,
      dueDate: new Date(now.getTime() + 7 * dayMs),
      submissionType: 'text',
      isPublished: true,
    },
  });

  // Submissions for peer review
  const usmanSubmission = await prisma.submission.create({
    data: {
      assignmentId: pythonAssignment.id,
      studentId: communityStudents[5].id, // Usman Khan
      content: 'My calculator implementation with add, subtract, multiply, divide and percentage features. Code: ```python def calc(a, op, b): ... ```',
      status: 'submitted',
      score: null,
    },
  });

  // Peer Review — pending, assigned to student
  const peerReviewAssignment = await prisma.peerReview.create({
    data: {
      assignmentId: pythonAssignment.id,
      submissionId: usmanSubmission.id,
      reviewerId: student.id,
      revieweeId: communityStudents[5].id,
      status: 'pending',
      xpAwarded: 0,
    },
  });

  console.log('✅ Community seed data created!');

  // ==================== ACTIVITY LOGS ====================
  console.log('Creating activity logs...');
  
  const _now = new Date();
  const minsAgo = (m: number) => new Date(_now.getTime() - m * 60 * 1000);
  const hrsAgo = (h: number) => new Date(_now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(_now.getTime() - d * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.activityLog.create({ data: { userId: instructor.id, type: 'course_published', title: 'published "Advanced Django APIs"', icon: '🟢', createdAt: minsAgo(2) } }),
    prisma.activityLog.create({ data: { userId: student.id, type: 'refund_requested', title: 'requested refund for "Data Science 101"', icon: '🔴', description: 'Reason: Course content not as expected', createdAt: minsAgo(14) } }),
    prisma.activityLog.create({ data: { type: 'post_flagged', title: 'Post flagged in Python Bootcamp community', icon: '⚠️', description: '3 users reported this post as spam', createdAt: minsAgo(22) } }),
    prisma.activityLog.create({ data: { type: 'instructor_applied', title: 'New instructor application: Kamran Siddiqui', icon: '🟢', description: 'Applied for: Web Development, React, Node.js', createdAt: hrsAgo(1) } }),
    prisma.activityLog.create({ data: { type: 'revenue_received', title: 'PKR 12,400 in new revenue', icon: '💰', description: 'From 8 new enrollments today', createdAt: daysAgo(0) } }),
    prisma.activityLog.create({ data: { type: 'security_alert', title: 'Unusual login attempt from unknown IP', icon: '🔒', description: 'IP: 192.168.1.xxx, Location: Unknown', createdAt: hrsAgo(3) } }),
    prisma.activityLog.create({ data: { type: 'payout_disputed', title: 'Instructor payout dispute raised', icon: '⚠️', description: 'Dr. Sara Malik disputes PKR 45,000 payout', createdAt: hrsAgo(5) } }),
    prisma.activityLog.create({ data: { userId: student.id, type: 'user_signup', title: 'signed up as a new student', icon: '🟢', createdAt: hrsAgo(8) } }),
    prisma.activityLog.create({ data: { type: 'course_review_pending', title: '3 courses submitted for review', icon: '📋', description: 'Python Advanced, React Pro, ML Basics awaiting approval', createdAt: hrsAgo(12) } }),
    prisma.activityLog.create({ data: { type: 'enrollment_created', title: '42 new enrollments today', icon: '📚', description: 'Top course: AWS Cloud Practitioner (+12)', createdAt: daysAgo(0) } }),
    prisma.activityLog.create({ data: { type: 'revenue_received', title: 'PKR 89,200 in weekly revenue', icon: '💰', description: '27% increase from last week', createdAt: daysAgo(1) } }),
    prisma.activityLog.create({ data: { type: 'course_published', title: '"Full-Stack Web Dev with React" published', icon: '🟢', createdAt: daysAgo(1) } }),
    prisma.activityLog.create({ data: { type: 'refund_requested', title: 'Refund request for "Machine Learning Basics"', icon: '🔴', description: 'PKR 2,999 refund requested', createdAt: daysAgo(2) } }),
    prisma.activityLog.create({ data: { type: 'instructor_applied', title: 'New instructor application: Fatima Noor', icon: '🟢', description: 'Applied for: IELTS, English Language', createdAt: daysAgo(2) } }),
    prisma.activityLog.create({ data: { type: 'post_flagged', title: '9 posts flagged in community forums', icon: '⚠️', description: 'Mostly spam in free course communities', createdAt: daysAgo(3) } }),
  ]);

  // ==================== ADDITIONAL DEMO USERS ====================
  console.log('Creating additional demo users...');
  
  const additionalStudentNames = [
    'Bilal Hussain', 'Zainab Ali', 'Hamza Raza', 'Ayesha Siddiqui',
    'Usman Ahmed', 'Mariam Khan', 'Hassan Malik', 'Sana Farooq',
    'Ali Raza', 'Hira Bashir', 'Tariq Mahmood', 'Nadia Iqbal',
  ];

  const additionalStudents = await Promise.all(
    additionalStudentNames.map((name, idx) =>
      prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(' ', '.')}@student.shijlai.com`,
          name,
          role: 'student',
          language: 'en',
          xp: 500 + idx * 150,
          level: 3 + Math.floor(idx / 3),
          shijlCoins: 100 + idx * 50,
          streak: idx + 1,
          longestStreak: idx + 5,
          passwordHash: 'h_pnskfj_7',
          isVerified: true,
          authProvider: 'email',
          createdAt: daysAgo(30 - idx * 2),
        },
      })
    )
  );

  const additionalInstructors = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ahmad.ali@shijlai.com',
        name: 'Ahmad Ali',
        role: 'instructor',
        language: 'en',
        xp: 8000,
        level: 20,
        shijlCoins: 5000,
        streak: 60,
        longestStreak: 90,
        passwordHash: 'h_pnskfj_7',
        isVerified: true,
        authProvider: 'email',
        createdAt: daysAgo(60),
      },
    }),
    prisma.user.create({
      data: {
        email: 'kamran.siddiqui@shijlai.com',
        name: 'Kamran Siddiqui',
        role: 'instructor',
        language: 'en',
        xp: 3000,
        level: 10,
        shijlCoins: 1500,
        streak: 15,
        longestStreak: 30,
        passwordHash: 'h_pnskfj_7',
        isVerified: true,
        authProvider: 'email',
        createdAt: daysAgo(45),
      },
    }),
  ]);

  // Additional courses with prices for revenue
  const additionalCourses = await Promise.all([
    prisma.course.create({
      data: { title: 'Complete Python Bootcamp 2025', description: 'Master Python from beginner to advanced', category: 'Programming', level: 'beginner', language: 'en', price: 2499, isPublished: true, enrollmentCount: 2341, rating: 4.9, estimatedDuration: 40, instructorId: additionalInstructors[0].id },
    }),
    prisma.course.create({
      data: { title: 'IELTS Preparation Complete', description: 'Complete IELTS preparation course', category: 'IELTS', level: 'intermediate', language: 'en', price: 1999, isPublished: true, enrollmentCount: 1892, rating: 4.8, estimatedDuration: 25, instructorId: instructor.id },
    }),
    prisma.course.create({
      data: { title: 'Full-Stack Web Dev with React', description: 'Build full-stack apps with React and Node.js', category: 'Programming', level: 'intermediate', language: 'en', price: 3499, isPublished: true, enrollmentCount: 1204, rating: 4.7, estimatedDuration: 50, instructorId: additionalInstructors[0].id },
    }),
    prisma.course.create({
      data: { title: 'Freelancing Masterclass', description: 'Start your freelancing career on Fiverr and Upwork', category: 'Business', level: 'beginner', language: 'en', price: 1499, isPublished: true, enrollmentCount: 1102, rating: 4.9, estimatedDuration: 15, instructorId: additionalInstructors[1].id },
    }),
    prisma.course.create({
      data: { title: 'Data Science 101', description: 'Introduction to data science with Python', category: 'Data Science', level: 'beginner', language: 'en', price: 2999, isPublished: true, enrollmentCount: 856, rating: 4.5, estimatedDuration: 30, instructorId: additionalInstructors[0].id },
    }),
    // Draft courses for "awaiting review"
    prisma.course.create({
      data: { title: 'Machine Learning with TensorFlow', description: 'Learn ML from scratch', category: 'AI/ML', level: 'advanced', language: 'en', price: 4999, isPublished: false, enrollmentCount: 0, rating: 0, estimatedDuration: 45, instructorId: additionalInstructors[0].id },
    }),
    prisma.course.create({
      data: { title: 'React Native Mobile Development', description: 'Build mobile apps', category: 'Programming', level: 'intermediate', language: 'en', price: 3499, isPublished: false, enrollmentCount: 0, rating: 0, estimatedDuration: 35, instructorId: additionalInstructors[1].id },
    }),
    prisma.course.create({
      data: { title: 'Digital Marketing Pro', description: 'Master digital marketing', category: 'Marketing', level: 'beginner', language: 'en', price: 1999, isPublished: false, enrollmentCount: 0, rating: 0, estimatedDuration: 20, instructorId: additionalInstructors[1].id },
    }),
  ]);

  // Transactions for revenue tracking
  await Promise.all([
    prisma.transaction.create({ data: { type: 'enrollment', amount: 2999, currency: 'PKR', status: 'completed', courseId: additionalCourses[0].id, studentId: student.id, instructorId: additionalInstructors[0].id } }),
    prisma.transaction.create({ data: { type: 'enrollment', amount: 1999, currency: 'PKR', status: 'completed', courseId: additionalCourses[1].id, studentId: additionalStudents[0].id, instructorId: instructor.id } }),
    prisma.transaction.create({ data: { type: 'refund', amount: 2999, currency: 'PKR', status: 'pending', courseId: additionalCourses[4].id, studentId: student.id, description: 'Course content not as expected' } }),
    prisma.transaction.create({ data: { type: 'payout', amount: 45000, currency: 'PKR', status: 'failed', instructorId: instructor.id, description: 'Bank transfer failed - invalid account' } }),
  ]);

  // Platform Stats
  await prisma.platformStats.create({
    data: {
      totalUsers: 48214,
      totalCourses: 312,
      totalEnrollments: 84120,
      totalCertificates: 15600,
      activeUsers: 3841,
    },
  });

  console.log('✅ Activity logs and additional demo data created!');

  console.log('✅ New model seed data created!');
  console.log({
    users: 3 + additionalStudentNames.length + additionalInstructors.length,
    courses: 22 + additionalCourses.length,
    badges: 8,
    quizzes: 6,
    enrollments: 6,
    activityLogs: 15,
  });
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
}

main()
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    try {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (_) {}
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
