import { Metadata } from 'next'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Shield, ExternalLink, Calendar, User, BookOpen, Star, Share2 } from 'lucide-react'
import { PublicNav } from '@/components/public-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ certificateId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { certificateId } = await params
  const certificate = await db.certificate.findUnique({
    where: { certificateId },
  })

  if (!certificate) return { title: 'Certificate Not Found - ShijlAI Academy' }

  return {
    title: `${certificate.courseTitle} Certificate for ${certificate.userName} - ShijlAI Academy`,
    description: `Verify the authenticity of this certificate issued to ${certificate.userName} for completing ${certificate.courseTitle}.`,
  }
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { certificateId } = await params
  const certificate = await db.certificate.findUnique({
    where: { certificateId },
  })

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNav />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="size-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
            <Shield className="size-10 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Certificate Not Found</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            We couldn't find a certificate with the ID <span className="font-mono text-foreground">{certificateId}</span>. Please double-check the URL or credential ID.
          </p>
          <Button asChild className="rounded-xl h-12 px-8">
            <Link href="/">Return to Home</Link>
          </Button>
        </main>
      </div>
    )
  }

  // Template styles based on type
  let templateColor = 'bg-primary/10 text-primary border-primary/15'
  let templateLabel = 'Completion'
  
  if (certificate.templateType === 'distinction') {
    templateColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'
    templateLabel = 'Distinction'
  } else if (certificate.templateType === 'excellence') {
    templateColor = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    templateLabel = 'Excellence'
  }

  const issueDate = certificate.issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
      <PublicNav />
      
      <main className="flex-1 max-w-[1300px] w-full mx-auto p-4 md:p-8 flex flex-col pt-24 pb-16">
        
        {/* Verification Banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 md:p-6 mb-8 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left ios-shadow-sm">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Shield className="size-7" />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Official Verified Certificate</h2>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
              This credential has been securely verified by ShijlAI Academy.
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Credential ID</p>
            <p className="font-mono text-sm font-bold">{certificate.certificateId}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          
          {/* Main Certificate View */}
          <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 md:p-10 ios-shadow-sm overflow-x-auto flex items-center justify-center">
            {/* The actual certificate visual */}
            <div className="w-full min-w-[850px] max-w-[1000px] aspect-[1.414] shrink-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30 p-8 md:p-10 rounded-2xl relative shadow-lg flex flex-col">
              <div className="border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 md:p-8 relative flex-1 flex flex-col items-center justify-center">
                {/* Corner decorations */}
                <div className="absolute top-3 left-3 size-8 border-t-2 border-l-2 rounded-tl-2xl border-emerald-400 dark:border-emerald-600" />
                <div className="absolute top-3 right-3 size-8 border-t-2 border-r-2 rounded-tr-2xl border-emerald-400 dark:border-emerald-600" />
                <div className="absolute bottom-3 left-3 size-8 border-b-2 border-l-2 rounded-bl-2xl border-emerald-400 dark:border-emerald-600" />
                <div className="absolute bottom-3 right-3 size-8 border-b-2 border-r-2 rounded-br-2xl border-emerald-400 dark:border-emerald-600" />

                <div className="text-center space-y-4">
                  {/* Seal / Logo */}
                  <div className="flex justify-center">
                    <ShijlAILogo size="xl" className="shrink-0" />
                  </div>

                  <div>
                    <p className="text-[11px] font-medium tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                      🎓 <ShijlAIBrand variant="compact" />
                    </p>
                    <h3 className="mt-2 text-[26px] md:text-[32px] font-serif font-bold text-slate-900 dark:text-slate-100">
                      Certificate of Completion
                    </h3>
                    {certificate.templateType !== 'completion' && (
                      <Badge variant="outline" className={`mt-1 text-[10px] rounded-lg border ${templateColor}`}>
                        {templateLabel}
                      </Badge>
                    )}
                  </div>

                  <div className="w-24 h-px bg-emerald-300 dark:bg-emerald-700 mx-auto" />

                  <div className="space-y-1">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">This certifies that</p>
                    <p className="text-[22px] md:text-[28px] font-serif font-bold text-emerald-700 dark:text-emerald-400">
                      {certificate.userName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">has successfully completed</p>
                    <p className="text-[17px] md:text-[22px] font-serif font-semibold text-slate-900 dark:text-slate-100">
                      {certificate.courseTitle}
                    </p>
                  </div>

                  {certificate.instructorName && (
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      Instructed by <span className="font-medium text-slate-800 dark:text-slate-200">{certificate.instructorName}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-8 pt-2">
                    <div className="text-center">
                      <p className="text-[28px] font-bold text-emerald-600 dark:text-emerald-400">{certificate.score ?? 0}%</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Score</p>
                    </div>
                    <div className="w-px h-8 bg-emerald-200 dark:bg-emerald-700" />
                    <div className="text-center">
                      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        {issueDate}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Date Issued</p>
                    </div>
                  </div>

                  {/* Verification info */}
                  <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800 space-y-1.5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Credential ID: <span className="font-mono font-medium">{certificate.certificateId}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Verify at: <span className="text-emerald-600 dark:text-emerald-400 font-medium">shijlai.academy/verify/{certificate.certificateId}</span>
                    </p>
                    {certificate.verificationHash && (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <Shield className="size-3" />
                        <span className="font-mono">Blockchain verified: {certificate.verificationHash?.slice(0, 18)}...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-3xl p-6 ios-shadow-sm border border-border/40 space-y-6">
              <h3 className="font-bold text-lg">Credential Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Recipient</p>
                    <p className="font-semibold">{certificate.userName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BookOpen className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Course</p>
                    <p className="font-semibold leading-tight">{certificate.courseTitle}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Date Issued</p>
                    <p className="font-semibold">{issueDate}</p>
                  </div>
                </div>

                {certificate.score !== null && (
                  <div className="flex items-start gap-3">
                    <Star className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">Score</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{certificate.score}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full rounded-2xl h-14 text-base gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border-0">
              <Share2 className="size-5" />
              Share Certificate
            </Button>

            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                Want to learn and earn your own certificate?
              </p>
              <Button variant="outline" asChild className="w-full rounded-2xl h-12">
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
