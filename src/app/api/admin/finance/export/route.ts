import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'transactions' // transactions, tax, disputes
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (type === 'transactions') {
      const where: Record<string, unknown> = {}
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          paymentMethod: true,
          platformFee: true,
          instructorEarning: true,
          invoiceNumber: true,
          refundReason: true,
          createdAt: true,
          refundedAt: true,
          student: { select: { name: true, email: true } },
          instructor: { select: { name: true } },
          course: { select: { title: true, category: true } },
        },
      })

      if (format === 'csv') {
        const headers = ['Date', 'Invoice #', 'Type', 'Student', 'Instructor', 'Course', 'Category', 'Amount (USD)', 'Platform Fee', 'Instructor Earning', 'Payment Method', 'Status', 'Refund Reason']
        const rows = transactions.map(tx => [
          new Date(tx.createdAt).toLocaleDateString(),
          tx.invoiceNumber || '',
          tx.type,
          tx.student?.name || '',
          tx.instructor?.name || '',
          tx.course?.title || '',
          tx.course?.category || '',
          tx.amount,
          tx.platformFee,
          tx.instructorEarning,
          tx.paymentMethod,
          tx.status,
          tx.refundReason || '',
        ])

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="transactions-export.csv"',
          },
        })
      }
    }

    if (type === 'tax') {
      // Generate tax report
      const settings = await prisma.financialSettings.findFirst()
      const now = new Date()
      const fyStart = new Date(now.getFullYear() - 1, 6, 1)

      const [enrollments, refunds] = await Promise.all([
        prisma.transaction.aggregate({
          where: { type: 'enrollment', status: 'completed', createdAt: { gte: fyStart } },
          _sum: { amount: true, platformFee: true, instructorEarning: true },
        }),
        prisma.transaction.aggregate({
          where: { type: 'refund', createdAt: { gte: fyStart } },
          _sum: { amount: true },
        }),
      ])

      const grossRevenue = enrollments._sum.amount || 0
      const platformCommission = enrollments._sum.platformFee || 0
      const withholdingTax = Math.round(platformCommission * (settings?.withholdingTaxRate || 1) / 100)

      const headers = ['Metric', 'Amount (USD)']
      const rows = [
        ['Total Gross Revenue', grossRevenue],
        ['Platform Commission (20%)', platformCommission],
        ['Instructor Earnings', enrollments._sum.instructorEarning || 0],
        ['Refunds Issued', refunds._sum.amount || 0],
        ['Withholding Tax Collected', withholdingTax],
        ['Net Platform Revenue', platformCommission - withholdingTax],
      ]

      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="tax-report.csv"',
        },
      })
    }

    if (type === 'disputes') {
      const disputes = await prisma.dispute.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          description: true,
          refundAmount: true,
          createdAt: true,
          resolvedAt: true,
          resolutionNote: true,
          transaction: {
            select: {
              amount: true,
              invoiceNumber: true,
              student: { select: { name: true, email: true } },
              course: { select: { title: true } },
            },
          },
        },
      })

      const headers = ['Date', 'Type', 'Status', 'Student', 'Course', 'Transaction Amount', 'Dispute Description', 'Refund Amount', 'Resolution Note']
      const rows = disputes.map(d => [
        new Date(d.createdAt).toLocaleDateString(),
        d.type,
        d.status,
        d.transaction?.student?.name || '',
        d.transaction?.course?.title || '',
        d.transaction?.amount || 0,
        d.description,
        d.refundAmount || '',
        d.resolutionNote || '',
      ])

      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="disputes-export.csv"',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  } catch (error) {
    console.error('Finance export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
