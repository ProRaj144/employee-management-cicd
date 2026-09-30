const request = require("supertest");

jest.mock("../src/db", () => ({
  query: jest.fn().mockResolvedValue([[{ "1": 1 }]])
}));

const app = require("../src/server");

describe("Health endpoint", () => {
  test("should return healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.database).toBe("connected");
  });
});