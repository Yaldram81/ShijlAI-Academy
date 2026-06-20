import { NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Build a structured prompt from the data
    const systemPrompt = `You are an AI System Intelligence analyst for ShijlAI Academy, an e-learning platform. 
Your job is to analyze platform metrics and provide:
1. A concise executive summary (2-3 sentences)
2. Top 3 risks that need immediate attention
3. Top 3 recommendations for the admin
4. Key trend observations

Be specific, actionable, and data-driven. Reference actual numbers and percentages.
Maximum 200 words total. Do not use markdown headers - use plain text with bullet points.`

    const userPrompt = `Analyze these platform metrics and generate insights:

Platform Health:
- Total Students: ${data.platformHealth?.totalStudents || 0}
- Total Courses: ${data.platformHealth?.totalCourses || 0}  
- Daily Active Users: ${data.platformHealth?.dailyActiveUsers || 0}
- Weekly Active Users: ${data.platformHealth?.weeklyActiveUsers || 0}
- Completion Rate: ${data.platformHealth?.completionRate || 0}%
- Retention Rate: ${data.platformHealth?.retentionRate || 0}%
- DAU Trend: ${data.platformHealth?.trends?.dauTrend || 0}%
- Enrollment Trend: ${data.platformHealth?.trends?.enrollmentTrend || 0}%

Top Course Issues:
${(data.courseIntelligence || []).filter((c: any) => c.status !== 'healthy').slice(0, 5).map((c: any) => 
  `- ${c.courseTitle}: Health ${c.healthScore}/100 (${c.status}), Completion ${c.completionRate}%, Rating ${c.avgRating}`
).join('\n')}

Top Instructor Issues:
${(data.instructorIntelligence || []).filter((i: any) => i.warnings?.length > 0).slice(0, 5).map((i: any) => 
  `- ${i.instructorName}: Effectiveness ${i.effectivenessScore}/100, Warnings: ${i.warnings.join(', ')}`
).join('\n')}

Active Alerts:
${(data.alerts || []).slice(0, 10).map((a: any) => 
  `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`
).join('\n')}

Low Engagement Courses:
${(data.engagement?.courseEngagement || []).filter((c: any) => c.engagementScore < 50).slice(0, 5).map((c: any) => 
  `- ${c.courseTitle}: Engagement ${c.engagementScore}/100`
).join('\n')}`

    let aiInsights = ''
    try {
      aiInsights = await AIService.chat({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'complex',
        feature: 'system_intelligence_insights',
      })
    } catch (err) {
      console.error('[SystemIntelligence:GenerateInsights] AIService error:', err)
    }

    return NextResponse.json({ 
      insights: aiInsights || 'Platform analysis is currently unavailable.',
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('[SystemIntelligence:GenerateInsights] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI insights', insights: null },
      { status: 500 }
    )
  }
}

