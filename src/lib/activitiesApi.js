/**
 * activitiesApi.js
 * Write operations for activities in Supabase.
 * Used by admin pages to create and update activity records.
 */

import { hasSupabaseEnv, supabase } from "./supabase";

const activityImageBucket = import.meta.env.VITE_SUPABASE_ACTIVITY_IMAGES_BUCKET || "activities";
const configuredImageColumn = import.meta.env.VITE_SUPABASE_ACTIVITIES_IMAGE_COLUMN || "image";

function getImageColumns() {
  const fallback = configuredImageColumn === "image_url" ? "image" : "image_url";
  return [configuredImageColumn, fallback];
}

function isMissingColumnError(error, columnName) {
  if (!error) return false;
  if (error.code === "42703") return true;
  const message = String(error.message || "").toLowerCase();
  return message.includes(`column \"${columnName}\" does not exist`) || message.includes("does not exist");
}

function toCreatePayload(data, imageColumn) {
  return {
    title: (data.title || "").trim(),
    day: (data.day || "").trim(),
    date: (data.date || "").trim(),
    enddate: (data.enddate || "").trim(),
    detail: (data.detail || "").trim(),
    [imageColumn]: (data.image || "").trim(),
    active: (data.active || "Y").toUpperCase(),
    published: Boolean(data.published),
  };
}

function toUpdatePayload(updates, imageColumn) {
  const payload = {};
  if (updates.title !== undefined) payload.title = (updates.title || "").trim();
  if (updates.day !== undefined) payload.day = (updates.day || "").trim();
  if (updates.date !== undefined) payload.date = (updates.date || "").trim();
  if (updates.enddate !== undefined) payload.enddate = (updates.enddate || "").trim();
  if (updates.detail !== undefined) payload.detail = (updates.detail || "").trim();
  if (updates.image !== undefined) payload[imageColumn] = (updates.image || "").trim();
  if (updates.active !== undefined) payload.active = (updates.active || "Y").toUpperCase();
  if (updates.published !== undefined) payload.published = Boolean(updates.published);
  return payload;
}

function sanitizeFileName(name) {
  return (name || "image")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

/**
 * Upload an activity image to Supabase Storage.
 * Returns public URL and storage path to persist in the activity record.
 */
export async function uploadActivityImage(file) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  if (!file) {
    return { data: null, error: new Error("Geen bestand geselecteerd.") };
  }

  if (!file.type || !file.type.startsWith("image/")) {
    return { data: null, error: new Error("Alleen afbeeldingbestanden zijn toegestaan.") };
  }

  const safeName = sanitizeFileName(file.name);
  const filePath = `activities/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase
    .storage
    .from(activityImageBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: publicData } = supabase
    .storage
    .from(activityImageBucket)
    .getPublicUrl(filePath);

  return {
    data: {
      bucket: activityImageBucket,
      path: filePath,
      publicUrl: publicData?.publicUrl || "",
    },
    error: null,
  };
}

/**
 * Create a new activity in Supabase.
 * Returns the inserted activity record or error.
 */
export async function createActivity({
  title,
  day = "",
  date = "",
  enddate = "",
  detail = "",
  image = "",
  active = "Y",
  published = true,
}) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  let lastResult = { data: null, error: null };
  for (const imageColumn of getImageColumns()) {
    const payload = toCreatePayload({ title, day, date, enddate, detail, image, active, published }, imageColumn);
    const result = await supabase
      .from("activities")
      .insert([payload])
      .select("*")
      .single();

    if (!result.error) return result;

    lastResult = result;
    if (!isMissingColumnError(result.error, imageColumn)) {
      return result;
    }
  }

  return lastResult;
}

/**
 * Update an existing activity in Supabase by ID.
 * Returns the updated activity record or error.
 */
export async function updateActivity(id, updates) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  if (!id) {
    return { data: null, error: new Error("Activity ID is required.") };
  }

  // If image is not touched, update once without image column fallback logic.
  if (updates.image === undefined) {
    const payload = toUpdatePayload(updates, configuredImageColumn);
    const { data, error } = await supabase
      .from("activities")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    return { data, error };
  }

  let lastResult = { data: null, error: null };
  for (const imageColumn of getImageColumns()) {
    const payload = toUpdatePayload(updates, imageColumn);
    const result = await supabase
      .from("activities")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (!result.error) return result;

    lastResult = result;
    if (!isMissingColumnError(result.error, imageColumn)) {
      return result;
    }
  }

  return lastResult;
}

/**
 * Delete an activity from Supabase by ID.
 * Returns success status or error.
 */
export async function deleteActivity(id) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  if (!id) {
    return { data: null, error: new Error("Activity ID is required.") };
  }

  const { data, error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id);

  return { data, error };
}
