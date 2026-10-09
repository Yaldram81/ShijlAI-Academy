# APPENDIX E — USER MANUAL

**ShijlAI Academy — An AI-Powered Personalised Learning Platform**

---

## E.1 Introduction

This appendix provides a comprehensive user manual for ShijlAI Academy, an AI-powered personalised learning platform developed as part of the present thesis. The manual is intended for three categories of end users — Students, Instructors, and Administrators — and describes, in procedural detail, the operations each user may perform within the system. All instructions are based on the implemented application and reflect the features available in the deployed build. Placeholder screenshots are indicated where visual reference would aid understanding.

ShijlAI Academy is a web-based platform accessible through a modern web browser. The system employs role-based access control, presenting each user with a dedicated portal and navigation structure appropriate to their authorisation level. Artificial intelligence capabilities are integrated throughout the platform, providing students with personalised tutoring, study planning, and interview preparation, while offering instructors and administrators AI-assisted content generation, analytics, and operational intelligence.

---

## E.2 System Requirements and Access

### E.2.1 Supported Browsers

ShijlAI Academy is a responsive web application. Users should access the platform through one of the following supported browsers:

- Google Chrome (version 90 or later)
- Mozilla Firefox (version 88 or later)
- Apple Safari (version 14 or later)
- Microsoft Edge (version 90 or later)

JavaScript must be enabled. The application supports both desktop and mobile viewports; the interface adapts automatically to screen dimensions.

### E.2.2 Internet Connection

A stable internet connection is required for all platform operations, including AI-powered features, which depend on server-side processing.

### E.2.3 Accessing the Platform

Users access ShijlAI Academy by navigating to the platform URL in a supported browser. No software installation is required. The initial landing page presents options to log in or register a new account.

---

## E.3 Authentication

### E.3.1 User Registration

New users may create an account by performing the following steps:

1. Navigate to the platform URL.
2. Select the **"Sign Up"** option from the landing page.
3. Complete the registration form with the following required fields:
   - **Full Name**: The user's complete name.
   - **Email Address**: A valid email address, which serves as the primary login identifier.
   - **Password**: A password meeting the platform's security requirements (minimum 8 characters).
4. Select the desired role:
   - **Student**: The default role for learners.
   - **Instructor**: For users who wish to create and manage courses. Instructor accounts may require administrative approval.
5. Accept the terms of service.
6. Click **"Create Account"** to submit the registration.

Upon successful registration, the user is authenticated and redirected to their role-specific dashboard.

*[Screenshot Placeholder: Registration form with fields for name, email, password, and role selection.]*

### E.3.2 User Login

Returning users authenticate by performing the following steps:

1. Navigate to the platform URL.
2. Select the **"Sign In"** option.
3. Enter the registered **email address**.
4. Enter the account **password**.
5. Click **"Sign In"** to authenticate.

Upon successful authentication, the user is redirected to their role-specific dashboard (Student Portal, Instructor Portal, or Admin Panel).

*[Screenshot Placeholder: Login form with email and password fields.]*

### E.3.3 Role Switching

Users with multiple roles associated with their account may switch between roles without logging out. The role-switching control is located in the **user profile dropdown menu** in the top-right corner of the header bar. Available roles are displayed with their corresponding icons (Student, Instructor, Admin). Selecting a different role reloads the interface with the appropriate portal.

### E.3.4 Logging Out

To log out:

1. Click the **user avatar** or **profile icon** in the top-right header area.
2. Select **"Logout"** from the dropdown menu.

Alternatively, the **Logout** button is available at the bottom of the sidebar navigation panel on all portals.

---

## E.4 Student User Guide

The Student Portal provides access to enrolled courses, AI-powered learning tools, gamification features, and personal academic management. Upon login, students are presented with the **Student Dashboard**.

### E.4.1 Dashboard Overview

The Student Dashboard serves as the primary landing page and presents a consolidated summary of the student's academic state. The dashboard includes:

- **Welcome Header**: Displays a personalised greeting with the student's name.
- **Statistics Cards**: A set of key performance indicators presented in a horizontal card layout:
  - **Enrolled Courses**: Total number of courses in which the student is enrolled.
  - **Completed Courses**: Total number of courses completed.
  - **XP Earned**: Total experience points accumulated through learning activities.
  - **Study Streak**: The number of consecutive days the student has engaged with the platform.
- **Progress Summary**: An overall progress bar and percentage indicating learning completion across all enrolled courses.
- **Gamification Indicators**: Displays the student's current level, XP towards the next level, badge count, and total achievements earned.
- **Upcoming Tasks**: A list of pending assignments, scheduled quizzes, or recommended activities.
- **Recent Activity**: A chronological log of recent learning actions (lessons completed, quizzes taken, AI sessions used).

*[Screenshot Placeholder: Student Dashboard showing statistics cards, progress summary, and gamification indicators.]*

### E.4.2 Navigation Structure

The Student Portal uses a sidebar navigation on desktop viewports and a bottom navigation bar on mobile devices. The sidebar can be collapsed or expanded using the chevron toggle. Navigation sections are organised as follows:

