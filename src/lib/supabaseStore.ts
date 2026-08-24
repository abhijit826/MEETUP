import { supabaseDb } from "./supabaseDb";

export async function fetchDbData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await supabaseDb
      .from("app_data")
      .select("value")
      .eq("key", key)
      .single();

    if (error) {
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        // Try creating the row (upsert will create or mock value)
        await saveDbData(key, defaultValue);
        return defaultValue;
      }
      console.error(`Error fetching key ${key} from Supabase:`, error);
      return defaultValue;
    }
    return (data?.value as T) || defaultValue;
  } catch (err) {
    console.error(`Error fetching key ${key}:`, err);
    return defaultValue;
  }
}

export async function saveDbData<T>(key: string, value: T): Promise<void> {
  try {
    const { error } = await supabaseDb
      .from("app_data")
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) {
      console.error(`Error saving key ${key} to Supabase:`, error);
    }
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}
