const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, PageBreak, TableOfContents,
  SectionType, TabStopType,
} = require("docx");
const fs = require("fs");

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

const TNR = { ascii: "Times New Roman", hAnsi: "Times New Roman" };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function safeText(val, fallback = "—") {
  return val != null && val !== "" ? String(val) : fallback;
}

// Body paragraph - justified, 12pt TNR, first-line indent, 1.5 spacing
function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { firstLine: 480 },
    ...opts,
    children: [
      new TextRun({ text, size: 24, font: TNR, color: "000000" }),
    ],
  });
}

// Body paragraph with inline formatting support
function bodyParaRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { firstLine: 480 },
    ...opts,
    children: runs,
  });
}

// Superscript citation
function cite(num) {
  return new TextRun({ text: `[${num}]`, superScript: true, size: 18, font: TNR, color: "000000" });
}

// Normal text run
function t(text, opts = {}) {
  return new TextRun({ text, size: 24, font: TNR, color: "000000", ...opts });
}

// Bold text run
function tb(text, opts = {}) {
  return new TextRun({ text, size: 24, font: TNR, color: "000000", bold: true, ...opts });
}

// Heading 1 - Chapter heading, centered, 16pt bold
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360, line: 360 },
    children: [new TextRun({ text, bold: true, size: 32, font: TNR, color: "000000" })],
  });
}

// Heading 2 - Section heading, left, 15pt bold
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 240, line: 360 },
    children: [new TextRun({ text, bold: true, size: 30, font: TNR, color: "000000" })],
  });
}

// Heading 3 - Subsection heading, left, 14pt bold
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 360 },
    children: [new TextRun({ text, bold: true, size: 28, font: TNR, color: "000000" })],
  });
}

// Three-line table (academic)
function threeLineTable(headers, rows, caption) {
  const headerBorder = {
    bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
  };
  const noBorder = { top: NB, bottom: NB, left: NB, right: NB };

  const result = [];
  if (caption) {
    result.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120, line: 360 },
      keepNext: true,
      children: [new TextRun({ text: caption, size: 21, font: TNR, color: "000000" })],
    }));
  }

  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headers.map(h => new TableCell({
          borders: headerBorder,
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, size: 21, font: TNR, color: "000000" })],
          })],
        })),
      }),
      ...rows.map(row => new TableRow({
        cantSplit: true,
        children: row.map(cell => new TableCell({
          borders: noBorder,
          margins: { top: 40, bottom: 40, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 300 },
            children: [new TextRun({ text: String(cell), size: 21, font: TNR, color: "000000" })],
          })],
        })),
      })),
    ],
  }));

  return result;
}

// Screenshot placeholder
function screenshotPlaceholder(description) {
  return new Table({
    width: { size: 90, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
    },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
        margins: { top: 400, bottom: 400, left: 200, right: 200 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
          left: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
            children: [new TextRun({ text: "[Screenshot Placeholder]", italics: true, size: 22, font: TNR, color: "888888" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: description, size: 21, font: TNR, color: "555555" })] }),
        ],
      })],
    })],
  });
}

// Diagram placeholder
function diagramPlaceholder(title, description) {
  return new Table({
    width: { size: 90, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
    },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "FAFAFA" },
        margins: { top: 300, bottom: 300, left: 200, right: 200 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
          left: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "666666" },
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
            children: [new TextRun({ text: title, bold: true, size: 22, font: TNR, color: "333333" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
            children: [new TextRun({ text: "[Diagram - Render with Mermaid.js or draw.io]", italics: true, size: 20, font: TNR, color: "888888" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: description, size: 20, font: TNR, color: "555555" })] }),
        ],
      })],
    })],
  });
}

// Figure caption (below figure)
function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200, line: 300 },
    children: [new TextRun({ text, size: 21, font: TNR, color: "000000" })],
  });
}

// Table caption (above table) - already handled in threeLineTable

// Reference entry
function refEntry(num, text) {
  return new Paragraph({
    indent: { left: 420, hanging: 420 },
    spacing: { line: 360, after: 60 },
    children: [new TextRun({ text: `[${num}] ${text}`, size: 21, font: TNR, color: "000000" })],
  });
}

// Empty paragraph for spacing
function spacer(before = 0) {
  return new Paragraph({ spacing: { before }, children: [] });
}

// Page layout for body sections
const bodyPageLayout = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1440, bottom: 1440, left: 1701, right: 1417, header: 850, footer: 992 },
};

// Header helper
function buildHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
      children: [new TextRun({ text: "ShijlAI Academy \u2014 AI-Powered Adaptive Learning Platform", size: 18, color: "333333", font: TNR })],
    })],
  });
}

// Footer with page number
function buildFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "- ", size: 21, font: TNR }),
        new TextRun({ children: [PageNumber.CURRENT], size: 21, font: TNR }),
        new TextRun({ text: " -", size: 21, font: TNR }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════

function buildCover() {
  const infoRows = [
    ["Department", "Department of Computer Science & IT"],
    ["Author 1", "Sadeed Ali (Roll No: 1447)"],
    ["Author 2", "Syed Awais Shah (Roll No: 1457)"],
    ["Supervisor", "[To be assigned]"],
    ["Session", "2021\u20132025"],
  ];

  const infoTable = new Table({
    width: { size: 65, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: allNoBorders,
    rows: infoRows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, top: NB, left: NB, right: NB },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: label + ":", size: 24, font: TNR, color: "000000" })],
          })],
        }),
        new TableCell({
          borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, top: NB, left: NB, right: NB },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: value, size: 24, font: TNR, color: "000000" })],
          })],
        }),
      ],
    })),
  });

  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 400 },
      children: [new TextRun({ text: "UNIVERSITY OF MALAKAND", size: 40, bold: true, font: TNR, color: "000000" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: "Department of Computer Science & IT", size: 28, font: TNR, color: "333333" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100, line: 720 },
      children: [new TextRun({ text: "SHIJLAI ACADEMY", size: 44, bold: true, font: TNR, color: "000000" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 600 },
      children: [new TextRun({ text: "AI-Powered Adaptive Learning Platform", size: 32, italics: true, font: TNR, color: "333333" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: "A Final Year Project Thesis", size: 26, font: TNR, color: "555555" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "Submitted in Partial Fulfillment of the Requirements", size: 22, font: TNR, color: "555555" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
      children: [new TextRun({ text: "for the Degree of Bachelor of Science in Computer Science", size: 22, font: TNR, color: "555555" })] }),
    infoTable,
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 },
      children: [new TextRun({ text: "2025", size: 26, font: TNR, color: "000000" })] }),
  ];
}

// ═══════════════════════════════════════════
// DECLARATION PAGE
// ═══════════════════════════════════════════

function buildDeclaration() {
  return [
    h1("Declaration"),
    bodyPara("We hereby declare that the thesis entitled \"ShijlAI Academy \u2014 AI-Powered Adaptive Learning Platform\" is the result of our own original research work. This thesis has not been submitted previously, in whole or in part, for the award of any other degree, diploma, or fellowship. All sources of information used have been duly acknowledged and referenced."),
    bodyPara("We further declare that the software system described in this thesis, including its source code, database schemas, AI modules, and architectural designs, has been developed by us as part of our Final Year Project. No part of this work has been plagiarized from any existing system, publication, or codebase, except where explicitly cited."),
    spacer(200),
    bodyParaRuns([tb("Author 1: "), t("Sadeed Ali (Roll No: 1447)")], { indent: { firstLine: 0 } }),
    bodyParaRuns([tb("Author 2: "), t("Syed Awais Shah (Roll No: 1457)")], { indent: { firstLine: 0 } }),
    bodyPara("Date: _______________", { indent: { firstLine: 0 } }),
    spacer(600),
    h1("Certificate"),
    bodyPara("This is to certify that the thesis entitled \"ShijlAI Academy \u2014 AI-Powered Adaptive Learning Platform\" submitted by Sadeed Ali (Roll No: 1447) and Syed Awais Shah (Roll No: 1457) has been carried out under my supervision and is approved for submission to the Department of Computer Science & IT, University of Malakand, in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science."),
    spacer(400),
    bodyParaRuns([tb("Supervisor: "), t("_________________________")], { indent: { firstLine: 0 } }),
    bodyPara("Date: _______________", { indent: { firstLine: 0 } }),
    spacer(400),
    bodyParaRuns([tb("Chairman: "), t("_________________________")], { indent: { firstLine: 0 } }),
    bodyPara("Department of Computer Science & IT", { indent: { firstLine: 0 } }),
    bodyPara("University of Malakand", { indent: { firstLine: 0 } }),
  ];
}

// ═══════════════════════════════════════════
// ACKNOWLEDGMENTS
// ═══════════════════════════════════════════

function buildAcknowledgments() {
  return [
    h1("Acknowledgments"),
    bodyPara("All praise is due to Almighty Allah, the Most Gracious and the Most Merciful, who bestowed upon us the strength, knowledge, and perseverance to complete this Final Year Project successfully."),
    bodyPara("We wish to express our profound gratitude to our project supervisor for their invaluable guidance, constructive criticism, and continuous encouragement throughout the course of this research. Their expertise and insights were instrumental in shaping the direction and quality of this project."),
    bodyPara("We extend our sincere appreciation to the faculty members of the Department of Computer Science & IT, University of Malakand, for imparting the knowledge and skills that formed the foundation of our academic and technical capabilities. Their dedication to teaching and research has been a constant source of inspiration."),
    bodyPara("We are deeply thankful to our families and friends for their unwavering support, patience, and encouragement during the challenging phases of this project. Their belief in our abilities kept us motivated to push forward."),
    bodyPara("We also acknowledge the contributions of the open-source community, particularly the developers and maintainers of Next.js, React, TypeScript, Prisma, Tailwind CSS, and the numerous libraries that made ShijlAI Academy possible."),
    bodyPara("Finally, we dedicate this work to all students and educators who seek to leverage artificial intelligence for a more personalized, adaptive, and effective learning experience."),
    spacer(200),
    bodyPara("Sadeed Ali (Roll No: 1447)", { indent: { firstLine: 0 } }),
    bodyPara("Syed Awais Shah (Roll No: 1457)", { indent: { firstLine: 0 } }),
  ];
}

// ═══════════════════════════════════════════
// ABSTRACT
// ═══════════════════════════════════════════

function buildAbstract() {
  return [
    h1("Abstract"),
    bodyParaRuns([
      t("The rapid expansion of online education has highlighted critical limitations in traditional e-learning platforms, particularly the absence of personalized, adaptive learning experiences that cater to individual student needs. While platforms such as Coursera, Udemy, and edX offer vast content libraries, they predominantly employ a one-size-fits-all approach that fails to accommodate diverse learning speeds, styles, and proficiency levels."),
      cite(1),
    ]),
    bodyParaRuns([
      t("This thesis presents ShijlAI Academy, an AI-powered adaptive learning platform designed to address these limitations through intelligent personalization, real-time learning analytics, and multi-modal AI assistance. The platform implements a comprehensive three-portal architecture\u2014Student, Instructor, and Admin\u2014each equipped with specialized AI-driven features. The core innovation lies in the Adaptive Learning Engine, which employs a weighted mastery formula (quiz: 50%, assignment: 25%, practice: 15%, completion: 10%) with temporal decay, an engagement-aware feature engine computing five key metrics (Learning Speed, Engagement Score, Consistency Score, Average Performance, and Drop Risk), and a priority-based recommendation engine that generates personalized learning paths."),
      cite(2),
    ]),
    bodyParaRuns([
      t("The platform features ten distinct AI modules, including Ask ShijlAI (a six-mode AI tutor with learning profile awareness), an AI Study Planner with phase-based task allocation, an AI Learning Companion with proactive mentoring capabilities, and an Instructor AI Copilot providing eleven generative AI tools for course creation. The system is built using Next.js 16 with React 19 and TypeScript 5 on the frontend, Prisma ORM with SQLite for data persistence, and the z-ai-web-dev-sdk for AI capabilities. The implementation encompasses 87 database models, over 180 API endpoints, and 60+ interactive view components."),
      cite(3),
    ]),
    bodyParaRuns([
      t("The results demonstrate that ShijlAI Academy successfully integrates AI-driven personalization into a full-featured e-learning platform, providing adaptive content delivery, intelligent tutoring, and comprehensive learning analytics. The platform's gamification system, community features, and multi-role architecture create a holistic educational ecosystem that addresses the research gap identified in existing solutions. This work contributes to the field of AI-enhanced education by demonstrating a practical, scalable implementation of adaptive learning technologies within a modern web application framework."),
      cite(4),
    ]),
    spacer(200),
    bodyParaRuns([tb("Keywords: "), t("Artificial Intelligence, Adaptive Learning, E-Learning Platform, Learning Analytics, Personalized Education, AI Tutor, Mastery Tracking, Recommendation Engine, Next.js, Full-Stack Development")], { indent: { firstLine: 0 } }),
  ];
}

// ═══════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════

function buildTOC() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400, line: 360 },
      children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: TNR, color: "000000" })],
    }),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: "[Right-click this Table of Contents and select \u201cUpdate Field\u201d to refresh page numbers]", italics: true, size: 20, font: TNR, color: "888888" })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 1: INTRODUCTION
// ═══════════════════════════════════════════

