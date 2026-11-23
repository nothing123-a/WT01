import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import FeatureSuggestionEngine from '../../../lib/featureSuggestionEngine.js';
import rateLimiter from '../../../lib/rateLimiter.js';

const suggestionEngine = new FeatureSuggestionEngine();

function getSmartFallbackReply(message) {
  const m = message.toLowerCase();

  // Navigation / Platform Features
  if (m.includes('emergency') || m.includes('sos') || m.includes('ambulance') || m.includes('accident') || m.includes('heart attack')) {
    return {
      text: "I am alerting emergency services and opening the Emergency SOS panel for immediate assistance.",
      feature: { name: "Emergency SOS", route: "/dashboard/emergency-sos", reason: "Immediate urgent medical support" },
      action: "NAVIGATE_EMERGENCY"
    };
  }

  if (m.includes('doctor') || m.includes('consult') || m.includes('appointment') || m.includes('checkup')) {
    return {
      text: "I can connect you with an available doctor right now. You can choose a routine checkup or video consultation.",
      feature: { name: "Doctor Consultation", route: "/dashboard/routine-doctor", reason: "Schedule or connect with licensed physicians" },
      action: "CONNECT_TO_DOCTOR"
    };
  }

  if (m.includes('ayurveda') || m.includes('herbal') || m.includes('natural remedy') || m.includes('ayush')) {
    return {
      text: "Opening our AYUSH Knowledge Base where you can find verified Ayurvedic herbs, yoga therapies, and natural alternatives for common medicines.",
      feature: { name: "Ayurveda & AYUSH", route: "/dashboard/ayurveda", reason: "Natural remedies and herbal alternatives" },
      action: "NAVIGATE_AYURVEDA"
    };
  }

  if (m.includes('scheme') || m.includes('government') || m.includes('mjpjay') || m.includes('ayushman') || m.includes('maharashtra')) {
    return {
      text: "Taking you to Maharashtra Government Health Schemes, including Mahatma Jyotirao Phule Jan Arogya Yojana offering up to ₹5 Lakh cashless coverage.",
      feature: { name: "Government Schemes", route: "/dashboard/government-schemes", reason: "Healthcare welfare & financial protection schemes" },
      action: "NAVIGATE_SCHEMES"
    };
  }

  if (m.includes('news') || m.includes('update') || m.includes('headline')) {
    return {
      text: "Opening India Healthcare Updates with the latest clinical advancements and national health advisories.",
      feature: { name: "Health News", route: "/dashboard/health-news", reason: "Latest verified healthcare news across India" },
      action: "NAVIGATE_NEWS"
    };
  }

  if (m.includes('pharmacy') || m.includes('medicine') || m.includes('drug') || m.includes('order')) {
    return {
      text: "Opening our online pharmacy where you can search, compare, and order genuine medications with doorstep delivery.",
      feature: { name: "Online Pharmacy", route: "/dashboard/pharmacy", reason: "Browse and order prescribed medicines" },
      action: "NAVIGATE_PHARMACY"
    };
  }

  if (m.includes('prescription') || m.includes('scan prescription') || m.includes('read rx')) {
    return {
      text: "Opening the AI Prescription Reader. You can upload an image of your prescription to digitize and extract dosage instructions.",
      feature: { name: "Prescription Reader", route: "/dashboard/prescription-reader", reason: "OCR prescription analysis and digitizer" },
      action: "NAVIGATE_PRESCRIPTION"
    };
  }

  if (m.includes('scan') || m.includes('x-ray') || m.includes('ct scan') || m.includes('mri')) {
    return {
      text: "Opening the Medical Scans Analyzer. You can upload diagnostic scans for AI-assisted preliminary detection.",
      feature: { name: "Scans Analyzer", route: "/dashboard/scans-analyzer", reason: "Medical imaging and scan analysis" },
      action: "NAVIGATE_SCANS"
    };
  }

  if (m.includes('report') || m.includes('blood test') || m.includes('lab result')) {
    return {
      text: "Opening the Reports Analyzer to help you understand your pathology and blood test metrics with plain-language explanations.",
      feature: { name: "Reports Analyzer", route: "/dashboard/reports-analyzer", reason: "Automated pathology and lab report interpretation" },
      action: "NAVIGATE_REPORTS"
    };
  }

  if (m.includes('period') || m.includes('menstrual') || m.includes('cycle') || m.includes('ovulation')) {
    return {
      text: "Opening the Menstrual Health & Period Tracker with AI cycle prediction and symptom logs.",
      feature: { name: "Period Tracker", route: "/dashboard/mental-counselor/period-tracker", reason: "Cycle monitoring and hormonal wellness" },
      action: "NAVIGATE_PERIOD"
    };
  }

  if (m.includes('stress') || m.includes('anxiety') || m.includes('depression') || m.includes('sad') || m.includes('counselor') || m.includes('mental')) {
    return {
      text: "I hear you, and you are not alone. Let me connect you with our 24/7 AI Mental Health Counselor for emotional support and relaxation exercises.",
      feature: { name: "AI Mental Counselor", route: "/dashboard/mental-counselor", reason: "Confidential emotional support and guidance" },
      action: "NAVIGATE_COUNSELOR"
    };
  }

  if (m.includes('blood') || m.includes('donor') || m.includes('platelet')) {
    return {
      text: "Opening the Blood Bank locator to find verified blood donors and reserves nearby.",
      feature: { name: "Blood Bank", route: "/dashboard/blood-bank", reason: "Locate nearby blood banks and donors" },
      action: "NAVIGATE_BLOOD_BANK"
    };
  }

  // Common Health Questions & Symptoms
  if (m.includes('headache') || m.includes('migraine')) {
    return {
      text: "For mild headaches, rest in a quiet, dark room, stay well hydrated, and consider a warm herbal ginger tea. If it's sudden, unusually severe, or accompanied by vision changes, please consult a doctor immediately.",
      feature: { name: "Doctor Consultation", route: "/dashboard/routine-doctor", reason: "Consult a physician for persistent headaches" }
    };
  }

  if (m.includes('fever') || m.includes('temperature')) {
    return {
      text: "For fever, rest adequately, drink plenty of fluids like electrolyte water, and monitor your temperature. You can try natural antipyretics like Giloy decoction or consult our doctor if temperature exceeds 101°F.",
      feature: { name: "Ayurveda Remedies", route: "/dashboard/ayurveda", reason: "Explore natural fever reducers like Giloy" }
    };
  }

  if (m.includes('cold') || m.includes('cough') || m.includes('sore throat')) {
    return {
      text: "Warm saline gargles, steam inhalation with Tulsi or eucalyptus, and ginger-honey tea provide soothing relief for cough and congestion. Would you like me to connect you with a doctor or open the Ayurveda guide?",
      feature: { name: "Ayurveda Remedies", route: "/dashboard/ayurveda", reason: "View respiratory remedies like Sitopaladi & Tulsi" }
    };
  }

  if (m.includes('stomach') || m.includes('acidity') || m.includes('digestion') || m.includes('gas')) {
    return {
      text: "For acidity and indigestion, sip lukewarm water or coconut water, avoid lying down immediately after eating, and consider cooling herbs like Amla or Avipattikar churna.",
      feature: { name: "Ayurveda Remedies", route: "/dashboard/ayurveda", reason: "View remedies for hyperacidity and GERD" }
    };
  }

  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('who are you')) {
    return {
      text: "Hello! I am Genie, your intelligent voice healthcare assistant. I can connect you with doctors, find herbal remedies, check government schemes, order medicines, or analyze medical reports. What would you like help with today?",
      feature: null
    };
  }

  return {
    text: `I understand you're asking about "${message}". As your healthcare assistant, I can connect you with a specialist, look up medicines, or find natural AYUSH remedies. How would you like to proceed?`,
    feature: { name: "Doctor Consultation", route: "/dashboard/routine-doctor", reason: "Get direct clinical advice" }
  };
}