**LMS Section (Collapsible)**
| Menu Item     | Description                                |
|---------------|--------------------------------------------|
| Home          | Returns to the Student Dashboard           |
| My Learning   | Displays enrolled courses and progress     |
| Explore       | Browse and discover available courses      |
| Assignments   | View and submit course assignments         |
| Q&A           | Access course-specific question forums     |
| Schedule      | View upcoming events and study schedule    |

**AI & Features Section**
| Menu Item       | Description                                             |
|-----------------|---------------------------------------------------------|
| Ask ShijlAI     | Multi-mode AI tutor with five operational modes          |
| ShijlAI Hub     | Centralised hub for Study Planner, Mock Interview, and Learning Companion |
| AI Insights     | Personalised AI recommendations and learning profile    |
| Progress        | Achievements, badges, and gamification status           |
| My Skills       | Skill assessment and proficiency tracking               |
| Certificates    | View and download earned certificates                   |
| Community       | Social learning and peer interaction                    |

**Account Section**
| Menu Item      | Description                               |
|----------------|-------------------------------------------|
| Messages       | Direct messaging and inbox                |
| Notifications  | Platform notifications and alerts         |
| My Profile     | View and edit personal profile            |
| Settings       | Account and preference settings           |

### E.4.3 Course Enrolment and Discovery

#### E.4.3.1 Exploring Courses

1. Select **"Explore"** from the sidebar navigation.
2. Browse the course catalogue, which displays courses in card format with the following information:
   - Course title and thumbnail image
   - Instructor name
   - Course category and difficulty level
   - Rating and enrolment count
   - Price (or "Free" designation)
3. Use the search bar to filter courses by keyword.
4. Apply category, level, or pricing filters as needed.
5. Click on a course card to view the full course details page.

#### E.4.3.2 Enrolling in a Course

1. From the course details page, review the course description, curriculum outline, instructor information, and reviews.
2. Click **"Enrol Now"** (for free courses) or proceed through the payment flow (for paid courses).
3. Upon successful enrolment, the course appears in the **"My Learning"** section.

### E.4.4 My Learning

Select **"My Learning"** from the sidebar to access all enrolled courses. This view displays:

- A list of enrolled course cards, each showing:
  - Course title and thumbnail
  - Progress bar indicating percentage completion
  - Last-accessed date
  - Continue or Resume button
- Filtering options to display all, in-progress, or completed courses.

*[Screenshot Placeholder: My Learning view showing enrolled courses with progress bars.]*

### E.4.5 Course Player

The Course Player is the primary interface for consuming course content. It is accessed by clicking **"Continue"** or selecting a specific lesson from an enrolled course.

#### E.4.5.1 Layout

The Course Player consists of:

- **Main Content Area** (left/centre): Displays the lesson content, which may include:
  - **Video Player**: For video lessons, with play/pause, seek bar, volume control, playback speed (0.75×, 1×, 1.25×, 1.5×, 2×), fullscreen toggle, and captions toggle.
  - **Text/Article Content**: Rendered markdown content for text-based lessons.
  - **Quiz Interface**: Multiple-choice, true/false, or short-answer questions for quiz-type lessons.
  - **Assignment Submission**: A text editor for submitting assignment responses.
- **Course Sidebar** (right): A collapsible panel listing all course modules and lessons, with:
  - Module titles (collapsible sections)
  - Lesson titles with status icons (completed ✓, in-progress ▶, not started ○, locked 🔒)
  - Lesson type indicators (video, text, quiz, assignment, interactive, download)
  - Lesson duration estimates

#### E.4.5.2 Content Tabs

Below the main content area, a tabbed interface provides access to:

| Tab        | Description                                                        |
|------------|--------------------------------------------------------------------|
| Overview   | Lesson description, objectives, and instructor information         |
| Notes      | Personal note-taking area with auto-save, colour coding, and timestamp linking |
| Resources  | Downloadable files and supplementary materials attached to the lesson |
| Q&A        | Lesson-specific question and answer forum; users may post questions and view answers |
| Ask ShijlAI | In-lesson AI tutor for context-aware questions about the current lesson content |

#### E.4.5.3 Keyboard Shortcuts

The Course Player supports the following keyboard shortcuts:

| Shortcut       | Action                       |
|----------------|------------------------------|
| Space           | Play / Pause                 |
| → (Right Arrow) | Skip forward 10 seconds     |
| ← (Left Arrow)  | Skip backward 10 seconds    |
| Shift + →       | Next lesson                  |
| Shift + ←       | Previous lesson              |
| N               | Toggle notes panel           |
| ?               | Show keyboard shortcuts list |

#### E.4.5.4 Progress Tracking

Lesson progress is saved automatically at 30-second intervals during playback. When a lesson's video completes, the lesson is marked as **"Completed"**, and the overall course progress is updated. Progress tracking applies to all lesson types.

*[Screenshot Placeholder: Course Player showing video content, course sidebar with modules, and content tabs.]*

### E.4.6 Assignments

Select **"Assignments"** from the sidebar to view all assignments across enrolled courses. The assignments view displays:

- Assignment title and associated course
- Due date and status (pending, submitted, graded)
- Submission interface (text editor)

Students submit assignment responses through the Course Player's assignment tab or the dedicated Assignments view.

### E.4.7 Q&A Forums

Select **"Q&A"** from the sidebar to access question and answer forums. Students can:

- View questions grouped by course and lesson
- Post new questions
- Upvote existing questions
- View answers (including AI-generated answers)
- Expand individual questions to see full answer threads

