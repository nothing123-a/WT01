import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoutineDoctorRequest from "@/models/RoutineDoctorRequest";
import Room from "@/models/Room";

export async function POST(request) {
  try {
    const { requestId, doctorId, doctorName } = await request.json();
    
    if (!requestId || !doctorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let routineRequest = null;

    try {
      await dbConnect();
      routineRequest = await RoutineDoctorRequest.findById(requestId);
      if (routineRequest && routineRequest.status === "pending") {
        routineRequest.status = "accepted";
        routineRequest.doctorId = doctorId;
        routineRequest.doctorName = doctorName;
        routineRequest.roomId = roomId;
        routineRequest.acceptedAt = new Date();
        await routineRequest.save();

        const room = new Room({
          roomId,
          userId: routineRequest.userId,
          doctorId: doctorId,
          type: routineRequest.connectionType,
          status: "active"
        });
        await room.save().catch(e => console.warn("Room save warning:", e.message));
      }
    } catch (dbErr) {
      console.warn("MongoDB unavailable for accept, checking memory fallback:", dbErr.message);
    }

    // Update in-memory store
    const memIdx = (global._routineRequests || []).findIndex(
      r => r._id?.toString() === requestId?.toString()
    );
    if (memIdx !== -1) {
      global._routineRequests[memIdx].status = "accepted";
      global._routineRequests[memIdx].doctorId = doctorId;
      global._routineRequests[memIdx].doctorName = doctorName;
      global._routineRequests[memIdx].roomId = roomId;
      global._routineRequests[memIdx].acceptedAt = new Date();
      if (!routineRequest) {
        routineRequest = global._routineRequests[memIdx];
      }
    }

    if (!routineRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Notify patient in real-time via Socket.IO
    if (global._io) {
      const patientRoom = `patient_${routineRequest.userId}`;
      const userRoom = `user_${routineRequest.userId}`;
      
      const acceptedPayload = {
        requestId,
        roomId,
        connectionType: routineRequest.connectionType,
        doctorName: doctorName,
        acceptedAt: new Date()
      };

      global._io.to(patientRoom).emit("routine-request-accepted", acceptedPayload);
      global._io.to(userRoom).emit("routine-request-accepted", acceptedPayload);
      global._io.emit("routine-request-removed", { requestId });
      console.log(`📡 Emitted routine-request-accepted to rooms: ${patientRoom}, ${userRoom}`);
    }

    return NextResponse.json({
      success: true,
      roomId,
      connectionType: routineRequest.connectionType,
      message: "Request accepted successfully"
    });

  } catch (error) {
    console.error("Error accepting routine doctor request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept request" },
      { status: 500 }
    );
  }
}
