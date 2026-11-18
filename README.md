# token-radar-entry

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/rezimtirani/token-radar-entry/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/rezimtirani/token-radar-entry/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar — a dashboard that finds pre-token protocols worth farming, ranks them by an implied value derived from the snapshot's own figures (TVL, 7-day growth, age with no token, chain reach), and gives every protocol a concrete farm plan with costs and times. It covers the whole watchlist plus 157 early protocols below the floor, keeps live-token protocols apart as the market's own values, and explains exactly what it left out and why.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input path/to/snapshot.json
```

Node 22 or later, standard library only — nothing to install. The program reads the sealed snapshot, writes the ranked board to `out/board.json`, the dashboard data to `out/data.js`, copies `dashboard/` and `screenshots/` to `out/`, and writes `out/dossier.json`. Open `out/dashboard/index.html` in a browser (it needs `out/data.js` beside it). The grader mounts the snapshot at `/input` and the output at `/output`.

## How it ranks

Implied value = TVL × category multiple × growth × maturity × chain reach. The category multiple is a stated table (DEXs ×0.35, lending ×0.32, RWA ×0.22, …), growth is the 7-day TVL change clamped to −60%…+150%, maturity rises to ×1.00 at 3 years with no token and eases after that, and each extra chain adds 2% to a maximum of +16%. No protocol name is ever special-cased: the same function scores every row, so the radar works on protocols the snapshot has never seen. The dashboard's model panel states every constant, and the detail view shows each protocol's own multipliers.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mxxxb8b6&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
