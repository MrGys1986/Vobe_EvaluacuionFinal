// index.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const APP_COLOR = process.env.APP_COLOR || "blue";
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Helper para hacer fetch con manejo de errores
async function forwardJson(url, res, mapFn) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BlueGreenChessWiki/1.0 (https://example.com)"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `Error desde Chess.com (${response.status})`,
        details: text.slice(0, 300)
      });
    }

    const json = await response.json();
    return res.json(mapFn ? mapFn(json) : json);
  } catch (err) {
    console.error("Error llamando a Chess.com:", err);
    return res.status(500).json({
      error: "Error interno al consultar Chess.com"
    });
  }
}

// Meta para Blue-Green (la vas a usar después)
app.get("/api/meta", (req, res) => {
  res.json({
    appName: "Blue-Green Chess Wiki",
    color: APP_COLOR,
    version: APP_VERSION,
    env: process.env.NODE_ENV || "unknown"
  });
});

// Perfil de jugador
app.get("/api/player/:username/profile", (req, res) => {
  const { username } = req.params;
  const url = `https://api.chess.com/pub/player/${encodeURIComponent(
    username
  )}`;
  forwardJson(url, res, (data) => ({
    username: data.username,
    name: data.name || null,
    avatar: data.avatar || null,
    title: data.title || null,
    followers: data.followers ?? null,
    countryUrl: data.country || null,
    status: data.status || null,
    last_online: data.last_online || null,
    joined: data.joined || null,
    raw: data
  }));
});

// Stats del jugador
app.get("/api/player/:username/stats", (req, res) => {
  const { username } = req.params;
  const url = `https://api.chess.com/pub/player/${encodeURIComponent(
    username
  )}/stats`;
  forwardJson(url, res);
});

// Últimas partidas (tomamos el último archivo de archivos mensuales)
app.get("/api/player/:username/latest-games", async (req, res) => {
  const { username } = req.params;
  const archivesUrl = `https://api.chess.com/pub/player/${encodeURIComponent(
    username
  )}/games/archives`;

  try {
    // 1. Obtener lista de archivos mensuales
    const archivesResp = await fetch(archivesUrl, {
      headers: { "User-Agent": "BlueGreenChessWiki/1.0" }
    });

    if (!archivesResp.ok) {
      return res
        .status(archivesResp.status)
        .json({ error: "No se pudieron obtener los archivos de partidas" });
    }

    const archivesJson = await archivesResp.json();
    const archives = archivesJson.archives || [];
    if (archives.length === 0) {
      return res.json({ games: [] });
    }

    const lastArchiveUrl = archives[archives.length - 1];

    // 2. Obtener partidas de ese archivo
    const gamesResp = await fetch(lastArchiveUrl, {
      headers: { "User-Agent": "BlueGreenChessWiki/1.0" }
    });

    if (!gamesResp.ok) {
      return res
        .status(gamesResp.status)
        .json({ error: "No se pudieron obtener las partidas del archivo" });
    }

    const gamesJson = await gamesResp.json();
    const games = gamesJson.games || [];

    // Nos quedamos con las últimas 5
    const latest = games.slice(-5).reverse().map((g) => ({
      url: g.url,
      end_time: g.end_time,
      time_control: g.time_control,
      time_class: g.time_class,
      rules: g.rules,
      white: g.white,
      black: g.black,
      result_white: g.white?.result,
      result_black: g.black?.result
    }));

    return res.json({
      archive: lastArchiveUrl,
      games: latest
    });
  } catch (err) {
    console.error("Error obteniendo últimas partidas:", err);
    return res.status(500).json({
      error: "Error interno al obtener últimas partidas"
    });
  }
});

// Leaderboard (top blitz y rapid resumido)
app.get("/api/leaderboards", (req, res) => {
  const url = "https://api.chess.com/pub/leaderboards";
  forwardJson(url, res, (data) => ({
    live_blitz: (data.live_blitz || []).slice(0, 10),
    live_rapid: (data.live_rapid || []).slice(0, 10)
  }));
});

// Puzzle del día
app.get("/api/puzzle/daily", (req, res) => {
  const url = "https://api.chess.com/pub/puzzle";
  forwardJson(url, res);
});

// Puzzle aleatorio
app.get("/api/puzzle/random", (req, res) => {
  const url = "https://api.chess.com/pub/puzzle/random";
  forwardJson(url, res);
});

// Catch-all para SPA simple (si quieres luego puedes hacer rutas)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(
    `Servidor escuchando en http://localhost:${PORT} (${APP_COLOR} v${APP_VERSION})`
  );
});