### E.4.8 Schedule

Select **"Schedule"** from the sidebar to view a calendar-based overview of:

- Upcoming assignment due dates
- Scheduled live sessions
- Study plan activities (if created via the Study Planner)
- Recommended review sessions

---

## E.5 AI-Powered Features (Student)

ShijlAI Academy integrates multiple AI-powered features accessible to students. These features are organised into two primary access points: **Ask ShijlAI** (a multi-mode AI tutor) and the **ShijlAI Hub** (a centralised suite of AI learning tools).

### E.5.1 Ask ShijlAI — Multi-Mode AI Tutor

Access: Select **"Ask ShijlAI"** from the sidebar navigation.

Ask ShijlAI is a conversational AI assistant that operates in five distinct modes, each designed for a specific pedagogical purpose. Users interact with the AI through a chat-based interface and may switch between modes at any time.

#### E.5.1.1 Interface Layout

- **Mode Selector**: A horizontal toolbar at the top of the chat area allowing the user to switch between the five modes. Each mode is represented by a labelled icon button.
- **Chat Area**: The central conversational interface where messages from the user and the AI are displayed chronologically.
- **Session History Sidebar**: A collapsible left panel listing past conversation sessions, grouped by date (Today, Yesterday, Previous 7 Days, Previous 30 Days, Older). Sessions may be searched, resumed, or deleted.
- **Context Selector**: Dropdown menus for selecting a specific enrolled course and lesson to provide contextual information to the AI.
- **Language Selector**: A dropdown supporting six response languages — English, Español, Français, العربية, 中文, and हिन्दी.
- **Input Area**: A text input field with send, voice input (demonstration mode), and chat action buttons (clear chat, export chat, regenerate response).

#### E.5.1.2 Operating Modes

**Tutor Mode**

The default mode. The AI functions as a general-purpose academic tutor, explaining concepts, providing examples, and guiding the student step by step.

- Quick Actions: *Explain simpler*, *More examples*, *Test me*, *Simplify*
- Suggested Questions: Topic-specific prompts such as "Explain closures in JavaScript" or "How does photosynthesis work?"

**Quiz Mode**

The AI generates quiz questions tailored to the student's selected topic and level.

- Quick Actions: *Generate MCQs*, *True/False*, *Short questions*, *Test me on this*
- The AI provides correct answers and explanations after the student responds.
- Question difficulty adjusts based on student performance.

**Assignment Helper Mode**

The AI assists students in understanding assignment requirements and planning their approach without writing the assignment on their behalf.

- Quick Actions: *Break down task*, *Suggest approach*, *Check my understanding*, *Give me tips*
- The AI guides the student to perform the work independently.

**Study Planner Mode**

The AI creates personalised study schedules based on goals, available time, and subject matter.

- Quick Actions: *Create study plan*, *Exam prep schedule*, *Weekly planner*, *Revision plan*
- Plans incorporate spaced repetition principles and balanced workload distribution.

**Career Advisor Mode**

The AI provides career guidance, roadmaps, and skill development recommendations.

- Quick Actions: *Career roadmap*, *Skill gap analysis*, *Job preparation*, *Interview tips*
- Advice covers career paths, required skills, and job market trends.

#### E.5.1.3 Session Management

- **New Chat**: Click the **"+"** button or the "New Chat" option to start a fresh conversation.
- **Resume Session**: Click on a past session in the history sidebar to restore its full message history.
- **Delete Session**: Right-click (or use the context menu) on a session to delete it permanently.
- **Export Chat**: Click the export button in the chat toolbar to download the conversation as a plain text file.
- **Clear Chat**: Click the clear button to remove all messages from the current session.

#### E.5.1.4 Learning Profile

The Ask ShijlAI interface displays a learning profile panel that includes:

- **Learning Level**: The student's assessed level (Beginner, Intermediate, or Advanced).
- **Weak Topics**: Topics where the student's performance is below average.
- **Strong Topics**: Topics where the student demonstrates proficiency.
- **Study Streak**: Consecutive days of platform engagement.
- **Total Sessions**: Number of AI tutor sessions completed.
- **Engagement Scores**: Metrics including consistency score, learning speed score, drop-risk score, and engagement score.

*[Screenshot Placeholder: Ask ShijlAI interface showing Tutor mode, session history, and learning profile panel.]*

### E.5.2 ShijlAI Hub

Access: Select **"ShijlAI Hub"** from the sidebar navigation.

The ShijlAI Hub is a centralised dashboard that provides access to three AI-powered learning tools: the **Study Planner**, the **AI Mock Interview**, and the **AI Learning Companion**. Users switch between these tools using a tabbed interface at the top of the view.

#### E.5.2.1 Study Planner

The Study Planner generates personalised, day-by-day study schedules using AI analysis of the student's goals and constraints.

**Creating a Study Plan:**

1. Navigate to the **ShijlAI Hub** and select the **"Study Planner"** tab.
2. If no active plan exists, a creation form is displayed with the following fields:
   - **Subject / Course Name**: The topic or course for which to create a plan (text input).
   - **Exam / Target Date**: The deadline for completing the study plan (date picker).
   - **Current Grade**: The student's current grade or performance level (optional).
   - **Target Grade**: The desired grade or performance target (optional).
   - **Daily Study Hours**: The number of hours available per day for study (slider, adjustable).
