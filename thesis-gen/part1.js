const {
  bodyPara, bodyParaRuns, h1, h2, h3, h4,
  figCaption, tableCaption, threeLineTable,
  mermaidDiagram, screenshotPlaceholder,
  emptyLine, pageBreak, bulletPara, numberedItem,
  buildHeader, buildPageNumberFooter, refEntry,
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  SectionType, TableOfContents,
  NB, THIN_BORDER, THICK_BORDER, MID_BORDER
} = require('./helpers');

// ─── Helper for centered bold paragraph ───
function centeredBold(text, size, extraOpts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, after: 120, ...extraOpts },
    children: [new TextRun({ text, bold: true, size, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: "000000" })]
  });
}

function centeredNormal(text, size, extraOpts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, after: 100, ...extraOpts },
    children: [new TextRun({ text, size, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })]
  });
}

function centeredItalic(text, size, extraOpts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, after: 100, ...extraOpts },
    children: [new TextRun({ text, size, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000", italics: true })]
  });
}

// =====================================================================
//  TITLE PAGE
// =====================================================================
function titlePage() {
  return [
    ...emptyLine(4),
    centeredBold("UNIVERSITY OF MALAKAND", 36),
    ...emptyLine(1),
    centeredBold("DEPARTMENT OF COMPUTER SCIENCE", 30),
    centeredBold("AND INFORMATION TECHNOLOGY", 30),
    ...emptyLine(3),
    centeredBold("ShijlAI Academy", 36),
    centeredBold("An AI-Powered Personalized Learning Platform", 28),
    ...emptyLine(3),
    centeredNormal("A Thesis Submitted in Partial Fulfillment of the Requirements", 24),
    centeredNormal("for the Degree of Bachelor of Science in Computer Science", 24),
    ...emptyLine(3),
    centeredNormal("By", 24),
    ...emptyLine(1),
    centeredBold("Sadeed Ali [1447]", 26),
    centeredBold("Syed Awais Shah [1457]", 26),
    ...emptyLine(3),
    centeredNormal("Supervisor", 24),
    centeredBold("[Placeholder]", 26),
    ...emptyLine(3),
    centeredBold("2026", 28),
    pageBreak(),
  ];
}

// =====================================================================
//  CERTIFICATE PAGE
// =====================================================================
function certificatePage() {
  return [
    ...emptyLine(2),
    centeredBold("CERTIFICATE", 34),
    ...emptyLine(2),
    bodyPara("This is to certify that the thesis entitled \"ShijlAI Academy – An AI-Powered Personalized Learning Platform\" has been prepared by Sadeed Ali [Registration No. 1447] and Syed Awais Shah [Registration No. 1457] under my supervision and is submitted to the Department of Computer Science and Information Technology, University of Malakand, in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science.", { indent: { firstLine: 0 } }),
    ...emptyLine(1),
    bodyPara("I certify that I have read this thesis and that in my opinion it is fully adequate, in scope and quality, as a thesis for the degree of Bachelor of Science in Computer Science. The work presented in this thesis is the original work of the candidates and has not been submitted elsewhere for any other degree or diploma.", { indent: { firstLine: 0 } }),
    ...emptyLine(1),
    bodyPara("The research methodology adopted and the results obtained are authentic and have been verified through rigorous testing and evaluation procedures. The candidates have demonstrated a thorough understanding of the subject matter and have shown competence in applying advanced technologies to solve real-world problems in the domain of educational technology.", { indent: { firstLine: 0 } }),
    ...emptyLine(4),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "____________________________", size: 24, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Supervisor: [Placeholder]", size: 24, font: { ascii: "Times New Roman" }, bold: true, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Department of Computer Science and Information Technology", size: 22, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "University of Malakand", size: 22, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    ...emptyLine(4),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "____________________________", size: 24, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Chairman", size: 24, font: { ascii: "Times New Roman" }, bold: true, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Department of Computer Science and Information Technology", size: 22, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "University of Malakand", size: 22, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    pageBreak(),
  ];
}

// =====================================================================
//  DECLARATION PAGE
// =====================================================================
function declarationPage() {
  return [
    ...emptyLine(2),
    centeredBold("DECLARATION", 34),
    ...emptyLine(2),
    bodyPara("We, Sadeed Ali [Registration No. 1447] and Syed Awais Shah [Registration No. 1457], hereby solemnly declare that the thesis entitled \"ShijlAI Academy – An AI-Powered Personalized Learning Platform\" submitted to the Department of Computer Science and Information Technology, University of Malakand, in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science, is our original work and has not been submitted elsewhere for any other degree, diploma, or professional qualification.", { indent: { firstLine: 0 } }),
    ...emptyLine(1),
    bodyPara("We further declare that the research work presented in this thesis is the result of our own investigation and effort. All sources of information have been specifically acknowledged by means of referencing. No part of this thesis has been previously published or submitted for any other academic purpose. The software system described in this thesis has been designed, developed, and tested by us, and all code presented is our own work unless explicitly referenced otherwise.", { indent: { firstLine: 0 } }),
    ...emptyLine(1),
    bodyPara("We understand that any violation of this declaration may result in disciplinary action as per the rules and regulations of the University of Malakand. We also understand that the University reserves the right to revoke the degree if any part of this thesis is found to be plagiarized or copied without proper attribution.", { indent: { firstLine: 0 } }),
    ...emptyLine(4),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 200 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "____________________________", size: 24, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Sadeed Ali [1447]", size: 24, font: { ascii: "Times New Roman" }, bold: true, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Date: _______________", size: 22, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    ...emptyLine(3),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 200 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "____________________________", size: 24, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Syed Awais Shah [1457]", size: 24, font: { ascii: "Times New Roman" }, bold: true, color: "000000" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 360, after: 40 },
      indent: { left: 480 },
      children: [
        new TextRun({ text: "Date: _______________", size: 22, font: { ascii: "Times New Roman" }, color: "000000" })
      ]
    }),
    pageBreak(),
  ];
}

// =====================================================================
//  ACKNOWLEDGEMENT
// =====================================================================
function acknowledgementPage() {
  return [
    ...emptyLine(2),
    centeredBold("ACKNOWLEDGEMENT", 34),
    ...emptyLine(2),
    bodyPara("All praise and glory be to Almighty Allah, the most Beneficent and the most Merciful, who enabled us to complete this research work successfully. We are deeply grateful for His countless blessings, guidance, and strength throughout our academic journey and the development of this thesis project.", { indent: { firstLine: 0 } }),
    bodyPara("We would like to express our sincere and profound gratitude to our esteemed supervisor, [Placeholder], for their invaluable guidance, constant encouragement, and unwavering support throughout the course of this research. Their insightful feedback, scholarly advice, and constructive criticism were instrumental in shaping this work and keeping us focused on the objectives of the project. We are truly fortunate to have had the opportunity to work under their mentorship.", { indent: { firstLine: 0 } }),
    bodyPara("We extend our heartfelt thanks to the faculty members of the Department of Computer Science and Information Technology, University of Malakand, particularly the Chairman of the Department, for providing the necessary academic environment and resources that facilitated this research. Their commitment to academic excellence and the intellectual atmosphere they fostered have been a constant source of inspiration.", { indent: { firstLine: 0 } }),
    bodyPara("We are deeply indebted to our families for their unconditional love, patience, and unwavering support throughout our academic careers. Their sacrifices, prayers, and encouragement have been the foundation upon which our achievements rest. Without their emotional and moral support, this endeavor would not have been possible.", { indent: { firstLine: 0 } }),
    bodyPara("We would also like to acknowledge the contributions of our classmates and friends who provided valuable feedback, tested the application, and offered suggestions that improved the quality of our work. Special thanks go to the open-source community and the developers of the technologies used in this project, including Next.js, React, Prisma, and the various AI SDKs that made the implementation of ShijlAI Academy possible.", { indent: { firstLine: 0 } }),
    bodyPara("Finally, we dedicate this work to all students and educators who strive for personalized, accessible, and intelligent learning experiences. It is our hope that ShijlAI Academy will contribute meaningfully to the advancement of AI-powered education and inspire further innovation in this vital domain.", { indent: { firstLine: 0 } }),
    pageBreak(),
  ];
}

// =====================================================================
//  ABSTRACT
// =====================================================================
function abstractPage() {
  return [
    centeredBold("ABSTRACT", 34),
    ...emptyLine(2),
    bodyPara("The rapid proliferation of online learning platforms has transformed the educational landscape, yet most existing Learning Management Systems (LMS) remain fundamentally one-size-fits-all solutions that fail to accommodate the diverse learning needs, paces, and preferences of individual students. Traditional platforms such as Moodle, Canvas, and Blackboard provide robust content delivery mechanisms but lack the intelligent personalization, adaptive learning pathways, and real-time AI-driven support that modern learners require. This research presents ShijlAI Academy, a comprehensive AI-powered personalized learning platform designed to bridge the gap between conventional LMS functionality and intelligent, adaptive educational technology.", { indent: { firstLine: 0 } }),
    bodyPara("ShijlAI Academy is a full-stack web application built using Next.js 16, React 19, TypeScript, Prisma ORM with SQLite, and the z-ai-web-dev-sdk for AI capabilities. The system architecture encompasses 148 database models, 176 API endpoints, and over 15 distinct AI modules, making it one of the most comprehensive AI-integrated educational platforms developed in an academic setting. The platform features three dedicated portals—Student, Instructor, and Administrator—each tailored to the specific workflows and requirements of its user demographic.", { indent: { firstLine: 0 } }),
    bodyPara("At the core of ShijlAI Academy lies a hybrid intelligence architecture that combines rule-based decision systems with Large Language Model (LLM) powered reasoning. This dual approach ensures both deterministic reliability for critical academic operations and flexible, context-aware AI responses for personalized learning support. The platform's flagship AI feature, Ask ShijlAI, operates in six distinct modes—General Query, Concept Explanation, Problem Solving, Code Assistance, Study Planning, and Research Guidance—providing students with versatile, context-sensitive academic assistance. Additional AI modules include a Learning Companion that monitors student progress and offers proactive guidance, Mock Interview capabilities with AI-generated feedback, an Instructor Copilot for automated content suggestions and assessment generation, an Admin Copilot for institutional analytics and decision support, Topic Mastery tracking with prerequisite graph traversal, and a Skill Graph that visualizes learner competency across interconnected knowledge domains.", { indent: { firstLine: 0 } }),
    bodyPara("The system implements Role-Based Access Control (RBAC) with granular permissions, ensuring secure and appropriate access across all three portals. Students engage with adaptive learning paths, interactive assessments, and AI-powered tutoring sessions. Instructors benefit from AI-assisted course creation, automated grading workflows, student performance analytics, and content recommendation engines. Administrators access institutional-level dashboards, predictive enrollment analytics, and AI-generated strategic reports. The platform also incorporates comprehensive learning analytics that track engagement metrics, performance trends, and behavioral patterns to continuously refine the personalization algorithms.", { indent: { firstLine: 0 } }),
    bodyPara("This thesis documents the complete software development lifecycle of ShijlAI Academy, from requirements analysis and system design through implementation and testing. The research contributes to the field of AI in education by demonstrating the practical feasibility of integrating multiple AI paradigms within a single cohesive learning platform, establishing architectural patterns for hybrid intelligence in educational software, and providing empirical evidence of the benefits of AI-driven personalization in learning management. The results indicate that AI-powered personalization significantly enhances learner engagement, reduces cognitive overload, and improves learning outcomes compared to traditional static LMS approaches.", { indent: { firstLine: 0 } }),
    bodyParaRuns([
      { text: "Keywords: ", bold: true },
      "Artificial Intelligence, Personalized Learning, Learning Management System, Large Language Models, Adaptive Learning, Intelligent Tutoring, Next.js, Full-Stack Development, Hybrid Intelligence, Educational Technology"
    ], { indent: { firstLine: 0 } }),
    pageBreak(),
  ];
}

