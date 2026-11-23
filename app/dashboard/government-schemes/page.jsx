"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Calendar, Building2, Filter, ShieldCheck, CheckCircle2, Search, HeartHandshake } from "lucide-react";

export default function GovernmentSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("insurance");
  const [searchFilter, setSearchFilter] = useState("");

  const categories = [
    { id: "insurance", name: "Maharashtra Health Insurance & Cashless Hospitalization", emoji: "🛡️" },
    { id: "maternal", name: "Maharashtra Maternal & Child Welfare Schemes", emoji: "🤱" },
    { id: "disease", name: "Maharashtra Disease Control & Eradication (TB / Malaria)", emoji: "🦠" },
    { id: "primary", name: "Maharashtra Primary Care & Aapla Dawakhana Clinics", emoji: "🏥" },
    { id: "nutrition", name: "Maharashtra Nutrition & Malnutrition Elimination", emoji: "🍎" },
    { id: "ayush", name: "Maharashtra Traditional & AYUSH Medicine Mission", emoji: "🌿" },
    { id: "rural", name: "Maharashtra Rural, Forest & Tribal Health Networks", emoji: "🌲" },
    { id: "mental", name: "Maharashtra Mental Health & Tele-MANAS Support", emoji: "🧠" }
  ];

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/health-news?category=${selectedCategory}&type=schemes`);
      const data = await response.json();
      setSchemes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching schemes:", error);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSchemes();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSchemes();
  }, [selectedCategory]);

  const filteredSchemes = schemes.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.snippet && s.snippet.toLowerCase().includes(q)) ||
      (s.eligibility && s.eligibility.toLowerCase().includes(q)) ||
      (s.benefits && s.benefits.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-black dark:text-white p-4 sm:p-6 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-600 to-blue-600 dark:from-emerald-400 dark:to-teal-300">
              Maharashtra Government Healthcare Schemes
            </h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
            Access free hospitalization, maternity benefits, subsidized diagnostic tests, and welfare programs offered by the Government of Maharashtra and Central Health Missions.
          </p>
        </div>

        {/* Filter and Search Box */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 sm:p-6 border border-emerald-200 dark:border-gray-700 shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Category Dropdown */}
            <div className="md:col-span-6 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Scheme Sector:</label>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-black dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search scheme by keyword..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-black dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Refresh Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Category Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                {cat.emoji} {cat.name.split(" ")[1] || cat.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            <p className="text-gray-600 dark:text-gray-300">Retrieving official government program guidelines...</p>
          </div>
        )}

        {/* Schemes List */}
        {!loading && (
          <div className="space-y-6">
            {filteredSchemes.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Building2 className="w-14 h-14 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">No schemes found</h3>
                <p className="text-gray-500 text-sm">Try clearing your search query or choosing another program sector.</p>
              </div>
            ) : (
              filteredSchemes.map((scheme, index) => (
                <div
                  key={index}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 shadow-md hover:shadow-lg group"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-snug flex-1">
                      {scheme.title}
                    </h2>
                    <a
                      href={scheme.link || "https://arogya.maharashtra.gov.in"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm self-start sm:self-auto shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Official Portal / Apply
                    </a>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {scheme.snippet}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {scheme.eligibility && (
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs">
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Eligibility Criteria:
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.eligibility}</p>
                      </div>
                    )}

                    {scheme.benefits && (
                      <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-100 dark:border-teal-900 text-xs">
                        <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          Key Health Benefits:
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.benefits}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-3">
                      {scheme.source && (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md">
                          {scheme.source}
                        </span>
                      )}
                      {scheme.date && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{scheme.date}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <HeartHandshake className="w-3.5 h-3.5" /> Government of Maharashtra Initiative
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}