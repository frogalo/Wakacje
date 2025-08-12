"use client";

import React, { useEffect, useState } from "react";
import {
    MapPin, Globe, Building, Calendar, Users, DollarSign,
    Bed, Plane, Hash, Utensils, Navigation, Star, Wifi,
    Plus, Trash2, Edit3, Save, Sparkles, Heart, Loader2,
    Grid3X3, LayoutGrid, ChevronDown, ChevronUp,
    Award, Car, Home, Coffee, Camera, Shield, Info,
    CheckCircle, XCircle, ExternalLink, Phone, AlertCircle
} from "lucide-react";
import PriceDisplay from "./PriceDisplay";
import FlightDisplay from "./FlightDisplay";
import RatingDisplay from "./RatingDisplay";

type Column = {
    id: string;
    fieldId: string;
    label: string;
    icon?: string;
    order: number;
};

type Offer = {
    id: string;
    values: Record<string, string>;
};

// Enhanced icon mapping
const iconMap = {
    MapPin, Globe, Building, Calendar, Users, DollarSign,
    Bed, Plane, Hash, Utensils, Navigation, Star, Wifi,
    Plus, Trash2, Edit3, Save, Sparkles, Heart, Award,
    Car, Home, Coffee, Camera, Shield, Info, CheckCircle,
    XCircle, ExternalLink, Phone
};

const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || MapPin;
};

function slugify(label: string): string {
    if (!label) return `col-${Date.now()}`;
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// More precise field detection functions with safety checks
const isPriceField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const priceKeywords = ['cena', 'price', 'koszt', 'cost', 'kwota', 'amount', 'suma', 'total', 'w-sumie'];
    const negativeKeywords = ['ocena', 'rating', 'review', 'score', 'note'];

    const fieldLower = fieldId.toLowerCase();
    const labelLower = label.toLowerCase();

    // Don't match if it contains negative keywords
    if (negativeKeywords.some(keyword => fieldLower.includes(keyword) || labelLower.includes(keyword))) {
        return false;
    }

    return priceKeywords.some(keyword =>
        fieldLower.includes(keyword) || labelLower.includes(keyword)
    );
};

const isRatingField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const ratingKeywords = ['ocena', 'rating', 'review', 'score', 'gwiazdka', 'star', 'opinion'];
    return ratingKeywords.some(keyword =>
        fieldId.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
};

const isRoomField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const roomKeywords = ['pokoj', 'pokoje', 'room', 'rooms', 'accommodation', 'noclegi', 'willa', 'villa', 'apartament'];
    return roomKeywords.some(keyword =>
        fieldId.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
};

const isFlightField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const flightKeywords = ['lot', 'flight', 'samolot', 'wylot', 'powrot', 'departure', 'arrival', 'return'];
    return flightKeywords.some(keyword =>
        fieldId.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
};

const isAmenitiesField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const amenitiesKeywords = ['udogodnienia', 'amenities', 'facilities', 'wyposazenie', 'equipment'];
    return amenitiesKeywords.some(keyword =>
        fieldId.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
};

const isProsConsField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const prosConsKeywords = ['zalety', 'wady', 'pros', 'cons', 'advantages', 'disadvantages', 'plus', 'minus'];
    return prosConsKeywords.some(keyword =>
        fieldId.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
};

const isLinkField = (fieldId: string, label: string): boolean => {
    if (!fieldId || !label) return false;
    const linkKeywords = ['link', 'url', 'strona', 'website', 'booking', 'rezerwacja'];
    return linkKeywords.some(keyword =>
        fieldId.toLowerCase().includes(keyword) || label.toLowerCase().includes(keyword)
    );
};

const formatListValue = (value: string): string => {
    if (!value) return '';
    const lines = value.split('\n').filter(line => line.trim());
    if (lines.length <= 1) return value;
    return lines.map(line => line.startsWith('•') || line.startsWith('-') ? line : `• ${line.trim()}`).join('\n');
};