3. Click **"Generate Study Plan"** to submit the request to the AI engine.
4. The AI generates a structured plan consisting of daily tasks, each with:
   - A task title and description
   - Task type (study, quiz, revision, practice, mock exam, AI discussion, or break)
   - Estimated duration in minutes
   - Associated topic

**Managing a Study Plan:**

- **Task Completion**: Click the checkbox or status indicator on each task to mark it as completed or in-progress.
- **Progress Tracking**: A progress bar at the top of the plan displays overall completion percentage and statistics (completed tasks vs. total tasks).
- **Plan Details**: View plan metadata including exam date, daily hours, target grade, and creation date.
- **Regeneration**: Abandon or regenerate a plan if circumstances change.

*[Screenshot Placeholder: Study Planner showing an active plan with daily tasks and progress bar.]*

#### E.5.2.2 AI Mock Interview

The AI Mock Interview feature simulates a job or academic interview experience using an AI interviewer.

**Starting a Mock Interview:**

1. Navigate to the **ShijlAI Hub** and select the **"AI Mock Interview"** tab.
2. Configure the interview parameters:
   - **Field / Topic**: The subject area for the interview (e.g., "Data Science", "Software Engineering").
   - **Difficulty Level**: Select from available difficulty settings.
   - **Number of Questions**: Choose the desired number of interview questions.
3. Click **"Start Interview"** to begin.
4. The AI presents questions one at a time. The student types responses in the provided text area.
5. After each response, the AI provides feedback, a score, and suggestions for improvement.
6. Upon completing all questions, a summary is displayed with overall performance metrics.

*[Screenshot Placeholder: AI Mock Interview showing an active question with response area and feedback.]*

#### E.5.2.3 AI Learning Companion

The AI Learning Companion is a proactive AI mentor that analyses the student's learning data to provide personalised guidance, focus recommendations, and study insights.

**Interface Layout:**

- **Chat Area** (left): A conversational interface where the student interacts with the AI Companion. The AI proactively initiates conversations with observations about the student's learning patterns.
- **Intelligence Dashboard** (right sidebar): A panel displaying:
  - **Today's Focus**: A recommended topic for the day with progress tracking and estimated time.
  - **AI Insights**: Proactive observations categorised as focus areas, warnings, achievements, or suggestions. Each insight is clickable and initiates a relevant conversation.
  - **Suggested Actions**: Actionable recommendations such as "Review Calculus notes" or "Take Organic Chemistry quiz".
  - **Quick Stats**: Summary statistics including study streak, XP earned, topics mastered, and weak areas.
  - **Privacy Note**: A statement confirming that learning data is analysed privately and not shared with third parties.

**Using the Learning Companion:**

1. Navigate to the **ShijlAI Hub** and select the **"AI Learning Companion"** tab.
2. Upon loading, the Companion automatically provides a greeting message summarising the student's current learning state (quiz score trends, neglected topics, areas of progress).
3. Type questions or select suggested prompts to interact with the Companion.
4. Click on insights or suggested actions in the right sidebar to initiate conversations about specific topics.

Suggested prompts include:
- "What should I focus on today?"
- "Analyse my weak topics"
- "Create a study plan for my weak areas"
- "How can I improve my quiz scores?"

*[Screenshot Placeholder: AI Learning Companion showing chat area with proactive greeting and intelligence dashboard sidebar.]*

### E.5.3 AI Insights and Recommendations

Access: Select **"AI Insights"** from the sidebar navigation.

This view presents AI-generated personalised recommendations for the student. Recommendations are categorised by type (topic review, quiz practice, lesson continuation) and prioritised (high, medium, low). Each recommendation includes a title, description, and the reason it was generated based on the student's activity data.

---

## E.6 Instructor User Guide

The Instructor Portal provides tools for course creation, student management, analytics, and AI-assisted content generation. Upon login, instructors are presented with the **Instructor Dashboard**.

### E.6.1 Dashboard Overview

The Instructor Dashboard displays:

- **Statistics Cards**: Key metrics including total courses, total enrolled students, total revenue, and course ratings.
- **Action Required**: A list of items requiring the instructor's attention, such as unanswered Q&A questions and pending assignment submissions.
- **Recent Activity**: A timeline of recent events across the instructor's courses.
- **Course Performance Summary**: An overview of engagement and completion rates across published courses.

*[Screenshot Placeholder: Instructor Dashboard showing statistics cards and action-required items.]*

### E.6.2 Navigation Structure

The Instructor Portal sidebar navigation is organised as follows:

**LMS Section (Collapsible)**
| Menu Item     | Description                                     |
|---------------|-------------------------------------------------|
| Dashboard     | Returns to the Instructor Dashboard              |
| Courses       | Manage existing courses and view course list      |
| Students      | View enrolled students and their progress         |
| Assignments   | Create and grade assignments                      |
| Q&A           | Respond to student questions                      |
| Schedule      | View and manage upcoming events and sessions      |

**AI & Analytics Section**
| Menu Item            | Description                                                |
|----------------------|------------------------------------------------------------|
| Intelligent Analytics | AI-powered analytics dashboard with learning metrics       |
| AI Copilot           | AI-assisted content generation and course management tools |
| Smart Assessment     | AI-enhanced assessment and grading tools                   |
| Revenue              | Earnings, payouts, and financial analytics                 |

