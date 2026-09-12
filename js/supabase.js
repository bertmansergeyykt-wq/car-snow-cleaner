export const SUPABASE_URL =
  "https://dghcnwzqqmrsysewnvkn.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_OObcKHZ0AGc5AI5c_3KY-Q_GpzEKI8C";

export const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

export const QUICK_PROCESSOR_URL =
  `${SUPABASE_URL}/functions/v1/quick-processor`;
