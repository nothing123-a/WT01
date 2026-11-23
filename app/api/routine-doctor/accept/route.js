import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoutineDoctorRequest from "@/models/RoutineDoctorRequest";
import Room from "@/models/Room";

export async function POST(request) {
  try {
    await dbConnect();
    
    const { requestId, doctorId, doctorName } = await request.json();
    
    if (!requestId || !doctorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const routineRequest = await RoutineDoctorRequest.findById(requestId);
    
    if (!routineRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (routineRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const room = new Room({
      roomId,
      userId: routineRequest.userId,
      doctorId: doctorId,
      type: routineRequest.connectionType,
      status: "active"
    });

    await room.save();

    routineRequest.status = "accepted";
    routineRequest.doctorId = doctorId;
    routineRequest.doctorName = doctorName;
    routineRequest.roomId = roomId;
    routineRequest.acceptedAt = new Date();
    
    await routineRequest.save();

    // Notify the patient in real-time via Socket.IO
    if (global._io) {
      const patientRoom = `patient_${routineRequest.userId}`;
      const userRoom = `user_${routineRequest.userId}`;
      
      const acceptedPayload = {
        requestId,
        roomId,
        connectionType: routineRequest.connectionType,
        doctorName: doctorName,
        acceptedAt: routineRequest.acceptedAt
      };

      // Emit to both patient_ and user_ rooms for compatibility
      global._io.to(patientRoom).emit("routine-request-accepted", acceptedPayload);
      global._io.to(userRoom).emit("routine-request-accepted", acceptedPayload);
      console.log(`📡 Emitted routine-request-accepted to rooms: ${patientRoom}, ${userRoom}`);

      // Also notify all doctors to remove the request from their panels
      global._io.emit("routine-request-removed", { requestId });
      console.log(`📡 Emitted routine-request-removed to all sockets`);
    } else {
      console.error("⚠️ global._io is NOT available! Patient will only be notified via polling.");
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
      { error: "Failed to accept request" },
      { status: 500 }
    );
  }
}