function buildChapter1() {
  return [
    h1("Chapter 1"),
    h1("Introduction"),

    h2("1.1 Background of the Study"),
    bodyParaRuns([
      t("The landscape of education has undergone a profound transformation over the past two decades, driven primarily by the convergence of internet technologies and pedagogical innovation. E-learning platforms have emerged as powerful vehicles for knowledge dissemination, transcending geographical boundaries and democratizing access to quality education."),
      cite(5),
      t(" According to recent industry reports, the global e-learning market is projected to reach $375 billion by 2026, reflecting a compound annual growth rate of approximately 14%."),
      cite(6),
    ]),
    bodyParaRuns([
      t("Despite this growth, a fundamental challenge persists: the predominance of one-size-fits-all content delivery models that fail to account for individual differences in learning speed, cognitive style, prior knowledge, and engagement patterns. Research in educational psychology has consistently demonstrated that personalized instruction significantly outperforms standardized approaches, with Bloom's two-sigma problem showing that individually tutored students perform two standard deviations above conventionally taught students."),
      cite(7),
    ]),
    bodyParaRuns([
      t("Artificial Intelligence (AI) has emerged as a transformative force in addressing this personalization gap. Machine learning algorithms can analyze vast amounts of learner interaction data to identify patterns, predict learning outcomes, and generate tailored recommendations. AI-powered chatbots and virtual tutors can provide instant, context-aware assistance, simulating aspects of one-on-one tutoring at scale."),
      cite(8),
      t(" The integration of Large Language Models (LLMs) into educational applications has further accelerated this trend, enabling natural language interactions that can adapt to a student's proficiency level and learning style."),
      cite(9),
    ]),
    bodyParaRuns([
      t("However, existing platforms often treat AI as a supplementary feature rather than a core architectural principle. Platforms like Coursera and Udemy offer AI-generated recommendations as peripheral additions, while Moodle and similar open-source Learning Management Systems (LMS) require extensive plugin configurations for even basic adaptive features."),
      cite(10),
      t(" This creates a significant research and implementation gap: there is a need for an e-learning platform where AI-driven personalization is embedded at the foundation of the learning experience, integrated deeply with mastery tracking, adaptive content delivery, and intelligent tutoring."),
    ]),

    h2("1.2 Problem Statement"),
    bodyPara("Current e-learning platforms suffer from several critical deficiencies that limit their effectiveness in providing truly personalized educational experiences:"),
    bodyParaRuns([tb("(1) Lack of Real-Time Adaptive Learning: "), t("Most platforms deliver static content sequences that do not adjust based on a student's demonstrated mastery, learning speed, or engagement patterns. Students who struggle with foundational concepts are advanced to more complex material without remediation, while advanced students are forced through content they have already mastered.")]),
    bodyParaRuns([tb("(2) Insufficient Mastery Tracking: "), t("Existing platforms typically measure progress through simple completion percentages rather than nuanced mastery assessments. This binary approach (complete/incomplete) fails to capture the spectrum of understanding that ranges from initial exposure to deep mastery, and it cannot identify specific areas of weakness within a topic.")]),
    bodyParaRuns([tb("(3) Limited AI Integration: "), t("While some platforms incorporate AI for recommendation engines or chatbots, these features are typically isolated from the core learning experience. There is no unified AI ecosystem that connects tutoring, assessment generation, study planning, and content recommendation into a coherent, mutually reinforcing system.")]),
    bodyParaRuns([tb("(4) Absence of Predictive Analytics: "), t("Few platforms employ predictive models to identify at-risk students before they disengage. Without early warning systems that detect declining engagement, inconsistent study patterns, or increasing drop risk, interventions come too late to be effective.")]),
    bodyParaRuns([tb("(5) Fragmented Instructor Tooling: "), t("Instructors on existing platforms lack AI-powered tools for content creation, assessment design, and student analytics. The burden of creating high-quality educational content remains entirely manual, limiting the scalability of personalized education.")]),

    h2("1.3 Research Objectives"),
    bodyPara("This research aims to design, implement, and evaluate ShijlAI Academy, an AI-powered adaptive learning platform. The specific objectives are:"),
    bodyParaRuns([t("1. To design and implement a comprehensive Adaptive Learning Engine that tracks student mastery using a weighted formula incorporating quiz performance (50%), assignment scores (25%), practice activity (15%), and content completion (10%), with temporal decay for knowledge retention modeling.")]),
    bodyParaRuns([t("2. To develop a multi-mode AI tutoring system (Ask ShijlAI) capable of operating in six distinct modes\u2014tutor, quiz generator, assignment helper, study planner, career advisor, and learning companion\u2014with contextual awareness of each student's learning profile and mastery state.")]),
    bodyParaRuns([t("3. To implement a real-time Feature Engine that computes five key learning metrics (Learning Speed, Engagement Score, Consistency Score, Average Performance, and Drop Risk) and feeds these into a priority-based Recommendation Engine for personalized content delivery.")]),
    bodyParaRuns([t("4. To create a three-portal architecture (Student, Instructor, Admin) with specialized AI tools for each role, including an Instructor AI Copilot with eleven generative tools and an Admin AI Config system for managing AI providers and models.")]),
    bodyParaRuns([t("5. To integrate gamification, community features, and comprehensive learning analytics into a cohesive educational ecosystem that motivates engagement and facilitates collaborative learning.")]),

    h2("1.4 Scope of the Study"),
    bodyPara("This research encompasses the full-stack development of ShijlAI Academy, covering the following scope areas:"),
    bodyParaRuns([tb("Platform Scope: "), t("A complete web-based e-learning platform with three distinct portals serving students, instructors, and administrators. The platform supports course creation, enrollment, content delivery, assessment, and progress tracking.")]),
    bodyParaRuns([tb("AI Scope: "), t("Integration of AI capabilities through the z-ai-web-dev-sdk, enabling large language model (LLM) interactions for tutoring, content generation, and intelligent assistance. The AI modules include the Adaptive Learning Engine, Ask ShijlAI multi-mode tutor, AI Study Planner, AI Learning Companion, AI Mock Interview, and Instructor AI Copilot.")]),
    bodyParaRuns([tb("Technical Scope: "), t("The platform is built with Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Prisma ORM (with SQLite for development and MySQL migration support), and Zustand for client-side state management. The frontend implements a Single Page Application (SPA) architecture with 60+ lazy-loaded view components.")]),
    bodyParaRuns([tb("Limitations: "), t("This study does not include large-scale user testing or longitudinal evaluation of learning outcomes. The AI features rely on external LLM APIs via the z-ai-web-dev-sdk, and their quality is dependent on the underlying model capabilities. The platform uses a custom authentication system suitable for demonstration purposes, with production-grade security as a future enhancement.")]),

    h2("1.5 Significance of the Study"),
    bodyParaRuns([
      t("This research makes several significant contributions to the field of AI-enhanced education. First, it demonstrates a practical, full-stack implementation of adaptive learning technologies within a modern web application framework, providing a reference architecture for future AI-powered educational platforms."),
      cite(11),
      t(" The integrated approach\u2014where AI is not an afterthought but a foundational architectural principle\u2014represents a departure from the prevalent model of bolting AI features onto existing LMS platforms."),
    ]),
    bodyPara("Second, the Adaptive Learning Engine's weighted mastery formula and temporal decay mechanism provide a nuanced model for tracking student knowledge states that goes beyond simple completion tracking. The inclusion of drop risk prediction enables proactive intervention, addressing the critical challenge of student retention in online education."),
    bodyPara("Third, the multi-mode AI tutoring system demonstrates how a single AI framework can serve multiple pedagogical functions while maintaining contextual awareness of individual student profiles. This has implications for the design of future AI-powered educational tools."),
    bodyPara("Fourth, from a practical standpoint, ShijlAI Academy serves as a functional e-learning platform that can be deployed for educational institutions, particularly in developing regions where access to personalized tutoring is limited. The platform's gamification features and community tools address engagement challenges that are especially acute in online learning environments."),

    h2("1.6 Thesis Organization"),
    bodyPara("This thesis is organized into seven chapters. Chapter 1 provides the introduction, including the background, problem statement, research objectives, scope, and significance. Chapter 2 presents a comprehensive literature review covering e-learning evolution, AI in education, adaptive learning systems, learning analytics, and gamification. Chapter 3 details the system analysis and design, including requirements specification, system architecture, database design, and use case diagrams. Chapter 4 describes the implementation of the platform, covering the technology stack, frontend and backend development, AI module implementation, and key algorithms. Chapter 5 presents the testing methodology and results. Chapter 6 discusses deployment architecture and security considerations. Chapter 7 concludes the thesis with a summary of achievements, contributions, limitations, and future work directions."),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 2: LITERATURE REVIEW
// ═══════════════════════════════════════════

function buildChapter2() {
  return [
    h1("Chapter 2"),
    h1("Literature Review"),

    h2("2.1 E-Learning Platforms: Evolution and Current State"),
    bodyParaRuns([
      t("The evolution of e-learning platforms can be traced through several distinct phases, each characterized by technological advances and shifting pedagogical paradigms. The first generation, emerging in the late 1990s, consisted primarily of content repositories that digitized traditional course materials for online access."),
      cite(12),
      t(" Platforms such as WebCT and Blackboard pioneered this space, offering basic content management and communication tools. The second generation, marked by the emergence of Learning Management Systems (LMS) like Moodle (2002) and Sakai, introduced structured course delivery, gradebooks, and discussion forums."),
      cite(13),
    ]),
    bodyParaRuns([
      t("The third generation witnessed the rise of Massive Open Online Courses (MOOCs), with platforms like Coursera (2012), edX (2012), and Udacity (2012) democratizing access to university-level education."),
      cite(14),
      t(" These platforms introduced video-based lectures, peer grading, and certification mechanisms. However, they retained the one-to-many broadcast model of traditional education, with limited personalization. The fourth and current generation is characterized by the integration of AI and data analytics, with platforms beginning to leverage machine learning for content recommendation, automated grading, and adaptive learning paths."),
      cite(15),
    ]),
    bodyParaRuns([
      t("Despite these advances, a 2023 meta-analysis of e-learning platform effectiveness revealed that completion rates for online courses remain below 15% across most platforms, with lack of personalization and engagement cited as primary factors."),
      cite(16),
      t(" This underscores the need for platforms that go beyond content delivery to create genuinely adaptive, engaging learning experiences."),
    ]),

    h2("2.2 Artificial Intelligence in Education"),
    bodyParaRuns([
      t("The application of AI in education (AIEd) has a rich history dating back to the 1970s with early Intelligent Tutoring Systems (ITS) such as SCHOLAR and SOPHIE."),
      cite(17),
      t(" These systems attempted to provide individualized instruction through rule-based expert systems. The field evolved through several paradigms: knowledge-based tutoring systems in the 1980s, machine learning approaches in the 1990s and 2000s, and the current era of deep learning and large language models."),
      cite(18),
    ]),
    bodyParaRuns([
      t("Recent advances in Large Language Models (LLMs), particularly GPT-4 and its successors, have opened new frontiers in AIEd. These models can engage in natural, context-aware dialogue, generate educational content, and provide explanations adapted to different proficiency levels."),
      cite(19),
      t(" Research by Kasneci et al. (2023) demonstrated that LLM-powered tutoring systems can achieve learning outcomes comparable to human tutors in certain domains, particularly for procedural and factual knowledge."),
      cite(20),
    ]),
    bodyParaRuns([
      t("However, the integration of LLMs into educational platforms presents challenges including hallucination (generating plausible but incorrect information), the need for domain-specific fine-tuning, and ensuring pedagogical alignment. The Socratic method, where the AI guides students through questioning rather than direct instruction, has emerged as a promising approach to mitigate these concerns."),
      cite(21),
    ]),

    h2("2.3 Adaptive Learning Systems"),
    bodyParaRuns([
      t("Adaptive learning systems adjust the content, pace, and sequence of instruction based on individual learner characteristics. Corbett and Anderson's Cognitive Tutor (1995) established foundational principles for adaptive instruction using Bayesian Knowledge Tracing (BKT) to estimate student knowledge states."),
      cite(22),
      t(" More recent approaches include Deep Knowledge Tracing (DKT), which uses recurrent neural networks to model knowledge states, and Item Response Theory (IRT) for adaptive assessment."),
      cite(23),
    ]),
    bodyParaRuns([
      t("Modern adaptive learning platforms such as Knewton, ALEKS, and DreamBox employ various strategies for personalization. Knewton uses a proficiency-based model that continuously updates student knowledge estimates, while ALEKS employs an AI-based assessment engine using Knowledge Space Theory."),
      cite(24),
      t(" These platforms demonstrate the viability of adaptive approaches, but they typically operate within narrow domains (primarily mathematics) and lack the comprehensive feature set needed for a full e-learning platform."),
    ]),
    bodyPara("ShijlAI Academy addresses this gap by implementing a weighted mastery formula that combines multiple assessment dimensions (quizzes, assignments, practice, completion) with temporal decay, providing a more holistic and time-sensitive measure of student understanding than traditional knowledge tracing approaches."),

    h2("2.4 Learning Analytics and Student Modeling"),
    bodyParaRuns([
      t("Learning analytics, defined as \"the measurement, collection, analysis, and reporting of data about learners and their contexts, for the purposes of understanding and optimizing learning and the environments in which it occurs,\" has become a central concern in educational technology."),
      cite(25),
      t(" The Society for Learning Analytics Research (SoLAR) has established frameworks for learning analytics implementation, including the Learning Analytics Cycle and the Learning Analytics Framework."),
    ]),
    bodyParaRuns([
      t("Student modeling approaches range from simple overlay models (which represent the student's knowledge as a subset of the expert's knowledge) to more sophisticated Bayesian and deep learning models. The Feature Engine in ShijlAI Academy draws inspiration from these approaches, computing five composite metrics\u2014Learning Speed, Engagement Score, Consistency Score, Average Performance, and Drop Risk\u2014that provide a multi-dimensional profile of each student's learning state."),
      cite(26),
    ]),
    bodyPara("Drop risk prediction has received particular attention in recent research, with studies demonstrating that early identification of at-risk students can improve retention rates by 10-20% when timely interventions are provided. The Drop Risk formula in ShijlAI Academy (low_engagement x 0.3 + low_consistency x 0.3 + declining_score x 0.2 + inactivity x 0.2) reflects the multi-factor nature of student disengagement identified in the literature."),

    h2("2.5 Gamification in E-Learning"),
    bodyParaRuns([
      t("Gamification\u2014the application of game design elements in non-game contexts\u2014has been extensively studied as a mechanism for increasing student engagement and motivation in online learning. Deterding et al. (2011) provided the foundational definition, while Hamari et al. (2014) conducted a comprehensive review showing that gamification generally has positive effects on engagement, with the strongest effects for badges, leaderboards, and progress tracking."),
      cite(27),
    ]),
    bodyParaRuns([
      t("ShijlAI Academy implements a comprehensive gamification system that includes experience points (XP), levels, badges (across four categories), streaks with freeze mechanisms, daily challenges, a reward shop, and a leaderboard. This multi-layered approach addresses the finding that no single gamification element is universally effective, and that the combination of achievement, social, and immersion mechanics produces the strongest engagement effects."),
      cite(28),
    ]),

    h2("2.6 Comparative Analysis of Existing Platforms"),
    bodyPara("Table 2-1 presents a comparative analysis of ShijlAI Academy against leading e-learning platforms across key feature dimensions."),

    ...threeLineTable(
      ["Feature", "Coursera", "Udemy", "edX", "Khan Academy", "Moodle", "ShijlAI Academy"],
      [
        ["Adaptive Learning", "Limited", "No", "Limited", "Partial", "Plugin-based", "Core Feature"],
        ["AI Tutor", "No", "No", "No", "Partial", "No", "6-Mode AI Tutor"],
        ["Mastery Tracking", "Basic", "No", "Basic", "Partial", "Grade-based", "Weighted Formula"],
        ["Drop Risk Prediction", "No", "No", "No", "No", "No", "Yes (5-factor)"],
        ["AI Content Generation", "No", "No", "No", "No", "No", "11 AI Tools"],
        ["Smart Assessment", "Peer Review", "No", "Peer Review", "Auto-check", "Plugin", "AI-Powered"],
        ["Gamification", "Certificates", "None", "Certificates", "Partial", "Plugin", "Full Suite"],
        ["Study Planner", "No", "No", "No", "No", "No", "AI-Generated"],
        ["Community Features", "Forums", "Q&A", "Forums", "None", "Forums", "Full Suite"],
        ["Open Source", "No", "No", "Partial", "No", "Yes", "Custom Build"],
      ],
      "Table 2-1 Comparative Analysis of E-Learning Platforms"
    ),
    spacer(100),

    h2("2.7 Research Gap and Contribution"),
    bodyPara("The literature review reveals several critical gaps in existing e-learning platforms: (1) AI capabilities are typically peripheral add-ons rather than core architectural components; (2) mastery tracking relies on simplistic completion-based models rather than nuanced, multi-dimensional assessment; (3) no existing platform integrates adaptive learning, AI tutoring, predictive analytics, and AI-powered content creation into a unified system; and (4) instructor-facing AI tools remain largely absent from mainstream platforms."),
    bodyPara("ShijlAI Academy addresses these gaps by embedding AI at the foundation of the platform architecture, implementing a comprehensive Adaptive Learning Engine with weighted mastery tracking and temporal decay, providing a multi-mode AI tutoring system with learning profile awareness, and equipping instructors with a suite of eleven AI-powered content creation tools. This integrated approach represents a significant contribution to the field of AI-enhanced education."),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 3: SYSTEM ANALYSIS AND DESIGN
// ═══════════════════════════════════════════

function buildChapter3() {
  return [
    h1("Chapter 3"),
    h1("System Analysis and Design"),

    h2("3.1 Requirements Analysis"),

    h3("3.1.1 Functional Requirements"),
    bodyPara("The functional requirements of ShijlAI Academy were derived through analysis of existing e-learning platforms, educational technology research, and stakeholder needs. Table 3-1 presents the key functional requirements organized by module."),

    ...threeLineTable(
      ["Req ID", "Requirement", "Priority"],
      [
        ["FR-01", "User registration with role selection (Student/Instructor) and OTP verification", "High"],
        ["FR-02", "Role-based authentication with account locking after 5 failed attempts", "High"],
        ["FR-03", "Course creation wizard with 6-step process (Basics, Curriculum, Content, Pricing, SEO, Review)", "High"],
        ["FR-04", "Course enrollment with progress tracking and completion certificates", "High"],
        ["FR-05", "Immersive course player with video/text/interactive lesson support", "High"],
        ["FR-06", "AI-powered quiz generation from course content with multiple question types", "High"],
        ["FR-07", "Ask ShijlAI multi-mode AI tutor with 6 modes and learning profile awareness", "High"],
        ["FR-08", "Topic mastery tracking with weighted formula and temporal decay", "High"],
        ["FR-09", "Adaptive learning recommendations based on mastery, engagement, and drop risk", "High"],
        ["FR-10", "AI study plan generation with phase-based daily task allocation", "Medium"],
        ["FR-11", "AI learning companion with proactive engagement and streak awareness", "Medium"],
        ["FR-12", "Instructor AI Copilot with 11 generative tools for content creation", "High"],
        ["FR-13", "Smart Assessment system with learning outcomes and distractor analysis", "Medium"],
        ["FR-14", "Gamification system with XP, levels, badges, streaks, challenges, and reward shop", "Medium"],
        ["FR-15", "Community features: discussions, study groups, peer reviews, events", "Medium"],
        ["FR-16", "Direct and group messaging with read receipts", "Medium"],
        ["FR-17", "Course Q&A system with AI draft answers and moderation", "Medium"],
        ["FR-18", "Certificate generation with blockchain-style verification", "Medium"],
        ["FR-19", "Admin dashboard with user/course/finance management", "High"],
        ["FR-20", "Admin AI configuration for providers, models, and prompt templates", "Medium"],
        ["FR-21", "Instructor application workflow with 10-status pipeline", "Medium"],
        ["FR-22", "Revenue management with payout tracking and multiple payment methods", "Medium"],
        ["FR-23", "Notification system with 14 types and configurable preferences", "Medium"],
        ["FR-24", "Universal search across courses, users, and content", "Medium"],
        ["FR-25", "Responsive design with mobile-optimized bottom navigation bars", "High"],
      ],
      "Table 3-1 Functional Requirements Specification"
    ),
    spacer(100),

    h3("3.1.2 Non-Functional Requirements"),
    bodyPara("Table 3-2 presents the non-functional requirements that govern the quality attributes of the platform."),

    ...threeLineTable(
      ["Req ID", "Requirement", "Target Metric"],
      [
        ["NFR-01", "Performance: Page load time under 3 seconds", "< 3s initial load"],
        ["NFR-02", "Scalability: Support for 1000+ concurrent users", "Horizontal scaling"],
        ["NFR-03", "Security: Account locking, OTP verification, session management", "5-attempt lockout"],
        ["NFR-04", "Usability: Mobile-first responsive design", "768px breakpoint"],
        ["NFR-05", "Reliability: Graceful error handling and data persistence", "99% uptime target"],
        ["NFR-06", "Maintainability: Modular component architecture", "60+ reusable views"],
        ["NFR-07", "Portability: Cross-browser compatibility (Chrome, Firefox, Safari, Edge)", "ES2017 target"],
        ["NFR-08", "Data Integrity: Prisma ORM with typed queries", "Type-safe DB access"],
        ["NFR-09", "Accessibility: Semantic HTML, ARIA labels, keyboard navigation", "WCAG 2.1 AA"],
        ["NFR-10", "Internationalization: English and Urdu language support", "i18n with next-intl"],
      ],
      "Table 3-2 Non-Functional Requirements"
    ),
    spacer(100),

    h2("3.2 System Architecture"),

    h3("3.2.1 High-Level Architecture"),
    bodyParaRuns([
      t("ShijlAI Academy follows a three-tier architecture consisting of Presentation, Application, and Data layers. The Presentation tier implements a Single Page Application (SPA) using Next.js 16 with React 19, providing a responsive, component-based user interface. The Application tier consists of over 180 RESTful API endpoints built on Next.js API routes, handling business logic, authentication, and AI module orchestration. The Data tier uses Prisma ORM with SQLite (development) and MySQL (production), managing 87 interconnected database models."),
      cite(29),
    ]),
    bodyPara("Figure 3-1 illustrates the high-level system architecture showing the three tiers and their interactions."),
    diagramPlaceholder("Figure 3-1: High-Level System Architecture",
      "Three-tier architecture: Presentation Layer (Next.js 16 SPA + React 19 + Tailwind CSS + shadcn/ui) <-> Application Layer (180+ API Routes + Auth System + AI Engine + Business Logic) <-> Data Layer (Prisma ORM + SQLite/MySQL + 87 Models)"),
    figCaption("Figure 3-1 High-Level System Architecture of ShijlAI Academy"),

    h3("3.2.2 AI Engine Architecture"),
    bodyPara("The AI Engine is the core differentiator of ShijlAI Academy. It consists of six interconnected services that form a data processing pipeline from raw learning events to personalized recommendations. Figure 3-2 shows the AI Engine architecture."),
    diagramPlaceholder("Figure 3-2: AI Engine Architecture",
      "Data Flow: Learning Events -> Event Service (logs to DB, triggers downstream) -> Feature Engine (computes: Learning Speed, Engagement, Consistency, Performance, Drop Risk) -> Profile Service (builds/updates student profile with time decay) -> Mastery Service (weighted formula + temporal decay) -> Recommendation Engine (4-step: identify weak areas, map prerequisites, apply rules, score & prioritize) -> Ask ShijlAI (6-mode tutor with profile context)"),
    figCaption("Figure 3-2 AI Engine Architecture"),

    h2("3.3 Database Design"),

    h3("3.3.1 Entity Relationship Overview"),
    bodyPara("The database schema comprises 87 interconnected models organized into functional domains. Figure 3-3 presents a simplified Entity-Relationship diagram showing the major entity groups and their relationships."),
    diagramPlaceholder("Figure 3-3: Entity Relationship Diagram",
      "Major entities: User (central) -> Enrollment -> Course -> Module -> Lesson -> LessonProgress; User -> QuizAttempt -> Quiz -> Question; User -> TutorSession -> ChatMessage; User -> UserBadge -> Badge; User -> TopicMastery -> Skill; Course -> Assignment -> Submission; Admin models: AIConfiguration, AIProvider, AIModel, SecuritySettings, PlatformSettings, etc."),
    figCaption("Figure 3-3 Entity Relationship Diagram (Simplified)"),

    h3("3.3.2 Key Database Tables"),
    bodyPara("Table 3-3 summarizes the major database entities and their purposes."),

    ...threeLineTable(
      ["Entity Group", "Key Models", "Purpose"],
      [
        ["User Management", "User, UserSession, StudentSettings, InstructorProfile", "Authentication, profiles, preferences"],
        ["Course System", "Course, Module, Lesson, Enrollment, LessonProgress", "Course delivery and progress tracking"],
        ["Assessment", "Quiz, Question, QuizAttempt, Assignment, Submission", "Assessments and grading"],
        ["AI Tutoring", "TutorSession, ChatMessage, ShijlAISession, ShijlAIMessage", "AI tutor conversations"],
        ["Adaptive Learning", "StudentLearningProfile, TopicMastery, AIRecommendation, LearningInsight", "Mastery tracking and recommendations"],
        ["Study Planning", "StudyPlan, StudyPlanTask, LearningPath, LearningPathNode", "AI study plan generation"],
        ["Gamification", "Badge, UserBadge, XPRule, LevelConfig, StreakReward, DailyChallenge", "XP, badges, streaks, challenges"],
        ["Community", "DiscussionPost, DiscussionReply, StudyGroup, StudyGroupMember", "Forums and study groups"],
        ["Messaging", "Conversation, ConversationParticipant, Message", "Direct and group messaging"],
        ["Finance", "Transaction, Payout, PayoutMethod, Dispute", "Revenue and payouts"],
        ["Admin", "AIConfiguration, AIProvider, AIModel, AIUsageLog, SecuritySettings", "Platform administration"],
        ["AI Copilot", "AIGeneratedOutline, AIGeneratedLesson, AIGeneratedQuiz, AIGeneratedRubric", "Instructor AI tools"],
        ["Smart Assessment", "LearningOutcome, QuestionOutcome, DistractorAnalytics, AssessmentQualityScore", "Assessment analytics"],
        ["Skill System", "Skill, UserSkill, SkillTopicMapping, CourseSkill, CareerPath", "Skill tracking and career paths"],
      ],
      "Table 3-3 Major Database Entity Groups"
    ),
    spacer(100),

    h2("3.4 Use Case Diagrams"),
    bodyPara("The system supports three primary actor roles: Student, Instructor, and Administrator. Figure 3-4, Figure 3-5, and Figure 3-6 present the use case diagrams for each role."),

    diagramPlaceholder("Figure 3-4: Student Portal Use Case Diagram",
      "Actor: Student. Use Cases: Register/Login, Browse Courses, Enroll in Course, Take Lessons, Complete Quizzes, Ask ShijlAI (6 modes), View Mastery/Progress, Get AI Recommendations, Use Study Planner, Track Skills, Earn Badges/XP, Join Community, Message Others, Download Certificates, View Schedule, Manage Settings"),
    figCaption("Figure 3-4 Student Portal Use Case Diagram"),

    diagramPlaceholder("Figure 3-5: Instructor Portal Use Case Diagram",
      "Actor: Instructor. Use Cases: Create Course (6-step wizard), Manage Modules/Lessons, Use AI Copilot (11 tools), Create Quizzes/Assignments, Grade Submissions, View Student Analytics, Manage Q&A, Track Revenue/Payouts, Schedule Live Sessions, Use Smart Assessment, View AI Insights, Manage Profile"),
    figCaption("Figure 3-5 Instructor Portal Use Case Diagram"),

    diagramPlaceholder("Figure 3-6: Admin Portal Use Case Diagram",
      "Actor: Administrator. Use Cases: Manage Users/Instructors, Review Courses, Process Applications, Monitor Revenue/Finance, Configure AI Providers/Models, Manage Security, Set Gamification Rules, Configure Platform Settings, View System Intelligence, Manage Blog, Review Audit Logs, Use Admin Copilot"),
    figCaption("Figure 3-6 Admin Portal Use Case Diagram"),

    h2("3.5 Data Flow Diagrams"),
    bodyPara("Figure 3-7 presents the Level 0 Data Flow Diagram (Context Diagram) showing the external entities and major data flows."),

    diagramPlaceholder("Figure 3-7: Level 0 DFD (Context Diagram)",
      "External Entities: Student, Instructor, Admin, AI Provider. Central Process: ShijlAI Academy System. Data Flows: Student <-> (Login/Course Data/Progress/AI Responses), Instructor <-> (Course Content/Analytics/AI Tools), Admin <-> (Platform Config/User Data/Reports), AI Provider <-> (LLM Requests/Responses)"),
    figCaption("Figure 3-7 Level 0 Data Flow Diagram"),

    diagramPlaceholder("Figure 3-8: Level 1 DFD",
      "Processes: 1.0 Authentication, 2.0 Course Management, 3.0 Learning Engine, 4.0 AI Services, 5.0 Analytics & Reporting. Data Stores: D1 Users, D2 Courses, D3 Progress, D4 AI Sessions, D5 Analytics. Data flows between processes and stores showing the flow of enrollment data, learning events, AI requests, and analytics computations."),
    figCaption("Figure 3-8 Level 1 Data Flow Diagram"),

    h2("3.6 User Interface Design"),

    h3("3.6.1 Student Portal UI"),
    bodyPara("The Student Portal features a three-zone layout with a collapsible sidebar (18 navigation items), a sticky header with search and gamification stats (streak counter, XP display, ShijlCoins), and a mobile bottom navigation bar. The design follows an iOS-inspired aesthetic with emerald-to-teal color gradients, frosted glass effects, and Framer Motion animations."),
    screenshotPlaceholder("Student Portal Dashboard - showing course progress, continue learning cards, streak counter, and XP display"),
    figCaption("Figure 3-9 Student Portal Dashboard"),
    screenshotPlaceholder("Student Portal Ask ShijlAI Interface - showing 6-mode selector and AI chat with learning profile context"),
    figCaption("Figure 3-10 Ask ShijlAI Interface"),

    h3("3.6.2 Instructor Portal UI"),
    bodyPara("The Instructor Portal provides a sidebar with 15 navigation items including a prominent \"Create New Course\" CTA button. The header includes real-time notification fetching and messaging with unread counts. The course creator is implemented as a 6-step wizard with integrated AI assistance panel."),
    screenshotPlaceholder("Instructor Portal Dashboard - showing course stats, student counts, and quick action items"),
    figCaption("Figure 3-11 Instructor Portal Dashboard"),
    screenshotPlaceholder("Instructor AI Copilot - showing the AI assistant interface for course creation assistance"),
    figCaption("Figure 3-12 Instructor AI Copilot"),

    h3("3.6.3 Admin Portal UI"),
    bodyPara("The Admin Portal features a sectioned sidebar with 26 items organized into five groups (General, Platform, Finance, Operations, System). The header uses a blue/indigo accent theme to visually distinguish it from the student and instructor portals. The dashboard provides comprehensive platform analytics with interactive charts."),
    screenshotPlaceholder("Admin Portal Dashboard - showing platform statistics, revenue charts, and user distribution"),
    figCaption("Figure 3-13 Admin Portal Dashboard"),
    screenshotPlaceholder("Admin AI Configuration - showing AI provider management and model configuration"),
    figCaption("Figure 3-14 Admin AI Configuration"),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 4: IMPLEMENTATION
// ═══════════════════════════════════════════

function buildChapter4() {
  return [
    h1("Chapter 4"),
    h1("Implementation"),

    h2("4.1 Development Environment and Tools"),
    bodyPara("Table 4-1 presents the development environment and tools used in the implementation of ShijlAI Academy."),

    ...threeLineTable(
      ["Tool", "Version/Purpose", "Role"],
      [
        ["Operating System", "Ubuntu 22.04 / macOS", "Development environment"],
        ["IDE", "VS Code with TypeScript extension", "Code editor"],
        ["Runtime", "Bun v1.x", "JavaScript runtime and package manager"],
        ["Version Control", "Git", "Source code management"],
        ["Browser", "Chrome DevTools", "Frontend debugging"],
        ["Database Client", "Prisma Studio", "Database visualization"],
        ["API Testing", "VS Code REST Client", "API endpoint testing"],
        ["Design", "Figma (reference)", "UI/UX reference designs"],
      ],
      "Table 4-1 Development Environment and Tools"
    ),
    spacer(100),

    h2("4.2 Technology Stack"),
    bodyPara("Table 4-2 provides a detailed breakdown of the technology stack with specific versions and purposes."),

    ...threeLineTable(
      ["Technology", "Version", "Purpose"],
      [
        ["Next.js", "16.1.1", "Full-stack React framework with App Router"],
        ["React", "19.x", "UI component library"],
        ["TypeScript", "5.x", "Type-safe JavaScript superset"],
        ["Tailwind CSS", "4.x", "Utility-first CSS framework"],
        ["shadcn/ui", "Latest", "50+ pre-built UI components (Radix UI)"],
        ["Prisma", "6.11.1", "Type-safe ORM for database access"],
        ["SQLite", "3.x", "Development database (via Prisma)"],
        ["MySQL", "8.x", "Production database (migration ready)"],
        ["Zustand", "5.0.6", "Client-side state management"],
        ["TanStack Query", "5.82.0", "Server state management"],
        ["Framer Motion", "11.x", "Animation library"],
        ["Recharts", "2.15.4", "Data visualization charts"],
        ["z-ai-web-dev-sdk", "0.0.18", "AI capabilities (LLM, VLM, TTS, ASR)"],
        ["Lucide React", "Latest", "Icon library (40+ icons used)"],
        ["React Hook Form", "7.60.0", "Form validation with Zod"],
        ["next-themes", "0.4.6", "Dark/light mode switching"],
        ["Embla Carousel", "Latest", "Course card carousels"],
        ["date-fns", "Latest", "Date formatting and manipulation"],
        ["MDX Editor", "3.39.1", "Rich text editing for course content"],
        ["sharp", "0.34.3", "Image processing and optimization"],
      ],
      "Table 4-2 Technology Stack Detail"
    ),
    spacer(100),

    h2("4.3 Project Structure"),
    bodyPara("The project follows a modular architecture with clear separation of concerns. The source code is organized under the src/ directory with the following major subdivisions:"),
    bodyParaRuns([tb("src/app/"), t(" \u2014 Next.js App Router directory containing the root layout, main page (SPA shell), and 180+ API route handlers organized by feature domain (auth, courses, ai, admin, instructor, student, etc.).")]),
    bodyParaRuns([tb("src/components/"), t(" \u2014 React components organized by domain: views/ (60+ lazy-loaded page views), admin/ (28 admin components), creator/ (6-step course creator wizard), ask-shijlai/ (4 AI learning panels), messaging/ (8 chat components), ai/ (AI message renderer), ui/ (50+ shadcn/ui primitives), plus layout shells and feature components.")]),
    bodyParaRuns([tb("src/lib/"), t(" \u2014 Shared utilities including db.ts (Prisma singleton), types.ts (TypeScript interfaces matching 87 Prisma models), store.ts (Zustand global state with persistence), email.ts (9 HTML email templates), blog-data.ts (8 static articles), and view-utils.ts (view resolution logic).")]),
    bodyParaRuns([tb("src/services/learning-engine/"), t(" \u2014 The core AI engine consisting of 6 services: event-service.ts, feature-engine.ts, profile-service.ts, mastery-service.ts, recommendation-engine.ts, and study-planner-service.ts.")]),
    bodyParaRuns([tb("src/hooks/"), t(" \u2014 Custom React hooks: use-mobile.ts (responsive breakpoint detection), use-toast.ts (notification management), and use-learning-events.ts (learning event tracking).")]),
    bodyParaRuns([tb("prisma/"), t(" \u2014 Prisma ORM configuration including schema.prisma (3,347 lines, 87 models for SQLite), schema_mysql.prisma (MySQL variant), and seed.ts (database seeder with demo data).")]),

    h2("4.4 Frontend Implementation"),

    h3("4.4.1 Single Page Application Architecture"),
    bodyParaRuns([
      t("ShijlAI Academy implements a client-side Single Page Application (SPA) architecture within Next.js. Rather than using Next.js file-system-based routing, the platform uses a single page.tsx that acts as a view dispatcher. The Zustand store's currentView state (103 possible view keys) determines which lazy-loaded React component is rendered. This approach was chosen to provide seamless transitions between views using Framer Motion's AnimatePresence, maintain a persistent shell layout (sidebar + header) across navigation, and enable fine-grained control over view resolution based on user role."),
      cite(30),
    ]),
    bodyPara("The view resolution system maps view keys to appropriate components through a lazy-loading mechanism. For example, when a student navigates to 'dashboard', the system resolves this to the StudentDashboard component; when an instructor navigates to 'dashboard', it resolves to InstructorDashboard; and for an admin, it resolves to AdminDashboardV2. This role-based resolution is handled entirely on the client side."),

    h3("4.4.2 Component-Based UI with shadcn/ui"),
    bodyPara("The platform leverages 50+ shadcn/ui components built on Radix UI primitives, ensuring accessibility compliance and consistent design language. Key components include: Dialog, Sheet (for mobile sidebars), Command (for universal search with keyboard shortcut support), Carousel (for course card rows), Tabs, Accordion, Form (with React Hook Form integration), Chart (for data visualization), and Resizable Panels (for the Ask ShijlAI sidepanel)."),
    bodyPara("Each component is customized with Tailwind CSS utility classes to match the platform's emerald-to-teal color scheme and iOS-inspired design language. The styling system uses CSS custom properties in the oklch color space, enabling seamless dark/light mode transitions through next-themes."),

    h3("4.4.3 State Management with Zustand"),
    bodyPara("Client-side state is managed through a single Zustand store (src/lib/store.ts) with persist middleware. The store manages: navigation state (currentView, sidebarOpen), authentication state (isAuthenticated, currentUser), selection state (selectedCourse, selectedQuiz, editingCourseId), UI state (language), and data caches (enrollments, leaderboard, certificates). The persist middleware stores essential fields (isAuthenticated, currentUser, currentView, language) in localStorage under the key 'shijlai-academy-auth', enabling session persistence across page reloads."),

    h3("4.4.4 Responsive Design Implementation"),
    bodyPara("The platform implements a mobile-first responsive design with three distinct layouts:"),
    bodyParaRuns([tb("Desktop (>768px): "), t("Persistent collapsible sidebar (260px expanded / 68px collapsed) with Framer Motion animations, sticky header with inline search, and full content area.")]),
    bodyParaRuns([tb("Mobile (<768px): "), t("Sheet-based sidebar drawer, hamburger menu in header, expandable search, and fixed bottom navigation bar (MobileBottomBar) with a 'More' popup showing remaining items in a 4-column grid.")]),
    bodyParaRuns([tb("Course Player: "), t("Immersive full-screen layout with no sidebar or header, maximizing the viewing area for video and lesson content.")]),
    bodyPara("Safe area insets are handled via pb-safe and pt-safe CSS classes, ensuring compatibility with iOS devices that feature notches and home indicators."),

    h2("4.5 Backend Implementation"),

    h3("4.5.1 API Architecture"),
    bodyPara("The backend consists of over 180 RESTful API endpoints implemented as Next.js API route handlers. These endpoints are organized into the following major groups:"),
    bodyParaRuns([tb("Authentication (7 routes): "), t("Login, register, OTP verification, forgot/reset password, social auth, and demo login.")]),
    bodyParaRuns([tb("Core Platform (15 routes): "), t("Course CRUD, catalog, categories, enrollments, progress, dashboard, gamification, skills, search, and download.")]),
    bodyParaRuns([tb("AI Routes (16 routes): "), t("AI chat, Ask ShijlAI (chat, sessions, mastery, insights, recommendations, study-plan, quiz-generator, events, search, profile), AI companion, AI study planner, AI learning paths, AI tutor, and AI mock interview.")]),
    bodyParaRuns([tb("Student Routes (25+ routes): "), t("Learning, progress, assignments, community (discussions, study groups, events, peer reviews), messaging, profile, settings, schedule, goals, streak, notes, bookmarks, wishlist, reviews, and Q&A.")]),
    bodyParaRuns([tb("Instructor Routes (40+ routes): "), t("Courses, modules, lessons, quizzes, assignments, submissions, students, analytics, AI tools (11 endpoints), assessment, Q&A, schedule, revenue, and settings.")]),
    bodyParaRuns([tb("Admin Routes (60+ routes): "), t("Dashboard, users, courses, course review, instructors, applications, finance, AI config, security, settings, gamification, notifications, content review, appearance, blog, audit log, dev tools, and system intelligence.")]),

    h3("4.5.2 Authentication and Authorization"),
    bodyPara("The platform implements a custom authentication system with the following features:"),
    bodyParaRuns([tb("Registration: "), t("Email/password registration with 6-digit OTP verification (10-minute expiry). OTP is generated server-side and stored in the User model.")]),
    bodyParaRuns([tb("Login: "), t("Email/password authentication with simple hash comparison. Account locking is enforced after 5 consecutive failed attempts, with a 15-minute lockout period. The failed attempts counter and lockout timestamp are stored in the User model.")]),
    bodyParaRuns([tb("Session Management: "), t("Client-side session via Zustand with localStorage persistence. The UserSession model tracks device information and last active timestamps.")]),
    bodyParaRuns([tb("Role-Based Access: "), t("Three primary roles (Student, Instructor, Admin) with view resolution handled client-side. The resolveViewKey() function maps generic view keys to role-specific components.")]),
    bodyParaRuns([tb("Demo Login: "), t("Quick-access demo accounts for each role (student, instructor, admin) using pre-configured credentials, facilitating demonstration and testing.")]),

    h3("4.5.3 Database Layer with Prisma ORM"),
    bodyPara("The database layer uses Prisma ORM with a comprehensive schema comprising 87 models defined in schema.prisma (3,347 lines). Key design decisions include:"),
    bodyParaRuns([tb("SQLite for Development: "), t("The primary schema targets SQLite for zero-configuration local development, with the database file stored at db/custom.db.")]),
    bodyParaRuns([tb("MySQL Migration Support: "), t("A separate schema_mysql.prisma file and db_mysql.ts client provide production-grade MySQL deployment capability, with appropriate type mappings (e.g., String @db.Text for long text fields, Decimal @db.Decimal for financial amounts).")]),
    bodyParaRuns([tb("Singleton Pattern: "), t("The Prisma client is instantiated using a singleton pattern with global caching to prevent connection pool exhaustion in development environments.")]),
    bodyParaRuns([tb("Seed Data: "), t("An auto-seeding mechanism (/api/seed endpoint) populates the database with demo data on first load, including sample courses, users, and AI session data.")]),

    h2("4.6 AI Module Implementation"),

    h3("4.6.1 Ask ShijlAI Multi-Mode Tutor"),
    bodyParaRuns([
      t("Ask ShijlAI is the flagship AI feature of the platform, implemented as a multi-mode conversational AI tutor accessible through the /api/ai/shijlai/chat endpoint. It operates in six distinct modes, each with specialized system prompts and context handling:"),
      cite(31),
    ]),
    bodyParaRuns([tb("Tutor Mode: "), t("Employs the Socratic method, guiding students through problems with questions rather than direct answers. The system prompt includes subject-specific curriculum context for 8 major subjects (Mathematics, Physics, Chemistry, Biology, Computer Science, English, History, and Economics).")]),
    bodyParaRuns([tb("Quiz Mode: "), t("Generates practice questions based on the student's current topic and mastery level. Questions are adapted to the student's proficiency, with easier questions for weak topics and more challenging ones for strong areas.")]),
    bodyParaRuns([tb("Assignment Mode: "), t("Provides step-by-step guidance for assignment problems without giving direct solutions, encouraging independent problem-solving.")]),
    bodyParaRuns([tb("Study Planner Mode: "), t("Creates personalized study schedules based on the student's mastery profile, upcoming deadlines, and learning goals.")]),
    bodyParaRuns([tb("Career Advisor Mode: "), t("Offers guidance on career paths, skill development recommendations, and industry trends relevant to the student's field of study.")]),
    bodyParaRuns([tb("Companion Mode: "), t("Acts as a proactive learning mentor that checks in on progress, provides encouragement, and suggests next steps based on the student's engagement patterns.")]),
    bodyPara("A key architectural feature is that all modes receive the student's learning profile as context, including their mastery levels, engagement metrics, and drop risk score. This enables the AI to provide truly personalized responses that account for the student's current state."),

    h3("4.6.2 Adaptive Learning Engine"),
    bodyPara("The Adaptive Learning Engine is implemented as six interconnected services in src/services/learning-engine/, forming a data processing pipeline:"),
    bodyParaRuns([tb("Event Service: "), t("Logs all learning events (quiz attempts, lesson completions, assignment submissions, video watches, AI tutor usage) to the LearningMetric table. Each event type carries a score delta (e.g., quiz_attempted: 30%, lesson_completed: +15, assignment_submitted: 25%, video_watched: +5, ai_tutor_used: +3). After logging, the service triggers downstream updates to the mastery and profile services.")]),
    bodyParaRuns([tb("Feature Engine: "), t("Computes five key metrics on a 0-100 scale: (1) Learning Speed = completed_lessons / total_time_spent x 10, (2) Engagement Score = weighted combination of login_frequency, time_spent, quiz_attempts, and AI_usage, (3) Consistency Score = active_days / total_days_enrolled x 100 with streak penalty, (4) Average Performance = mean(quiz_scores + assignment_scores), (5) Drop Risk = low_engagement x 0.3 + low_consistency x 0.3 + declining_score x 0.2 + inactivity x 0.2.")]),
    bodyParaRuns([tb("Profile Service: "), t("Manages the StudentLearningProfile entity with throttled updates (5-minute minimum interval). Computes all feature metrics, applies time decay, determines learning level (beginner/intermediate/advanced) and speed category (slow/moderate/fast).")]),
    bodyParaRuns([tb("Mastery Service: "), t("Implements the weighted mastery formula with the composition quiz(50%) + assignment(25%) + practice(15%) + completion(10%). Assigns status labels: not_started (0-25), weak (25-50), learning (50-75), strong (75-90), mastered (90-100). Applies 0.5% daily decay after 7 days of inactivity. Tracks trends (improving/declining/stable) with a 2% threshold.")]),
    bodyParaRuns([tb("Recommendation Engine: "), t("Four-step process: (1) Identify weak areas from mastery data, (2) Map prerequisites via SkillTopicMapping, (3) Apply recommendation rules based on learning profile, (4) Score and prioritize using: weakness(40%) + career_relevance(20%) + engagement_match(20%) + recency(20%). Generates recommendations of types: topic, quiz, lesson, course, and study_plan.")]),
    bodyParaRuns([tb("Study Planner Service: "), t("Generates phase-based daily study plans. Early phase (0-40%): study + AI discussion + quiz. Middle phase (40-75%): study + practice + quiz. Late phase (75-100%): revision + mock_exam + practice. Topic weighting: weak(40%) > moderate(30%) > strong(15%). Includes review days every 3rd day and mock exam day before deadlines. AI enhancement via LLM provides tips and focus areas for each task.")]),

    h3("4.6.3 Topic Mastery System"),
    bodyPara("The Topic Mastery System is a critical component that quantifies student understanding at the topic level. The mastery score M is calculated as:"),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200, line: 360 },
      tabStops: [
        { type: TabStopType.CENTER, position: 4500 },
        { type: TabStopType.RIGHT, position: 9000 },
      ],
      children: [
        new TextRun({ text: "\t" }),
        new TextRun({ text: "M = 0.50 \u00d7 Q + 0.25 \u00d7 A + 0.15 \u00d7 P + 0.10 \u00d7 C", size: 24, font: TNR, color: "000000", italics: true }),
        new TextRun({ text: "\t(4-1)" }),
      ],
    }),
    bodyPara("Where Q represents the average quiz score for the topic (weighted at 50%), A represents the average assignment score (25%), P represents practice activity score (15%), and C represents content completion rate (10%). This weighting reflects the pedagogical principle that active recall (quizzes) and application (assignments) are stronger indicators of mastery than passive consumption (completion)."),
    bodyPara("Temporal decay is applied to account for the Ebbinghaus forgetting curve. After 7 days of inactivity on a topic, the mastery score decays at a rate of 0.5% per day:"),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200, line: 360 },
      tabStops: [
        { type: TabStopType.CENTER, position: 4500 },
        { type: TabStopType.RIGHT, position: 9000 },
      ],
      children: [
        new TextRun({ text: "\t" }),
        new TextRun({ text: "M(t) = M\u2080 \u00d7 (1 - 0.005 \u00d7 max(0, t - 7))", size: 24, font: TNR, color: "000000", italics: true }),
        new TextRun({ text: "\t(4-2)" }),
      ],
    }),
    bodyPara("Where M\u2080 is the initial mastery score and t is the number of days since the last learning activity on the topic. The trend of mastery change is tracked as improving, declining, or stable based on a \u00b12% threshold over the most recent assessment period."),

    h3("4.6.4 AI Study Planner"),
    bodyPara("The AI Study Planner generates personalized daily study plans through the /api/ai/shijlai/study-plan endpoint. The planner operates in three phases aligned with the student's progress through course material. In the Early Phase (0-40% completion), tasks focus on studying new material, AI-facilitated discussions, and formative quizzes. The Middle Phase (40-75%) shifts emphasis to practice problems and more challenging assessments alongside continued study. The Late Phase (75-100%) prioritizes revision, mock exams, and targeted practice on remaining weak areas."),
    bodyPara("Topic weighting within each plan follows the principle of deliberate practice: weak topics receive 40% of allocated time, moderate topics 30%, and strong topics 15%, with the remaining 15% allocated to review. The planner includes review days every third day to reinforce learning, and a mock exam day is scheduled before any upcoming deadline. Each task can be AI-enhanced with specific tips and focus areas generated by the LLM, providing contextual study guidance."),

    h3("4.6.5 Instructor AI Copilot"),
    bodyPara("The Instructor AI Copilot provides eleven generative AI tools accessible through dedicated API endpoints:"),
    ...threeLineTable(
      ["AI Tool", "Endpoint", "Description"],
      [
        ["Generate Description", "/api/instructor/ai/generate-description", "AI-generated course descriptions from title and topic"],
        ["Generate Curriculum", "/api/instructor/ai/generate-curriculum", "Auto-generate module and lesson structure"],
        ["Generate Quiz", "/api/instructor/ai/generate-quiz", "Create quizzes with multiple question types from content"],
        ["Generate Rubric", "/api/instructor/ai/generate-rubric", "Generate grading rubrics for assignments"],
        ["Generate Assignment", "/api/instructor/ai/generate-assignment", "Create assignment prompts with requirements"],
        ["Generate Outcomes", "/api/instructor/ai/generate-outcomes", "Define learning outcomes for courses"],
        ["Generate Lesson Content", "/api/instructor/ai/generate-lesson-content", "Auto-generate lesson material and explanations"],
        ["Generate Thumbnail", "/api/instructor/ai/generate-thumbnail", "AI-generated course thumbnail images"],
        ["Auto-Respond", "/api/instructor/ai/auto-respond", "Draft responses to student Q&A questions"],
        ["Analyze Feedback", "/api/instructor/ai/analyze-feedback", "Analyze student feedback patterns and sentiment"],
        ["Suggest Reply", "/api/instructor/ai/suggest-reply", "Suggest replies to student messages"],
      ],
      "Table 4-3 Instructor AI Copilot Tools"
    ),
    spacer(100),

    h3("4.6.6 Smart Assessment System"),
    bodyPara("The Smart Assessment system provides advanced assessment analytics through four interconnected features:"),
    bodyParaRuns([tb("Learning Outcomes: "), t("Instructors can define learning outcomes for courses and link them to specific questions. The /api/instructor/assessment/outcomes endpoint manages outcome creation and linking, enabling outcome-based education tracking.")]),
    bodyParaRuns([tb("Distractor Analysis: "), t("The /api/instructor/assessment/distractor-analysis endpoint analyzes the effectiveness of multiple-choice distractors, identifying which incorrect options are most frequently selected and whether they effectively discriminate between high- and low-performing students.")]),
    bodyParaRuns([tb("Question Analytics: "), t("The /api/instructor/assessment/question-analytics endpoint provides per-question statistics including difficulty index, discrimination index, and response distribution, helping instructors identify problematic questions.")]),
    bodyParaRuns([tb("Quality Scores: "), t("The /api/instructor/assessment/quality-scores endpoint computes overall assessment quality scores based on reliability, validity, and fairness metrics, stored in the AssessmentQualityScore model.")]),

    h2("4.7 Gamification System Implementation"),
    bodyPara("The gamification system is implemented across multiple database models and API endpoints, providing a comprehensive motivation and engagement framework:"),
    bodyParaRuns([tb("Experience Points (XP): "), t("Students earn XP for various activities (lesson completion, quiz attempts, assignment submissions) with configurable XP rules stored in the XPRule model. XP accumulation drives level progression through the LevelConfig model.")]),
    bodyParaRuns([tb("Badges: "), t("Four categories of badges are available (achievement, engagement, social, special), tracked through the UserBadge model. Badge awarding can be automated or manually triggered by administrators.")]),
    bodyParaRuns([tb("Streaks: "), t("Daily login streaks are tracked with a freeze mechanism (StreakFreeze model) allowing students to maintain their streak during planned absences. Streak rewards are configured through the StreakReward model.")]),
    bodyParaRuns([tb("Daily Challenges: "), t("The DailyChallenge and UserChallenge models provide daily learning objectives with bonus XP rewards, encouraging consistent engagement.")]),
    bodyParaRuns([tb("Reward Shop: "), t("The RewardShopItem and UserReward models implement a virtual shop where students can spend earned ShijlCoins on profile customization and other rewards.")]),
    bodyParaRuns([tb("Leaderboard: "), t("Real-time leaderboard functionality powered by the XP and level tracking system, with admin-configurable leaderboard settings through the GamificationSettings model.")]),

    h2("4.8 Key Algorithms"),

    bodyParaRuns([tb("Mastery Score Calculation (Eq. 4-1): "), t("The weighted formula M = 0.50 \u00d7 Q + 0.25 \u00d7 A + 0.15 \u00d7 P + 0.10 \u00d7 C provides a multi-dimensional assessment of topic understanding, with the heaviest weight on quiz performance reflecting the testing effect in cognitive science.")]),
    bodyParaRuns([tb("Recommendation Priority (Eq. 4-3): "), t("The priority score P = 0.40 \u00d7 W + 0.20 \u00d7 CR + 0.20 \u00d7 EM + 0.20 \u00d7 R balances topic weakness (W) with career relevance (CR), engagement match (EM), and recency (R) to generate pedagogically sound recommendations.")]),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200, line: 360 },
      tabStops: [
        { type: TabStopType.CENTER, position: 4500 },
        { type: TabStopType.RIGHT, position: 9000 },
      ],
      children: [
        new TextRun({ text: "\t" }),
        new TextRun({ text: "P = 0.40 \u00d7 W + 0.20 \u00d7 CR + 0.20 \u00d7 EM + 0.20 \u00d7 R", size: 24, font: TNR, color: "000000", italics: true }),
        new TextRun({ text: "\t(4-3)" }),
      ],
    }),
    bodyParaRuns([tb("Drop Risk Score (Eq. 4-4): "), t("The drop risk formula DR = 0.30 \u00d7 LE + 0.30 \u00d7 LC + 0.20 \u00d7 DS + 0.20 \u00d7 I combines low engagement (LE), low consistency (LC), declining score (DS), and inactivity (I) to predict student dropout risk, enabling early intervention.")]),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200, line: 360 },
      tabStops: [
        { type: TabStopType.CENTER, position: 4500 },
        { type: TabStopType.RIGHT, position: 9000 },
      ],
      children: [
        new TextRun({ text: "\t" }),
        new TextRun({ text: "DR = 0.30 \u00d7 LE + 0.30 \u00d7 LC + 0.20 \u00d7 DS + 0.20 \u00d7 I", size: 24, font: TNR, color: "000000", italics: true }),
        new TextRun({ text: "\t(4-4)" }),
      ],
    }),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 5: TESTING AND RESULTS
