// Denoモジュール用のダミー型定義
declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.7.1' {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
} 