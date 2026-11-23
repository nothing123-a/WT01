import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoutineDoctorRequest from "@/models/RoutineDoctorRequest";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    let latestRequest = null;
    try {
      await dbConnect();
      latestRequest = await RoutineDoctorRequest.findOne({ 
        userId,
        status: { $in: ["pending", "accepted"] }
      }).sort({ createdAt: -1 });
    } catch (dbErr) {
      console.warn("MongoDB unavailable for status check, using memory fallback:", dbErr.message);
    }

    // Check memory if not found in db
    if (!latestRequest && global._routineRequests) {
      const memMatches = global._routineRequests
        .filter(r => r.userId === userId && ["pending", "accepted"].includes(r.status))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (memMatches.length > 0) {
        latestRequest = memMatches[0];
      }
    }

    if (!latestRequest) {
      return NextResponse.json({
        status: "not_found",
        message: "No pending requests found"
      });
    }

    return NextResponse.json({
      status: latestRequest.status,
      roomId: latestRequest.roomId,
      connectionType: latestRequest.connectionType,
      doctorName: latestRequest.doctorName,
      acceptedAt: latestRequest.acceptedAt
    });

  } catch (error) {
    console.error("Error checking routine doctor status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
