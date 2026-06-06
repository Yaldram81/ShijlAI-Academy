const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, TabStopType, TabStopPosition, convertInchesToTwip,
  PageNumber, Footer, Header, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, VerticalAlign, TableLayoutType,
  LevelFormat, LevelAlignment, UnderlineType, ImageRun,
  SectionType, LineRuleType
} = require("docx");

// ============================================================
// CONFIGURATION
// ============================================================
const FONT = "Times New Roman";
const FONT_SIZE = 24; // 12pt in half-points
const LINE_SPACING = 360; // 1.5 line spacing in twips (240 twips = single)
const MARGIN_TOP = convertInchesToTwip(1);
const MARGIN_BOTTOM = convertInchesToTwip(1);
const MARGIN_LEFT = convertInchesToTwip(1.25);
const MARGIN_RIGHT = convertInchesToTwip(1);
const PAGE_WIDTH = convertInchesToTwip(8.5);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function p(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({
      text,
      font: opts.font || FONT,
      size: opts.size || FONT_SIZE,
      bold: opts.bold || false,
      italics: opts.italics || false,
      underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
      color: opts.color || "000000",
      break: opts.break || 0,
    }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") {
        runs.push(new TextRun({ text: t, font: FONT, size: FONT_SIZE }));
      } else {
        runs.push(new TextRun({
          text: t.text || "",
          font: t.font || FONT,
          size: t.size || FONT_SIZE,
          bold: t.bold || false,
          italics: t.italics || false,
          underline: t.underline ? { type: UnderlineType.SINGLE } : undefined,
          color: t.color || "000000",
          break: t.break || 0,
          superscript: t.superscript || false,
          subscript: t.subscript || false,
        }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: {
      line: opts.lineSpacing || LINE_SPACING,
      before: opts.spaceBefore || 0,
      after: opts.spaceAfter || 120,
      lineRule: opts.lineRule || LineRuleType.AUTO,
    },
    indent: opts.indent ? { left: convertInchesToTwip(opts.indent) } : undefined,
    heading: opts.heading || undefined,
    pageBreakBefore: opts.pageBreak || false,
    keepNext: opts.keepNext || false,
  });
}

function emptyPara(count = 1) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(new Paragraph({ children: [], spacing: { line: LINE_SPACING } }));
  }
  return result;
}

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 28, bold: true, color: "000000" })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, before: 240, after: 240 },
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: "000000" })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SPACING, before: 200, after: 160 },
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, italics: true, color: "000000" })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SPACING, before: 160, after: 120 },
    heading: HeadingLevel.HEADING_3,
    keepNext: true,
  });
}

function bodyPara(text, opts = {}) {
  return p(text, { alignment: AlignmentType.JUSTIFIED, ...opts });
}

function bulletItem(text, level = 0) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, font: FONT, size: FONT_SIZE }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") {
        runs.push(new TextRun({ text: t, font: FONT, size: FONT_SIZE }));
      } else {
        runs.push(new TextRun({
          text: t.text, font: t.font || FONT, size: t.size || FONT_SIZE,
          bold: t.bold || false, italics: t.italics || false,
          color: t.color || "000000",
        }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING, after: 60 },
    indent: { left: convertInchesToTwip(0.5 + level * 0.25), hanging: convertInchesToTwip(0.25) },
    bullet: level === 0 ? { level: 0 } : { level: level },
  });
}

// Three-line table (academic style)
function academicTable(headers, rows, caption, tableNum) {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const topBottomBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
  const headerBottomBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };

  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, font: FONT, size: 22, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
      })],
      borders: {
        top: topBottomBorder,
        bottom: headerBottomBorder,
        left: noBorder,
        right: noBorder,
      },
      verticalAlign: VerticalAlign.CENTER,
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    })),
    tableHeader: true,
  });

  const dataRows = rows.map((row, rowIdx) => new TableRow({
    children: row.map((cell, cellIdx) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: String(cell), font: FONT, size: 20 })],
        alignment: cellIdx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { before: 20, after: 20 },
      })],
      borders: {
        top: noBorder,
        bottom: rowIdx === rows.length - 1 ? topBottomBorder : noBorder,
        left: noBorder,
        right: noBorder,
      },
      verticalAlign: VerticalAlign.CENTER,
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    })),
  }));

  const captionPara = new Paragraph({
    children: [new TextRun({ text: `Table ${tableNum}: ${caption}`, font: FONT, size: 20, italics: true, bold: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
  });

  return [
    captionPara,
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
    }),
    new Paragraph({ children: [], spacing: { after: 120 } }),
  ];
}

