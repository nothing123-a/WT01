import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoutineDoctorRequest from "@/models/RoutineDoctorRequest";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    let requests = [];
    try {
      await dbConnect();
      requests = await RoutineDoctorRequest.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(30);
    } catch (dbErr) {
      console.warn("MongoDB unavailable, serving from in-memory fallback:", dbErr.message);
    }

    // Merge in-memory pending requests
    const memoryPending = (global._routineRequests || [])
      .filter(r => r.status === "pending")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const merged = [...requests];
    for (const mem of memoryPending) {
      if (!merged.some(r => r._id?.toString() === mem._id?.toString() || (r.userId === mem.userId && r.status === 'pending'))) {
        merged.unshift(mem);
      }
    }

    // Sort all merged newest first
    merged.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

    return NextResponse.json({
      success: true,
      requests: merged
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("Error fetching routine doctor requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
