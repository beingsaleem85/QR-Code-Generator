"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  AUTH_REQUIRED,
  MAX_QR_NAME_LENGTH,
  type ActionResult,
  type SaveQrCodeInput,
} from "@/lib/qr/action-types";
import { buildQrPayload } from "@/lib/qr/render";
import { generateRandomSlug } from "@/lib/qr/slug";
import { generatePublicToken } from "@/lib/qr/public-token";
import { getEntitlementForUser, resolveDynamicQrAllowance } from "@/lib/account/entitlements";
import { countDynamicQrCodes } from "@/lib/qr/queries";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import { syncQrAssets, duplicateQrAssets } from "@/lib/qr/asset-sync";
import type { QRCodeStatus } from "@/types/qr-record";
import type { QRMode, QRType } from "@/types/qr";

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
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { error: "Give your QR code a name before saving." };
  }
  if (trimmedName.length > MAX_QR_NAME_LENGTH) {
    return { error: `QR name must be ${MAX_QR_NAME_LENGTH} characters or fewer.` };
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
 * function, not app code. Only ever non-null for dynamic types that
 * actually redirect (`needsLandingPage: false` — `url`, `whatsapp`).
 * Landing-page types (pdf, image gallery, audio, video) encode `/p/[slug]`
 * instead (`resolveEncodedPayload`, `src/lib/qr/render.ts`) and have no
 * single "destination" to denormalize — their built payload is never a
 * real URL to begin with (see each payload builder's own doc comment), so
 * this stays `null` for them regardless of mode.
 */
function resolveDestinationUrl(input: SaveQrCodeInput, payload: string): string | null {
  if (input.mode !== "dynamic") return null;
  return getQrTypeDefinition(input.qrType).needsLandingPage ? null : payload;
}

/**
 * Whether a brand-new row should be issued an opaque `public_token`
 * (`/v/[token]`, see `resolveEncodedPayload`'s own doc comment) instead of
 * relying on `slug`-based `/p/[slug]`. Decided once, at the moment a row
 * is first inserted (a fresh save or a duplicate — both are new rows) —
 * never on `updateQrCode`, since the printed QR's URL choice must stay
 * fixed for the life of the record once issued, the same way `slug`
 * itself never changes after creation.
 */
function shouldMintPublicToken(mode: QRMode, qrType: QRType, openDirectly: unknown): boolean {
  return mode === "dynamic" && qrType === "pdf" && openDirectly === true;
}

/**
 * Server-side gate for creating (or converting to) a dynamic QR — the
 * client never decides this. Skips the count query entirely for an
 * unlimited entitlement (the common case today, since no plan currently
 * has a finite `dynamic_qr_limit` configured) rather than counting rows
 * that will never matter to the decision.
 */
async function checkDynamicQrAllowance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ error?: string }> {
  const entitlement = await getEntitlementForUser(supabase, userId);
  if (entitlement.dynamicQrLimit === null) return {};

  const count = await countDynamicQrCodes();
  const allowance = resolveDynamicQrAllowance(entitlement, count);
  if (!allowance.allowed) {
    return {
      error: `You've reached your plan's limit of ${allowance.limit} dynamic QR codes. Archive or delete one to create another, or upgrade your plan.`,
    };
  }
  return {};
}

export async function saveQrCode(input: SaveQrCodeInput): Promise<ActionResult<{ id: string }>> {
  const validated = validateSaveInput(input);
  if ("error" in validated) return { error: validated.error };

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  if (input.mode === "dynamic") {
    const allowance = await checkDynamicQrAllowance(supabase, user.id);
    if (allowance.error) return { error: allowance.error };
  }

  const destinationUrl = resolveDestinationUrl(input, validated.payload);

  const mintToken = shouldMintPublicToken(input.mode, input.qrType, input.content.openDirectly);

  let lastError: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = input.mode === "dynamic" ? generateRandomSlug() : null;
    const publicToken = mintToken ? generatePublicToken() : null;
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
        public_token: publicToken,
      })
      .select("id")
      .single();

    if (!error) {
      if (getQrTypeDefinition(input.qrType).needsStorage) {
        await syncQrAssets(supabase, user.id, data.id, input.qrType, input.content);
      }
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
    .select("slug, mode")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return { error: "Couldn't find that QR code — it may have been deleted." };
  }

  // Only check the allowance when this edit is what actually turns the QR
  // dynamic — an already-dynamic QR being edited isn't consuming a new
  // slot, and blocking edits to it just because the account happens to be
  // at its limit would be a hostile, pointless restriction.
  if (input.mode === "dynamic" && existing.mode !== "dynamic") {
    const allowance = await checkDynamicQrAllowance(supabase, user.id);
    if (allowance.error) return { error: allowance.error };
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
      if (getQrTypeDefinition(input.qrType).needsStorage) {
        await syncQrAssets(supabase, user.id, id, input.qrType, input.content);
      }
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

  // Duplicating a dynamic QR creates a brand-new dynamic row — consumes a
  // slot exactly like saveQrCode does.
  if (source.mode === "dynamic") {
    const allowance = await checkDynamicQrAllowance(supabase, user.id);
    if (allowance.error) return { error: allowance.error };
  }

  const sourcePayload = source.payload_data as Record<string, unknown>;
  const mintToken = shouldMintPublicToken(
    source.mode as QRMode,
    source.qr_type as QRType,
    sourcePayload?.openDirectly,
  );

  let lastError: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = source.mode === "dynamic" ? generateRandomSlug() : null;
    const publicToken = mintToken ? generatePublicToken() : null;
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
        public_token: publicToken,
        status: "active",
      })
      .select("id")
      .single();

    if (!error) {
      // Give the duplicate its own independent copy of any Storage-backed
      // asset (never share ownership of the original's file — see
      // `duplicateQrAssets`'s doc comment for why that would make deleting
      // either QR unsafe for the other).
      if (getQrTypeDefinition(source.qr_type as QRType).needsStorage) {
        const remapped = await duplicateQrAssets(
          supabase,
          user.id,
          data.id,
          source.qr_type as QRType,
          source.payload_data,
        );
        if (remapped !== source.payload_data) {
          await supabase.from("qr_codes").update({ payload_data: remapped }).eq("id", data.id);
        }
      }
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

  // qr_assets.qr_code_id is ON DELETE SET NULL (Module 1.4), not CASCADE —
  // deliberately, so an asset can outlive its QR if ever needed — but a
  // plain delete would otherwise leave the underlying Storage files
  // orphaned forever with nothing in the UI ever pointing at them again.
  // Fetched before the delete since qr_code_id becomes unqueryable-by-id
  // (set to null) the moment the parent row is gone.
  const { data: orphanedAssets } = await supabase
    .from("qr_assets")
    .select("id, bucket, path")
    .eq("qr_code_id", id);

  const { error, count } = await supabase.from("qr_codes").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { error: "Couldn't delete — it may already be gone, or you may not have access." };
  }
  if (!count) {
    return { error: "That QR code no longer exists, or you don't have access to it." };
  }

  for (const asset of (orphanedAssets as { id: string; bucket: string; path: string }[] | null) ??
    []) {
    await supabase.storage.from(asset.bucket).remove([asset.path]);
  }
  if (orphanedAssets && orphanedAssets.length > 0) {
    await supabase
      .from("qr_assets")
      .delete()
      .in(
        "id",
        (orphanedAssets as { id: string }[]).map((asset) => asset.id),
      );
  }

  revalidateQrPaths(id);
  return { data: { id } };
}
