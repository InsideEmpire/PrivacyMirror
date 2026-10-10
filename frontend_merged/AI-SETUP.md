# Live Gemini review

Requires Node.js 22 or newer. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` from Google AI Studio. This local file is ignored by Git. Never put the key in a `VITE_` variable or frontend source.

For development, run `npm run server` and `npm run dev -- --host 127.0.0.1 --port 5174` in separate terminals. Open http://127.0.0.1:5174/.

Alternatively, run `npm run build`, then `npm start`, and open http://127.0.0.1:8787/. The Node server serves the built UI and API together, on the loopback interface only.

Choose a fictional case, check the authorization box in Live Model Review, and click Run live AI review. Google receives only the current text. Returned evidence must match the source verbatim. Review the generated draft, then Apply draft & verify locally. The graph and local findings update using the existing deterministic rules; AI findings are displayed separately. Changed source text makes an earlier AI draft stale and disables applying it.

Images are not sent or analyzed. Text redaction cannot remove image metadata. The app does not search for people or infer private addresses. Google quota, network, validation and model failures are shown explicitly; no simulated result substitutes for a failed request.

`GEMINI_MODEL` defaults to `gemini-3.8-flash`; `API_PORT` defaults to 8787. Model availability and quota depend on the key's project. This backend is for local demo use, with a single in-flight review and short cooldown. A static cloud deployment alone does not run this backend; public hosting needs a deployed server, matching proxy/origin configuration, server-side secrets and per-user access/rate limits.