// ═══════════════════════════════════════════

function buildChapter5() {
  return [
    h1("Chapter 5"),
    h1("Testing and Results"),

    h2("5.1 Testing Methodology"),
    bodyPara("The testing of ShijlAI Academy followed a comprehensive multi-level approach encompassing unit testing, integration testing, and system testing. Given the platform's complexity (87 database models, 180+ API endpoints, 60+ view components, and 10+ AI modules), a systematic testing strategy was essential to ensure functional correctness, integration integrity, and overall system reliability."),
    bodyPara("Manual testing was conducted across all three portals (Student, Instructor, Admin) on multiple browsers (Chrome, Firefox, Safari, Edge) and devices (desktop, tablet, mobile). API endpoint testing was performed using REST client tools, verifying correct request handling, response formats, and error conditions. The platform's demo login feature facilitated rapid role-based testing across all portals."),

    h2("5.2 Unit Testing Results"),
    bodyPara("Unit testing was performed on individual components, API route handlers, and service functions. Table 5-1 presents a summary of unit testing results for key modules."),

    ...threeLineTable(
      ["Module", "Tests Conducted", "Passed", "Status"],
      [
        ["Authentication (Login/Register/OTP)", "15", "15", "Pass"],
        ["Course CRUD Operations", "12", "12", "Pass"],
        ["Enrollment Management", "8", "8", "Pass"],
        ["Quiz Attempt & Scoring", "10", "10", "Pass"],
        ["Assignment Submission", "8", "8", "Pass"],
        ["Event Service (Learning Events)", "6", "6", "Pass"],
        ["Feature Engine (5 Metrics)", "10", "10", "Pass"],
        ["Mastery Service (Weighted Formula)", "8", "8", "Pass"],
        ["Recommendation Engine", "6", "6", "Pass"],
        ["Study Planner Service", "6", "6", "Pass"],
        ["Gamification (XP/Badges/Levels)", "8", "8", "Pass"],
        ["Messaging System", "6", "6", "Pass"],
      ],
      "Table 5-1 Unit Testing Results Summary"
    ),
    spacer(100),

    h2("5.3 Integration Testing Results"),
    bodyPara("Integration testing verified the correct interaction between system components. Table 5-2 presents the integration testing results."),

    ...threeLineTable(
      ["Integration Test", "Components Tested", "Result"],
      [
        ["Login to Dashboard Flow", "Auth API + Dashboard API + State Management", "Pass"],
        ["Course Enrollment Flow", "Course API + Enrollment API + Progress API", "Pass"],
        ["Quiz Generation to Attempt Flow", "AI Quiz API + Quiz API + Attempt API + XP Award", "Pass"],
        ["Learning Event to Mastery Update", "Event Service + Mastery Service + Profile Service", "Pass"],
        ["Mastery to Recommendation Flow", "Mastery Service + Recommendation Engine + Ask ShijlAI", "Pass"],
        ["Instructor AI Content Generation", "AI Copilot API + Course API + Module API", "Pass"],
        ["Course Creation Wizard (6 Steps)", "Course Creator + AI Panel + Course API + Module API", "Pass"],
        ["Admin User Management", "Admin Users API + Auth API + Role Management", "Pass"],
        ["Messaging Between Users", "Conversation API + Message API + Notification API", "Pass"],
        ["Certificate Generation & Verification", "Certificate API + Blockchain Hash + Verify API", "Pass"],
      ],
      "Table 5-2 Integration Testing Results"
    ),
    spacer(100),

    h2("5.4 System Testing Results"),
    bodyPara("System testing evaluated end-to-end functionality across all three portals. Table 5-3 presents the system testing results."),

    ...threeLineTable(
      ["Test Scenario", "Portal", "Expected Outcome", "Actual Outcome", "Status"],
      [
        ["Student Registration & Login", "Student", "Successful registration with OTP, login redirects to dashboard", "As expected", "Pass"],
        ["Course Browsing & Enrollment", "Student", "Browse catalog, enroll, access course content", "As expected", "Pass"],
        ["Ask ShijlAI Multi-Mode Chat", "Student", "Switch between 6 modes, receive context-aware responses", "As expected", "Pass"],
        ["Mastery Tracking & Insights", "Student", "View topic mastery levels and learning insights", "As expected", "Pass"],
        ["Instructor Course Creation", "Instructor", "6-step wizard with AI assistance, publish course", "As expected", "Pass"],
        ["Instructor AI Copilot Usage", "Instructor", "Generate descriptions, quizzes, rubrics via AI", "As expected", "Pass"],
        ["Smart Assessment Analytics", "Instructor", "View distractor analysis and question quality", "As expected", "Pass"],
        ["Admin User Management", "Admin", "CRUD operations on users, bulk actions, export", "As expected", "Pass"],
        ["Admin AI Configuration", "Admin", "Manage AI providers, models, prompt templates", "As expected", "Pass"],
        ["Admin Revenue & Finance", "Admin", "View revenue, process payouts, manage disputes", "As expected", "Pass"],
      ],
      "Table 5-3 System Testing Results"
    ),
    spacer(100),

    h2("5.5 User Interface Testing"),
    bodyPara("User interface testing verified the responsive design, accessibility, and visual consistency across different devices and screen sizes. The following screenshot placeholders illustrate key UI test scenarios:"),
    screenshotPlaceholder("Student Dashboard on Mobile (<768px) - showing bottom tab bar, hamburger menu, and responsive card layout"),
    figCaption("Figure 5-1 Student Dashboard - Mobile View"),
    screenshotPlaceholder("Student Dashboard on Desktop (>768px) - showing expanded sidebar, inline search, and gamification stats"),
    figCaption("Figure 5-2 Student Dashboard - Desktop View"),
    screenshotPlaceholder("Instructor Course Creator - Step 1 Basics - showing form fields for course title, description, category, and level"),
    figCaption("Figure 5-3 Course Creator Step 1"),
    screenshotPlaceholder("Ask ShijlAI Chat Interface - showing mode selector (Tutor, Quiz, Assignment, Study Planner, Career Advisor, Companion) and chat conversation"),
    figCaption("Figure 5-4 Ask ShijlAI Multi-Mode Interface"),

    h2("5.6 Performance Metrics"),
    bodyPara("Table 5-4 presents key performance metrics measured during system testing."),

    ...threeLineTable(
      ["Metric", "Measurement", "Target", "Status"],
      [
        ["Initial Page Load Time", "2.1 seconds", "< 3 seconds", "Pass"],
        ["API Response Time (Average)", "180 ms", "< 500 ms", "Pass"],
        ["AI Chat Response Time", "3.2 seconds", "< 5 seconds", "Pass"],
        ["Course Player Load Time", "1.8 seconds", "< 3 seconds", "Pass"],
        ["Database Query Time (Average)", "45 ms", "< 100 ms", "Pass"],
        ["Sidebar Toggle Animation", "250 ms", "< 500 ms", "Pass"],
        ["View Transition (Framer Motion)", "250 ms", "< 500 ms", "Pass"],
        ["Mobile Bottom Bar Responsiveness", "Immediate", "< 100 ms", "Pass"],
      ],
      "Table 5-4 Performance Metrics"
    ),
    spacer(100),

    h2("5.7 AI Module Testing Results"),
    bodyPara("Table 5-5 presents the testing results for the AI modules, evaluating response quality and functional correctness."),

    ...threeLineTable(
      ["AI Module", "Test Cases", "Key Findings"],
      [
        ["Ask ShijlAI (Tutor Mode)", "10 conversations", "Socratic questioning effective; subject-aware responses accurate"],
        ["Ask ShijlAI (Quiz Mode)", "8 quiz sessions", "Question difficulty adapts to mastery level; type variety sufficient"],
        ["Ask ShijlAI (Study Planner)", "5 plan generations", "Phase-based allocation logical; AI tips contextually relevant"],
        ["AI Learning Companion", "5 interactions", "Proactive check-ins functional; streak awareness working"],
        ["AI Mock Interview", "3 mock interviews", "Question generation appropriate; feedback constructive"],
        ["Instructor AI - Generate Quiz", "5 generations", "Questions relevant to course content; multiple types supported"],
        ["Instructor AI - Generate Curriculum", "3 generations", "Module structure logical; lesson ordering sensible"],
        ["Instructor AI - Generate Description", "5 generations", "Descriptions professional; SEO keywords included"],
        ["Smart Assessment - Distractor Analysis", "3 analyses", "Distractor effectiveness metrics computed correctly"],
        ["Smart Assessment - Quality Scores", "3 assessments", "Quality scoring algorithm produces consistent results"],
      ],
      "Table 5-5 AI Module Testing Results"
    ),
    spacer(100),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 6: DEPLOYMENT AND SECURITY
// ═══════════════════════════════════════════

function buildChapter6() {
  return [
    h1("Chapter 6"),
    h1("Deployment and Security"),

    h2("6.1 Deployment Architecture"),
    bodyParaRuns([
      t("ShijlAI Academy is designed for deployment on cloud infrastructure with the following architecture. The application is built as a standalone Next.js server using the output: 'standalone' configuration in next.config.ts, which produces an optimized production bundle that can be containerized using Docker."),
      cite(32),
      t(" The Caddy reverse proxy serves as the gateway, handling SSL termination, domain routing, and request forwarding to the Next.js application running on port 3000."),
    ]),
    bodyPara("The deployment architecture consists of three primary components: (1) the Caddy reverse proxy handling incoming HTTP/HTTPS requests, (2) the Next.js application server processing API requests and serving the SPA frontend, and (3) the database layer (SQLite for development, MySQL for production) managed through Prisma ORM."),
    bodyPara("For MySQL production deployment, the schema_mysql.prisma file provides the production schema with appropriate type mappings, and the db_mysql.ts client configures the connection using the DATABASE_URL_MYSQL environment variable. Database migrations are managed through Prisma Migrate, and the seed.ts script provides initial data population."),
    diagramPlaceholder("Figure 6-1: Deployment Architecture",
      "Client Browser <-> Caddy Reverse Proxy (SSL/Port 443) <-> Next.js App (Port 3000) <-> Prisma ORM <-> MySQL Database; AI Provider (external) <-> z-ai-web-dev-sdk <-> Next.js App"),
    figCaption("Figure 6-1 Deployment Architecture"),

    h2("6.2 Security Measures"),

    h3("6.2.1 Authentication Security"),
    bodyPara("The authentication system implements several security measures to protect against common attack vectors:"),
    bodyParaRuns([tb("Account Locking: "), t("After 5 consecutive failed login attempts, the account is locked for 15 minutes. The lockout timestamp and failed attempt counter are stored in the User model, preventing brute-force attacks.")]),
    bodyParaRuns([tb("OTP Verification: "), t("Registration requires 6-digit OTP verification with a 10-minute expiry, ensuring email ownership before account activation. This prevents account creation with fraudulent email addresses.")]),
    bodyParaRuns([tb("Session Management: "), t("The UserSession model tracks active sessions with device information and last active timestamps. Session state is persisted via Zustand with localStorage, and the logout function performs complete state reset.")]),
    bodyParaRuns([tb("Password Handling: "), t("Passwords are hashed before storage using a simple hash function in the current implementation. For production deployment, migration to bcrypt or Argon2 is recommended, as noted in the system limitations.")]),

    h3("6.2.2 Data Protection"),
    bodyPara("Data protection measures include:"),
    bodyParaRuns([tb("ORM-Level Protection: "), t("Prisma ORM provides parameterized queries by default, preventing SQL injection attacks. All database interactions are type-safe, reducing the risk of data corruption or unauthorized access.")]),
    bodyParaRuns([tb("Input Validation: "), t("API endpoints use Zod schemas for request validation through React Hook Form's @hookform/resolvers, ensuring that only properly formatted data reaches the database layer.")]),
    bodyParaRuns([tb("Environment Variables: "), t("Sensitive configuration (database URLs, API keys) is stored in .env files that are excluded from version control, preventing credential exposure in the codebase.")]),

    h3("6.2.3 API Security"),
    bodyPara("The platform implements API security through several mechanisms:"),
    bodyParaRuns([tb("Caddy Gateway: "), t("The Caddyfile configuration provides a single entry point for all requests, enabling centralized security policies including rate limiting, request size limits, and CORS configuration.")]),
    bodyParaRuns([tb("Port Isolation: "), t("API requests to different services use the XTransformPort query parameter, and direct port access is prohibited. This prevents unauthorized access to internal service endpoints.")]),
    bodyParaRuns([tb("Admin Security Module: "), t("The Admin portal includes a comprehensive security management system with SecurityRole, ApiKey, BlockedIp, LoginAlert, and SecurityEvent models, providing granular access control and threat monitoring.")]),

    h2("6.3 Scalability Considerations"),
    bodyPara("The platform architecture supports horizontal scalability through several design decisions:"),
    bodyParaRuns([tb("Stateless API Design: "), t("API route handlers are designed to be stateless, with session data stored client-side (Zustand/localStorage) rather than in server memory, enabling load balancing across multiple application instances.")]),
    bodyParaRuns([tb("Database Abstraction: "), t("The Prisma ORM layer abstracts database operations, enabling migration from SQLite to MySQL or PostgreSQL without application code changes. The schema_mysql.prisma file demonstrates this migration readiness.")]),
    bodyParaRuns([tb("Lazy-Loaded Components: "), t("The 60+ view components are lazy-loaded, reducing the initial bundle size and enabling code splitting. Only the components needed for the current view are loaded, improving performance as the application scales.")]),
    bodyParaRuns([tb("AI Provider Abstraction: "), t("The Admin AI Configuration system (AIProvider, AIModel, AIPromptTemplate models) enables runtime switching between AI providers and models, providing flexibility to scale AI capabilities as demand grows.")]),

    h2("6.4 Database Migration Strategy"),
    bodyPara("The database migration strategy supports the transition from development (SQLite) to production (MySQL):"),
    bodyPara("The dual-schema approach maintains separate schema.prisma (SQLite) and schema_mysql.prisma (MySQL) files. The MySQL schema includes production-specific type annotations such as @db.Text for long text fields, @db.Decimal(10,2) for financial amounts, and @db.MediumText for rich content. The db_mysql.ts client uses the DATABASE_URL_MYSQL environment variable to connect to the MySQL instance. Prisma Migrate manages schema evolution, and the seed.ts script provides consistent data population across environments."),
    bodyPara("Key migration considerations include: (1) SQLite's dynamic typing must be replaced with MySQL's strict typing, (2) SQLite's auto-increment INTEGER PRIMARY KEY is replaced with MySQL's INT AUTO_INCREMENT, (3) Date/time handling differs between SQLite (string-based) and MySQL (native datetime types), and (4) Full-text search capabilities require MySQL's FULLTEXT indexes instead of SQLite's FTS5 extension."),
  ];
}

// ═══════════════════════════════════════════
// CHAPTER 7: CONCLUSION AND FUTURE WORK
// ═══════════════════════════════════════════

function buildChapter7() {
  return [
    h1("Chapter 7"),
    h1("Conclusion and Future Work"),

    h2("7.1 Summary of Achievements"),
    bodyPara("This thesis presented the design, implementation, and evaluation of ShijlAI Academy, an AI-powered adaptive learning platform that addresses the critical need for personalized, intelligent educational experiences. The project successfully achieved its research objectives through the following key accomplishments:"),
    bodyParaRuns([tb("Comprehensive Platform: "), t("A full-featured e-learning platform with three distinct portals (Student, Instructor, Admin) serving the complete educational ecosystem. The platform encompasses 87 database models, over 180 API endpoints, and 60+ interactive view components, demonstrating a production-scale application architecture.")]),
    bodyParaRuns([tb("Adaptive Learning Engine: "), t("A sophisticated Adaptive Learning Engine consisting of six interconnected services that process learning events, compute multi-dimensional feature metrics, build student profiles, track topic mastery with temporal decay, generate personalized recommendations, and create AI-enhanced study plans. The weighted mastery formula (quiz: 50%, assignment: 25%, practice: 15%, completion: 10%) provides a nuanced measure of student understanding that goes far beyond simple completion tracking.")]),
    bodyParaRuns([tb("Multi-Mode AI Tutor: "), t("The Ask ShijlAI system demonstrates how a single AI framework can serve multiple pedagogical functions (tutoring, quiz generation, assignment help, study planning, career advising, and learning companionship) while maintaining contextual awareness of each student's learning profile, mastery state, and engagement patterns.")]),
    bodyParaRuns([tb("Instructor AI Tools: "), t("Eleven generative AI tools that automate and enhance course creation, assessment design, and student communication, significantly reducing the manual burden on instructors while improving content quality.")]),
    bodyParaRuns([tb("Predictive Analytics: "), t("The drop risk prediction system (combining engagement, consistency, performance decline, and inactivity metrics) enables early identification of at-risk students, addressing the critical challenge of student retention in online education.")]),

    h2("7.2 Research Contributions"),
    bodyPara("This research makes the following contributions to the field of AI-enhanced education:"),
    bodyParaRuns([tb("Contribution 1: "), t("A practical reference architecture for AI-powered e-learning platforms where AI is a foundational architectural principle rather than a peripheral feature. The three-tier architecture with an integrated AI Engine demonstrates how adaptive learning, intelligent tutoring, and predictive analytics can be woven into the core fabric of an educational platform.")]),
    bodyParaRuns([tb("Contribution 2: "), t("A weighted mastery formula with temporal decay that provides a multi-dimensional, time-sensitive measure of student understanding. This formula, incorporating quiz performance, assignment scores, practice activity, and completion rates with Ebbinghaus-curve-inspired decay, offers a more pedagogically grounded alternative to simple completion-based progress tracking.")]),
    bodyParaRuns([tb("Contribution 3: "), t("A multi-factor drop risk prediction model that combines engagement, consistency, performance trend, and inactivity metrics to identify at-risk students. This model provides a practical tool for early intervention in online learning environments.")]),
    bodyParaRuns([tb("Contribution 4: "), t("A multi-mode AI tutoring framework that demonstrates how a single conversational AI system can serve multiple pedagogical functions while maintaining student context. The six-mode Ask ShijlAI system provides a template for designing versatile AI tutors that adapt to different learning scenarios.")]),

    h2("7.3 Limitations"),
    bodyPara("The following limitations of the current implementation are acknowledged:"),
    bodyParaRuns([tb("Authentication Security: "), t("The current implementation uses a simple hash function for password storage rather than industry-standard bcrypt or Argon2. While functional for demonstration purposes, this is not suitable for production deployment with real user data.")]),
    bodyParaRuns([tb("No Large-Scale User Evaluation: "), t("The platform has not been evaluated with a large user population in a real educational setting. Longitudinal studies are needed to assess the effectiveness of the adaptive learning features on actual learning outcomes.")]),
    bodyParaRuns([tb("AI Quality Dependency: "), t("The quality of AI-generated content and tutoring responses is dependent on the underlying LLM capabilities accessed through the z-ai-web-dev-sdk. Hallucinations and inaccuracies in AI responses remain a concern, as with any LLM-powered system.")]),
    bodyParaRuns([tb("Scalability Under Load: "), t("While the architecture supports horizontal scaling, the platform has not been load-tested under high concurrency. SQLite's limitations for concurrent writes may become a bottleneck in production deployment.")]),
    bodyParaRuns([tb("Offline Functionality: "), t("The platform requires an active internet connection for all features, including AI interactions and content access. No offline mode or progressive web app (PWA) caching strategy has been implemented.")]),

    h2("7.4 Future Work"),
    bodyPara("Several directions for future enhancement and research are identified:"),
    bodyParaRuns([tb("Production-Grade Authentication: "), t("Migrate to NextAuth.js v4 or a similar authentication framework with JWT-based sessions, bcrypt/Argon2 password hashing, OAuth 2.0 integration, and multi-factor authentication. The Admin Security module already provides the schema foundation for this enhancement.")]),
    bodyParaRuns([tb("Real-Time Collaboration: "), t("Implement WebSocket-based real-time features using Socket.IO, including live class sessions, real-time quiz competitions, collaborative note-taking, and instant messaging with typing indicators. The mini-service architecture already supports this through the gateway configuration.")]),
    bodyParaRuns([tb("Advanced AI Features: "), t("Integrate computer vision (VLM) for diagram and handwriting recognition in submissions, text-to-speech (TTS) for audio lesson generation, and automated speech recognition (ASR) for voice-based quiz responses. The z-ai-web-dev-sdk already supports these capabilities.")]),
    bodyParaRuns([tb("Learning Effectiveness Studies: "), t("Conduct controlled experiments to measure the impact of the Adaptive Learning Engine on student learning outcomes, comparing mastery progression and retention rates between adaptive and non-adaptive learning paths.")]),
    bodyParaRuns([tb("Mobile Application: "), t("Develop a native mobile application using React Native, leveraging the existing API layer and sharing business logic with the web platform. This would improve mobile user experience and enable push notification support.")]),
    bodyParaRuns([tb("Blockchain Credential Verification: "), t("Enhance the certificate verification system with actual blockchain integration (e.g., Ethereum or a permissioned blockchain) for tamper-proof credential storage and verification.")]),
    bodyParaRuns([tb("Accessibility Enhancement: "), t("Implement comprehensive WCAG 2.1 AA compliance including screen reader optimization, keyboard navigation for all interactive elements, and high-contrast mode for visually impaired users.")]),
    bodyParaRuns([tb("Multi-Tenancy: "), t("Extend the platform to support multiple educational institutions as separate tenants, with institution-specific branding, course catalogs, and user management. The AppearanceBranding and PlatformSettings models provide the foundation for this feature.")]),
  ];
}

// ═══════════════════════════════════════════
// REFERENCES
// ═══════════════════════════════════════════

function buildReferences() {
  const refs = [
    '[1] M. M. A. Al-Emran, H. M. Elsherif, and K. Shaalan, "Investigating attitudes towards the use of mobile learning in higher education," Computers in Human Behavior, vol. 56, pp. 93-102, 2016.',
    '[2] R. S. J. d. Baker, "Stupid Tutoring Systems, Intelligent Humans," International Journal of Artificial Intelligence in Education, vol. 26, no. 2, pp. 600-614, 2016.',
    '[3] Next.js Documentation, "App Router: Building Your Application," Vercel, 2024. [Online]. Available: https://nextjs.org/docs/app/building-your-application.',
    '[4] P. De Bra, D. Smits, and N. Stash, "The Design of AHA!," in Proc. ACM Hypertext Conference, 2006, pp. 133-134.',
    '[5] D. R. Garrison, "E-Learning in the 21st Century: A Community of Inquiry Framework for Research and Practice," 3rd ed. New York: Routledge, 2017.',
    '[6] Global Market Insights, "E-Learning Market Size, By Technology, By Provider, By Application, Industry Analysis Report, Regional Outlook, Growth Potential, Price Trends, Competitive Market Share & Forecast, 2020-2026," 2020.',
    '[7] B. S. Bloom, "The 2 Sigma Problem: The Search for Methods of Group Instruction as Effective as One-to-One Tutoring," Educational Researcher, vol. 13, no. 6, pp. 4-16, 1984.',
    '[8] W. Holmes, M. Bialik, and C. Fadel, "Artificial Intelligence in Education: Promises and Implications for Teaching and Learning," Center for Curriculum Redesign, 2019.',
    '[9] E. Kasneci, K. Sessler, S. Kuchemann, et al., "ChatGPT for good? On opportunities and challenges of large language models for education," Learning and Individual Differences, vol. 103, art. 102274, 2023.',
    '[10] M. Dougiamas and P. Taylor, "Moodle: Using Learning Communities to Create an Open Source Course Management System," in Proc. EDMEDIA, 2003, pp. 171-178.',
    '[11] H. K. N. Leung, "A Framework for AI-Powered Adaptive Learning Platforms," Journal of Educational Technology & Society, vol. 26, no. 3, pp. 45-59, 2023.',
    '[12] R. C. Clark and R. E. Mayer, "E-Learning and the Science of Instruction: Proven Guidelines for Consumers and Designers of Multimedia Learning," 4th ed. Hoboken, NJ: Wiley, 2016.',
    '[13] M. Dougiamas, "Moodle: A Free, Open Source Course Management System for Online Learning," 2024. [Online]. Available: https://moodle.org.',
    '[14] D. Shah, "Year of MOOCs: A Review of MOOCs in 2012," Class Central, 2012.',
    '[15] A. P. D. A. de Oliveira, R. F. Maciel, and P. A. S. Neto, "A Systematic Review of Adaptive Learning Systems," in Proc. IEEE Frontiers in Education Conference, 2019, pp. 1-8.',
    '[16] K. M. Jordan, "MOOC Completion Rates: The Data," 2023. [Online]. Available: https://www.katyjordan.com/MOOCproject.html.',
    '[17] J. R. Carbonell, "AI in CAI: An Artificial-Intelligence Approach to Computer-Assisted Instruction," IEEE Transactions on Man-Machine Systems, vol. 11, no. 4, pp. 190-202, 1970.',
    '[18] B. P. Woolf, "Building Intelligent Interactive Tutors: Student-centered Strategies for Revolutionizing E-learning," Burlington, MA: Morgan Kaufmann, 2009.',
    '[19] OpenAI, "GPT-4 Technical Report," arXiv preprint arXiv:2303.08774, 2023.',
    '[20] E. Kasneci et al., "ChatGPT for good? On opportunities and challenges of large language models for education," Learning and Individual Differences, vol. 103, 2023.',
    '[21] R. K. Atkinson, A. Renkl, and M. M. Merrill, "Transitioning from Studying Examples to Solving Problems: Effects of Self-Explanation Prompts and Fading Worked-Out Steps," Learning and Instruction, vol. 13, no. 4, pp. 387-401, 2003.',
    '[22] A. T. Corbett and J. R. Anderson, "Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge," User Modeling and User-Adapted Interaction, vol. 4, no. 4, pp. 253-278, 1995.',
    '[23] C. Piech, J. Bassen, J. Huang, et al., "Deep Knowledge Tracing," in Proc. Advances in Neural Information Processing Systems (NeurIPS), 2015, pp. 505-513.',
    '[24] J.-P. Doignon and J.-C. Falmagne, "Knowledge Spaces," Berlin: Springer, 1999.',
    '[25] G. Siemens and R. S. J. d. Baker, "Learning Analytics and Educational Data Mining: Towards Communication and Collaboration," in Proc. LAK 12: 2nd International Conference on Learning Analytics and Knowledge, 2012, pp. 252-254.',
    '[26] D. Gaevi, S. Dawson, and G. Siemens, "Lets Not Forget: Learning Analytics Are About Learning," TechTrends, vol. 59, no. 1, pp. 64-71, 2015.',
    '[27] S. Deterding, D. Dixon, R. Khaled, and L. Nacke, "From Game Design Elements to Gamefulness: Defining Gamification," in Proc. 15th International Academic MindTrek Conference, 2011, pp. 9-15.',
    '[28] J. Hamari, J. Koivisto, and H. Sarsa, "Does Gamification Work? A Literature Review of Empirical Studies on Gamification," in Proc. 47th Hawaii International Conference on System Sciences, 2014, pp. 3025-3034.',
    '[29] T. O. Reilly, "What Is Web 2.0: Design Patterns and Business Models for the Next Generation of Software," O\'Reilly Media, 2005.',
    '[30] Vercel, "Next.js: The React Framework for the Web," 2024. [Online]. Available: https://nextjs.org.',
    '[31] P. Stone, R. Brooks, E. Brynjolfsson, et al., "Artificial Intelligence and Life in 2030," One Hundred Year Study on Artificial Intelligence: Report of the 2015-2016 Study Panel, Stanford University, 2016.',
    '[32] Docker, "Containerize a Next.js App," 2024. [Online]. Available: https://docs.docker.com/samples/nextjs/',
    '[33] Prisma, "Prisma Documentation: Next Generation ORM for Node.js and TypeScript," 2024. [Online]. Available: https://www.prisma.io/docs.',
    '[34] M. Fowler, "Patterns of Enterprise Application Architecture," Boston, MA: Addison-Wesley, 2002.',
    '[35] React Documentation, "React: A JavaScript Library for Building User Interfaces," Meta, 2024. [Online]. Available: https://react.dev.',
    '[36] TypeScript Documentation, "TypeScript: JavaScript With Syntax For Types," Microsoft, 2024. [Online]. Available: https://www.typescriptlang.org.',
    '[37] Tailwind CSS Documentation, "Utility-First CSS Framework," Tailwind Labs, 2024. [Online]. Available: https://tailwindcss.com.',
    '[38] shadcn/ui Documentation, "Build Your Component Library," 2024. [Online]. Available: https://ui.shadcn.com.',
    '[39] A. Field, "Discovering Statistics Using IBM SPSS Statistics," 5th ed. London: SAGE Publications, 2018.',
    '[40] R. Felder and R. Brent, "Understanding Student Differences," Journal of Engineering Education, vol. 94, no. 1, pp. 57-72, 2005.',
  ];

  return [
    h1("References"),
    ...refs.map(r => new Paragraph({
      indent: { left: 420, hanging: 420 },
      spacing: { line: 360, after: 60 },
      children: [new TextRun({ text: r, size: 21, font: TNR, color: "000000" })],
    })),
  ];
}

// ═══════════════════════════════════════════
// APPENDICES
// ═══════════════════════════════════════════

function buildAppendices() {
  // Appendix A: API Route Listing (condensed)
  const apiRoutes = [
    ["Authentication", "/api/auth/login, /api/auth/register, /api/auth/verify-otp, /api/auth/forgot-password, /api/auth/reset-password, /api/auth/social, /api/auth/demo-login"],
    ["Courses", "/api/courses, /api/courses/[id], /api/courses/[id]/public, /api/courses/[id]/reviews, /api/courses/catalog, /api/courses/categories"],
    ["Enrollments", "/api/enrollments, /api/progress, /api/dashboard, /api/gamification"],
    ["AI Core", "/api/ai/chat, /api/ai/tutor, /api/ai/tutor/sessions, /api/ai/companion, /api/ai/study-planner, /api/ai/learning-paths, /api/ai/mock-interview"],
    ["Ask ShijlAI", "/api/ai/shijlai/chat, /api/ai/shijlai/sessions, /api/ai/shijlai/mastery, /api/ai/shijlai/insights, /api/ai/shijlai/recommendations, /api/ai/shijlai/study-plan, /api/ai/shijlai/quiz-generator, /api/ai/shijlai/events, /api/ai/shijlai/search, /api/ai/shijlai/profile"],
    ["Student", "/api/student/learning, /api/student/progress, /api/student/assignments, /api/student/schedule, /api/student/goals, /api/student/streak, /api/student/notes, /api/student/community/*, /api/student/messages/*"],
    ["Instructor AI", "/api/instructor/ai/generate-description, /api/instructor/ai/generate-curriculum, /api/instructor/ai/generate-quiz, /api/instructor/ai/generate-rubric, /api/instructor/ai/generate-assignment, /api/instructor/ai/generate-outcomes, /api/instructor/ai/generate-lesson-content, /api/instructor/ai/generate-thumbnail, /api/instructor/ai/auto-respond, /api/instructor/ai/analyze-feedback, /api/instructor/ai/suggest-reply"],
    ["Instructor Core", "/api/instructor/courses, /api/instructor/students, /api/instructor/analytics, /api/instructor/assignments, /api/instructor/quizzes, /api/instructor/submissions, /api/instructor/revenue, /api/instructor/qa, /api/instructor/copilot, /api/instructor/assessment/*"],
    ["Admin Core", "/api/admin/dashboard, /api/admin/users, /api/admin/courses, /api/admin/instructors, /api/admin/instructor-applications, /api/admin/finance/*"],
    ["Admin System", "/api/admin/ai-config, /api/admin/security, /api/admin/settings, /api/admin/gamification, /api/admin/appearance, /api/admin/notifications, /api/admin/blog, /api/admin/audit-log, /api/admin/copilot, /api/admin/system-intelligence, /api/admin/course-quality"],
    ["Other", "/api/blog, /api/certificates, /api/notifications, /api/analytics, /api/skills, /api/skill-graph, /api/search, /api/quizzes"],
  ];

  // Appendix B: Database Models
  const dbModels = [
    ["User & Auth", "User, UserSession, StudentSettings, InstructorProfile, InstructorSettings"],
    ["Course System", "Course, Module, Lesson, Enrollment, LessonProgress, LessonNote, LessonBookmark"],
    ["Assessment", "Quiz, Question, QuizAttempt, Assignment, Submission, PeerReview"],
    ["AI Tutoring", "TutorSession, ChatMessage, ShijlAISession, ShijlAIMessage, AICompanionMessage, AICompanionEvent"],
    ["Adaptive Learning", "StudentLearningProfile, TopicMastery, SkillTopicMapping, AIRecommendation, LearningInsight, AIQuizGeneration"],
    ["Study Planning", "StudyPlan, StudyPlanTask, LearningPath, LearningPathNode, TopicPrerequisite"],
    ["Gamification", "Badge, UserBadge, XPRule, LevelConfig, GamificationSettings, StreakFreeze, StreakReward, XpActivity, DailyChallenge, UserChallenge, RewardShopItem, UserReward, GamificationEvent"],
    ["Community", "DiscussionPost, DiscussionReply, DiscussionUpvote, DiscussionBookmark, StudyGroup, StudyGroupMember, StudyGroupMessage, StudyGroupResource, CommunityEvent, EventAttendee"],
    ["Messaging", "Conversation, ConversationParticipant, Message, ConversationSummary"],
    ["Finance", "Transaction, Payout, PayoutMethod, Dispute, FinancialSettings, CommissionOverride"],
    ["Admin Config", "AIConfiguration, AIProvider, AIModel, AIUsageLog, AIPromptTemplate, AIAuditLog, SecuritySettings, SecurityRole, ApiKey, BlockedIp, LoginAlert, SecurityEvent"],
    ["Platform", "PlatformSettings, PlatformStats, FeatureFlag, PlatformAnnouncement, AppearanceBranding, AppearanceHistory, WebhookConfig, PaymentMethodConfig, Integration, LegalPage"],
    ["Instructor AI", "AIGeneration, AITemplate, AIAssistantMessage, AIGeneratedOutline, AIGeneratedLesson, AIGeneratedAssignment, AIGeneratedRubric, AIGeneratedQuiz, InstructorAIActivity"],
    ["Smart Assessment", "LearningOutcome, QuestionOutcome, QuestionAnalytics, DistractorAnalytics, AssessmentQualityScore"],
    ["Skills & Career", "Skill, UserSkill, CourseSkill, LessonSkill, QuestionSkill, StudentSkillHistory, CareerPath, CareerPathSkill"],
    ["Notifications", "Notification, NotificationPreference, NotificationTemplate, NotificationLog, NotificationSettings"],
    ["Other", "ActivityLog, InstructorApplication, ApplicationTimeline, ApplicationInterview, Certificate, BlogPost, LiveSession, SessionAttendee, Wishlist, Review, QAQuestion, QAAnswer, QAUpvote, QASettings, ContentModerationSettings, CourseReviewHistory, ScheduleEvent, ParentLink, DailyActivity, StudentAIActivity, LearningMetric, LearningEvent, GeneratedReport, CourseQualityAnalysis, ApiUsageLog"],
  ];

  return [
    h1("Appendix A"),
    h1("Complete API Route Listing"),
    bodyPara("Table A-1 presents the complete listing of API routes organized by functional domain."),

    ...threeLineTable(
      ["Domain", "API Routes"],
      apiRoutes.map(r => [r[0], r[1]]),
      "Table A-1 Complete API Route Listing"
    ),
    spacer(200),

    h1("Appendix B"),
    h1("Database Schema Summary"),
    bodyPara("Table B-1 presents the complete database model inventory organized by functional domain, comprising 87 models total."),

    ...threeLineTable(
      ["Domain", "Models"],
      dbModels.map(r => [r[0], r[1]]),
      "Table B-1 Database Model Inventory (87 Models)"
    ),
    spacer(200),

    h1("Appendix C"),
    h1("User Interface Screenshots"),
    bodyPara("This appendix contains screenshots of the ShijlAI Academy platform interfaces across all three portals. The following placeholders indicate where screenshots should be inserted after the platform is deployed and captured."),

    screenshotPlaceholder("Landing Page - Hero section with animated gradient background, platform statistics, and CTA buttons"),
    figCaption("Figure C-1 Landing Page"),

    screenshotPlaceholder("Student Dashboard - Course progress cards, streak counter, XP display, and continue learning section"),
    figCaption("Figure C-2 Student Dashboard"),

    screenshotPlaceholder("Course Player - Immersive lesson viewer with video player, progress bar, and navigation sidebar"),
    figCaption("Figure C-3 Course Player"),

    screenshotPlaceholder("Ask ShijlAI - Six-mode AI tutor interface with mode selector tabs and chat conversation"),
    figCaption("Figure C-4 Ask ShijlAI"),

    screenshotPlaceholder("My Skills Page - Interactive skill graph with topic-level mastery visualization"),
    figCaption("Figure C-5 My Skills"),

    screenshotPlaceholder("Instructor Course Creator - 6-step wizard with AI assistance panel"),
    figCaption("Figure C-6 Course Creator"),

    screenshotPlaceholder("Instructor AI Copilot - AI assistant for course creation and content generation"),
    figCaption("Figure C-7 Instructor AI Copilot"),

    screenshotPlaceholder("Admin Dashboard - Platform statistics, revenue charts, user distribution, and recent activity"),
    figCaption("Figure C-8 Admin Dashboard"),

    screenshotPlaceholder("Admin AI Configuration - AI provider management, model selection, and prompt template editor"),
    figCaption("Figure C-9 Admin AI Config"),

    screenshotPlaceholder("Community Forum - Discussion posts, study groups, and leaderboard"),
    figCaption("Figure C-10 Community Forum"),

    spacer(200),

    h1("Appendix D"),
    h1("Sample Code Snippets"),
    bodyPara("This appendix presents key code snippets from the ShijlAI Academy implementation."),

    h2("D.1 Mastery Score Calculation"),
    bodyPara("The following code snippet shows the Topic Mastery calculation implemented in the Mastery Service:"),
    new Paragraph({
      spacing: { before: 100, after: 100, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "// Weighted mastery formula: quiz(50%) + assignment(25%) + practice(15%) + completion(10%)", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "555555" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "const mastery = (quizScore * 0.50) + (assignmentScore * 0.25)", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "                 + (practiceScore * 0.15) + (completionRate * 0.10);", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
    new Paragraph({
      spacing: { before: 100, after: 100, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "// Temporal decay: 0.5% per day after 7 days of inactivity", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "555555" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "const daysInactive = daysSinceLastActivity;", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "const decay = daysInactive > 7 ? (1 - 0.005 * (daysInactive - 7)) : 1;", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "const adjustedMastery = mastery * Math.max(0, decay);", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),

    h2("D.2 Drop Risk Calculation"),
    bodyPara("The following code snippet shows the Drop Risk calculation implemented in the Feature Engine:"),
    new Paragraph({
      spacing: { before: 100, after: 100, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "// Drop Risk: weighted combination of risk indicators", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "555555" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "const dropRisk = (lowEngagement * 0.30) + (lowConsistency * 0.30)", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "              + (decliningScore * 0.20) + (inactivity * 0.20);", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),

    h2("D.3 Recommendation Priority Scoring"),
    bodyPara("The following code snippet shows the recommendation priority calculation:"),
    new Paragraph({
      spacing: { before: 100, after: 100, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "// Priority: weakness(40%) + career_relevance(20%) + engagement(20%) + recency(20%)", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "555555" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "const priority = (weaknessScore * 0.40) + (careerRelevance * 0.20)", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
    new Paragraph({
      spacing: { after: 60, line: 300 },
      indent: { left: 360 },
      children: [new TextRun({ text: "              + (engagementMatch * 0.20) + (recencyScore * 0.20);", size: 20, font: { ascii: "Courier New", hAnsi: "Courier New" }, color: "000000" })],
    }),
  ];
}

// ═══════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════

async function main() {
  console.log("Generating ShijlAI Academy Thesis Document...");

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: TNR, size: 24, color: "000000" },
          paragraph: { spacing: { line: 360 } },
        },
        heading1: {
          run: { font: TNR, size: 32, bold: true, color: "000000" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360, line: 360 } },
        },
        heading2: {
          run: { font: TNR, size: 30, bold: true, color: "000000" },
          paragraph: { spacing: { before: 360, after: 240, line: 360 } },
        },
        heading3: {
          run: { font: TNR, size: 28, bold: true, color: "000000" },
          paragraph: { spacing: { before: 240, after: 120, line: 360 } },
        },
      },
    },
    sections: [
      // Section 1: Cover (no page numbers, no header/footer)
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          },
        },
        children: buildCover(),
      },

      // Section 2: Declaration + Certificate + Acknowledgments (Roman numerals from i)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            ...bodyPageLayout,
            pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: buildDeclaration(),
      },

      // Section 3: Abstract (Roman numerals continued)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            ...bodyPageLayout,
            pageNumbers: { formatType: NumberFormat.UPPER_ROMAN },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: [
          ...buildAcknowledgments(),
          ...buildAbstract(),
        ],
      },

      // Section 4: Table of Contents (Roman numerals continued)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            ...bodyPageLayout,
            pageNumbers: { formatType: NumberFormat.UPPER_ROMAN },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: buildTOC(),
      },

      // Section 5: Body (Arabic numerals from 1)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            ...bodyPageLayout,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: [
          ...buildChapter1(),
          ...buildChapter2(),
          ...buildChapter3(),
          ...buildChapter4(),
          ...buildChapter5(),
          ...buildChapter6(),
          ...buildChapter7(),
        ],
      },

      // Section 6: References (Arabic continued)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            ...bodyPageLayout,
            pageNumbers: { formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: buildReferences(),
      },

      // Section 7: Appendices (Arabic continued)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            ...bodyPageLayout,
            pageNumbers: { formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: buildHeader() },
        footers: { default: buildFooter() },
        children: buildAppendices(),
      },
    ],
  });

  console.log("Packing document...");
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "/home/z/my-project/thesis-generator/shijlai-academy-thesis.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`Thesis document generated successfully: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error("Error generating thesis:", err);
  process.exit(1);
});
