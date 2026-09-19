"use server";

import { createClient } from "@/lib/supabase/server";
import { slugifyForFilename } from "@/lib/qr/render";

export interface LogoActionResult {
  data?: {
    id: string;
    name: string;
    path: string;
    url: string;
  };
  error?: string;
}

/**
 * Saves an uploaded logo into the user's private `qr-logos` storage bucket
 * and registers it in `qr_assets` with `user_id = auth.uid()`.
 */
export async function uploadUserLogoAction(formData: FormData): Promise<LogoActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to save a logo to your account." };

    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "No image file provided." };

    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Unsupported image format. Use PNG, JPEG, SVG, or WebP." };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { error: "Logo file is too large (max 2MB)." };
    }

    const assetId = crypto.randomUUID();
    const baseName = slugifyForFilename(file.name.replace(/\.[^./]+$/, ""), "logo");
    const ext = file.name.includes(".")
      ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      : ".png";
    const path = `${user.id}/${assetId}/${baseName}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("qr-logos")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return { error: uploadError.message };

    const { data: asset, error: insertError } = await supabase
      .from("qr_assets")
      .insert({
        user_id: user.id,
        qr_code_id: null,
        asset_type: "logo",
        bucket: "qr-logos",
        path,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select("id")
      .single();

    if (insertError || !asset) {
      await supabase.storage.from("qr-logos").remove([path]);
      return { error: insertError?.message ?? "Failed to register logo." };
    }

    const { data: signed } = await supabase.storage
      .from("qr-logos")
      .createSignedUrl(path, 60 * 60 * 24);

    return {
      data: {
        id: asset.id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        path,
        url: signed?.signedUrl ?? "",
      },
    };
  } catch {
    return { error: "Failed to upload logo." };
  }
}

export async function deleteUserLogoAction(assetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized." };

    const { data: asset } = await supabase
      .from("qr_assets")
      .select("path, bucket")
      .eq("id", assetId)
      .single();

    if (!asset) return { success: false, error: "Logo not found." };

    await supabase.storage.from(asset.bucket).remove([asset.path]);
    await supabase.from("qr_assets").delete().eq("id", assetId);

    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete logo." };
  }
}
