const { 
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, 
  AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  SectionType, TableOfContents, TabStopType, TabStopPosition
} = require('docx');

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const THICK_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const MID_BORDER = { style: BorderStyle.SINGLE, size: 2, color: "000000" };

// Body paragraph
function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { firstLine: 480 },
    ...opts,
    children: [new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000", ...(opts.runOpts || {}) })]
  });
}

// Body paragraph with multiple runs
function bodyParaRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { firstLine: 480 },
    ...opts,
    children: runs.map(r => typeof r === 'string' 
      ? new TextRun({ text: r, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })
      : new TextRun({ size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000", ...r })
    )
  });
}

// Heading 1 (Chapter)
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360, line: 360 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: "000000" })]
  });
}

// Heading 2
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 240, line: 360 },
    children: [new TextRun({ text, bold: true, size: 30, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: "000000" })]
  });
}

// Heading 3
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 360 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: "000000" })]
  });
}

// Heading 4
function h4(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 200, after: 100, line: 360 },
    children: [new TextRun({ text, bold: true, size: 26, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: "000000" })]
  });
}

// Figure caption (below figure)
function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200, line: 360 },
    children: [new TextRun({ text, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })]
  });
}

// Table caption (above table)
function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60, line: 360 },
    keepNext: true,
    children: [new TextRun({ text, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })]
  });
}

// Three-line table
function threeLineTable(headers, rows, colWidths) {
  const totalCols = headers.length;
  const defaultWidth = Math.floor(100 / totalCols);
  const widths = colWidths || headers.map(() => defaultWidth);
  
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      borders: { 
        top: THICK_BORDER, 
        bottom: MID_BORDER, 
        left: NB, right: NB 
      },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })] 
      })]
    }))
  });

  const dataRows = rows.map(row => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: widths[i], type: WidthType.PERCENTAGE },
      borders: { top: NB, bottom: NB, left: NB, right: NB },
      margins: { top: 40, bottom: 40, left: 120, right: 120 },
      children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: String(cell), size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })] 
      })]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: THICK_BORDER,
      bottom: THICK_BORDER,
      left: NB, right: NB,
      insideHorizontal: NB,
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows]
  });
}

// Mermaid diagram block (as monospace text)
function mermaidDiagram(code, figureNum, title, description) {
  return [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 60 },
      indent: { left: 480 },
      children: [new TextRun({ text: "```mermaid", size: 20, font: { ascii: "Courier New" }, color: "333333" })]
    }),
    ...code.split('\n').map(line => new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, after: 0 },
      indent: { left: 480 },
      children: [new TextRun({ text: line, size: 18, font: { ascii: "Courier New" }, color: "333333" })]
    })),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 60 },
      indent: { left: 480 },
      children: [new TextRun({ text: "```", size: 20, font: { ascii: "Courier New" }, color: "333333" })]
    }),
    figCaption(`Figure ${figureNum}: ${title}`),
    bodyPara(description, { indent: { firstLine: 0 } }),
  ];
}

// Screenshot placeholder
function screenshotPlaceholder(figureNum, title) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      border: {
        top: { style: BorderStyle.DASHED, size: 1, color: "999999" },
        bottom: { style: BorderStyle.DASHED, size: 1, color: "999999" },
        left: { style: BorderStyle.DASHED, size: 1, color: "999999" },
        right: { style: BorderStyle.DASHED, size: 1, color: "999999" },
      },
      children: [new TextRun({ text: `[SCREENSHOT PLACEHOLDER]`, size: 24, font: { ascii: "Times New Roman" }, color: "999999", italics: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `Insert Screenshot: ${title}`, size: 20, font: { ascii: "Times New Roman" }, color: "999999", italics: true })]
    }),
    figCaption(`Figure ${figureNum}: ${title}`),
  ];
}

// Empty line
function emptyLine(count = 1) {
  return Array.from({ length: count }, () => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "", size: 24 })] }));
}

// Page break
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// Bullet point
function bulletPara(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 80 },
    indent: { left: 720 + (level * 360), hanging: 240 },
    children: [
      new TextRun({ text: "• ", size: 24, font: { ascii: "Times New Roman" } }),
      new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })
    ]
  });
}

// Numbered item
function numberedItem(num, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 80 },
    indent: { left: 720, hanging: 360 },
    children: [new TextRun({ text: `${num}. `, size: 24, font: { ascii: "Times New Roman" }, bold: true }), new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })]
  });
}

// Header builder
function buildHeader(title) {
  return new Header({ children: [
    new Paragraph({ alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
      children: [new TextRun({ text: title, size: 18, color: "333333", font: { ascii: "Times New Roman", eastAsia: "SimSun" } })],
    }),
  ] });
}

// Footer with page number
function buildPageNumberFooter(formatType) {
  return new Footer({ children: [
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "- ", size: 21, font: { ascii: "Times New Roman" } }),
        new TextRun({ children: [PageNumber.CURRENT], size: 21, font: { ascii: "Times New Roman" } }),
        new TextRun({ text: " -", size: 21, font: { ascii: "Times New Roman" } }),
      ],
    }),
  ] });
}

// Reference entry (IEEE format)
function refEntry(num, text) {
  return new Paragraph({
    indent: { left: 420, hanging: 420 },
    spacing: { line: 360, after: 80 },
    children: [new TextRun({ text: `[${num}] ${text}`, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: "000000" })]
  });
}

module.exports = {
  NB, THIN_BORDER, THICK_BORDER, MID_BORDER,
  bodyPara, bodyParaRuns, h1, h2, h3, h4,
  figCaption, tableCaption, threeLineTable,
  mermaidDiagram, screenshotPlaceholder,
  emptyLine, pageBreak, bulletPara, numberedItem,
  buildHeader, buildPageNumberFooter, refEntry,
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  SectionType, TableOfContents
};
