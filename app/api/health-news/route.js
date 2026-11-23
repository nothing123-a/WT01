import { NextResponse } from "next/server";
import { getHealthNewsData } from "@/data/healthNewsData";
import { getGovernmentSchemesData } from "@/data/governmentSchemesData";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const type = searchParams.get('type') || 'news';
    
    if (type === 'schemes') {
      const hardcodedSchemes = getGovernmentSchemesData(category);

      // Attempt external search safely with fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const maharashtraQueries = {
          insurance: 'Maharashtra Mahatma Jyotirao Phule Jan Arogya Yojana OR MJPJAY scheme news',
          maternal: 'Maharashtra PMMVY maternity scheme OR JSSK pregnant women healthcare',
          disease: 'Maharashtra National Health Mission disease control OR TB Nikshay Poshan',
          primary: 'Maharashtra Aapla Dawakhana urban clinics OR Ayushman Arogya Mandir',
          nutrition: 'Maharashtra Amrut Ahar Yojana tribal nutrition OR POSHAN Abhiyaan',
          ayush: 'Maharashtra AYUSH mission dispensaries OR traditional medicine clinics',
          rural: 'Maharashtra Navsanjivani Yojana tribal health OR ASHA health worker',
          mental: 'Maharashtra Tele-MANAS mental health helpline 14416 OR DMHP'
        };

        const query = maharashtraQueries[category] || 'Maharashtra health scheme government program';

        const response = await fetch("https://google.serper.dev/news", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY || "b15321aee5370f5e506e764fb6141b8fa80c4d0f",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            q: query,
            num: 6,
            gl: "in"
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.news && data.news.length > 0) {
            return NextResponse.json([...hardcodedSchemes, ...data.news]);
          }
        }
      } catch (err) {
        console.warn('Serper news skipped for schemes, using hardcoded schemes:', err.message);
      }

      return NextResponse.json(hardcodedSchemes);
    }

    // Default: type === 'news'
    const hardcodedNews = getHealthNewsData(category);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const categoryQueries = {
        general: 'India healthcare ministry news OR hospital medical advancement India',
        mental: 'India mental health Tele-MANAS NIMHANS psychology counseling',
        cardiology: 'India cardiology heart treatment AIIMS cardiology robotic surgery',
        diabetes: 'India diabetes care ICMR guidelines blood sugar management',
        cancer: 'India cancer oncology Tata Memorial Hospital CAR-T therapy',
        pediatrics: 'India child health Mission Indradhanush vaccination pediatrics',
        neurology: 'India neurology stroke care acute neurology hospital',
        orthopedics: 'India orthopedics joint replacement robotic knee surgery',
        dermatology: 'India dermatology skin care treatment dermatology council',
        gynecology: 'India women health pregnancy maternal health care',
        ophthalmology: 'India eye care cataract treatment ophthalmology vision',
        dentistry: 'India dental oral health dentistry care',
        nutrition: 'India nutrition POSHAN Abhiyaan dietary guidelines FSSAI',
        pharmacy: 'India pharmacy medicines CDSCO Jan Aushadhi generic drugs',
        emergency: 'India emergency ambulance 108 trauma center golden hour'
      };

      const query = categoryQueries[category] || 'India healthcare hospital medical news';

      const response = await fetch("https://google.serper.dev/news", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY || "b15321aee5370f5e506e764fb6141b8fa80c4d0f",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: query,
          num: 6,
          gl: "in"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.news && data.news.length > 0) {
          return NextResponse.json([...hardcodedNews, ...data.news]);
        }
      }
    } catch (err) {
      console.warn('Serper news skipped for health news, using curated news:', err.message);
    }

    return NextResponse.json(hardcodedNews);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(getHealthNewsData('general'));
  }
}