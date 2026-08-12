import { z } from "zod";

/**
 * Placeholder field schema for QR types whose real fields/validation land
 * in a later module (storage-backed and hosted-landing-page types). Never
 * used to accept real user input — the registry entry's payloadBuilder is
 * also left undefined for these types.
 */
export const notYetImplementedQrSchema = z.object({}).describe("Defined in a later module.");
