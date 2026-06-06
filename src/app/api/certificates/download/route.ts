import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const format = searchParams.get('format'); // pdf or png

    if (!certificateId) {
      return NextResponse.json(
        { error: 'certificateId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate format if provided
    if (format && format !== 'pdf' && format !== 'png') {
      return NextResponse.json(
        { error: 'format must be "pdf" or "png"' },
        { status: 400 }
      );
    }

    // Look up the certificate by certificateId
    const certificate = await db.certificate.findUnique({
      where: { certificateId },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Return certificate data for client-side rendering/download
    // Actual PDF/PNG generation will be done client-side using canvas/html2canvas
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        instructorName: certificate.instructorName,
        score: certificate.score,
        issuedAt: certificate.issuedAt.toISOString(),
        templateType: certificate.templateType,
        verificationHash: certificate.verificationHash,
      },
      downloadUrl: null,
      requestedFormat: format || 'pdf',
      message: 'Ready for client-side download',
    });
  } catch (error) {
    console.error('Error preparing certificate download:', error);
    return NextResponse.json(
      { error: 'Failed to prepare certificate download' },
      { status: 500 }
    );
  }
}
