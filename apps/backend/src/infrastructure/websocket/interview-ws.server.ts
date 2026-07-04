import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { InterviewSessionService } from "../../application/interview/interview-session.service";

export function attachInterviewWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/api/v1/interview/ws",
  });

  wss.on("connection", (socket) => {
    const session = new InterviewSessionService(socket);

    socket.on("message", (data) => {
      session.handleClientMessage(String(data));
    });

    socket.on("close", () => {
      void session.endInterview("client_end", "Client disconnected.");
    });

    socket.on("error", () => {
      void session.endInterview("error", "Client socket error.");
    });
  });

  return wss;
}
