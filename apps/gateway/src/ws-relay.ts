import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { env } from "./config/env";

const INTERVIEW_WS_PATH = "/api/v1/interview/ws";

function wsPathname(url: string | undefined) {
  return url?.split("?")[0] ?? "";
}

function upstreamWsUrl(pathname: string) {
  const base = new URL(env.interviewServiceUrl);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = pathname;
  base.search = "";
  base.hash = "";
  return base.toString();
}

function relayPair(clientWs: WebSocket, upstreamUrl: string) {
  console.log(`[gateway] WS relay opening upstream ${upstreamUrl}`);

  const upstream = new WebSocket(upstreamUrl);
  const pendingFromClient: RawData[] = [];
  let upstreamReady = false;

  upstream.on("open", () => {
    upstreamReady = true;
    console.log("[gateway] WS relay upstream connected");
    for (const message of pendingFromClient) {
      upstream.send(message);
    }
    pendingFromClient.length = 0;
  });

  clientWs.on("message", (data, isBinary: boolean) => {
    if (upstreamReady && upstream.readyState === WebSocket.OPEN) {
      upstream.send(data, { binary: isBinary });
      return;
    }
    pendingFromClient.push(data);
  });

  upstream.on("message", (data, isBinary: boolean) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary });
    }
  });

  upstream.on("error", (err) => {
    console.error("[gateway] WS upstream error:", err.message);
    clientWs.close(1011, "Upstream error");
  });

  clientWs.on("error", (err) => {
    console.error("[gateway] WS client error:", err.message);
    upstream.close();
  });

  clientWs.on("close", (code, reason) => {
    console.log(
      `[gateway] WS client closed code=${code} reason=${reason.toString() || "none"}`,
    );
    upstream.close();
  });

  upstream.on("close", (code, reason) => {
    console.log(
      `[gateway] WS upstream closed code=${code} reason=${reason.toString() || "none"}`,
    );
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason);
    }
  });
}

export function attachInterviewWsRelay(
  server: { on(event: "upgrade", listener: (req: IncomingMessage, socket: Socket, head: Buffer) => void): void },
) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = wsPathname(req.url);
    console.log(`[gateway] HTTP upgrade request: ${req.url}`);

    if (pathname !== INTERVIEW_WS_PATH) {
      console.log(`[gateway] WS upgrade rejected (unsupported path): ${pathname}`);
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (clientWs) => {
      console.log("[gateway] WS client handshake complete");
      relayPair(clientWs, upstreamWsUrl(pathname));
    });
  });
}
