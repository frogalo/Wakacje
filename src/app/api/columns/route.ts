// api/columns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const columns = await prisma.column.findMany({
            orderBy: { order: 'asc' }
        })
        return NextResponse.json(columns)
    } catch (error) {
        console.error("GET /api/columns error:", error); // Log the actual error
        return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { fieldId, label, icon } = await request.json()

        const lastColumn = await prisma.column.findFirst({
            orderBy: { order: 'desc' }
        })
        const order = (lastColumn?.order ?? -1) + 1

        const column = await prisma.column.create({
            data: {
                fieldId,
                label,
                icon,
                order
            }
        })
        return NextResponse.json(column)
    } catch (error) {
        console.error("POST /api/columns error:", error); // Log the actual error
        return NextResponse.json({ error: 'Failed to create column' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fieldId = searchParams.get('fieldId')

        if (!fieldId) {
            return NextResponse.json({ error: 'fieldId is required' }, { status: 400 })
        }

        await prisma.offerValue.deleteMany({
            where: { fieldId }
        })

        await prisma.column.delete({
            where: { fieldId }
        })

        return NextResponse.json({ success: true })
    } catch (error) { // Keep error here for logging
        console.error("DELETE /api/columns error:", error); // Log the actual error
        return NextResponse.json({ error: 'Failed to delete column' }, { status: 500 })
    }
}