/**
 * Property-based tests for app/api/generate/route.ts
 * Feature: xpeng-ai-marketing-demo
 */

import * as fc from "fast-check";
import { POST } from "../../app/api/generate/route";
import { CAR_MODEL_IDS, CAR_MODEL_MAP } from "../../app/config";
import type { CarModelId } from "../../app/config";

// Set up API key before all tests
beforeAll(() => {
  process.env.DEEPSEEK_API_KEY = "test-key";
});

afterAll(() => {
  delete process.env.DEEPSEEK_API_KEY;
});

// Helper to build a mock Request
function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Property 16: API returns 400 for missing or empty required fields ────────
// Feature: xpeng-ai-marketing-demo, Property 16: 缺少或空 userInput / carModel 返回 HTTP 400
// Validates: Requirements 9.2
describe("Property 16: API returns 400 for missing or empty userInput or carModel", () => {
  it("returns 400 when userInput is absent/empty or carModel is absent/empty", async () => {
    // We test specific cases that must return 400:
    // - userInput missing (undefined → omitted from body)
    // - userInput empty string
    // - carModel missing
    // - carModel empty string
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userInput: fc.option(fc.string(), { nil: undefined }),
          carModel: fc.option(fc.string(), { nil: undefined }),
        }),
        async ({ userInput, carModel }) => {
          // Only test cases where at least one field is missing or empty
          const userInputMissingOrEmpty =
            userInput === undefined || userInput === null || userInput.trim() === "";
          const carModelMissingOrEmpty =
            carModel === undefined || carModel === null || carModel === "";

          if (!userInputMissingOrEmpty && !carModelMissingOrEmpty) {
            // Skip cases where both fields are present and non-empty
            return;
          }

          const body: Record<string, unknown> = {};
          if (userInput !== undefined) body.userInput = userInput;
          if (carModel !== undefined) body.carModel = carModel;

          const req = makeRequest(body);
          const res = await POST(req);

          expect(res.status).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 400 when userInput is empty string", async () => {
    const req = makeRequest({ userInput: "", carModel: "gx" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when userInput is whitespace only", async () => {
    const req = makeRequest({ userInput: "   ", carModel: "gx" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when carModel is empty string", async () => {
    const req = makeRequest({ userInput: "test input", carModel: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when userInput is missing", async () => {
    const req = makeRequest({ carModel: "gx" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when carModel is missing", async () => {
    const req = makeRequest({ userInput: "test input" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── Property 17: API returns 400 for invalid carModel enum value ─────────────
// Feature: xpeng-ai-marketing-demo, Property 17: 无效 carModel 枚举值返回 HTTP 400
// Validates: Requirements 9.3
describe("Property 17: API returns 400 for invalid carModel enum value", () => {
  it("returns 400 for any string not in the valid carModel enum", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => !(CAR_MODEL_IDS as string[]).includes(s)),
        async (invalidCarModel) => {
          const req = makeRequest({
            userInput: "test activity description",
            carModel: invalidCarModel,
          });
          const res = await POST(req);
          expect(res.status).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 18: System prompt contains model-specific metadata ──────────────
// Feature: xpeng-ai-marketing-demo, Property 18: System Prompt 包含车型专属元数据
// Validates: Requirements 9.4, 10.2
describe("Property 18: System prompt contains model-specific tag and sellingPoints", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("system prompt includes the car model tag and all three sellingPoints keywords", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CAR_MODEL_IDS),
        async (carModelId: CarModelId) => {
          const meta = CAR_MODEL_MAP[carModelId];

          // Mock global fetch to capture the system prompt
          const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      theme: meta.theme,
                      carModel: meta.displayName,
                      tag: meta.tag,
                      title: "test title",
                      subtitle: "test subtitle",
                      sellingPoints: ["a", "b", "c"],
                      prizes: [
                        { id: 1, name: "p1" },
                        { id: 2, name: "p2" },
                        { id: 3, name: "p3" },
                        { id: 4, name: "p4" },
                      ],
                    }),
                  },
                },
              ],
            }),
          });
          global.fetch = mockFetch;

          const req = makeRequest({
            userInput: "test activity description",
            carModel: carModelId,
          });

          await POST(req);

          // Verify fetch was called
          expect(mockFetch).toHaveBeenCalledTimes(1);

          // Extract the system prompt from the fetch call
          const fetchCallArgs = mockFetch.mock.calls[0];
          const fetchBody = JSON.parse(fetchCallArgs[1].body as string);
          const systemMessage = fetchBody.messages.find(
            (m: { role: string; content: string }) => m.role === "system"
          );

          expect(systemMessage).toBeDefined();
          const systemPrompt: string = systemMessage.content;

          // Verify the system prompt contains the car model's tag
          expect(systemPrompt).toContain(meta.tag);

          // Verify the system prompt contains all three sellingPoints keywords
          for (const sellingPoint of meta.sellingPoints) {
            expect(systemPrompt).toContain(sellingPoint);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
