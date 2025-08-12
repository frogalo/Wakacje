// components/PriceDisplay.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    Calculator,
    DollarSign,
    Home,
    Package,
    PieChart,
    TrendingUp,
} from "lucide-react";

interface PriceDisplayProps {
    value: string;
    isEditing: boolean;
    personCount: number;
    durationDays: number;
    onChange: (value: string) => void;
    label: string;
}

interface PriceBreakdown {
    flights?: number | null;
    accommodation?: number | null;
    food?: number | null;
    transport?: number | null;
    activities?: number | null;
    climate?: number | null;
    other?: number | null;
}

interface PriceData {
    total: number;
    breakdown?: PriceBreakdown;
    currency?: string;
    type?: "total" | "per-person" | "breakdown";
    isAllInclusive?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
                                                       value,
                                                       isEditing,
                                                       onChange,
                                                       label,
                                                       personCount,
                                                       durationDays,
                                                   }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);

    // Memoize parsePrice with label as dependency
    const parsePrice = useCallback((priceString: string): PriceData => {
        if (!priceString || !priceString.trim()) {
            return { total: 0, currency: "PLN", type: "total" };
        }

        try {
            const parsed = JSON.parse(priceString);
            if (typeof parsed === "object" && parsed.total !== undefined) {
                // Ensure breakdown keys exist and are sanitized
                const sanitizedBreakdown: PriceBreakdown = {
                    flights: parsed.breakdown?.flights ?? null,
                    accommodation: parsed.breakdown?.accommodation ?? null,
                    food: parsed.breakdown?.food ?? null,
                    transport: parsed.breakdown?.transport ?? null,
                    activities: parsed.breakdown?.activities ?? null,
                    climate: parsed.breakdown?.climate ?? null,
                    other: parsed.breakdown?.other ?? null,
                };
                return {
                    total: parsed.total || 0,
                    breakdown: sanitizedBreakdown,
                    currency: parsed.currency || "PLN",
                    type: parsed.type || "total",
                    isAllInclusive: parsed.isAllInclusive || false,
                };
            }
        } catch (e) {
            // Log the actual error for debugging purposes
            console.error("JSON parsing failed:", e);
        }

        let currency = "PLN";
        const currencyMatch = priceString.match(/(PLN|EUR|USD|GBP)/i);
        if (currencyMatch) {
            currency = currencyMatch[1].toUpperCase();
        }

        const numericValue = parseFloat(priceString.replace(/[^\d.-]/g, ""));
        const total = isNaN(numericValue) ? 0 : numericValue;

        const isPerPersonContext =
            label.toLowerCase().includes("osob") ||
            label.toLowerCase().includes("person") ||
            label.toLowerCase().includes("per person");

        return {
            total,
            currency,
            type: isPerPersonContext ? "per-person" : "total",
            isAllInclusive:
                label.toLowerCase().includes("inclusive") ||
                label.toLowerCase().includes("all-in"),
        };
    }, [label]); // Include label in dependencies

    const [priceData, setPriceData] = useState<PriceData>(() => parsePrice(value));

    useEffect(() => {
        setPriceData(parsePrice(value));
    }, [value, parsePrice]);

    // Rest of your component remains the same...
    // [All the remaining code stays exactly as it was]

    // Calculations based on props and parsed data
    const baseTotal = priceData.total || 0;
    const isPerPersonRate = priceData.type === "per-person";

    // Ensure personCount and durationDays are valid numbers for calculations
    const validPersonCount = personCount > 0 ? personCount : 1;
    const validDurationDays = durationDays > 0 ? durationDays : 1;

    // Grand total for the entire stay for everyone
    const grandTotalCost = isPerPersonRate
        ? baseTotal * validPersonCount
        : baseTotal;

    // Derived calculations for display
    const displayPricePerPerson =
        isPerPersonRate
            ? baseTotal // If rate is per person, show that base rate
            : grandTotalCost / validPersonCount; // Otherwise, calculate from grand total

    const displayPricePerDay = grandTotalCost / validDurationDays;

    const displayPricePerPersonPerDay = grandTotalCost / (validDurationDays * validPersonCount);

    const formatCurrency = (amount: number | null | undefined, curr: string = priceData.currency || "PLN"): string => {
        if (amount === null || amount === undefined || isNaN(amount)) return "N/A";
        return new Intl.NumberFormat("pl-PL", {
            style: "currency",
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const updatePrice = (newData: Partial<PriceData>) => {
        const updated = {...priceData, ...newData};

        // If breakdown is being updated, recalculate total and set type to 'breakdown'
        if (newData.breakdown !== undefined) {
            const breakdownTotal = Object.values(newData.breakdown).reduce(
                (sum, val) => sum + (typeof val === 'number' ? val : 0),
                0
            );
            updated.total = breakdownTotal;
            updated.type = "breakdown";
        } else {
            // If total is changed directly, ensure type is consistent
            if (newData.total !== undefined && updated.type === "breakdown") {
                updated.type = priceData.type === 'per-person' ? 'per-person' : 'total';
            }
        }

        const jsonString = JSON.stringify(updated);
        onChange(jsonString);
        setPriceData(updated);
    };

    const updateBreakdown = (key: keyof PriceBreakdown, amount: number | null) => {
        const currentBreakdown = priceData.breakdown || {};
        const newBreakdown = {...currentBreakdown, [key]: amount};
        updatePrice({breakdown: newBreakdown});
    };

    // --- Rendering Logic ---

    if (isEditing) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                showBreakdown
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                        >
                            <PieChart className="w-3 h-3 inline mr-1"/>
                            {showBreakdown ? "Prosta cena" : "Rozpisz koszty"}
                        </button>

                        {!showBreakdown && (
                            <button
                                type="button"
                                onClick={() =>
                                    updatePrice({
                                        isAllInclusive: !priceData.isAllInclusive,
                                        type: priceData.isAllInclusive ? priceData.type : "per-person",
                                    })
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    priceData.isAllInclusive
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                                <Package className="w-3 h-3 inline mr-1"/>
                                {priceData.isAllInclusive ? "All-Inclusive" : "Osobne koszty"}
                            </button>
                        )}
                    </div>
                </div>

                {!showBreakdown ? (
                    <div className="space-y-3">
                        <div className="flex space-x-2">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                                    value={priceData.total ?? ""}
                                    onChange={(e) =>
                                        updatePrice({total: parseFloat(e.target.value) || 0})
                                    }
                                    placeholder="0.00"
                                />
                            </div>
                            <select
                                value={priceData.currency || "PLN"}
                                onChange={(e) => updatePrice({currency: e.target.value})}
                                className="px-3 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="PLN">PLN</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => updatePrice({type: "total"})}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                                    priceData.type === "total"
                                        ? "bg-blue-500 text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                                Cena całkowita
                            </button>
                            <button
                                type="button"
                                onClick={() => updatePrice({type: "per-person"})}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                                    priceData.type === "per-person"
                                        ? "bg-blue-500 text-white"
                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                            >
                                Za osobę
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <Home className="w-4 h-4 text-slate-400"/>
                            <span className="text-sm font-medium text-slate-300">
                                Szczegółowe koszty (np. dla Airbnb)
                            </span>
                        </div>

                        {[
                            {key: "accommodation", label: "🏠 Noclegi", placeholder: "Hotel/Airbnb za wszystkich"},
                            {key: "flights", label: "✈️ Loty", placeholder: "Bilety lotnicze"},
                            {key: "food", label: "🍽️ Wyżywienie", placeholder: "Jedzenie i napoje"},
                            {key: "transport", label: "🚗 Transport", placeholder: "Lotnisko-hotel, wynajem auta"},
                            {key: "activities", label: "🎯 Atrakcje", placeholder: "Wycieczki, bilety wstępu"},
                            {key: "climate", label: "🛡️ Opłata klimatyczna", placeholder: "Opłata klimatyczna"},
                            {key: "other", label: "💼 Inne", placeholder: "Dodatkowe koszty"},
                        ].map(({key, label, placeholder}) => (
                            <div key={key} className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-slate-300 w-28 flex-shrink-0">
                                    {label}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={priceData.breakdown?.[key as keyof PriceBreakdown] ?? ""}
                                    onChange={(e) =>
                                        updateBreakdown(
                                            key as keyof PriceBreakdown,
                                            parseFloat(e.target.value) || null
                                        )
                                    }
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}

                        <div className="pt-2 border-t border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-white">Suma:</span>
                                <span className="text-lg font-bold text-green-300">
                                    {formatCurrency(grandTotalCost)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {grandTotalCost > 0 && (
                    <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <Calculator className="w-4 h-4"/>
                            <span>Wyliczenia:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 ml-6 text-xs">
                            {(validPersonCount > 1 && (isPerPersonRate || priceData.type !== "total")) && (
                                <div>
                                    Na osobę:{" "}
                                    <span className="font-semibold text-blue-300">
                                        {formatCurrency(displayPricePerPerson)}
                                    </span>
                                </div>
                            )}
                            <div>
                                Za dzień:{" "}
                                <span className="font-semibold text-purple-300">
                                    {formatCurrency(displayPricePerDay)}
                                </span>
                            </div>
                            {validPersonCount > 1 && (
                                <div className="col-span-2">
                                    Os./dzień:{" "}
                                    <span className="font-semibold text-yellow-300">
                                        {formatCurrency(displayPricePerPersonPerDay)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Display mode
    if (!value || grandTotalCost === 0) {
        return (
            <div className="text-slate-400 italic bg-slate-700/30 rounded-xl p-4 border-2 border-dashed border-slate-600">
                <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5"/>
                    <span>Brak informacji o cenie</span>
                </div>
            </div>
        );
    }

    const hasBreakdown = priceData.breakdown && Object.values(priceData.breakdown).some(val => val !== null && val !== undefined && val !== 0);
    const isAllInclusive = priceData.isAllInclusive;

    return (
        <div
            className={`rounded-xl p-4 border ${
                isAllInclusive
                    ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20"
                    : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20"
            }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div
                        className={`p-2 rounded-lg ${
                            isAllInclusive ? "bg-green-500" : "bg-blue-500"
                        }`}
                    >
                        {isAllInclusive ? (
                            <Package className="w-4 h-4 text-white"/>
                        ) : (
                            <DollarSign className="w-4 h-4 text-white"/>
                        )}
                    </div>
                    <div>
                        <span
                            className={`font-semibold ${
                                isAllInclusive ? "text-green-300" : "text-blue-300"
                            }`}
                        >
                            {isAllInclusive
                                ? "All-Inclusive"
                                : hasBreakdown
                                    ? "Koszty szczegółowe"
                                    : "Cena"}
                        </span>
                        {priceData.type === "per-person" && (
                            <div className="text-xs text-slate-400">za osobę</div>
                        )}
                    </div>
                </div>
                <TrendingUp
                    className={`w-4 h-4 ${isAllInclusive ? "text-green-400" : "text-blue-400"}`}
                />
            </div>

            <div className="space-y-3">
                <div className="text-2xl font-bold text-white">
                    {formatCurrency(grandTotalCost)}
                </div>

                {hasBreakdown && (
                    <div className="bg-slate-800/30 rounded-lg p-3 space-y-1">
                        <div className="text-xs font-semibold text-slate-300 mb-2">
                            Podział kosztów:
                        </div>
                        {Object.entries(priceData.breakdown || {}).map(([key, amount]) => {
                            if (typeof amount !== 'number' || amount === 0) return null;

                            const labels: Record<string, string> = {
                                flights: "✈️ Loty",
                                accommodation: "🏠 Noclegi",
                                food: "🍽️ Wyżywienie",
                                transport: "🚗 Transport",
                                activities: "🎯 Atrakcje",
                                climate: "🛡️ Opłata Klimatyczna",
                                other: "💼 Inne",
                            };
                            return (
                                <div key={key} className="flex justify-between text-xs">
                                    <span className="text-slate-400">
                                        {labels[key] || key}:
                                    </span>
                                    <span className="text-slate-200">{formatCurrency(amount)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-xs">
                    {(validPersonCount > 1 && (isPerPersonRate || priceData.type !== "total")) && (
                        <div className="bg-slate-700/50 rounded-lg px-2 py-1 text-center">
                            <div className="text-slate-400">{isPerPersonRate ? "Cena bazowa/os." : "Na osobę (całkowita)"}</div>
                            <div className="font-semibold text-blue-300">
                                {formatCurrency(displayPricePerPerson)}
                            </div>
                        </div>
                    )}
                    <div className="bg-slate-700/50 rounded-lg px-2 py-1 text-center">
                        <div className="text-slate-400">Za dzień</div>
                        <div className="font-semibold text-purple-300">
                            {formatCurrency(displayPricePerDay)}
                        </div>
                    </div>
                    {validPersonCount > 1 && (
                        <div className="bg-slate-700/50 rounded-lg px-2 py-1 text-center">
                            <div className="text-slate-400">Os./dzień</div>
                            <div className="font-semibold text-yellow-300">
                                {formatCurrency(displayPricePerPersonPerDay)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceDisplay;