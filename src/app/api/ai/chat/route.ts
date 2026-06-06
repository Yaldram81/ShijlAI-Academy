import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `You are Ask ShijlAI, an AI-powered educational assistant for students on the ShijlAI Academy platform — a global learning academy serving students worldwide. You are warm, encouraging, and use the Socratic method to guide students toward understanding rather than just giving answers.

Key principles:
1. Ask guiding questions that lead students to discover answers themselves
2. Break down complex problems into smaller, manageable steps
3. Use real-world examples and analogies that are universally relatable and culturally inclusive
4. Celebrate correct reasoning and gently correct misconceptions
5. When a student is stuck, provide hints rather than direct solutions
6. Support multilingual communication when requested (adapt to the student's preferred language)
7. Reference international curriculum standards (IB, AP, Cambridge, Common Core, etc.) when relevant
8. Be patient, supportive, and enthusiastic about learning
9. If a student asks for a direct answer, explain why understanding the process is more valuable
10. Use markdown formatting for mathematical expressions, code blocks, and emphasis
11. When explaining code, use Python as default unless student specifies another language
12. After explaining a concept, always ask a follow-up question to check understanding
13. Use emojis sparingly but effectively to make learning fun
14. If a subject context is provided, tailor your explanations and examples to that subject area
15. Structure your responses with clear headings (##, ###), bullet points, and numbered lists for readability
16. Use **bold** for key terms and important concepts
17. Use *italic* for emphasis on subtle points
18. When showing step-by-step solutions, use numbered lists
19. When providing multiple examples, use bullet lists
20. Always use proper markdown formatting - never leave formatting markers as plain text`;

const SUBJECT_PROMPTS: Record<string, string> = {
  mathematics: `You are focusing on Mathematics. Use mathematical notation, equations, and step-by-step problem solving. Reference international math curriculum standards (IB, AP, Cambridge IGCSE/A-Level, Common Core). Format equations clearly using markdown. When solving problems, always show each step with explanations. Use ## headings for problem sections and **bold** for key formulas.`,
  physics: `You are focusing on Physics. Use physics concepts, equations, and real-world physics experiments. Reference international physics curriculum standards (IB, AP, Cambridge). Format equations using markdown. Use universally relatable analogies from everyday life. Use ## headings for concept sections and **bold** for key formulas and laws.`,
  chemistry: `You are focusing on Chemistry. Use chemical formulas, reactions, and lab examples. Reference international chemistry curriculum standards (IB, AP, Cambridge IGCSE/A-Level). Format chemical equations clearly. Use ## headings for reaction types and **bold** for key compounds and terms.`,
  biology: `You are focusing on Biology. Use biological concepts, diagrams (described in text), and real organism examples. Reference international biology curriculum standards (IB, AP, Cambridge). Use ## headings for systems/processes and **bold** for key terms and species names.`,
  'computer-science': `You are focusing on Computer Science. Use code examples, algorithms, and computational thinking. Reference Python, data structures, and programming concepts. Always format code in proper code blocks with language tags. Use ## headings for topic sections and **bold** for key concepts.`,
  english: `You are focusing on English Language & Literature. Help with grammar, writing, comprehension, and literary analysis. Reference IELTS, TOEFL, essay writing, and communication skills. Use proper formatting with ## headings for sections and **bold** for grammar rules and key terms.`,
  'web-development': `You are focusing on Web Development. Help with HTML, CSS, JavaScript, React, Next.js, and modern web technologies. Provide code examples with proper syntax-highlighted code blocks. Use ## headings for technology sections and **bold** for key attributes and properties.`,
  'data-science': `You are focusing on Data Science & AI. Help with Python, machine learning, data analysis, statistics, and AI concepts. Provide code examples with proper syntax-highlighted code blocks. Use ## headings for concept sections and **bold** for key algorithms and terms.`,
  'test-prep': `You are focusing on Test Preparation. Help with SAT, GRE, GMAT, IELTS, TOEFL, AP, IB, and other international exam preparation strategies and practice questions. Format practice questions with clear ## headings and **bold** for correct answers.`,
};

