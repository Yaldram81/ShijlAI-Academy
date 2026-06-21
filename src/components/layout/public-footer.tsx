import { Twitter, Linkedin, Youtube, Github } from 'lucide-react'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { useAppStore } from '@/lib/store'

export function PublicFooter() {
  const { setCurrentView } = useAppStore()

  const footerLinks = {
    platform: [
      { label: 'Browse Courses', view: 'public-courses' as const },
      { label: 'Pricing Plans', view: 'pricing' as const },
      { label: 'For Schools', view: 'about' as const },
    ],
    resources: [
      { label: 'Blog & Articles', view: 'blog' as const },
      { label: 'Help Center', view: 'about' as const },
      { label: 'Ask ShijlAI', view: 'landing' as const },
    ],
    company: [
      { label: 'About Us', view: 'about' as const },
      { label: 'Careers', view: 'about' as const },
      { label: 'Contact', view: 'contact' as const },
    ],
  }

  return (
    <footer className="border-t border-border/40 bg-card/50 pt-12 pb-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2 pr-4">
            <div className="flex items-center gap-2 mb-4">
              <ShijlAILogo size="sm" className="shrink-0" />
              <span className="text-[15px] font-bold"><ShijlAIBrand variant="compact" /></span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6 max-w-sm">
              Making quality, AI-powered education accessible to everyone, everywhere. 
              Join us to transform your learning journey.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Youtube, label: 'YouTube' },
                { icon: Github, label: 'GitHub' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={label}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[13px] font-semibold text-foreground mb-4">Platform</h4>
            <div className="space-y-3">
              {footerLinks.platform.map((link) => (
                <button
                  key={link.label}
                  onClick={() => setCurrentView(link.view)}
                  className="block text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold text-foreground mb-4">Resources</h4>
            <div className="space-y-3">
              {footerLinks.resources.map((link) => (
                <button
                  key={link.label}
                  onClick={() => setCurrentView(link.view)}
                  className="block text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold text-foreground mb-4">Company</h4>
            <div className="space-y-3">
              {footerLinks.company.map((link) => (
                <button
                  key={link.label}
                  onClick={() => setCurrentView(link.view)}
                  className="block text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} <ShijlAIBrand variant="compact" />. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('about')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</button>
            <button onClick={() => setCurrentView('about')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
