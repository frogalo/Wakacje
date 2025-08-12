// api/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const offers = await prisma.offer.findMany({
            include: {
                values: true
            },
            orderBy: { createdAt: 'desc' } // Assuming you have a createdAt field
        })

        // Transform the data to match the frontend format
        const transformedOffers = offers.map((offer: { id: string; values: { fieldId: string; value: string }[] }) => ({
            id: offer.id,
            // Restructure values from array to object keyed by fieldId
            values: offer.values.reduce((acc: Record<string, string>, value: { fieldId: string; value: string }) => {
                acc[value.fieldId] = value.value
                return acc
            }, {} as Record<string, string>)
        }))

        return NextResponse.json(transformedOffers)
    } catch (error) { // Catch block for GET
        console.error("GET /api/offers error:", error); // Log the error
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { values } = await request.json()

        // Validate if values is an object before proceeding
        if (typeof values !== 'object' || values === null) {
            return NextResponse.json({ error: 'Invalid values format. Expected an object.' }, { status: 400 });
        }

        const offer = await prisma.offer.create({
            data: {
                values: {
                    // Map object entries to the Prisma schema for offer values
                    create: Object.entries(values).map(([fieldId, value]) => ({
                        fieldId,
                        value: String(value) // Ensure value is a string
                    }))
                }
            },
            include: {
                values: true // Include the created values in the response
            }
        })

        // Transform the response to match the expected frontend format
        const transformedOffer = {
            id: offer.id,
            values: offer.values.reduce((acc: Record<string, string>, value: { fieldId: string; value: string }) => {
                acc[value.fieldId] = value.value
                return acc
            }, {} as Record<string, string>)
        }

        return NextResponse.json(transformedOffer, { status: 201 }) // Use 201 Created status
    } catch (error) { // Catch block for POST
        console.error("POST /api/offers error:", error); // Log the error
        return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }
}