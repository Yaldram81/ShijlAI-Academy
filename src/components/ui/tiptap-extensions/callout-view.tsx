import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CalloutNodeView(props: any) {
  const type = props.node.attrs.type || 'info'
  
  const config = {
    info: {
      icon: Info,
      className: 'bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200',
      iconClass: 'text-blue-500',
    },
    success: {
      icon: CheckCircle2,
      className: 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-200',
      iconClass: 'text-emerald-500',
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-200',
      iconClass: 'text-amber-500',
    },
    error: {
      icon: AlertCircle,
      className: 'bg-rose-50/50 border-rose-200 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-200',
      iconClass: 'text-rose-500',
    },
  }[type] || config.info

  const Icon = config.icon

  return (
    <NodeViewWrapper className={cn('relative my-4 rounded-xl border p-4 flex gap-3', config.className)}>
      <div className="mt-0.5 shrink-0" contentEditable={false}>
        <Icon className={cn('size-5', config.iconClass)} />
      </div>
      <div className="flex-1 min-w-0 prose-p:my-0">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
