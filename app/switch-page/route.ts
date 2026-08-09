import { NextResponse } from "next/server";
import { requireLogin } from "@/lib/auth";
import { isPageMember } from "@/lib/study-pages";
import { setCurrentPageId } from "@/lib/current-page";

export async function GET(request: Request) {
  const user = await requireLogin();
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));

  if (id && (await isPageMember(id, user.id))) {
    await setCurrentPageId(id);
  }

  return NextResponse.redirect(new URL("/page", request.url));
}