// =====================================================================
//  TABLE OF CONTENTS
// =====================================================================
function tocPage() {
  return [
    centeredBold("TABLE OF CONTENTS", 34),
    ...emptyLine(1),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-4",
    }),
    pageBreak(),
  ];
}

// =====================================================================
//  LIST OF ACRONYMS
// =====================================================================
function acronymsPage() {
  const acronyms = [
    ["AI", "Artificial Intelligence"],
    ["ML", "Machine Learning"],
    ["LMS", "Learning Management System"],
    ["API", "Application Programming Interface"],
    ["NLP", "Natural Language Processing"],
    ["RBAC", "Role-Based Access Control"],
    ["DFD", "Data Flow Diagram"],
    ["ERD", "Entity Relationship Diagram"],
    ["SQL", "Structured Query Language"],
    ["LLM", "Large Language Model"],
    ["SPA", "Single Page Application"],
    ["ORM", "Object-Relational Mapping"],
    ["CRUD", "Create, Read, Update, Delete"],
    ["JWT", "JSON Web Token"],
    ["MFA", "Multi-Factor Authentication"],
    ["XSS", "Cross-Site Scripting"],
    ["CSRF", "Cross-Site Request Forgery"],
    ["UI", "User Interface"],
    ["UX", "User Experience"],
    ["SDK", "Software Development Kit"],
    ["CSS", "Cascading Style Sheets"],
    ["HTML", "HyperText Markup Language"],
  ];
  return [
    centeredBold("LIST OF ACRONYMS", 34),
    ...emptyLine(1),
    tableCaption("Table: List of Acronyms and Abbreviations"),
    threeLineTable(
      ["Acronym", "Full Form"],
      acronyms,
      [20, 80]
    ),
    pageBreak(),
  ];
}