**Account Section**
| Menu Item      | Description                               |
|----------------|-------------------------------------------|
| Messages       | Direct messaging with students and peers  |
| Profile        | View and edit instructor profile          |
| Notifications  | Platform notifications and alerts         |
| Settings       | Account and preference settings           |

A **"Create New Course"** button is prominently displayed at the top of the sidebar, providing direct access to the course creation workflow.

### E.6.3 Course Management

#### E.6.3.1 Creating a New Course

1. Click **"Create New Course"** in the sidebar (or the floating action button on mobile).
2. The Course Creator interface opens, which guides the instructor through a structured creation flow:
   - **Course Details**: Enter the course title, description, category, level, language, and pricing.
   - **Curriculum Builder**: Create modules and add lessons to each module. Lessons may be of the following types:
     - Video lessons (with video upload or URL)
     - Text/article lessons (with rich text editor)
     - Quiz lessons (with question builder)
     - Assignment lessons (with rubric definition)
     - Interactive lessons
     - Downloadable resource lessons
   - **Lesson Configuration**: For each lesson, configure title, description, content, duration, objectives, resources, and publication status.
   - **Publishing**: Set the course to "Published" to make it available to students, or save as "Draft" for continued editing.

#### E.6.3.2 Managing Existing Courses

1. Select **"Courses"** from the sidebar.
2. The course list displays all courses created by the instructor, with summary statistics (enrolment count, completion rate, average rating).
3. Click on a course to access its management interface, which allows editing of all course properties, curriculum restructuring, and content updates.

### E.6.4 Student Management

Select **"Students"** from the sidebar to view all students enrolled across the instructor's courses. This view provides:

- A list of students with their names, email addresses, enrolled courses, overall progress, and last active date.
- Filtering and search capabilities.
- The ability to view individual student profiles and detailed progress breakdowns.

### E.6.5 Assignments and Grading

Select **"Assignments"** from the sidebar to manage assignments. The instructor can:

- View all assignments across courses, with submission counts and grading status.
- Review individual submissions.
- Grade submissions and provide feedback.
- Filter by draft, pending, or graded status.

### E.6.6 Q&A Management

Select **"Q&A"** from the sidebar to view and respond to student questions. The instructor can:

- View questions organised by course and lesson.
- Respond to unanswered questions.
- Mark questions as resolved.
- View AI-generated answers alongside instructor responses.

### E.6.7 Intelligent Analytics

Select **"Intelligent Analytics"** from the sidebar to access the AI-powered analytics dashboard. This view provides data-driven insights into course performance and student engagement, including:

- Enrolment trends over time
- Completion rates by course and module
- Student engagement metrics
- Assessment performance analysis
- AI-generated suggestions for course improvement

### E.6.8 Revenue

Select **"Revenue"** from the sidebar to view financial information, including:

- Total earnings and revenue trends
- Per-course revenue breakdown
- Payout history and pending payouts

---

## E.7 Instructor AI Copilot

Access: Select **"AI Copilot"** from the Instructor Portal sidebar.

The Instructor AI Copilot is an AI-powered assistant that provides a suite of content-generation and course-management tools. Each tool is presented as a configurable form, and the AI generates structured outputs based on the instructor's inputs.

### E.7.1 Interface Layout

- **Tool Selector**: A scrollable toolbar displaying the available AI tools as labelled icon buttons.
- **Configuration Panel**: A form area that dynamically displays input fields specific to the selected tool.
- **Output Area**: A panel where the AI-generated content is displayed, with options to copy, export, or apply the output.

### E.7.2 Available AI Tools

The following AI tools are available in the Instructor Copilot:

| Tool                 | Purpose                                               | Key Inputs                                              |
|----------------------|-------------------------------------------------------|---------------------------------------------------------|
| Lesson Generator     | Generate complete lesson content                      | Topic, level, style, duration, objectives               |
| Quiz Generator       | Create quizzes with various question types             | Topic, number of questions, difficulty, question types   |
| Rubric Builder       | Generate grading rubrics for assignments               | Assignment description, criteria count, grading scale    |
| Feedback Writer      | Draft personalised feedback for student submissions    | Student name, assignment title, grade, strengths, areas  |
| Curriculum Designer  | Design course curricula and module structures           | Course topic, target audience, duration, objectives      |
| Learning Objectives  | Generate measurable learning outcomes                  | Topic, level, quantity, Bloom's taxonomy level           |
| Content Simplifier   | Simplify complex academic content                     | Text to simplify, target reading level                   |
| Discussion Prompts   | Generate discussion forum questions                   | Topic, number of prompts, cognitive level                |
| Email Composer       | Draft professional emails to students                 | Recipient context, email purpose, tone                   |
| Announcement Writer  | Create course announcements                           | Announcement type, course context, urgency               |
| Engagement Analyser  | Analyse and suggest improvements for engagement       | Course data, engagement metrics                          |
| Exam Generator       | Create comprehensive examinations                     | Subject, sections, duration, difficulty distribution     |

### E.7.3 Using a Tool

