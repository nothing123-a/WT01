"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minus,
  Sparkles,
  Send,
  MessageSquare,
  ChevronUp,
  Activity,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function VapiGenie() {
  const router = useRouter();

  // Assistant states: 'sleeping' | 'listening' | 'processing' | 'speaking'
  const [status, setStatus] = useState("sleeping");
  const [micPermission, setMicPermission] = useState("prompt"); // 'granted' | 'prompt' | 'denied'
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am Genie, your voice healthcare assistant. Say 'Hey Genie' or click the mic anytime to talk with me!"
    }
  ]);
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [suggestedAction, setSuggestedAction] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const statusRef = useRef(status);
  const isWakeWordActiveRef = useRef(isWakeWordActive);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isWakeWordActiveRef.current = isWakeWordActive;
  }, [isWakeWordActive]);

  // Pleasant Web Audio AI activation chime
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Chime audio notice:", e);
    }
  }, []);

  // Text-To-Speech Synthesis
  const speak = useCallback((text, onFinish) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onFinish) onFinish();
      return;
    }

    if (isMuted) {
      if (onFinish) onFinish();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const cleanText = text.replace(/[*_#`]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) => (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Jenny") || v.name.includes("Zira")) && v.lang.startsWith("en")
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setStatus("speaking");
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setStatus("sleeping");
        if (onFinish) onFinish();
        else resumeWakeWord();
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setStatus("sleeping");
        if (onFinish) onFinish();
        else resumeWakeWord();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech error:", e);
      setStatus("sleeping");
      if (onFinish) onFinish();
      else resumeWakeWord();
    }
  }, [isMuted]);

  // Process user health/navigation query
  const processQuery = useCallback(async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    setStatus("processing");
    const userMsg = queryText.trim();
    setTranscript(userMsg);

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setShowChat(true);
    setIsChatMinimized(false);

    try {
      const res = await fetch("/api/genie-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, userId: "genie-voice-user" })
      });

      const data = await res.json();
      const botReply = data.response || "I am here to help you. How else can I assist your health?";

      setMessages((prev) => [...prev, { role: "assistant", content: botReply }]);

      if (data.suggestedFeature) {
        setSuggestedAction(data.suggestedFeature);
      } else {
        setSuggestedAction(null);
      }

      // Speak back
      speak(botReply);

    } catch (err) {
      console.error("Genie API error:", err);
      const fallbackReply = "I am ready to help you connect with doctors or find natural remedies. What would you like to explore?";
      setMessages((prev) => [...prev, { role: "assistant", content: fallbackReply }]);
      speak(fallbackReply);
    }
  }, [speak]);

  // Start active recording for query
  const startActiveListening = useCallback(() => {
    if (typeof window === "undefined") return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let speechBuffer = "";

      recognition.onstart = () => {
        setStatus("listening");
        setTranscript("Listening... speak your query");
      };

      recognition.onresult = (event) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }

        if (currentText.trim()) {
          speechBuffer = currentText;
          setTranscript(currentText);

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (speechBuffer.trim()) {
              recognition.stop();
              processQuery(speechBuffer);
            }
          }, 1800);
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Query recognition error:", e.error);
          setStatus("sleeping");
          resumeWakeWord();
        }
      };

      recognition.onend = () => {
        if (statusRef.current === "listening" && !speechBuffer.trim()) {
          setStatus("sleeping");
          resumeWakeWord();
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start active listening:", err);
      setStatus("sleeping");
      resumeWakeWord();
    }
  }, [processQuery]);

  // Continuous background wake-word listener
  const startWakeWordListening = useCallback(() => {
    if (typeof window === "undefined" || !isWakeWordActiveRef.current) return;
    if (isSpeakingRef.current || statusRef.current === "listening" || statusRef.current === "processing") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const wakeRecognition = new SpeechRecognition();
      recognitionRef.current = wakeRecognition;
      wakeRecognition.continuous = true;
      wakeRecognition.interimResults = true; // Use true for instant trigger!
      wakeRecognition.lang = "en-US";

      const wakePattern = /(hey|hi|ok|hello)?\s*(genie|jeanie|gini|jini|jinny|genny|dini)/i;

      wakeRecognition.onstart = () => {
        setMicPermission("granted");
      };

      wakeRecognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const speechSegment = event.results[i][0].transcript.toLowerCase();
          console.log("🎤 Ambient voice segment:", speechSegment);

          if (wakePattern.test(speechSegment)) {
            console.log("🧞♂️ WAKE WORD 'HEY GENIE' DETECTED!");
            wakeRecognition.stop();

            playChime();
            setShowChat(true);

            // Extract any follow-up question said in the same breath
            const followUp = speechSegment.replace(wakePattern, "").trim();

            if (followUp && followUp.length > 2) {
              // User already spoke their question e.g. "Hey genie connect me with a doctor"
              processQuery(followUp);
            } else {
              // User just said "Hey Genie" -> Greet and listen
              speak("Hi! I'm listening. How can I help you?", () => {
                startActiveListening();
              });
            }
            return;
          }
        }
      };

      wakeRecognition.onerror = (e) => {
        if (e.error === "not-allowed") {
          console.warn("Microphone access not granted yet.");
          setMicPermission("denied");
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Wake word listener event:", e.error);
        }
      };

      wakeRecognition.onend = () => {
        // Automatically restart if still idle
        if (
          isWakeWordActiveRef.current &&
          statusRef.current === "sleeping" &&
          !isSpeakingRef.current
        ) {
          setTimeout(() => {
            try {
              if (statusRef.current === "sleeping" && !isSpeakingRef.current) {
                wakeRecognition.start();
              }
            } catch (err) {}
          }, 800);
        }
      };

      wakeRecognition.start();
    } catch (e) {
      console.warn("Wake word initialization error:", e);
    }
  }, [playChime, processQuery, speak, startActiveListening]);

  const resumeWakeWord = useCallback(() => {
    setTimeout(() => {
      if (statusRef.current === "sleeping") {
        startWakeWordListening();
      }
    }, 600);
  }, [startWakeWordListening]);

  // Request Microphone permissions & Activate Genie
  const requestMicAndActivate = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission("granted");
      }
      playChime();
      startWakeWordListening();
    } catch (err) {
      console.warn("Mic permission error:", err);
      setMicPermission("denied");
    }
  };

  // Main Genie Mic button clicked
  const handleGenieClick = async () => {
    if (micPermission !== "granted") {
      await requestMicAndActivate();
    }

    if (status === "listening") {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (transcript && transcript !== "Listening... speak your query") {
        processQuery(transcript);
      } else {
        setStatus("sleeping");
        resumeWakeWord();
      }
    } else if (status === "speaking") {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setStatus("sleeping");
      resumeWakeWord();
    } else {
      setShowChat(true);
      playChime();
      startActiveListening();
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const msg = inputMessage;
    setInputMessage("");
    processQuery(msg);
  };

  const executeAction = (route) => {
    if (route) {
      setShowChat(false);
      router.push(route);
    }
  };

  // Start background listening once user interacts or after a brief delay
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (micPermission === "prompt") {
        startWakeWordListening();
      }
    };

    window.addEventListener("click", handleFirstUserInteraction, { once: true });
    window.addEventListener("keydown", handleFirstUserInteraction, { once: true });

    // Also auto-attempt after 1.5s
    const timer = setTimeout(() => {
      startWakeWordListening();
    }, 1500);

    return () => {
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("keydown", handleFirstUserInteraction);
      clearTimeout(timer);
      if (recognitionRef.current) recognitionRef.current.abort();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [startWakeWordListening, micPermission]);

  const quickPrompts = [
    { label: "Connect Doctor", query: "Connect me with a doctor for consultation" },
    { label: "Ayurveda", query: "Show me natural Ayurvedic remedies" },
    { label: "Govt Schemes", query: "What Maharashtra healthcare schemes are available?" },
    { label: "Emergency SOS", query: "I need emergency medical assistance" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Microphone Permission Prompt Banner (if blocked or first visit) */}
      {micPermission === "denied" && (
        <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 rounded-2xl shadow-xl max-w-xs text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Microphone access needed:</span> Please allow microphone permissions in your browser address bar to use "Hey Genie".
          </div>
        </div>
      )}

      {/* Floating Chat Panel */}
      {showChat && (
        <div
          className={`mb-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-emerald-400 dark:border-emerald-600 transition-all duration-300 w-80 sm:w-96 flex flex-col overflow-hidden ${
            isChatMinimized ? "h-14" : "max-h-[500px] h-[460px]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-lg">
                🧞
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Genie Voice Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                </h3>
                <span className="text-[10px] text-emerald-100">
                  {status === "listening"
                    ? "🎤 Listening to your voice..."
                    : status === "speaking"
                    ? "🔊 Speaking response..."
                    : status === "processing"
                    ? "🧠 Analyzing..."
                    : "Say 'Hey Genie' anytime"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white">
              {/* Mute toggle */}
              <button
                onClick={() => {
                  const newMute = !isMuted;
                  setIsMuted(newMute);
                  if (newMute && window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                title={isMuted ? "Unmute voice response" : "Mute voice response"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-200" /> : <Volume2 className="w-4 h-4 text-emerald-200" />}
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isChatMinimized ? <ChevronUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  setShowChat(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!isChatMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-slate-50 dark:bg-gray-900/60">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                        m.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {/* Status indicator */}
                {status === "listening" && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                    <span className="italic">{transcript || "Listening..."}</span>
                  </div>
                )}

                {status === "processing" && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Genie is thinking...</span>
                  </div>
                )}

                {/* Suggested Action Button */}
                {suggestedAction && (
                  <div className="mt-2 p-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-400 dark:border-emerald-700">
                    <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Suggested Action:
                    </div>
                    <button
                      onClick={() => executeAction(suggestedAction.route)}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors"
                    >
                      <span>Open {suggestedAction.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => processQuery(p.query)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Text Input Footer */}
              <form
                onSubmit={handleTextSubmit}
                className="p-2.5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Genie or click mic..."
                  className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-black dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleGenieClick}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    status === "listening"
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                  }`}
                  title="Speak to Genie"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Widget & Main Toggle Button */}
      <div className="flex items-center gap-3">
        {/* Status Bubble */}
        <div
          onClick={handleGenieClick}
          className="cursor-pointer hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:shadow-xl hover:border-emerald-400 transition-all"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === "listening"
                ? "bg-red-500 animate-ping"
                : status === "speaking"
                ? "bg-blue-500 animate-bounce"
                : status === "processing"
                ? "bg-amber-500 animate-spin"
                : "bg-emerald-500"
            }`}
          ></span>
          <span>
            {status === "listening"
              ? "Listening..."
              : status === "speaking"
              ? "Speaking..."
              : status === "processing"
              ? "Thinking..."
              : micPermission !== "granted"
              ? "Click to Enable Voice"
              : "Say 'Hey Genie'"}
          </span>
        </div>

        {/* Chat Toggle Icon */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:scale-105 transition-transform"
          title="Open Assistant Chat"
        >
          <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </button>

        {/* Main Mic Button with Ripple Effect */}
        <div className="relative">
          {status === "listening" && (
            <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping pointer-events-none"></div>
          )}
          {status === "speaking" && (
            <div className="absolute -inset-2 rounded-full bg-blue-500/30 animate-pulse pointer-events-none"></div>
          )}

          <button
            onClick={handleGenieClick}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 ${
              status === "listening"
                ? "bg-gradient-to-r from-red-500 to-rose-600 ring-4 ring-red-300"
                : status === "speaking"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 ring-4 ring-blue-300"
                : status === "processing"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 ring-4 ring-amber-300"
                : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-500/40"
            }`}
            title="Genie Voice Assistant (Click to Talk or Say 'Hey Genie')"
          >
            {status === "listening" ? (
              <Mic className="w-6 h-6 animate-pulse" />
            ) : status === "speaking" ? (
              <Volume2 className="w-6 h-6 animate-bounce" />
            ) : status === "processing" ? (
              <Activity className="w-6 h-6 animate-spin" />
            ) : (
              <span className="text-2xl select-none">🧞</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}