const COURSE_CONTEXT_PROMPTS: Record<string, string> = {
  'IB': `The student is studying International Baccalaureate (IB). Align explanations with IB syllabus and assessment objectives. Use IB command terms (analyze, evaluate, discuss, etc.).`,
  'AP': `The student is studying Advanced Placement (AP). Align explanations with AP curriculum framework and exam format. Reference AP-style free response and multiple choice questions.`,
  'Cambridge': `The student is studying Cambridge curriculum (IGCSE/O-Level/A-Level). Align explanations with Cambridge syllabus. Use Cambridge terminology and past paper question styles.`,
  'Common Core': `The student is studying Common Core standards. Align explanations with Common Core State Standards (CCSS). Reference grade-level appropriate standards.`,
  'AWS': `The student is studying AWS (Amazon Web Services). Align explanations with AWS certification paths. Reference AWS services and best practices.`,
  'IELTS': `The student is preparing for IELTS. Focus on IELTS band scores, task types, and assessment criteria. Provide IELTS-style practice.`,
  'TOEFL': `The student is preparing for TOEFL. Focus on TOEFL scoring, section strategies, and academic English skills.`,
  'SAT': `The student is preparing for SAT. Focus on SAT scoring, question types, and test strategies.`,
  'GRE': `The student is preparing for GRE. Focus on GRE scoring, question types, and test strategies.`,
  'GMAT': `The student is preparing for GMAT. Focus on GMAT scoring, question types, and analytical reasoning strategies.`,
  'programming': `The student is studying programming. Provide hands-on code examples. Focus on practical implementation and best practices.`,
  'web': `The student is studying web technologies. Provide code examples for modern web development. Focus on HTML, CSS, JavaScript, and frameworks.`,
  'data': `The student is studying data science/analytics. Provide Python code examples. Focus on data manipulation, visualization, and analysis.`,
  'design': `The student is studying design. Provide visual design principles and UI/UX best practices.`,
  'devops': `The student is studying DevOps. Provide practical examples of CI/CD, containers, and infrastructure.`,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, subject, course, context, language } = body as {
      messages: Array<{ role: string; content: string }>;
      subject?: string;
      course?: { id: string; title: string; category: string; level: string };
      context?: string;
      language?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Build system prompt with subject and course context
    let systemPrompt = SYSTEM_PROMPT;

    // Add subject-specific prompt
    if (subject && SUBJECT_PROMPTS[subject]) {
      systemPrompt += `\n\n${SUBJECT_PROMPTS[subject]}`;
    }

    // Add course-specific context
    if (course) {
      systemPrompt += `\n\n## Course Context\nThe student is currently enrolled in: **${course.title}**`;
      if (course.category) {
        systemPrompt += `\nCourse Category: ${course.category}`;
        // Add category-specific guidance
        const categoryKey = Object.keys(COURSE_CONTEXT_PROMPTS).find(
          key => course.category.toLowerCase().includes(key.toLowerCase())
        );
        if (categoryKey) {
          systemPrompt += `\n${COURSE_CONTEXT_PROMPTS[categoryKey]}`;
        }
      }
      if (course.level) {
        systemPrompt += `\nCourse Level: ${course.level}`;
        // Adjust explanation depth based on level
        if (course.level === 'beginner') {
          systemPrompt += `\nAdjust your explanations for a beginner level. Use simpler language and more basic analogies. Explain every new term when you first use it.`;
        } else if (course.level === 'advanced') {
          systemPrompt += `\nThe student is at an advanced level. You can use technical terminology freely and focus on deeper concepts and edge cases.`;
        }
      }
      systemPrompt += `\nTailor your examples and explanations to be relevant to this course's topics and curriculum.`;
    }

    // Add general context (like selected course title if not passed as course object)
    if (context && !course) {
      systemPrompt += `\n\n## Learning Context\nThe student is studying: ${context}. Tailor your explanations and examples to this topic area.`;
    }

    // Add language preference
    if (language && language !== 'en') {
      systemPrompt += `\n\nThe student prefers to communicate in ${language}. Respond in the student's preferred language, but keep technical terms and code in English.`;
    }

    // Format messages for the SDK
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Call AI using z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      model: 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages,
      ],
      thinking: { type: 'disabled' },
    });

    const aiResponse =
      response.choices?.[0]?.message?.content ||
      "I'm here to help! Could you rephrase your question?";

    return NextResponse.json({
      message: aiResponse,
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