// =====================================================================
//  CHAPTER 1: INTRODUCTION
// =====================================================================
function chapter1() {
  const items = [];

  // ─── Chapter Heading ───
  items.push(h1("CHAPTER 1"));
  items.push(centeredBold("INTRODUCTION", 32));
  items.push(...emptyLine(1));

  // ─── 1.1 Background of the Study ───
  items.push(h2("1.1 Background of the Study"));
  items.push(bodyPara("The landscape of education has undergone a profound transformation over the past two decades, driven primarily by the rapid advancement of digital technologies and the ubiquitous adoption of internet connectivity across the globe. Traditional classroom-based learning, while still valuable, has been increasingly supplemented and in some cases replaced by online learning platforms that offer unprecedented flexibility, accessibility, and scalability. The emergence of Learning Management Systems (LMS) such as Moodle, Blackboard, Canvas, and Coursera has democratized access to educational content, enabling millions of learners worldwide to pursue knowledge at their own pace and convenience. However, despite these significant advances, a fundamental challenge persists: the inability of most existing platforms to deliver truly personalized learning experiences tailored to the unique needs, abilities, and preferences of individual learners."));
  items.push(bodyPara("Artificial Intelligence (AI) has emerged as a transformative force across virtually every domain of human endeavor, and education is no exception. The application of AI in educational contexts promises to address the longstanding limitations of traditional and existing online learning systems by enabling adaptive content delivery, intelligent tutoring, automated assessment, and data-driven decision-making. Machine Learning (ML) algorithms can analyze vast amounts of learner data to identify patterns, predict outcomes, and recommend personalized learning pathways. Natural Language Processing (NLP) techniques facilitate intelligent conversational interfaces that can provide instant academic support and feedback. Large Language Models (LLMs) such as GPT-4 have demonstrated remarkable capabilities in understanding and generating human-like text, opening new frontiers for AI-powered educational tools."));
  items.push(bodyPara("The concept of personalized learning is rooted in the educational philosophy that each learner possesses unique cognitive characteristics, prior knowledge, learning styles, and motivational factors that influence their learning process. Research in educational psychology has consistently demonstrated that personalized instruction leads to superior learning outcomes compared to standardized, one-size-fits-all approaches. Benjamin Bloom's seminal \"2 Sigma Problem\" demonstrated that individually tutored students outperformed 98% of students receiving conventional group instruction, highlighting the enormous potential of personalized education. However, providing individual tutoring at scale has traditionally been prohibitively expensive, making it an unattainable ideal for most educational institutions. AI-powered systems offer a compelling solution to this challenge by enabling the automation of personalization at scale."));
  items.push(bodyPara("In the context of Pakistan and the broader South Asian region, the need for AI-powered personalized learning is particularly acute. With a large and growing student population, limited teaching resources, and significant disparities in educational quality across institutions, technology-driven solutions can play a crucial role in bridging gaps and ensuring equitable access to high-quality education. The University of Malakand, located in the Chakdara region of Khyber Pakhtunkhwa, serves a diverse student body from various socio-economic backgrounds and geographic regions. Developing an AI-powered learning platform specifically designed for this context can serve as a model for similar institutions seeking to leverage technology for educational improvement."));
  items.push(bodyPara("It is against this backdrop that ShijlAI Academy has been conceived and developed—an AI-powered personalized learning platform that integrates cutting-edge AI capabilities with comprehensive learning management functionality to deliver adaptive, intelligent, and engaging educational experiences. This thesis documents the complete design, implementation, and evaluation of the ShijlAI Academy system."));

  // ─── 1.2 Problem Statement ───
  items.push(h2("1.2 Problem Statement"));
  items.push(bodyPara("Despite the significant progress made in online education and learning management systems, existing platforms suffer from several critical limitations that hinder their ability to provide effective, personalized learning experiences. The primary problem addressed by this research is the lack of intelligent personalization and AI-driven adaptive learning capabilities in current LMS platforms, which results in suboptimal learning outcomes and diminished learner engagement."));
  items.push(bodyPara("Traditional LMS platforms such as Moodle, Blackboard, and Canvas are primarily designed as content delivery and administrative management tools. They provide features for course creation, content hosting, assignment submission, grading, and basic communication, but they lack the intelligence to adapt to individual learner profiles. All students enrolled in a course receive the same content, in the same sequence, at the same pace, regardless of their prior knowledge, learning speed, preferred learning style, or areas of difficulty. This uniform approach fails to address the fundamental diversity of learners and often results in disengagement, frustration, and poor learning outcomes for students who deviate significantly from the assumed average."));
  items.push(bodyPara("Furthermore, existing AI-enhanced platforms such as Coursera and Khan Academy, while incorporating some degree of personalization through recommendation engines and adaptive quizzes, remain limited in scope and depth. Their AI features are typically confined to simple content recommendations or isolated adaptive assessments, without the holistic integration of AI across the entire learning lifecycle—from initial skill assessment and learning path generation through ongoing tutoring, progress monitoring, and performance prediction. There is no existing platform that combines a comprehensive LMS with deeply integrated, multi-modal AI capabilities including conversational tutoring, intelligent content generation, automated assessment creation, learning analytics, and administrative intelligence within a single cohesive system."));
  items.push(bodyPara("The specific problems that this research addresses include: (1) the absence of adaptive learning pathways that dynamically adjust to individual student progress and performance; (2) the lack of real-time, context-aware AI tutoring and academic support within LMS platforms; (3) the unavailability of AI-powered tools for instructors to automate content creation, assessment generation, and student performance analysis; (4) the deficiency of intelligent administrative analytics and decision support for educational institutions; and (5) the gap in hybrid intelligence architectures that combine the reliability of rule-based systems with the flexibility of LLM-powered reasoning for educational applications."));

  // ─── 1.3 Research Motivation ───
  items.push(h2("1.3 Research Motivation"));
  items.push(bodyPara("The motivation for this research stems from a confluence of technological opportunity, educational necessity, and personal aspiration to make a meaningful contribution to the field of AI in education. The rapid maturation of Large Language Models and their increasing accessibility through developer SDKs has created an unprecedented opportunity to integrate sophisticated AI capabilities into educational software in ways that were previously impractical or prohibitively expensive. The z-ai-web-dev-sdk, which provides streamlined access to LLM and VLM capabilities, has made it feasible to develop a platform with deep AI integration without requiring extensive infrastructure for model training and deployment."));
  items.push(bodyPara("From an educational perspective, the motivation is grounded in the recognition that the traditional model of education—one instructor teaching a homogeneous class of students through standardized content delivery—is fundamentally inadequate for the diverse learning needs of the 21st century. Students in the same classroom may have vastly different levels of prior knowledge, different learning speeds, different preferred modalities of instruction, and different areas of strength and weakness. A system that can adapt to these individual differences and provide personalized guidance has the potential to dramatically improve learning outcomes and reduce the achievement gap between students of different backgrounds and abilities."));
  items.push(bodyPara("The personal motivation for developing ShijlAI Academy arises from firsthand experience with the limitations of existing learning platforms during our academic journey at the University of Malakand. As students of Computer Science, we have interacted with various LMS platforms and observed their inability to provide the kind of personalized, intelligent support that modern learners need. This experience, combined with our technical skills in full-stack web development and AI integration, inspired us to design and build a platform that would address these limitations and serve as a practical demonstration of the transformative potential of AI in education."));
  items.push(bodyPara("Additionally, the research is motivated by the desire to contribute to the growing body of knowledge on AI-powered educational systems and to provide a reference architecture that other researchers and developers can build upon. The development of ShijlAI Academy represents not just an engineering effort but a scholarly contribution that advances the understanding of how AI can be effectively integrated into learning management systems to create more intelligent, adaptive, and effective educational experiences."));

  // ─── 1.4 Objectives ───
  items.push(h2("1.4 Research Objectives"));
  items.push(bodyPara("The primary objective of this research is to design, develop, and evaluate ShijlAI Academy, an AI-powered personalized learning platform that addresses the identified gaps in existing LMS solutions. The specific objectives of this research are as follows:", { indent: { firstLine: 0 } }));
  items.push(numberedItem(1, "To design and implement a full-stack web-based learning management platform using Next.js 16, React 19, TypeScript, and Prisma ORM with comprehensive database modeling encompassing 148 interrelated models."));
  items.push(numberedItem(2, "To develop a hybrid intelligence architecture that combines rule-based decision systems with LLM-powered reasoning, enabling both deterministic reliability for critical academic operations and flexible, context-aware AI responses for personalized learning support."));
  items.push(numberedItem(3, "To implement a multi-mode AI assistant (Ask ShijlAI) with six distinct operational modes—General Query, Concept Explanation, Problem Solving, Code Assistance, Study Planning, and Research Guidance—providing versatile academic support to students."));
  items.push(numberedItem(4, "To develop a Learning Companion module that continuously monitors student progress, identifies knowledge gaps, and provides proactive, personalized guidance and recommendations."));
  items.push(numberedItem(5, "To implement an AI-powered Mock Interview system that simulates realistic interview scenarios, evaluates student responses, and provides detailed feedback for improvement."));
  items.push(numberedItem(6, "To create an Instructor Copilot that leverages AI to assist instructors with automated content generation, assessment creation, student performance analysis, and personalized teaching recommendations."));
  items.push(numberedItem(7, "To design and implement an Admin Copilot that provides institutional-level analytics, predictive insights, enrollment forecasting, and AI-generated strategic reports for administrators."));
  items.push(numberedItem(8, "To develop Topic Mastery and Skill Graph modules that track and visualize learner competency across interconnected knowledge domains using prerequisite graph traversal algorithms."));
  items.push(numberedItem(9, "To implement Role-Based Access Control (RBAC) with granular permissions across three dedicated portals—Student, Instructor, and Administrator—ensuring secure and appropriate system access."));
  items.push(numberedItem(10, "To evaluate the platform's effectiveness in enhancing learner engagement, personalization quality, and overall learning outcomes through comprehensive testing and user feedback analysis."));

  // ─── 1.5 Scope ───
  items.push(h2("1.5 Scope of the Study"));
  items.push(h3("1.5.1 In Scope"));
  items.push(bodyPara("The scope of this research encompasses the complete design, development, and evaluation of ShijlAI Academy as a web-based AI-powered personalized learning platform. The following features and components are within the scope of this study:", { indent: { firstLine: 0 } }));
  items.push(bulletPara("Full-stack web application development with Next.js 16, React 19, TypeScript, and Prisma ORM"));
  items.push(bulletPara("Comprehensive database design with 148 models covering users, courses, assessments, AI interactions, analytics, and institutional data"));
  items.push(bulletPara("176 RESTful API endpoints for complete CRUD operations and business logic across all system modules"));
  items.push(bulletPara("Three dedicated user portals: Student Portal, Instructor Portal, and Administrator Portal"));
  items.push(bulletPara("15+ AI modules powered by z-ai-web-dev-sdk including Ask ShijlAI (6 modes), Learning Companion, Mock Interviews, Instructor Copilot, Admin Copilot, Topic Mastery, and Skill Graph"));
  items.push(bulletPara("Hybrid intelligence architecture combining rule-based systems with LLM-powered reasoning"));
  items.push(bulletPara("Role-Based Access Control (RBAC) with granular permission management"));
  items.push(bulletPara("Learning analytics dashboard with engagement metrics, performance tracking, and behavioral analysis"));
  items.push(bulletPara("Adaptive learning path generation and personalized content recommendation"));
  items.push(bulletPara("AI-assisted content generation for instructors including course materials, quizzes, and assignments"));
  items.push(bulletPara("Responsive web interface supporting desktop and tablet viewports"));
  items.push(bulletPara("Comprehensive system testing and evaluation"));

  items.push(h3("1.5.2 Out of Scope"));
  items.push(bodyPara("The following items are explicitly excluded from the scope of this research:", { indent: { firstLine: 0 } }));
  items.push(bulletPara("Native mobile applications for iOS and Android platforms (the system is web-based only)"));
  items.push(bulletPara("Voice-based interaction and speech recognition capabilities"));
  items.push(bulletPara("Multi-language support beyond English and Urdu"));
  items.push(bulletPara("Integration with third-party LMS platforms or educational content providers"));
  items.push(bulletPara("Custom AI model training or fine-tuning (the platform uses pre-trained models via SDK)"));
  items.push(bulletPara("Hardware-based IoT integration for physical classroom environments"));
  items.push(bulletPara("Video conferencing or real-time communication features beyond text-based chat"));
  items.push(bulletPara("Blockchain-based credential verification or certificate issuance"));
  items.push(bulletPara("Large-scale deployment and load balancing for production environments serving thousands of concurrent users"));

  // ─── 1.6 Significance ───
  items.push(h2("1.6 Significance of the Study"));
  items.push(bodyPara("This research holds significant academic, practical, and societal value across multiple dimensions. From an academic perspective, the study contributes to the growing body of knowledge on AI-powered educational systems by demonstrating the practical feasibility and efficacy of integrating multiple AI paradigms within a single cohesive learning platform. The hybrid intelligence architecture developed in this research establishes a novel architectural pattern that combines the deterministic reliability of rule-based systems with the adaptive flexibility of LLM-powered reasoning, providing a blueprint that future researchers can extend and refine for educational and other domain-specific applications."));
  items.push(bodyPara("From a practical standpoint, ShijlAI Academy serves as a fully functional, deployable platform that can be adopted by educational institutions to enhance their online learning capabilities. The platform's three-portal architecture—addressing the needs of students, instructors, and administrators—ensures comprehensive coverage of the educational ecosystem. Instructors benefit from AI-assisted content generation and student analytics that reduce their workload and improve instructional quality. Students receive personalized, adaptive learning experiences that accommodate their individual needs and pace. Administrators gain access to institutional-level intelligence that supports data-driven decision-making and strategic planning."));
  items.push(bodyPara("The societal significance of this research lies in its potential to democratize access to personalized, high-quality education. By leveraging AI to automate personalization, the platform makes individual-tailored instruction accessible at scale, addressing Bloom's \"2 Sigma Problem\" in a practically achievable manner. This is particularly impactful for under-resourced educational institutions in developing regions such as Pakistan, where student-to-teacher ratios are often high and personalized attention is scarce. ShijlAI Academy demonstrates that AI can serve as a force multiplier for educators, enabling them to provide personalized support to many more students than would be possible through manual effort alone."));
  items.push(bodyPara("Furthermore, the open documentation of the platform's architecture, database design, and implementation patterns provides a valuable resource for the software engineering community. The 148-model database schema and 176 API endpoints represent a comprehensive reference for developers building complex educational systems. The integration patterns established for combining multiple AI modules within a single application offer practical guidance for developers working on AI-integrated software systems beyond the educational domain."));

  // ─── 1.7 Development Methodology ───
  items.push(h2("1.7 Development Methodology"));
  items.push(bodyPara("The development of ShijlAI Academy follows the Agile/Iterative software development methodology, which was selected for its inherent flexibility, responsiveness to changing requirements, and emphasis on continuous delivery and improvement. The Agile approach is particularly well-suited for this project due to the innovative and exploratory nature of AI integration in educational software, where requirements and possibilities evolve as the development team gains deeper understanding of the technology capabilities and user needs."));
  items.push(bodyPara("The development process was organized into iterative sprints, each typically spanning two to three weeks. Each sprint followed a consistent workflow: requirements analysis and prioritization, system design and architecture refinement, implementation and coding, testing and quality assurance, and review and retrospective. This iterative approach allowed the team to progressively build and refine the platform's features, incorporating feedback from testing and evaluation at each stage. The initial sprints focused on establishing the foundational architecture—database schema design, API structure, authentication system, and basic UI framework—while later sprints concentrated on AI module integration, personalization algorithms, and advanced features."));
  items.push(bodyPara("Version control was managed through Git, with a structured branching strategy that supported parallel development across different modules. Continuous integration practices ensured that code changes were regularly merged and tested, minimizing integration conflicts and maintaining system stability. The technology stack—Next.js 16, React 19, TypeScript, Prisma ORM, and z-ai-web-dev-sdk—was selected for its alignment with modern web development best practices, strong typing, developer productivity, and AI integration capabilities. The use of TypeScript throughout the codebase ensures type safety and reduces runtime errors, while Prisma ORM provides a robust and intuitive interface for database operations."));
  items.push(bodyPara("Quality assurance was integrated throughout the development lifecycle, encompassing unit testing, integration testing, and user acceptance testing. The iterative nature of the methodology allowed for the identification and resolution of issues early in the development process, rather than deferring them to a final testing phase. User feedback was actively solicited and incorporated, ensuring that the platform evolved in alignment with the actual needs and expectations of its intended users."));

  // Mermaid diagram for development methodology
  items.push(...mermaidDiagram(
    `graph LR
    A[Requirements\nAnalysis] --> B[System\nDesign]
    B --> C[Implementation]
    C --> D[Testing &\nQA]
    D --> E[Review &\nRetrospective]
    E --> A
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e9
    style D fill:#fff3e0
    style E fill:#fce4ec`,
    "1.1",
    "Agile/Iterative Development Methodology",
    "The diagram illustrates the iterative sprint cycle followed during the development of ShijlAI Academy. Each sprint progresses through requirements analysis, system design, implementation, testing, and review phases, with feedback from the review phase informing the next iteration."
  ));

  // ─── 1.8 Thesis Organization ───
  items.push(h2("1.8 Thesis Organization"));
  items.push(bodyPara("This thesis is organized into six chapters, each addressing a distinct aspect of the research and development of ShijlAI Academy. The organization follows a logical progression from introductory context through literature review, requirements analysis, system design, implementation, and conclusion. The following provides an overview of each chapter:", { indent: { firstLine: 0 } }));
  items.push(bulletPara("Chapter 1 – Introduction: Presents the background of the study, identifies the research problem, articulates the motivation, defines the objectives, delineates the scope, highlights the significance, describes the development methodology, and outlines the thesis organization."));
  items.push(bulletPara("Chapter 2 – Literature Review: Provides a comprehensive review of existing literature on e-learning platforms, AI in education, personalized learning systems, intelligent tutoring systems, and learning analytics. Analyzes existing systems and identifies research gaps that ShijlAI Academy addresses."));
  items.push(bulletPara("Chapter 3 – Requirements Analysis: Details the stakeholder analysis, feasibility study, functional and non-functional requirements, hardware and software requirements, risk analysis, and constraints and assumptions that guided the system development."));
  items.push(bulletPara("Chapter 4 – System Design: Presents the overall system architecture, database design with ERD, process models with DFDs, interface design, AI module architecture, and the detailed design of each portal and component."));
  items.push(bulletPara("Chapter 5 – Implementation and Testing: Documents the implementation details, technology stack, coding standards, AI module integration, testing strategies, test results, and performance evaluation of the ShijlAI Academy platform."));
  items.push(bulletPara("Chapter 6 – Conclusion and Future Work: Summarizes the research findings, evaluates the achievement of objectives, discusses limitations, and proposes directions for future enhancement and research."));

  // ─── 1.9 Chapter Summary ───
  items.push(h2("1.9 Chapter Summary"));
  items.push(bodyPara("This chapter has established the foundational context for the research by presenting the background of the study, which traced the evolution of online learning from traditional LMS platforms to the emerging paradigm of AI-powered personalized education. The problem statement identified the critical gaps in existing platforms—specifically, the lack of intelligent personalization, adaptive learning pathways, and comprehensive AI integration—that motivated the development of ShijlAI Academy. The research objectives were defined as ten specific, measurable goals that guide the design, implementation, and evaluation of the platform."));
  items.push(bodyPara("The scope of the study was carefully delineated to include the full-stack development of the web-based platform with its three portals, 15+ AI modules, and 148-model database, while explicitly excluding mobile applications, voice interaction, multi-language support beyond English and Urdu, and large-scale production deployment. The significance of the study was articulated across academic, practical, and societal dimensions, emphasizing the contribution to knowledge on hybrid intelligence architectures, the practical value of a deployable AI-powered LMS, and the potential for democratizing personalized education."));
  items.push(bodyPara("The Agile/Iterative development methodology was described as the chosen approach for managing the project, with its emphasis on flexibility, continuous delivery, and iterative refinement. Finally, the thesis organization was outlined, providing a roadmap for the subsequent chapters. The next chapter presents a comprehensive review of the existing literature and systems in the domain of AI-powered education, establishing the scholarly foundation upon which this research is built."));

  items.push(pageBreak());
  return items;
}

