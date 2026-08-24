declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    GEMINI_API_KEY?: string;
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    GMAIL_USER?: string;
    GMAIL_APP_PASSWORD?: string;
    RESEND_API_KEY?: string;
  }
}
