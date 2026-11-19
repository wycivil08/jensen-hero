/* R24 authored runtime data; no engine/DOM/storage dependency.
 * R24 mechanics retained; presentation bound to JEN-CONTRACT-020. HP/damage/labels copied from growthDefaults(stage).
 * Enemy speed/range/projectile geometry use 70 source units per world unit;
 * hero geometry is R22 authored 3D tuning. end/duration are absolute action ages.
 * Instant releases have a .02s active bookkeeping span. All values are untested tuning.
 */
(function (root) {
  'use strict';
  const data = {
    version: 'R24.DATA.1',
    stages: [
      {"stage":1,"title":"Diner Brawl","hp":100,"D":20,"cycle":0.5,"reach":1.1,"arc":40,"cap":1,"slot1":false,"slot2":false,"cuda":false,"shield":false,"regen":false,"gain":"Start: bare hands D20 / HP100; temporary tray D35","budget":25,"activeCap":4,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"troublemaker_customer","count":4}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"troublemaker_boss","count":1}]}],"theme":{"floor":"#96856b","wall":"#d4c2a4","accent":"#caa05e"}},
      {"stage":2,"title":"Arcade Duel","hp":180,"D":60,"cycle":0.36,"reach":1.8,"arc":70,"cap":3,"slot1":false,"slot2":false,"cuda":false,"shield":false,"regen":false,"gain":"Gain 1: twin GPU gauntlets; D60 / HP180","budget":30,"activeCap":8,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"rusher","count":4},{"kind":"gunner","count":4}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"champion","count":1},{"kind":"rusher","count":1},{"kind":"gunner","count":1}]}],"theme":{"floor":"#6b7882","wall":"#b3bec5","accent":"#7cc8d4"}},
      {"stage":3,"title":"Shield Line","hp":300,"D":180,"cycle":0.36,"reach":1.8,"arc":70,"cap":3,"slot1":true,"slot2":false,"cuda":false,"shield":false,"regen":false,"gain":"Gain 2: Breaker Punch (slot 1); D180 / HP300","budget":35,"activeCap":8,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"shield_soldier","count":5},{"kind":"rear_thrower","count":3}]},{"name":"Elite Clash","kind":"elite","enemies":[{"kind":"shield_soldier","count":1,"elite":true},{"kind":"rear_thrower","count":2}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"ati_captain","count":1},{"kind":"shield_soldier","count":1},{"kind":"rear_thrower","count":1}]}],"theme":{"floor":"#788477","wall":"#c4cbb8","accent":"#bf7180"}},
      {"stage":4,"title":"Disc Duel","hp":500,"D":500,"cycle":0.36,"reach":1.8,"arc":70,"cap":3,"slot1":true,"slot2":true,"cuda":false,"shield":false,"regen":false,"gain":"Gain 3: Parallel Pulse (slot 2); D500 / HP500","budget":40,"activeCap":8,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"diagonal_runner","count":4},{"kind":"cross_disc_thrower","count":4}]},{"name":"Elite Clash","kind":"elite","enemies":[{"kind":"diagonal_runner","count":2,"elite":true},{"kind":"cross_disc_thrower","count":2}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"disc_champion","count":1},{"kind":"diagonal_runner","count":1},{"kind":"cross_disc_thrower","count":1}]}],"theme":{"floor":"#74867f","wall":"#becdc5","accent":"#6ebbb4"}},
      {"stage":5,"title":"Parallel Breakthrough","hp":800,"D":1200,"cycle":0.36,"reach":1.8,"arc":70,"cap":3,"slot1":true,"slot2":true,"cuda":true,"shield":false,"regen":false,"gain":"Gain 4: CUDA links; D1200 / HP800","budget":45,"activeCap":10,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"arc_thrower","count":10}]},{"name":"Elite Clash","kind":"elite","enemies":[{"kind":"arc_thrower","count":1,"elite":true},{"kind":"arc_thrower","count":2}]},{"name":"Second Wave","kind":"mob","enemies":[{"kind":"arc_thrower","count":8}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"boxing_mech","count":1},{"kind":"arc_thrower","count":2}]}],"theme":{"floor":"#7b8089","wall":"#c5c9d1","accent":"#86b9dc"}},
      {"stage":6,"title":"Crossfire","hp":1200,"D":2400,"cycle":0.36,"reach":1.8,"arc":70,"cap":3,"slot1":true,"slot2":true,"cuda":true,"shield":true,"regen":false,"gain":"Gain 5: right wafer shield; slot 1 becomes Shield Rush; D2400 / HP1200","budget":50,"activeCap":10,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"gun_column","count":6},{"kind":"diagonal_guard","count":4}]},{"name":"Elite Clash","kind":"elite","enemies":[{"kind":"gun_column","count":2},{"kind":"diagonal_guard","count":2,"elite":true}]},{"name":"Second Wave","kind":"mob","enemies":[{"kind":"gun_column","count":6},{"kind":"diagonal_guard","count":2}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"amd_leader","count":1},{"kind":"gun_column","count":2},{"kind":"diagonal_guard","count":2}]}],"theme":{"floor":"#7a8174","wall":"#d4c9b4","accent":"#d38488"}},
      {"stage":7,"title":"Thunder Breakout","hp":1800,"D":4000,"cycle":0.45,"reach":2.8,"arc":120,"cap":null,"slot1":true,"slot2":true,"cuda":true,"shield":true,"regen":false,"gain":"Gain 6: left thunder hammer, lightning sweep and Thunder Slam; D4000 / HP1800","budget":60,"activeCap":12,"waves":[{"name":"First Wave","kind":"mob","enemies":[{"kind":"needle_creature","count":8},{"kind":"heat_creature","count":4}]},{"name":"Elite Clash","kind":"elite","enemies":[{"kind":"needle_creature","count":2},{"kind":"heat_creature","count":2,"elite":true}]},{"name":"Second Wave","kind":"mob","enemies":[{"kind":"needle_creature","count":6},{"kind":"heat_creature","count":4}]},{"name":"Boss & Escort","kind":"boss","enemies":[{"kind":"ember_beast","count":1},{"kind":"needle_creature","count":3},{"kind":"heat_creature","count":2}]}],"theme":{"floor":"#827a68","wall":"#cbbda5","accent":"#e0ad67"}},
      {"stage":8,"title":"The Ten Seats","hp":2500,"D":6000,"cycle":0.45,"reach":2.8,"arc":120,"cap":null,"slot1":true,"slot2":true,"cuda":true,"shield":true,"regen":true,"gain":"Gain 7: Steadfast block recovery; D6000 / HP2500","budget":75,"activeCap":10,"waves":[{"name":"All Ten Seats","kind":"boss","enemies":[{"kind":"seat_01","count":1},{"kind":"seat_02","count":1},{"kind":"seat_03","count":1},{"kind":"seat_04","count":1},{"kind":"seat_05","count":1},{"kind":"seat_06","count":1},{"kind":"seat_07","count":1},{"kind":"seat_08","count":1},{"kind":"seat_09","count":1},{"kind":"seat_10","count":1}]}],"theme":{"floor":"#717c72","wall":"#c8c8b5","accent":"#d5ba72"}}
    ],
    types: {
      "troublemaker_customer": {"label":"Troublemaker","boss":false,"stage":1,"hp":40,"damage":10,"speed":1,"range":3.285714,"action":"guardCharge","windup":0.85,"end":1.15,"duration":2.15,"cycle":2.15,"scale":1},
      "troublemaker_boss": {"label":"Ringleader","boss":true,"stage":1,"hp":600,"damage":18,"speed":1,"range":3.285714,"action":"guardCharge","windup":1.1,"end":1.48,"duration":2.78,"cycle":2.78,"scale":1.25},
      "champion": {"label":"Arcade Champion","boss":true,"stage":2,"hp":1800,"damage":32,"speed":0,"range":9.285714,"action":"beam","windup":1.15,"end":1.17,"duration":1.97,"cycle":1.97,"scale":1},
      "gunner": {"label":"Flank Gunner","boss":false,"stage":2,"hp":120,"damage":18,"speed":0,"range":11.142857,"action":"shoot","windup":0.85,"end":0.87,"duration":1.67,"cycle":1.67,"scale":1},
      "rusher": {"label":"Rusher","boss":false,"stage":2,"hp":120,"damage":22,"speed":1,"range":3.285714,"action":"guardCharge","windup":0.85,"end":1.15,"duration":2.15,"cycle":2.15,"scale":1},
      "ati_captain": {"label":"ATI Shield Captain","boss":true,"stage":3,"hp":5400,"damage":60,"speed":0.628571,"range":1.857143,"action":"shieldBash","windup":0.8,"end":0.98,"duration":2.18,"cycle":2.18,"scale":1.18},
      "shield_soldier": {"label":"Shield Guard","boss":false,"stage":3,"hp":540,"damage":36,"speed":0.685714,"range":1.571429,"action":"shieldBash","windup":0.65,"end":0.81,"duration":1.76,"cycle":1.76,"scale":1},
      "rear_thrower": {"label":"Rear Thrower","boss":false,"stage":3,"hp":360,"damage":30,"speed":0,"range":8.285714,"action":"shoot","windup":0.9,"end":0.92,"duration":1.92,"cycle":1.92,"scale":1},
      "disc_champion": {"label":"Disc Champion","boss":true,"stage":4,"hp":15000,"damage":90,"speed":0.971429,"range":7.428571,"action":"disc","windup":1,"end":1.02,"duration":2.07,"cycle":2.07,"scale":1.1},
      "cross_disc_thrower": {"label":"Cross Disc Thrower","boss":false,"stage":4,"hp":1000,"damage":50,"speed":0,"range":7.142857,"action":"disc","windup":0.95,"end":0.97,"duration":2.22,"cycle":2.22,"scale":1},
      "diagonal_runner": {"label":"Diagonal Runner","boss":false,"stage":4,"hp":1000,"damage":60,"speed":1.142857,"range":3.714286,"action":"guardCharge","windup":0.75,"end":1.07,"duration":2.07,"cycle":2.07,"scale":1},
      "boxing_mech": {"label":"Boxing Mech","boss":true,"stage":5,"hp":36000,"damage":160,"speed":0.428571,"range":2.571429,"action":"mechPunch","windup":1.1,"end":1.32,"duration":2.62,"cycle":2.62,"scale":1.6},
      "arc_thrower": {"label":"Arc Thrower","boss":false,"stage":5,"hp":2400,"damage":80,"speed":0,"range":8,"action":"arc","windup":0.95,"end":0.97,"duration":2.07,"cycle":2.07,"scale":1},
      "amd_leader": {"label":"AMD Fantasy Captain","boss":true,"stage":6,"hp":72000,"damage":180,"speed":0,"range":8.857143,"action":"volley","windup":0.95,"end":0.97,"duration":2.17,"cycle":4,"scale":1.1},
      "gun_column": {"label":"Crossfire Gunner","boss":false,"stage":6,"hp":4800,"damage":120,"speed":0,"range":8.857143,"action":"shoot","windup":0.9,"end":0.92,"duration":2.02,"cycle":4,"scale":1},
      "diagonal_guard": {"label":"Diagonal Guard","boss":false,"stage":6,"hp":7200,"damage":144,"speed":0.942857,"range":4,"action":"guardCharge","windup":0.85,"end":1.19,"duration":2.29,"cycle":2.29,"scale":1},
      "ember_beast": {"label":"Ember Beast","boss":true,"stage":7,"hp":160000,"damage":300,"speed":0.6,"range":4.285714,"action":"beastCharge","windup":1.15,"end":1.55,"duration":2.95,"cycle":2.95,"scale":1.5},
      "needle_creature": {"label":"Needle Creature","boss":false,"stage":7,"hp":8000,"damage":144,"speed":0,"range":8,"action":"needle","windup":0.8,"end":0.82,"duration":1.77,"cycle":1.77,"scale":0.85},
      "heat_creature": {"label":"Heat Creature","boss":false,"stage":7,"hp":8000,"damage":90,"speed":0.4,"range":6,"action":"heat","windup":1,"end":1.02,"duration":2.32,"cycle":2.32,"scale":1},
      "seat_01": {"label":"Tench Coxe","boss":true,"stage":8,"hp":144000,"damage":300,"speed":0.742857,"range":3.571429,"action":"guardCharge","windup":0.95,"end":1.25,"duration":2.45,"cycle":2.45,"scale":1,"seat":1},
      "seat_02": {"label":"John O. Dabiri","boss":true,"stage":8,"hp":120000,"damage":225,"speed":0,"range":8.571429,"action":"shoot","windup":1.05,"end":1.07,"duration":2.27,"cycle":2.27,"scale":1,"seat":2},
      "seat_03": {"label":"Dawn Hudson","boss":true,"stage":8,"hp":108000,"damage":125,"speed":0,"range":6.428571,"action":"heat","windup":1.2,"end":1.22,"duration":2.62,"cycle":2.62,"scale":1,"seat":3},
      "seat_04": {"label":"Harvey C. Jones","boss":true,"stage":8,"hp":144000,"damage":300,"speed":0.742857,"range":3.571429,"action":"guardCharge","windup":0.95,"end":1.25,"duration":2.45,"cycle":2.45,"scale":1,"seat":4},
      "seat_05": {"label":"Melissa B. Lora","boss":true,"stage":8,"hp":120000,"damage":225,"speed":0,"range":8.571429,"action":"sniper","windup":1.1,"end":1.12,"duration":2.32,"cycle":2.32,"scale":1,"seat":5},
      "seat_06": {"label":"Stephen C. Neal","boss":true,"stage":8,"hp":108000,"damage":125,"speed":0,"range":6.428571,"action":"heal","windup":1.8,"end":1.82,"duration":3.02,"cycle":7,"scale":1,"seat":6},
      "seat_07": {"label":"A. Brooke Seawell","boss":true,"stage":8,"hp":144000,"damage":300,"speed":0.742857,"range":3.571429,"action":"guardCharge","windup":0.95,"end":1.25,"duration":2.45,"cycle":2.45,"scale":1,"seat":7},
      "seat_08": {"label":"Aarti Shah","boss":true,"stage":8,"hp":120000,"damage":225,"speed":0,"range":8.571429,"action":"shoot","windup":1.05,"end":1.07,"duration":2.27,"cycle":2.27,"scale":1,"seat":8},
      "seat_09": {"label":"Mark A. Stevens","boss":true,"stage":8,"hp":108000,"damage":125,"speed":0,"range":6.428571,"action":"heat","windup":1.2,"end":1.22,"duration":2.62,"cycle":2.62,"scale":1,"seat":9},
      "seat_10": {"label":"Suzanne Nora Johnson","boss":true,"stage":8,"hp":84000,"damage":225,"speed":0,"range":8.571429,"action":"shoot","windup":1.05,"end":1.07,"duration":2.27,"cycle":2.27,"scale":1,"seat":10}
    },
    rules: {
      "contract": "JEN-CONTRACT-020",
      "contractSha256": "c756429a56d170879224b22298ee7fcad1ba1682aa6b7bb9d130acc1ea344d9e",
      "units": {
        "distance": "3D world units",
        "time": "simulation seconds",
        "angle": "degrees",
        "enemySourceUnitsPerWorldUnit": 70,
        "heroRanges": "authored R22 values, not enemy conversion",
        "nullCap": "all legal owners in the attack region"
      },
      "crit": {
        "chance": 0.15,
        "multiplier": 2,
        "roll": "once per original hero root; shared by its direct targets"
      },
      "basic": {
        "contactStart": 0.1,
        "contactDuration": 0.14,
        "lockAimAt": "contactStart",
        "requireLOS": true,
        "oneDirectHitPerOwner": true
      },
      "tray": {
        "stage": 1,
        "damage": 35,
        "cycle": 0.55,
        "reach": 1.4,
        "arc": 80,
        "cap": 3,
        "opportunities": 2,
        "temporary": true,
        "requiredToClear": false,
        "staffAreHostile": false
      },
      "slot1": {
        "damageMultiplier": 0.75,
        "cooldown": 3,
        "duration": 0.4,
        "advanceStart": 0.08,
        "advanceEnd": 0.26,
        "contactStart": 0.1,
        "contactEnd": 0.26,
        "distance": 2.6,
        "cap": 3,
        "collisionStopsAdvance": true,
        "fist": {
          "push": 0.45,
          "stagger": 0.15,
          "guardArc": 60,
          "catchPackets": 1
        },
        "shield": {
          "push": 0.65,
          "stagger": 0.2,
          "guardArc": 120,
          "damageMultiplier": 0.5,
          "randomBlock": false,
          "regen": false
        }
      },
      "slot2": {
        "damageMultiplier": 2,
        "cooldown": 6,
        "windup": 0.18,
        "active": 0.24,
        "recovery": 0.18,
        "moveMultiplier": 0.75,
        "cap": 6,
        "gauntlet": {
          "radius": 2.4,
          "push": 0.65,
          "stagger": 0.24
        },
        "hammer": {
          "radius": 3.2,
          "push": 0.85,
          "stagger": 0.35
        },
        "shieldDisabledForWholeAction": true
      },
      "shield": {
        "fromStage": 6,
        "chance": 0.3,
        "arc": 120,
        "blockedDamageMultiplier": 0,
        "requiresPresentedPose": true,
        "eligibleKinds": [
          "ordinary_light_melee",
          "discrete_projectile"
        ],
        "excludedKinds": [
          "heavy_body_charge",
          "heavy_boss_punch",
          "persistent_beam",
          "ground_heat"
        ],
        "roll": "once per incoming enemy root and hero; reuse for multiple emissions",
        "eligibilityAt": "each packet contact time before RNG",
        "inactiveDuring": "slot2",
        "slot1OverridesRandom": true,
        "legacyPassiveDamageMultiplier": 1,
        "independentControlSurvives": true
      },
      "regen": {
        "fromStage": 8,
        "maxHpFraction": 0.03,
        "blockedDamageFraction": 0.5,
        "cooldown": 4,
        "amount": "min(maxHP*maxHpFraction,blockedEligibleDamage*blockedDamageFraction,missingHP)",
        "trigger": "successful random shield block only",
        "fullHpConsumesCooldown": true,
        "deadCanHeal": false,
        "zeroDamageCanTrigger": false,
        "resetOrPauseCannotRefreshWithinEncounter": true
      },
      "cuda": {
        "fromStage": 5,
        "factor": 0.5,
        "interval": 1.2,
        "neighbors": 3,
        "depth": 2,
        "hop": 2.6,
        "seedRange": 5.2,
        "reserveAt": "first positive actual direct HP loss",
        "resolveAt": "original direct window end or legal cancellation after a hit",
        "allowedTypes": [
          "basic",
          "skill1",
          "skill2"
        ],
        "excludeAllDirectHits": true,
        "seedDamage": false,
        "seedSelection": "selected actual direct hit, else distance then stable owner ID",
        "dualLOS": true,
        "recursive": false,
        "crit": false,
        "control": false,
        "deadSeed": "only killed by this original root; use confirmed contact",
        "heroDeathOrResetDiscards": true,
        "noNeighborStillConsumesInterval": true
      },
      "hammer": {
        "fromStage": 7,
        "arc": 120,
        "reach": 2.8,
        "cap": null,
        "lightningPerRoot": 1,
        "lightningRequiresPositiveActualBasicDamage": true,
        "extraDamageMultiplier": 0,
        "cosmeticOnly": true
      },
      "control": {
        "ordinaryRepeatProtection": 0.65,
        "heavyEffectMultiplier": 0.5,
        "bossNormalStun": false,
        "bossPushMultiplier": 0.15,
        "bossInterruptRequiresOpenTell": true,
        "bossNextAttackProtected": true,
        "healAlwaysInterruptible": true,
        "releasedHazardsSurvive": true
      },
      "elite": {
        "hpInStageD": 6,
        "scaleMultiplier": 1.1,
        "damageMultiplier": 1,
        "collisionScalesWithModel": true,
        "byType": {
          "shield_soldier": {
            "windupAdd": 0.15,
            "recoveryAdd": 0.2
          },
          "diagonal_runner": {
            "chargeDistanceMultiplier": 1.15,
            "windupAdd": 0.15
          },
          "arc_thrower": {
            "projectileSpeedMultiplier": 1.15,
            "windupAdd": 0.15
          },
          "diagonal_guard": {
            "chargeDistanceMultiplier": 1.15,
            "windupAdd": 0.15
          },
          "heat_creature": {
            "zoneRadiusMultiplier": 1.15,
            "windupAdd": 0.2
          }
        }
      },
      "waves": {
        "nextWhen": "current wave has no living enemies and no released hazards",
        "spawnTell": 0.6,
        "refill": false,
        "forceBudgetWait": false,
        "heroDeathWinsTie": true,
        "debugGrantsRewards": false,
        "highDangerGroups": 2,
        "countReleasedHazards": true,
        "reserveWholeVolley": true
      },
      "heal": {
        "type": "seat_06",
        "range": 4.5,
        "windup": 1.8,
        "cycle": 7,
        "firstAfter": 5,
        "attempts": 3,
        "targets": 4,
        "requireInjuredTarget": true,
        "maxHpFraction": 0.08,
        "self": false,
        "resurrect": false,
        "LOS": true,
        "targetOrder": "lowest HP fraction then stable owner ID",
        "snapshotAt": "tell start",
        "revalidateAtRelease": true,
        "replaceLostTargets": false,
        "interruptConsumesAttempt": true,
        "deathAndInterruptBeforeHeal": true,
        "fallbackAction": "shoot",
        "fallbackDamage": 125,
        "fallbackCycle": 2.6
      },
      "sniper": {
        "type": "seat_05",
        "damageMultiplier": 2,
        "windup": 1.1,
        "lockBeforeRelease": 0.25,
        "recovery": 1.2
      },
      "enemyPatterns": {
        "beam": {
          "life": 0.45,
          "oneHitPerHero": true
        },
        "disc": {
          "returnTo": "frozen release point",
          "oneHitAcrossBothLegs": true,
          "endOnWall": true
        },
        "arc": {
          "alternateCurveSign": true,
          "homing": false
        },
        "shieldBash": {
          "frontArc": 160,
          "closedMultiplier": 0.25,
          "sideBackMultiplier": 1,
          "openAtTell": 0.35
        },
        "mechPunch": {
          "alternate": "fist then side sweep",
          "sweepArc": 200,
          "sweepDamageMultiplier": 0.8181818181818182,
          "owners": 1,
          "pilotHasHP": false
        },
        "volley": {
          "count": 3,
          "fan": 20,
          "period": 4,
          "laneOffset": 2
        },
        "heat": {
          "radius": 0.6,
          "life": 1.1,
          "tickInterval": 0.4,
          "firstTickAtRelease": true,
          "noExpiryTick": true
        },
        "guardCharge": {
          "lockedDirection": true
        },
        "beastCharge": {
          "heavy": true,
          "lockedDirection": true
        }
      },
      "board": {
        "seats": 10,
        "openingAllPresent": true,
        "extraSpawns": false,
        "maxZones": 2,
        "maxZoneWalkableAreaFraction": 0.25,
        "healSniperStartSeparation": 0.6,
        "sideLaneHeroDiameters": 2,
        "sharedHP": false,
        "resurrection": false
      },
      "damageKinds": {
        "troublemaker_customer": "ordinary_light_melee",
        "troublemaker_boss": "heavy_body_charge",
        "champion": "persistent_beam",
        "gunner": "discrete_projectile",
        "rusher": "ordinary_light_melee",
        "ati_captain": "ordinary_light_melee",
        "shield_soldier": "ordinary_light_melee",
        "rear_thrower": "discrete_projectile",
        "disc_champion": "discrete_projectile",
        "cross_disc_thrower": "discrete_projectile",
        "diagonal_runner": "ordinary_light_melee",
        "boxing_mech": "heavy_boss_punch",
        "arc_thrower": "discrete_projectile",
        "amd_leader": "discrete_projectile",
        "gun_column": "discrete_projectile",
        "diagonal_guard": "ordinary_light_melee",
        "ember_beast": "heavy_body_charge",
        "needle_creature": "discrete_projectile",
        "heat_creature": "ground_heat",
        "seat_01": "ordinary_light_melee",
        "seat_02": "discrete_projectile",
        "seat_03": "ground_heat",
        "seat_04": "ordinary_light_melee",
        "seat_05": "discrete_projectile",
        "seat_06": "discrete_projectile",
        "seat_07": "ordinary_light_melee",
        "seat_08": "discrete_projectile",
        "seat_09": "ground_heat",
        "seat_10": "discrete_projectile"
      },
      "projectiles": {
        "champion": {
          "speed": 4.285714,
          "radius": 0.128571,
          "life": 0.45,
          "length": 9.285714
        },
        "gunner": {
          "speed": 4.285714,
          "radius": 0.071429,
          "life": 2.6
        },
        "rear_thrower": {
          "speed": 3.428571,
          "radius": 0.085714,
          "life": 2.4
        },
        "disc_champion": {
          "speed": 3.428571,
          "radius": 0.1,
          "life": 3.2,
          "outboundDistance": 3.714286,
          "outboundSpeed": 3.428571,
          "returnSpeed": 4.285714
        },
        "cross_disc_thrower": {
          "speed": 3,
          "radius": 0.1,
          "life": 3.2,
          "outboundDistance": 3.142857,
          "outboundSpeed": 3,
          "returnSpeed": 4
        },
        "arc_thrower": {
          "speed": 3.142857,
          "radius": 0.085714,
          "life": 2.6,
          "turnDegreesPerSecond": 25,
          "curveSeconds": 0.65
        },
        "amd_leader": {
          "speed": 3.571429,
          "radius": 0.071429,
          "life": 2.5
        },
        "gun_column": {
          "speed": 3.714286,
          "radius": 0.071429,
          "life": 2.5
        },
        "needle_creature": {
          "speed": 4.142857,
          "radius": 0.057143,
          "life": 2
        },
        "seat_02": {
          "speed": 3.428571,
          "radius": 0.071429,
          "life": 2.5
        },
        "seat_05": {
          "speed": 3.428571,
          "radius": 0.071429,
          "life": 2.5
        },
        "seat_08": {
          "speed": 3.428571,
          "radius": 0.071429,
          "life": 2.5
        },
        "seat_10": {
          "speed": 3.428571,
          "radius": 0.071429,
          "life": 2.5
        }
      }
    }
  };
  // The standalone fantasy encounter has its own tuning and fictional seat titles.
  data.finale = {
    hp: 3800, comboGrace: 2.5, cycle: 0.43, heavyCycle: 0.70, heavyWindup: 0.24, heavyMultiplier: 2,
    theme: {floor:"#889d9a",wall:"#718889"},
    seats: {
      seat_01: {label:"Vanguard", hp:42000, x:-3.5, z:0.4, range:6, damage:950, windup:0.95, end:1.55, duration:2.95, cycle:4.5, punishMultiplier:1.5},
      seat_02: {label:"West Gunner", hp:30000, x:-7.1, z:-1.0},
      seat_03: {label:"Cinder", hp:30000, x:-4.8, z:-3.1, range:8.2, damage:420, windup:1.12, end:1.14, duration:2.55, cycle:4.0, ground:{shape:"mortar",radius:1.45}},
      seat_04: {label:"Gatekeeper", hp:42000, x:0, z:0.2, action:"shieldBash", range:2.5},
      seat_05: {label:"Deadeye", hp:36000, x:-2.8, z:-4.7, lockBeforeRelease:0.48, punishRange:3.2, punishMultiplier:1.4},
      seat_06: {label:"Lifeline", hp:36000, x:2.8, z:-4.7},
      seat_07: {label:"Outrider", hp:36000, x:3.8, z:0.2},
      seat_08: {label:"Scattershot", hp:36000, x:6.7, z:-2.2, action:"volley", cycle:3.4},
      seat_09: {label:"Ashfall", hp:30000, x:4.2, z:-2.7, range:4.3, damage:340, windup:1.16, end:1.18, duration:2.15, cycle:3.65, ground:{shape:"annulus",innerRadius:2.3,radius:4.3}},
      seat_10: {label:"Reclaimer", hp:30000, x:0.1, z:-2.7, action:"disc", range:5.7, damage:255, windup:0.96, end:0.98, duration:3.18, cycle:3.65, projectile:{outboundDistance:5.5,outboundSpeed:5,returnSpeed:6.5,life:2.25,radius:0.18}}
    }
  };
  const assert = (ok, message) => { if (!ok) throw new Error('R24Data: '+message); };
  assert(data.stages.length===8 && Object.keys(data.types).length===29, 'expected 8 stages and 29 types');
  assert(data.stages.reduce((sum,s)=>sum+s.budget,0)===360, 'combat budget must total 360 seconds');
  for (const [index,stage] of data.stages.entries()) {
    assert(stage.stage===index+1 && stage.gain.length>0, 'ordered entry states and gains');
    assert(stage.slot1===(stage.stage>=3) && stage.slot2===(stage.stage>=4), 'exact two-slot unlocks');
    for (const wave of stage.waves) {
      assert(['mob','elite','boss'].includes(wave.kind), 'known wave class');
      assert(wave.enemies.every(e=>data.types[e.kind]?.stage===stage.stage && Number.isInteger(e.count) && e.count>0), 'valid native wave members');
      assert(wave.enemies.reduce((sum,e)=>sum+e.count,0)<=stage.activeCap, 'wave exceeds active cap');
    }
  }
  assert(data.stages.slice(1).every((s,i)=>s.gain.startsWith('Gain '+(i+1)+':')), 'exactly seven gains after initial entry');
  function freeze(value) {
    if (value && typeof value==='object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  const frozen=freeze(data);
  root.R24Data=frozen;
  if (typeof module!=='undefined' && module.exports) module.exports=frozen;
})(typeof window!=='undefined'?window:globalThis);
