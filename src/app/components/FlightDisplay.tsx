// components/FlightDisplay.tsx
import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { Plane, Clock, Calendar, ArrowRight, MapPin } from "lucide-react";

interface FlightDisplayProps {
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void; // Expects a string to be passed back
    label: string;
}

interface ParsedFlight {
    from: string;
    to: string;
    date?: string;
    departureTime?: string;
    arrivalTime?: string;
    airline?: string;
    flightNumber?: string;
    rawString?: string; // Keep rawString for fallback display
}

const FlightDisplay: React.FC<FlightDisplayProps> = ({
                                                         value,
                                                         isEditing,
                                                         onChange,
                                                     }) => {
    // Memoize parseFlight function to ensure stability and correct dependency tracking
    const parseFlight = useCallback((flightString: string): ParsedFlight | null => {
        if (!flightString || !flightString.trim()) return null;

        // Enhanced regex to capture flight details
        // Format: FROM DD.MM HH:MM -> TO HH:MM | Airline FLIGHTNUM
        // Handles optional date and times
        const regex = /^([A-Z]{3})\s*(?:(\d{2}\.\d{2})\s*(\d{2}:\d{2}))?\s*[→-]\s*([A-Z]{3})\s*(\d{2}:\d{2})?\s*(?:\|\s*(.+))?/i;
        const match = flightString.trim().match(regex);

        if (match) {
            const [, from, date, departureTime, to, arrivalTime, additionalInfo] = match;
            const parsed: ParsedFlight = {
                from: from || "",
                to: to || "",
                date: date || undefined,
                departureTime: departureTime || undefined,
                arrivalTime: arrivalTime || undefined,
            };

            if (additionalInfo) {
                // Parse airline and flight number
                const airlineMatch = additionalInfo.match(/^(.*?)(?:\s+([A-Z0-9]+))?$/);
                if (airlineMatch) {
                    parsed.airline = airlineMatch[1].trim();
                    parsed.flightNumber = airlineMatch[2] || undefined;
                } else {
                    parsed.airline = additionalInfo.trim(); // If no flight number found, assume it's just the airline name
                }
            }
            return parsed;
        }

        // Fallback: store the original string if it doesn't match the expected format
        return { from: "", to: "", rawString: flightString.trim() };
    }, []); // No dependencies needed as it only uses its argument

    // Initialize state with the parsed value
    const [flight, setFlight] = useState<ParsedFlight | null>(() => parseFlight(value));

    // Update state when the input value changes
    useEffect(() => {
        setFlight(parseFlight(value));
    }, [value, parseFlight]); // Add parseFlight to dependencies array


    if (isEditing) {
        return (
            <div className="space-y-4">
                <div>
                    <textarea
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                        value={value}
                        onChange={(e) => onChange(e.target.value)} // onChange correctly passes the string value
                        // Use escaped quotes for the placeholder text
                        placeholder={`Np. WAW 15.09 05:55 &rarr; RHO 09:30 | Enter Air ENT7991`}
                        rows={2}
                    />
                    <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-800/50 rounded-lg">
                        {/* Use escaped quotes */}
                        <p className="mb-1">💡 <strong>Format:</strong> LOTNISKO DD.MM HH:MM &rarr; LOTNISKO HH:MM \| LINIA FLIGHTNUM</p>
                        <p className="text-slate-500">Przykłady: &#34;WAW 15.09 05:55 &rarr; RHO 09:30 | Enter Air ENT7991&#34; lub &#34;KRK &rarr; BCN | Ryanair FR1234&#34;</p>
                    </div>
                </div>
            </div>
        );
    }

    // Handle cases where no valid flight data could be parsed
    if (!flight || (!flight.from && !flight.to && !flight.rawString)) {
        return (
            <div className="text-slate-400 italic bg-slate-700/30 rounded-xl p-4 border-2 border-dashed border-slate-600">
                <div className="flex items-center space-x-2">
                    <Plane className="w-5 h-5" />
                    <span>Brak informacji o locie</span>
                </div>
            </div>
        );
    }

    // Display raw string if parsing failed to extract key details (from/to)
    if (!flight.from || !flight.to) {
        return (
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg">
                        <Plane className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-blue-300 font-semibold">Informacje o locie</span>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 font-mono text-sm text-white">
                    {flight.rawString || "Nieznany format lotu"}
                </div>
            </div>
        );
    }

    // Full parsed flight display
    return (
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                    <Plane className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-300 font-semibold">Szczegóły lotu</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col items-center text-center flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div className="text-lg font-bold text-white">{flight.from}</div>
                    </div>
                    <div className="text-xs text-slate-400">Odlot</div>
                    {(flight.date || flight.departureTime) && (
                        <div className="mt-1 text-xs text-blue-300 flex items-center gap-2">
                            {flight.date && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{flight.date}</span>
                                </span>
                            )}
                            {flight.departureTime && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{flight.departureTime}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-none px-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                        <ArrowRight className="w-5 h-5 text-blue-400" />
                        <div className="h-px w-8 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div className="text-lg font-bold text-white">{flight.to}</div>
                    </div>
                    <div className="text-xs text-slate-400">Przylot</div>
                    {flight.arrivalTime && (
                        <div className="mt-1 text-xs text-blue-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{flight.arrivalTime}</span>
                        </div>
                    )}
                </div>
            </div>

            {(flight.airline || flight.flightNumber) && (
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-sm text-slate-300">
                        {flight.airline && <span className="mr-2 font-medium">{flight.airline}</span>}
                        {flight.flightNumber && (
                            <span className="font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                                {flight.flightNumber}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightDisplay;