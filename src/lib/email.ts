// ─── Email Service ──────────────────────────────────────────────────────────
// Production email service for ShijlAI Academy
// Uses nodemailer with Gmail SMTP (app password) for real email delivery.
// Credentials are read exclusively from environment variables — never hardcoded.

import nodemailer from 'nodemailer'

// ─── Types ──────────────────────────────────────────────────────────────────

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
  from?: string
}

// ─── SMTP Transporter ────────────────────────────────────────────────────────
// Reads credentials from environment variables. Fails loudly if not configured.

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const fromName = process.env.SMTP_FROM_NAME || 'ShijlAI Academy'

  if (!host || !user || !pass) {
    // TODO(security): In production, fail hard if SMTP credentials are missing.
    // Currently we log a warning and allow the app to degrade gracefully.
    console.warn('[email] SMTP credentials not fully configured. Emails will not be sent.')
    return null
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: false, // STARTTLS on port 587
      requireTLS: true,
      auth: { user, pass },
      tls: {
        minVersion: 'TLSv1.2',
      },
    }),
    from: `"${fromName}" <${user}>`,
  }
}

/**
 * Send a transactional email via Gmail SMTP.
 * Falls back gracefully if SMTP is not configured (logs to console).
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<{ success: boolean; messageId: string }> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const smtp = createTransporter()
  if (!smtp) {
    // Degraded mode — log the email so devs can see it
    console.log(`[email:mock] To: ${payload.to} | Subject: ${payload.subject}`)
    return { success: false, messageId }
  }

  try {
    const info = await smtp.transporter.sendMail({
      from: payload.from || smtp.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })

    console.log(`[email] Sent to: ${payload.to} | Subject: ${payload.subject} | ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId || messageId }
  } catch (error) {
    // Log error details server-side only — never expose to client
    console.error('[email] Send error:', error instanceof Error ? error.message : 'Unknown error')
    return { success: false, messageId }
  }
}

// ─── Base Template ───────────────────────────────────────────────────────────

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
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .content h2 { color: #1e293b; font-size: 18px; margin: 0 0 16px; }
    .content p { color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .content .highlight { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .content .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .content .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .content .danger-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #0d9488); color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .footer { background: #f8fafc; padding: 20px 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
    .footer a { color: #10b981; }
    .steps { margin: 20px 0; }
    .step { display: flex; align-items: flex-start; margin: 12px 0; }
    .step-num { background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; margin-right: 12px; flex-shrink: 0; }
    .step-text { padding-top: 4px; }
    .step-text strong { color: #1e293b; }
    .step-text span { color: #64748b; font-size: 13px; }
    .otp-box { background: #f1f5f9; border: 2px dashed #10b981; padding: 20px 16px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 36px; text-align: center; letter-spacing: 8px; color: #0f172a; font-weight: 800; margin: 20px 0; }
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
      <p style="margin-top: 12px; color: #cbd5e1;">If you did not perform this action, please ignore this email or contact support.</p>
    </div>
  </div>
</body>
</html>`
}

function baseText(content: string): string {
  return `SHIJLAI ACADEMY\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n${content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\nShijlAI Academy — The World's AI-Powered Learning Platform\nshijlai.com | support@shijlai.com`
}

// ─── New Auth Email Templates ─────────────────────────────────────────────────

/**
 * OTP verification email sent on new account registration.
 */
export function verificationOtpEmail(data: {
  fullName: string
  email: string
  otpCode: string
}) {
  const html = `
    <h2>Welcome to ShijlAI Academy, ${data.fullName}! 🎉</h2>
    <p>Thank you for creating an account. To get started, please verify your email address using the code below.</p>
    
    <div class="otp-box">${data.otpCode}</div>
    
    <div class="highlight">
      <p style="margin:0"><strong>⏱ This code expires in 10 minutes.</strong></p>
      <p style="margin:8px 0 0;font-size:13px;color:#64748b;">If you didn't create an account, please ignore this email.</p>
    </div>
    
    <p style="font-size:13px;color:#64748b;">For security, never share this code with anyone. ShijlAI Academy will never ask for your OTP.</p>
  `
  const text = `Welcome to ShijlAI Academy, ${data.fullName}!

Your email verification code is: ${data.otpCode}

This code expires in 10 minutes. If you did not create an account, please ignore this email.`

  return {
    to: data.email,
    subject: `${data.otpCode} — Verify Your ShijlAI Academy Account`,
    html: baseTemplate(html, 'Verify your email to get started'),
    text: baseText(text),
  }
}

