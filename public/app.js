// public/app.js

async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status} al llamar ${url}`);
  return res.json();
}

function formatDateFromTs(ts) {
  if (!ts) return "N/D";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

// Render meta (para blue/green)
async function loadMeta() {
  const badge = document.getElementById("envBadge");
  try {
    const data = await safeFetch("/api/meta");
    badge.textContent = `${data.appName} – ${data.color.toUpperCase()} v${
      data.version
    }`;
    badge.style.borderColor =
      data.color === "green" ? "#22c55e" : data.color === "blue" ? "#60a5fa" : "#e5e7eb";
  } catch (e) {
    badge.textContent = "Entorno no disponible";
  }
}

// Render perfil
function renderProfile(container, profile) {
  container.classList.remove("hidden");
  const initials = (profile.username || "?")
    .slice(0, 2)
    .toUpperCase();

  container.innerHTML = `
    <h2>Perfil del jugador</h2>
    <div class="player-profile-header">
      ${
        profile.avatar
          ? `<img src="${profile.avatar}" alt="Avatar" class="player-avatar" />`
          : `<div class="player-avatar placeholder">${initials}</div>`
      }
      <div class="player-main-info">
        <h3>${profile.name || profile.username}</h3>
        <div class="username">@${profile.username}</div>
        <div class="player-tags">
          ${
            profile.title
              ? `<span class="tag title">${profile.title}</span>`
              : ""
          }
          ${
            profile.status
              ? `<span class="tag">${profile.status}</span>`
              : ""
          }
          ${
            profile.followers != null
              ? `<span class="tag">👥 ${profile.followers} seguidores</span>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

// Render stats (nos enfocamos en daily, rapid, blitz, bullet si existen)
function renderStats(container, stats) {
  const modes = [
    ["chess_daily", "Daily"],
    ["chess_rapid", "Rapid"],
    ["chess_blitz", "Blitz"],
    ["chess_bullet", "Bullet"]
  ];

  const cards = modes
    .filter(([key]) => stats[key])
    .map(([key, label]) => {
      const s = stats[key];
      const last = s.last || {};
      const record = s.record || {};
      return `
      <div class="stats-card">
        <h4>${label}</h4>
        <div class="stats-row">
          <span>Rating</span>
          <strong>${last.rating ?? "N/D"}</strong>
        </div>
        <div class="stats-row">
          <span>W / L / D</span>
          <span>${record.win ?? 0} / ${record.loss ?? 0} / ${
        record.draw ?? 0
      }</span>
        </div>
      </div>
    `;
    });

  container.innerHTML = `
    <h2>Estadísticas rápidas</h2>
    ${
      cards.length
        ? `<div class="stats-grid">${cards.join("")}</div>`
        : `<p class="hint">Este jugador no tiene estadísticas públicas en modos clásicos todavía.</p>`
    }
  `;
  container.classList.remove("hidden");
}

// Render últimas partidas
function renderGames(container, payload, username) {
  const games = payload.games || [];
  if (!games.length) {
    container.innerHTML = `
      <h2>Últimas partidas</h2>
      <p class="hint">No encontramos partidas recientes en los archivos de Chess.com para este jugador.</p>
    `;
    container.classList.remove("hidden");
    return;
  }

  const items = games
    .map((g) => {
      const isWhite = g.white && g.white.username.toLowerCase() === username.toLowerCase();
      const meColor = isWhite ? "Blancas" : "Negras";
      const rival = isWhite ? g.black.username : g.white.username;
      const myResult = isWhite ? g.result_white : g.result_black;

      const resultEmoji =
        myResult === "win"
          ? "✅"
          : myResult === "checkmated" || myResult === "resigned" || myResult === "lose"
          ? "❌"
          : myResult
          ? "➖"
          : "❔";

      return `
      <div class="game-item">
        <div class="game-header">
          <div>
            <strong>${meColor}</strong> vs <span>${rival}</span>
          </div>
          <div>${resultEmoji} <span>${myResult || "?"}</span></div>
        </div>
        <div class="game-meta">
          <span class="badge">${g.time_class || "?"}</span>
          <span class="badge">TC: ${g.time_control || "N/D"}</span>
          <span>Finalizada: ${g.end_time ? formatDateFromTs(g.end_time) : "N/D"}</span>
          ${
            g.url
              ? `<a href="${g.url}" target="_blank">Ver en Chess.com</a>`
              : ""
          }
        </div>
      </div>
    `;
    })
    .join("");

  container.innerHTML = `
    <h2>Últimas partidas</h2>
    <div class="games-list">
      ${items}
    </div>
  `;
  container.classList.remove("hidden");
}

// Puzzle del día
async function loadDailyPuzzle() {
  const el = document.getElementById("dailyPuzzleContent");
  try {
    const p = await safeFetch("/api/puzzle/daily");
    el.innerHTML = `
      <div class="puzzle-main">
        <div>
          <strong>${p.title}</strong>
        </div>
        <div class="puzzle-meta">
          Publicado: ${formatDateFromTs(p.publish_time)}<br />
          <a href="${p.url}" target="_blank">Ver en Chess.com</a>
        </div>
        ${
          p.image
            ? `<img src="${p.image}" alt="Puzzle del día" class="puzzle-image" />`
            : ""
        }
      </div>
    `;
  } catch (e) {
    el.innerHTML =
      '<p class="hint">No se pudo cargar el puzzle del día. Intenta recargar más tarde.</p>';
  }
}

// Leaderboard
async function loadLeaderboards() {
  const el = document.getElementById("leaderboardContent");
  try {
    const data = await safeFetch("/api/leaderboards");

    const makeList = (items) =>
      items
        .map(
          (p) => `
        <li>
          <span>#${p.rank} ${p.username}</span>
          <span>${p.score}</span>
        </li>
      `
        )
        .join("");

    el.innerHTML = `
      <div class="leaderboard-section">
        <h3>Blitz</h3>
        <ul class="leaderboard-list">
          ${makeList(data.live_blitz || [])}
        </ul>
      </div>
      <div class="leaderboard-section">
        <h3>Rapid</h3>
        <ul class="leaderboard-list">
          ${makeList(data.live_rapid || [])}
        </ul>
      </div>
    `;
  } catch (e) {
    el.innerHTML =
      '<p class="hint">No se pudo cargar el leaderboard. Tal vez estamos rate limited 😅</p>';
  }
}

// Submit de formulario
function setupForm() {
  const form = document.getElementById("playerForm");
  const input = document.getElementById("usernameInput");
  const errorEl = document.getElementById("playerError");
  const profileEl = document.getElementById("playerProfile");
  const statsEl = document.getElementById("playerStats");
  const gamesEl = document.getElementById("playerGames");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = input.value.trim();
    if (!username) return;

    errorEl.classList.add("hidden");
    profileEl.classList.add("hidden");
    statsEl.classList.add("hidden");
    gamesEl.classList.add("hidden");

    errorEl.textContent = "";

    try {
      // Perfil
      const [profile, stats, games] = await Promise.all([
        safeFetch(`/api/player/${encodeURIComponent(username)}/profile`),
        safeFetch(`/api/player/${encodeURIComponent(username)}/stats`),
        safeFetch(`/api/player/${encodeURIComponent(username)}/latest-games`)
      ]);

      renderProfile(profileEl, profile);
      renderStats(statsEl, stats);
      renderGames(gamesEl, games, username);
    } catch (err) {
      console.error(err);
      errorEl.textContent =
        "No se pudo obtener información del jugador. Verifica el nombre o intenta más tarde.";
      errorEl.classList.remove("hidden");
    }
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadMeta();
  setupForm();
  loadDailyPuzzle();
  loadLeaderboards();
});
