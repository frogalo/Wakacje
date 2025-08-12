// app/api/offers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT handler for updating an offer
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { values } = await request.json();
        const { id } = await params;

        // Basic validation for ID from URL params
        if (!id) {
            return NextResponse.json(
                { error: 'Offer ID is required in URL params' },
                { status: 400 }
            );
        }
        // Validate if values is an object before proceeding
        if (typeof values !== 'object' || values === null) {
            return NextResponse.json(
                { error: 'Invalid values format. Expected an object.' },
                { status: 400 }
            );
        }

        // Delete existing values to ensure a clean update
        await prisma.offerValue.deleteMany({
            where: { offerId: id },
        });

        // Update the offer with new values
        const offer = await prisma.offer.update({
            where: { id },
            data: {
                values: {
                    create: Object.entries(values).map(([fieldId, value]) => ({
                        fieldId,
                        value: String(value), // Ensure value is a string
                    })),
                },
            },
            include: {
                values: true, // Fetch the updated values
            },
        });

        // Transform the response to match the expected frontend format
        const transformedOffer = {
            id: offer.id,
            values: offer.values.reduce(
                (acc: Record<string, string>, value: { fieldId: string; value: string }) => {
                    acc[value.fieldId] = value.value;
                    return acc;
                },
                {} as Record<string, string>
            ),
        };

        return NextResponse.json(transformedOffer);
    } catch (error) {
        // Log the actual error for debugging purposes
        const resolvedParams = await params.catch(() => ({ id: 'unknown' }));
        console.error(`PUT /api/offers/${resolvedParams.id} error:`, error);
        return NextResponse.json(
            { error: 'Failed to update offer' },
            { status: 500 }
        );
    }
}

// DELETE handler for deleting an offer
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Basic validation for ID from URL params
        if (!id) {
            return NextResponse.json(
                { error: 'Offer ID is required in URL params' },
                { status: 400 }
            );
        }

        // Attempt to delete the offer
        await prisma.offer.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Log the actual error for debugging purposes
        const resolvedParams = await params.catch(() => ({ id: 'unknown' }));
        console.error(`DELETE /api/offers/${resolvedParams.id} error:`, error);
        return NextResponse.json(
            { error: 'Failed to delete offer' },
            { status: 500 }
        );
    }
}