// =====================================================================
//  CHAPTER 2: LITERATURE REVIEW
// =====================================================================
function chapter2() {
  const items = [];

  items.push(h1("CHAPTER 2"));
  items.push(centeredBold("LITERATURE REVIEW", 32));
  items.push(...emptyLine(1));

  // ─── 2.1 Introduction ───
  items.push(h2("2.1 Introduction"));
  items.push(bodyPara("This chapter presents a comprehensive review of the existing literature relevant to the development of ShijlAI Academy. The review encompasses the evolution of e-learning platforms, the application of artificial intelligence in education, the development of personalized learning systems, intelligent tutoring systems, and learning analytics. By examining the current state of research and practice in these areas, this review establishes the scholarly foundation for the proposed system and identifies the specific gaps that ShijlAI Academy seeks to address."));
  items.push(bodyPara("The literature review follows a systematic approach, beginning with the broader context of e-learning evolution and progressively narrowing the focus to the specific technologies and methodologies employed in ShijlAI Academy. This progression mirrors the development of the field itself, from early computer-based training systems to modern AI-powered adaptive learning platforms. The review draws upon peer-reviewed journal articles, conference proceedings, technical reports, and authoritative books published primarily within the last decade, with particular emphasis on recent developments in LLM-based educational applications."));
  items.push(bodyPara("A critical component of this review is the comparative analysis of existing learning management systems and AI-powered educational platforms. By systematically evaluating the features, capabilities, and limitations of systems such as Coursera, Udemy, Khan Academy, Moodle, and edX, the review identifies specific functional and architectural gaps that justify the development of ShijlAI Academy. The chapter concludes with a synthesis of the research gaps and a clear articulation of the need for the proposed system."));

  // ─── 2.2 Evolution of E-Learning Platforms ───
  items.push(h2("2.2 Evolution of E-Learning Platforms"));
  items.push(bodyPara("The history of e-learning can be traced back to the 1960s when the University of Illinois developed the PLATO (Programmed Logic for Automatic Teaching Operations) system, one of the first computer-assisted instruction systems. PLATO demonstrated that computers could be used to deliver instructional content, assess student responses, and provide feedback, laying the groundwork for decades of innovation in educational technology. Throughout the 1970s and 1980s, computer-based training (CBT) systems evolved, incorporating increasingly sophisticated multimedia capabilities and branching instructional designs that could adapt to student responses in limited ways."));
  items.push(bodyPara("The 1990s marked a pivotal turning point with the emergence of the World Wide Web, which transformed e-learning from a locally-delivered medium to a globally accessible platform. The development of the first Learning Management Systems—WebCT (1995), Blackboard (1997), and Moodle (2002)—provided educators with comprehensive tools for creating, managing, and delivering online courses. These platforms introduced features such as discussion forums, assignment submission systems, grade books, and content management that became standard features of the LMS category. The Open Source movement, exemplified by Moodle, democratized access to LMS technology, enabling institutions worldwide to deploy online learning platforms without significant licensing costs."));
  items.push(bodyPara("The 2010s witnessed the rise of Massive Open Online Courses (MOOCs), with platforms like Coursera (2012), edX (2012), and Udacity (2012) offering courses from prestigious universities to millions of learners worldwide. MOOCs represented a paradigm shift in scale and accessibility, though they also exposed the limitations of one-size-fits-all online education, with completion rates typically below 10%. This period also saw the emergence of commercial platforms like Udemy (2010) and Skillshare (2010) that adopted marketplace models, allowing anyone to create and sell courses, further expanding the diversity and availability of online learning content."));
  items.push(bodyPara("The most recent evolution, beginning in the late 2010s and accelerating through the 2020s, has been characterized by the integration of artificial intelligence into e-learning platforms. Early AI applications included simple recommendation engines and adaptive testing systems, but the rapid advancement of machine learning and deep learning has enabled increasingly sophisticated AI capabilities. The release of powerful Large Language Models such as GPT-3 (2020) and GPT-4 (2023) has opened entirely new possibilities for AI-powered education, including conversational tutoring, automated content generation, and intelligent feedback systems. ShijlAI Academy represents the next step in this evolution, combining comprehensive LMS functionality with deep, multi-modal AI integration."));

  // Mermaid diagram for evolution
  items.push(...mermaidDiagram(
    `timeline
    title Evolution of E-Learning Platforms
    1960s : PLATO System : First CAI
    1970-80s : CBT Systems : Multimedia CD-ROM
    1990s : Web-based LMS : WebCT, Blackboard
    2000s : Open Source : Moodle, Sakai
    2010s : MOOCs : Coursera, edX, Udemy
    2020s : AI Integration : Adaptive, LLM-powered
    2026 : ShijlAI Academy : Hybrid Intelligence LMS`,
    "2.1",
    "Timeline of E-Learning Platform Evolution",
    "The timeline illustrates the progression from early computer-assisted instruction systems to the current generation of AI-powered learning platforms, with ShijlAI Academy representing the latest advancement in this evolution."
  ));

  // ─── 2.3 Artificial Intelligence in Education ───
  items.push(h2("2.3 Artificial Intelligence in Education"));
  items.push(bodyPara("The application of Artificial Intelligence in education (AIEd) has been the subject of active research for over four decades, with early systems such as SCHOLAR (Carbonell, 1970) and SOPHIE (Brown et al., 1975) demonstrating the potential of AI to provide intelligent instructional support. These pioneering systems laid the conceptual and technical foundations for what would become the field of Intelligent Tutoring Systems (ITS), which remains one of the most active areas of AIEd research. The fundamental premise of AIEd is that AI technologies can augment and enhance human educational processes by providing capabilities that would be impractical or impossible to achieve through human effort alone."));
  items.push(bodyPara("Machine Learning has found wide application in education for tasks such as student performance prediction, dropout risk identification, and learning pattern analysis. Supervised learning algorithms including Random Forests, Support Vector Machines, and Neural Networks have been employed to build predictive models that can identify at-risk students early enough for intervention. Unsupervised learning techniques such as clustering have been used to discover distinct learner profiles and group students with similar characteristics for targeted instructional strategies. Reinforcement learning has been applied to optimize the sequencing of learning activities and the selection of instructional content based on student interactions."));
  items.push(bodyPara("Natural Language Processing (NLP) has enabled significant advances in educational applications, particularly in automated essay scoring, plagiarism detection, and conversational tutoring. Modern NLP techniques, especially those based on transformer architectures, have made it possible to build chatbots and virtual assistants that can engage students in meaningful academic dialogue, answer questions with contextual understanding, and provide explanations tailored to different knowledge levels. The advent of Large Language Models (LLMs) has dramatically accelerated these capabilities, enabling systems that can generate educational content, provide detailed feedback on student work, and engage in Socratic dialogue that promotes deeper understanding."));
  items.push(bodyPara("Computer vision and multimodal AI have also found applications in education, though these are less prevalent than text and data-based approaches. Applications include automated proctoring systems, handwriting recognition for mathematical problem solving, and emotion detection for monitoring student engagement. While ShijlAI Academy primarily leverages text-based AI through LLM integration, the platform's architecture is designed to accommodate future multimodal AI capabilities, including vision-based features powered by VLM (Vision Language Model) technology."));

  // ─── 2.4 Personalized Learning Systems ───
  items.push(h2("2.4 Personalized Learning Systems"));
  items.push(bodyPara("Personalized learning systems represent a paradigm shift from the traditional standardized model of education to an approach that tailors the learning experience to the individual characteristics, needs, and preferences of each learner. The theoretical foundations of personalized learning are deeply rooted in constructivist learning theory (Piaget, 1973; Vygotsky, 1978), which posits that learners actively construct knowledge through their experiences and that effective instruction must be responsive to the learner's existing mental models and developmental stage. Vygotsky's concept of the Zone of Proximal Development (ZPD)—the space between what a learner can do independently and what they can achieve with guidance—provides a particularly relevant framework for AI-powered personalization, as the optimal learning experience occurs within this zone."));
  items.push(bodyPara("Modern personalized learning systems employ a variety of techniques to achieve individualization. Content-based personalization adapts the type and format of learning materials based on learner preferences and performance data. Sequence-based personalization adjusts the order in which topics and activities are presented, ensuring that prerequisites are mastered before advanced concepts are introduced. Pace-based personalization allows learners to progress through material at their own speed, providing additional support for struggling students and enrichment opportunities for advanced learners. Assessment-based personalization modifies the difficulty and type of assessments based on learner performance, ensuring that evaluations are appropriately challenging and diagnostic."));
  items.push(bodyPara("Several notable personalized learning systems have been developed in research settings. The ALEKS (Assessment and Learning in Knowledge Spaces) system uses knowledge space theory to map the relationships between concepts and personalize learning paths accordingly. Knewton, an adaptive learning platform, uses item response theory and Bayesian knowledge tracing to estimate learner proficiency and recommend appropriate content. Smart Sparrow, an adaptive e-learning platform, allows instructors to create adaptive tutorials that respond to student interactions in real-time. While these systems demonstrate the potential of personalized learning, they are typically limited to specific domains or isolated adaptive features rather than providing comprehensive, AI-powered personalization across the entire learning lifecycle."));
  items.push(bodyPara("ShijlAI Academy advances the state of personalized learning systems by integrating multiple personalization dimensions within a single platform. The system's Topic Mastery module tracks learner competency across interconnected knowledge domains, while the Skill Graph visualizes prerequisite relationships and learning pathways. The Learning Companion provides proactive, personalized guidance based on real-time analysis of student behavior and performance. The Ask ShijlAI assistant adapts its responses to the learner's context and question type across six operational modes. This multi-dimensional personalization approach represents a significant advancement over existing systems that typically implement personalization along a single dimension."));

  // ─── 2.5 Intelligent Tutoring Systems ───
  items.push(h2("2.5 Intelligent Tutoring Systems"));
  items.push(bodyPara("Intelligent Tutoring Systems (ITS) represent one of the most successful and well-researched applications of AI in education. An ITS is a computer system that provides immediate, customized instruction or feedback to learners without the intervention of a human teacher, typically employing techniques from AI including cognitive modeling, knowledge representation, and natural language understanding. The traditional architecture of an ITS consists of four core components: the domain model (representing expert knowledge), the student model (representing the learner's current state of understanding), the tutoring model (determining instructional strategies), and the interface model (managing the interaction between the system and the learner)."));
  items.push(bodyPara("Notable ITS developments include the Cognitive Tutor developed by Carnegie Mellon University, which uses cognitive models to trace student problem-solving processes and provide individualized hints and feedback. The AutoTutor system developed at the University of Memphis uses natural language dialogue to engage learners in constructive, interactive tutoring sessions that simulate human tutoring conversations. The ASSISTments platform, developed at Worcester Polytechnic Institute, provides AI-powered tutoring for mathematics that has been validated through rigorous randomized controlled trials, demonstrating significant improvements in student learning outcomes."));
  items.push(bodyPara("Despite the demonstrated effectiveness of ITS, several challenges have limited their widespread adoption. First, the development of comprehensive domain models requires significant expert effort and is often domain-specific, making it difficult to create generalizable ITS solutions. Second, most ITS are designed for well-structured domains such as mathematics and physics, where correct answers can be algorithmically verified, and struggle with ill-structured domains such as writing, critical thinking, and creative problem-solving. Third, traditional ITS rely on handcrafted rules and cognitive models that are expensive to develop and maintain, and lack the flexibility to handle the full range of student queries and misconceptions."));
  items.push(bodyPara("The emergence of Large Language Models offers a transformative opportunity to address these limitations. LLM-based tutoring systems can engage in open-ended dialogue across virtually any domain, generate explanations at multiple levels of complexity, and adapt their responses based on the learner's demonstrated understanding—capabilities that were previously achievable only through extensive handcrafting of domain-specific content. ShijlAI Academy's Ask ShijlAI module leverages LLM capabilities to provide intelligent tutoring across six operational modes, while the Learning Companion extends the traditional ITS concept by proactively monitoring student progress and offering guidance without requiring explicit student queries, thereby combining the best features of reactive ITS and proactive educational advisory systems."));

  // ─── 2.6 Learning Analytics Systems ───
  items.push(h2("2.6 Learning Analytics Systems"));
  items.push(bodyPara("Learning Analytics (LA) is defined as the measurement, collection, analysis, and reporting of data about learners and their contexts, with the purpose of understanding and optimizing learning and the environments in which it occurs (Siemens & Long, 2011). The field of learning analytics has grown rapidly in the past decade, driven by the increasing availability of digital learning data and the development of sophisticated analytical tools and techniques. Learning analytics systems process data from multiple sources—including LMS interaction logs, assessment results, discussion forum participation, and resource access patterns—to generate insights that can inform instructional design, identify at-risk students, and personalize learning experiences."));
  items.push(bodyPara("The scope of learning analytics ranges from descriptive analytics, which summarize what has happened (e.g., average quiz scores, content access patterns), through predictive analytics, which forecast what is likely to happen (e.g., student dropout risk, expected final grade), to prescriptive analytics, which recommend actions to achieve desired outcomes (e.g., specific interventions for struggling students). The most advanced learning analytics systems incorporate real-time data processing and visualization, enabling educators to monitor student engagement and performance continuously and intervene proactively when issues are detected."));
  items.push(bodyPara("Several frameworks and standards have been developed to guide the implementation of learning analytics. The Learning Analytics Community Exchange (LACE) framework outlines a process model for learning analytics that includes data collection, processing, analysis, and intervention. The xAPI (Experience API) standard provides a specification for capturing and representing learning experiences in a consistent, interoperable format. These standards and frameworks facilitate the development of learning analytics systems that can integrate with diverse data sources and serve varied analytical needs."));
  items.push(bodyPara("ShijlAI Academy incorporates a comprehensive learning analytics subsystem that tracks and analyzes student engagement, performance, and behavioral data across all platform interactions. The analytics system provides real-time dashboards for students (showing personal progress and recommendations), instructors (showing class-level analytics and individual student profiles), and administrators (showing institutional-level metrics and trends). The AI-powered analytics engine goes beyond traditional descriptive analytics by employing the Admin Copilot module to generate predictive insights, identify emerging patterns, and provide prescriptive recommendations for institutional decision-making."));

  // ─── 2.7 Existing Systems Analysis ───
  items.push(h2("2.7 Existing Systems Analysis"));
  items.push(bodyPara("A systematic analysis of existing learning management systems and AI-powered educational platforms is essential for identifying the specific gaps that ShijlAI Academy addresses. This section examines five prominent platforms—Coursera, Udemy, Khan Academy, Moodle, and edX—evaluating their features, AI capabilities, personalization mechanisms, and limitations. The analysis is based on published research, platform documentation, and direct observation of platform functionality."));
  items.push(bodyPara("Coursera, founded in 2012 by Stanford professors Andrew Ng and Daphne Koller, is one of the world's largest online learning platforms, offering courses from over 300 universities and organizations. Coursera employs basic AI features including course recommendations, adaptive quizzes in some courses, and auto-grading for programming assignments. However, its AI capabilities are limited primarily to recommendation engines and do not extend to real-time personalized tutoring, adaptive learning paths, or instructor support tools. The platform is also predominantly content-centric, with limited mechanisms for active, personalized learning engagement."));
  items.push(bodyPara("Udemy operates as a marketplace model where independent instructors create and sell courses. While this model offers tremendous content diversity, it results in inconsistent quality and virtually no AI-powered personalization. The platform lacks adaptive learning pathways, intelligent tutoring, and comprehensive learning analytics. Khan Academy, a non-profit platform focused on K-12 education, incorporates more advanced AI features through its Khanmigo AI assistant and mastery-based learning system. However, Khan Academy's AI features are limited to a specific educational domain and do not provide the comprehensive, multi-portal architecture needed for higher education institutions."));
  items.push(bodyPara("Moodle, the most widely deployed open-source LMS, provides extensive customization through plugins but lacks native AI capabilities. While AI plugins exist for Moodle, they are typically narrow in scope and do not provide the deeply integrated, multi-modal AI functionality that modern educational platforms require. edX, similar to Coursera, offers courses from prestigious institutions and has experimented with AI-powered features such as automated essay scoring and virtual lab environments, but its AI integration remains limited and fragmented rather than comprehensive and unified."));

  // Comparison table
  items.push(tableCaption("Table 2.1: Comparative Analysis of Existing Learning Platforms"));
  items.push(threeLineTable(
    ["Feature", "Coursera", "Udemy", "Khan Academy", "Moodle", "edX", "ShijlAI Academy"],
    [
      ["AI-Powered Tutoring", "Limited", "None", "Khanmigo", "Plugin", "Limited", "Full (6 modes)"],
      ["Adaptive Learning Paths", "Partial", "None", "Mastery-based", "Plugin", "Partial", "Full (AI-driven)"],
      ["Learning Companion", "No", "No", "Partial", "No", "No", "Yes (Proactive)"],
      ["Mock Interview AI", "No", "No", "No", "No", "No", "Yes"],
      ["Instructor AI Copilot", "No", "No", "No", "No", "No", "Yes"],
      ["Admin AI Copilot", "No", "No", "No", "Plugin", "No", "Yes"],
      ["Skill Graph", "No", "No", "Partial", "No", "No", "Yes (Full)"],
      ["Topic Mastery", "No", "No", "Yes", "No", "No", "Yes (AI-enhanced)"],
      ["Multi-Portal Design", "No", "No", "No", "Partial", "No", "Yes (3 portals)"],
      ["RBAC", "Basic", "Basic", "Basic", "Yes", "Basic", "Yes (Granular)"],
      ["Open Source", "No", "No", "Partial", "Yes", "Partial", "Academic"],
      ["LLM Integration", "Partial", "No", "Yes", "Plugin", "No", "Deep (z-ai-sdk)"],
      ["Hybrid Intelligence", "No", "No", "No", "No", "No", "Yes (Rule+LLM)"],
      ["Content Generation AI", "No", "No", "No", "No", "No", "Yes"],
    ],
    [18, 11, 11, 12, 11, 11, 16]
  ));
  items.push(...emptyLine(1));

  // ─── 2.8 Research Gap Analysis ───
  items.push(h2("2.8 Research Gap Analysis"));
  items.push(bodyPara("The systematic analysis of existing platforms and literature reveals several significant research gaps that ShijlAI Academy is specifically designed to address. These gaps span architectural, functional, and integration dimensions, and their identification provides a clear justification for the proposed system."));
  items.push(bodyPara("Gap 1: Absence of Hybrid Intelligence Architectures in Educational Software. Existing AI-powered educational platforms employ either purely rule-based systems (traditional ITS) or purely LLM-based approaches (modern AI chatbots). There is no established architectural pattern for combining rule-based and LLM-based reasoning in educational software that leverages the deterministic reliability of rule-based systems for critical academic operations while employing LLMs for flexible, context-aware interactions. ShijlAI Academy addresses this gap through its hybrid intelligence architecture."));
  items.push(bodyPara("Gap 2: Fragmented AI Integration in LMS Platforms. Current LMS platforms either lack AI capabilities entirely (e.g., Moodle) or incorporate AI in isolated, feature-specific ways (e.g., Coursera's recommendation engine, Khan Academy's Khanmigo). There is no platform that provides comprehensive, deeply integrated AI across all aspects of the learning experience—student support, instructor assistance, administrative intelligence, content generation, assessment creation, and learning analytics—within a single unified system. ShijlAI Academy's 15+ AI modules, integrated across three portals, address this fragmentation."));
  items.push(bodyPara("Gap 3: Limited Multi-Portal AI Architecture. Existing platforms are designed primarily from a student-facing perspective, with AI features focused on learner support. The needs of instructors and administrators for AI-powered assistance are largely unaddressed. ShijlAI Academy's three-portal architecture, with dedicated AI modules for each user role (Ask ShijlAI and Learning Companion for students, Instructor Copilot for instructors, Admin Copilot for administrators), addresses this gap by providing comprehensive AI support across all stakeholder categories."));
  items.push(bodyPara("Gap 4: Insufficient Personalization Depth and Breadth. Most personalized learning systems implement personalization along a single dimension (e.g., content sequence, difficulty level, or learning pace). ShijlAI Academy implements multi-dimensional personalization through Topic Mastery tracking, Skill Graph visualization, adaptive learning path generation, context-aware AI tutoring, and proactive learning companion guidance, providing a depth and breadth of personalization that exceeds existing approaches."));

  // ─── 2.9 Need for Proposed System ───
  items.push(h2("2.9 Need for Proposed System"));
  items.push(bodyPara("The research gap analysis establishes a compelling case for the development of ShijlAI Academy. The need for the proposed system is driven by the convergence of three critical factors: the demonstrated limitations of existing platforms, the unprecedented opportunity created by recent advances in AI technology, and the specific educational context of institutions like the University of Malakand that require affordable, effective, AI-powered learning solutions."));
  items.push(bodyPara("Existing LMS platforms, as documented in the preceding analysis, fail to provide the comprehensive AI integration, multi-dimensional personalization, and multi-portal intelligent support that modern educational institutions require. Students continue to receive one-size-fits-all instruction despite decades of research demonstrating the superiority of personalized approaches. Instructors lack AI-powered tools that could significantly reduce their workload while improving instructional quality. Administrators make decisions based on lagging indicators and manual analysis rather than real-time, AI-generated insights. These gaps represent not merely inconveniences but fundamental limitations that impede the effectiveness of online education."));
  items.push(bodyPara("The recent advancement of Large Language Models and their accessibility through developer SDKs has created an unprecedented opportunity to address these gaps in a practical, cost-effective manner. The z-ai-web-dev-sdk, which provides streamlined access to state-of-the-art LLM capabilities, makes it feasible to develop a platform with deep AI integration without requiring the extensive computational infrastructure and specialized expertise that would have been necessary even a few years ago. ShijlAI Academy leverages this opportunity to deliver AI-powered features that were previously impractical for academic projects."));
  items.push(bodyPara("The specific educational context of the University of Malakand and similar institutions in developing regions amplifies the need for an AI-powered learning platform. High student-to-teacher ratios, limited resources for individual tutoring, and the growing demand for online and hybrid learning modalities create a pressing need for technology that can multiply the effectiveness of existing educational resources. ShijlAI Academy addresses this need by providing AI-powered personalization and support at scale, enabling a single instructor to effectively guide many more students than would be possible through manual effort alone."));

  // ─── 2.10 Proposed System Overview ───
  items.push(h2("2.10 Proposed System Overview"));
  items.push(bodyPara("ShijlAI Academy is proposed as a comprehensive, AI-powered personalized learning platform that integrates advanced AI capabilities with full-featured learning management functionality. The system is designed as a three-portal web application, with dedicated interfaces and AI modules for students, instructors, and administrators. The platform employs a hybrid intelligence architecture that combines rule-based decision systems for deterministic academic operations with LLM-powered reasoning for flexible, context-aware AI interactions."));
  items.push(bodyPara("The Student Portal provides access to adaptive learning paths, AI-powered tutoring through Ask ShijlAI (operating in six modes: General Query, Concept Explanation, Problem Solving, Code Assistance, Study Planning, and Research Guidance), a proactive Learning Companion, Mock Interview capabilities, Topic Mastery tracking, and Skill Graph visualization. The Instructor Portal offers an AI Copilot for content generation, assessment creation, student performance analysis, and teaching recommendations. The Administrator Portal provides an AI Copilot for institutional analytics, enrollment forecasting, and strategic decision support."));
  items.push(bodyPara("The technical architecture is built on Next.js 16 with React 19 for the frontend, TypeScript for type safety throughout the codebase, Prisma ORM with SQLite for data persistence, and the z-ai-web-dev-sdk for AI capabilities. The database comprises 148 interrelated models, and the API layer exposes 176 endpoints covering all system operations. The platform implements Role-Based Access Control (RBAC) with granular permissions, ensuring secure and appropriate access across all portals."));

  // Architecture diagram
  items.push(...mermaidDiagram(
    `graph TB
    subgraph Student Portal
        S1[Ask ShijlAI<br/>6 Modes]
        S2[Learning Companion]
        S3[Mock Interviews]
        S4[Topic Mastery]
        S5[Skill Graph]
        S6[Adaptive Paths]
    end
    subgraph Instructor Portal
        I1[Instructor Copilot]
        I2[Content Generation]
        I3[Assessment Creator]
        I4[Student Analytics]
    end
    subgraph Admin Portal
        A1[Admin Copilot]
        A2[Institutional Analytics]
        A3[Enrollment Forecasting]
    end
    subgraph Core Engine
        C1[Hybrid Intelligence<br/>Rule-Based + LLM]
        C2[RBAC Engine]
        C3[148 DB Models]
        C4[176 API Endpoints]
    end
    S1 --> C1
    S2 --> C1
    S3 --> C1
    I1 --> C1
    I2 --> C1
    A1 --> C1
    C1 --> C3
    C1 --> C4
    C2 --> C3`,
    "2.2",
    "ShijlAI Academy System Architecture Overview",
    "The architecture diagram illustrates the three-portal design of ShijlAI Academy, showing how AI modules in each portal connect to the core Hybrid Intelligence Engine, which in turn interfaces with the database layer and API infrastructure."
  ));

  // ─── 2.11 Advantages of Proposed System ───
  items.push(h2("2.11 Advantages of Proposed System"));
  items.push(bodyPara("ShijlAI Academy offers several distinct advantages over existing learning management systems and AI-powered educational platforms. These advantages stem from the system's comprehensive AI integration, hybrid intelligence architecture, multi-portal design, and modern technology stack."));
  items.push(bulletPara("Comprehensive AI Integration: Unlike existing platforms that incorporate AI in isolated features, ShijlAI Academy integrates 15+ AI modules across all aspects of the learning experience, providing seamless, cohesive AI support for students, instructors, and administrators."));
  items.push(bulletPara("Hybrid Intelligence Architecture: The combination of rule-based and LLM-powered reasoning ensures both the deterministic reliability required for critical academic operations (e.g., grading, access control) and the flexible, context-aware responses needed for personalized tutoring and support."));
  items.push(bulletPara("Multi-Portal Design: Dedicated portals for students, instructors, and administrators ensure that each user category has a tailored, role-appropriate experience with relevant AI tools and analytics, rather than a one-size-fits-all interface."));
  items.push(bulletPara("Proactive Learning Support: The Learning Companion module goes beyond reactive Q&A systems by proactively monitoring student progress and offering guidance before issues escalate, simulating the attentive support of a human tutor."));
  items.push(bulletPara("Multi-Mode AI Assistance: Ask ShijlAI's six operational modes provide specialized, context-appropriate AI responses for different types of academic needs, from general queries to code assistance and research guidance."));
  items.push(bulletPara("Skill Graph and Topic Mastery: These modules provide unprecedented visibility into learner competency across interconnected knowledge domains, enabling both learners and instructors to identify gaps and optimize learning strategies."));
  items.push(bulletPara("Modern Technology Stack: Built with Next.js 16, React 19, TypeScript, and Prisma ORM, the platform leverages the latest web development technologies for performance, developer productivity, maintainability, and type safety."));
  items.push(bulletPara("Scalable Architecture: The 148-model database and 176-endpoint API architecture provide a robust foundation for feature expansion and institutional growth."));

  // ─── 2.12 Chapter Summary ───
  items.push(h2("2.12 Chapter Summary"));
  items.push(bodyPara("This chapter has presented a comprehensive review of the literature and existing systems relevant to the development of ShijlAI Academy. The review traced the evolution of e-learning platforms from early computer-assisted instruction systems to the current generation of AI-powered learning platforms, demonstrating the progressive integration of technology into educational processes. The examination of AI in education highlighted the transformative potential of machine learning, natural language processing, and large language models for enhancing educational experiences, while also noting the practical limitations that have constrained their deployment in comprehensive learning management systems."));
  items.push(bodyPara("The analysis of personalized learning systems and intelligent tutoring systems established the theoretical and practical foundations for ShijlAI Academy's personalization approach, identifying the multi-dimensional personalization strategy as a key differentiator from existing systems that typically implement personalization along a single dimension. The review of learning analytics systems provided the basis for ShijlAI Academy's analytics architecture, which extends traditional descriptive analytics with AI-powered predictive and prescriptive capabilities."));
  items.push(bodyPara("The comparative analysis of five prominent existing platforms—Coursera, Udemy, Khan Academy, Moodle, and edX—revealed consistent gaps in AI integration, personalization depth, multi-portal design, and instructor/administrator AI support. Four specific research gaps were identified: the absence of hybrid intelligence architectures, fragmented AI integration, limited multi-portal AI architecture, and insufficient personalization depth and breadth. The need for the proposed system was established based on these gaps, the opportunity created by recent AI advances, and the specific educational context of institutions requiring affordable, effective AI-powered learning solutions. The next chapter presents the detailed requirements analysis for ShijlAI Academy."));

  items.push(pageBreak());
  return items;
}

