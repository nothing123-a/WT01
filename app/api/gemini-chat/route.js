import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import rateLimiter from "../../../lib/rateLimiter.js";

function getMedicalFallback(query) {
  const q = query.toLowerCase();
  if (q.includes("headache")) {
    return "For mild headaches, rest in a calm, dark room, stay hydrated, and try gentle neck relaxation. If the headache is sudden, severe, or accompanied by blurred vision, please seek immediate medical attention.";
  }
  if (q.includes("fever")) {
    return "Stay hydrated with warm water, electrolytes, and rest. You can monitor your temperature every 4 hours. If fever exceeds 101°F or lasts more than 3 days, consult a physician.";
  }
  if (q.includes("cold") || q.includes("cough")) {
    return "Warm saline gargles, steam inhalation, and herbal ginger-tulsi tea can relieve throat irritation and congestion. Seek medical advice if you experience wheezing or difficulty breathing.";
  }
  if (q.includes("acidity") || q.includes("stomach")) {
    return "Drink small sips of water, avoid spicy and deep-fried food, and avoid lying flat immediately after eating. Natural remedies like Amla or cooling mint can help soothe stomach heat.";
  }
  if (q.includes("doctor")) {
    return "You can connect with a verified doctor right from your dashboard. Would you like a chat consultation or routine checkup?";
  }
  if (q.includes("ayurveda") || q.includes("herbal")) {
    return "Our Ayurveda section features traditional AYUSH remedies and botanical alternatives for common medications like Paracetamol, Antacids, and Painkillers.";
  }
  return "I'm Genie, your healthcare assistant. You can ask me about symptoms, natural Ayurvedic alternatives, government schemes, or connect directly with our doctors for medical consultations.";
}

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    // Rate limiting check
    if (userId && !rateLimiter.isAllowed(userId)) {
      return NextResponse.json({
        reply: "Please wait a moment before sending another message.",
        success: true
      });
    }

    const userMessage = messages[messages.length - 1]?.content || "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_gemini_api_key" && apiKey !== "AIzaSyDummyKeyForBuildStep") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const systemPrompt = `You are Genie, a helpful healthcare AI assistant. Provide concise (under 3 sentences), empathetic, and accurate healthcare guidance. Keep it conversational for voice response.`;

        const userInput = messages.map(m => `${m.role}: ${m.content}`).join("\n");
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        });

        const result = await model.generateContent(`${systemPrompt}\n\n${userInput}`);
        const reply = result.response.text();

        return NextResponse.json({
          reply,
          success: true
        });
      } catch (geminiErr) {
        console.warn('Gemini API error, falling back to smart medical knowledge:', geminiErr.message);
      }
    }

    // High quality clinical fallback
    const reply = getMedicalFallback(userMessage);
    return NextResponse.json({
      reply,
      success: true
    });

  } catch (err) {
    console.error('Gemini API Error:', err);
    return NextResponse.json({ 
      reply: "I am Genie, your healthcare assistant. How can I assist you with doctors, remedies, or medicines?",
      success: true 
    });
  }
}