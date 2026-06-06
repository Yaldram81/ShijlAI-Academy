'use client'

import { useState } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Check, X, GraduationCap, ArrowRight, Sparkles,
  Crown, Users, Star, Bot, BookOpen, Award, Zap,
  Headphones, BarChart3, Shield, Download, MessageCircle
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    icon: GraduationCap,
    gradient: 'from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/20',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    features: [
      { text: '5 courses access', included: true },
      { text: <>Basic Ask <ShijlAIText /></>, included: true },
      { text: 'Community access', included: true },
      { text: 'Basic analytics', included: true },
      { text: <>Advanced Ask <ShijlAIText /></>, included: false },
      { text: 'Certificates', included: false },
      { text: 'Offline mode', included: false },
      { text: 'No ads', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$14.99',
    period: '/month',
    description: 'Most popular for serious learners',
    icon: Crown,
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-white/20 text-white',
    features: [
      { text: 'All courses access', included: true },
      { text: <>Advanced Ask <ShijlAIText /></>, included: true },
      { text: 'Certificates', included: true },
      { text: 'Offline mode', included: true },
      { text: 'Priority support', included: true },
      { text: 'No ads', included: true },
      { text: 'Custom learning paths', included: true },
      { text: 'Team features', included: false },
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: 'Custom',
    period: '',
    description: 'For schools and organizations',
    icon: Users,
    gradient: 'from-teal-100 to-emerald-100 dark:from-teal-950/30 dark:to-emerald-950/20',
    iconBg: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Team dashboard', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom content', included: true },
      { text: 'SSO integration', included: true },
      { text: 'Analytics API', included: true },
      { text: 'Bulk licensing', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Can I try Pro for free before committing?',
    answer: 'Yes! We offer a 14-day free trial of the Pro plan. No credit card required. You can explore all features and decide if it\'s right for you.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept JazzCash, EasyPaisa, bank transfer, and all major credit/debit cards. All payments are processed securely.',
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at the end of your billing period.',
  },
  {
    question: 'Is there a student discount?',
    answer: 'Yes! Students with a valid student ID get 30% off Pro plans. Contact us with your student ID to activate the discount.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your learning progress and certificates are always yours to keep. If you cancel, you\'ll retain access to free-tier features and all your earned certificates.',
  },
  {
    question: 'Do you offer institutional pricing?',
    answer: 'Yes! Our Team plan is designed for schools, colleges, and organizations. Contact our sales team for custom pricing based on your institution\'s needs.',
  },
]

export function PricingView() {
  const { setCurrentView } = useAppStore()
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <PublicNav activeView="pricing" />

      {/* Hero */}
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
              <Sparkles className="size-3.5" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Learning Plan
              </span>
            </h1>
            <p className="mt-3 text-[17px] text-muted-foreground max-w-xl mx-auto">
              Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
            </p>

            {/* Annual toggle */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className={`text-[13px] font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  annual ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div className={`size-5 rounded-full bg-white shadow-sm transition-transform ${
                  annual ? 'translate-x-6.5' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-[13px] font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual <span className="text-primary text-[11px] font-semibold">Save 20%</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-6 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springTransition, delay: i * 0.1 }}
                className={`rounded-2xl overflow-hidden ${
                  plan.popular
                    ? 'ios-shadow-lg ring-2 ring-primary relative'
                    : 'ios-shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-center py-1.5">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Most Popular</span>
                  </div>
                )}
                <div className="p-6 bg-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex size-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                      <plan.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold">{plan.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-[34px] font-bold">
                      {plan.name === 'Pro' && annual ? '$11.99' : plan.price}
                    </span>
                    <span className="text-[15px] text-muted-foreground">
                      {plan.name === 'Pro' && annual ? '/month' : plan.period}
                    </span>
                    {plan.name === 'Pro' && annual && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Billed annually at $143.88/year
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => setCurrentView('register')}
                    className={`w-full rounded-full h-11 text-[15px] font-semibold ios-press ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                        : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="size-4" />
                  </Button>

                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2.5">
                        {feature.included ? (
                          <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                            <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="flex size-5 items-center justify-center rounded-full bg-muted/50">
                            <X className="size-3 text-muted-foreground/50" />
                          </div>
                        )}
                        <span className={`text-[13px] ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground/50'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
              Why Upgrade to{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Pro
              </span>
              ?
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Bot, title: <>Advanced Ask <ShijlAIText /></>, desc: 'Get personalized, context-aware tutoring that adapts to your learning style' },
              { icon: Award, title: 'Earn Certificates', desc: 'Receive verified certificates upon course completion to showcase your skills' },
              { icon: Download, title: 'Offline Access', desc: 'Download lessons and study materials for learning without internet' },
              { icon: Headphones, title: 'Priority Support', desc: 'Get faster responses from our support team and AI assistant' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springTransition, delay: i * 0.08 }}
                className="rounded-2xl ios-shadow-sm bg-card p-5"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-3">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-[15px] font-semibold mb-1">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
          </motion.div>

          <div className="rounded-2xl ios-shadow-sm bg-card p-5">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                  <AccordionTrigger className="text-[15px] font-medium text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  )
}
