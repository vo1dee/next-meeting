import { createServer, type Server } from "node:http";

const SUCCESS_PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Next Meeting</title></head>
<body style="background:#161a22;color:#d8d8d8;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><h2>Connected ✓</h2><p>You can close this tab and return to Stream Deck.</p></div>
</body></html>`;

export type Loopback = {
  redirectUri: string;
  /** Resolves with the authorization code once the browser redirects back. */
  waitForCode(expectedState: string, timeoutMs?: number): Promise<string>;
  close(): void;
};

/**
 * Throwaway localhost listener for the OAuth redirect (ADR-0001). Binds to an
 * ephemeral port on 127.0.0.1; both Google (Desktop app) and Microsoft
 * (public client with http://localhost) accept loopback redirects on any port.
 */
export function startLoopback(): Promise<Loopback> {
  return new Promise((resolveStart, rejectStart) => {
    const server: Server = createServer();
    server.once("error", rejectStart);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        rejectStart(new Error("Loopback listener did not report a port"));
        return;
      }
      const redirectUri = `http://127.0.0.1:${address.port}/callback`;
      resolveStart({
        redirectUri,
        waitForCode(expectedState: string, timeoutMs = 180_000): Promise<string> {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              server.close();
              reject(new Error("Timed out waiting for the browser sign-in"));
            }, timeoutMs);
            server.on("request", (req, res) => {
              const url = new URL(req.url ?? "/", redirectUri);
              if (url.pathname !== "/callback") {
                res.writeHead(404).end();
                return;
              }
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(SUCCESS_PAGE);
              clearTimeout(timeout);
              server.close();
              const error = url.searchParams.get("error");
              const code = url.searchParams.get("code");
              if (error) reject(new Error(`Authorization failed: ${error}`));
              else if (url.searchParams.get("state") !== expectedState) reject(new Error("State mismatch in OAuth redirect"));
              else if (!code) reject(new Error("OAuth redirect carried no code"));
              else resolve(code);
            });
          });
        },
        close: () => server.close(),
      });
    });
  });
}