/**
 * OTP resend email — same as verification but with a slightly different message.
 */
export function resendOtpEmail(data: {
  fullName: string
  email: string
  otpCode: string
}) {
  const html = `
    <h2>New Verification Code, ${data.fullName} 🔑</h2>
    <p>You requested a new email verification code. Here it is:</p>
    
    <div class="otp-box">${data.otpCode}</div>
    
    <div class="highlight">
      <p style="margin:0"><strong>⏱ This code expires in 10 minutes.</strong></p>
      <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Your previous code is now invalid.</p>
    </div>
    
    <p style="font-size:13px;color:#64748b;">For security, never share this code with anyone.</p>
  `
  const text = `Your new ShijlAI Academy verification code is: ${data.otpCode}

This code expires in 10 minutes. Your previous code is now invalid.`

  return {
    to: data.email,
    subject: `${data.otpCode} — New Verification Code for ShijlAI Academy`,
    html: baseTemplate(html, 'Your new verification code'),
    text: baseText(text),
  }
}

/**
 * Welcome email sent after successful account verification.
 */
export function welcomeEmail(data: {
  fullName: string
  email: string
  role: string
}) {
  const roleMessage = data.role === 'instructor'
    ? 'You can now create and publish courses to thousands of learners.'
    : 'Start exploring courses and begin your AI-powered learning journey.'

  const html = `
    <h2>Your Account is Verified! 🚀</h2>
    <p>Hi ${data.fullName}, your ShijlAI Academy account has been successfully verified. ${roleMessage}</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>What you can do now:</strong></p>
      <ul style="margin:8px 0 0;padding-left:20px;color:#475569;">
        ${data.role === 'instructor'
          ? '<li>Create AI-assisted courses with our Copilot</li><li>Manage students and track their progress</li><li>Earn revenue from your courses</li>'
          : '<li>Enroll in hundreds of courses</li><li>Track your progress and earn badges</li><li>Chat with ShijlAI, your AI tutor</li>'
        }
      </ul>
    </div>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Go to Dashboard →</a>
    </div>
  `
  const text = `Welcome to ShijlAI Academy, ${data.fullName}!

Your account has been verified. ${roleMessage}

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`

  return {
    to: data.email,
    subject: `Welcome to ShijlAI Academy — Your Account is Ready! 🎓`,
    html: baseTemplate(html, 'Your account has been verified'),
    text: baseText(text),
  }
}

/**
 * Password reset link email.
 */
export function resetPasswordEmail(data: {
  fullName: string
  email: string
  resetLink: string
}) {
  const html = `
    <h2>Reset Your Password 🔒</h2>
    <p>Hi ${data.fullName}, we received a request to reset the password for your ShijlAI Academy account.</p>
    
    <div style="text-align:center;margin:28px 0;">
      <a href="${data.resetLink}" class="btn">Reset My Password →</a>
    </div>
    
    <div class="warning">
      <p style="margin:0"><strong>⏱ This link expires in 30 minutes.</strong></p>
      <p style="margin:8px 0 0;font-size:13px;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
    </div>
    
    <p style="font-size:13px;color:#64748b;margin-top:20px;">If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size:12px;color:#94a3b8;word-break:break-all;">${data.resetLink}</p>
  `
  const text = `Reset Your ShijlAI Academy Password

Hi ${data.fullName},

Click this link to reset your password (expires in 30 minutes):
${data.resetLink}

If you did not request a password reset, please ignore this email.`

  return {
    to: data.email,
    subject: `Reset Your ShijlAI Academy Password`,
    html: baseTemplate(html, 'Reset your password'),
    text: baseText(text),
  }
}

/**
 * Confirmation email sent after a successful password change.
 */
