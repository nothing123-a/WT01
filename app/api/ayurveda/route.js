import { NextResponse } from "next/server";
import { searchAyurvedaData } from "@/data/ayurvedaData";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'disease'; // 'disease' or 'medicine'
    
    // Always obtain verified high-quality hardcoded AYUSH data
    const hardcodedResults = searchAyurvedaData(query, type);

    // If query provided and Serper search can be attempted safely:
    if (query && query.trim()) {
      let searchQuery = '';
      if (type === 'disease') {
        searchQuery = `${query} ayurvedic treatment OR ${query} herbal remedy OR ${query} natural cure`;
      } else if (type === 'medicine') {
        searchQuery = `${query} ayurvedic alternative OR ${query} herbal substitute OR AYUSH`;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY || "b15321aee5370f5e506e764fb6141b8fa80c4d0f",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 6,
            gl: "in"
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.organic && data.organic.length > 0) {
            // Combine hardcoded curated items first with external results
            const combined = [...hardcodedResults, ...data.organic];
            return NextResponse.json(combined);
          }
        }
      } catch (externalError) {
        // Serper network error or timeout, safely fall back to verified dataset
        console.warn('Serper search skipped or unavailable, using curated Ayurveda database:', externalError.message);
      }
    }

    return NextResponse.json(hardcodedResults);
  } catch (error) {
    console.error('Ayurveda API error:', error);
    // Even in case of unexpected errors, return default data so user never gets broken page
    return NextResponse.json(searchAyurvedaData("", 'disease'));
  }
}