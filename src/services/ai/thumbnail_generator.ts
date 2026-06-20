import sharp from 'sharp'

export class ThumbnailGenerator {
  /**
   * Generates 4 professional high-resolution course thumbnail image variants.
   * Renders SVG to PNG via `sharp` and returns base64 strings.
   */
  static async generate(
    title: string,
    style: 'modern' | 'gradient' | 'minimal' | 'illustration'
  ): Promise<string[]> {
    const gradients = [
      { from: '#6366f1', to: '#a855f7', text: '#ffffff' }, // Indigo to Purple
      { from: '#f43f5e', to: '#fb923c', text: '#ffffff' }, // Rose to Orange
      { from: '#0f172a', to: '#1e1b4b', text: '#ffffff' }, // Slate to Navy (dark minimal)
      { from: '#10b981', to: '#3b82f6', text: '#ffffff' }, // Emerald to Blue
    ]

    const layouts = [
      // Layout 1: Centered title with elegant underline
      (title: string, grad: any) => `
        <svg width="1344" height="768" viewBox="0 0 1344 768" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${grad.from}" />
              <stop offset="100%" stop-color="${grad.to}" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad1)" />
          <circle cx="200" cy="200" r="350" fill="white" opacity="0.06" />
          <circle cx="1144" cy="568" r="280" fill="white" opacity="0.06" />
          <rect x="172" y="184" width="1000" height="400" rx="24" fill="black" opacity="0.15" />
          
          <text x="672" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="${grad.text}" text-anchor="middle">
            ${this.wrapText(title, 25).map((line, idx) => `<tspan x="672" dy="${idx === 0 ? 0 : 75}">${escapeXml(line)}</tspan>`).join('')}
          </text>
          
          <line x1="572" y1="480" x2="772" y2="480" stroke="${grad.text}" stroke-width="6" stroke-linecap="round" opacity="0.8" />
          
          <text x="672" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="${grad.text}" letter-spacing="4" text-anchor="middle" opacity="0.7">
            SHIJLAI ACADEMY
          </text>
        </svg>
      `,
      // Layout 2: Left-aligned title with card container and badges
      (title: string, grad: any) => `
        <svg width="1344" height="768" viewBox="0 0 1344 768" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${grad.from}" />
              <stop offset="100%" stop-color="${grad.to}" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad2)" />
          <path d="M 0,192 L 1344,192 M 0,384 L 1344,384 M 0,576 L 1344,576 M 336,0 L 336,768 M 672,0 L 672,768 M 1008,0 L 1008,768" stroke="white" stroke-width="2" opacity="0.04" />
          
          <rect x="150" y="160" width="220" height="42" rx="8" fill="white" opacity="0.2" />
          <text x="260" y="186" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="${grad.text}" text-anchor="middle" letter-spacing="2">
            PREMIUM LEARNING
          </text>
          
          <text x="150" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" fill="${grad.text}" text-anchor="start">
            ${this.wrapText(title, 20).map((line, idx) => `<tspan x="150" dy="${idx === 0 ? 0 : 85}">${escapeXml(line)}</tspan>`).join('')}
          </text>
          
          <text x="150" y="580" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="${grad.text}" letter-spacing="4" text-anchor="start" opacity="0.7">
            LEARN SMARTER • SHIJLAI ACADEMY
          </text>
        </svg>
      `,
      // Layout 3: Minimalist dark background with glowing text gradient
      (title: string, grad: any) => `
        <svg width="1344" height="768" viewBox="0 0 1344 768" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#090d16" />
              <stop offset="100%" stop-color="#111827" />
            </linearGradient>
            <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${grad.from}" />
              <stop offset="100%" stop-color="${grad.to}" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad3)" />
          <rect x="50" y="50" width="1244" height="668" rx="24" fill="none" stroke="url(#textGrad)" stroke-width="8" />
          
          <text x="672" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="url(#textGrad)" text-anchor="middle">
            ${this.wrapText(title, 25).map((line, idx) => `<tspan x="672" dy="${idx === 0 ? 0 : 80}">${escapeXml(line)}</tspan>`).join('')}
          </text>
          
          <text x="672" y="540" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" fill="white" letter-spacing="6" text-anchor="middle" opacity="0.6">
            SHIJLAI ACADEMY
          </text>
        </svg>
      `,
      // Layout 4: Abstract dynamic waves and title
      (title: string, grad: any) => `
        <svg width="1344" height="768" viewBox="0 0 1344 768" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${grad.from}" />
              <stop offset="100%" stop-color="${grad.to}" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad4)" />
          <path d="M 0 768 Q 336 450 672 768 T 1344 768" fill="white" opacity="0.1" />
          <path d="M 0 768 Q 336 250 672 768 T 1344 768" fill="white" opacity="0.05" />
          
          <text x="672" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" fill="${grad.text}" text-anchor="middle">
            ${this.wrapText(title, 22).map((line, idx) => `<tspan x="672" dy="${idx === 0 ? 0 : 85}">${escapeXml(line)}</tspan>`).join('')}
          </text>
          
          <text x="672" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${grad.text}" letter-spacing="4" text-anchor="middle" opacity="0.9">
            ONLINE COURSE
          </text>
        </svg>
      `,
    ]

    const results: string[] = []
    for (let i = 0; i < 4; i++) {
      const grad = gradients[i % gradients.length]
      const layout = layouts[i]
      const svg = layout(title, grad)
      
      try {
        const pngBuffer = await sharp(Buffer.from(svg))
          .png()
          .toBuffer()
        results.push(pngBuffer.toString('base64'))
      } catch (err) {
        console.error('Failed to convert SVG to PNG using sharp:', err)
        // Fallback: return SVG base64 if sharp fails (though sharp is installed)
        results.push(Buffer.from(svg).toString('base64'))
      }
    }
    return results
  }

  private static wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim()
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)
    
    return lines.slice(0, 3)
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  })
}