1. Select the desired tool from the tool selector bar.
2. Complete the input fields in the configuration panel. Required fields are marked.
3. Click **"Generate"** to submit the request to the AI engine.
4. Review the generated output in the output panel.
5. Use the **Copy** button to copy the output to the clipboard, or **Export** to download it.
6. Modify the inputs and regenerate as needed.

*[Screenshot Placeholder: Instructor AI Copilot showing the Quiz Generator tool with input fields and generated output.]*

---

## E.8 Administrator User Guide

The Admin Panel provides comprehensive platform management capabilities, including user management, course oversight, financial operations, AI configuration, and system monitoring. Upon login, administrators are presented with the **Admin Dashboard**.

### E.8.1 Dashboard Overview

The Admin Dashboard displays platform-wide statistics and operational summary:

- **Statistics Cards**: Total users, total courses, total revenue, active enrolments, and daily active users.
- **Alerts**: Outstanding items requiring administrative attention (flagged content, pending applications, system warnings).
- **Activity Feed**: Recent platform-wide events.
- **Performance Trends**: Charts and indicators showing platform growth metrics.

*[Screenshot Placeholder: Admin Dashboard showing platform statistics and alert summary.]*

### E.8.2 Navigation Structure

The Admin Panel sidebar navigation is organised into the following sections:

**LMS Section (Collapsible)**
| Menu Item        | Description                                            |
|------------------|--------------------------------------------------------|
| Dashboard        | Returns to the Admin Dashboard                          |
| Users            | Manage all platform users                              |
| Courses          | Oversee all published and draft courses                |
| Instructors      | Manage instructor accounts and profiles                |
| Applications     | Review and process instructor applications             |
| Content Review   | Review flagged or submitted course content             |
| Q&A & Reports    | Monitor Q&A activity and manage content reports        |

**AI & Intelligence Section**
| Menu Item               | Description                                                 |
|-------------------------|-------------------------------------------------------------|
| Intelligent Analytics   | AI-powered platform analytics and insights                  |
| AI Copilot              | Administrative AI assistant with operational tools          |
| AI System Intelligence  | Automated platform health monitoring and AI-generated reports |
| ShijlAI Hub             | Administrative access to the AI tools hub                   |
| Blog                    | Manage platform blog posts and content                      |

**Finance Section (Collapsible)**
| Menu Item   | Description                                    |
|-------------|------------------------------------------------|
| Revenue     | Platform revenue analytics and reporting       |
| Payouts     | Manage instructor payout processing            |
| Refunds     | Process and track student refund requests      |

**Operations Section**
| Menu Item      | Description                                    |
|----------------|------------------------------------------------|
| Notifications  | Manage platform-wide notification system       |
| Gamification   | Configure badges, achievements, and XP rules   |

**System Section**
| Menu Item    | Description                                       |
|--------------|---------------------------------------------------|
| AI Config    | Configure AI model parameters and feature flags   |
| Settings     | Platform-wide settings and configuration          |
| Audit Log    | View a chronological log of all administrative actions |
| Dev Tools    | Developer utilities and system diagnostics        |

### E.8.3 User Management

Select **"Users"** from the sidebar to access the user management interface.

**Capabilities:**

- View all registered users in a searchable, sortable table.
- Filter users by role (Student, Instructor, Admin), status (Active, Suspended, Banned), and registration date.
- View individual user profiles with detailed activity history.
- Modify user roles and permissions.
- Suspend or deactivate user accounts.
- Search for users by name or email address.

### E.8.4 Course Oversight

Select **"Courses"** from the sidebar to manage all courses on the platform.

**Capabilities:**

- View all courses in a searchable list with metadata (title, instructor, category, level, status, enrolment count, rating).
- Filter by status (Published, Draft, Under Review, Suspended).
- Access individual course details for review.
- Approve, suspend, or remove courses.
- Review instructor-submitted content through the **"Content Review"** interface.

### E.8.5 Instructor Management

Select **"Instructors"** from the sidebar to manage instructor accounts.

**Capabilities:**

- View all instructors with their course count, student count, average rating, and effectiveness metrics.
- Review pending instructor applications through the **"Applications"** interface.
- Approve or reject instructor applications.
- View individual instructor profiles and performance analytics.

### E.8.6 Financial Administration

#### E.8.6.1 Revenue

Select **"Revenue"** from the Finance section to view platform revenue analytics:

- Total revenue, monthly trends, and revenue by category.
- Per-course and per-instructor revenue breakdowns.
- Comparative analytics across time periods.

#### E.8.6.2 Payouts

Select **"Payouts"** to manage instructor payout processing:

- View pending, processed, and scheduled payouts.
- Initiate payout processing.
- View payout history and transaction details.

#### E.8.6.3 Refunds

Select **"Refunds"** to process student refund requests:

- Review pending refund requests with reason and transaction details.
- Approve or deny refund requests.
- Track refund processing status.

### E.8.7 Gamification Configuration

Select **"Gamification"** from the Operations section to configure the platform's gamification system:

- Define badges and achievement criteria.
- Configure XP earning rules and level thresholds.
- Manage leaderboard settings.
- View gamification engagement analytics.

### E.8.8 System Settings

Select **"Settings"** from the System section to configure platform-wide settings:

- General platform settings (name, description, branding).
- Authentication and security policies.
- Email notification templates.
- Feature flags and toggles.

### E.8.9 Audit Log

