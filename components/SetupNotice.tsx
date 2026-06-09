export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-10 text-white">
      <p className="text-xs uppercase tracking-[0.35em] text-white/45">Meta Display</p>
      <h1 className="text-3xl font-semibold">Railway API URL required</h1>
      <p className="text-white/70">
        The site needs your Railway API URL to generate pairing codes. The easiest fix is
        editing one file on GitHub — no rebuild secrets needed.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
        <li>
          In Railway, open your <code>server</code> service → <strong>Settings →
          Networking</strong> and copy your public domain.
        </li>
        <li>
          Test it: open <code>https://YOUR-DOMAIN/health</code> — you should see{" "}
          <code>{'{"ok":true}'}</code>.
        </li>
        <li>
          On GitHub, edit <code>public/api-config.json</code> in this repo and set:{" "}
          <code>{'"apiUrl": "https://YOUR-DOMAIN"'}</code>
        </li>
        <li>
          On Railway, set <code>CORS_ORIGIN=https://flsourcing.github.io</code> on the
          API service.
        </li>
        <li>Wait ~1 minute for GitHub Pages to update, then hard refresh.</li>
      </ol>
    </main>
  );
}
