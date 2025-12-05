const request = require("supertest");
const app = require("../index");

// --------------------
// TEST 1: HEALTHCHECK
// --------------------
describe("GET /health", () => {
  it("responde con ok:true, color y version", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("color");
    expect(res.body).toHaveProperty("version");
  });
});

// --------------------
// TEST 2: META INFO
// --------------------
describe("GET /api/meta", () => {
  it("regresa metadata de la app", async () => {
    const res = await request(app).get("/api/meta");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("appName");
    expect(res.body).toHaveProperty("color");
    expect(res.body).toHaveProperty("version");
  });
});

// --------------------
// TEST 3: PROFILE
// --------------------
describe("GET /api/player/:username/profile", () => {
  it("regresa perfil del jugador mockeado", async () => {
    const res = await request(app).get("/api/player/hikaru/profile");
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("hikaru");
    expect(res.body.title).toBe("GM");
  });
});

// --------------------
// TEST 4: STATS
// --------------------
describe("GET /api/player/:username/stats", () => {
  it("regresa stats mockeadas del jugador", async () => {
    const res = await request(app).get("/api/player/hikaru/stats");
    expect(res.status).toBe(200);
    expect(res.body.chess_blitz.last.rating).toBe(2900);
  });
});

// --------------------
// TEST 5: LATEST GAMES
// --------------------
describe("GET /api/player/:username/latest-games", () => {
  it("regresa últimas partidas mockeadas", async () => {
    const res = await request(app).get("/api/player/hikaru/latest-games");
    expect(res.status).toBe(200);
    expect(res.body.games.length).toBe(1);
    expect(res.body.games[0]).toHaveProperty("url", "mock-game-1");
  });
});

// --------------------
// TEST 6: PUZZLE
// --------------------
describe("GET /api/puzzle/random", () => {
  it("regresa puzzle mockeado", async () => {
    const res = await request(app).get("/api/puzzle/random");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("fen");
  });
});

// --------------------
// TEST 7: LEADERBOARDS
// --------------------
describe("GET /api/leaderboards", () => {
  it("regresa leaderboard mockeado", async () => {
    const res = await request(app).get("/api/leaderboards");
    expect(res.status).toBe(200);
    expect(res.body.live_blitz.length).toBeGreaterThan(0);
  });
});
