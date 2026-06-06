import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/payout-methods - List all payout methods for an instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    const payoutMethods = await db.payoutMethod.findMany({
      where: { instructorId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ payoutMethods })
  } catch (error) {
    console.error('Error fetching payout methods:', error)
    return NextResponse.json({ error: 'Failed to fetch payout methods' }, { status: 500 })
  }
}

// POST /api/instructor/payout-methods - Create a new payout method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      instructorId,
      type,
      bankName,
      accountNumber,
      accountHolder,
      branchCode,
      phoneNumber,
      accountName,
      email,
      countryCode,
      isDefault,
    } = body

    // Validate required fields
    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }
    if (!type) {
      return NextResponse.json({ error: 'Payout method type is required' }, { status: 400 })
    }

    // Validate type
    const validTypes = ['bank_transfer', 'jazzcash', 'easypaisa', 'payoneer', 'stripe']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid payout method type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Validate type-specific required fields
    if (type === 'bank_transfer') {
      if (!bankName || !accountNumber || !accountHolder) {
        return NextResponse.json(
          { error: 'Bank name, account number, and account holder are required for bank transfer' },
          { status: 400 }
        )
      }
    }
    if (type === 'jazzcash' || type === 'easypaisa') {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Phone number is required for mobile wallet methods' },
          { status: 400 }
        )
      }
    }
    if (type === 'payoneer' || type === 'stripe') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for international payment methods' },
          { status: 400 }
        )
      }
    }

    // If isDefault is set, unset other defaults for the same instructor
    if (isDefault) {
      await db.payoutMethod.updateMany({
        where: { instructorId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const payoutMethod = await db.payoutMethod.create({
      data: {
        instructorId,
        type,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountHolder: accountHolder || null,
        branchCode: branchCode || null,
        phoneNumber: phoneNumber || null,
        accountName: accountName || null,
        email: email || null,
        countryCode: countryCode || null,
        isDefault: isDefault || false,
        isActive: true,
      },
    })

    return NextResponse.json({ payoutMethod }, { status: 201 })
  } catch (error) {
    console.error('Error creating payout method:', error)
    return NextResponse.json({ error: 'Failed to create payout method' }, { status: 500 })
  }
}

// PATCH /api/instructor/payout-methods - Update a payout method
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      payoutMethodId,
      type,
      bankName,
      accountNumber,
      accountHolder,
      branchCode,
      phoneNumber,
      accountName,
      email,
      countryCode,
      isDefault,
    } = body

    if (!payoutMethodId) {
      return NextResponse.json({ error: 'Payout method ID is required' }, { status: 400 })
    }

    // Verify payout method exists
    const existingMethod = await db.payoutMethod.findUnique({
      where: { id: payoutMethodId },
    })
    if (!existingMethod) {
      return NextResponse.json({ error: 'Payout method not found' }, { status: 404 })
    }

    // Authorization: verify instructorId from body matches method owner
    const { instructorId: patchInstructorId } = body
    if (patchInstructorId && existingMethod.instructorId !== patchInstructorId) {
      return NextResponse.json({ error: 'You can only update your own payout methods' }, { status: 403 })
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['bank_transfer', 'jazzcash', 'easypaisa', 'payoneer', 'stripe']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid payout method type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // If isDefault is being set to true, unset other defaults for the same instructor
    if (isDefault) {
      await db.payoutMethod.updateMany({
        where: { instructorId: existingMethod.instructorId, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {}
    if (type !== undefined) updateData.type = type
    if (bankName !== undefined) updateData.bankName = bankName
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder
    if (branchCode !== undefined) updateData.branchCode = branchCode
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber
    if (accountName !== undefined) updateData.accountName = accountName
    if (email !== undefined) updateData.email = email
    if (countryCode !== undefined) updateData.countryCode = countryCode
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const updatedMethod = await db.payoutMethod.update({
      where: { id: payoutMethodId },
      data: updateData,
    })

    return NextResponse.json({ payoutMethod: updatedMethod })
  } catch (error) {
    console.error('Error updating payout method:', error)
    return NextResponse.json({ error: 'Failed to update payout method' }, { status: 500 })
  }
}

// DELETE /api/instructor/payout-methods - Delete a payout method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payoutMethodId = searchParams.get('payoutMethodId')

    if (!payoutMethodId) {
      return NextResponse.json({ error: 'Payout method ID is required' }, { status: 400 })
    }

    // Verify payout method exists
    const payoutMethod = await db.payoutMethod.findUnique({
      where: { id: payoutMethodId },
    })
    if (!payoutMethod) {
      return NextResponse.json({ error: 'Payout method not found' }, { status: 404 })
    }

    // Authorization: verify instructorId matches method owner
    const deleteInstructorId = searchParams.get('instructorId')
    if (deleteInstructorId && payoutMethod.instructorId !== deleteInstructorId) {
      return NextResponse.json({ error: 'You can only delete your own payout methods' }, { status: 403 })
    }

    await db.payoutMethod.delete({
      where: { id: payoutMethodId },
    })

    return NextResponse.json({ success: true, message: 'Payout method deleted' })
  } catch (error) {
    console.error('Error deleting payout method:', error)
    return NextResponse.json({ error: 'Failed to delete payout method' }, { status: 500 })
  }
}
