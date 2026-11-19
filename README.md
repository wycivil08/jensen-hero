# Jensen Hero

Start with **[The Ten Seats](combat/?mode=finale)**, the standalone desktop finale, or explore the story and practice together from the portal.

| Module | Purpose | Current scope |
|---|---|---|
| `art/` | Art direction and vertical slices | Latest actual gameplay frames first; expandable, labelled design history. Concept art is not a shipped screenshot. |
| `combat/` | Finale and developer combat lab | One Babylon/Havok runtime. The finale has ten opponents, a transferable heavy swing and a high-damage rush that leaves the boss exposed if it misses. The lab retains eight practice states. |
| `game/` | Player-facing story + battle | R17 2D opening, two encounters, illustrations, progression and career save. |

`warrior/` preserves the original four- and six-skill feel references. Their controls and extra skill slots are historical, not the current Jensen specification. The 3D lab and 2D story prototype are deliberately distinct; merging their progression is future gameplay work, not part of this packaging change.

## Run

Requires Python 3.9+ and Node 18+. Runtime libraries are pinned and vendored; `npm install` is unnecessary.

```sh
npm test
npm run preview
```

Open `http://127.0.0.1:8900`. `npm run build` creates only `dist/`, which is ignored by Git. Edit source modules, never generated output. `npm test` builds and runs asset/link, actual native combat/lifecycle and VM player-state regressions; it does not certify GPU visuals, sound or natural full-game completion.

Desktop landscape is primary: click ground to move, click an enemy to approach/attack, use **1** and **2** for active skills. The lab's **Debug** panel selects stage, enemy and practice settings. Player mode hides that development workflow. The historical player interface still contains Chinese copy; complete English localization is pending.

For offline desktop play, run `python3 scripts/build.py --standalone` and open `dist/ten-seats.html` in a WebGL 2 browser. The file includes the battle, physics library, arena texture, HUD font and license notices. Pause with **Esc** to hide boss labels, reduce impact effects or mute sound. In the back line, read the mortar’s marked ground, the staff’s safe eye, the rifle’s aim lock and the throwing disc’s return. The finale is a separate encounter with no career rewards.

## Build and deploy

See [deployment](docs/DEPLOY.md), [requirements](docs/REQUIREMENTS.md) and [agent workflow](AGENTS.md). GitHub Actions tests and publishes `dist/` on a push to `main`; `vercel.json` supports the same build. Relative links work under both a root domain and a GitHub Pages project prefix.

## Boundaries

- New combat logic lives in `combat/`; player progression remains in `game/`. No historical patch chain or personal filesystem path is needed to build.
- Art history is curated: meaningful final designs and real gameplay baselines remain; rejected/intermediate versions and duplicate screenshot sets are excluded. See [history metadata](art/history.json).
- `docs/baseline.json` records the packaged source/asset hashes and provenance. Update affected rows when a reviewed implementation changes; it is an integrity baseline, not a ban on iteration.
- Saves use browser local storage. The existing career key/schema is preserved; a different host has separate saves. A repository rename keeps Git history but changes the Pages project URL.
- Shared training arena, painted 3D postprocess, crowd-number suppression and pending full campaign/mobile/audio/performance acceptance remain documented in [status](docs/STATUS.md).

The repository contains only the maintained result, assets, useful tests and operational documentation. Original research logs, raw generated images and intermediate builds remain in the local archive and prior Git history. No claim of a new permissive license is made; dependency licenses are retained in `combat/vendor/`.
