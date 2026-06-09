export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-10 text-white">
      <p className="text-xs uppercase tracking-[0.35em] text-white/45">Meta Display</p>
      <h1 className="text-3xl font-semibold">GitHub Pages setup required</h1>
      <p className="text-white/70">
        This app runs as a static site on GitHub Pages. Pairing and uploads use Supabase
        from the browser, so you need a free Supabase project and two GitHub repository
        secrets before the live site can sync media between devices.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
        <li>Create a Supabase project and run the SQL in <code>supabase/schema.sql</code>.</li>
        <li>
          Add GitHub secrets: <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </li>
        <li>Push to <code>main</code> to redeploy GitHub Pages.</li>
      </ol>
      <p className="text-sm text-white/50">
        For local development, copy <code>.env.example</code> to <code>.env.local</code> and
        fill in the same values.
      </p>
    </main>
  );
}
