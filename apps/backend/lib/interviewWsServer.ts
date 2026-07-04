import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { InterviewRuntime } from "./interviewRuntime";

export function attachInterviewWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/api/v1/interview/ws",
  });

  wss.on("connection", (socket) => {
    const runtime = new InterviewRuntime(socket);

    socket.on("message", (data) => {
      runtime.handleClientMessage(String(data));
    });

    socket.on("close", () => {
      void runtime.endInterview("client_end", "Client disconnected.");
    });

    socket.on("error", () => {
      void runtime.endInterview("error", "Client socket error.");
    });
  });

  return wss;
}
