"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTH_REQUIRED, type ActionResult, type SaveQrCodeInput } from "@/lib/qr/action-types";
import { buildQrPayload } from "@/lib/qr/render";
import { generateRandomSlug } from "@/lib/qr/slug";
import type { QRCodeStatus } from "@/types/qr-record";

function revalidateQrPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
  if (id) revalidatePath(`/dashboard/qr-codes/${id}`);
}

const UNIQUE_VIOLATION = "23505";
const MAX_SLUG_ATTEMPTS = 3;

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function validateSaveInput(input: SaveQrCodeInput): { payload: string } | { error: string } {
  if (!input.name.trim()) {
    return { error: "Give your QR code a name before saving." };
  }
  const payload = buildQrPayload(input.qrType, input.content);
  if (!payload) {
    return { error: "Fix the content errors above before saving." };
  }
  return { payload };
}

/**
 * A dynamic QR's `destination_url` is denormalized from its own validated
 * payload so the redirect route (a hot, latency-sensitive path) can resolve
 * it with a single flat column read — no registry/payload-builder logic
 * available there at all, since it runs through a SECURITY DEFINER SQL
 * function, not app code. Only ever non-null for dynamic types whose
 * payload already *is* a destination (currently `url`, `whatsapp` — the
 * only dynamic types with a real content form); types that need a hosted
 * landing page instead (`needsLandingPage: true`) don't have one yet, so
 * `buildQrPayload` already returns `null` for them and this stays null too.
 */
function resolveDestinationUrl(input: SaveQrCodeInput, payload: string): string | null {
  return input.mode === "dynamic" ? payload : null;
}

export async function saveQrCode(input: SaveQrCodeInput): Promise<ActionResult<{ id: string }>> {
  const validated = validateSaveInput(input);
  if ("error" in validated) return { error: validated.error };

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const destinationUrl = resolveDestinationUrl(input, validated.payload);

  let lastError: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = input.mode === "dynamic" ? generateRandomSlug() : null;
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        mode: input.mode,
        qr_type: input.qrType,
        payload_data: input.content,
        design_config: input.design,
        destination_url: destinationUrl,
        slug,
      })
      .select("id")
      .single();

    if (!error) {
      revalidateQrPaths(data.id);
      return { data: { id: data.id } };
    }
    if (error.code !== UNIQUE_VIOLATION) return { error: error.message };
    lastError = error.message;
  }
  return { error: lastError ?? "Couldn't save — please try again." };
}

export async function updateQrCode(
  id: string,
  input: SaveQrCodeInput,
): Promise<ActionResult<{ id: string }>> {
  const validated = validateSaveInput(input);
  if ("error" in validated) return { error: validated.error };

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { data: existing } = await supabase
    .from("qr_codes")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return { error: "Couldn't find that QR code — it may have been deleted." };
  }

  const destinationUrl = resolveDestinationUrl(input, validated.payload);

  let lastError: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = input.mode === "dynamic" ? (existing.slug ?? generateRandomSlug()) : existing.slug;

    const { data, error } = await supabase
      .from("qr_codes")
      .update({
        name: input.name.trim(),
        mode: input.mode,
        qr_type: input.qrType,
        payload_data: input.content,
        design_config: input.design,
        destination_url: destinationUrl,
        slug,
      })
      .eq("id", id)
      .select("id")
      .single();

    if (!error) {
      revalidateQrPaths(id);
      return { data: { id: data.id } };
    }
    if (error.code !== UNIQUE_VIOLATION) {
      return {
        error: "Couldn't save changes — it may have been deleted, or you may not have access.",
      };
    }
    // Only a fresh dynamic slug can conflict; retry with a new one.
    existing.slug = null;
    lastError = error.message;
  }
  return { error: lastError ?? "Couldn't save — please try again." };
}

export async function duplicateQrCode(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { data: source, error: fetchError } = await supabase
    .from("qr_codes")
    .select("name, mode, qr_type, payload_data, design_config, destination_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !source) {
    return { error: "Couldn't find that QR code to duplicate." };
  }

  let lastError: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = source.mode === "dynamic" ? generateRandomSlug() : null;
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        user_id: user.id,
        name: `${source.name} (Copy)`,
        mode: source.mode,
        qr_type: source.qr_type,
        payload_data: source.payload_data,
        design_config: source.design_config,
        destination_url: source.destination_url,
        slug,
        status: "active",
      })
      .select("id")
      .single();

    if (!error) {
      revalidateQrPaths(data.id);
      return { data: { id: data.id } };
    }
    if (error.code !== UNIQUE_VIOLATION) return { error: error.message };
    lastError = error.message;
  }
  return { error: lastError ?? "Couldn't duplicate — please try again." };
}

export async function setQrCodeStatus(
  id: string,
  status: QRCodeStatus,
): Promise<ActionResult<{ status: QRCodeStatus }>> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { data, error } = await supabase
    .from("qr_codes")
    .update({ status })
    .eq("id", id)
    .select("status")
    .single();

  if (error) {
    return {
      error: "Couldn't update status — it may have been deleted, or you may not have access.",
    };
  }

  revalidateQrPaths(id);
  return { data: { status: data.status as QRCodeStatus } };
}

export async function deleteQrCode(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const { error, count } = await supabase.from("qr_codes").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { error: "Couldn't delete — it may already be gone, or you may not have access." };
  }
  if (!count) {
    return { error: "That QR code no longer exists, or you don't have access to it." };
  }

  revalidateQrPaths(id);
  return { data: { id } };
}
