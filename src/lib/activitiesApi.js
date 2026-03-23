/**
 * activitiesApi.js
 * Write operations for activities in Supabase.
 * Used by admin pages to create and update activity records.
 */

import { hasSupabaseEnv, supabase } from "./supabase";

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

  const payload = {
    title: (title || "").trim(),
    day: (day || "").trim(),
    date: (date || "").trim(),
    enddate: (enddate || "").trim(),
    detail: (detail || "").trim(),
    image: (image || "").trim(),
    active: (active || "Y").toUpperCase(),
    published: Boolean(published),
  };

  const { data, error } = await supabase
    .from("activities")
    .insert([payload])
    .select("*")
    .single();

  return { data, error };
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

  const payload = {};
  if (updates.title !== undefined) payload.title = (updates.title || "").trim();
  if (updates.day !== undefined) payload.day = (updates.day || "").trim();
  if (updates.date !== undefined) payload.date = (updates.date || "").trim();
  if (updates.enddate !== undefined) payload.enddate = (updates.enddate || "").trim();
  if (updates.detail !== undefined) payload.detail = (updates.detail || "").trim();
  if (updates.image !== undefined) payload.image = (updates.image || "").trim();
  if (updates.active !== undefined) payload.active = (updates.active || "Y").toUpperCase();
  if (updates.published !== undefined) payload.published = Boolean(updates.published);

  const { data, error } = await supabase
    .from("activities")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  return { data, error };
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
