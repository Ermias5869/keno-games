import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/middleware";
import { adminService } from "@/modules/admin/admin.service";
import { z } from "zod";

const UpdateMultiplierSchema = z.object({
  id: z.string().min(1),
  multiplier: z.number().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const adminCheck = requireAdmin(authResult);
    if (adminCheck) return adminCheck;

    const multipliers = await adminService.getMultipliers();
    return NextResponse.json({ multipliers });
  } catch (error) {
    console.error("Admin get multipliers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const adminCheck = requireAdmin(authResult);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const result = UpdateMultiplierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await adminService.updateMultiplier(
      result.data.id,
      result.data.multiplier
    );

    return NextResponse.json({ multiplier: updated });
  } catch (error) {
    console.error("Admin update multiplier error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
