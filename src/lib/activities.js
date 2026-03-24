/**
 * activities.js
 * Centralized module for activity management.
 * Handles reading activities from Supabase or fallback CSV,
 * slug generation, routing, and filtering.
 */

import { hasSupabaseEnv, supabase } from "./supabase";

const configuredImageColumn = import.meta.env.VITE_SUPABASE_ACTIVITIES_IMAGE_COLUMN || "image";

function getImageColumns() {
  const fallback = configuredImageColumn === "image_url" ? "image" : "image_url";
  return [configuredImageColumn, fallback];
}

/**
 * Safely convert any value to trimmed text.
 * Returns empty string for null/undefined values.
 */
function asText(value) {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * Check if an activity is marked as active (active = "Y").
 * Used to filter visible activities throughout the app.
 */
export function isActivityActive(activity) {
  return (activity?.active || "").toUpperCase() === "Y";
}

/**
 * Convert an activity title into a URL-safe slug.
 * Removes special characters, accents, and spaces.
 * Example: "Zomer Training 2025" → "zomer-training-2025"
 */
export function slugifyActivityTitle(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate the route path for an activity detail page.
 * Returns "/agenda/activiteit/{slug}" if activity is active.
 * Falls back to "/agenda" if activity is inactive or missing.
 */
export function activityPath(activity) {
  if (!activity || !isActivityActive(activity)) return "/agenda";
  const slug = slugifyActivityTitle(activity.title);
  return slug ? `/agenda/activiteit/${slug}` : "/agenda";
}

/**
 * Transform a list of activities into routable items with slug and filtering.
 * Only includes active activities and attaches a slug to each for URL generation.
 * Used by App for navigation menu items.
 */
export function toActivitiesWithSlug(activities) {
  return (activities || [])
    .filter((activity) => isActivityActive(activity))
    .map((activity) => ({
      ...activity,
      slug: slugifyActivityTitle(activity.title),
    }))
    .filter((activity) => activity.slug);
}

/**
 * Parse CSV text into an array of activity objects.
 * Expects first row to be headers (title, day, date, enddate, detail, image, active).
 * Filters out rows without a title.
 */
function parseActivitiesCsv(text) {
  const [headerLine, ...rows] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());

  return rows
    .map((row) => {
      const cols = row.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (cols[i] ?? "").trim();
      });
      return obj;
    })
    .filter((row) => row.title);
}

/**
 * Fetch published activities from Supabase database.
 * Checks for published=true OR active="Y".
 * Falls back to empty array if Supabase is not configured or query fails.
 */
export async function getPublishedActivities() {
  if (!hasSupabaseEnv || !supabase) return [];

  let rows = null;
  let usedImageColumn = configuredImageColumn;

  for (const imageColumn of getImageColumns()) {
    const { data, error } = await supabase
      .from("activities")
      .select(`id, title, day, date, enddate, detail, ${imageColumn}, active, published`)
      .or("published.eq.true,active.eq.Y")
      .order("date", { ascending: true });

    if (!error && Array.isArray(data)) {
      rows = data;
      usedImageColumn = imageColumn;
      break;
    }
  }

  if (!rows) return [];

  return rows
    .map((row) => ({
      id: row.id,
      title: asText(row.title),
      day: asText(row.day),
      date: asText(row.date),
      enddate: asText(row.enddate),
      detail: asText(row.detail),
      image: asText(row[usedImageColumn]),
      published: row.published === true,
      active: row.published === true ? "Y" : asText(row.active || "Y").toUpperCase(),
    }))
    .filter((row) => row.title);
}

/**
 * Fetch activities from the public activities.csv file.
 * Used as fallback when Supabase is not available.
 */
export async function getActivitiesFromCsv() {
  const response = await fetch("/activities.csv");
  const text = await response.text();
  return parseActivitiesCsv(text);
}

/**
 * Load activities with intelligent fallback strategy.
 * 1. Tries Supabase database first
 * 2. Falls back to CSV file if Supabase returns no results
 * 3. Returns empty array if both sources fail
 */
export async function loadActivities() {
  const dbActivities = await getPublishedActivities();
  if (dbActivities.length > 0) return dbActivities;

  try {
    return await getActivitiesFromCsv();
  } catch {
    return [];
  }
}
