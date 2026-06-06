import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');

    if (!certificateId) {
      return NextResponse.json(
        { error: 'certificateId query parameter is required' },
        { status: 400 }
      );
    }

    // Look up the certificate by certificateId
    const certificate = await db.certificate.findUnique({
      where: { certificateId },
    });

    if (!certificate) {
      return NextResponse.json({
        isValid: false,
        certificate: null,
        message: 'Certificate not found',
      });
    }

    return NextResponse.json({
      isValid: true,
      certificate: {
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        instructorName: certificate.instructorName,
        score: certificate.score,
        issuedAt: certificate.issuedAt.toISOString(),
        templateType: certificate.templateType,
      },
      message: 'Certificate verified successfully',
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}