// Mermaid diagram as monospace text block
function mermaidDiagram(code, caption, figNum) {
  const lines = code.split("\n");
  const codeParas = lines.map(line => new Paragraph({
    children: [new TextRun({ text: line || " ", font: "Courier New", size: 16, color: "333333" })],
    spacing: { line: 240, before: 0, after: 0 },
    indent: { left: convertInchesToTwip(0.3) },
  }));

  return [
    new Paragraph({
      children: [new TextRun({ text: `Figure ${figNum}: ${caption}`, font: FONT, size: 20, italics: true, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
    }),
    ...codeParas,
    new Paragraph({ children: [], spacing: { after: 200 } }),
  ];
}

function screenshotPlaceholder(description, figNum) {
  return [
    new Paragraph({
      children: [new TextRun({ text: `Figure ${figNum}: ${description}`, font: FONT, size: 20, italics: true, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `[Screenshot: ${description}]`, font: FONT, size: 22, italics: true, color: "666666" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      border: {
        top: { style: BorderStyle.DASHED, size: 1, color: "999999", space: 8 },
        bottom: { style: BorderStyle.DASHED, size: 1, color: "999999", space: 8 },
        left: { style: BorderStyle.DASHED, size: 1, color: "999999", space: 8 },
        right: { style: BorderStyle.DASHED, size: 1, color: "999999", space: 8 },
      },
    }),
    new Paragraph({ children: [], spacing: { after: 200 } }),
  ];
}

function pageBreakPara() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ============================================================
// CONTENT GENERATION
// ============================================================

let figCounter = 1;
let tableCounter = 1;

// ============================================================
// COVER PAGE
// ============================================================
function coverPage() {
  return [
    ...emptyPara(4),
    new Paragraph({
      children: [new TextRun({ text: "UNIVERSITY OF MALAKAND", font: FONT, size: 32, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "DEPARTMENT OF COMPUTER SCIENCE AND INFORMATION TECHNOLOGY", font: FONT, size: 24, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    ...emptyPara(2),
    new Paragraph({
      children: [new TextRun({ text: "ShijlAI Academy", font: FONT, size: 40, bold: true, color: "1a5276" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "An AI-Powered Personalized Learning Platform", font: FONT, size: 28, italics: true, color: "2c3e50" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    ...emptyPara(1),
    new Paragraph({
      children: [new TextRun({ text: "A Thesis Submitted in Partial Fulfillment of the Requirements", font: FONT, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "for the Degree of Bachelor of Science in Computer Science", font: FONT, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    ...emptyPara(1),
    new Paragraph({
      children: [new TextRun({ text: "Submitted By:", font: FONT, size: 22, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Sadeed Ali (Roll No. 1447)", font: FONT, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Syed Awais Shah (Roll No. 1457)", font: FONT, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    ...emptyPara(1),
    new Paragraph({
      children: [new TextRun({ text: "Supervisor: [Name of Supervisor]", font: FONT, size: 22, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    ...emptyPara(1),
    new Paragraph({
      children: [new TextRun({ text: "2026", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }),
    pageBreakPara(),
  ];
}

// ============================================================
// CERTIFICATE / APPROVAL PAGE
// ============================================================
function approvalPage() {
  return [
    new Paragraph({
      children: [new TextRun({ text: "CERTIFICATE OF APPROVAL", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    bodyPara("This is to certify that the thesis entitled \"ShijlAI Academy: An AI-Powered Personalized Learning Platform\" submitted by Sadeed Ali (Roll No. 1447) and Syed Awais Shah (Roll No. 1457) in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science, Department of Computer Science and Information Technology, University of Malakand, is a record of bonafide work carried out by them under our supervision and guidance."),
    ...emptyPara(2),
    new Paragraph({
      children: [new TextRun({ text: "___________________________", font: FONT, size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Supervisor: [Name of Supervisor]", font: FONT, size: 22, bold: true })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Department of Computer Science and IT", font: FONT, size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "University of Malakand", font: FONT, size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 },
    }),
    ...emptyPara(1),
    new Paragraph({
      children: [new TextRun({ text: "___________________________", font: FONT, size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Chairman: [Name of Chairman]", font: FONT, size: 22, bold: true })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Department of Computer Science and IT", font: FONT, size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "University of Malakand", font: FONT, size: 22 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0 },
    }),
    pageBreakPara(),
  ];
}

// ============================================================
// ACKNOWLEDGMENT
// ============================================================
function acknowledgment() {
  return [
    new Paragraph({
      children: [new TextRun({ text: "ACKNOWLEDGMENT", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    bodyPara("All praise be to Almighty Allah, the most Gracious, the most Merciful, who enabled us to accomplish this research work successfully. We owe our profound gratitude to Him for granting us the strength, knowledge, and perseverance to complete this thesis."),
    bodyPara("We would like to express our sincere gratitude to our supervisor, [Name of Supervisor], for their invaluable guidance, continuous support, and encouragement throughout the course of this research. Their insightful feedback and constructive criticism were instrumental in shaping this project."),
    bodyPara("We are deeply indebted to the faculty members of the Department of Computer Science and Information Technology, University of Malakand, for providing us with the academic foundation and research environment necessary for this work. Special thanks to the Chairman of the Department for their administrative support and facilitation."),
    bodyPara("We extend our heartfelt appreciation to our families and friends whose unwavering support, prayers, and encouragement kept us motivated during challenging times. Their belief in our abilities was a constant source of inspiration."),
    bodyPara("We also acknowledge the open-source community and the developers of the tools and libraries that made this project possible, including the Next.js team, the React community, Prisma, and the broader JavaScript/TypeScript ecosystem."),
    bodyPara("Finally, we dedicate this work to all students and educators who strive to leverage technology for making education more accessible, personalized, and effective."),
    ...emptyPara(2),
    new Paragraph({
      children: [new TextRun({ text: "Sadeed Ali", font: FONT, size: 22, bold: true })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Syed Awais Shah", font: FONT, size: 22, bold: true })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
    }),
    pageBreakPara(),
  ];
}

// ============================================================
// ABSTRACT
// ============================================================
function abstract_() {
  return [
    new Paragraph({
      children: [new TextRun({ text: "ABSTRACT", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    bodyPara("The rapid proliferation of online learning platforms has transformed the educational landscape, yet the vast majority of existing platforms continue to adopt a one-size-fits-all approach that fails to accommodate the diverse learning needs, paces, and preferences of individual students. While platforms like Coursera, Udemy, and edX have democratized access to educational content, they fundamentally lack the intelligent adaptability required to deliver truly personalized learning experiences. This thesis presents ShijlAI Academy, an AI-powered personalized learning platform designed to address these limitations through a comprehensive integration of artificial intelligence throughout the learning lifecycle."),
    bodyPara("ShijlAI Academy implements a hybrid intelligence architecture that combines deterministic, rule-based algorithms with optional Large Language Model (LLM) enhancement, ensuring both reliability and adaptability. The platform encompasses 15 distinct AI modules spanning six operational modes of an intelligent chatbot (Ask ShijlAI), an AI Learning Companion with real-time contextual insights, an AI Quiz Generator, an AI Mock Interview system, a comprehensive AI Insights engine, a personalized recommendation system, an AI Study Planner, AI-generated Learning Paths, a Topic Mastery system with weighted skill assessment, an Instructor AI Copilot with 9 automated actions, an Admin AI Copilot with a three-stage reasoning pipeline, and an Intelligent Analytics framework with role-based dashboards."),
    bodyPara("The system is built on a modern technology stack featuring Next.js 16 with React 19 and TypeScript 5 for the frontend, Next.js API Routes with Prisma ORM and SQLite for the backend, and the z-ai-web-dev-sdk for LLM integration. The database comprises 148 Prisma models organized across 10 functional domains, supported by 176 API endpoint files. The frontend architecture employs a single-page application pattern with 68 view components organized by role (Student, Instructor, Admin), three portal shells with responsive sidebar navigation, and Zustand-based state management with localStorage persistence."),
    bodyPara("A key design principle is graceful degradation: all LLM-dependent features maintain rule-based fallbacks, ensuring the platform remains functional even when AI services are unavailable. The gamification system integrates XP rewards into AI interactions, creating an engaging feedback loop. The Topic Mastery system employs a weighted formula (quiz \u00d7 0.50 + assignment \u00d7 0.25 + practice \u00d7 0.15 + completion \u00d7 0.10) for precise skill assessment, while the AI Study Planner combines algorithmic scheduling with LLM-enhanced plan generation."),
    bodyPara("This thesis contributes to the field of AI-enhanced education by demonstrating a production-viable architecture for integrating multiple AI capabilities into a cohesive learning platform, establishing design patterns for hybrid intelligence systems, and providing a comprehensive implementation that spans the full spectrum of educational stakeholders including students, instructors, and administrators. The platform represents a significant step toward making intelligent, adaptive learning accessible and reliable through its innovative hybrid approach."),
    pageBreakPara(),
  ];
}

// ============================================================
// TABLE OF CONTENTS (placeholder)
// ============================================================
function tableOfContents() {
  const tocEntries = [
    { level: 0, title: "Abstract", page: "iii" },
    { level: 0, title: "Acknowledgment", page: "iv" },
    { level: 0, title: "List of Figures", page: "v" },
    { level: 0, title: "List of Tables", page: "vi" },
    { level: 0, title: "List of Abbreviations", page: "vii" },
    { level: 0, title: "Chapter 1: Introduction", page: "1" },
    { level: 1, title: "1.1 Background", page: "1" },
    { level: 1, title: "1.2 Problem Statement", page: "3" },
    { level: 1, title: "1.3 Research Objectives", page: "5" },
    { level: 1, title: "1.4 Scope of the Study", page: "6" },
    { level: 1, title: "1.5 Significance of the Study", page: "7" },
    { level: 1, title: "1.6 Research Methodology", page: "8" },
    { level: 1, title: "1.7 Thesis Organization", page: "9" },
    { level: 0, title: "Chapter 2: Literature Review", page: "10" },
    { level: 1, title: "2.1 Evolution of E-Learning", page: "10" },
    { level: 1, title: "2.2 Artificial Intelligence in Education", page: "13" },
    { level: 1, title: "2.3 Personalized Learning Systems", page: "16" },
    { level: 1, title: "2.4 Intelligent Tutoring Systems", page: "19" },
    { level: 1, title: "2.5 Learning Analytics and Educational Data Mining", page: "22" },
    { level: 1, title: "2.6 Comparative Analysis of Existing Platforms", page: "25" },
    { level: 1, title: "2.7 Research Gap and Justification", page: "30" },
    { level: 0, title: "Chapter 3: Requirements Analysis", page: "32" },
    { level: 1, title: "3.1 Stakeholder Analysis", page: "32" },
    { level: 1, title: "3.2 Feasibility Study", page: "34" },
    { level: 1, title: "3.3 Functional Requirements", page: "36" },
    { level: 1, title: "3.4 Non-Functional Requirements", page: "42" },
    { level: 1, title: "3.5 Hardware and Software Requirements", page: "45" },
    { level: 1, title: "3.6 Risk Analysis", page: "46" },
    { level: 0, title: "Chapter 4: System Design", page: "48" },
    { level: 1, title: "4.1 Overall System Architecture", page: "48" },
    { level: 1, title: "4.2 Layered Architecture Design", page: "51" },
    { level: 1, title: "4.3 Portal Architecture", page: "54" },
    { level: 1, title: "4.4 AI Services Architecture", page: "57" },
    { level: 1, title: "4.5 UML Models", page: "62" },
    { level: 1, title: "4.6 Data Flow Diagrams", page: "75" },
    { level: 1, title: "4.7 Database Design", page: "80" },
    { level: 1, title: "4.8 Security Design", page: "90" },
    { level: 0, title: "Chapter 5: System Implementation", page: "93" },
    { level: 1, title: "5.1 Technology Stack and Development Environment", page: "93" },
    { level: 1, title: "5.2 Authentication Module", page: "96" },
    { level: 1, title: "5.3 Student Module", page: "100" },
    { level: 1, title: "5.4 Instructor Module", page: "108" },
    { level: 1, title: "5.5 Admin Module", page: "115" },
    { level: 1, title: "5.6 AI Components Implementation", page: "120" },
    { level: 1, title: "5.7 API Design and Implementation", page: "140" },
    { level: 1, title: "5.8 Database Integration", page: "145" },
    { level: 1, title: "5.9 Security Implementation", page: "148" },
    { level: 0, title: "Chapter 6: Testing and Evaluation", page: "150" },
    { level: 1, title: "6.1 Testing Methodology", page: "150" },
    { level: 1, title: "6.2 Unit Testing", page: "152" },
    { level: 1, title: "6.3 Integration Testing", page: "155" },
    { level: 1, title: "6.4 Functional Testing", page: "158" },
    { level: 1, title: "6.5 Security Testing", page: "162" },
    { level: 1, title: "6.6 Performance Testing", page: "164" },
    { level: 1, title: "6.7 AI Features Evaluation", page: "166" },
    { level: 1, title: "6.8 User Interface Evaluation", page: "170" },
    { level: 0, title: "Chapter 7: Conclusion and Future Work", page: "173" },
    { level: 1, title: "7.1 Summary of Achievements", page: "173" },
    { level: 1, title: "7.2 Limitations", page: "175" },
    { level: 1, title: "7.3 Future Work", page: "176" },
    { level: 1, title: "7.4 Closing Remarks", page: "178" },
    { level: 0, title: "References", page: "179" },
    { level: 0, title: "Appendices", page: "185" },
  ];

  const entries = [
    new Paragraph({
      children: [new TextRun({ text: "TABLE OF CONTENTS", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
  ];

  tocEntries.forEach(e => {
    const indent = e.level === 0 ? 0 : 0.5;
    const isBold = e.level === 0;
    entries.push(new Paragraph({
      children: [
        new TextRun({ text: e.title, font: FONT, size: isBold ? 22 : 20, bold: isBold }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: e.page, font: FONT, size: 20 }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { line: 320, after: 30 },
      indent: { left: convertInchesToTwip(indent) },
      tabStops: [{ type: TabStopType.RIGHT, position: convertInchesToTwip(6) }],
    }));
  });

  entries.push(pageBreakPara());
  return entries;
}

// ============================================================
// LIST OF FIGURES
// ============================================================
function listOfFigures() {
  const figures = [
    "Figure 1.1: Thesis Research Methodology Overview",
    "Figure 2.1: Evolution of E-Learning Technologies (2000-2025)",
    "Figure 2.2: AI in Education Taxonomy",
    "Figure 2.3: Personalized Learning Framework Components",
    "Figure 2.4: Comparison of Existing Platform Features",
    "Figure 3.1: Stakeholder Hierarchy of ShijlAI Academy",
    "Figure 3.2: Risk Assessment Matrix",
    "Figure 4.1: High-Level System Architecture of ShijlAI Academy",
    "Figure 4.2: Layered Architecture Design",
    "Figure 4.3: Portal Architecture with Role-Based Shells",
    "Figure 4.4: AI Services Architecture - Hybrid Intelligence Pattern",
    "Figure 4.5: Ask ShijlAI Chat Flow",
    "Figure 4.6: AI Learning Companion Architecture",
    "Figure 4.7: AI Insights Processing Pipeline",
    "Figure 4.8: Admin AI Copilot Three-Stage Pipeline",
    "Figure 4.9: Use Case Diagram - Student Portal",
    "Figure 4.10: Use Case Diagram - Instructor Portal",
    "Figure 4.11: Use Case Diagram - Admin Portal",
    "Figure 4.12: Activity Diagram - Course Enrollment and Learning Flow",
    "Figure 4.13: Activity Diagram - AI Quiz Generation",
    "Figure 4.14: Activity Diagram - Assignment Submission and Grading",
    "Figure 4.15: Sequence Diagram - User Authentication Flow",
    "Figure 4.16: Sequence Diagram - Ask ShijlAI Chat Interaction",
    "Figure 4.17: Sequence Diagram - AI Study Planner Flow",
    "Figure 4.18: Class Diagram - Core Domain Models",
    "Figure 4.19: Class Diagram - AI Module Classes",
    "Figure 4.20: Level 0 Data Flow Diagram",
    "Figure 4.21: Level 1 Data Flow Diagram - Student Subsystem",
    "Figure 4.22: Level 1 Data Flow Diagram - AI Subsystem",
    "Figure 4.23: Entity-Relationship Diagram - Core Domain",
    "Figure 4.24: Entity-Relationship Diagram - AI and Gamification Domain",
    "Figure 4.25: Database Schema Overview - 10 Domain Partitioning",
    "Figure 4.26: Security Architecture - Authentication and Authorization",
    "Figure 5.1: Project Directory Structure",
    "Figure 5.2: Authentication Flow Implementation",
    "Figure 5.3: Student Dashboard View Architecture",
    "Figure 5.4: Instructor Dashboard View Architecture",
    "Figure 5.5: Admin Dashboard View Architecture",
    "Figure 5.6: Ask ShijlAI - 6 Chat Modes Implementation",
    "Figure 5.7: AI Learning Companion Insight Rules Pipeline",
    "Figure 5.8: AI Quiz Generator Flow",
    "Figure 5.9: AI Mock Interview System Architecture",
    "Figure 5.10: Topic Mastery Weighted Formula Visualization",
    "Figure 5.11: Instructor AI Copilot 9 Actions",
    "Figure 5.12: API Route Organization (176 Endpoints)",
    "Figure 5.13: Prisma ORM Integration Layer",
    "Figure 6.1: Test Results Summary - Functional Tests",
    "Figure 6.2: Performance Test Results - Response Time Distribution",
    "Figure 6.3: AI Feature Accuracy Evaluation Results",
  ];

  return [
    new Paragraph({
      children: [new TextRun({ text: "LIST OF FIGURES", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    ...figures.map(f => new Paragraph({
      children: [new TextRun({ text: f, font: FONT, size: 20 })],
      alignment: AlignmentType.LEFT,
      spacing: { line: 300, after: 30 },
      indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.3) },
    })),
    pageBreakPara(),
  ];
}

// ============================================================
// LIST OF TABLES
// ============================================================
function listOfTables() {
  const tables = [
    "Table 2.1: Comparison of E-Learning Platforms with AI Features",
    "Table 2.2: Summary of Intelligent Tutoring Systems Reviewed",
    "Table 2.3: Feature Comparison of ShijlAI Academy vs. Existing Platforms",
    "Table 3.1: Stakeholder Requirements Summary",
    "Table 3.2: Feasibility Study Assessment",
    "Table 3.3: Functional Requirements - Student Portal",
    "Table 3.4: Functional Requirements - Instructor Portal",
    "Table 3.5: Functional Requirements - Admin Portal",
    "Table 3.6: Functional Requirements - AI Modules",
    "Table 3.7: Non-Functional Requirements",
    "Table 3.8: Hardware and Software Requirements",
    "Table 3.9: Risk Analysis and Mitigation Strategies",
    "Table 4.1: Database Domain Partitioning - 10 Domains",
    "Table 4.2: Core User and Auth Domain Models",
    "Table 4.3: Course Content Domain Models",
    "Table 4.4: AI Intelligence Domain Models",
    "Table 4.5: Gamification Domain Models",
    "Table 4.6: API Endpoint Distribution by Category",
    "Table 5.1: Technology Stack Summary",
    "Table 5.2: Frontend Component Inventory (68 Views)",
    "Table 5.3: AI Module Implementation Details",
    "Table 5.4: Ask ShijlAI Chat Modes Configuration",
    "Table 5.5: Topic Mastery Weighted Formula Parameters",
    "Table 5.6: Instructor AI Copilot Actions",
    "Table 5.7: API Endpoint Categories and Counts",
    "Table 5.8: Prisma Model Distribution by Domain",
    "Table 6.1: Test Case Summary",
    "Table 6.2: Unit Test Results",
    "Table 6.3: Integration Test Results",
    "Table 6.4: Security Test Results",
    "Table 6.5: Performance Test Results",
    "Table 6.6: AI Feature Evaluation Results",
    "Table 6.7: User Satisfaction Survey Results",
  ];

  return [
    new Paragraph({
      children: [new TextRun({ text: "LIST OF TABLES", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    ...tables.map(t => new Paragraph({
      children: [new TextRun({ text: t, font: FONT, size: 20 })],
      alignment: AlignmentType.LEFT,
      spacing: { line: 300, after: 30 },
      indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.3) },
    })),
    pageBreakPara(),
  ];
}

// ============================================================
// LIST OF ABBREVIATIONS
// ============================================================
function listOfAbbreviations() {
  const abbrevs = [
    ["AI", "Artificial Intelligence"],
    ["API", "Application Programming Interface"],
    ["BLoC", "Business Logic Component"],
    ["CRUD", "Create, Read, Update, Delete"],
    ["CSS", "Cascading Style Sheets"],
    ["DFD", "Data Flow Diagram"],
    ["EDM", "Educational Data Mining"],
    ["ER", "Entity-Relationship"],
    ["GPA", "Grade Point Average"],
    ["GUI", "Graphical User Interface"],
    ["HTTP", "HyperText Transfer Protocol"],
    ["ITS", "Intelligent Tutoring System"],
    ["JSON", "JavaScript Object Notation"],
    ["JWT", "JSON Web Token"],
    ["LA", "Learning Analytics"],
    ["LLM", "Large Language Model"],
    ["MVC", "Model-View-Controller"],
    ["NLP", "Natural Language Processing"],
    ["ORM", "Object-Relational Mapping"],
    ["RBAC", "Role-Based Access Control"],
    ["REST", "Representational State Transfer"],
    ["SPA", "Single-Page Application"],
    ["SQL", "Structured Query Language"],
    ["TS", "TypeScript"],
    ["UML", "Unified Modeling Language"],
    ["URL", "Uniform Resource Locator"],
    ["UX", "User Experience"],
    ["UI", "User Interface"],
    ["XP", "Experience Points"],
  ];

  return [
    new Paragraph({
      children: [new TextRun({ text: "LIST OF ABBREVIATIONS", font: FONT, size: 28, bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    ...academicTable(
      ["Abbreviation", "Full Form"],
      abbrevs,
      "List of Abbreviations",
      tableCounter++
    ),
    pageBreakPara(),
  ];
}


// ============================================================
// CHAPTER 1: INTRODUCTION
// ============================================================
function chapter1() {
  const content = [];
  content.push(heading1("Chapter 1: Introduction"));
  
  // 1.1 Background
  content.push(heading2("1.1 Background"));
  content.push(bodyPara("The landscape of education has undergone a profound transformation over the past two decades, driven primarily by the convergence of internet technologies, mobile computing, and increasingly, artificial intelligence. What began as simple computer-based training programs in the 1990s has evolved into sophisticated online learning platforms that serve millions of learners worldwide. The COVID-19 pandemic of 2020 accelerated this transformation dramatically, forcing educational institutions globally to adopt remote learning solutions almost overnight. According to UNESCO, at the peak of the pandemic, over 1.5 billion students were affected by school closures, leading to an unprecedented surge in the adoption of online learning platforms."));
  
  content.push(bodyPara("However, despite the remarkable growth in the number and variety of online learning platforms, a fundamental challenge persists: the vast majority of these platforms operate on a one-size-fits-all model that fails to account for the diverse learning needs, preferences, paces, and backgrounds of individual students. A student in a rural area of Pakistan with limited prior knowledge of computer science has vastly different learning requirements compared to a working professional in Silicon Valley seeking to upskill. Yet, on most platforms, both learners would be presented with identical course content, identical pacing, and identical assessment mechanisms."));
  
  content.push(bodyPara("The field of Artificial Intelligence in Education (AIEd) has emerged as a promising avenue for addressing these limitations. AI technologies, particularly machine learning and natural language processing, offer the potential to create learning experiences that adapt in real-time to individual student needs. Intelligent Tutoring Systems (ITS) have demonstrated significant learning gains in controlled environments, with meta-analyses showing effect sizes ranging from 0.30 to 0.90 standard deviations above traditional instruction. However, these systems have traditionally been expensive to develop, limited in scope, and difficult to scale."));
  
  content.push(bodyPara("The advent of Large Language Models (LLMs) such as GPT-4, Claude, and Gemini has opened new possibilities for AI-enhanced education. These models can engage in natural language conversations, generate educational content, provide explanations at varying levels of complexity, and adapt their communication style to individual learners. Unlike traditional ITS that require extensive domain modeling and curriculum authoring, LLMs can provide intelligent tutoring capabilities with minimal domain-specific configuration."));
  
  content.push(bodyPara("Yet, the integration of LLMs into educational platforms presents significant challenges. LLMs can produce factually incorrect information (hallucinations), their responses can be inconsistent, and they require network connectivity and API access that may not always be available. A production-grade educational platform cannot rely solely on LLMs for critical functionality, as service outages or API limitations could render the platform entirely non-functional."));
  
  content.push(bodyPara("This thesis presents ShijlAI Academy, an AI-powered personalized learning platform that addresses these challenges through a novel hybrid intelligence architecture. The platform combines deterministic, rule-based algorithms with optional LLM enhancement, creating a system that leverages the strengths of both approaches while mitigating their individual weaknesses. Rule-based components provide reliable, predictable, and always-available core functionality, while LLM integration adds adaptability, natural language understanding, and generative capabilities when available."));
  
  content.push(bodyPara("ShijlAI Academy is designed as a comprehensive educational platform serving three distinct user roles: students, instructors, and administrators. For students, the platform provides personalized learning paths, AI-powered tutoring, adaptive assessments, gamification elements, and intelligent study planning. For instructors, it offers course creation and management tools enhanced by an AI Copilot that can generate outlines, quizzes, assignments, and rubrics. For administrators, the platform provides system management capabilities augmented by an AI-powered analytics and decision support system."));
  
  content.push(bodyPara("The platform implements 15 distinct AI modules, operates on a database schema comprising 148 models organized across 10 functional domains, and exposes 176 API endpoints. The frontend employs a modern single-page application architecture with 68 view components organized by user role, ensuring responsive and intuitive user experiences across devices. The system is built on a cutting-edge technology stack featuring Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Prisma ORM, and the z-ai-web-dev-sdk for LLM integration."));
  
  // 1.2 Problem Statement
  content.push(heading2("1.2 Problem Statement"));
  content.push(bodyPara("Despite the proliferation of online learning platforms, there exists a significant gap between the potential of AI-driven personalization and its practical implementation in production-grade educational systems. The following specific problems motivate this research:"));
  
  content.push(heading3("1.2.1 Lack of True Personalization"));
  content.push(bodyPara("Current e-learning platforms predominantly deliver static, one-size-fits-all content. While some platforms offer basic adaptive features such as difficulty adjustment in quizzes or simple recommendation engines, none provide the depth of personalization that considers a student's learning style, prior knowledge, current mastery level, preferred study patterns, and career aspirations simultaneously. Students are expected to navigate course catalogs, select appropriate content, and manage their own learning pace without intelligent guidance."));
  
  content.push(heading3("1.2.2 Absence of Integrated AI Tutoring"));
  content.push(bodyPara("Most existing platforms treat AI as a supplementary feature rather than an integral component of the learning experience. Coursera provides pre-recorded video lectures with auto-graded assignments but lacks real-time AI tutoring. Udemy offers marketplace-style course access with no adaptive learning support. Khan Academy integrates AI for practice problems but does not provide a conversational AI tutor that can engage with students across multiple contexts. The integration of AI throughout the learning lifecycle\u2014from course selection to mastery assessment\u2014remains largely unrealized."));
  
  content.push(heading3("1.2.3 Reliability Concerns with LLM-Dependent Systems"));
  content.push(bodyPara("Educational platforms that rely solely on LLMs for critical functionality face reliability challenges. LLM API services can experience outages, rate limiting, or degraded performance. Responses may be factually incorrect or inconsistent. A production educational system cannot compromise on the availability and reliability of its core learning features. There is a need for architectural patterns that leverage LLM capabilities while maintaining system reliability through deterministic fallbacks."));
  
  content.push(heading3("1.2.4 Fragmented Learning Experience"));
  content.push(bodyPara("Existing platforms typically address isolated aspects of the learning journey. A student might use one platform for course content, another for practice problems, a third for career guidance, and yet another for community interaction. This fragmentation creates cognitive overhead and prevents the holistic optimization of the learning experience. An integrated platform that connects course learning, skill assessment, career planning, and community engagement through a unified AI intelligence layer is needed."));
  
  content.push(heading3("1.2.5 Limited Support for Educators"));
  content.push(bodyPara("While much attention has been focused on AI assistance for students, instructors\u2014who are critical stakeholders in the educational process\u2014receive comparatively less AI support. Course creation, assessment design, rubric generation, and student performance analysis remain largely manual processes. An AI-powered system that assists instructors in these tasks could significantly improve the quality and efficiency of educational content creation."));
  
  // 1.3 Research Objectives
  content.push(heading2("1.3 Research Objectives"));
  content.push(bodyPara("The primary objective of this research is to design, implement, and evaluate an AI-powered personalized learning platform that addresses the identified problems through a hybrid intelligence architecture. The specific objectives are:"));
  
  content.push(bodyPara("1. To design a hybrid intelligence architecture that combines rule-based algorithms with LLM enhancement, ensuring both reliability and adaptability in educational AI features."));
  content.push(bodyPara("2. To implement a comprehensive AI tutoring system (Ask ShijlAI) capable of operating in six distinct modes: tutor, quiz, assignment, study_planner, career_advisor, and companion, with context-aware personalization based on student profiles and mastery data."));
  content.push(bodyPara("3. To develop a multi-dimensional Topic Mastery system employing a weighted formula (quiz \u00d7 0.50 + assignment \u00d7 0.25 + practice \u00d7 0.15 + completion \u00d7 0.10) for precise skill assessment and tracking."));
  content.push(bodyPara("4. To create an AI-powered learning path generation system that produces both course-based and career-based personalized learning trajectories."));
  content.push(bodyPara("5. To implement AI assistance for instructors through an AI Copilot with 9 automated actions including outline generation, quiz creation, assignment design, and rubric generation."));
  content.push(bodyPara("6. To design and implement an Admin AI Copilot with a three-stage pipeline (intent detection, data retrieval, LLM reasoning) for intelligent platform administration."));
  content.push(bodyPara("7. To integrate gamification elements (XP, badges, streaks, challenges, rewards) with AI interactions, creating an engaging feedback loop that motivates continued learning."));
  content.push(bodyPara("8. To implement graceful degradation patterns ensuring all AI-enhanced features maintain rule-based fallbacks, guaranteeing platform functionality even during LLM service unavailability."));
  content.push(bodyPara("9. To evaluate the system through comprehensive testing including unit testing, integration testing, functional testing, security testing, performance testing, and AI feature evaluation."));
  
  // 1.4 Scope
  content.push(heading2("1.4 Scope of the Study"));
  content.push(bodyPara("This research encompasses the full-stack design, implementation, and evaluation of the ShijlAI Academy platform. The scope is defined across the following dimensions:"));
  
  content.push(heading3("1.4.1 In Scope"));
  content.push(bodyPara("The following areas fall within the scope of this thesis:"));
  content.push(bulletItem("Design and implementation of a complete web-based learning platform with three distinct user portals (Student, Instructor, Admin)"));
  content.push(bulletItem("Integration of 15 AI modules covering tutoring, assessment, analytics, and assistance functionalities"));
  content.push(bulletItem("Hybrid intelligence architecture combining rule-based and LLM-enhanced approaches"));
  content.push(bulletItem("Database design and implementation with 148 Prisma models across 10 functional domains"));
  content.push(bulletItem("API design and implementation with 176 route files following RESTful conventions"));
  content.push(bulletItem("Frontend implementation with 68 view components using Next.js 16, React 19, and TypeScript 5"));
  content.push(bulletItem("Gamification system with XP, badges, streaks, challenges, and rewards"));
  content.push(bulletItem("Community features including Q&A, discussions, and study groups"));
  content.push(bulletItem("Comprehensive testing and evaluation of all system components"));
  content.push(bulletItem("Security implementation including authentication, authorization, and data protection"));
  
  content.push(heading3("1.4.2 Out of Scope"));
  content.push(bodyPara("The following areas are explicitly excluded from the scope:"));
  content.push(bulletItem("Native mobile application development (the platform is web-based with responsive design)"));
  content.push(bulletItem("Video conferencing or live streaming capabilities"));
  content.push(bulletItem("Blockchain-based credential verification"));
  content.push(bulletItem("Multi-tenancy support for multiple educational institutions"));
  content.push(bulletItem("Payment gateway integration for production deployment"));
  content.push(bulletItem("Large-scale deployment and infrastructure management (DevOps)"));
  content.push(bulletItem("Accessibility compliance beyond basic WCAG guidelines"));
  content.push(bulletItem("Localization beyond the current language support"));
  content.push(bulletItem("Machine learning model training from scratch (the platform uses pre-trained LLMs)"));
  
  // 1.5 Significance
  content.push(heading2("1.5 Significance of the Study"));
  content.push(bodyPara("This research contributes to the fields of AI-enhanced education, software engineering, and human-computer interaction in several significant ways:"));
  
  content.push(heading3("1.5.1 Practical Contributions"));
  content.push(bodyPara("ShijlAI Academy demonstrates a production-viable architecture for integrating multiple AI capabilities into a cohesive educational platform. Unlike research prototypes that focus on a single AI capability in isolation, this project shows how 15 different AI modules can work together within a unified system architecture. The hybrid intelligence pattern\u2014combining rule-based reliability with LLM flexibility\u2014provides a practical blueprint for other educational technology projects seeking to leverage AI without compromising on dependability."));
  
  content.push(heading3("1.5.2 Theoretical Contributions"));
  content.push(bodyPara("The research establishes design patterns for hybrid intelligence systems in educational contexts. The Topic Mastery weighted formula (quiz \u00d7 0.50 + assignment \u00d7 0.25 + practice \u00d7 0.15 + completion \u00d7 0.10) provides a systematic approach to multi-dimensional skill assessment. The graceful degradation architecture demonstrates how LLM-dependent features can coexist with reliable rule-based fallbacks, contributing to the broader discourse on dependable AI system design."));
  
  content.push(heading3("1.5.3 Social Impact"));
  content.push(bodyPara("By providing a platform that offers intelligent, personalized tutoring and study planning, ShijlAI Academy has the potential to democratize access to quality education. Students in underserved communities who lack access to human tutors can benefit from AI-powered guidance that adapts to their individual needs. The platform's community features (Q&A, discussions, study groups) further promote collaborative learning and peer support."));
  
  content.push(heading3("1.5.4 Economic Impact"));
  content.push(bodyPara("The Instructor AI Copilot has the potential to significantly reduce the time and effort required for course creation and management. By automating routine tasks such as quiz generation, assignment creation, and rubric development, instructors can focus on higher-value activities such as mentoring, research, and curriculum design. This efficiency gain could reduce the cost of educational content production, making quality courses more affordable."));
  
  // 1.6 Research Methodology
  content.push(heading2("1.6 Research Methodology"));
  content.push(bodyPara("This research adopts a Design Science Research (DSR) methodology, which is particularly suited for information systems research that involves the creation and evaluation of IT artifacts. The DSR methodology encompasses the following phases:"));
  
  content.push(heading3("1.6.1 Problem Identification and Motivation"));
  content.push(bodyPara("The initial phase involved a comprehensive literature review of existing e-learning platforms, AI in education research, and Intelligent Tutoring Systems. This review identified the gap between the potential of AI-driven personalization and its practical implementation in production systems, motivating the design of ShijlAI Academy."));
  
  content.push(heading3("1.6.2 Definition of Objectives for a Solution"));
  content.push(bodyPara("Based on the identified problems, specific objectives were defined for the ShijlAI Academy platform. These objectives encompass both functional requirements (what the system should do) and non-functional requirements (how well the system should perform). The objectives were refined through iterative stakeholder analysis and feasibility assessment."));
  
  content.push(heading3("1.6.3 Design and Development"));
  content.push(bodyPara("The system was designed following a layered architecture pattern with clear separation of concerns. The development process followed an agile methodology with iterative sprints, incorporating continuous integration and testing. The hybrid intelligence architecture was designed as the core innovation, with each AI module following the pattern of rule-based primary logic with optional LLM enhancement."));
  
  content.push(heading3("1.6.4 Demonstration"));
  content.push(bodyPara("The developed system was demonstrated through comprehensive functional testing across all three user portals and all 15 AI modules. Screenshots of key functionalities were captured and are presented in the testing and evaluation chapter."));
  
  content.push(heading3("1.6.5 Evaluation"));
  content.push(bodyPara("The system was evaluated through multiple testing approaches: unit testing of individual components, integration testing of component interactions, functional testing against requirements, security testing for vulnerability assessment, performance testing for scalability, and AI feature evaluation for assessing the quality and reliability of AI-generated outputs."));
  
  content.push(heading3("1.6.6 Communication"));
  content.push(bodyPara("The research findings are communicated through this thesis document, which provides a comprehensive account of the problem, solution design, implementation, and evaluation. The thesis follows a standard academic format suitable for publication and academic discourse."));
  
  // Methodology diagram
  content.push(...mermaidDiagram(
    `graph TD
    A[Problem Identification] --> B[Literature Review]
    B --> C[Define Objectives]
    C --> D[Design Solution]
    D --> E[Implement System]
    E --> F[Demonstrate]
    F --> G[Evaluate]
    G -->|Iterate| D
    G --> H[Communicate - Thesis]
    
    style A fill:#f9f,stroke:#333
    style D fill:#bbf,stroke:#333
    style G fill:#bfb,stroke:#333
    style H fill:#fbb,stroke:#333`,
    "Thesis Research Methodology Overview",
    figCounter++
  ));
  
  // 1.7 Thesis Organization
  content.push(heading2("1.7 Thesis Organization"));
  content.push(bodyPara("This thesis is organized into seven chapters, each addressing a specific aspect of the research. The following overview provides a roadmap for the reader:"));
  
  content.push(bodyPara("Chapter 1: Introduction presents the background of the research, identifies the problem statement, defines the research objectives, delineates the scope, discusses the significance, outlines the methodology, and provides an overview of the thesis organization."));
  
  content.push(bodyPara("Chapter 2: Literature Review provides a comprehensive review of existing research and systems in the domains of e-learning evolution, AI in education, personalized learning, Intelligent Tutoring Systems, learning analytics, and a detailed comparative analysis of existing platforms including Coursera, Udemy, Khan Academy, Moodle, and edX. The chapter concludes with an identification of the research gap that this thesis addresses."));
  
  content.push(bodyPara("Chapter 3: Requirements Analysis presents the stakeholder analysis, feasibility study, detailed functional and non-functional requirements, hardware and software requirements, and a risk analysis with mitigation strategies."));
  
  content.push(bodyPara("Chapter 4: System Design describes the overall system architecture, layered architecture, portal architecture, AI services architecture, UML models (use case, activity, sequence, and class diagrams), data flow diagrams, database design including the ER diagram and schema details for all 10 domains, and the security design."));
  
  content.push(bodyPara("Chapter 5: System Implementation provides detailed coverage of the technology stack, authentication module, student module, instructor module, admin module, all 15 AI components with implementation details, API design, database integration, and security implementation."));
  
  content.push(bodyPara("Chapter 6: Testing and Evaluation presents the testing methodology and results across unit, integration, functional, security, and performance testing, along with AI feature evaluation and user interface assessment."));
  
  content.push(bodyPara("Chapter 7: Conclusion and Future Work summarizes the achievements, discusses limitations, and outlines directions for future research and development."));
  
  content.push(pageBreakPara());
  return content;
}


// ============================================================
// CHAPTER 2: LITERATURE REVIEW
// ============================================================
function chapter2() {
  const content = [];
  content.push(heading1("Chapter 2: Literature Review"));
  
  // 2.1 Evolution of E-Learning
  content.push(heading2("2.1 Evolution of E-Learning"));
  content.push(bodyPara("The evolution of e-learning can be traced through several distinct phases, each characterized by technological innovations that expanded the possibilities of distance education. Understanding this evolution is essential for contextualizing the contributions of ShijlAI Academy within the broader trajectory of educational technology."));
  
  content.push(heading3("2.1.1 First Generation: Computer-Based Training (CBT)"));
  content.push(bodyPara("The earliest form of e-learning emerged in the 1960s with Computer-Based Training (CBT) systems. These systems were essentially digital adaptations of printed instructional materials, presenting content in a linear, page-by-page format with minimal interactivity. The PLATO (Programmed Logic for Automatic Teaching Operations) system, developed at the University of Illinois in 1960, is widely regarded as the first generalized computer-assisted instruction system. PLATO supported over 12,000 terminals and offered more than 15,000 hours of instruction across various subjects. However, these early systems were limited by the technology of their time: they operated on mainframe computers, had text-only interfaces, and provided no adaptive functionality."));
  
  content.push(heading3("2.1.2 Second Generation: Multimedia and CD-ROM Era"));
  content.push(bodyPara("The 1990s saw the emergence of multimedia CD-ROM-based learning, which introduced audio, video, and interactive elements to digital learning. Tools like Macromedia Director and Authorware enabled the creation of rich multimedia educational content. This generation improved learner engagement through visual and auditory stimuli but remained fundamentally static\u2014content was pre-produced and could not adapt to individual learner needs. The distribution model was also limited: content had to be physically shipped on CD-ROMs, making updates costly and slow."));
  
  content.push(heading3("2.1.3 Third Generation: Web-Based Learning and LMS"));
  content.push(bodyPara("The advent of the World Wide Web in the mid-1990s revolutionized e-learning by enabling online delivery of educational content. Learning Management Systems (LMS) such as Blackboard (1997), WebCT (1995), and later Moodle (2002) provided platforms for course delivery, student management, and basic interaction through forums and messaging. This generation introduced the concept of anywhere, anytime learning and enabled instructors to update content dynamically. However, the pedagogical model remained largely transmissive\u2014content was delivered to students with limited personalization or adaptive capabilities."));
  
  content.push(heading3("2.1.4 Fourth Generation: MOOCs and Open Education"));
  content.push(bodyPara("The launch of Coursera and edX in 2012 marked the beginning of the MOOC (Massive Open Online Course) era. MOOCs democratized access to education by offering courses from prestigious universities to anyone with an internet connection. By 2020, Coursera alone had over 76 million registered learners. However, MOOCs also exposed the limitations of scale without personalization: completion rates averaged only 5-15%, with many learners dropping out due to lack of engagement, inadequate support, and the absence of personalized learning pathways."));
  
  content.push(heading3("2.1.5 Fifth Generation: AI-Enhanced Adaptive Learning"));
  content.push(bodyPara("The current generation of e-learning is characterized by the integration of artificial intelligence to create adaptive, personalized learning experiences. AI-enhanced platforms use machine learning algorithms to analyze learner behavior, predict learning outcomes, and dynamically adjust content delivery. Platforms like Duolingo use spaced repetition algorithms optimized by machine learning, while Knewton (now part of Wiley) pioneered adaptive learning technology that continuously adjusted content difficulty based on student performance. This generation represents the frontier that ShijlAI Academy aims to advance through its hybrid intelligence architecture."));
  
  content.push(...mermaidDiagram(
    `graph LR
    subgraph Gen1["1st Gen: CBT (1960s)"]
    A1[PLATO System] --> A2[Linear Content]
    A2 --> A3[Mainframe Based]
    end
    
    subgraph Gen2["2nd Gen: Multimedia (1990s)"]
    B1[CD-ROM Delivery] --> B2[Audio/Video]
    B2 --> B3[Limited Interactivity]
    end
    
    subgraph Gen3["3rd Gen: Web LMS (2000s)"]
    C1[Blackboard/Moodle] --> C2[Online Delivery]
    C2 --> C3[Basic Forums]
    end
    
    subgraph Gen4["4th Gen: MOOCs (2012+)"]
    D1[Coursera/edX] --> D2[Massive Scale]
    D2 --> D3[Low Completion]
    end
    
    subgraph Gen5["5th Gen: AI Adaptive (2020+)"]
    E1[ShijlAI Academy] --> E2[Hybrid AI]
    E2 --> E3[Personalization]
    end
    
    Gen1 --> Gen2 --> Gen3 --> Gen4 --> Gen5`,
    "Evolution of E-Learning Technologies (2000-2025)",
    figCounter++
  ));
  
  // 2.2 AI in Education
  content.push(heading2("2.2 Artificial Intelligence in Education"));
  content.push(bodyPara("Artificial Intelligence in Education (AIEd) is a multidisciplinary field that applies AI techniques to enhance educational processes, systems, and outcomes. The field has evolved from early rule-based tutoring systems to sophisticated machine learning and deep learning applications, and most recently to the integration of Large Language Models (LLMs) for natural language understanding and generation."));
  
  content.push(heading3("2.2.1 Foundations of AI in Education"));
  content.push(bodyPara("The application of AI in education has a rich history dating back to the 1960s. Carbonell (1970) developed SCHOLAR, one of the first intelligent tutoring systems that used a mixed-initiative dialogue approach to teach South American geography. The system maintained a semantic network of geographical facts and could answer student questions while also posing questions to assess understanding. While primitive by modern standards, SCHOLAR established the fundamental paradigm of AI-driven educational interaction that persists to this day."));
  
  content.push(bodyPara("The 1980s saw significant advances in AIEd with systems like LISP Tutor (Anderson et al., 1985), which used cognitive models of student problem-solving to provide targeted feedback. The LISP Tutor demonstrated that AI tutoring could produce learning gains equivalent to one-on-one human tutoring, a finding that has been consistently replicated across subsequent systems. This result remains one of the most compelling arguments for the potential of AI in education."));
  
  content.push(heading3("2.2.2 Machine Learning Applications in Education"));
  content.push(bodyPara("Machine learning (ML) has found numerous applications in education, primarily in the areas of predictive analytics, student modeling, and content recommendation. Baker and colleagues (2010) developed models for detecting student disengagement in online learning environments, enabling early intervention. Learning analytics platforms use ML to identify at-risk students, predict course outcomes, and recommend personalized learning resources."));
  
  content.push(bodyPara("Knowledge Tracing, introduced by Corbett and Anderson (1995), uses Bayesian networks to model a student's knowledge state over time, enabling prediction of future performance on specific skills. Deep Knowledge Tracing (Piech et al., 2015) extended this approach using recurrent neural networks, demonstrating improved prediction accuracy without the need for manual feature engineering. These techniques form the theoretical foundation for the Topic Mastery system implemented in ShijlAI Academy."));
  
  content.push(heading3("2.2.3 Large Language Models in Education"));
  content.push(bodyPara("The emergence of Large Language Models (LLMs) such as GPT-4, Claude, and Gemini represents a paradigm shift in AI's potential for educational applications. Unlike previous approaches that required extensive domain-specific engineering, LLMs can engage in open-ended educational dialogue, explain concepts at varying levels of complexity, generate practice problems, provide feedback on student work, and adapt their communication style to individual learners\u2014all with minimal domain-specific configuration."));
  
  content.push(bodyPara("However, the application of LLMs in education raises significant concerns. LLMs can generate factually incorrect information with high confidence (hallucination), may perpetuate biases present in training data, and can produce inconsistent responses to identical queries. In an educational context, where factual accuracy is paramount, these limitations require careful mitigation. The hybrid intelligence architecture of ShijlAI Academy addresses these concerns by using LLMs as enhancement layers over deterministic rule-based systems, ensuring that core educational functionality remains reliable while still benefiting from LLM capabilities when available."));
  
  content.push(...mermaidDiagram(
    `graph TD
    subgraph AI_Taxonomy["AI in Education Taxonomy"]
    A[AI in Education] --> B[Natural Language Processing]
    A --> C[Machine Learning]
    A --> D[Knowledge Representation]
    A --> E[Computer Vision]
    
    B --> B1[Chatbot Tutors]
    B --> B2[Automated Essay Scoring]
    B --> B3[Content Generation]
    
    C --> C1[Knowledge Tracing]
    C --> C2[Dropout Prediction]
    C --> C3[Recommendation Systems]
    
    D --> D1[Student Models]
    D --> D2[Domain Models]
    D --> D3[Curriculum Maps]
    
    E --> E1[Proctoring]
    E --> E2[Gesture Recognition]
    E --> E3[Attention Tracking]
    end`,
    "AI in Education Taxonomy",
    figCounter++
  ));
  
  // 2.3 Personalized Learning Systems
  content.push(heading2("2.3 Personalized Learning Systems"));
  content.push(bodyPara("Personalized learning refers to educational approaches that tailor the learning experience to the individual needs, skills, and interests of each student. While the concept of personalized instruction has existed for centuries\u2014from Socratic dialogue to one-on-one tutoring\u2014technology has made it possible to deliver personalized learning at scale."));
  
  content.push(heading3("2.3.1 Dimensions of Personalization"));
  content.push(bodyPara("Personalization in learning systems can occur across multiple dimensions. Content personalization involves selecting and sequencing learning materials based on a student's current knowledge level and learning objectives. Pacing personalization allows students to progress through material at their own speed, spending more time on challenging concepts and accelerating through familiar ones. Assessment personalization adapts the difficulty and type of evaluation based on a student's demonstrated abilities. Pathway personalization generates individualized learning trajectories that connect a student's current state to their desired outcomes through optimal sequences of learning activities."));
  
  content.push(bodyPara("ShijlAI Academy implements personalization across all four dimensions. Content personalization is achieved through AI-driven recommendations and the Ask ShijlAI tutor that adapts explanations to student context. Pacing personalization is provided by the AI Study Planner that generates schedules based on individual learning patterns and constraints. Assessment personalization is implemented through the AI Quiz Generator and adaptive difficulty mechanisms. Pathway personalization is delivered through the AI Learning Paths module that generates both course-based and career-based trajectories."));
  
  content.push(heading3("2.3.2 Adaptive Learning Technologies"));
  content.push(bodyPara("Adaptive learning technologies dynamically adjust the learning experience based on real-time analysis of student performance and behavior. These systems typically employ one or more of the following approaches: item response theory (IRT) for difficulty calibration, Bayesian knowledge tracing for state estimation, collaborative filtering for content recommendation, and reinforcement learning for policy optimization."));
  
  content.push(bodyPara("Knewton's adaptive learning platform, one of the most prominent commercial implementations, used a combination of IRT and collaborative filtering to create personalized learning paths. The system continuously updated its model of each student's knowledge state and recommended the most appropriate next learning activity. However, Knewton's approach required extensive metadata tagging of learning objects, a time-consuming process that limited its scalability. ShijlAI Academy's approach differs by using LLMs to generate and adapt content dynamically, reducing the need for extensive pre-tagging while maintaining personalization through context injection."));
  
  content.push(heading3("2.3.3 Learner Modeling"));
  content.push(bodyPara("Effective personalization requires accurate learner models that capture various aspects of a student's knowledge, preferences, and behaviors. The overlay model represents a student's knowledge as a subset of the domain expert's knowledge, tracking which concepts the student has mastered and which they have not. The perturbation model extends the overlay by also capturing misconceptions and buggy knowledge. The differential model compares a student's knowledge to expert knowledge to identify gaps."));
  
  content.push(bodyPara("ShijlAI Academy employs a multi-faceted learner model that combines elements of these approaches. The Topic Mastery system tracks mastery levels across a hierarchical skill taxonomy, the Learning Companion monitors behavioral patterns for real-time insights, and the AI Recommendations engine integrates these data sources to provide holistic personalization. Student profile and mastery data are injected into LLM system prompts through the Context Injection pattern, enabling LLM-enhanced features to produce personalized outputs without requiring fine-tuning."));
  
  // 2.4 Intelligent Tutoring Systems
  content.push(heading2("2.4 Intelligent Tutoring Systems"));
  content.push(bodyPara("Intelligent Tutoring Systems (ITS) are computer-based instructional systems that provide individualized instruction by modeling student knowledge, adapting instruction based on that model, and providing immediate feedback. ITS represent the most direct application of AI to education and have a research history spanning over five decades."));
  
  content.push(heading3("2.4.1 Architecture of Intelligent Tutoring Systems"));
  content.push(bodyPara("The traditional ITS architecture consists of four core components: the domain model, the student model, the pedagogical model, and the interface model. The domain model encodes the knowledge to be taught, typically as a structured representation of concepts, skills, and their relationships. The student model represents the system's understanding of the learner's current knowledge state, including mastered concepts, misconceptions, and learning preferences. The pedagogical model determines the instructional strategies and tactics for presenting content, selecting problems, and providing feedback. The interface model manages the interaction between the student and the system."));
  
  content.push(bodyPara("ShijlAI Academy's architecture can be viewed as a modern reinterpretation of this traditional ITS framework. The Topic Mastery system and skill taxonomy correspond to the domain model, the student profile and mastery data constitute the student model, the AI modules (Ask ShijlAI, AI Study Planner, AI Recommendations) implement the pedagogical model, and the three portal shells (Student, Instructor, Admin) serve as the interface model. The key innovation is the replacement of rigid, pre-programmed pedagogical rules with a hybrid system that combines deterministic algorithms with flexible LLM-based reasoning."));
  
  content.push(heading3("2.4.2 Effectiveness of Intelligent Tutoring Systems"));
  content.push(bodyPara("Meta-analyses of ITS effectiveness have consistently demonstrated positive learning outcomes. Kulik and Fletcher (2016) conducted a meta-analysis of 50 controlled evaluations of ITS and found an average effect size of 0.63 standard deviations, indicating that students using ITS outperformed 73% of students in traditional instruction conditions. The effect was particularly pronounced in STEM subjects and for systems that provided immediate feedback and step-by-step guidance."));
  
  content.push(bodyPara("However, traditional ITS suffer from several limitations that have hindered widespread adoption. First, they require extensive domain modeling, which is labor-intensive and requires deep domain expertise. Second, they are typically limited to well-structured domains with clearly defined problem-solving procedures. Third, the cost of developing a high-quality ITS has been estimated at 100-200 hours of development per hour of instruction, making them prohibitively expensive for most educational contexts. ShijlAI Academy addresses these limitations by using LLMs to reduce the domain modeling burden while maintaining the structured pedagogical approach through rule-based components."));
  
  content.push(heading3("2.4.3 Conversational Intelligent Tutoring Systems"));
  content.push(bodyPara("Conversational ITS extend traditional ITS by incorporating natural language dialogue capabilities, enabling students to ask questions, receive explanations, and engage in Socratic-style tutoring interactions. AutoTutor (Graesser et al., 2004) is one of the most extensively researched conversational ITS, using a combination of natural language processing, dialogue management, and animated conversational agents to simulate human tutoring. Evaluations of AutoTutor have shown learning gains of approximately 0.80 standard deviations above reading a textbook alone."));
  
  content.push(bodyPara("The Ask ShijlAI module in ShijlAI Academy represents a significant evolution of the conversational ITS paradigm. Unlike AutoTutor, which was designed for specific subject domains, Ask ShijlAI operates in six distinct modes (tutor, quiz, assignment, study_planner, career_advisor, companion), each with specialized system prompts and context injection. Furthermore, Ask ShijlAI integrates with the platform's Topic Mastery and Learning Companion systems, enabling contextually rich conversations that reference the student's actual performance data, learning patterns, and career goals."));
  
  content.push(...academicTable(
    ["ITS System", "Year", "Domain", "AI Technique", "Effect Size"],
    [
      ["SCHOLAR", "1970", "Geography", "Rule-based QA", "N/A"],
      ["LISP Tutor", "1985", "Programming", "Cognitive Model", "0.80"],
      ["AutoTutor", "2004", "Multiple", "NLP + Dialogue", "0.80"],
      ["Cognitive Tutor", "1998", "Mathematics", "Bayesian KT", "0.63"],
      ["ALEKS", "2000", "Mathematics", "IRT + Knowledge Space", "0.50"],
      ["Ask ShijlAI", "2026", "Multi-domain", "Hybrid Rule+LLM", "TBD"],
    ],
    "Summary of Intelligent Tutoring Systems Reviewed",
    tableCounter++
  ));
  
  // 2.5 Learning Analytics
  content.push(heading2("2.5 Learning Analytics and Educational Data Mining"));
  content.push(bodyPara("Learning Analytics (LA) and Educational Data Mining (EDM) are related fields that apply data analysis techniques to educational data to understand and optimize learning processes. The Society for Learning Analytics Research (SoLAR) defines learning analytics as \"the measurement, collection, analysis, and reporting of data about learners and their contexts, for purposes of understanding and optimizing learning and the environments in which it occurs.\""));
  
  content.push(heading3("2.5.1 Learning Analytics Techniques"));
  content.push(bodyPara("Common LA techniques include descriptive analytics (summarizing historical learning data), diagnostic analytics (identifying factors that influence learning outcomes), predictive analytics (forecasting future performance and behavior), and prescriptive analytics (recommending actions to improve outcomes). These techniques employ methods ranging from simple statistical aggregation to sophisticated machine learning models."));
  
  content.push(bodyPara("ShijlAI Academy implements analytics across all four categories. The AI Insights module provides descriptive and diagnostic analytics through seven rule-based insight rules (consistency, course engagement, skill diversity, struggling areas, time optimization, pace adaptation, progress milestone) with optional LLM enhancement. Predictive analytics are implemented through the AI Study Planner's ability to forecast completion timelines based on historical learning patterns. Prescriptive analytics are delivered through the AI Recommendations engine that suggests specific learning actions based on student profiles and mastery data."));
  
  content.push(heading3("2.5.2 Educational Data Mining"));
  content.push(bodyPara("EDM applies data mining techniques specifically to educational contexts. Common EDM tasks include student performance prediction, knowledge component discovery, behavior pattern mining, and social network analysis of learning communities. Baker and Yacef (2009) identified five key EDM methods: prediction, clustering, relationship mining, distillation of data for human judgment, and discovery with models."));
  
  content.push(bodyPara("The ShijlAI Academy platform generates rich educational data through its comprehensive tracking systems: enrollment progress, quiz submissions, assignment submissions, learning companion interactions, study session logs, and gamification events. While the current implementation focuses on real-time rule-based analytics, the data infrastructure is designed to support more sophisticated EDM techniques in future iterations, including clustering for student segmentation and predictive modeling for early intervention."));
  
  content.push(heading3("2.5.3 Dashboards and Visualization"));
  content.push(bodyPara("Learning analytics dashboards provide visual representations of educational data that support decision-making by students, instructors, and administrators. Verbert et al. (2014) reviewed learning analytics dashboards and identified four purposes: awareness, reflection, sense-making, and impact. Effective dashboards must balance comprehensiveness with usability, providing actionable insights without overwhelming users with data."));
  
  content.push(bodyPara("ShijlAI Academy implements role-based analytics dashboards through its Intelligent Analytics module. Student dashboards display learning progress, skill mastery, streaks, and AI-generated insights. Instructor dashboards show course performance, student engagement metrics, and AI Copilot recommendations. Admin dashboards present platform-wide health indicators, user activity trends, and system intelligence reports. Each dashboard is tailored to the specific decision-making needs of its target role."));
  
  // 2.6 Comparative Analysis
  content.push(heading2("2.6 Comparative Analysis of Existing Platforms"));
  content.push(bodyPara("To contextualize the contributions of ShijlAI Academy, a detailed comparative analysis was conducted of five major e-learning platforms: Coursera, Udemy, Khan Academy, Moodle, and edX. These platforms represent a cross-section of the e-learning market, ranging from MOOC providers to open-source LMS solutions."));
  
  content.push(heading3("2.6.1 Coursera"));
  content.push(bodyPara("Coursera, founded in 2012 by Stanford professors Andrew Ng and Daphne Koller, is one of the world's largest online learning platforms with over 130 million registered learners as of 2024. Coursera partners with over 300 universities and industry leaders to offer courses, specializations, professional certificates, and degrees. The platform offers video lectures, auto-graded assignments, peer-reviewed submissions, and discussion forums. Coursera has begun integrating AI features, including an AI-powered chatbot study assistant and AI-generated course summaries, but these features are limited in scope and do not provide the depth of personalization that ShijlAI Academy offers."));
  
  content.push(heading3("2.6.2 Udemy"));
  content.push(bodyPara("Udemy, founded in 2010, operates as a marketplace model where anyone can create and sell courses. With over 64 million learners and 210,000+ courses, Udemy emphasizes breadth of content over depth of pedagogy. The platform offers video lectures, articles, and basic quizzes but lacks adaptive learning features, AI tutoring, and personalized learning paths. Udemy's open marketplace model results in variable content quality, and the platform provides minimal tools for instructors to optimize their courses based on learning analytics."));
  
  content.push(heading3("2.6.3 Khan Academy"));
  content.push(bodyPara("Khan Academy, founded in 2008 by Salman Khan, is a non-profit educational platform that provides free courses across a wide range of subjects. The platform has been a pioneer in adaptive learning through its mastery learning system and Khanmigo, an AI-powered tutoring assistant built on GPT-4 technology. Khanmigo represents the closest existing analog to Ask ShijlAI, providing conversational tutoring and Socratic questioning. However, Khan Academy's AI features are limited to the tutoring context and do not extend to study planning, career advising, or instructor assistance. Additionally, Khan Academy focuses primarily on K-12 education and lacks the comprehensive multi-role architecture of ShijlAI Academy."));
  
  content.push(heading3("2.6.4 Moodle"));
  content.push(bodyPara("Moodle is an open-source Learning Management System used by over 300 million users worldwide. Unlike the other platforms in this comparison, Moodle is primarily an institutional LMS that provides course management, assessment, and collaboration tools rather than a consumer-facing learning platform. Moodle's plugin architecture supports extensive customization, and several AI plugins exist, but there is no native, integrated AI tutoring system comparable to ShijlAI Academy's comprehensive AI modules. Moodle's strength lies in its flexibility and institutional control, while its weakness is the absence of built-in intelligent features."));
  
  content.push(heading3("2.6.5 edX"));
  content.push(bodyPara("edX, founded in 2012 by Harvard and MIT, offers courses from over 160 partner institutions. The platform provides a range of learning experiences from free audits to verified certificates and full degree programs. edX has experimented with AI features, including adaptive learning pathways in some courses and AI-assisted grading. However, these features are not universally available across the platform and do not constitute a comprehensive AI integration. edX's open-source platform, Open edX, allows for customization but requires significant technical expertise to implement AI features."));
  
  content.push(...academicTable(
    ["Feature", "Coursera", "Udemy", "Khan Academy", "Moodle", "edX", "ShijlAI Academy"],
    [
      ["AI Tutoring", "Basic", "None", "Khanmigo", "Plugin", "Limited", "15 AI Modules"],
      ["Adaptive Learning", "Limited", "None", "Mastery", "Plugin", "Partial", "Full Hybrid"],
      ["Personalized Paths", "Specializations", "None", "Limited", "Manual", "XSeries", "AI-Generated"],
      ["Skill Assessment", "Quizzes", "Basic", "Mastery", "Quizzes", "Graded", "Weighted Formula"],
      ["Study Planning", "None", "None", "None", "None", "None", "AI Study Planner"],
      ["Career Guidance", "Certificates", "None", "None", "None", "Degrees", "AI Career Advisor"],
      ["Instructor AI", "None", "None", "None", "None", "None", "AI Copilot (9 actions)"],
      ["Admin AI", "None", "None", "None", "None", "None", "AI Copilot (3-stage)"],
      ["Gamification", "Certificates", "None", "Points/Badges", "Plugins", "Certificates", "Full (XP/Streaks/etc)"],
      ["Community", "Forums", "Q&A", "None", "Forums", "Forums", "Q&A/Groups"],
      ["Hybrid AI", "No", "No", "No", "No", "No", "Yes (Rule+LLM)"],
      ["Graceful Degradation", "N/A", "N/A", "N/A", "N/A", "N/A", "Yes (Fallbacks)"],
    ],
    "Comparison of E-Learning Platforms with AI Features",
    tableCounter++
  ));
  
  content.push(...mermaidDiagram(
    `graph LR
    subgraph Existing["Existing Platforms"]
    C[Coursera] -->|Limited AI| C1[Basic Chat]
    U[Udemy] -->|No AI| U1[Static Content]
    K[Khan Academy] -->|Some AI| K1[Khanmigo Tutor]
    M[Moodle] -->|Plugin AI| M1[Third-party]
    E[edX] -->|Partial AI| E1[Adaptive Paths]
    end
    
    subgraph ShijlAI["ShijlAI Academy"]
    S[Hybrid AI Core] --> S1[Ask ShijlAI - 6 Modes]
    S --> S2[AI Learning Companion]
    S --> S3[AI Quiz Generator]
    S --> S4[AI Mock Interview]
    S --> S5[AI Insights - 7 Rules]
    S --> S6[AI Recommendations]
    S --> S7[AI Study Planner]
    S --> S8[AI Learning Paths]
    S --> S9[Topic Mastery]
    S --> S10[Instructor AI Copilot]
    S --> S11[Admin AI Copilot]
    end`,
    "Comparison of Existing Platform Features",
    figCounter++
  ));
  
  // 2.7 Research Gap
  content.push(heading2("2.7 Research Gap and Justification"));
  content.push(bodyPara("The comprehensive literature review and comparative analysis reveal several significant gaps in existing research and practice that justify the development of ShijlAI Academy:"));
  
  content.push(bodyPara("First, there is a gap between the demonstrated effectiveness of Intelligent Tutoring Systems in controlled research settings and their practical implementation in production-grade educational platforms. While ITS research has shown impressive learning gains, most existing platforms offer at most basic AI features such as simple chatbots or adaptive quiz difficulty. No existing platform implements the breadth of AI capabilities found in research ITS while maintaining production-grade reliability."));
  
  content.push(bodyPara("Second, the architectural challenge of integrating LLMs into educational systems without compromising reliability has not been adequately addressed in the literature. Most existing approaches either rely entirely on LLMs (risking reliability issues) or avoid them entirely (missing their potential). The hybrid intelligence pattern\u2014combining deterministic rule-based systems with optional LLM enhancement\u2014represents a novel architectural contribution that addresses this gap."));
  
  content.push(bodyPara("Third, existing platforms treat AI features as isolated components rather than integrated aspects of a coherent learning ecosystem. A student using Khanmigo for tutoring receives no benefit from that interaction in their study planning, skill assessment, or career guidance. ShijlAI Academy's architecture ensures that AI interactions across all modules contribute to a unified student model, enabling holistic personalization."));
  
  content.push(bodyPara("Fourth, the needs of instructors and administrators for AI assistance have been largely neglected. While significant research exists on AI tutoring for students, comparatively little attention has been paid to AI-powered tools for course creation, assessment design, and platform administration. ShijlAI Academy's Instructor AI Copilot and Admin AI Copilot address this gap."));
  
  content.push(bodyPara("Fifth, no existing platform has implemented a comprehensive Topic Mastery system with a weighted formula that combines multiple assessment dimensions (quiz, assignment, practice, completion) into a single mastery score, nor integrated this system with LLM-powered features through context injection. This approach to multi-dimensional skill assessment represents a novel contribution to the field."));
  
  content.push(bodyPara("These gaps collectively justify the research and development effort invested in ShijlAI Academy. The platform addresses each identified gap through specific architectural innovations and implementation decisions, resulting in a system that advances the state of the art in AI-enhanced education."));
  
  content.push(pageBreakPara());
  return content;
}


// ============================================================
// CHAPTER 3: REQUIREMENTS ANALYSIS
// ============================================================
function chapter3() {
  const content = [];
  content.push(heading1("Chapter 3: Requirements Analysis"));
  
  // 3.1 Stakeholder Analysis
  content.push(heading2("3.1 Stakeholder Analysis"));
  content.push(bodyPara("A stakeholder analysis was conducted to identify all individuals and groups who have an interest in or influence over the ShijlAI Academy platform. Understanding stakeholder needs is essential for defining requirements that align with the expectations and constraints of all parties involved."));
  
  content.push(heading3("3.1.1 Primary Stakeholders"));
  content.push(bodyPara("Students are the primary beneficiaries of the ShijlAI Academy platform. They interact with the system to access courses, engage with AI tutoring, track their learning progress, earn gamification rewards, participate in community activities, and plan their learning journeys. Student requirements emphasize ease of use, personalization, engagement, and accessibility across devices. The student portal provides 13 dedicated view components covering dashboard, course browsing, lesson viewing, quiz taking, assignment submission, AI chat, study planning, career paths, community interactions, profile management, and gamification tracking."));
  
  content.push(bodyPara("Instructors create and manage educational content, assess student work, and monitor course performance. They require efficient content creation tools, AI-assisted assessment generation, student analytics, and communication capabilities. The instructor portal provides 18 dedicated view components including dashboard, course management, student management, AI Copilot access, analytics, and financial tracking."));
  
  content.push(bodyPara("Administrators oversee the entire platform, managing users, courses, financial transactions, and system configuration. They require comprehensive monitoring tools, user management capabilities, content moderation features, and AI-powered insights for decision-making. The admin portal provides 12+ dedicated view components covering dashboard, user management, course oversight, financial management, AI Copilot, system settings, and audit logs."));
  
  content.push(heading3("3.1.2 Secondary Stakeholders"));
  content.push(bodyPara("Secondary stakeholders include the University of Malakand administration (who may adopt the platform for institutional use), the Department of Computer Science and IT faculty (who may serve as instructors), IT support staff (who maintain the platform infrastructure), and prospective employers of students (who benefit from the skills and career guidance features). While these stakeholders do not directly interact with the system as primary users, their needs and constraints inform the platform's design decisions."));
  
  content.push(...mermaidDiagram(
    `graph TD
    A[ShijlAI Academy Stakeholders] --> B[Primary]
    A --> C[Secondary]
    
    B --> B1[Students]
    B --> B2[Instructors]
    B --> B3[Administrators]
    
    B1 --> B1a[13 View Components]
    B1 --> B1b[AI Tutoring + Study Planning]
    B1 --> B1c[Gamification + Community]
    
    B2 --> B2a[18 View Components]
    B2 --> B2b[Course Creation + AI Copilot]
    B2 --> B2c[Student Analytics]
    
    B3 --> B3a[12+ View Components]
    B3 --> B3b[Platform Management + AI Copilot]
    B3 --> B3c[Audit + Security]
    
    C --> C1[University Administration]
    C --> C2[Faculty Members]
    C --> C3[IT Support Staff]
    C --> C4[Employers]`,
    "Stakeholder Hierarchy of ShijlAI Academy",
    figCounter++
  ));
  
  // 3.2 Feasibility Study
  content.push(heading2("3.2 Feasibility Study"));
  content.push(bodyPara("A comprehensive feasibility study was conducted to assess the viability of the ShijlAI Academy project across technical, economic, operational, and schedule dimensions."));
  
  content.push(heading3("3.2.1 Technical Feasibility"));
  content.push(bodyPara("The technical feasibility of ShijlAI Academy was assessed based on the availability and maturity of the required technologies. Next.js 16 provides a mature, production-proven framework for full-stack web development with server-side rendering, API routes, and excellent TypeScript support. React 19 offers a robust component model with hooks for state management and side effects. TypeScript 5 provides compile-time type safety that reduces runtime errors and improves code maintainability. Prisma ORM offers a type-safe database access layer that simplifies database operations and supports multiple database backends (SQLite for development, MySQL for production). The z-ai-web-dev-sdk provides reliable LLM integration with consistent API patterns. All required technologies are mature, well-documented, and have active communities, confirming technical feasibility."));
  
  content.push(heading3("3.2.2 Economic Feasibility"));
  content.push(bodyPara("The economic feasibility was assessed considering both development and operational costs. Development costs are minimal as all technologies used are open-source and freely available. The primary operational cost is LLM API usage through the z-ai-web-dev-sdk, which varies based on usage volume. The hybrid intelligence architecture mitigates this cost by using rule-based systems as the primary approach and invoking LLMs only when needed, reducing API consumption. SQLite is free for development, and MySQL Community Edition is free for production use. The estimated development cost is limited to infrastructure and LLM API costs, which are manageable for a university project."));
  
  content.push(heading3("3.2.3 Operational Feasibility"));
  content.push(bodyPara("Operational feasibility was assessed by evaluating whether the system can be effectively used in its intended environment. The platform is web-based and accessible through any modern browser, requiring no installation on end-user devices. The responsive design ensures usability across desktop and mobile devices. The three-portal architecture (Student, Instructor, Admin) aligns with the natural role separation in educational institutions. The AI features are designed with graceful degradation, ensuring the platform remains usable even when AI services are unavailable. These factors confirm operational feasibility."));
  
  content.push(heading3("3.2.4 Schedule Feasibility"));
  content.push(bodyPara("The project was planned for a nine-month development timeline, which is typical for a bachelor's thesis project. The agile development methodology with iterative sprints allows for incremental delivery and course correction. The hybrid architecture, with rule-based systems providing core functionality first and LLM integration added incrementally, ensures that a functional system is always available even if AI integration timelines slip. The schedule was deemed feasible based on the team's existing skills in web development and the availability of comprehensive documentation for all technologies used."));
  
  content.push(...academicTable(
    ["Feasibility Dimension", "Assessment", "Justification"],
    [
      ["Technical", "Feasible", "All technologies mature and well-documented"],
      ["Economic", "Feasible", "Open-source stack; LLM costs manageable with hybrid approach"],
      ["Operational", "Feasible", "Web-based, responsive, graceful degradation"],
      ["Schedule", "Feasible", "9-month timeline with agile methodology"],
    ],
    "Feasibility Study Assessment",
    tableCounter++
  ));
  
  // 3.3 Functional Requirements
  content.push(heading2("3.3 Functional Requirements"));
  content.push(bodyPara("Functional requirements define what the ShijlAI Academy system should do. These requirements are organized by user role and system module to ensure comprehensive coverage of all system capabilities."));
  
  content.push(heading3("3.3.1 Student Portal Requirements"));
  content.push(...academicTable(
    ["Req ID", "Requirement", "Priority", "Description"],
    [
      ["SR-01", "User Registration", "High", "Students shall be able to register with email, name, and password"],
      ["SR-02", "User Authentication", "High", "Students shall be able to log in with email/password credentials"],
      ["SR-03", "Course Browsing", "High", "Students shall be able to browse and search available courses"],
      ["SR-04", "Course Enrollment", "High", "Students shall be able to enroll in courses"],
      ["SR-05", "Lesson Viewing", "High", "Students shall be able to view course lessons with progress tracking"],
      ["SR-06", "Quiz Taking", "High", "Students shall be able to take quizzes with auto-grading"],
      ["SR-07", "Assignment Submission", "High", "Students shall be able to submit assignments for grading"],
      ["SR-08", "AI Chat (Ask ShijlAI)", "High", "Students shall be able to chat with AI in 6 modes"],
      ["SR-09", "Learning Path View", "Medium", "Students shall be able to view AI-generated learning paths"],
      ["SR-10", "Study Planner", "Medium", "Students shall be able to access AI-generated study plans"],
      ["SR-11", "Career Paths", "Medium", "Students shall be able to explore career-based learning paths"],
      ["SR-12", "Community Q&A", "Medium", "Students shall be able to ask and answer questions"],
      ["SR-13", "Gamification", "Medium", "Students shall earn XP, badges, and maintain streaks"],
      ["SR-14", "Notifications", "Medium", "Students shall receive notifications for important events"],
      ["SR-15", "Profile Management", "High", "Students shall be able to manage their profile and settings"],
    ],
    "Functional Requirements - Student Portal",
    tableCounter++
  ));
  
  content.push(heading3("3.3.2 Instructor Portal Requirements"));
  content.push(...academicTable(
    ["Req ID", "Requirement", "Priority", "Description"],
    [
      ["IR-01", "Course Creation", "High", "Instructors shall be able to create courses with modules and lessons"],
      ["IR-02", "Course Management", "High", "Instructors shall be able to edit, publish, and manage courses"],
      ["IR-03", "Student Management", "High", "Instructors shall be able to view and manage enrolled students"],
      ["IR-04", "Quiz Creation", "High", "Instructors shall be able to create and manage quizzes"],
      ["IR-05", "Assignment Creation", "High", "Instructors shall be able to create and manage assignments"],
      ["IR-06", "Grading", "High", "Instructors shall be able to grade student submissions"],
      ["IR-07", "AI Copilot Access", "Medium", "Instructors shall access AI Copilot with 9 automated actions"],
      ["IR-08", "Analytics Dashboard", "Medium", "Instructors shall view course and student analytics"],
      ["IR-09", "Revenue Tracking", "Medium", "Instructors shall be able to track course revenue and payouts"],
      ["IR-10", "Content Moderation", "Medium", "Instructors shall moderate course discussions and Q&A"],
    ],
    "Functional Requirements - Instructor Portal",
    tableCounter++
  ));
  
  content.push(heading3("3.3.3 Admin Portal Requirements"));
  content.push(...academicTable(
    ["Req ID", "Requirement", "Priority", "Description"],
    [
      ["AR-01", "User Management", "High", "Admins shall manage all users (CRUD operations)"],
      ["AR-02", "Course Oversight", "High", "Admins shall oversee and moderate all courses"],
      ["AR-03", "Financial Management", "High", "Admins shall manage transactions, payouts, disputes"],
      ["AR-04", "System Settings", "High", "Admins shall configure platform settings"],
      ["AR-05", "AI Copilot Access", "Medium", "Admins shall access Admin AI Copilot with 3-stage pipeline"],
      ["AR-06", "Audit Logs", "High", "Admins shall view audit logs for security tracking"],
      ["AR-07", "Feature Flags", "Medium", "Admins shall control feature availability via flags"],
      ["AR-08", "Security Dashboard", "High", "Admins shall monitor security events and alerts"],
      ["AR-09", "Platform Analytics", "Medium", "Admins shall view platform-wide analytics and reports"],
      ["AR-10", "Content Moderation", "High", "Admins shall moderate all platform content"],
    ],
    "Functional Requirements - Admin Portal",
    tableCounter++
  ));
  
  content.push(heading3("3.3.4 AI Module Requirements"));
  content.push(...academicTable(
    ["Req ID", "AI Module", "Priority", "Description"],
    [
      ["AI-01", "Ask ShijlAI", "High", "Conversational AI with 6 modes and context injection"],
      ["AI-02", "AI Learning Companion", "High", "Real-time insights with 5 rule-based rules"],
      ["AI-03", "AI Quiz Generator", "High", "LLM-powered quiz generation from course content"],
      ["AI-04", "AI Mock Interview", "Medium", "5-domain interview simulation with LLM evaluation"],
      ["AI-05", "AI Insights", "Medium", "7 rule-based insights with LLM enhancement"],
      ["AI-06", "AI Recommendations", "Medium", "Rule-based core with LLM-enhanced suggestions"],
      ["AI-07", "AI Study Planner", "Medium", "Algorithmic scheduling with LLM plan generation"],
      ["AI-08", "AI Learning Paths", "Medium", "Course-based and career-based path generation"],
      ["AI-09", "Topic Mastery", "High", "Weighted mastery formula across 4 dimensions"],
      ["AI-10", "Instructor AI Copilot", "Medium", "9 automated actions for course management"],
      ["AI-11", "Instructor AI Sub-tools", "Low", "12 additional AI endpoints for instructors"],
      ["AI-12", "Admin AI Copilot", "Medium", "3-stage pipeline for admin intelligence"],
      ["AI-13", "System Intelligence", "Low", "Platform health monitoring with LLM insights"],
      ["AI-14", "Course Quality Analyzer", "Low", "5-dimension course quality scoring"],
      ["AI-15", "Intelligent Analytics", "Medium", "Role-based analytics for all user types"],
    ],
    "Functional Requirements - AI Modules",
    tableCounter++
  ));
  
  // 3.4 Non-Functional Requirements
  content.push(heading2("3.4 Non-Functional Requirements"));
  content.push(bodyPara("Non-functional requirements define the quality attributes and constraints of the ShijlAI Academy system. These requirements are critical for ensuring that the system not only performs its functions but does so with acceptable levels of performance, security, usability, and reliability."));
  
  content.push(...academicTable(
    ["Req ID", "Category", "Requirement", "Metric"],
    [
      ["NFR-01", "Performance", "API response time < 2s for non-AI endpoints", "95th percentile"],
      ["NFR-02", "Performance", "AI endpoint response time < 10s", "95th percentile"],
      ["NFR-03", "Performance", "Page load time < 3s on broadband", "Initial load"],
      ["NFR-04", "Scalability", "Support 1,000 concurrent users", "Concurrent sessions"],
      ["NFR-05", "Reliability", "99.5% uptime for core features", "Monthly basis"],
      ["NFR-06", "Reliability", "Graceful degradation for AI features", "Fallback availability"],
      ["NFR-07", "Security", "Password hashing with bcrypt", "Hash rounds >= 12"],
      ["NFR-08", "Security", "JWT-based session management", "Token expiry < 24h"],
      ["NFR-09", "Security", "Role-based access control", "3 role levels"],
      ["NFR-10", "Security", "SQL injection prevention via ORM", "Zero raw queries"],
      ["NFR-11", "Usability", "Responsive design for mobile/tablet/desktop", "3 breakpoints"],
      ["NFR-12", "Usability", "Intuitive navigation with < 3 clicks to any feature", "Click depth"],
      ["NFR-13", "Maintainability", "TypeScript strict mode for type safety", "100% typed"],
      ["NFR-14", "Maintainability", "Modular component architecture", "68+ components"],
      ["NFR-15", "Compatibility", "Support for modern browsers (Chrome, Firefox, Safari, Edge)", "Latest 2 versions"],
    ],
    "Non-Functional Requirements",
    tableCounter++
  ));
  
  // 3.5 Hardware and Software Requirements
  content.push(heading2("3.5 Hardware and Software Requirements"));
  content.push(heading3("3.5.1 Development Environment"));
  content.push(...academicTable(
    ["Component", "Requirement", "Specification"],
    [
      ["Processor", "Intel Core i5 or equivalent", "4+ cores, 2.0 GHz+"],
      ["RAM", "8 GB minimum, 16 GB recommended", "For development server + database"],
      ["Storage", "10 GB free space", "For project, dependencies, database"],
      ["Network", "Broadband internet", "For LLM API access and package installation"],
      ["OS", "Windows 10+, macOS 12+, or Linux", "Any modern OS"],
      ["Node.js", "Version 18+", "For Next.js 16 runtime"],
      ["Package Manager", "Bun or npm", "For dependency management"],
      ["Database", "SQLite (dev) / MySQL (prod)", "For data persistence"],
      ["IDE", "VS Code or equivalent", "With TypeScript and React extensions"],
    ],
    "Hardware and Software Requirements",
    tableCounter++
  ));
  
  content.push(heading3("3.5.2 Production Environment"));
  content.push(...academicTable(
    ["Component", "Requirement", "Specification"],
    [
      ["Server", "VPS or cloud instance", "2+ vCPU, 4+ GB RAM"],
      ["Database", "MySQL 8.0+", "Managed or self-hosted"],
      ["SSL Certificate", "Required", "For HTTPS encryption"],
      ["Domain", "Custom domain", "For production deployment"],
      ["CDN", "Recommended", "For static asset delivery"],
    ],
    "Production Environment Requirements",
    tableCounter++
  ));
  
  // 3.6 Risk Analysis
  content.push(heading2("3.6 Risk Analysis"));
  content.push(bodyPara("A risk analysis was conducted to identify potential threats to the project's success and to develop mitigation strategies for each risk. Risks were assessed on the dimensions of probability (likelihood of occurrence) and impact (severity of consequences), and prioritized accordingly."));
  
  content.push(...academicTable(
    ["Risk ID", "Risk Description", "Probability", "Impact", "Mitigation Strategy"],
    [
      ["R-01", "LLM API service outage", "Medium", "High", "Hybrid architecture with rule-based fallbacks"],
      ["R-02", "LLM API cost overrun", "Medium", "Medium", "Rate limiting and rule-based primary approach"],
      ["R-03", "Database performance issues", "Low", "High", "Indexing, query optimization, pagination"],
      ["R-04", "Security breach", "Low", "Critical", "Input validation, ORM, RBAC, audit logs"],
      ["R-05", "Scope creep", "High", "Medium", "Agile methodology with sprint planning"],
      ["R-06", "Browser compatibility issues", "Low", "Medium", "Progressive enhancement, testing on multiple browsers"],
      ["R-07", "Performance degradation at scale", "Medium", "High", "Lazy loading, code splitting, caching"],
      ["R-08", "LLM hallucination in educational content", "High", "High", "Rule-based validation, context injection, human review"],
      ["R-09", "Data loss", "Low", "Critical", "Regular backups, transaction-based writes"],
      ["R-10", "Team member unavailability", "Medium", "Medium", "Knowledge sharing, documentation"],
    ],
    "Risk Analysis and Mitigation Strategies",
    tableCounter++
  ));
  
  content.push(...mermaidDiagram(
    `graph LR
    subgraph Risk_Matrix["Risk Assessment Matrix"]
    A["High Probability + High Impact<br/>R-05, R-08<br/>CRITICAL"]
    B["High Probability + Low Impact<br/>N/A<br/>MONITOR"]
    C["Low Probability + High Impact<br/>R-04, R-09<br/>PLAN"]
    D["Low Probability + Low Impact<br/>R-06<br/>ACCEPT"]
    end`,
    "Risk Assessment Matrix",
    figCounter++
  ));
  
  content.push(pageBreakPara());
  return content;
}

