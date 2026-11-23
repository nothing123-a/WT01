"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, ExternalLink, Calendar, Globe, Filter, Newspaper, Sparkles } from "lucide-react";

export default function HealthNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [searchFilter, setSearchFilter] = useState("");

  const categories = [
    { id: "general", name: "India General Health", emoji: "🏥" },
    { id: "mental", name: "India Mental Health", emoji: "🧠" },
    { id: "cardiology", name: "India Cardiology", emoji: "❤️" },
    { id: "diabetes", name: "India Diabetes Care", emoji: "🩸" },
    { id: "cancer", name: "India Cancer Treatment", emoji: "🎗️" },
    { id: "pediatrics", name: "India Child Health", emoji: "👶" },
    { id: "neurology", name: "India Neurology", emoji: "⚡" },
    { id: "orthopedics", name: "India Orthopedics", emoji: "🦴" },
    { id: "dermatology", name: "India Skin Care", emoji: "✨" },
    { id: "gynecology", name: "India Women Health", emoji: "🌸" },
    { id: "ophthalmology", name: "India Eye Care", emoji: "👁️" },
    { id: "dentistry", name: "India Dental Care", emoji: "🦷" },
    { id: "nutrition", name: "India Nutrition", emoji: "🥗" },
    { id: "pharmacy", name: "India Pharmacy", emoji: "💊" },
    { id: "emergency", name: "India Emergency Services", emoji: "🚑" }
  ];

  const fetchNews = async () => {
    try {
      setLoading(true);
      const url = `/api/health-news?category=${selectedCategory}&type=news`;
      const response = await fetch(url);
      const data = await response.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching news:", error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const filteredNews = news.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.snippet && item.snippet.toLowerCase().includes(q)) ||
      (item.source && item.source.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 text-black dark:text-white p-4 sm:p-6 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              India Healthcare Updates & News
            </h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
            Stay informed with verified medical breakthroughs, clinical policies, and public health advisories across India.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-gray-700 shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Category Dropdown */}
            <div className="md:col-span-6 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200">Category:</label>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-black dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search Filter */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter stories..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-black dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Refresh Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Categories Pills */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                {cat.emoji} {cat.name.replace("India ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading verified healthcare dispatches...</p>
          </div>
        )}

        {/* News Grid */}
        {!loading && (
          <div className="space-y-5">
            {filteredNews.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Globe className="w-14 h-14 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">No articles matched</h3>
                <p className="text-gray-500 text-sm">Try clearing your search filter or selecting another category.</p>
              </div>
            ) : (
              filteredNews.map((article, index) => (
                <div
                  key={index}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 shadow-md hover:shadow-lg group"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug flex-1">
                      {article.title}
                    </h2>
                    <a
                      href={article.link || "https://mohfw.gov.in"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:hover:bg-blue-600 dark:text-blue-300 rounded-xl text-xs font-semibold transition-all border border-blue-200 dark:border-blue-800 self-start sm:self-auto shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Read Report
                    </a>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {article.snippet}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-3">
                      {article.source && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          {article.source}
                        </span>
                      )}
                      {article.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{article.date}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Verified Health Dispatch
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