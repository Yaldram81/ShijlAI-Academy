import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// AI Generations API

// GET: List generations for an instructor with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const toolType = searchParams.get('toolType')
    const favorite = searchParams.get('favorite')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }

    const where: Prisma.AIGenerationWhereInput = { instructorId }

    if (toolType) where.toolType = toolType
    if (favorite === 'true') where.isFavorite = true
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { resultContent: { contains: search } },
      ]
    }

    const skip = (page - 1) * limit

    const [generations, total] = await Promise.all([
      db.aIGeneration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.aIGeneration.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Parse JSON string fields for each generation
    const parsed = generations.map(g => ({
      ...g,
      inputParams: (() => { try { return g.inputParams ? JSON.parse(g.inputParams as string) : {} } catch { return {} } })(),
      resultImages: (() => { try { return g.resultImages ? JSON.parse(g.resultImages as string) : [] } catch { return [] } })(),
      tags: (() => { try { return g.tags ? JSON.parse(g.tags as string) : [] } catch { return [] } })(),
    }))

    return NextResponse.json({
      generations: parsed,
      totalPages,
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error('Error listing AI generations:', error)
    return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 })
  }
}

// POST: Save a new generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, toolType, title, inputParams, resultContent, resultImages, tags, courseId } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }
    if (!toolType || !title || !resultContent) {
      return NextResponse.json({ error: 'toolType, title, and resultContent are required' }, { status: 400 })
    }

    const generation = await db.aIGeneration.create({
      data: {
        instructorId,
        toolType,
        title,
        inputParams: typeof inputParams === 'string' ? inputParams : JSON.stringify(inputParams || {}),
        resultContent,
        resultImages: resultImages ? (typeof resultImages === 'string' ? resultImages : JSON.stringify(resultImages)) : null,
        tags: tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null,
        courseId: courseId || null,
      },
    })

    return NextResponse.json({ generation }, { status: 201 })
  } catch (error) {
    console.error('Error creating AI generation:', error)
    return NextResponse.json({ error: 'Failed to save generation' }, { status: 500 })
  }
}
