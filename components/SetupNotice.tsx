export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-10 text-white">
      <p className="text-xs uppercase tracking-[0.35em] text-white/45">Meta Display</p>
      <h1 className="text-3xl font-semibold">Railway API setup required</h1>
      <p className="text-white/70">
        The frontend runs on GitHub Pages, but pairing and uploads go through a Railway
        API connected to your Postgres database. Deploy the API and point the site at it.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
        <li>
          In Railway, create a service from this repo with root directory set to{" "}
          <code>server</code>.
        </li>
        <li>
          Link your <code>Uploader Database</code> Postgres service so{" "}
          <code>DATABASE_URL</code> is available.
        </li>
        <li>
          Generate a public domain for the API service and set{" "}
          <code>CORS_ORIGIN=https://flsourcing.github.io</code>.
        </li>
        <li>
          Add GitHub secret <code>NEXT_PUBLIC_API_URL</code> with your Railway API URL,
          then redeploy GitHub Pages.
        </li>
      </ol>
      <p className="text-sm text-white/50">
        For local development, copy <code>.env.example</code> to <code>.env.local</code>{" "}
        and run the API with <code>npm run dev --prefix server</code>.
      </p>
    </main>
  );
}
