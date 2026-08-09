import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";
import { absoluteUrl } from "@/lib/url";

export async function GET(request: Request) {
  await logoutUser();
  return NextResponse.redirect(absoluteUrl("/login", request.url));
}
