import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";

export async function GET(request: Request) {
  await logoutUser();
  return NextResponse.redirect(new URL("/login", request.url));
}
