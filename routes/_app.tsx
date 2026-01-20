import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  // Get Supabase credentials for client-side access
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Calorie Tracker</title>
        <link rel="stylesheet" href="/styles.css" />
        {/* Inject Supabase credentials for client-side access */}
        {supabaseUrl && supabaseAnonKey && (
          <script
            dangerouslySetInnerHTML={{
              __html:
                `window.SUPABASE_URL = ${JSON.stringify(supabaseUrl)};` +
                `window.SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};`,
            }}
          />
        )}
      </head>
      <body class="bg-gray-50 min-h-screen">
        <nav class="bg-blue-600 text-white shadow-md">
          <div class="max-w-4xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold">Calorie Tracker</h1>
              <div class="flex gap-4">
                <a href="/" class="hover:text-blue-200 transition-colors">
                  Today
                </a>
                <a href="/history" class="hover:text-blue-200 transition-colors">
                  History
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main class="max-w-4xl mx-auto px-4 py-8">
          <Component />
        </main>
      </body>
    </html>
  );
}
