export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[11px] font-medium text-muted-foreground/50 px-2 bg-background">{date}</span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
}
