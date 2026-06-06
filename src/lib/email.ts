// ─── Email Service ──────────────────────────────────────────────────────────
// Enterprise email service for instructor application workflow
// Uses z-ai-web-dev-sdk LLM for email content generation if needed,
// and provides structured templates for all application lifecycle emails.

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
  from?: string
}

// Email log entry for tracking
interface EmailLogEntry {
  to: string
  subject: string
  status: 'sent' | 'failed' | 'queued'
  sentAt: string
  error?: string
}

// In-memory email log (production would use a proper email provider)
const emailLog: EmailLogEntry[] = []

/**
 * Send an email. In production, this would integrate with:
 * - Resend (recommended for Next.js)
 * - SendGrid
 * - AWS SES
 * - Nodemailer with SMTP
 * 
 * For now, we log the email and simulate sending.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  try {
    // In production, replace with actual email provider:
    // const result = await resend.emails.send({ from: 'ShijlAI Academy <noreply@shijlai.com>', ...payload })
    
    // Log the email for debugging/audit
    console.log(`📧 Email sent to: ${payload.to} | Subject: ${payload.subject}`)
    
    emailLog.push({
      to: payload.to,
      subject: payload.subject,
      status: 'sent',
      sentAt: new Date().toISOString(),
    })

    return { success: true, messageId }
  } catch (error) {
    console.error('Email send error:', error)
    emailLog.push({
      to: payload.to,
      subject: payload.subject,
      status: 'failed',
      sentAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return { success: false, messageId }
  }
}

/**
 * Get email log for debugging
 */
export function getEmailLog(): EmailLogEntry[] {
  return [...emailLog]
}

// ─── Email Templates ────────────────────────────────────────────────────────

