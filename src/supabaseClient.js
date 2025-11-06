import { createClient } from "@supabase/supabase-js";

// Cole sua URL e sua Chave 'anon public' aqui
const supabaseUrl = "https://rocnhapjohuspiihxqfa.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvY25oYXBqb2h1c3BpaWh4cWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjQ2NzIsImV4cCI6MjA3NzI0MDY3Mn0.1EsPlwNMpU7G51_7F3wrnxrLcRx3lzqISJQA_a0SehM";

export const supabase = createClient(supabaseUrl, supabaseKey);
