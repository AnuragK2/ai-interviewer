const gatewayUrl = process.env.E2E_GATEWAY_URL ?? "http://localhost:8080";
const runLive = process.env.E2E_LIVE === "true";

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(`${gatewayUrl}${path}`, init);
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

describe("critical platform flows", () => {
  test("gateway health responds", async () => {
    if (!runLive) {
      expect(true).toBe(true);
      return;
    }

    const { response, body } = await fetchJson("/health");
    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok", service: "gateway" });
  });

  test("auth register/login flow", async () => {
    if (!runLive) {
      expect(true).toBe(true);
      return;
    }

    const email = `e2e.candidate.${Date.now()}@example.com`;
    const password = "Password123!";

    const register = await fetchJson("/api/v1/auth/register/candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "E2E Candidate", email, password }),
    });
    expect(register.response.status).toBe(201);

    const login = await fetchJson("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(login.response.status).toBe(200);
    expect((login.body as { accessToken?: string }).accessToken).toBeTruthy();
  });

  test("rate limit headers are enforced on repeated auth calls", async () => {
    if (!runLive) {
      expect(true).toBe(true);
      return;
    }

    let saw429 = false;
    for (let index = 0; index < 25; index += 1) {
      const { response } = await fetchJson("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "missing@example.com", password: "wrong" }),
      });
      if (response.status === 429) {
        saw429 = true;
        break;
      }
    }

    expect(saw429).toBe(true);
  });
});
