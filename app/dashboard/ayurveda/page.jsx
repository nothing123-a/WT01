"use client";

import { useState, useEffect } from "react";
import { Search, Leaf, Pill, ExternalLink, AlertTriangle, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Ayurveda() {
  const [diseaseQuery, setDiseaseQuery] = useState("");
  const [medicineQuery, setMedicineQuery] = useState("");
  const [diseaseResults, setDiseaseResults] = useState([]);
  const [medicineResults, setMedicineResults] = useState([]);
  const [loadingDisease, setLoadingDisease] = useState(false);
  const [loadingMedicine, setLoadingMedicine] = useState(false);

  const popularDiseases = [
    "Diabetes",
    "Hypertension",
    "Cough & Cold",
    "Joint Pain",
    "Acidity",
    "Anxiety & Stress",
    "Skin Care",
    "Immunity"
  ];

  const popularMedicines = [
    "Paracetamol",
    "Omeprazole",
    "Ibuprofen",
    "Metformin",
    "Cetirizine",
    "Atorvastatin"
  ];

  const fetchDefaultData = async () => {
    try {
      setLoadingDisease(true);
      setLoadingMedicine(true);
      const [resDisease, resMedicine] = await Promise.all([
        fetch("/api/ayurveda?type=disease"),
        fetch("/api/ayurveda?type=medicine")
      ]);
      const dataDisease = await resDisease.json();
      const dataMedicine = await resMedicine.json();
      if (Array.isArray(dataDisease)) setDiseaseResults(dataDisease);
      if (Array.isArray(dataMedicine)) setMedicineResults(dataMedicine);
    } catch (err) {
      console.error("Error loading initial Ayurveda data:", err);
    } finally {
      setLoadingDisease(false);
      setLoadingMedicine(false);
    }
  };

  useEffect(() => {
    fetchDefaultData();
  }, []);

  const searchByDisease = async (e, customQuery) => {
    if (e) e.preventDefault();
    const query = customQuery !== undefined ? customQuery : diseaseQuery;
    if (!query.trim()) return;

    setLoadingDisease(true);
    try {
      const response = await fetch(`/api/ayurveda?q=${encodeURIComponent(query)}&type=disease`);
      const data = await response.json();
      setDiseaseResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error searching disease:", error);
    } finally {
      setLoadingDisease(false);
    }
  };

  const searchByMedicine = async (e, customQuery) => {
    if (e) e.preventDefault();
    const query = customQuery !== undefined ? customQuery : medicineQuery;
    if (!query.trim()) return;

    setLoadingMedicine(true);
    try {
      const response = await fetch(`/api/ayurveda?q=${encodeURIComponent(query)}&type=medicine`);
      const data = await response.json();
      setMedicineResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error searching medicine:", error);
    } finally {
      setLoadingMedicine(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 text-black dark:text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🌿</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-emerald-600 to-amber-600 dark:from-green-400 dark:to-amber-400">
              AYUSH Natural Remedies & Alternatives
            </h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">
            Discover verified Ayurvedic, Yoga, Unani, Siddha & Homeopathy therapies and natural substitutes for common pharmaceuticals.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-100/90 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-4 mb-8 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-0.5">Clinical Disclaimer</h3>
            <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
              This repository is designed for educational guidance and integrative wellness. Always consult a qualified AYUSH practitioner or licensed physician before replacing prescribed medicines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search by Disease */}
          <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 border-2 border-green-300 dark:border-gray-700 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-300">Search by Condition</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Find classical AYUSH formulations for common ailments</p>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Quick Recommendations:</span>
              <div className="flex flex-wrap gap-1.5">
                {popularDiseases.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDiseaseQuery(d);
                      searchByDisease(null, d);
                    }}
                    className="text-xs px-2.5 py-1 bg-green-50 dark:bg-green-950/60 hover:bg-green-100 dark:hover:bg-green-900 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg transition-colors font-medium"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={searchByDisease} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={diseaseQuery}
                  onChange={(e) => setDiseaseQuery(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension, Cough & Cold"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-green-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loadingDisease}
                className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {loadingDisease ? "Finding Natural Remedies..." : "Search Natural Remedies"}
              </button>
            </form>

            {loadingDisease && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Searching AYUSH database...</p>
              </div>
            )}

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {diseaseResults.map((result, index) => (
                <div key={index} className="p-4 bg-green-50/70 dark:bg-gray-900/60 rounded-xl border border-green-200 dark:border-gray-700 hover:border-green-400 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-green-900 dark:text-green-300 text-base">{result.title}</h3>
                    {result.source && (
                      <span className="text-[10px] bg-green-200 dark:bg-green-900/80 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {result.source}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed">{result.snippet}</p>

                  {result.details && result.details.keyHerbs && (
                    <div className="mb-3 text-xs">
                      <span className="font-semibold text-green-800 dark:text-green-400">Key Herbs: </span>
                      <span className="text-gray-600 dark:text-gray-300">{result.details.keyHerbs.join(", ")}</span>
                    </div>
                  )}

                  {result.details && result.details.dosage && (
                    <div className="mb-3 text-xs bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-green-100 dark:border-gray-700">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Regimen:
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{result.details.dosage}</p>
                    </div>
                  )}

                  {result.details && result.details.precautions && (
                    <div className="mb-3 text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Note:
                      </div>
                      <p className="text-amber-900 dark:text-amber-200">{result.details.precautions}</p>
                    </div>
                  )}

                  <a
                    href={result.link || "https://ayush.gov.in"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400 hover:text-green-900 font-semibold text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Official AYUSH Reference
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Search by Medicine */}
          <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-6 border-2 border-orange-300 dark:border-gray-700 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
                <Pill className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-300">Search by Medicine</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Find natural substitutes for common pharmaceuticals</p>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">Popular Pharmaceuticals:</span>
              <div className="flex flex-wrap gap-1.5">
                {popularMedicines.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMedicineQuery(m);
                      searchByMedicine(null, m);
                    }}
                    className="text-xs px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors font-medium"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={searchByMedicine} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={medicineQuery}
                  onChange={(e) => setMedicineQuery(e.target.value)}
                  placeholder="e.g. Paracetamol, Omeprazole, Ibuprofen"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-orange-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loadingMedicine}
                className="w-full mt-3 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {loadingMedicine ? "Finding Natural Alternatives..." : "Find Natural Alternatives"}
              </button>
            </form>

            {loadingMedicine && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Searching botanical substitutes...</p>
              </div>
            )}

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {medicineResults.map((result, index) => (
                <div key={index} className="p-4 bg-orange-50/70 dark:bg-gray-900/60 rounded-xl border border-orange-200 dark:border-gray-700 hover:border-orange-400 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-orange-900 dark:text-orange-300 text-base">{result.title}</h3>
                    <span className="text-[10px] bg-orange-200 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      Natural Substitute
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed">{result.snippet}</p>

                  {result.details && result.details.naturalAlternatives && (
                    <div className="space-y-2 mb-3">
                      {result.details.naturalAlternatives.map((alt, altIdx) => (
                        <div key={altIdx} className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-orange-100 dark:border-gray-700 text-xs">
                          <div className="font-semibold text-orange-800 dark:text-orange-400">{alt.name}</div>
                          <div className="text-gray-600 dark:text-gray-300 my-1">{alt.description}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Form:</span> {alt.form} | <span className="font-medium">Dosage:</span> {alt.dosage}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.details && result.details.precautions && (
                    <div className="mb-3 text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Precaution:
                      </div>
                      <p className="text-amber-900 dark:text-amber-200">{result.details.precautions}</p>
                    </div>
                  )}

                  <a
                    href={result.link || "https://ayush.gov.in"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-orange-700 dark:text-orange-400 hover:text-orange-900 font-semibold text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Pharmacological Reference
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AYUSH Categories Info */}
        <div className="mt-12 bg-white dark:bg-gray-800/90 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Recognized AYUSH Systems of Medicine</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-800">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">🌿</div>
              <h3 className="font-bold text-green-800 dark:text-green-300 text-sm mb-1">Ayurveda</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tridosha balancing using herbs and Rasayana therapy</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">🧘</div>
              <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">Yoga & Naturopathy</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Asanas, Pranayama & drugless therapeutic fasting</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">🌙</div>
              <h3 className="font-bold text-purple-800 dark:text-purple-300 text-sm mb-1">Unani</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Balancing the four humors (Akhlat) with botanicals</p>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">⚗️</div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">Siddha</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Classical Dravidian mineral and herbal formulations</p>
            </div>
            <div className="text-center p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">💊</div>
              <h3 className="font-bold text-rose-800 dark:text-rose-300 text-sm mb-1">Homeopathy</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Similia Similibus Curentur micro-dose therapeutics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}