function baseTemplate(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShijlAI Academy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #0d9488); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .content h2 { color: #1e293b; font-size: 18px; margin: 0 0 16px; }
    .content p { color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .content .highlight { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .content .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .content .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .footer { background: #f8fafc; padding: 20px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
    .footer a { color: #10b981; }
    .steps { margin: 20px 0; }
    .step { display: flex; align-items: flex-start; margin: 12px 0; }
    .step-num { background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; margin-right: 12px; flex-shrink: 0; }
    .step-text { padding-top: 4px; }
    .step-text strong { color: #1e293b; }
    .step-text span { color: #64748b; font-size: 13px; }
    .code-box { background: #f1f5f9; border: 1px dashed #cbd5e1; padding: 12px 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 16px; text-align: center; letter-spacing: 2px; color: #1e293b; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 ShijlAI Academy</h1>
      <p>${previewText}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>ShijlAI Academy — The World's AI-Powered Learning Platform</p>
      <p><a href="https://shijlai.com">shijlai.com</a> | <a href="mailto:support@shijlai.com">support@shijlai.com</a></p>
      <p style="margin-top: 12px; color: #cbd5e1;">This email was sent regarding your instructor application. If you did not apply, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`
}

function baseText(content: string): string {
  return `SHIJLAI ACADEMY\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\nShijlAI Academy — The World's AI-Powered Learning Platform\nshijlai.com | support@shijlai.com`
}

// 1. Application Confirmation Email
export function applicationConfirmationEmail(data: {
  fullName: string
  email: string
  applicationCode: string
}) {
  const html = `
    <h2>Application Received, ${data.fullName}! 🎉</h2>
    <p>Thank you for applying to become an instructor on ShijlAI Academy. We've received your application and our team will review it carefully.</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>Your Application Tracking Code:</strong></p>
      <div class="code-box">${data.applicationCode}</div>
      <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Save this code to track your application status at any time.</p>
    </div>
    
    <h2>What Happens Next?</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Application Review</strong><br><span>Our team reviews your application within 3-5 business days.</span></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Interview Scheduling</strong><br><span>If shortlisted, we'll schedule a brief interview to discuss your teaching approach.</span></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Decision & Onboarding</strong><br><span>You'll receive our decision and, if approved, your instructor account credentials.</span></div>
      </div>
    </div>
    
    <p>We'll keep you updated via email at every stage. You can also check your status using the tracking code above.</p>
    <p>Expected timeline: <strong>5-7 business days</strong></p>
  `
  const text = `Application Received, ${data.fullName}!

Thank you for applying to become an instructor on ShijlAI Academy.

Your Application Tracking Code: ${data.applicationCode}

What Happens Next:
1. Application Review — Our team reviews your application within 3-5 business days.
2. Interview Scheduling — If shortlisted, we'll schedule a brief interview.
3. Decision & Onboarding — You'll receive our decision and credentials if approved.

Expected timeline: 5-7 business days.`

  return {
    to: data.email,
    subject: `We've Received Your Instructor Application — ${data.applicationCode}`,
    html: baseTemplate(html, 'Your instructor application has been received'),
    text: baseText(text),
  }
}

// 2. Application Under Review Email
export function applicationUnderReviewEmail(data: {
  fullName: string
  email: string
  applicationCode: string
}) {
  const html = `
    <h2>Good News, ${data.fullName}! 📋</h2>
    <p>Your instructor application is now being reviewed by our team. This is an important step in the process.</p>
    
    <div class="info-box">
      <p style="margin:0"><strong>Application Status:</strong> Under Review</p>
      <p style="margin:4px 0 0;font-size:13px;">Our team is carefully evaluating your expertise, experience, and teaching approach.</p>
    </div>
    
    <p>During the review, we may:</p>
    <ul style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;">
      <li>Verify your LinkedIn profile and portfolio</li>
      <li>Assess your subject matter expertise</li>
      <li>Evaluate your teaching approach and motivation</li>
      <li>Request additional information if needed</li>
    </ul>
    
    <p>We'll notify you of the next steps within <strong>2-3 business days</strong>.</p>
  `
  const text = `Your Application is Under Review, ${data.fullName}!

Application Status: Under Review
Tracking Code: ${data.applicationCode}

Our team is carefully evaluating your expertise, experience, and teaching approach. We may verify your LinkedIn profile and portfolio, assess your subject matter expertise, and evaluate your teaching approach.

We'll notify you of the next steps within 2-3 business days.`

  return {
    to: data.email,
    subject: `Your Application is Under Review — ${data.applicationCode}`,
    html: baseTemplate(html, 'Your application is being reviewed'),
    text: baseText(text),
  }
}

// 3. More Info Requested Email
export function moreInfoRequestedEmail(data: {
  fullName: string
  email: string
  applicationCode: string
  message: string
}) {
  const html = `
    <h2>${data.fullName}, We Need a Bit More Information 📝</h2>
    <p>Our team has reviewed your application and we'd like some additional details to help us make our decision.</p>
    
    <div class="warning">
      <p style="margin:0"><strong>Information Requested:</strong></p>
      <p style="margin:8px 0 0">${data.message}</p>
    </div>
    
    <p>Please respond to this email or log in to your applicant portal with your tracking code to provide the requested information.</p>
    
    <div class="code-box">${data.applicationCode}</div>
    
    <p style="font-size:13px;color:#64748b;">Please provide the requested information within 7 days so we can continue processing your application.</p>
  `
  const text = `We Need More Information, ${data.fullName}

Information Requested: ${data.message}

Please respond with the requested information within 7 days. Use your tracking code: ${data.applicationCode}`

  return {
    to: data.email,
    subject: `Additional Information Needed — ${data.applicationCode}`,
    html: baseTemplate(html, 'Additional information needed for your application'),
    text: baseText(text),
  }
}

// 4. Interview Scheduled Email
export function interviewScheduledEmail(data: {
  fullName: string
  email: string
  applicationCode: string
  interviewDate: string
  interviewTime: string
  duration: number
  meetingUrl?: string
  interviewerName: string
  interviewType: string
}) {
  const meetingLinkSection = data.meetingUrl
    ? `<div style="text-align:center;margin:20px 0;"><a href="${data.meetingUrl}" class="btn">Join Interview</a></div>`
    : ''

  const html = `
    <h2>Interview Scheduled, ${data.fullName}! 📅</h2>
    <p>Great news! Your application has been shortlisted and we'd like to schedule an interview with you.</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>Interview Details:</strong></p>
      <table style="margin:12px 0;color:#475569;font-size:15px;">
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Date:</td><td>${data.interviewDate}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Time:</td><td>${data.interviewTime} (PKT)</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Duration:</td><td>${data.duration} minutes</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Format:</td><td>${data.interviewType === 'video_call' ? 'Video Call' : data.interviewType === 'phone' ? 'Phone Call' : 'In-Person'}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">With:</td><td>${data.interviewerName}</td></tr>
      </table>
    </div>
    
    ${meetingLinkSection}
    
    <h2>How to Prepare</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Review Your Application</strong><br><span>Be ready to discuss your expertise, experience, and teaching approach.</span></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Prepare a Sample Topic</strong><br><span>Think about how you'd teach a 5-minute concept from your field.</span></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Test Your Setup</strong><br><span>Ensure your camera, microphone, and internet connection work well.</span></div>
      </div>
    </div>
    
    <p style="font-size:13px;color:#64748b;">If you need to reschedule, please contact us at least 24 hours before the interview.</p>
  `
  const text = `Interview Scheduled, ${data.fullName}!

Date: ${data.interviewDate}
Time: ${data.interviewTime} (PKT)
Duration: ${data.duration} minutes
Format: ${data.interviewType === 'video_call' ? 'Video Call' : data.interviewType === 'phone' ? 'Phone Call' : 'In-Person'}
With: ${data.interviewerName}
${data.meetingUrl ? `Meeting Link: ${data.meetingUrl}` : ''}

Please prepare to discuss your expertise and teaching approach. Contact us 24h in advance to reschedule.`

  return {
    to: data.email,
    subject: `Interview Scheduled: ${data.interviewDate} at ${data.interviewTime} — ${data.applicationCode}`,
    html: baseTemplate(html, 'Your interview has been scheduled'),
    text: baseText(text),
  }
}

// 5. Application Approved Email
export function applicationApprovedEmail(data: {
  fullName: string
  email: string
  applicationCode: string
  credentials?: { email: string; password: string } | null
}) {
  const credentialsSection = data.credentials
    ? `<div class="highlight">
      <p style="margin:0"><strong>Your Instructor Account Credentials:</strong></p>
      <table style="margin:12px 0;color:#475569;font-size:15px;">
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Email:</td><td>${data.credentials.email}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Password:</td><td style="font-family:monospace;font-weight:700;">${data.credentials.password}</td></tr>
      </table>
      <p style="margin:8px 0 0;font-size:13px;color:#dc2626;"><strong>⚠️ Please change your password immediately after logging in.</strong></p>
    </div>`
    : `<div class="highlight">
      <p style="margin:0">Your existing account has been upgraded to instructor status. Log in with your current credentials to get started.</p>
    </div>`

  const html = `
    <h2>Welcome to the Team, ${data.fullName}! 🎉</h2>
    <p>Congratulations! Your instructor application has been <strong>approved</strong>. We're thrilled to have you on ShijlAI Academy.</p>
    
    ${credentialsSection}
    
    <h2>Getting Started</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Complete Your Profile</strong><br><span>Add a professional photo, bio, and your teaching expertise.</span></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Create Your First Course</strong><br><span>Use our AI-powered tools to build engaging content.</span></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Set Up Payout Method</strong><br><span>Add your bank account or mobile wallet for revenue payments.</span></div>
      </div>
    </div>
    
    <div style="text-align:center;margin:20px 0;">
      <a href="https://shijlai.com" class="btn">Go to Instructor Dashboard</a>
    </div>
  `
  const text = `Welcome, ${data.fullName}!

Your instructor application has been APPROVED! 🎉

${data.credentials
    ? `Your Account Credentials:\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}\n\n⚠️ Change your password immediately after logging in.`
    : 'Your existing account has been upgraded to instructor status.'}

Getting Started:
1. Complete Your Profile — Add a photo, bio, and expertise.
2. Create Your First Course — Use our AI-powered tools.
3. Set Up Payout Method — Add bank or mobile wallet for payments.`

  return {
    to: data.email,
    subject: `Welcome to ShijlAI Academy! Your Instructor Account is Ready 🎉`,
    html: baseTemplate(html, 'Your instructor application has been approved'),
    text: baseText(text),
  }
}

// 6. Application Rejected Email
export function applicationRejectedEmail(data: {
  fullName: string
  email: string
  applicationCode: string
  reason: string
  feedback?: string
  canReapply: boolean
  reapplyAfter?: string
}) {
  const feedbackSection = data.feedback
    ? `<div class="info-box">
      <p style="margin:0"><strong>Feedback:</strong></p>
      <p style="margin:8px 0 0">${data.feedback}</p>
    </div>`
    : ''

  const reapplySection = data.canReapply
    ? `<div class="highlight">
      <p style="margin:0"><strong>You Can Reapply!</strong></p>
      <p style="margin:8px 0 0">We encourage you to address the feedback above and reapply${data.reapplyAfter ? ` after ${data.reapplyAfter}` : ''}. We'd love to see you try again.</p>
    </div>`
    : ''

  const html = `
    <h2>${data.fullName}, Update on Your Application</h2>
    <p>Thank you for your interest in becoming an instructor on ShijlAI Academy. After careful review, we're unable to approve your application at this time.</p>
    
    <div class="warning">
      <p style="margin:0"><strong>Reason:</strong></p>
      <p style="margin:8px 0 0">${data.reason}</p>
    </div>
    
    ${feedbackSection}
    ${reapplySection}
    
    <p>We appreciate your interest in teaching on ShijlAI and wish you the best. If you have questions, please don't hesitate to reach out.</p>
  `
  const text = `Update on Your Application, ${data.fullName}

After careful review, we're unable to approve your application at this time.

Reason: ${data.reason}
${data.feedback ? `\nFeedback: ${data.feedback}` : ''}
${data.canReapply ? `\nYou can reapply${data.reapplyAfter ? ` after ${data.reapplyAfter}` : ''}. We'd love to see you try again.` : ''}

We appreciate your interest and wish you the best.`

  return {
    to: data.email,
    subject: `Update on Your Instructor Application — ${data.applicationCode}`,
    html: baseTemplate(html, 'Update on your instructor application'),
    text: baseText(text),
  }
}

// 7. Interview Reminder Email
export function interviewReminderEmail(data: {
  fullName: string
  email: string
  interviewDate: string
  interviewTime: string
  meetingUrl?: string
}) {
  const html = `
    <h2>Reminder: Your Interview Tomorrow, ${data.fullName}! ⏰</h2>
    <p>This is a friendly reminder that your instructor interview is scheduled for tomorrow.</p>
    
    <div class="highlight">
      <table style="margin:8px 0;color:#475569;font-size:15px;">
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Date:</td><td>${data.interviewDate}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Time:</td><td>${data.interviewTime} (PKT)</td></tr>
      </table>
    </div>
    
    ${data.meetingUrl ? `<div style="text-align:center;margin:20px 0;"><a href="${data.meetingUrl}" class="btn">Join Interview</a></div>` : ''}
    
    <p style="font-size:13px;color:#64748b;">Make sure your camera, microphone, and internet are working. Good luck! 🍀</p>
  `
  const text = `Interview Reminder, ${data.fullName}!

Your interview is tomorrow:
Date: ${data.interviewDate}
Time: ${data.interviewTime} (PKT)
${data.meetingUrl ? `Link: ${data.meetingUrl}` : ''}

Make sure your setup is working. Good luck!`

  return {
    to: data.email,
    subject: `Reminder: Your Instructor Interview Tomorrow ⏰`,
    html: baseTemplate(html, 'Your interview is tomorrow'),
    text: baseText(text),
  }
}

// 8. New Application Admin Notification
export function newApplicationAdminEmail(data: {
  adminEmail: string
  applicantName: string
  applicantEmail: string
  expertise: string
  experience: string
  applicationCode: string
}) {
  const html = `
    <h2>New Instructor Application 📋</h2>
    <p>A new instructor application has been submitted and requires your review.</p>
    
    <div class="highlight">
      <table style="margin:8px 0;color:#475569;font-size:15px;">
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Applicant:</td><td>${data.applicantName}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Email:</td><td>${data.applicantEmail}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Expertise:</td><td>${data.expertise}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Experience:</td><td>${data.experience}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:600;">Tracking Code:</td><td>${data.applicationCode}</td></tr>
      </table>
    </div>
    
    <div style="text-align:center;margin:20px 0;">
      <a href="https://shijlai.com/admin/applications" class="btn">Review Application</a>
    </div>
  `
  const text = `New Instructor Application

Applicant: ${data.applicantName}
Email: ${data.applicantEmail}
Expertise: ${data.expertise}
Experience: ${data.experience}
Code: ${data.applicationCode}

Review at: https://shijlai.com/admin/applications`

  return {
    to: data.adminEmail,
    subject: `New Instructor Application: ${data.applicantName}`,
    html: baseTemplate(html, 'New application requires review'),
    text: baseText(text),
  }
}

// 9. Onboarding Complete Email
export function onboardingCompleteEmail(data: {
  fullName: string
  email: string
}) {
  const html = `
    <h2>You're All Set, ${data.fullName}! 🚀</h2>
    <p>Congratulations on completing your instructor onboarding! You're now ready to create amazing courses on ShijlAI Academy.</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>Quick Tips for Success:</strong></p>
      <ul style="margin:8px 0 0 0;padding-left:20px;color:#475569;">
        <li>Create a compelling course title and description</li>
        <li>Use short, engaging video lessons (5-15 minutes)</li>
        <li>Add quizzes and assignments to boost engagement</li>
        <li>Respond to student questions within 24 hours</li>
        <li>Promote your course on social media</li>
      </ul>
    </div>
    
    <div style="text-align:center;margin:20px 0;">
      <a href="https://shijlai.com" class="btn">Create Your First Course</a>
    </div>
  `
  const text = `You're All Set, ${data.fullName}!

Congratulations on completing your onboarding! You're now ready to create courses.

Quick Tips:
- Create compelling titles and descriptions
- Use short, engaging video lessons
- Add quizzes and assignments
- Respond to student questions promptly
- Promote your course on social media`

  return {
    to: data.email,
    subject: `You're All Set! Start Creating Your First Course 🚀`,
    html: baseTemplate(html, 'Onboarding complete — start creating'),
    text: baseText(text),
  }
}