Select **"Audit Log"** from the System section to view a chronological record of all administrative actions performed on the platform:

- Action type, actor, target entity, and timestamp.
- Searchable and filterable by action type, actor, and date range.

---

## E.9 Admin AI Copilot

Access: Select **"AI Copilot"** from the Admin Panel sidebar.

The Admin AI Copilot provides administrators with AI-powered tools for platform management, communication, and operational analysis.

### E.9.1 Available AI Tools

The following tools are available in the Admin AI Copilot:

| Tool                    | Purpose                                                    | Key Inputs                                          |
|-------------------------|------------------------------------------------------------|-----------------------------------------------------|
| Announcement Composer   | Draft platform-wide announcements                          | Title, audience, tone, urgency level                 |
| Policy Drafter          | Generate or update platform policies                       | Policy type, scope, compliance requirements          |
| Report Generator        | Create operational and analytical reports                  | Report type, date range, metrics to include          |
| User Communication      | Draft communications to users or user groups               | Recipient type, purpose, message context             |
| Support Response        | Generate responses to common support inquiries             | Query category, user context                         |
| Performance Summary     | Generate executive summaries of platform performance       | Time period, focus areas                             |

### E.9.2 Alert Monitoring

The Admin Copilot interface includes an alert panel that displays platform-level alerts categorised by severity:

- **Critical Alerts**: Issues requiring immediate attention (system errors, security events).
- **Warning Alerts**: Items that may require action (storage capacity, unusual activity patterns).
- **Informational Alerts**: Notable events that do not require action (registration milestones, revenue targets).

---

## E.10 AI System Intelligence (Administrator)

Access: Select **"AI System Intelligence"** from the Admin Panel sidebar.

The AI System Intelligence view provides administrators with an automated, AI-powered operational monitoring dashboard. This feature analyses platform-wide data to generate health assessments, detect anomalies, and provide actionable recommendations.

### E.10.1 Platform Health Overview

The top section displays four key performance indicator (KPI) cards:

| Metric             | Description                                                    |
|---------------------|----------------------------------------------------------------|
| Total Students      | Total registered students with weekly and monthly active user counts |
| Total Courses       | Total courses available with total enrolment count              |
| Daily Active Users  | Number of users active in the past 24 hours with retention rate  |
| Completion Rate     | Platform-wide course completion percentage with trend indicator  |

Each card includes a trend indicator showing the percentage change compared to the previous period (positive, negative, or neutral).

### E.10.2 AI Intelligence Analysis

A dedicated panel allows the administrator to trigger an LLM-powered analysis of the complete platform data. This feature:

1. Aggregates all available platform metrics (health, engagement, course performance, instructor effectiveness, alerts).
2. Submits the aggregated data to the AI engine for analysis.
3. Returns a comprehensive written analysis covering trends, risks, opportunities, and recommended actions.

To generate an analysis:
1. Click **"Generate AI Analysis"**.
2. Wait for the AI engine to process the platform data (indicated by a loading animation).
3. Review the generated analysis, which appears in a styled output panel with a timestamp.

### E.10.3 Rule-Based Insights

Below the AI analysis, the system displays automatically generated rule-based insights. Each insight includes:

- **Type**: Positive, negative, neutral, or warning.
- **Title and Description**: A summary of the detected pattern or anomaly.
- **Engine**: The analysis engine that generated the insight.
- **Action Suggestion**: A recommended response (if the insight is actionable).

### E.10.4 Alert Centre

The Alert Centre organises platform alerts into three severity columns:

- **Critical**: Red-bordered cards for issues requiring immediate action.
- **Warning**: Amber-bordered cards for items warranting attention.
- **Informational**: Blue-bordered cards for notable but non-urgent events.

Each alert includes the alert title, description, related entity (course, instructor, student, or platform), entity type icon, and timestamp.

### E.10.5 Course Intelligence

A sortable table displaying health metrics for every course on the platform:

| Column             | Description                                             |
|--------------------|---------------------------------------------------------|
| Course Title       | The name of the course                                  |
| Instructor         | The assigned instructor                                 |
| Health Score       | A composite score (0–100) indicating overall course health |
| Status             | Healthy, At Risk, or Critical                           |
| Enrolment Growth   | Percentage change in enrolments                         |
| Completion Rate    | Percentage of enrolled students who completed the course |
| Average Rating     | Mean student rating                                     |
| Engagement Rate    | Percentage of active engagement among enrolled students  |

Courses may be sorted by any column. Clicking on a course row expands detailed engagement metrics.

### E.10.6 Instructor Intelligence

A ranked table of instructor effectiveness:

| Column              | Description                                            |
|---------------------|--------------------------------------------------------|
| Instructor Name     | The instructor's name                                  |
| Course Count        | Number of courses managed                              |
| Total Students      | Total students across all courses                      |
| Effectiveness Score | A composite effectiveness score (0–100)                |
| Completion Rate     | Average course completion rate                          |
| Average Rating      | Mean student rating across all courses                  |
| Student Success Rate | Percentage of students achieving learning objectives    |
| Warnings            | Any system-detected issues with the instructor's courses |

*[Screenshot Placeholder: AI System Intelligence dashboard showing KPI cards, AI Analysis panel, and Alert Centre.]*

---

## E.11 Common Operations

### E.11.1 Theme Switching

