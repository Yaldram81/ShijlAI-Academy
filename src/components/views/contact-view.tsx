import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PublicNav } from '@/components/public-nav'
import { PublicFooter } from '@/components/layout/public-footer'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Send, Mail, MapPin, Phone, MessageSquare, 
  CheckCircle, Globe, Clock, HelpCircle, 
  ArrowRight, ShieldCheck, Zap 
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function ContactHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-200/20 dark:bg-teal-900/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-6">
            <MessageSquare className="size-3.5" />
            Contact Us
          </div>
          <h1 className="text-[36px] sm:text-[44px] lg:text-[56px] font-bold tracking-tight leading-[1.1]">
            We'd love to hear{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              from you
            </span>
          </h1>
          <p className="mt-6 text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed">
            Whether you have a question about our courses, need technical support, or want to explore partnership opportunities, our team is ready to help.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function ContactInfoCards() {
  const cards = [
    {
      title: 'Support',
      description: 'Need help with your account or courses?',
      icon: HelpCircle,
      detail: 'support@shijlai.com',
      color: 'emerald',
      action: 'Visit Help Center'
    },
    {
      title: 'Partnerships',
      description: 'Interested in partnering with ShijlAI Academy?',
      icon: Globe,
      detail: 'partners@shijlai.com',
      color: 'teal',
      action: 'Become a Partner'
    },
    {
      title: 'Headquarters',
      description: 'Visit our main office or send us mail.',
      icon: MapPin,
      detail: 'Islamabad, Pakistan',
      color: 'cyan',
      action: 'Get Directions'
    }
  ]

  return (
    <section className="relative -mt-12 z-10 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl bg-${card.color}-100 text-${card.color}-600 dark:bg-${card.color}-900/30 dark:text-${card.color}-400 mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="size-6" />
              </div>
              <h3 className="text-[19px] font-bold mb-2">{card.title}</h3>
              <p className="text-[14px] text-muted-foreground mb-4">{card.description}</p>
              <p className="text-[15px] font-semibold text-foreground mb-6">{card.detail}</p>
              
              <button className={`text-[13px] font-semibold text-${card.color}-600 flex items-center gap-1.5 group-hover:gap-2 transition-all`}>
                {card.action} <ArrowRight className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactFormSection() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setFormState({ name: '', email: '', subject: '', message: '', type: 'general' })
      setTimeout(() => setSubmitted(false), 5000)
    }, 1500)
  }, [])

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight mb-4">
              Send us a Message
            </h2>
            <p className="text-[16px] text-muted-foreground mb-8 leading-relaxed">
              Fill out the form and our team will get back to you within 24 hours. We're here to help you get the most out of your learning experience.
            </p>

            <div className="space-y-6">
              {[
                { icon: Clock, title: '24/7 Support', desc: 'Our AI assistant is always available. Human support replies within 24h.' },
                { icon: ShieldCheck, title: 'Secure & Private', desc: 'Your data is encrypted and handled securely according to our privacy policy.' },
                { icon: Zap, title: 'Fast Resolution', desc: '95% of queries are resolved on the first response.' }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <feature.icon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold">{feature.title}</h4>
                    <p className="text-[13px] text-muted-foreground mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl bg-card border border-border/60 p-6 sm:p-10 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, mb: 0 }}
                    animate={{ opacity: 1, height: 'auto', mb: 20 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                      <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[14px] font-semibold text-emerald-800 dark:text-emerald-300">Message Sent!</h4>
                        <p className="text-[13px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                          Thank you for reaching out. We've received your message and will respond shortly.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-semibold">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    required 
                    value={formState.name}
                    onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 bg-muted/50 border-transparent focus:border-emerald-500 focus:bg-background transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-semibold">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    value={formState.email}
                    onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12 bg-muted/50 border-transparent focus:border-emerald-500 focus:bg-background transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-[13px] font-semibold">Inquiry Type</Label>
                <select 
                  id="type"
                  value={formState.type}
                  onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full h-12 rounded-md border border-transparent bg-muted/50 px-3 text-sm focus:border-emerald-500 focus:bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback / Suggestion</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[13px] font-semibold">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="How can we help?" 
                  required 
                  value={formState.subject}
                  onChange={(e) => setFormState(prev => ({ ...prev, subject: e.target.value }))}
                  className="h-12 bg-muted/50 border-transparent focus:border-emerald-500 focus:bg-background transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-[13px] font-semibold">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us more about your inquiry..." 
                  required 
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-muted/50 border-transparent focus:border-emerald-500 focus:bg-background transition-colors resize-none p-4" 
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="size-4" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export function ContactView() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav activeView="contact" />
      <div className="flex-1">
        <ContactHero />
        <ContactInfoCards />
        <ContactFormSection />
      </div>
      <PublicFooter />
    </div>
  )
}
