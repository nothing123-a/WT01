import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoutineDoctorRequest from "@/models/RoutineDoctorRequest";

export async function GET(request) {
  try {
    let requests = [];
    try {
      await dbConnect();
      requests = await RoutineDoctorRequest.find({ status: "pending" })
        .sort({ timestamp: 1 })
        .limit(20);
    } catch (dbErr) {
      console.warn("MongoDB unavailable, serving from in-memory fallback:", dbErr.message);
    }

    // Merge in-memory pending requests
    const memoryPending = (global._routineRequests || []).filter(r => r.status === "pending");
    const merged = [...requests];
    for (const mem of memoryPending) {
      if (!merged.some(r => r._id?.toString() === mem._id?.toString() || (r.userId === mem.userId && r.status === 'pending'))) {
        merged.push(mem);
      }
    }

    return NextResponse.json({
      success: true,
      requests: merged
    });

  } catch (error) {
    console.error("Error fetching routine doctor requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
