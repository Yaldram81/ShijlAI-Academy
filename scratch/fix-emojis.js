const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../src/components/views/public-courses-view.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// 1. Add Lucide imports
content = content.replace(
  /import \{\n  Search,/g,
  `import {\n  Monitor, Briefcase, Palette, MessageCircle, Microscope, Tv, Book, FileText, Globe2, Cloud, Code, LayoutTemplate, Terminal, Library,\n  Search,`
)

// 2. Replace categoryEmojis and categoryIcons with a unified categoryIcons map
content = content.replace(
  /const categoryEmojis: Record<string, string> = \{[\s\S]*?\n\}\n\nconst categoryIcons: Record<string, string> = \{[\s\S]*?\n\}/m,
  `const categoryIcons: Record<string, any> = {
  Tech: Monitor,
  Business: Briefcase,
  Design: Palette,
  Language: MessageCircle,
  Sciences: Microscope,
  Arts: Tv,
  IB: Book,
  'O-Levels': FileText,
  'A-Levels': GraduationCap,
  IELTS: Globe2,
  AWS: Cloud,
  Programming: Code,
  'Web Dev': LayoutTemplate,
  Python: Terminal,
}`
)

// 3. Fix CourseCardGrid
content = content.replace(
  /const emoji = categoryEmojis\[course\.category\] \|\| '\\u\{1F4D6\}'/g,
  `const IconComponent = categoryIcons[course.category] || BookOpen`
)
content = content.replace(
  /<span className="text-5xl opacity-40 select-none">\{emoji\}<\/span>/g,
  `<IconComponent className="size-12 opacity-40 select-none text-white/50" strokeWidth={1.5} />`
)
content = content.replace(
  /<span className="text-\[10px\]">\{emoji\}<\/span>/g,
  `<IconComponent className="size-3 text-white/80" strokeWidth={2} />`
)

// 4. Fix CourseCardList
content = content.replace(
  /<span className="text-3xl opacity-40 select-none">\{emoji\}<\/span>/g,
  `<IconComponent className="size-8 opacity-40 select-none text-white/50" strokeWidth={1.5} />`
)

// 5. Fix Category Section (in render function)
content = content.replace(
  /const emoji = categoryEmojis\[course\.category\] \|\| '\\u\{1F4D6\}'/g,
  `const IconComponent = categoryIcons[course.category] || BookOpen`
)
content = content.replace(
  /<span className="text-4xl opacity-30 absolute top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 select-none">\{emoji\}<\/span>/g,
  `<IconComponent className="size-10 opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-white/50" strokeWidth={1.5} />`
)

content = content.replace(
  /<span className="text-xl">\{categoryEmojis\[c\.category\] \|\| '\\u\{1F4D6\}'\}<\/span>/g,
  `{(() => {\n                          const CatIcon = categoryIcons[c.category] || BookOpen\n                          return <CatIcon className="size-5" />\n                        })()}`
)

content = content.replace(
  /<span className="text-\[10px\]">\{categoryEmojis\[c\.category\] \|\| '\\u\{1F4D6\}'\}<\/span>/g,
  `{(() => {\n                    const CatIcon = categoryIcons[c.category] || BookOpen\n                    return <CatIcon className="size-3" />\n                  })()}`
)

// 6. Fix "All" button in category browser
content = content.replace(
  /<span className="text-xl">📚<\/span>/g,
  `<Library className="size-5" />`
)

// 7. Fix category browser buttons
content = content.replace(
  /const icon = categoryIcons\[cat\.name\] \|\| cat\.icon \|\| '📖'/g,
  `const IconComponent = categoryIcons[cat.name] || BookOpen`
)
content = content.replace(
  /<span className="text-xl">\{icon\}<\/span>/g,
  `<IconComponent className="size-5" />`
)

// 8. Fix spacing:
// <section className="relative overflow-hidden py-12 sm:py-16">
content = content.replace(
  /<section className="relative overflow-hidden py-12 sm:py-16">/g,
  `<section className="relative overflow-hidden py-6 sm:py-8">`
)

// <div className="mt-6 max-w-2xl mx-auto relative">
content = content.replace(
  /<div className="mt-6 max-w-2xl mx-auto relative">/g,
  `<div className="mt-4 max-w-2xl mx-auto relative">`
)

// <div className="grid lg:grid-cols-\[1fr_300px\] gap-8">
// Wait, that's verify. Let's look for large gaps in public courses view
content = content.replace(
  /<div className="flex gap-6">/g,
  `<div className="flex gap-4">`
)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Replacements complete.')