All portals support light and dark themes. To switch themes:

1. Click the **theme toggle button** in the sidebar footer (Sun/Moon icon).
2. The interface updates immediately to the selected theme.

The theme toggle is available in the sidebar bottom actions bar on desktop and in the mobile sidebar drawer.

### E.11.2 Notifications

All users receive notifications for relevant platform events. The notification system is accessible through:

- **Header Bell Icon**: Displays a badge with the unread notification count. Clicking opens a dropdown list of recent notifications.
- **Notifications View**: Select "Notifications" from the sidebar for the full notifications management interface with read/unread filtering and mark-all-as-read functionality.

Notification types include:
- Enrolment confirmations
- Achievement and badge awards
- Course updates and new content
- Assignment deadlines and grading results
- Q&A activity (new answers, responses)
- Live session reminders
- System announcements
- Security alerts

### E.11.3 Profile Management

All users can view and edit their profile:

1. Select **"My Profile"** (Student), **"Profile"** (Instructor), or access via the header avatar dropdown.
2. Update personal information (name, biography, avatar).
3. Save changes.

### E.11.4 Search

A universal search bar is available in the header of all portals. The search function provides:

- Quick access to courses, lessons, and platform features by keyword.
- Real-time search suggestions as the user types.
- Context-aware results based on the user's role.

---

## E.12 Error Handling and Troubleshooting

### E.12.1 Common Error States

The platform displays user-friendly error messages for common failure scenarios:

| Error Condition                 | Display Behaviour                                                                |
|---------------------------------|----------------------------------------------------------------------------------|
| Network failure                 | A toast notification appears: "Failed to get AI response. Please try again."     |
| API request failure             | An inline error message with a **Retry** button is displayed in the affected panel. |
| Data loading failure            | A centred error card with an alert icon, error description, and **Retry** button.  |
| Authentication failure          | Redirect to the login page with an error message.                                 |
| Session expiry                  | Automatic redirect to the login page.                                             |
| AI engine unavailable           | Toast notification: "I'm having trouble connecting right now. Please try again in a moment." |
| Empty data state                | A centred illustration with descriptive text (e.g., "No courses found", "No notifications"). |

### E.12.2 Troubleshooting Steps

If the platform does not function as expected, users should:

1. **Verify internet connectivity**: Ensure a stable internet connection is available.
2. **Refresh the page**: Press `F5` or `Ctrl+R` (Windows) / `Cmd+R` (macOS) to reload the application.
3. **Clear browser cache**: If issues persist, clear the browser cache and cookies for the platform domain.
4. **Try a different browser**: Access the platform using an alternative supported browser.
5. **Contact support**: If the issue is not resolved, contact the platform administrator.

---

## E.13 Quick-Reference: AI Features Summary

The following table provides a consolidated summary of all AI-powered features available in ShijlAI Academy:

| Feature                  | User Role   | Access Path                               | Description                                                      |
|--------------------------|-------------|-------------------------------------------|------------------------------------------------------------------|
| Ask ShijlAI (Tutor)      | Student     | Sidebar → Ask ShijlAI → Tutor mode        | AI tutor for concept explanation and guided learning              |
| Ask ShijlAI (Quiz)       | Student     | Sidebar → Ask ShijlAI → Quiz mode         | AI-generated quizzes with adaptive difficulty                    |
| Ask ShijlAI (Assignment) | Student     | Sidebar → Ask ShijlAI → Assignment mode   | AI guidance for assignment understanding and planning            |
| Ask ShijlAI (Planner)    | Student     | Sidebar → Ask ShijlAI → Planner mode      | AI-generated personalised study schedules                        |
| Ask ShijlAI (Career)     | Student     | Sidebar → Ask ShijlAI → Career mode       | AI career guidance, roadmaps, and skill analysis                 |
| Study Planner            | Student     | Sidebar → ShijlAI Hub → Study Planner     | AI-powered daily study plan generation with progress tracking    |
| AI Mock Interview        | Student     | Sidebar → ShijlAI Hub → Mock Interview    | Simulated AI-driven interview practice with feedback             |
| AI Learning Companion    | Student     | Sidebar → ShijlAI Hub → Companion         | Proactive AI mentor analysing learning data for personalised guidance |
| In-Lesson AI Tutor       | Student     | Course Player → Ask ShijlAI tab           | Context-aware AI tutoring within the lesson viewing experience   |
| AI Insights              | Student     | Sidebar → AI Insights                     | Personalised learning recommendations based on activity analysis |
| Instructor AI Copilot    | Instructor  | Sidebar → AI Copilot                      | Suite of 12 AI tools for content generation and course management |
| Intelligent Analytics    | Instructor  | Sidebar → Intelligent Analytics           | AI-powered course and student performance analytics              |
| Smart Assessment         | Instructor  | Sidebar → Smart Assessment                | AI-enhanced assessment creation and grading tools                |
| Admin AI Copilot         | Admin       | Sidebar → AI Copilot                      | AI tools for platform management and operational communication   |
| AI System Intelligence   | Admin       | Sidebar → AI System Intelligence          | Automated platform health monitoring with LLM-powered analysis   |
| Admin Analytics          | Admin       | Sidebar → Intelligent Analytics           | AI-driven platform-wide analytics and reporting                  |

---

*End of Appendix E*
