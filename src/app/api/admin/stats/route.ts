import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/middleware";
import { adminService } from "@/modules/admin/admin.service";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const adminCheck = requireAdmin(authResult);
    if (adminCheck) return adminCheck;

    const stats = await adminService.getBetStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Admin get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
