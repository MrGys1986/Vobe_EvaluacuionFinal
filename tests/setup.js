global.fetch = jest.fn((url) => {
  // --- 1. Archives list ---
  if (url.includes("/games/archives")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          archives: ["https://mock/chess/hikaru/2025/12"]
        })
    });
  }

  // --- 2. Specific archive file (Latest Games) ---
  if (url.includes("mock/chess/hikaru/2025/12")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          games: [
            {
              url: "mock-game-1",
              end_time: 123456,
              time_control: "3+2",
              time_class: "blitz",
              rules: "chess",
              white: { username: "hikaru", result: "win" },
              black: { username: "gothamchess", result: "lose" }
            }
          ]
        })
    });
  }

  // --- 3. Profile (only when NOT stats) ---
  if (url.includes("/player/hikaru") && !url.includes("/stats")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          username: "hikaru",
          name: "Hikaru Nakamura",
          avatar: null,
          title: "GM",
          followers: 99999
        })
    });
  }

  // --- 4. Stats ---
  if (url.includes("/stats")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          chess_blitz: {
            last: { rating: 2900, date: 1710000000, rd: 50 }
          }
        })
    });
  }

  // --- 5. Puzzle random ---
  if (url.includes("/puzzle/random")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          title: "Mate in 2",
          url: "mock-puzzle-url",
          fen: "mock-fen"
        })
    });
  }

  // --- 6. Leaderboards ---
  if (url.includes("/leaderboards")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          live_blitz: [{ username: "Hikaru", rating: 2900 }],
          live_rapid: [{ username: "MagnusCarlsen", rating: 2850 }]
        })
    });
  }

  // --- 7. Default fallback ---
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ ok: true })
  });
});
