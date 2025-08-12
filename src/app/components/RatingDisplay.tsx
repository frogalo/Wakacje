// components/RatingDisplay.tsx
import React, { useState, useEffect } from "react";
import { Star, Users } from "lucide-react";

interface RatingDisplayProps {
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    label: string;
}

interface ParsedRating {
    stars?: number;
    maxStars?: number;
    score?: number;
    reviewCount?: number;
    description?: string;
    rawString?: string;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
                                                         value,
                                                         isEditing,
                                                         onChange,
                                                     }) => {
    const [rating, setRating] = useState<ParsedRating | null>(null);

    useEffect(() => {
        setRating(parseRating(value));
    }, [value]);

    const parseRating = (ratingString: string): ParsedRating | null => {
        if (!ratingString || !ratingString.trim()) return null;

        // Try to parse star ratings like "★ 4,2 – Bardzo dobry (≈ 698 opinii)"
        const starRegex = /★\s*([0-9,.]+)(?:\/([0-9,.]+))?\s*(?:[–-]\s*([^(]+))?\s*(?:\(≈?\s*([0-9,.]+)\s*([^)]+)\))?/i;
        const starMatch = ratingString.trim().match(starRegex);

        if (starMatch) {
            const [, scoreStr, maxStarsStr, description, reviewCountStr] = starMatch;

            // Convert comma-separated decimals to dots for parseFloat
            const score = parseFloat(scoreStr.replace(',', '.'));
            const maxStars = maxStarsStr ? parseFloat(maxStarsStr.replace(',', '.')) : 5;
            const reviewCount = reviewCountStr ? parseFloat(reviewCountStr.replace(/[,.]/g, '')) : undefined;

            return {
                stars: score,
                maxStars,
                score,
                description: description?.trim(),
                reviewCount,
                rawString: ratingString.trim()
            };
        }

        // Try to parse score/max format like "4.29/5 (56 recenzji)"
        const scoreRegex = /([0-9,.]+)\/([0-9,.]+)(?:\s*\(([0-9,.]+)\s*([^)]+)\))?/i;
        const scoreMatch = ratingString.trim().match(scoreRegex);

        if (scoreMatch) {
            const [, scoreStr, maxScoreStr, reviewCountStr] = scoreMatch;

            const score = parseFloat(scoreStr.replace(',', '.'));
            const maxScore = parseFloat(maxScoreStr.replace(',', '.'));
            const reviewCount = reviewCountStr ? parseFloat(reviewCountStr.replace(/[,.]/g, '')) : undefined;

            return {
                score,
                maxStars: maxScore,
                stars: score,
                reviewCount,
                rawString: ratingString.trim()
            };
        }

        // Fallback: store as raw string
        return { rawString: ratingString.trim() };
    };

    if (isEditing) {
        return (
            <div className="space-y-4">
                <div>
                    <textarea
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder='Np. "★ 4,2 – Bardzo dobry (≈ 698 opinii)" lub "4.29/5 (56 recenzji)"'
                        rows={2}
                    />
                    <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-800/50 rounded-lg">
                        <p className="mb-1">💡 <strong>Format:</strong> ★ [OCENA] – [OPIS] ([LICZBA] opinii) lub [OCENA]/[MAX] ([LICZBA] recenzji)</p>
                        <p className="text-slate-500">Przykłady: &quot;★ 4,2 – Bardzo dobry (≈ 698 opinii)&quot; lub &quot;4.29/5 (56 recenzji)&quot;</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!rating || (!rating.stars && !rating.score && !rating.rawString)) {
        return (
            <div className="text-slate-400 italic bg-slate-700/30 rounded-xl p-4 border-2 border-dashed border-slate-600">
                <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>Brak informacji o ocenie</span>
                </div>
            </div>
        );
    }

    // If we only have raw string, display it
    if ((rating.rawString && !rating.stars && !rating.score) || (!rating.stars && !rating.score)) {
        return (
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="p-2 bg-amber-500 rounded-lg">
                        <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-amber-300 font-semibold">Ocena</span>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 font-mono text-sm text-white">
                    {rating.rawString}
                </div>
            </div>
        );
    }

    // Calculate stars to display
    const starCount = rating.stars || rating.score || 0;
    const maxStars = rating.maxStars || 5;
    const normalizedStars = (starCount / maxStars) * 5; // Normalize to 5-star scale for display

    // Full parsed rating display
    return (
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-amber-500 rounded-lg">
                    <Star className="w-4 h-4 text-white" />
                </div>
                <span className="text-amber-300 font-semibold">Ocena</span>
            </div>

            <div className="flex flex-col space-y-3">
                {/* Star visualization */}
                <div className="flex items-center justify-center">
                    <div className="relative w-48 h-12 flex items-center justify-center">
                        {/* Background stars (empty) */}
                        <div className="flex absolute">
                            {[...Array(5)].map((_, i) => (
                                <Star key={`bg-${i}`} className="w-8 h-8 text-slate-700" fill="currentColor" />
                            ))}
                        </div>

                        {/* Foreground stars (filled) - width based on rating */}
                        <div className="flex absolute overflow-hidden" style={{ width: `${(normalizedStars / 5) * 100}%` }}>
                            {[...Array(5)].map((_, i) => (
                                <Star key={`fg-${i}`} className="w-8 h-8 text-yellow-400" fill="currentColor" />
                            ))}
                        </div>

                        {/* Rating number */}
                        <div className="absolute -right-12 bg-amber-500/20 rounded-lg px-2 py-1">
                            <span className="text-amber-300 font-semibold">{starCount.toFixed(1)}</span>
                            {maxStars !== 5 && <span className="text-slate-400 text-xs">/{maxStars}</span>}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {rating.description && (
                    <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                        <span className="text-white font-medium">{rating.description}</span>
                    </div>
                )}

                {/* Review count */}
                {rating.reviewCount && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-300">
                        <Users className="w-4 h-4" />
                        <span>{rating.reviewCount} {rating.reviewCount === 1 ? 'opinia' : 'opinii'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RatingDisplay;