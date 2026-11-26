# Jensen Hero

**[Play From Tray to Thunder](combat/?mode=story)** from a new or saved career. The diner, arcade and fictional Ten Seats finale share one 3D combat system. **[Take the friend challenge](combat/?mode=challenge&v=3)** to enter the same ten-seat fight with a fixed loadout, independent of your career. After the Ten Seats, return to the diner for **The Reflection**. You can also [play the standalone vertical slice](vertical-slice/) with a fresh health bar and a harmless Thunder Leap demonstration.

| Module | Purpose | Current scope |
|---|---|---|
| `art/` | Art direction and vertical slices | Latest actual gameplay frames first; expandable, labelled design history. Concept art is not a shipped screenshot. |
| `combat/` | Three-act journey, finale and combat lab | One Babylon/Havok runtime. The finale has ten opponents, a transferable heavy swing and a high-damage rush that leaves the boss exposed if it misses. The lab retains eight practice states. |
| `game/` | Player-facing story + battle | R17 2D opening, two encounters, illustrations, progression and career save. |

The independent **Runeforge Warrior** project (`runeforge-warrior`) owns the 2D warrior expedition and its six-skill lab. Jensen keeps a fixed playable comparison from the split in `references/warrior/`; its build serves those files at the existing `/warrior/` URLs. Changes to either game can ship independently.

Jensen’s original 2D story and new 3D journey understand the same career save. Players with the original GPU reward can resume in the arcade. Completed checkpoints preserve CUDA, the shield and hammer, and the first victory score.

## Run

Requires Python 3.9+ and Node 18+. Runtime libraries are pinned and vendored; `npm install` is unnecessary.

```sh
npm test
npm run preview
```

Open `http://127.0.0.1:8900`. `npm run build` creates only `dist/`, which is ignored by Git. Edit source modules, never generated output. `npm test` builds and runs asset/link, actual native combat/lifecycle and VM player-state regressions; it does not certify GPU visuals, sound or natural full-game completion.

In the Survivor journey, use WASD, arrow keys or the ground to steer. Jensen strikes nearby opponents while moving. Click a rival to focus it. On touch, drag from the floor or tap a destination. The arcade unlocks **1**, Gauntlet Cyclone. In the finale it becomes Cyclone Guard, and **2** performs a directional Thunder Leap. The lab's **Debug** panel selects stage, enemy and practice settings. Player mode hides that development workflow. The historical player interface still contains Chinese copy; complete English localization is pending.

For offline desktop play, run `python3 scripts/build.py --standalone` and open `dist/from-tray-to-thunder.html` in desktop Chrome. Open `dist/the-reflection.html` to play the duel directly. The legacy finale remains available in `dist/ten-seats.html`. The file includes the battle, physics library, arena texture, HUD font and license notices. Pause with **Esc** to hide boss labels, reduce impact effects or mute sound. In the back line, read the mortar’s marked ground, the staff’s safe eye, the rifle’s aim lock and the throwing disc’s return. Story victories save to the next checkpoint. Clear all ten seats to invite someone to defeat a different first opponent and finish the fight. New invitations use edition 3. Prior v1 and v2 invitations and completed scores retain their original combat rules. For offline play, send the challenge code to a friend who has the same game file. Friend challenges use the same loadout and leave career progress alone.

## Build and deploy

See [deployment](docs/DEPLOY.md), [requirements](docs/REQUIREMENTS.md) and [agent workflow](AGENTS.md). GitHub Actions tests and publishes `dist/` on a push to `main`; `vercel.json` supports the same build. Relative links work under both a root domain and a GitHub Pages project prefix.

## Boundaries

- New combat logic lives in `combat/`; player progression remains in `game/`. No historical patch chain or personal filesystem path is needed to build.
- Art history is curated: meaningful final designs and real gameplay baselines remain; rejected/intermediate versions and duplicate screenshot sets are excluded. See [history metadata](art/history.json).
- `docs/baseline.json` records the packaged source/asset hashes and provenance. Update affected rows when a reviewed implementation changes; it is an integrity baseline, not a ban on iteration.
- Saves use browser local storage. The existing career key/schema is preserved; a different host has separate saves. A repository rename keeps Git history but changes the Pages project URL.
- Shared training arena, painted 3D postprocess, crowd-number suppression and pending full campaign/mobile/audio/performance acceptance remain documented in [status](docs/STATUS.md).

The repository contains only the maintained result, assets, useful tests and operational documentation. Original research logs, raw generated images and intermediate builds remain in the local archive and prior Git history. No claim of a new permissive license is made; dependency licenses are retained in `combat/vendor/`.
