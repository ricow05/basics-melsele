import { hasSupabaseEnv, supabase } from "./supabase";

function asText(value) {
  if (value == null) return "";
  return String(value).trim();
}

export async function getPublishedNewsTickerItems() {
  if (!hasSupabaseEnv || !supabase) return [];

  const { data, error } = await supabase
    .from("news")
    .select("title, summary, content, message, item, text, published")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !Array.isArray(data)) return [];

  return data
    .map((row) => {
      return (
        asText(row.message) ||
        asText(row.text) ||
        asText(row.item) ||
        asText(row.summary) ||
        asText(row.content) ||
        asText(row.title)
      );
    })
    .filter(Boolean);
}

export async function createNewsItem({ title, content, summary = "", published = true }) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const payload = {
    title: asText(title),
    summary: asText(summary),
    content: asText(content),
    published,
  };

  const { data, error } = await supabase
    .from("news")
    .insert(payload)
    .select("id, title, summary, content, published")
    .single();

  return { data, error };
}
