import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoutineDoctorRequest from "@/models/RoutineDoctorRequest";

// In-memory fallback queue for resilient queueing when database is temporarily unavailable
global._routineRequests = global._routineRequests || [];

export async function POST(request) {
  try {
    const { userId, userName, userEmail, connectionType, note, timestamp } = await request.json();
    
    if (!userId || !connectionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newReqData = {
      _id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      userName: userName || "Patient",
      userEmail: userEmail || "patient@demo.com",
      connectionType,
      note: note || "",
      status: "pending",
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      createdAt: new Date()
    };

    let savedRequestId = newReqData._id;

    // Try saving to MongoDB
    try {
      await dbConnect();
      const routineRequest = new RoutineDoctorRequest({
        ...newReqData,
        _id: undefined // let Mongoose generate ObjectId
      });
      await routineRequest.save();
      savedRequestId = routineRequest._id.toString();
      newReqData._id = savedRequestId;
    } catch (dbErr) {
      console.warn("⚠️ MongoDB unavailable for routine doctor request, using in-memory store:", dbErr.message);
    }

    // Always maintain in-memory store
    global._routineRequests.push(newReqData);

    // Notify all connected doctors in real-time via Socket.IO
    if (global._io) {
      const connectedSockets = global._io.sockets?.sockets?.size || 'unknown';
      global._io.emit("new-routine-request", newReqData);
      console.log(`📡 Emitted new-routine-request to all sockets (connected: ${connectedSockets})`);
    } else {
      console.warn("⚠️ global._io is not ready yet; doctors will receive request via polling");
    }

    return NextResponse.json({
      success: true,
      requestId: savedRequestId,
      message: "Request submitted successfully"
    });

  } catch (error) {
    console.error("Error creating routine doctor request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
