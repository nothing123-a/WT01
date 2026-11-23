"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Video, FileText, Clock, User, CheckCircle, RefreshCw } from "lucide-react";
import { io as socketIO } from "socket.io-client";

export default function RoutineDoctorPanel({ doctorId, doctorName, inline = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchRequests();

    // Connect to Socket.IO for real-time updates
    try {
      const socket = socketIO({
        transports: ['polling', 'websocket'],
        upgrade: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🩺 Doctor panel connected to socket:", socket.id);
        setSocketConnected(true);
        if (doctorId) {
          socket.emit("register-doctor", { doctorId });
          console.log("🩺 Doctor panel registered doctor:", doctorId);
        }
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("🩺 Doctor panel reconnected after", attemptNumber, "attempts");
        if (doctorId) {
          socket.emit("register-doctor", { doctorId });
        }
      });

      // Listen for new requests from patients
      socket.on("new-routine-request", (newRequest) => {
        console.log("📥 New routine request received via socket:", newRequest);
        setRequests(prev => {
          if (prev.find(r => r._id?.toString() === newRequest._id?.toString())) return prev;
          return [newRequest, ...prev];
        });
      });

      // Listen for requests being removed
      socket.on("routine-request-removed", ({ requestId }) => {
        console.log("🗑️ Routine request removed:", requestId);
        setRequests(prev => prev.filter(r => r._id?.toString() !== requestId?.toString()));
      });

      socket.on("connect_error", (err) => {
        console.warn("🩺 Doctor panel socket connection error:", err.message);
        setSocketConnected(false);
      });

      socket.on("disconnect", (reason) => {
        console.log("🩺 Doctor panel socket disconnected:", reason);
        setSocketConnected(false);
      });
    } catch (err) {
      console.error("Socket.IO init failed for doctor panel:", err);
    }

    // Polling interval (every 4 seconds for instant responsiveness)
    const interval = setInterval(fetchRequests, 4000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [doctorId]);

  const fetchRequests = async () => {
    try {
      setIsRefreshing(true);
      const url = `/api/routine-doctor/requests?t=${Date.now()}`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching routine requests:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch("/api/routine-doctor/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          doctorId,
          doctorName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(prev => prev.filter(r => r._id?.toString() !== requestId?.toString()));
        const roomType = data.connectionType === 'chat' ? 'chat' : 'video';
        window.location.href = `/${roomType}-room/${data.roomId}`;
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handlePassRequest = async (requestId) => {
    try {
      const response = await fetch("/api/routine-doctor/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, doctorId })
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r._id?.toString() !== requestId?.toString()));
        fetchRequests();
      }
    } catch (error) {
      console.error("Error passing request:", error);
    }
  };

  const getConnectionIcon = (type) => {
    return type === "video" ? Video : MessageSquare;
  };

  const getConnectionColor = (type) => {
    return type === "video" ? "green" : "blue";
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === "pending");

  return (
    <div className={inline ? "" : "bg-white rounded-2xl shadow-xl border border-orange-100"}>
      <div className="p-4 sm:p-6 border-b border-orange-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-orange-500 text-lg">🩺</span>
            Incoming Requests
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
              {pendingRequests.length}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Real-time consultation queue</p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all border border-orange-200 shadow-sm"
          title="Refresh queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-8 h-8 text-orange-300" />
            </div>
            <p className="text-gray-700 font-medium">No routine requests right now</p>
            <p className="text-gray-400 text-xs mt-1">When a patient submits a request, it will appear here instantly</p>
            <button
              onClick={fetchRequests}
              className="mt-3 inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold underline"
            >
              Check again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const ConnectionIcon = getConnectionIcon(request.connectionType);
              
              return (
                <div
                  key={request._id}
                  className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{request.userName}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{request.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 sm:ml-auto">
                          <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${
                            request.connectionType === 'video' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <ConnectionIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              request.connectionType === 'video' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                            <span className={`text-xs sm:text-sm font-medium capitalize ${
                              request.connectionType === 'video' ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {request.connectionType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-orange-600 text-xs sm:text-sm">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{formatTimeAgo(request.timestamp || request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {request.note && (
                        <div className="bg-white/70 rounded-lg p-2 sm:p-3 mb-3 border border-orange-100">
                          <div className="flex items-start gap-2">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{request.note}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm transition-all duration-200"
                        >
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Accept & Join</span>
                        </button>
                        <button
                          onClick={() => handlePassRequest(request._id)}
                          className="px-3 sm:px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-xs sm:text-sm transition-all duration-200"
                        >
                          Pass
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
