"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AUTH_REQUIRED, type ActionResult } from "@/lib/qr/action-types";
import { deleteQrCode } from "@/lib/qr/actions";

function revalidateQrPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/qr-codes");
}

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface BulkDeleteResult {
  deletedIds: string[];
  failedIds: string[];
}

/**
 * Bulk delete authenticated user's QR codes.
 * Reuses single-row deleteQrCode semantics: storage asset cleanup and cascade.
 */
export async function bulkDeleteQrCodes(ids: string[]): Promise<ActionResult<BulkDeleteResult>> {
  if (!ids || ids.length === 0) {
    return { data: { deletedIds: [], failedIds: [] } };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  // Bounded batch size (up to max page size 100)
  const boundedIds = Array.from(new Set(ids)).slice(0, 100);
  const deletedIds: string[] = [];
  const failedIds: string[] = [];

  for (const id of boundedIds) {
    const res = await deleteQrCode(id);
    if (res.data) {
      deletedIds.push(id);
    } else {
      failedIds.push(id);
    }
  }

  revalidateQrPaths();
  return { data: { deletedIds, failedIds } };
}

export interface BulkStatusResult {
  updatedIds: string[];
  skippedIds: string[];
  failedIds: string[];
  message?: string;
}

/**
 * Bulk Pause or Resume authenticated user's QR codes.
 * Only applies to dynamic QRs. Static or archived QRs are skipped without mutation.
 * Idempotent: QRs already in the target status are counted as updated/retained.
 */
export async function bulkSetQrCodeStatus(
  ids: string[],
  targetStatus: "active" | "paused",
): Promise<ActionResult<BulkStatusResult>> {
  if (!ids || ids.length === 0) {
    return { data: { updatedIds: [], skippedIds: [], failedIds: [] } };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { error: AUTH_REQUIRED };

  const boundedIds = Array.from(new Set(ids)).slice(0, 100);

  // Fetch candidate records belonging to the authenticated user (RLS-scoped)
  const { data: rows, error: fetchError } = await supabase
    .from("qr_codes")
    .select("id, mode, status")
    .in("id", boundedIds);

  if (fetchError) {
    return { error: fetchError.message };
  }

  const foundMap = new Map((rows ?? []).map((r) => [r.id, r]));
  const updatedIds: string[] = [];
  const skippedIds: string[] = [];
  const failedIds: string[] = [];
  const toUpdate: string[] = [];

  for (const id of boundedIds) {
    const record = foundMap.get(id);
    if (!record) {
      failedIds.push(id);
      continue;
    }

    // Static QRs cannot be paused or resumed
    if (record.mode !== "dynamic") {
      skippedIds.push(id);
      continue;
    }

    // Archived QRs cannot be paused/resumed via bulk
    if (record.status === "archived") {
      skippedIds.push(id);
      continue;
    }

    // Already in target status (idempotent)
    if (record.status === targetStatus) {
      updatedIds.push(id);
      continue;
    }

    toUpdate.push(id);
  }

  if (toUpdate.length > 0) {
    const { data: updatedRows, error: updateError } = await supabase
      .from("qr_codes")
      .update({ status: targetStatus })
      .in("id", toUpdate)
      .select("id");

    if (updateError) {
      failedIds.push(...toUpdate);
    } else {
      const successful = new Set((updatedRows ?? []).map((r) => r.id));
      for (const id of toUpdate) {
        if (successful.has(id)) updatedIds.push(id);
        else failedIds.push(id);
      }
    }
  }

  let message: string | undefined;
  if (skippedIds.length > 0) {
    const actionWord = targetStatus === "paused" ? "paused" : "resumed";
    message = `${skippedIds.length} item(s) skipped (static or archived QR codes cannot be ${actionWord}).`;
  }

  revalidateQrPaths();
  return {
    data: {
      updatedIds,
      skippedIds,
      failedIds,
      message,
    },
  };
}