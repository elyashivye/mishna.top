import { NextResponse } from "next/server";
import { requireLogin } from "@/lib/auth";
import { isPageMember } from "@/lib/study-pages";
import { setCurrentPageId } from "@/lib/current-page";
import { absoluteUrl } from "@/lib/url";

export async function GET(request: Request) {
  const user = await requireLogin();
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));

  if (id && (await isPageMember(id, user.id))) {
    await setCurrentPageId(id);
  }

  return NextResponse.redirect(absoluteUrl("/page", request.url));
}
