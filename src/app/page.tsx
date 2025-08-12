"use client";

import React from "react";
import VacationOffersComparison from "./components/VacationOffersComparison";

const HomePage: React.FC = () => {
    return (
        <main className="min-h-screen bg-gray-900 text-white">
            {/*<header className="p-6 max-w-7xl mx-auto">*/}
            {/*</header>*/}

            <section className="max-w-8xl mx-auto">
                <VacationOffersComparison />
            </section>

            <footer className="mt-12 p-6 text-center text-xs text-gray-500">
               Jakub Urbański
            </footer>
        </main>
    );
};

export default HomePage;