export async function POST(request) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // Rate limiting for Genie
    if (userId && !rateLimiter.isAllowed(userId)) {
      return NextResponse.json({
        success: true,
        response: 'Please give me a moment to process. How else may I assist your health today?',
        language: 'English'
      });
    }

    // Detect language of the message
    const isHindi = /[\u0900-\u097F]/.test(message);
    const isMarathi = /[\u0900-\u097F]/.test(message) && (message.includes('आहे') || message.includes('का') || message.includes('ते'));
    
    let responseLanguage = 'English';
    let detectedLang = 'en';
    if (isHindi) {
      responseLanguage = 'Hindi';
      detectedLang = 'hi';
    }
    if (isMarathi) {
      responseLanguage = 'Marathi';
      detectedLang = 'mr';
    }

    // Direct doctor connection flow
    const connectionTypeResponse = message.toLowerCase().includes('chat') || message.toLowerCase().includes('video');
    if (connectionTypeResponse && (message.toLowerCase().includes('chat') || message.toLowerCase().includes('video'))) {
      const connectionType = message.toLowerCase().includes('video') ? 'video' : 'chat';
      return NextResponse.json({
        success: true,
        response: `Perfect! I am setting up your ${connectionType} consultation with an available doctor now.`,
        language: responseLanguage,
        action: 'CONNECT_TO_DOCTOR',
        doctorConnection: {
          type: 'routine',
          connectionType: connectionType,
          message: `Genie automated ${connectionType} connection request`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Try Gemini API if key is available and valid
    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== 'AIzaSyDummyKeyForBuildStep';

    if (hasValidKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            maxOutputTokens: 250,
          },
        });

        const prompt = `You are Genie, the intelligent voice healthcare assistant for the Telemedicine platform.
Keep answers concise (under 3 sentences), friendly, empathetic, and spoken-friendly.
User said: "${message}"
Respond in ${responseLanguage}.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const result = await model.generateContent(prompt);
        clearTimeout(timeoutId);

        const geminiText = result.response.text();
        const fallback = getSmartFallbackReply(message);

        return NextResponse.json({
          success: true,
          response: geminiText,
          language: responseLanguage,
          detectedLanguage: detectedLang,
          suggestedFeature: fallback.feature,
          action: fallback.action || null,
          timestamp: new Date().toISOString()
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, using smart internal healthcare engine:', geminiError.message);
      }
    }

    // Fallback: Intelligent internal medical & navigation engine
    const smartFallback = getSmartFallbackReply(message);

    return NextResponse.json({
      success: true,
      response: smartFallback.text,
      language: responseLanguage,
      detectedLanguage: detectedLang,
      suggestedFeature: smartFallback.feature,
      action: smartFallback.action || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Genie Chat General Error:', error);
    return NextResponse.json({
      success: true,
      response: "Hello! I am Genie, your healthcare assistant. How can I assist you with doctors, remedies, or medicines today?",
      language: "English"
    });
  }
}