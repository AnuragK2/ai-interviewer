import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { InterviewSessionService } from "../../application/interview/interview-session.service";

const WS_PATH = "/api/v1/interview/ws";

export function attachInterviewWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: WS_PATH,
  });

  console.log(`[interview-ws] listening on path ${WS_PATH}`);

  wss.on("connection", (socket, req) => {
    const clientIp = req.socket.remoteAddress ?? "unknown";
    console.log(`[interview-ws] client connected from ${clientIp}`);

    const session = new InterviewSessionService(socket);

    socket.on("message", (data) => {
      const raw = String(data);
      const preview = raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
      console.log(`[interview-ws] ← message: ${preview}`);
      session.handleClientMessage(raw);
    });

    socket.on("close", (code, reason) => {
      console.log(`[interview-ws] client closed code=${code} reason=${reason.toString() || "none"}`);
    });

    socket.on("error", (err) => {
      console.error(`[interview-ws] client error: ${err.message}`);
      void session.endInterview("error", "Client socket error.");
    });
  });

  wss.on("error", (err) => {
    console.error(`[interview-ws] server error: ${err.message}`);
  });

  return wss;
}