export function passwordChangedEmail(data: {
  fullName: string
  email: string
}) {
  const html = `
    <h2>Password Changed Successfully ✅</h2>
    <p>Hi ${data.fullName}, your ShijlAI Academy account password has been successfully changed.</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>Time of change:</strong> ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} (PKT)</p>
    </div>
    
    <div class="danger-box">
      <p style="margin:0"><strong>⚠️ Wasn't you?</strong></p>
      <p style="margin:8px 0 0;">If you did not make this change, your account may have been compromised. Contact us immediately at <a href="mailto:support@shijlai.com">support@shijlai.com</a>.</p>
    </div>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Go to Dashboard →</a>
    </div>
  `
  const text = `Your ShijlAI Academy password has been changed.

Time: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} (PKT)

If you did not make this change, contact support immediately at support@shijlai.com.`

  return {
    to: data.email,
    subject: `Your Password Has Been Changed — ShijlAI Academy`,
    html: baseTemplate(html, 'Your password was successfully changed'),
    text: baseText(text),
  }
}

/**
 * Enrollment confirmation email sent when a student enrolls in a course.
 */
export function enrollmentConfirmationEmail(data: {
  fullName: string
  email: string
  courseTitle: string
  courseCategory: string
  instructorName: string
}) {
  const html = `
    <h2>You're Enrolled! 🎉</h2>
    <p>Hi ${data.fullName}, congratulations on enrolling in your new course!</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>${data.courseTitle}</strong></p>
      <p style="margin:6px 0 0;font-size:14px;color:#475569;">Category: ${data.courseCategory} • Instructor: ${data.instructorName}</p>
    </div>
    
    <h2>Tips to Get Started</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Watch the first lesson</strong><br><span>Start with the introduction and get familiar with the course structure.</span></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Set a learning goal</strong><br><span>Define how many hours per week you want to dedicate to this course.</span></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Ask ShijlAI for help</strong><br><span>Use the AI tutor whenever you have questions about the material.</span></div>
      </div>
    </div>
    
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Start Learning →</a>
    </div>
  `
  const text = `You're Enrolled — ${data.courseTitle}!

Hi ${data.fullName}, you have successfully enrolled in "${data.courseTitle}" by ${data.instructorName}.

Start learning: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`

  return {
    to: data.email,
    subject: `You're Enrolled: ${data.courseTitle} — ShijlAI Academy`,
    html: baseTemplate(html, `You're enrolled in ${data.courseTitle}`),
    text: baseText(text),
  }
}

// ─── Existing Instructor Application Templates ────────────────────────────────

// 1. Application Confirmation Email
export function applicationConfirmationEmail(data: {
  fullName: string
  email: string
  applicationCode: string
}) {
  const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?view=application-status&code=${data.applicationCode}`
  const html = `
    <h2>Application Received, ${data.fullName}! 🎉</h2>
    <p>Thank you for applying to become an instructor on ShijlAI Academy. We've received your application and our team will review it carefully.</p>
    
    <div class="highlight">
      <p style="margin:0"><strong>Your Application Tracking Code:</strong></p>
      <div class="code-box">${data.applicationCode}</div>
      <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Save this code to track your application status at any time.</p>
      <div style="text-align:center;margin:16px 0;">
        <a href="${trackingLink}" class="btn">Track Application Status →</a>
      </div>
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
        <div class="step-text"><strong>Decision &amp; Onboarding</strong><br><span>You'll receive our decision and, if approved, your instructor account credentials.</span></div>
      </div>
    </div>
    
    <p>We'll keep you updated via email at every stage. You can also check your status using the tracking code above.</p>
    <p>Expected timeline: <strong>5-7 business days</strong></p>
  `
  const text = `Application Received, ${data.fullName}!

Thank you for applying to become an instructor on ShijlAI Academy.

Your Application Tracking Code: ${data.applicationCode}
Track your application status here: ${trackingLink}

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

Our team is carefully evaluating your expertise, experience, and teaching approach.

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
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Go to Instructor Dashboard</a>
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
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/applications" class="btn">Review Application</a>
    </div>
  `
  const text = `New Instructor Application

Applicant: ${data.applicantName}
Email: ${data.applicantEmail}
Expertise: ${data.expertise}
Experience: ${data.experience}
Code: ${data.applicationCode}`

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
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Create Your First Course</a>
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
