/**
 * GoHighLevel API client.
 *
 * Handles contact search, custom field resolution, and contact updates.
 * All functions throw on API errors — callers should catch and handle.
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

function ghlHeaders() {
  const key = process.env.GHL_API_KEY;
  if (!key) throw new Error("GHL_API_KEY is not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Version: GHL_VERSION,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type GhlContact = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type GhlCustomField = {
  id: string;
  fieldKey: string;
};

export type SyncableInspection = {
  finalStatus: string;
  inspectionDate: Date;
  inspectionCompany: string | null;
  inspectorName: string | null;
  inspector: { phone: string | null; email: string | null } | null;
  homeownerName: string;
  homeownerPhone: string | null;
  homeownerEmail: string | null;
  propertyAddress: string;
  propertyAddress2: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip: string | null;
  realtorInvolved: boolean;
  realtorName: string | null;
  realtorEmail: string | null;
  realtorPhone: string | null;
  wellType: string | null;
  wellCompletionDate: string | null;
  wellPermit: string | null;
  wellObstructions: string | null;
  wellDepthFt: number | null;
  wellDepthUnknown: boolean;
  wellDataSource: string | null;
  casingType: string | null;
  casingSize: string | null;
  wellCap: string | null;
  pumpManufacturer: string | null;
  pumpHp: string | null;
  pumpType: string | null;
  amperageReading: number | null;
  tankBrand: string | null;
  tankModel: string | null;
  tankSizeGal: number | null;
  tankCondition: string | null;
  psiSettings: string | null;
  pressureSwitch: string | null;
  pressureGauge: string | null;
  wireType: string | null;
  constantPressureSystem: boolean;
  controlBoxCondition: string | null;
  waterTreatment: string | null;
  totalGallons: number | null;
  wellYieldGpm: number | null;
  gallonsPerDay: number | null;
  cycleTime: number | null;
  externalEquipmentStatus: string | null;
  internalEquipmentStatus: string | null;
  wellYieldStatus: string | null;
  cycleTimeStatus: string | null;
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function searchContactByEmail(email: string): Promise<GhlContact | null> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) throw new Error("GHL_LOCATION_ID is not configured");

  const url = `${GHL_BASE}/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}&limit=5`;
  const res = await fetch(url, { headers: ghlHeaders(), cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL contact search failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const contacts: GhlContact[] = data.contacts ?? [];

  // Prefer exact email match — GHL search is fuzzy
  return (
    contacts.find((c) => c.email?.toLowerCase() === email.toLowerCase()) ??
    contacts[0] ??
    null
  );
}

export async function fetchCustomFieldMap(): Promise<Map<string, string>> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) throw new Error("GHL_LOCATION_ID is not configured");

  const url = `${GHL_BASE}/locations/${locationId}/customFields`;
  const res = await fetch(url, { headers: ghlHeaders(), cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL custom fields fetch failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const fields: GhlCustomField[] = data.customFields ?? [];

  const map = new Map<string, string>();
  for (const field of fields) {
    // fieldKey comes back as "contact.well_type" — store both full and short forms
    map.set(field.fieldKey, field.id);
  }
  return map;
}

export async function updateContactCustomFields(
  contactId: string,
  customFields: Array<{ id: string; field_value: string }>
): Promise<void> {
  const url = `${GHL_BASE}/contacts/${contactId}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: ghlHeaders(),
    body: JSON.stringify({ customFields }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GHL contact update failed (${res.status}): ${body}`);
  }
}

// ─── Field mapping ────────────────────────────────────────────────────────────

const FINAL_STATUS_LABELS: Record<string, string> = {
  green:      "Premium (Approved)",
  yellow:     "Superior (Conditional)",
  red:        "Standard",
  ineligible: "Ineligible",
};

export function buildCustomFieldPayload(
  inspection: SyncableInspection,
  fieldMap: Map<string, string>
): Array<{ id: string; field_value: string }> {
  const payload: Array<{ id: string; field_value: string }> = [];

  function add(shortKey: string, value: string | null | undefined) {
    const id = fieldMap.get(`contact.${shortKey}`);
    if (!id) return;
    if (value == null || value === "") return;
    payload.push({ id, field_value: value });
  }

  // Review & status
  add("welgard_review_details", FINAL_STATUS_LABELS[inspection.finalStatus] ?? inspection.finalStatus);

  // Inspection source
  add("inspection_date", inspection.inspectionDate.toISOString().split("T")[0]);
  add("inspecting_company", inspection.inspectionCompany);
  add("name_of_inspector", inspection.inspectorName);
  add("inspector_phone", inspection.inspector?.phone);
  add("inspector_email", inspection.inspector?.email);

  // Member / property (well location)
  add("member_name_well_location", inspection.homeownerName);
  add("member_phone_well_location", inspection.homeownerPhone);
  add("member_email_well_location", inspection.homeownerEmail);
  const streetParts = [inspection.propertyAddress, inspection.propertyAddress2].filter(Boolean);
  add("member_street_address_well_location", streetParts.join(", ") || null);
  add("member_city_well_location", inspection.city);
  add("member_county_well_location", inspection.county);
  add("member_state_well_location", inspection.state);
  add("member_zip_well_location", inspection.zip);

  // Realtor
  add("realtor_involved", inspection.realtorInvolved ? "true" : "false");
  add("realtor_name", inspection.realtorName);
  add("realtor_email", inspection.realtorEmail);
  add("realtor_phone", inspection.realtorPhone);

  // Well system
  add("well_type", inspection.wellType);
  add("well_completion_date", inspection.wellCompletionDate);
  add("well_permit_number", inspection.wellPermit);
  add("well_obstruction", inspection.wellObstructions);
  add(
    "well_depth",
    inspection.wellDepthUnknown
      ? "Unknown"
      : inspection.wellDepthFt != null
      ? String(inspection.wellDepthFt)
      : null
  );
  add("well_data_source", inspection.wellDataSource);
  const casingParts = [inspection.casingType, inspection.casingSize].filter(Boolean);
  add("well_casing", casingParts.join(" / ") || null);
  add("well_cap", inspection.wellCap);

  // Pump & external equipment
  add("pump_manufacturer", inspection.pumpManufacturer);
  add("pump_hp", inspection.pumpHp);
  add("pump_type", inspection.pumpType);
  add("amperage_reading", inspection.amperageReading != null ? String(inspection.amperageReading) : null);

  // Tank & internal equipment
  add("tank_manufacturer", inspection.tankBrand);
  add("tank_model_number", inspection.tankModel);
  add("tank_size_gallons", inspection.tankSizeGal != null ? String(inspection.tankSizeGal) : null);
  add("tank_condition", inspection.tankCondition);
  add("psi_settings", inspection.psiSettings);
  add("pressure_switch_condition", inspection.pressureSwitch);
  add("pressure_gauge_condition", inspection.pressureGauge);
  add("wire_gauge", inspection.wireType);
  add("constant_pressure_system", inspection.constantPressureSystem ? "true" : "false");
  add("control_box_condition", inspection.controlBoxCondition);

  // Water treatment
  add("water_treatment_equipment", inspection.waterTreatment ? "true" : "false");
  add("water_treatment_description", inspection.waterTreatment);

  // Yield & cycle calculations
  add("total_gallons_cumulative", inspection.totalGallons != null ? String(inspection.totalGallons) : null);
  add("yield", inspection.wellYieldGpm != null ? String(inspection.wellYieldGpm) : null);
  add("yield__daily_calculated", inspection.gallonsPerDay != null ? String(inspection.gallonsPerDay) : null);
  add("cycle_time", inspection.cycleTime != null ? String(inspection.cycleTime) : null);

  // Category observations
  add("external_equipment_observation", inspection.externalEquipmentStatus);
  add("internal_equipment_observation", inspection.internalEquipmentStatus);
  add("well_yield_observation", inspection.wellYieldStatus);
  add("cycle_time_observation", inspection.cycleTimeStatus);

  return payload;
}
