import { NextResponse } from "next/server";
import { resolveDynamicQrRedirect } from "@/server/services/redirect-resolution";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const resolution = await resolveDynamicQrRedirect(slug);

  if (resolution.status === "ok") {
    return NextResponse.redirect(resolution.destinationUrl);
  }

  return NextResponse.json({ error: resolution.status }, { status: 404 });
}