const formatProsConsValue = (value: string, isPositive: boolean = true): string => {
    if (!value) return '';
    const lines = value.split('\n').filter(line => line.trim());
    const icon = isPositive ? '✅' : '❌';
    return lines.map(line => `${icon} ${line.trim()}`).join('\n');
};

const VacationOffersComparison: React.FC = () => {
    const [columns, setColumns] = useState<Column[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [newColumnLabel, setNewColumnLabel] = useState("");
    const [editingOffer, setEditingOffer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [categoriesExpanded, setCategoriesExpanded] = useState(false);
    const [comparisonMode, setComparisonMode] = useState(false);

    // Fetch data on component mount
    useEffect(() => {
        fetchColumns();
        fetchOffers();
    }, []);

    const fetchColumns = async () => {
        try {
            const response = await fetch('/api/columns');
            const data = await response.json();
            setColumns(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch columns:', error);
            setColumns([]);
        }
    };

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/offers');
            const data = await response.json();
            setOffers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch offers:', error);
            setOffers([]);
        } finally {
            setLoading(false);
        }
    };

    const addOffer = async () => {
        // Safety check: prevent adding offers without categories
        if (!Array.isArray(columns) || columns.length === 0) {
            alert('Dodaj najpierw przynajmniej jedną kategorię przed utworzeniem oferty.');
            return;
        }

        try {
            setSaving(true);
            const values: Record<string, string> = {};
            columns.forEach((c) => {
                if (c && c.fieldId) {
                    values[c.fieldId] = "";
                }
            });

            const response = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values })
            });

            const newOffer = await response.json();
            if (newOffer && newOffer.id) {
                setOffers(prev => [newOffer, ...prev]);
            }
        } catch (error) {
            console.error('Failed to add offer:', error);
            alert('Nie udało się dodać oferty. Spróbuj ponownie.');
        } finally {
            setSaving(false);
        }
    };

    const updateCell = async (offerId: string, fieldId: string, value: string) => {
        if (!offerId || !fieldId) return;

        setOffers(list =>
            list.map(offer =>
                offer && offer.id === offerId
                    ? {
                        ...offer,
                        values: {
                            ...offer.values,
                            [fieldId]: value,
                        },
                    }
                    : offer
            )
        );

        const offer = offers.find(o => o && o.id === offerId);
        if (offer && offer.values) {
            const updatedValues = { ...offer.values, [fieldId]: value };

            try {
                await fetch(`/api/offers/${offerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values: updatedValues })
                });
            } catch (error) {
                console.error('Failed to update offer:', error);
            }
        }
    };

    const deleteOffer = async (offerId: string) => {
        if (!offerId) return;

        try {
            await fetch(`/api/offers/${offerId}`, {
                method: 'DELETE'
            });
            setOffers(list => list.filter(o => o && o.id !== offerId));
            setEditingOffer(null);
        } catch (error) {
            console.error('Failed to delete offer:', error);
        }
    };

    const addColumn = async () => {
        const label = newColumnLabel.trim();
        if (!label) return;

        const fieldId = slugify(label);

        // Suggest appropriate icon based on field type
        let suggestedIcon = "Hash";
        if (isPriceField(fieldId, label)) suggestedIcon = "DollarSign";
        else if (isRatingField(fieldId, label)) suggestedIcon = "Star";
        else if (isFlightField(fieldId, label)) suggestedIcon = "Plane";
        else if (isRoomField(fieldId, label)) suggestedIcon = "Bed";
        else if (isAmenitiesField(fieldId, label)) suggestedIcon = "Wifi";
        else if (isProsConsField(fieldId, label)) suggestedIcon = "CheckCircle";
        else if (isLinkField(fieldId, label)) suggestedIcon = "ExternalLink";
        else if (label.toLowerCase().includes('lokalizacja') || label.toLowerCase().includes('location')) suggestedIcon = "MapPin";
        else if (label.toLowerCase().includes('kategoria') || label.toLowerCase().includes('category')) suggestedIcon = "Building";

        try {
            const response = await fetch('/api/columns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fieldId,
                    label,
                    icon: suggestedIcon
                })
            });

            const newColumn = await response.json();
            if (newColumn && newColumn.id) {
                setColumns(prev => [...prev, newColumn]);
                setNewColumnLabel("");
                await fetchOffers();
            }
        } catch (error) {
            console.error('Failed to add column:', error);
            alert('Nie udało się dodać kategorii. Spróbuj ponownie.');
        }
    };

    const removeColumn = async (fieldId: string) => {
        if (!fieldId) return;

        try {
            await fetch(`/api/columns?fieldId=${fieldId}`, {
                method: 'DELETE'
            });
            setColumns(prev => prev.filter(c => c && c.fieldId !== fieldId));
            await fetchOffers();
        } catch (error) {
            console.error('Failed to remove column:', error);
        }
    };

    // Helper to get person count from offers for price calculation with safety checks
    const getPersonCount = (offer: Offer): number => {
        if (!offer || !offer.values || !Array.isArray(columns) || columns.length === 0) return 1;

        const personField = columns.find(col =>
                col && col.fieldId && col.label && (
                    col.fieldId.toLowerCase().includes('osob') ||
                    col.label.toLowerCase().includes('osob') ||
                    col.fieldId.toLowerCase().includes('person') ||
                    col.label.toLowerCase().includes('person') ||
                    col.fieldId.toLowerCase().includes('people')
                )
        );

        if (personField && personField.fieldId) {
            const count = parseInt(offer.values[personField.fieldId] || '1');
            return isNaN(count) || count < 1 ? 1 : count;
        }
        return 1;
    };

    // Helper to get duration from offers with safety checks
    const getDurationDays = (offer: Offer): number => {
        if (!offer || !offer.values || !Array.isArray(columns) || columns.length === 0) return 7;

        const durationField = columns.find(col =>
                col && col.fieldId && col.label && (
                    col.fieldId.toLowerCase().includes('dni') ||
                    col.fieldId.toLowerCase().includes('days') ||
                    col.fieldId.toLowerCase().includes('duration') ||
                    col.label.toLowerCase().includes('dni') ||
                    col.label.toLowerCase().includes('days') ||
                    col.label.toLowerCase().includes('noc')
                )
        );

        if (durationField && durationField.fieldId) {
            const days = parseInt(offer.values[durationField.fieldId] || '7');
            return isNaN(days) || days < 1 ? 7 : days;
        }
        return 7;
    };

    // Helper to get price comparison data with safety checks
    const getPriceComparison = () => {
        if (!Array.isArray(columns) || !Array.isArray(offers) || columns.length === 0 || offers.length === 0) {
            return [];
        }

        const priceFields = columns.filter(col => col && col.fieldId && col.label && isPriceField(col.fieldId, col.label));
        if (priceFields.length === 0) return [];

        return offers.filter(offer => offer && offer.values).map((offer, index) => {
            const personCount = getPersonCount(offer);
            const durationDays = getDurationDays(offer);

            // Get the main price field (total or per person)
            const mainPriceField = priceFields.find(col =>
                    col && col.label && (
                        col.label.toLowerCase().includes('suma') ||
                        col.label.toLowerCase().includes('total') ||
                        col.label.toLowerCase().includes('w-sumie')
                    )
            ) || priceFields[0];

            const priceValue = (mainPriceField && offer.values[mainPriceField.fieldId]) || '0';

            let totalPrice: number;
            try {
                const parsed = JSON.parse(priceValue);
                totalPrice = parsed.total || 0;
            } catch {
                totalPrice = parseFloat(priceValue.replace(/[^\d.-]/g, '')) || 0;
            }

            return {
                id: offer.id,
                name: offer.values.destination || offer.values.hotel || offer.values.lokalizacja || `Oferta ${index + 1}`,
                totalPrice,
                pricePerPerson: personCount > 0 ? totalPrice / personCount : totalPrice,
                pricePerDay: durationDays > 0 ? totalPrice / durationDays : totalPrice,
                pricePerPersonPerDay: durationDays > 0 && personCount > 0 ? totalPrice / (durationDays * personCount) : totalPrice,
                personCount,
                durationDays
            };
        }).filter(item => item && item.totalPrice > 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Ładowanie danych...
                    </p>
                </div>
            </div>
        );
    }

    // Show welcome screen if no categories and no offers exist
    if (!Array.isArray(columns) || !Array.isArray(offers) || (columns.length === 0 && offers.length === 0)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4 py-8">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            ✈️ Wakacje 2025
                        </h1>
                        <p className="text-xl text-slate-300">Zacznij planować swoje wymarzone wakacje</p>
                    </div>

                    {/* Welcome Card */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-3xl p-12 border border-slate-600/30">
                        <div className="text-center space-y-8">
                            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                                <Sparkles className="w-12 h-12 text-white" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold text-white">
                                    Witamy w porównywarkach wakacji!
                                </h2>
                                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                                    Zanim zaczniesz dodawać oferty, musisz utworzyć kategorie (pola) dla swoich danych.
                                    Na przykład: Lokalizacja, Cena, Hotel, Ocena, itp.
                                </p>
                            </div>

                            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-600/20">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                                        <Info className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-white mb-2">Jak zacząć?</h3>
                                        <ol className="text-slate-300 space-y-2 text-sm">
                                            <li>1. Dodaj kategorie (np. &#34;Lokalizacja&#34;, &#34;Cena za json&#34;, &#34;Hotel&#34;)</li>
                                            <li>2. Utwórz swoją pierwszą ofertę wakacyjną</li>
                                            <li>3. Wypełnij szczegóły i porównuj opcje</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="max-w-md mx-auto">
                                    <input
                                        className="w-full px-6 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-lg"
                                        placeholder="Dodaj pierwszą kategorię (np. 'Lokalizacja')"
                                        value={newColumnLabel}
                                        onChange={(e) => setNewColumnLabel(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") addColumn();
                                        }}
                                    />
                                </div>
                                <button
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold flex items-center justify-center space-x-3 mx-auto transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-lg"
                                    onClick={addColumn}
                                    disabled={!newColumnLabel.trim()}
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Utwórz pierwszą kategorię</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-9xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        ✈️ Wakacje 2025
                    </h1>
                </div>

                {/* Column Management Panel */}
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-600/30">
                    <button
                        onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                        className="w-full p-6 flex items-center justify-between hover:bg-slate-700/20 rounded-3xl transition-all"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                                <Building className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-3xl font-bold text-white">Kategorie ({columns.length})</h2>
                                <p className="text-slate-300">Zarządzaj polami dla swoich ofert</p>
                            </div>
                        </div>
                        {categoriesExpanded ? (
                            <ChevronUp className="w-6 h-6 text-slate-300" />
                        ) : (
                            <ChevronDown className="w-6 h-6 text-slate-300" />
                        )}
                    </button>

                    {categoriesExpanded && (
                        <div className="px-8 pb-8">
                            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2">
                                    <input
                                        className="w-full px-6 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-lg"
                                        placeholder="Nowa kategoria (np. 'Lokalizacja', 'Ocena', 'Cena za osobę', 'Lot Wylotowy', 'Pokoje')"
                                        value={newColumnLabel}
                                        onChange={(e) => setNewColumnLabel(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") addColumn();
                                        }}
                                    />
                                </div>
                                <button
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold flex items-center justify-center space-x-3 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none text-lg"
                                    onClick={addColumn}
                                    disabled={!newColumnLabel.trim()}
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Dodaj kategorię</span>
                                </button>
                            </div>

                            {columns.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {columns.map((col) => {
                                        if (!col || !col.id) return null;
                                        const IconComponent = getIcon(col.icon || "Hash");
                                        return (
                                            <div key={col.id} className="group bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 hover:border-blue-500/50 transition-all transform hover:scale-105">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                                                            <IconComponent className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                                                                {col.label || 'Bez nazwy'}
                                                            </h3>
                                                            <p className="text-sm text-slate-400 font-mono">
                                                                {col.fieldId || 'brak-id'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all"
                                                        onClick={() => removeColumn(col.fieldId)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-600/20 max-w-md mx-auto">
                                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                                        <p className="text-slate-300">Brak kategorii. Dodaj pierwszą kategorię powyżej.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Offers Section */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">
                                    Oferty ({offers.length})
                                </h2>
                                <p className="text-slate-300">Twoje wakacyjne propozycje</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {offers.length > 1 && (
                                <div className="flex bg-slate-800/50 rounded-2xl p-1">
                                    <button
                                        className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                                            viewMode === 'cards'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                        onClick={() => setViewMode('cards')}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        <span>Karty</span>
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                                            viewMode === 'table'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                        onClick={() => setViewMode('table')}
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                        <span>Tabela</span>
                                    </button>
                                </div>
                            )}

                            <button
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold flex items-center space-x-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                onClick={addOffer}
                                disabled={saving || columns.length === 0}
                                title={columns.length === 0 ? "Dodaj najpierw kategorie" : ""}
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Plus className="w-5 h-5" />
                                )}
                                <span>Dodaj ofertę</span>
                            </button>
                        </div>
                    </div>

                    {/* Price Comparison Table */}
                    {comparisonMode && offers.length > 1 && (
                        <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-3xl p-8 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white">Porównanie Cen</h3>
                                <button
                                    onClick={() => setComparisonMode(false)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all"
                                >
                                    Zamknij porównanie
                                </button>
                            </div>

                            {(() => {
                                const comparison = getPriceComparison();
                                if (comparison.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-slate-400">
                                            <p className="mb-4">Brak ofert z cenami do porównania</p>
                                            <p className="text-sm">Dodaj pole &quot;Cena&quot; lub &quot;W sumie&quot; i wypełnij ceny w oferach aby zobaczyć porównanie.</p>
                                        </div>
                                    );
                                }

                                const bestTotal = Math.min(...comparison.map(c => c.totalPrice));
                                const bestPerPerson = Math.min(...comparison.map(c => c.pricePerPerson));
                                const bestPerDay = Math.min(...comparison.map(c => c.pricePerDay));
                                const bestPerPersonPerDay = Math.min(...comparison.map(c => c.pricePerPersonPerDay));

                                return (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                            <tr className="border-b border-slate-600">
                                                <th className="text-left p-4 text-slate-300">Oferta</th>
                                                <th className="text-right p-4 text-slate-300">Cena całkowita</th>
                                                <th className="text-right p-4 text-slate-300">Na osobę</th>
                                                <th className="text-right p-4 text-slate-300">Za dzień</th>
                                                <th className="text-right p-4 text-slate-300">Os./dzień</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {comparison.map((item) => (
                                                <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-white">{item.name}</div>
                                                    </td>
                                                    <td className={`p-4 text-right font-semibold ${item.totalPrice === bestTotal ? 'text-green-400 bg-green-500/10 rounded' : 'text-white'}`}>
                                                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(item.totalPrice)}
                                                        {item.totalPrice === bestTotal && <span className="ml-2">🏆</span>}
                                                    </td>
                                                    <td className={`p-4 text-right font-semibold ${item.pricePerPerson === bestPerPerson ? 'text-blue-400 bg-blue-500/10 rounded' : 'text-white'}`}>
                                                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(item.pricePerPerson)}
                                                        {item.pricePerPerson === bestPerPerson && <span className="ml-2">🏆</span>}
                                                    </td>
                                                    <td className={`p-4 text-right font-semibold ${item.pricePerDay === bestPerDay ? 'text-purple-400 bg-purple-500/10 rounded' : 'text-white'}`}>
                                                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(item.pricePerDay)}
                                                        {item.pricePerDay === bestPerDay && <span className="ml-2">🏆</span>}
                                                    </td>
                                                    <td className={`p-4 text-right font-semibold ${item.pricePerPersonPerDay === bestPerPersonPerDay ? 'text-yellow-400 bg-yellow-500/10 rounded' : 'text-white'}`}>
                                                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(item.pricePerPersonPerDay)}
                                                        {item.pricePerPersonPerDay === bestPerPersonPerDay && <span className="ml-2">🏆</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Offers Display */}
                    {offers.length > 0 ? (
                        viewMode === 'table' && offers.length > 1 ? (
                            // Table View - Complete implementation with safety checks
                            <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-700/50">
                                        <tr>
                                            <th className="p-4 text-left text-slate-200 font-semibold">Oferta</th>
                                            {columns.map((col) => {
                                                if (!col || !col.id) return null;
                                                return (
                                                    <th key={col.id} className="p-4 text-left text-slate-200 font-semibold min-w-[200px]">
                                                        <div className="flex items-center space-x-2">
                                                            {React.createElement(getIcon(col.icon || "Hash"), { className: "w-4 h-4" })}
                                                            <span>{col.label || 'Bez nazwy'}</span>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="p-4 text-center text-slate-200 font-semibold">Akcje</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {offers.map((offer, index) => {
                                            if (!offer || !offer.id) return null;
                                            return (
                                                <tr key={offer.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-white">
                                                            {(offer.values?.destination || offer.values?.hotel || offer.values?.lokalizacja) || `Oferta ${index + 1}`}
                                                        </div>
                                                        <div className="text-xs text-slate-400">#{offer.id.slice(-8)}</div>
                                                    </td>
                                                    {columns.map((col) => {
                                                        if (!col || !col.id) return null;
                                                        return (
                                                            <td key={col.id} className="p-4 max-w-xs">
                                                                {editingOffer === offer.id ? (
                                                                    <textarea
                                                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none"
                                                                        value={(offer.values && offer.values[col.fieldId]) || ""}
                                                                        onChange={(e) => updateCell(offer.id, col.fieldId, e.target.value)}
                                                                        rows={2}
                                                                    />
                                                                ) : (
                                                                    <div className="text-slate-200 text-sm">
                                                                        {offer.values && offer.values[col.fieldId] ? (
                                                                            <div className="truncate max-w-xs">
                                                                                {offer.values[col.fieldId]}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-400 italic">Brak danych</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-4">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                className={`p-2 rounded-lg transition-all ${
                                                                    editingOffer === offer.id
                                                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                }`}
                                                                onClick={() => setEditingOffer(editingOffer === offer.id ? null : offer.id)}
                                                            >
                                                                {editingOffer === offer.id ? (
                                                                    <Save className="w-4 h-4" />
                                                                ) : (
                                                                    <Edit3 className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                                                                onClick={() => deleteOffer(offer.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            // Cards View - Enhanced with specialized components and safety checks
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                {offers.map((offer, index) => {
                                    if (!offer || !offer.id) return null;

                                    return (
                                        <div key={offer.id} className="group bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-slate-600/30 hover:border-blue-500/50 transition-all  hover:-translate-y-2">
                                            {/* Offer Header */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center group-hover:from-rose-500 group-hover:to-pink-600 transition-all">
                                                        <Heart className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                                                            {(offer.values?.destination || offer.values?.hotel || offer.values?.lokalizacja) || `Oferta ${index + 1}`}
                                                        </h3>
                                                        <p className="text-sm text-slate-400 font-mono">#{offer.id.slice(-8)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
                                                            editingOffer === offer.id
                                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                        }`}
                                                        onClick={() => setEditingOffer(editingOffer === offer.id ? null : offer.id)}
                                                    >
                                                        {editingOffer === offer.id ? (
                                                            <Save className="w-4 h-4" />
                                                        ) : (
                                                            <Edit3 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all transform hover:scale-110"
                                                        onClick={() => deleteOffer(offer.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Offer Fields */}
                                            <div className="space-y-4">
                                                {columns.map((col) => {
                                                    if (!col || !col.id || !col.fieldId) return null;

                                                    const IconComponent = getIcon(col.icon || "Hash");
                                                    const value = (offer.values && offer.values[col.fieldId]) || "";

                                                    return (
                                                        <div key={col.id} className="bg-slate-800/40 rounded-2xl p-4 border border-slate-600/20">
                                                            <div className="flex items-center space-x-3 mb-3">
                                                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                                                    <IconComponent className="w-4 h-4 text-white" />
                                                                </div>
                                                                <span className="font-semibold text-slate-200">{col.label || 'Bez nazwy'}</span>
                                                            </div>

                                                            {/* Use specialized components for different field types */}
                                                            {isPriceField(col.fieldId, col.label) ? (
                                                                <PriceDisplay
                                                                    value={value}
                                                                    isEditing={editingOffer === offer.id}
                                                                    personCount={getPersonCount(offer)}
                                                                    durationDays={getDurationDays(offer)}
                                                                    onChange={(newValue) => updateCell(offer.id, col.fieldId, newValue)}
                                                                    label={col.label}
                                                                />
                                                            ) : isRatingField(col.fieldId, col.label) ? (
                                                                <RatingDisplay
                                                                    value={value}
                                                                    isEditing={editingOffer === offer.id}
                                                                    onChange={(newValue) => updateCell(offer.id, col.fieldId, newValue)}
                                                                    label={col.label}
                                                                />
                                                            ) : isFlightField(col.fieldId, col.label) ? (
                                                                <FlightDisplay
                                                                    value={value}
                                                                    isEditing={editingOffer === offer.id}
                                                                    onChange={(newValue) => updateCell(offer.id, col.fieldId, newValue)}
                                                                    label={col.label}
                                                                />
                                                            ) : editingOffer === offer.id ? (
                                                                <textarea
                                                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                                    value={value}
                                                                    onChange={(e) => updateCell(offer.id, col.fieldId, e.target.value)}
                                                                    placeholder={`Wpisz ${col.label?.toLowerCase() || 'wartość'}...`}
                                                                    rows={isRoomField(col.fieldId, col.label) || isAmenitiesField(col.fieldId, col.label) || isProsConsField(col.fieldId, col.label) ? 5 : 3}
                                                                />
                                                            ) : (
                                                                <div className="text-white bg-slate-700/50 rounded-xl p-3 min-h-[60px] flex items-start">
                                                                    {value ? (
                                                                        <div className="w-full">
                                                                            {isLinkField(col.fieldId, col.label) && value.startsWith('http') ? (
                                                                                <a
                                                                                    href={value}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 underline"
                                                                                >
                                                                                    <ExternalLink className="w-4 h-4" />
                                                                                    <span>Otwórz link</span>
                                                                                </a>
                                                                            ) : isProsConsField(col.fieldId, col.label) ? (
                                                                                <pre className="whitespace-pre-wrap text-sm font-sans w-full">
                                                                                    {formatProsConsValue(value, col.label?.toLowerCase()?.includes('zalety') || col.label?.toLowerCase()?.includes('pros'))}
                                                                                </pre>
                                                                            ) : isAmenitiesField(col.fieldId, col.label) || isRoomField(col.fieldId, col.label) ? (
                                                                                <pre className="whitespace-pre-wrap text-sm font-sans w-full">
                                                                                    {formatListValue(value)}
                                                                                </pre>
                                                                            ) : (
                                                                                <pre className="whitespace-pre-wrap text-sm font-sans w-full">
                                                                                    {value}
                                                                                </pre>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-400 italic">
                                                                            Brak danych dla {col.label?.toLowerCase() || 'tego pola'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        // Empty State for offers
                        <div className="text-center py-20">
                            <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto">
                                <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    Brak ofert
                                </h3>
                                <p className="text-slate-300 mb-8">
                                    Dodaj swoją pierwszą ofertę wakacyjną i zacznij zarządzać propozycjami
                                </p>
                                <button
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold flex items-center space-x-3 mx-auto transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                    onClick={addOffer}
                                    disabled={saving || columns.length === 0}
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Plus className="w-5 h-5" />
                                    )}
                                    <span>{columns.length === 0 ? 'Dodaj najpierw kategorie' : 'Dodaj pierwszą ofertę'}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VacationOffersComparison;