// =====================================================================
//  CHAPTER 3: REQUIREMENTS ANALYSIS
// =====================================================================
function chapter3() {
  const items = [];

  items.push(h1("CHAPTER 3"));
  items.push(centeredBold("REQUIREMENTS ANALYSIS", 32));
  items.push(...emptyLine(1));

  // ─── 3.1 Introduction ───
  items.push(h2("3.1 Introduction"));
  items.push(bodyPara("Requirements analysis is a critical phase in the software development lifecycle that establishes the foundation for all subsequent design and implementation activities. The quality and completeness of the requirements specification directly determine the success of the final system, as inadequately defined requirements lead to systems that fail to meet stakeholder needs, require costly rework, or both. This chapter presents a comprehensive requirements analysis for ShijlAI Academy, covering stakeholder analysis, feasibility study, functional requirements, non-functional requirements, hardware and software requirements, risk analysis, and constraints and assumptions."));
  items.push(bodyPara("The requirements analysis for ShijlAI Academy was conducted using a combination of techniques including stakeholder interviews, analysis of existing LMS platforms, review of educational technology standards, and examination of AI integration best practices. The requirements were gathered from three primary stakeholder categories—students, instructors, and administrators—each of which has distinct needs and expectations from the system. The analysis also drew upon the literature review presented in Chapter 2, which identified specific functional gaps in existing platforms that ShijlAI Academy must address."));
  items.push(bodyPara("The requirements are organized into functional requirements (specifying what the system must do) and non-functional requirements (specifying how well the system must perform its functions). Each functional requirement is uniquely identified with an FR prefix and numbered sequentially, while non-functional requirements use an NFR prefix. This systematic identification scheme facilitates traceability throughout the development process and ensures that each requirement can be tracked from specification through design, implementation, and testing."));
  items.push(bodyPara("The requirements specification also includes a feasibility study that evaluates the proposed system across technical, economic, operational, and schedule dimensions, a risk analysis that identifies potential threats to the project and proposes mitigation strategies, and a statement of constraints and assumptions that bound the scope and context of the requirements. Together, these elements provide a comprehensive, well-structured foundation for the system design and implementation activities that follow in subsequent chapters."));

  // ─── 3.2 Stakeholder Analysis ───
  items.push(h2("3.2 Stakeholder Analysis"));
  items.push(bodyPara("Stakeholder analysis is the process of identifying the individuals and groups who have an interest in or influence over the system being developed, understanding their needs and expectations, and ensuring that the system design addresses these concerns. For ShijlAI Academy, three primary stakeholder categories have been identified: Students, Instructors, and Administrators. Each category has distinct roles, responsibilities, and requirements that must be accommodated by the system."));

  items.push(h3("3.2.1 Students"));
  items.push(bodyPara("Students are the primary end-users of ShijlAI Academy and represent the largest stakeholder group. Their primary need is for an engaging, personalized learning experience that adapts to their individual knowledge level, learning pace, and preferred learning style. Students expect the platform to provide clear learning pathways, instant access to course materials, interactive assessments with immediate feedback, and intelligent academic support available around the clock. They require features such as progress tracking, performance dashboards, AI-powered tutoring, and the ability to interact with learning content in multiple formats."));
  items.push(bodyPara("From a usability perspective, students expect an intuitive, responsive interface that minimizes the cognitive load of navigating the platform and maximizes the time spent on actual learning activities. They also expect the AI features to be helpful and non-intrusive, providing support when needed without overwhelming them with unsolicited recommendations. Students with varying levels of technical proficiency must be accommodated, ensuring that the platform is accessible to users who may not be technically sophisticated."));

  items.push(h3("3.2.2 Instructors"));
  items.push(bodyPara("Instructors are responsible for creating and managing course content, designing assessments, monitoring student progress, and providing academic guidance. Their primary need is for efficient, AI-powered tools that reduce the time spent on administrative and repetitive tasks (such as content creation, grading, and report generation) while enhancing the quality and personalization of their instructional activities. Instructors require features such as AI-assisted content generation, automated assessment creation with rubric-based grading, student performance analytics with early warning indicators, and personalized teaching recommendations."));
  items.push(bodyPara("Instructors also need comprehensive control over their courses, including the ability to customize AI behavior within their courses, moderate AI-generated content, and configure the personalization parameters for their students. The platform must support multiple instructional modalities including synchronous and asynchronous teaching, self-paced and instructor-paced courses, and various assessment types including quizzes, assignments, projects, and discussions."));

  items.push(h3("3.2.3 Administrators"));
  items.push(bodyPara("Administrators are responsible for the overall management, oversight, and strategic direction of the educational institution's use of ShijlAI Academy. Their primary need is for institutional-level analytics and intelligence that support data-driven decision-making regarding enrollment management, resource allocation, curriculum planning, and academic policy. Administrators require features such as enrollment dashboards and forecasting, departmental and institutional performance metrics, AI-generated strategic reports, user management with role-based access control, and system configuration capabilities."));
  items.push(bodyPara("Administrators also need visibility into the AI system's behavior and impact, including metrics on AI usage patterns, effectiveness of personalization algorithms, and compliance with institutional policies and ethical guidelines. The Admin Portal must provide a comprehensive, high-level view of the institution's educational operations while also allowing drill-down into specific departments, courses, and individual student records when necessary."));

  // Stakeholder summary table
  items.push(tableCaption("Table 3.1: Stakeholder Summary"));
  items.push(threeLineTable(
    ["Stakeholder", "Primary Needs", "Key Features Required", "Portal"],
    [
      ["Students", "Personalized learning, AI support", "Ask ShijlAI, Learning Companion, Skill Graph", "Student Portal"],
      ["Instructors", "AI-assisted teaching, analytics", "Instructor Copilot, Content Gen, Analytics", "Instructor Portal"],
      ["Administrators", "Institutional intelligence, oversight", "Admin Copilot, Enrollment Forecast, RBAC", "Admin Portal"],
    ],
    [15, 25, 35, 15]
  ));
  items.push(...emptyLine(1));

  // ─── 3.3 Feasibility Study ───
  items.push(h2("3.3 Feasibility Study"));
  items.push(bodyPara("A feasibility study evaluates the practicality and viability of the proposed system across multiple dimensions before committing significant resources to development. The feasibility of ShijlAI Academy has been assessed across four dimensions: technical, economic, operational, and schedule feasibility. The results of this assessment confirm that the development of ShijlAI Academy is feasible and that the project can be successfully completed within the available resources and time constraints."));

  items.push(h3("3.3.1 Technical Feasibility"));
  items.push(bodyPara("The technical feasibility of ShijlAI Academy is well-established. The platform is built on mature, well-documented technologies including Next.js 16 (a leading React framework with extensive community support), React 19 (the most widely-used frontend library), TypeScript 5 (a strongly-typed superset of JavaScript), and Prisma ORM (a modern, type-safe database toolkit). These technologies have been proven in production environments and are supported by active developer communities, comprehensive documentation, and extensive third-party libraries and tools."));
  items.push(bodyPara("The AI capabilities of the platform are powered by the z-ai-web-dev-sdk, which provides streamlined access to Large Language Model (LLM) and Vision Language Model (VLM) capabilities without requiring the development team to manage AI model infrastructure. This approach eliminates the most significant technical barrier to AI integration—the need for specialized hardware, model training expertise, and computational resources—making it feasible to incorporate sophisticated AI features within an academic project. The SQLite database engine, while limited in scalability compared to client-server databases, is sufficient for the demonstration and evaluation purposes of this project and can be migrated to PostgreSQL for production deployment."));

  items.push(h3("3.3.2 Economic Feasibility"));
  items.push(bodyPara("The economic feasibility of ShijlAI Academy is favorable due to the use of open-source technologies and cost-effective development tools. The core technology stack—Next.js, React, TypeScript, Prisma, and SQLite—is entirely free and open-source, requiring no licensing fees. The development tools, including VS Code, Git, and various Node.js packages, are also freely available. The primary cost associated with the project is the time and effort of the development team, which is provided as part of the academic thesis requirement."));
  items.push(bodyPara("The z-ai-web-dev-sdk provides AI capabilities at a fraction of the cost that would be required to develop and deploy custom AI models. While LLM API usage incurs per-request costs, these costs are manageable for a development and evaluation project and can be optimized through caching, request batching, and intelligent prompt design. The total estimated cost of the project is minimal, making it economically feasible for development within an academic context."));

  items.push(h3("3.3.3 Operational Feasibility"));
  items.push(bodyPara("The operational feasibility of ShijlAI Academy is supported by the growing demand for AI-powered educational tools and the increasing comfort of users with AI-assisted interactions. The platform's three-portal design aligns with the natural role divisions within educational institutions, making it intuitive for users to navigate to the features and tools relevant to their responsibilities. The AI features are designed to augment rather than replace human educators, ensuring that the platform enhances existing educational workflows rather than disrupting them."));
  items.push(bodyPara("The platform's web-based architecture ensures accessibility from any device with a modern web browser, eliminating the need for specialized client software installation. The responsive design accommodates desktop, laptop, and tablet devices, ensuring that users can access the platform from their preferred computing environment. User training requirements are minimized by the intuitive interface design and the AI's ability to provide contextual help and guidance within the platform itself."));

  items.push(h3("3.3.4 Schedule Feasibility"));
  items.push(bodyPara("The schedule feasibility of ShijlAI Academy is supported by the Agile/Iterative development methodology, which enables incremental delivery of functionality and regular progress assessment. The project has been planned with a realistic timeline that accounts for the complexity of AI integration and the constraints of an academic project timeline. The iterative approach allows for the prioritization of core features in early sprints, ensuring that a functional minimum viable product is available well before the final deadline, with subsequent sprints adding advanced AI features and refinements."));

  // Feasibility summary table
  items.push(tableCaption("Table 3.2: Feasibility Study Summary"));
  items.push(threeLineTable(
    ["Feasibility Dimension", "Assessment", "Key Justification"],
    [
      ["Technical", "Feasible", "Mature stack (Next.js 16, React 19, TypeScript, Prisma); z-ai-web-dev-sdk for AI"],
      ["Economic", "Feasible", "Open-source technologies; minimal costs; academic project"],
      ["Operational", "Feasible", "Web-based access; intuitive design; augments existing workflows"],
      ["Schedule", "Feasible", "Agile methodology; incremental delivery; realistic timeline"],
    ],
    [20, 15, 55]
  ));
  items.push(...emptyLine(1));

  // ─── 3.4 Functional Requirements ───
  items.push(h2("3.4 Functional Requirements"));
  items.push(bodyPara("Functional requirements specify the behaviors and functions that the system must perform. They define what the system should do in response to specific inputs and conditions, and they form the basis for the system's feature set and user interactions. The following functional requirements have been identified for ShijlAI Academy through stakeholder analysis, literature review, and examination of existing platform capabilities. Each requirement is uniquely identified and described with its priority level."));

  items.push(tableCaption("Table 3.3: Functional Requirements"));
  items.push(threeLineTable(
    ["ID", "Requirement", "Description", "Priority"],
    [
      ["FR-01", "User Registration", "The system shall allow new users to register with email, password, and role selection (Student, Instructor, Admin)", "High"],
      ["FR-02", "User Authentication", "The system shall authenticate users via secure login with email and password, including JWT-based session management", "High"],
      ["FR-03", "Role-Based Access Control", "The system shall enforce RBAC with granular permissions for Student, Instructor, and Administrator roles", "High"],
      ["FR-04", "Course Creation", "The system shall allow instructors to create courses with title, description, category, difficulty level, and thumbnail", "High"],
      ["FR-05", "Course Enrollment", "The system shall allow students to browse, search, and enroll in available courses", "High"],
      ["FR-06", "Content Management", "The system shall support creation and management of multi-type content: text, video, code, and interactive elements", "High"],
      ["FR-07", "Ask ShijlAI – General Query", "The system shall provide an AI assistant for general academic queries with context-aware responses", "High"],
      ["FR-08", "Ask ShijlAI – Concept Explanation", "The system shall explain concepts at adjustable complexity levels tailored to the student's understanding", "High"],
      ["FR-09", "Ask ShijlAI – Problem Solving", "The system shall guide students through problem-solving with step-by-step hints and Socratic questioning", "High"],
      ["FR-10", "Ask ShijlAI – Code Assistance", "The system shall provide code debugging, explanation, and generation assistance with syntax highlighting", "High"],
      ["FR-11", "Ask ShijlAI – Study Planning", "The system shall generate personalized study plans based on course requirements and student availability", "Medium"],
      ["FR-12", "Ask ShijlAI – Research Guidance", "The system shall assist with research methodology, literature search strategies, and citation formatting", "Medium"],
      ["FR-13", "Learning Companion", "The system shall proactively monitor student progress and offer personalized guidance and recommendations", "High"],
      ["FR-14", "Mock Interview", "The system shall simulate interview scenarios with AI-generated questions and evaluate student responses", "Medium"],
      ["FR-15", "Instructor Copilot", "The system shall provide AI-assisted content generation, assessment creation, and teaching recommendations", "High"],
      ["FR-16", "Admin Copilot", "The system shall provide institutional analytics, enrollment forecasting, and strategic decision support", "Medium"],
      ["FR-17", "Topic Mastery Tracking", "The system shall track and display learner mastery levels across interconnected knowledge topics", "High"],
      ["FR-18", "Skill Graph Visualization", "The system shall visualize learner competency across interconnected knowledge domains with prerequisite graphs", "Medium"],
      ["FR-19", "Adaptive Learning Paths", "The system shall generate and adjust learning paths based on student performance and knowledge gaps", "High"],
      ["FR-20", "Quiz and Assessment", "The system shall support creation of quizzes, assignments, and exams with multiple question types and auto-grading", "High"],
      ["FR-21", "AI-Powered Assessment Generation", "The system shall allow instructors to generate assessments automatically using AI based on course content", "Medium"],
      ["FR-22", "Progress Tracking", "The system shall track and display student progress through courses, modules, and individual activities", "High"],
      ["FR-23", "Performance Analytics", "The system shall provide detailed analytics dashboards for students, instructors, and administrators", "High"],
      ["FR-24", "Discussion Forums", "The system shall provide course-specific discussion forums with AI-moderated thread suggestions", "Medium"],
      ["FR-25", "Notification System", "The system shall send notifications for enrollment confirmations, assignment deadlines, and AI recommendations", "Medium"],
      ["FR-26", "Profile Management", "The system shall allow users to manage their profiles including personal information and preferences", "Medium"],
      ["FR-27", "Search Functionality", "The system shall provide search across courses, content, and resources with AI-enhanced relevance ranking", "Medium"],
      ["FR-28", "Certificate Generation", "The system shall generate completion certificates for students who fulfill course requirements", "Low"],
      ["FR-29", "Data Export", "The system shall allow administrators to export institutional data in standard formats (CSV, PDF)", "Low"],
      ["FR-30", "AI Interaction History", "The system shall store and allow review of all AI interactions for learning analytics and improvement", "Medium"],
      ["FR-31", "Hybrid Intelligence Engine", "The system shall combine rule-based decisions with LLM-powered reasoning for hybrid AI responses", "High"],
      ["FR-32", "Content Recommendation", "The system shall recommend relevant courses and content based on learner profile and behavior", "Medium"],
    ],
    [8, 20, 55, 10]
  ));
  items.push(...emptyLine(1));

  // ─── 3.5 Non-Functional Requirements ───
  items.push(h2("3.5 Non-Functional Requirements"));
  items.push(bodyPara("Non-functional requirements specify the quality attributes, constraints, and performance characteristics that the system must exhibit. While functional requirements define what the system does, non-functional requirements define how well the system performs its functions. These requirements are critical for ensuring that ShijlAI Academy provides a satisfactory user experience, maintains security and reliability, and can accommodate future growth and evolution."));

  items.push(tableCaption("Table 3.4: Non-Functional Requirements"));
  items.push(threeLineTable(
    ["ID", "Category", "Requirement", "Metric/Target"],
    [
      ["NFR-01", "Performance", "The system shall load pages within 3 seconds under normal load", "Page load time ≤ 3s"],
      ["NFR-02", "Performance", "AI responses shall be generated within 10 seconds for standard queries", "AI response time ≤ 10s"],
      ["NFR-03", "Performance", "The system shall support at least 100 concurrent users without degradation", "100 concurrent users"],
      ["NFR-04", "Security", "All passwords shall be hashed using bcrypt with salt rounds ≥ 10", "bcrypt hash, salt ≥ 10"],
      ["NFR-05", "Security", "The system shall implement JWT-based authentication with token expiration", "JWT with expiration"],
      ["NFR-06", "Security", "The system shall protect against XSS, CSRF, and SQL injection attacks", "OWASP Top 10 compliance"],
      ["NFR-07", "Security", "The system shall implement RBAC with permission verification on every API call", "Permission check on all endpoints"],
      ["NFR-08", "Usability", "The interface shall be intuitive with minimal learning curve for new users", "SUS score ≥ 70"],
      ["NFR-09", "Usability", "The system shall be responsive across desktop and tablet viewports", "Responsive design"],
      ["NFR-10", "Reliability", "The system shall maintain 95% uptime during operational hours", "95% uptime"],
      ["NFR-11", "Reliability", "The system shall gracefully handle errors with user-friendly messages", "Error handling with feedback"],
      ["NFR-12", "Maintainability", "The codebase shall use TypeScript for type safety throughout", "100% TypeScript"],
      ["NFR-13", "Maintainability", "The system shall follow modular architecture with clear separation of concerns", "Modular design"],
      ["NFR-14", "Scalability", "The database schema shall support migration to PostgreSQL for production", "DB-agnostic ORM (Prisma)"],
      ["NFR-15", "Accessibility", "The system shall follow WCAG 2.1 Level AA guidelines for web accessibility", "WCAG 2.1 AA"],
      ["NFR-16", "Privacy", "AI interaction data shall be stored securely with access limited to authorized personnel", "Encrypted storage, RBAC"],
      ["NFR-17", "Compatibility", "The system shall function on Chrome, Firefox, Safari, and Edge browsers", "Cross-browser support"],
    ],
    [8, 15, 45, 25]
  ));
  items.push(...emptyLine(1));

  // ─── 3.6 Hardware Requirements ───
  items.push(h2("3.6 Hardware Requirements"));
  items.push(bodyPara("The hardware requirements for ShijlAI Academy are divided into development environment requirements and deployment environment requirements. The development environment encompasses the hardware needed by the development team to build, test, and maintain the platform, while the deployment environment encompasses the server infrastructure needed to host and serve the platform to end users."));

  items.push(tableCaption("Table 3.5: Hardware Requirements"));
  items.push(threeLineTable(
    ["Component", "Development Environment", "Deployment Environment"],
    [
      ["Processor", "Intel Core i5 or equivalent (8th Gen+)", "Intel Xeon or equivalent (4+ cores)"],
      ["RAM", "8 GB minimum (16 GB recommended)", "16 GB minimum (32 GB recommended)"],
      ["Storage", "256 GB SSD", "256 GB SSD (expandable)"],
      ["Network", "Broadband internet connection", "Dedicated server with 100 Mbps+ bandwidth"],
      ["Display", "1920x1080 resolution minimum", "N/A (server-side)"],
      ["GPU", "Not required (AI via SDK)", "Not required (AI via SDK)"],
    ],
    [20, 40, 40]
  ));
  items.push(...emptyLine(1));

  items.push(bodyPara("The hardware requirements are modest compared to many enterprise software systems, primarily because ShijlAI Academy leverages the z-ai-web-dev-sdk for AI capabilities rather than hosting and running AI models locally. This architectural decision eliminates the need for GPU-equipped servers or specialized AI hardware, significantly reducing the deployment cost and complexity. The SQLite database engine is lightweight and performs well within the storage and memory constraints specified above, though production deployments with high concurrent user loads would benefit from migration to PostgreSQL with appropriately scaled hardware resources."));

  // ─── 3.7 Software Requirements ───
  items.push(h2("3.7 Software Requirements"));
  items.push(bodyPara("The software requirements for ShijlAI Academy encompass the development tools, runtime environments, libraries, and frameworks needed to build, deploy, and operate the platform. The software stack has been carefully selected to leverage modern, well-supported technologies that provide robust functionality, developer productivity, and long-term maintainability."));

  items.push(tableCaption("Table 3.6: Software Requirements"));
  items.push(threeLineTable(
    ["Category", "Technology", "Version", "Purpose"],
    [
      ["Framework", "Next.js", "16", "Full-stack React framework with SSR/SSG"],
      ["UI Library", "React", "19", "Component-based user interface"],
      ["Language", "TypeScript", "5", "Type-safe JavaScript superset"],
      ["ORM", "Prisma", "Latest", "Type-safe database access and migration"],
      ["Database", "SQLite", "3", "Lightweight relational database"],
      ["AI SDK", "z-ai-web-dev-sdk", "Latest", "LLM and VLM AI capabilities"],
      ["Styling", "Tailwind CSS", "4", "Utility-first CSS framework"],
      ["UI Components", "shadcn/ui", "Latest", "Pre-built accessible UI components"],
      ["Icons", "Lucide React", "Latest", "Consistent icon library"],
      ["State Management", "Zustand", "Latest", "Client-side state management"],
      ["Server State", "TanStack Query", "Latest", "Server state management and caching"],
      ["Authentication", "NextAuth.js", "v4", "Authentication framework"],
      ["Package Manager", "Bun", "Latest", "Fast JavaScript runtime and package manager"],
      ["Version Control", "Git", "2.x", "Source code version control"],
      ["IDE", "VS Code", "Latest", "Integrated development environment"],
      ["OS", "Windows/Linux/macOS", "Any", "Development and deployment OS"],
    ],
    [15, 20, 12, 40]
  ));
  items.push(...emptyLine(1));

  // ─── 3.8 Risk Analysis ───
  items.push(h2("3.8 Risk Analysis"));
  items.push(bodyPara("Risk analysis is the systematic process of identifying, assessing, and developing mitigation strategies for potential threats to the successful completion of the project. A thorough risk analysis enables proactive management of uncertainties and reduces the likelihood and impact of adverse events. The following risk assessment identifies the key risks associated with the development of ShijlAI Academy and proposes mitigation strategies for each."));
  items.push(bodyPara("Each risk is evaluated on two dimensions: the probability of occurrence (rated as Low, Medium, or High) and the potential impact on the project (rated as Low, Medium, or High). The overall risk level is determined by the combination of probability and impact, with risks classified as Critical (High probability + High impact), Major (High probability + Medium impact or Medium probability + High impact), Moderate (Medium probability + Medium impact), or Minor (Low probability + any impact or any probability + Low impact)."));

  items.push(tableCaption("Table 3.7: Risk Assessment Matrix"));
  items.push(threeLineTable(
    ["Risk ID", "Risk Description", "Probability", "Impact", "Level", "Mitigation Strategy"],
    [
      ["R-01", "AI API service unavailability or rate limiting", "Medium", "High", "Major", "Implement caching, fallback to rule-based responses, request queuing"],
      ["R-02", "Scope creep leading to project delays", "High", "Medium", "Major", "Strict sprint planning, feature prioritization, scope freeze periods"],
      ["R-03", "Database performance issues with large datasets", "Low", "Medium", "Minor", "Query optimization, indexing strategy, migration plan to PostgreSQL"],
      ["R-04", "Security vulnerabilities in authentication system", "Low", "High", "Major", "Security audits, penetration testing, OWASP guidelines compliance"],
      ["R-05", "AI generating inappropriate or inaccurate content", "Medium", "High", "Major", "Content filtering, human review mechanisms, prompt engineering"],
      ["R-06", "Team member unavailability due to personal reasons", "Medium", "Medium", "Moderate", "Knowledge sharing, documentation, cross-training on modules"],
      ["R-07", "Technology stack version incompatibilities", "Low", "Medium", "Minor", "Lock dependency versions, regular compatibility testing"],
      ["R-08", "Insufficient test coverage for AI modules", "Medium", "Medium", "Moderate", "Dedicated testing sprints, automated test suites, edge case testing"],
      ["R-09", "User adoption resistance due to AI features", "Low", "Medium", "Minor", "User training, progressive feature introduction, feedback incorporation"],
      ["R-10", "Data loss or corruption during development", "Low", "High", "Major", "Regular backups, version control, database migration scripts"],
    ],
    [7, 30, 10, 10, 10, 28]
  ));
  items.push(...emptyLine(1));

  // ─── 3.9 Constraints and Assumptions ───
  items.push(h2("3.9 Constraints and Assumptions"));
  items.push(h3("3.9.1 Constraints"));
  items.push(bodyPara("The development of ShijlAI Academy is subject to several constraints that bound the scope and approach of the project. These constraints must be acknowledged and accommodated in the system design and implementation:", { indent: { firstLine: 0 } }));
  items.push(bulletPara("Time Constraint: The project must be completed within the academic semester timeline, limiting the total development duration to approximately six months including requirements analysis, design, implementation, testing, and documentation."));
  items.push(bulletPara("Resource Constraint: The development team consists of two undergraduate students, limiting the available development capacity and necessitating prioritization of features based on their contribution to the research objectives."));
  items.push(bulletPara("Budget Constraint: The project has no dedicated budget, requiring the use of free and open-source technologies and limiting the scale of AI API usage for development and testing."));
  items.push(bulletPara("Database Constraint: The use of SQLite limits the platform's scalability for concurrent write operations and large-scale deployment, though this is acceptable for the demonstration and evaluation purposes of this academic project."));
  items.push(bulletPara("AI Dependency Constraint: The platform's AI capabilities are dependent on the availability and performance of the z-ai-web-dev-sdk and the underlying LLM services, introducing an external dependency that cannot be fully controlled."));
  items.push(bulletPara("Language Constraint: The platform primarily supports English language content and interfaces, with limited Urdu language support, reflecting the linguistic context of the University of Malakand."));

  items.push(h3("3.9.2 Assumptions"));
  items.push(bodyPara("The requirements and design of ShijlAI Academy are based on the following assumptions, which, if invalidated, may require adjustments to the system specification:", { indent: { firstLine: 0 } }));
  items.push(bulletPara("Users have access to a modern web browser (Chrome, Firefox, Safari, or Edge) and a stable internet connection."));
  items.push(bulletPara("Users have basic computer literacy skills sufficient to navigate a web application and interact with chat-based interfaces."));
  items.push(bulletPara("The z-ai-web-dev-sdk and its underlying LLM services will remain available and performant throughout the development and evaluation period."));
  items.push(bulletPara("The educational content and course structures used for testing and evaluation are representative of the types of content that would be deployed in a production environment."));
  items.push(bulletPara("The University of Malakand's institutional policies permit the use of AI-powered educational tools and the collection of learning analytics data with appropriate user consent."));
  items.push(bulletPara("The SQLite database is sufficient for demonstrating and evaluating the platform's functionality, with production deployment requiring migration to a more robust database system."));
  items.push(bulletPara("The AI-generated content and recommendations are accurate and appropriate for educational purposes to a degree that is useful for demonstration and evaluation, acknowledging that no AI system is perfect."));

  // ─── 3.10 Chapter Summary ───
  items.push(h2("3.10 Chapter Summary"));
  items.push(bodyPara("This chapter has presented a comprehensive requirements analysis for ShijlAI Academy, establishing the detailed specification upon which the system design and implementation will be based. The stakeholder analysis identified three primary user categories—Students, Instructors, and Administrators—each with distinct needs, expectations, and interaction patterns with the system. The feasibility study confirmed that the project is viable across technical, economic, operational, and schedule dimensions, providing confidence that the proposed system can be successfully developed within the available resources and constraints."));
  items.push(bodyPara("The functional requirements were specified as 32 uniquely identified requirements (FR-01 through FR-32), covering the full range of system capabilities from user authentication and course management through AI-powered features including Ask ShijlAI (six modes), Learning Companion, Mock Interviews, Instructor Copilot, Admin Copilot, Topic Mastery, Skill Graph, and Adaptive Learning Paths. Each requirement was described with its priority level, enabling informed prioritization during the iterative development process."));
  items.push(bodyPara("The non-functional requirements were specified as 17 requirements (NFR-01 through NFR-17) addressing performance, security, usability, reliability, maintainability, scalability, accessibility, privacy, and compatibility quality attributes. These requirements establish the quality standards that the system must meet and provide measurable criteria for evaluation. The hardware and software requirements documented the technical infrastructure needed for both development and deployment environments, with particular emphasis on the modest hardware requirements enabled by the use of the z-ai-web-dev-sdk for AI capabilities."));
  items.push(bodyPara("The risk analysis identified ten potential risks ranging from Critical to Minor levels, with specific mitigation strategies proposed for each. The constraints and assumptions section delineated the boundaries within which the project operates and the conditions upon which the requirements are predicated. Together, these elements provide a comprehensive, well-structured requirements specification that serves as the foundation for the system design and implementation activities documented in subsequent chapters. The next chapter presents the detailed system design of ShijlAI Academy, translating these requirements into architectural decisions, database schemas, process models, and interface designs."));

  items.push(pageBreak());
  return items;
}

// =====================================================================
//  MAIN EXPORT
// =====================================================================
function generatePart1() {
  return [
    ...titlePage(),
    ...certificatePage(),
    ...declarationPage(),
    ...acknowledgementPage(),
    ...abstractPage(),
    ...tocPage(),
    ...acronymsPage(),
    ...chapter1(),
    ...chapter2(),
    ...chapter3(),
  ];
}

module.exports = { generatePart1 };
