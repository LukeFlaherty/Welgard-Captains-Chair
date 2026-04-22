"use server";

/**
 * GoHighLevel integration service.
 *
 * Designed as the primary external integration target for this platform.
 * Full sync is not implemented in v1 — this module is a clean stub that
 * future work can expand without rearchitecting the calling code.
 *
 * Future use cases:
 *  - Pull member/contact data from GHL into inspection records
 *  - Push report metadata and Green/Yellow/Red status to GHL contacts
 *  - Link inspection records to GHL contacts/opportunities
 *  - Trigger GHL automations based on inspection outcome
 */

export type GhlContactData = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type GhlSyncPayload = {
  inspectionId: string;
  status: "green" | "yellow" | "red";
  reportUrl?: string;
  ghlContactId?: string;
  ghlOpportunityId?: string;
};

export async function getGhlContact(contactId: string): Promise<GhlContactData | null> {
  if (!process.env.GHL_API_KEY) {
    console.warn("[GHL] GHL_API_KEY not configured — skipping contact fetch.");
    return null;
  }
  // TODO: implement GHL REST API call
  // GET https://services.leadconnectorhq.com/contacts/{contactId}
  console.log(`[GHL] Would fetch contact: ${contactId}`);
  return null;
}

export async function pushInspectionResult(payload: GhlSyncPayload): Promise<boolean> {
  if (!process.env.GHL_API_KEY) {
    console.warn("[GHL] GHL_API_KEY not configured — skipping result push.");
    return false;
  }
  // TODO: implement GHL contact/opportunity update
  console.log(`[GHL] Would push result for inspection ${payload.inspectionId}:`, payload.status);
  return false;
}
