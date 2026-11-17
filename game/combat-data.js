/* R14 authored combat defaults. G3-G8 are editable local first-test values, not measured balance.
 * Canonical alias edits propagate atomically; aliases are read-only in fields(). See aliases() below.
 * No task JSON is read at runtime. */
(function (root) {
  'use strict';
  const BASE = {
  "entries": {
    "1": {
      "equipment": {
        "right": null,
        "left": null
      },
      "auto_attack": "bare_fists",
      "slot_1": null,
      "slot_2": null,
      "buffs": [],
      "max_hp": 100,
      "career_complete": false
    },
    "2": {
      "equipment": {
        "right": "gpu_gauntlet",
        "left": "gpu_gauntlet"
      },
      "auto_attack": "gpu_fast",
      "slot_1": null,
      "slot_2": null,
      "buffs": [],
      "max_hp": 100,
      "career_complete": false
    },
    "3": {
      "equipment": {
        "right": "gpu_gauntlet",
        "left": "gpu_gauntlet"
      },
      "auto_attack": "gpu_fast",
      "slot_1": {
        "id": "breakthrough",
        "variant": "gauntlet_brace"
      },
      "slot_2": null,
      "buffs": [],
      "max_hp": 100,
      "career_complete": false
    },
    "4": {
      "equipment": {
        "right": "gpu_gauntlet",
        "left": "gpu_gauntlet"
      },
      "auto_attack": "gpu_fast",
      "slot_1": {
        "id": "breakthrough",
        "variant": "gauntlet_brace"
      },
      "slot_2": {
        "id": "clear_space",
        "variant": "gauntlet_turn"
      },
      "buffs": [],
      "max_hp": 100,
      "career_complete": false
    },
    "5": {
      "equipment": {
        "right": "gpu_gauntlet",
        "left": "gpu_gauntlet"
      },
      "auto_attack": "gpu_fast",
      "slot_1": {
        "id": "breakthrough",
        "variant": "gauntlet_brace"
      },
      "slot_2": {
        "id": "clear_space",
        "variant": "gauntlet_turn"
      },
      "buffs": [
        "cuda_link"
      ],
      "max_hp": 100,
      "career_complete": false
    },
    "6": {
      "equipment": {
        "right": "wafer_shield",
        "left": "gpu_gauntlet"
      },
      "auto_attack": "shield_gauntlet_fast",
      "slot_1": {
        "id": "breakthrough",
        "variant": "shield_brace"
      },
      "slot_2": {
        "id": "clear_space",
        "variant": "shield_gauntlet_turn"
      },
      "buffs": [
        "cuda_link"
      ],
      "max_hp": 100,
      "career_complete": false
    },
    "7": {
      "equipment": {
        "right": "wafer_shield",
        "left": "thor_hammer"
      },
      "auto_attack": "hammer_shield_fast",
      "slot_1": {
        "id": "breakthrough",
        "variant": "shield_brace"
      },
      "slot_2": {
        "id": "clear_space",
        "variant": "hammer_ring"
      },
      "buffs": [
        "cuda_link"
      ],
      "max_hp": 100,
      "career_complete": false
    },
    "8": {
      "equipment": {
        "right": "wafer_shield",
        "left": "thor_hammer"
      },
      "auto_attack": "hammer_shield_fast",
      "slot_1": {
        "id": "breakthrough",
        "variant": "shield_brace"
      },
      "slot_2": {
        "id": "clear_space",
        "variant": "hammer_ring"
      },
      "buffs": [
        "cuda_link",
        "steady_guard"
      ],
      "max_hp": 100,
      "career_complete": false
    }
  },
  "types": {
    "troublemaker_customer": {
      "typeId": "troublemaker_customer",
      "stage": 1,
      "label": "闹事顾客",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "charge",
      "hp": 32,
      "damage": 10,
      "damageKind": "ordinary_light_melee",
      "speed": 70,
      "tell_seconds": 0.85,
      "active_seconds": 0.3,
      "recovery_seconds": 1,
      "range": 230,
      "collision_r": 16,
      "scale": 1,
      "default_count": 3,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 280,
        "stop_distance": 90,
        "trigger_range": 230,
        "stall_speed_threshold": 50
      },
      "render": {
        "rig": "existing adult cropped hair/bomber shirt",
        "palette": [
          "#304459",
          "#41464c",
          "#566044"
        ],
        "prop": "none",
        "scale_xy": [
          1,
          1
        ]
      },
      "numeric_source": "PRESERVED_CURRENT_G1_G2"
    },
    "troublemaker_boss": {
      "typeId": "troublemaker_boss",
      "stage": 1,
      "label": "带头闹事的大客",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "charge",
      "hp": 88,
      "damage": 18,
      "damageKind": "heavy_body_charge",
      "speed": 70,
      "tell_seconds": 1.1,
      "active_seconds": 0.38,
      "recovery_seconds": 1.3,
      "range": 230,
      "collision_r": 20,
      "scale": 1.25,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 280,
        "stop_distance": 90,
        "trigger_range": 230,
        "stall_speed_threshold": 50
      },
      "render": {
        "rig": "existing swept black hair/square face",
        "cloth": "#672d3c",
        "light_shirt": "#d5d3cb",
        "prop": "none",
        "scale_xy": [
          1.4,
          1.25
        ],
        "pose": "lean back tell, forward charge, bent panting recovery; no uniform/apron"
      },
      "numeric_source": "PRESERVED_CURRENT_G1_G2"
    },
    "champion": {
      "typeId": "champion",
      "stage": 2,
      "label": "街机冠军",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "fixed_shot",
      "hp": 180,
      "damage": 18,
      "damageKind": "persistent_beam",
      "speed": 0,
      "tell_seconds": 1.15,
      "active_seconds": 0,
      "recovery_seconds": 0.8,
      "range": 650,
      "collision_r": 24,
      "scale": 1,
      "default_count": 1,
      "projectile": {
        "kind": "beam",
        "speed": 300,
        "speed_usage": "stored in existing hazard but beam ignores travel speed",
        "radius": 9,
        "life": 0.45,
        "length": 650,
        "one_hit_per_hero": true
      },
      "pattern_params": {
        "trigger_range": null,
        "trigger_range_rule": "PRESERVED: no distance gate in current enemyStep; wait ready and line of sight suffice. range field is nominal beam length/projectile travel, not a new acquisition clamp."
      },
      "render": {
        "cloth": "#536caf",
        "prop": "fixed arcade firing seat frame54x32",
        "accent": "#8df1e5"
      },
      "numeric_source": "PRESERVED_CURRENT_G1_G2"
    },
    "gunner": {
      "typeId": "gunner",
      "stage": 2,
      "label": "侧翼光枪手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "fixed_shot",
      "hp": 60,
      "damage": 10,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.85,
      "active_seconds": 0,
      "recovery_seconds": 0.8,
      "range": 780,
      "collision_r": 16,
      "scale": 1,
      "default_count": 2,
      "projectile": {
        "kind": "bullet",
        "speed": 300,
        "radius": 5,
        "life": 2.6,
        "one_hit_per_hero": true
      },
      "pattern_params": {
        "trigger_range": null,
        "trigger_range_rule": "PRESERVED: no distance gate in current enemyStep; wait ready and line of sight suffice. range field is nominal beam length/projectile travel, not a new acquisition clamp."
      },
      "render": {
        "cloth": "#536caf",
        "prop": "short light gun at forward hand",
        "accent": "#e3aa4b"
      },
      "numeric_source": "PRESERVED_CURRENT_G1_G2"
    },
    "rusher": {
      "typeId": "rusher",
      "stage": 2,
      "label": "近身冲手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "charge",
      "hp": 48,
      "damage": 10,
      "damageKind": "ordinary_light_melee",
      "speed": 70,
      "tell_seconds": 0.85,
      "active_seconds": 0.3,
      "recovery_seconds": 1,
      "range": 230,
      "collision_r": 16,
      "scale": 1,
      "default_count": 2,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 280,
        "stop_distance": 90,
        "trigger_range": 230,
        "stall_speed_threshold": 50
      },
      "render": {
        "cloth": "#a04945",
        "prop": "none",
        "hair": "cropped"
      },
      "numeric_source": "PRESERVED_CURRENT_G1_G2"
    },
    "ati_captain": {
      "typeId": "ati_captain",
      "stage": 3,
      "label": "ATI双盾女队长",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "shield_cycle_bash",
      "hp": 200,
      "damage": 16,
      "damageKind": "ordinary_light_melee",
      "speed": 44,
      "tell_seconds": 0.8,
      "active_seconds": 0.18,
      "recovery_seconds": 1.2,
      "range": 130,
      "collision_r": 22,
      "scale": 1.18,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "closed_seconds": 2.2,
        "closed_front_angle": 160,
        "closed_damage_multiplier": 0.25,
        "open_at_tell_seconds": 0.35,
        "stop_distance": 70,
        "bash_reach": 70,
        "bash_radius": 18,
        "bash_active_seconds": 0.18,
        "bash_damage": 16,
        "shield_side_back_damage_multiplier": 1,
        "shield_closed_start": "At encounter entry and after recovery, shield closed timer runs while approaching. Start next tell only when timer elapsed and within range; no body HP invulnerability."
      },
      "render": {
        "cloth": "#8d354a",
        "accent": "#e5b5bb",
        "prop": "two vertical rounded shields24x38 at left/right hand anchors, no continuous ring",
        "pose": "plates separate on open, one arm bashes; visible rear cloth gap",
        "outline": "female captain hair tie, broad two-shield silhouette"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "shield_soldier": {
      "typeId": "shield_soldier",
      "stage": 3,
      "label": "盾兵",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "shield_cycle_bash",
      "hp": 72,
      "damage": 10,
      "damageKind": "ordinary_light_melee",
      "speed": 48,
      "tell_seconds": 0.65,
      "active_seconds": 0.16,
      "recovery_seconds": 0.95,
      "range": 110,
      "collision_r": 18,
      "scale": 1,
      "default_count": 2,
      "projectile": null,
      "pattern_params": {
        "closed_seconds": 1.8,
        "closed_front_angle": 140,
        "closed_damage_multiplier": 0.35,
        "open_at_tell_seconds": 0.3,
        "stop_distance": 65,
        "bash_reach": 58,
        "bash_radius": 14,
        "bash_active_seconds": 0.16,
        "bash_damage": 10,
        "shield_side_back_damage_multiplier": 1,
        "shield_closed_start": "At encounter entry and after recovery, shield closed timer runs while approaching. Start next tell only when timer elapsed and within range; no body HP invulnerability."
      },
      "render": {
        "cloth": "#793e4b",
        "prop": "one rectangular shield22x32 on front hand; rear visibly open",
        "accent": "#c9a4ae"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "rear_thrower": {
      "typeId": "rear_thrower",
      "stage": 3,
      "label": "后列投手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "fixed_shot",
      "hp": 56,
      "damage": 10,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.9,
      "active_seconds": 0,
      "recovery_seconds": 1,
      "range": 580,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": {
        "kind": "bullet",
        "speed": 240,
        "radius": 6,
        "life": 2.4,
        "one_hit_per_hero": true
      },
      "pattern_params": {},
      "render": {
        "cloth": "#6b4767",
        "prop": "small throwing plate, round projectile",
        "accent": "#e2acc4"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "disc_champion": {
      "typeId": "disc_champion",
      "stage": 4,
      "label": "回旋盘女冠军",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "return_disc",
      "hp": 240,
      "damage": 14,
      "damageKind": "discrete_projectile",
      "speed": 68,
      "tell_seconds": 1,
      "active_seconds": 0,
      "recovery_seconds": 1.05,
      "range": 520,
      "collision_r": 21,
      "scale": 1.1,
      "default_count": 1,
      "projectile": {
        "kind": "return_disc",
        "speed": 240,
        "radius": 7,
        "life": 3.2,
        "outbound_distance": 260,
        "outbound_speed": 240,
        "return_speed": 300,
        "one_hit_per_hero": true,
        "return_to": "frozen release point",
        "wall_response": "end"
      },
      "pattern_params": {
        "orbit_speed": 68,
        "desired_range": 210,
        "outbound_distance": 260,
        "outbound_speed": 240,
        "return_speed": 300,
        "return_hit_rule": "One packet per projectile emission over outbound+return combined; distinct new discs have distinct emission IDs. If slot1 catches a disc, end that projectile, not its owner."
      },
      "render": {
        "cloth": "#386b73",
        "prop": "open ring disc18diameter",
        "accent": "#8fddd8",
        "marker": "solid outbound arrow, hollow return arrow; ponytail silhouette"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "cross_disc_thrower": {
      "typeId": "cross_disc_thrower",
      "stage": 4,
      "label": "交叉盘投手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "return_disc",
      "hp": 64,
      "damage": 10,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.95,
      "active_seconds": 0,
      "recovery_seconds": 1.25,
      "range": 500,
      "collision_r": 16,
      "scale": 1,
      "default_count": 2,
      "projectile": {
        "kind": "return_disc",
        "speed": 210,
        "radius": 7,
        "life": 3.2,
        "outbound_distance": 220,
        "outbound_speed": 210,
        "return_speed": 280,
        "one_hit_per_hero": true,
        "return_to": "frozen release point",
        "wall_response": "end"
      },
      "pattern_params": {
        "orbit_speed": 0,
        "desired_range": 240,
        "outbound_distance": 220,
        "outbound_speed": 210,
        "return_speed": 280,
        "return_hit_rule": "One packet per projectile emission over outbound+return combined; distinct new discs have distinct emission IDs. If slot1 catches a disc, end that projectile, not its owner."
      },
      "render": {
        "cloth": "#496b6c",
        "prop": "thin disc14diameter",
        "accent": "#a6e1d7"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "diagonal_runner": {
      "typeId": "diagonal_runner",
      "stage": 4,
      "label": "斜穿跑手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "diagonal_charge",
      "hp": 56,
      "damage": 10,
      "damageKind": "ordinary_light_melee",
      "speed": 80,
      "tell_seconds": 0.75,
      "active_seconds": 0.32,
      "recovery_seconds": 1,
      "range": 260,
      "collision_r": 16,
      "scale": 1,
      "default_count": 2,
      "projectile": null,
      "pattern_params": {
        "approach_lateral_offset": 75,
        "charge_speed": 260,
        "max_distance": 83.2,
        "stop_distance": 100
      },
      "render": {
        "cloth": "#a9753d",
        "prop": "none",
        "accent": "#efc791",
        "pose": "one low shoulder, long stride, diagonal arrow"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "boxing_mech": {
      "typeId": "boxing_mech",
      "stage": 5,
      "label": "拳击机甲",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "locked_fist_sweep",
      "hp": 360,
      "damage": 22,
      "damageKind": "heavy_boss_punch",
      "speed": 30,
      "tell_seconds": 1.1,
      "active_seconds": 0.22,
      "recovery_seconds": 1.3,
      "range": 180,
      "collision_r": 32,
      "scale": 1.6,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "stop_distance": 115,
        "fist": {
          "reach": 150,
          "radius": 24,
          "damage": 22,
          "tell": 1.1,
          "active": 0.22,
          "recovery": 1.3
        },
        "sweep": {
          "radius": 105,
          "half_angle": 100,
          "damage": 18,
          "tell": 1,
          "active": 0.28,
          "recovery": 1.4
        },
        "attack_order": [
          "fist",
          "sweep"
        ],
        "multipart_owner_count": 1,
        "pilot_hittable_separately": false,
        "body_mitigation": 1
      },
      "render": {
        "cloth": "#636a77",
        "metal": "#aeb8c5",
        "accent": "#a8c8e2",
        "prop": "oversized two forearm boxes, square torso frame, pilot head inside chest window",
        "pilot": "original anonymous pilot head visual only; label/HP on mech once",
        "pose": "extend one fist along tell capsule, opposite-side arc on alternate attack; no giant opaque particles"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "arc_thrower": {
      "typeId": "arc_thrower",
      "stage": 5,
      "label": "弧投手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "curved_arc_shot",
      "hp": 80,
      "damage": 12,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.95,
      "active_seconds": 0,
      "recovery_seconds": 1.1,
      "range": 560,
      "collision_r": 16,
      "scale": 1,
      "default_count": 2,
      "projectile": {
        "kind": "curved_bullet",
        "speed": 220,
        "radius": 6,
        "life": 2.6,
        "turn_rate_deg_per_second": 25,
        "curve_seconds": 0.65,
        "one_hit_per_hero": true
      },
      "pattern_params": {
        "desired_range": 260,
        "alternate_curve_sign": true
      },
      "render": {
        "cloth": "#52687f",
        "prop": "arc launcher at forward hand",
        "accent": "#b6d6ff",
        "marker": "curved dotted path matches deterministic curve"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "amd_leader": {
      "typeId": "amd_leader",
      "stage": 6,
      "label": "AMD幻想队长",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "alternating_lane",
      "hp": 280,
      "damage": 13,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.95,
      "active_seconds": 0,
      "recovery_seconds": 1.2,
      "range": 620,
      "collision_r": 21,
      "scale": 1.1,
      "default_count": 1,
      "projectile": {
        "kind": "bullet",
        "speed": 250,
        "radius": 5,
        "life": 2.5,
        "one_hit_per_hero": true
      },
      "pattern_params": {
        "period_seconds": 4,
        "parity_offset_seconds": 2,
        "slot_tolerance_seconds": 0.02,
        "parity": 0,
        "attack_phase": 2,
        "burst_count": 3,
        "fan_degrees": 20
      },
      "render": {
        "cloth": "#8f3d43",
        "prop": "short staff/barrel frame not magic infinite beam",
        "accent": "#f1a4a4",
        "outline": "short swept hair/glasses, small three-ray tell"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "gun_column": {
      "typeId": "gun_column",
      "stage": 6,
      "label": "交替火列射手",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "alternating_lane",
      "hp": 72,
      "damage": 10,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.9,
      "active_seconds": 0,
      "recovery_seconds": 1.1,
      "range": 620,
      "collision_r": 16,
      "scale": 1,
      "default_count": 4,
      "projectile": {
        "kind": "bullet",
        "speed": 260,
        "radius": 5,
        "life": 2.5,
        "one_hit_per_hero": true
      },
      "pattern_params": {
        "period_seconds": 4,
        "parity_offset_seconds": 2,
        "slot_tolerance_seconds": 0.02,
        "parity": "spawn.column % 2",
        "attack_phase": 2,
        "burst_count": 1,
        "fan_degrees": 0
      },
      "render": {
        "cloth": "#6f4554",
        "prop": "narrow long light-gun barrel26x7",
        "accent": "#edb7af",
        "marker": "one stripe for parity0, two for parity1; never only hue"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "diagonal_guard": {
      "typeId": "diagonal_guard",
      "stage": 6,
      "label": "斜向卫兵",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "diagonal_charge",
      "hp": 96,
      "damage": 12,
      "damageKind": "ordinary_light_melee",
      "speed": 66,
      "tell_seconds": 0.85,
      "active_seconds": 0.34,
      "recovery_seconds": 1.1,
      "range": 280,
      "collision_r": 18,
      "scale": 1,
      "default_count": 2,
      "projectile": null,
      "pattern_params": {
        "approach_lateral_offset": 90,
        "charge_speed": 250,
        "max_distance": 85,
        "stop_distance": 105
      },
      "render": {
        "cloth": "#64485e",
        "prop": "short forearm plate",
        "accent": "#d6adca",
        "pose": "wide shoulders/diagonal step; no projectile"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "ember_beast": {
      "typeId": "ember_beast",
      "stage": 7,
      "label": "余烬压力兽",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": true,
      "pattern": "heavy_charge",
      "hp": 400,
      "damage": 22,
      "damageKind": "heavy_body_charge",
      "speed": 42,
      "tell_seconds": 1.15,
      "active_seconds": 0.4,
      "recovery_seconds": 1.4,
      "range": 300,
      "collision_r": 30,
      "scale": 1.5,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 250,
        "stop_distance": 130,
        "trigger_range": 300,
        "stall_speed_threshold": 50,
        "max_distance": 100
      },
      "render": {
        "cloth": "#693d32",
        "accent": "#e6a16b",
        "prop": "low broad body using crouched rig, angular ember shoulder plates",
        "pose": "back-weighted tell, grounded rush; no added breath/extra heat attack"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "needle_creature": {
      "typeId": "needle_creature",
      "stage": 7,
      "label": "针刺生物",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "fixed_shot",
      "hp": 64,
      "damage": 9,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 0.8,
      "active_seconds": 0,
      "recovery_seconds": 0.95,
      "range": 560,
      "collision_r": 14,
      "scale": 0.85,
      "default_count": 3,
      "projectile": {
        "kind": "needle",
        "speed": 290,
        "radius": 4,
        "life": 2,
        "one_hit_per_hero": true
      },
      "pattern_params": {},
      "render": {
        "cloth": "#765d49",
        "accent": "#f0d5a3",
        "prop": "three thin back spines; narrow8x2 projectile",
        "marker": "narrow straight line, different from heat circle"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "heat_creature": {
      "typeId": "heat_creature",
      "stage": 7,
      "label": "热地生物",
      "ownerKind": "single_actor",
      "ownerIdRule": "attempt + stable spawnId; one HP/retire per owner, never per collider",
      "boss": false,
      "pattern": "ground_heat",
      "hp": 80,
      "damage": 7,
      "damageKind": "ground_heat",
      "speed": 28,
      "tell_seconds": 1,
      "active_seconds": 0,
      "recovery_seconds": 1.3,
      "range": 420,
      "collision_r": 17,
      "scale": 1,
      "default_count": 2,
      "projectile": null,
      "pattern_params": {
        "stop_distance": 220,
        "heat": {
          "radius": 42,
          "tell": 1,
          "life": 1.1,
          "tick_interval": 0.4,
          "damage_per_tick": 7
        },
        "max_own_patches": 1
      },
      "render": {
        "cloth": "#715248",
        "accent": "#e9ac82",
        "prop": "broad rounded shell and flat ground ring",
        "marker": "dashed hatch during tell; filled crosshatch during heat, no bright full-screen glow"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL"
    },
    "seat_01": {
      "typeId": "seat_01",
      "stage": 8,
      "label": "Tench Coxe",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_01; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "charge",
      "hp": 120,
      "damage": 12,
      "damageKind": "ordinary_light_melee",
      "speed": 52,
      "tell_seconds": 0.95,
      "active_seconds": 0.3,
      "recovery_seconds": 1.2,
      "range": 250,
      "collision_r": 18,
      "scale": 1,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 240,
        "stop_distance": 100,
        "trigger_range": 250,
        "stall_speed_threshold": 50
      },
      "render": {
        "cloth": "#bd8a64",
        "outline": "dark suit/unique numbered shoulder badge 01",
        "prop": "forearm brace",
        "marker": "wedge/arrow",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "melee",
      "clear_space_interrupt_eligible": true
    },
    "seat_02": {
      "typeId": "seat_02",
      "stage": 8,
      "label": "John O. Dabiri",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_02; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "fixed_shot",
      "hp": 100,
      "damage": 9,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 1.05,
      "active_seconds": 0,
      "recovery_seconds": 1.2,
      "range": 600,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": {
        "kind": "bullet",
        "speed": 240,
        "radius": 5,
        "life": 2.5,
        "one_hit_per_hero": true
      },
      "pattern_params": {},
      "render": {
        "cloth": "#718c9d",
        "outline": "dark suit/unique numbered shoulder badge 02",
        "prop": "small straight launcher",
        "marker": "thin ray",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "ranged",
      "clear_space_interrupt_eligible": false
    },
    "seat_03": {
      "typeId": "seat_03",
      "stage": 8,
      "label": "Dawn Hudson",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_03; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "ground_heat",
      "hp": 100,
      "damage": 6,
      "damageKind": "ground_heat",
      "speed": 0,
      "tell_seconds": 1.2,
      "active_seconds": 0,
      "recovery_seconds": 1.4,
      "range": 450,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "heat": {
          "radius": 36,
          "tell": 1.2,
          "life": 0.85,
          "tick_interval": 0.4,
          "damage_per_tick": 6
        },
        "max_own_patches": 1
      },
      "render": {
        "cloth": "#a78296",
        "outline": "dark suit/unique numbered shoulder badge 03",
        "prop": "flat ring focus",
        "marker": "crosshatched circle",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "caster",
      "clear_space_interrupt_eligible": false
    },
    "seat_04": {
      "typeId": "seat_04",
      "stage": 8,
      "label": "Harvey C. Jones",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_04; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "charge",
      "hp": 120,
      "damage": 12,
      "damageKind": "ordinary_light_melee",
      "speed": 52,
      "tell_seconds": 0.95,
      "active_seconds": 0.3,
      "recovery_seconds": 1.2,
      "range": 250,
      "collision_r": 18,
      "scale": 1,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 240,
        "stop_distance": 100,
        "trigger_range": 250,
        "stall_speed_threshold": 50
      },
      "render": {
        "cloth": "#89a07e",
        "outline": "dark suit/unique numbered shoulder badge 04",
        "prop": "forearm brace",
        "marker": "wedge/arrow",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "melee",
      "clear_space_interrupt_eligible": true
    },
    "seat_05": {
      "typeId": "seat_05",
      "stage": 8,
      "label": "Melissa B. Lora",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_05; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "fixed_shot",
      "hp": 100,
      "damage": 9,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 1.05,
      "active_seconds": 0,
      "recovery_seconds": 1.2,
      "range": 600,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": {
        "kind": "bullet",
        "speed": 240,
        "radius": 5,
        "life": 2.5,
        "one_hit_per_hero": true
      },
      "pattern_params": {},
      "render": {
        "cloth": "#9186aa",
        "outline": "dark suit/unique numbered shoulder badge 05",
        "prop": "small straight launcher",
        "marker": "thin ray",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "ranged",
      "clear_space_interrupt_eligible": false
    },
    "seat_06": {
      "typeId": "seat_06",
      "stage": 8,
      "label": "Stephen C. Neal",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_06; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "ground_heat",
      "hp": 100,
      "damage": 6,
      "damageKind": "ground_heat",
      "speed": 0,
      "tell_seconds": 1.2,
      "active_seconds": 0,
      "recovery_seconds": 1.4,
      "range": 450,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "heat": {
          "radius": 36,
          "tell": 1.2,
          "life": 0.85,
          "tick_interval": 0.4,
          "damage_per_tick": 6
        },
        "max_own_patches": 1
      },
      "render": {
        "cloth": "#b3ab7d",
        "outline": "dark suit/unique numbered shoulder badge 06",
        "prop": "flat ring focus",
        "marker": "crosshatched circle",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "caster",
      "clear_space_interrupt_eligible": false
    },
    "seat_07": {
      "typeId": "seat_07",
      "stage": 8,
      "label": "A. Brooke Seawell",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_07; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "charge",
      "hp": 120,
      "damage": 12,
      "damageKind": "ordinary_light_melee",
      "speed": 52,
      "tell_seconds": 0.95,
      "active_seconds": 0.3,
      "recovery_seconds": 1.2,
      "range": 250,
      "collision_r": 18,
      "scale": 1,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "charge_speed": 240,
        "stop_distance": 100,
        "trigger_range": 250,
        "stall_speed_threshold": 50
      },
      "render": {
        "cloth": "#b7866b",
        "outline": "dark suit/unique numbered shoulder badge 07",
        "prop": "forearm brace",
        "marker": "wedge/arrow",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "melee",
      "clear_space_interrupt_eligible": true
    },
    "seat_08": {
      "typeId": "seat_08",
      "stage": 8,
      "label": "Aarti Shah",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_08; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "fixed_shot",
      "hp": 100,
      "damage": 9,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 1.05,
      "active_seconds": 0,
      "recovery_seconds": 1.2,
      "range": 600,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": {
        "kind": "bullet",
        "speed": 240,
        "radius": 5,
        "life": 2.5,
        "one_hit_per_hero": true
      },
      "pattern_params": {},
      "render": {
        "cloth": "#77a69c",
        "outline": "dark suit/unique numbered shoulder badge 08",
        "prop": "small straight launcher",
        "marker": "thin ray",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "ranged",
      "clear_space_interrupt_eligible": false
    },
    "seat_09": {
      "typeId": "seat_09",
      "stage": 8,
      "label": "Mark A. Stevens",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_09; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "ground_heat",
      "hp": 100,
      "damage": 6,
      "damageKind": "ground_heat",
      "speed": 0,
      "tell_seconds": 1.2,
      "active_seconds": 0,
      "recovery_seconds": 1.4,
      "range": 450,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": null,
      "pattern_params": {
        "heat": {
          "radius": 36,
          "tell": 1.2,
          "life": 0.85,
          "tick_interval": 0.4,
          "damage_per_tick": 6
        },
        "max_own_patches": 1
      },
      "render": {
        "cloth": "#8399b1",
        "outline": "dark suit/unique numbered shoulder badge 09",
        "prop": "flat ring focus",
        "marker": "crosshatched circle",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "caster",
      "clear_space_interrupt_eligible": false
    },
    "seat_10": {
      "typeId": "seat_10",
      "stage": 8,
      "label": "Suzanne Nora Johnson",
      "ownerKind": "independent_seat",
      "ownerIdRule": "attempt + seat_10; this seat owns its own HP, action roots, hazards, retirement; no shared pool",
      "boss": true,
      "pattern": "fixed_shot",
      "hp": 100,
      "damage": 9,
      "damageKind": "discrete_projectile",
      "speed": 0,
      "tell_seconds": 1.05,
      "active_seconds": 0,
      "recovery_seconds": 1.2,
      "range": 600,
      "collision_r": 16,
      "scale": 1,
      "default_count": 1,
      "projectile": {
        "kind": "bullet",
        "speed": 240,
        "radius": 5,
        "life": 2.5,
        "one_hit_per_hero": true
      },
      "pattern_params": {},
      "render": {
        "cloth": "#ad879d",
        "outline": "dark suit/unique numbered shoulder badge 10",
        "prop": "small straight launcher",
        "marker": "thin ray",
        "silhouette": "reuse existing adult rig; do not assert portrait likeness"
      },
      "numeric_source": "LOCAL_EDITABLE_INITIAL",
      "threatClass": "ranged",
      "clear_space_interrupt_eligible": false
    }
  },
  "encounters": [
    {
      "stage": 1,
      "hero_xy": [
        720,
        620
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g1_01",
          "ordinal": 1,
          "typeId": "troublemaker_customer",
          "x": 620,
          "y": 460,
          "legacy_numeric_id": 1
        },
        {
          "spawnId": "g1_02",
          "ordinal": 2,
          "typeId": "troublemaker_customer",
          "x": 850,
          "y": 480,
          "legacy_numeric_id": 2
        },
        {
          "spawnId": "g1_03",
          "ordinal": 3,
          "typeId": "troublemaker_customer",
          "x": 600,
          "y": 330,
          "legacy_numeric_id": 3
        },
        {
          "spawnId": "g1_04",
          "ordinal": 4,
          "typeId": "troublemaker_boss",
          "x": 820,
          "y": 260,
          "legacy_numeric_id": 4,
          "entered": false
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "Preserve story G1 Boss enters only after three customers retire and both existing support/tray semantics. Manual summon in debug may enter immediately; no extra enemy foreman."
    },
    {
      "stage": 2,
      "hero_xy": [
        720,
        680
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g2_01",
          "ordinal": 1,
          "typeId": "champion",
          "x": 720,
          "y": 260,
          "legacy_numeric_id": 1
        },
        {
          "spawnId": "g2_02",
          "ordinal": 2,
          "typeId": "gunner",
          "x": 480,
          "y": 370,
          "legacy_numeric_id": 2
        },
        {
          "spawnId": "g2_03",
          "ordinal": 3,
          "typeId": "gunner",
          "x": 960,
          "y": 370,
          "legacy_numeric_id": 3
        },
        {
          "spawnId": "g2_04",
          "ordinal": 4,
          "typeId": "rusher",
          "x": 600,
          "y": 530,
          "legacy_numeric_id": 4
        },
        {
          "spawnId": "g2_05",
          "ordinal": 5,
          "typeId": "rusher",
          "x": 840,
          "y": 500,
          "legacy_numeric_id": 5
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "Original current G2 positions, IDs, fixed champion and shooters; both skills locked."
    },
    {
      "stage": 3,
      "hero_xy": [
        720,
        700
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g3_01",
          "ordinal": 1,
          "typeId": "ati_captain",
          "x": 720,
          "y": 300
        },
        {
          "spawnId": "g3_02",
          "ordinal": 2,
          "typeId": "shield_soldier",
          "x": 635,
          "y": 455
        },
        {
          "spawnId": "g3_03",
          "ordinal": 3,
          "typeId": "shield_soldier",
          "x": 805,
          "y": 455
        },
        {
          "spawnId": "g3_04",
          "ordinal": 4,
          "typeId": "rear_thrower",
          "x": 960,
          "y": 300
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "Paired front shields with an initial134-world-unit free gap between collider edges; walking around either side remains possible, not mandatory slot1 gate."
    },
    {
      "stage": 4,
      "hero_xy": [
        720,
        700
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g4_01",
          "ordinal": 1,
          "typeId": "disc_champion",
          "x": 720,
          "y": 300
        },
        {
          "spawnId": "g4_02",
          "ordinal": 2,
          "typeId": "cross_disc_thrower",
          "x": 450,
          "y": 360
        },
        {
          "spawnId": "g4_03",
          "ordinal": 3,
          "typeId": "cross_disc_thrower",
          "x": 990,
          "y": 360
        },
        {
          "spawnId": "g4_04",
          "ordinal": 4,
          "typeId": "diagonal_runner",
          "x": 560,
          "y": 510
        },
        {
          "spawnId": "g4_05",
          "ordinal": 5,
          "typeId": "diagonal_runner",
          "x": 880,
          "y": 510
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "Disc paths can cross but all tells budgeted; champion moves in available terrain rather than scripted teleport."
    },
    {
      "stage": 5,
      "hero_xy": [
        720,
        700
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g5_01",
          "ordinal": 1,
          "typeId": "boxing_mech",
          "x": 720,
          "y": 330
        },
        {
          "spawnId": "g5_02",
          "ordinal": 2,
          "typeId": "arc_thrower",
          "x": 470,
          "y": 390
        },
        {
          "spawnId": "g5_03",
          "ordinal": 3,
          "typeId": "arc_thrower",
          "x": 970,
          "y": 390
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "One mech+two support owners. Pilot/arms/torso all resolve mech owner. No second pilot target."
    },
    {
      "stage": 6,
      "hero_xy": [
        720,
        720
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g6_01",
          "ordinal": 1,
          "typeId": "amd_leader",
          "x": 720,
          "y": 250,
          "parity": 0
        },
        {
          "spawnId": "g6_02",
          "ordinal": 2,
          "typeId": "gun_column",
          "x": 470,
          "y": 340,
          "column": 0,
          "parity": 0
        },
        {
          "spawnId": "g6_03",
          "ordinal": 3,
          "typeId": "gun_column",
          "x": 470,
          "y": 430,
          "column": 0,
          "parity": 0
        },
        {
          "spawnId": "g6_04",
          "ordinal": 4,
          "typeId": "gun_column",
          "x": 970,
          "y": 340,
          "column": 1,
          "parity": 1
        },
        {
          "spawnId": "g6_05",
          "ordinal": 5,
          "typeId": "gun_column",
          "x": 970,
          "y": 430,
          "column": 1,
          "parity": 1
        },
        {
          "spawnId": "g6_06",
          "ordinal": 6,
          "typeId": "diagonal_guard",
          "x": 590,
          "y": 540
        },
        {
          "spawnId": "g6_07",
          "ordinal": 7,
          "typeId": "diagonal_guard",
          "x": 850,
          "y": 540
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "Global two-tell budget means at most two same-parity shooters release in a slot. Rotate stable owner order among leader/left column on successive parity0 slots; denied actors skip. Right/left open corridor remains, no synchronized wall."
    },
    {
      "stage": 7,
      "hero_xy": [
        720,
        720
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g7_01",
          "ordinal": 1,
          "typeId": "ember_beast",
          "x": 720,
          "y": 300
        },
        {
          "spawnId": "g7_02",
          "ordinal": 2,
          "typeId": "needle_creature",
          "x": 470,
          "y": 390
        },
        {
          "spawnId": "g7_03",
          "ordinal": 3,
          "typeId": "needle_creature",
          "x": 720,
          "y": 430
        },
        {
          "spawnId": "g7_04",
          "ordinal": 4,
          "typeId": "needle_creature",
          "x": 970,
          "y": 390
        },
        {
          "spawnId": "g7_05",
          "ordinal": 5,
          "typeId": "heat_creature",
          "x": 560,
          "y": 300
        },
        {
          "spawnId": "g7_06",
          "ordinal": 6,
          "typeId": "heat_creature",
          "x": 880,
          "y": 300
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "Beast only heavy charge; needle discrete/catchable, heat ground/unblockable; no passive guard in entry kit."
    },
    {
      "stage": 8,
      "hero_xy": [
        720,
        720
      ],
      "initial_hero_hp": 100,
      "actors": [
        {
          "spawnId": "g8_01",
          "ordinal": 1,
          "typeId": "seat_01",
          "x": 470,
          "y": 360
        },
        {
          "spawnId": "g8_02",
          "ordinal": 2,
          "typeId": "seat_02",
          "x": 420,
          "y": 250
        },
        {
          "spawnId": "g8_03",
          "ordinal": 3,
          "typeId": "seat_03",
          "x": 570,
          "y": 220
        },
        {
          "spawnId": "g8_04",
          "ordinal": 4,
          "typeId": "seat_04",
          "x": 630,
          "y": 420
        },
        {
          "spawnId": "g8_05",
          "ordinal": 5,
          "typeId": "seat_05",
          "x": 720,
          "y": 240
        },
        {
          "spawnId": "g8_06",
          "ordinal": 6,
          "typeId": "seat_06",
          "x": 870,
          "y": 220
        },
        {
          "spawnId": "g8_07",
          "ordinal": 7,
          "typeId": "seat_07",
          "x": 810,
          "y": 440
        },
        {
          "spawnId": "g8_08",
          "ordinal": 8,
          "typeId": "seat_08",
          "x": 1020,
          "y": 250
        },
        {
          "spawnId": "g8_09",
          "ordinal": 9,
          "typeId": "seat_09",
          "x": 1040,
          "y": 390
        },
        {
          "spawnId": "g8_10",
          "ordinal": 10,
          "typeId": "seat_10",
          "x": 960,
          "y": 520
        }
      ],
      "placement_rule": "Keep intended formation; validate each collider against World and neighbors with existing collision placement. Do not silently drop an actor or merge owners; if blocked visibly reject/reset or relocate to nearest legal preserving side/group.",
      "notes": "All10 entered at start with stable seat IDs, independent HP; bosses for displacement rules, only3 melee interrupt-eligible. Broad lower/left/right exits, no ring wall. Debug never awards terminal completion."
    }
  ]
};

  // Technical event floor: one fixed simulation step; cooldown zero remains meaningful.
  const FIXED = 1/120;
  const stageIds = Object.freeze([1,2,3,4,5,6,7,8]);
  const typeIds = Object.freeze(Object.keys(BASE.types));
  const clone = value => Array.isArray(value) ? value.map(clone) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key,v])=>[key,clone(v)])) : value;
  const plain = value => value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const get = (value,path) => path.reduce((v,key)=>v?.[key],value);
  function put(value,path,next) { const parent=get(value,path.slice(0,-1)); parent[path.at(-1)]=next; }
  function defaults(stage) {
    if (!stageIds.includes(stage)) throw new Error('Stage must be an integer from 1 to 8.');
    const entry=clone(BASE.entries[stage]), id=entry.auto_attack, bare=id==='bare_fists', hammer=id==='hammer_shield_fast';
    return {stage,entry,hero:{maxHp:100,hp:100,speed:176,r:15},
      auto:{id,damage:bare?8:hammer?14:12,cycle:bare?.7:.36,reach:bare?30:45,radius:bare?7:9,cap:bare?1:3,contactStart:.10,contactEnd:.18},
      breakthrough:{cooldown:3,duration:.34,advanceStart:.06,advanceEnd:.22,contactStart:.10,contactEnd:.22,guardStart:.06,guardEnd:.22,advanceDistance:45,damageMultiplier:.75,cap:3,pushDistance:18,gauntletGuardDegrees:60,shieldGuardDegrees:120},
      clear_space:{cooldown:6,windup:.18,active:.24,recovery:.18,moveMultiplier:.75,damageMultiplier:2,cap:6,gauntletRadius:45,hammerRadius:60,pushDistance:22.5,stagger:.18},
      cuda:{interval:1.2,damageMultiplier:.5,maxOwners:4,maxDepth:2,edgeRange:60,seedRange:120},
      steady_guard:{frontDegrees:120,damageMultiplier:.75},limits:{normalCap:50,bossCap:10,hazards:18,heat:6,tells:2,initialWaitBase:1,initialWaitStep:.27,enemyWait:.6},
      types:clone(BASE.types),encounters:clone(BASE.encounters)};
  }
  // Native-stage budgets: light foes take 1–3 D; bosses use ~30 D before skills/mitigation.
  // Ten seats share a 200 D encounter budget; each retains its own HP and role damage.
  const growth = Object.freeze([
    null,[20,100,.5],[60,180,.36],[180,300,.36],[500,500,.36],
    [1200,800,.36],[2400,1200,.36],[4000,1800,.45],[6000,2500,.45]
  ]);
  const enemyGrowth = Object.freeze({
    troublemaker_customer:[40,10],troublemaker_boss:[600,18],
    champion:[1800,32],gunner:[120,18],rusher:[120,22],
    ati_captain:[5400,60],shield_soldier:[540,36],rear_thrower:[360,30],
    disc_champion:[15000,90],cross_disc_thrower:[1000,50],diagonal_runner:[1000,60],
    boxing_mech:[36000,160],arc_thrower:[2400,80],
    amd_leader:[72000,180],gun_column:[4800,120],diagonal_guard:[7200,144],
    ember_beast:[160000,300],needle_creature:[8000,144],heat_creature:[8000,90],
    seat_01:[144000,300],seat_02:[120000,225],seat_03:[108000,125],
    seat_04:[144000,300],seat_05:[120000,225],seat_06:[108000,125],
    seat_07:[144000,300],seat_08:[120000,225],seat_09:[108000,125],seat_10:[84000,225]
  });
  function growthDefaults(stage) {
    const config=defaults(stage),[damage,hp,cycle]=growth[stage];
    config.growth=true;config.entry.max_hp=hp;Object.assign(config.hero,{hp,maxHp:hp});
    Object.assign(config.auto,{damage,cycle,critChance:.15,critMultiplier:2});
    for(const [id,[hp,damage]] of Object.entries(enemyGrowth)) {
      const type=config.types[id],ratio=damage/type.damage;type.hp=hp;type.damage=damage;
      if(type.pattern==='locked_fist_sweep')type.pattern_params.sweep.damage*=ratio;
      syncAliases(type);
    }
    return config;
  }
  function section(config,name) {
    if (['hero','auto','breakthrough','clear_space','cuda','steady_guard','limits'].includes(name)) return config[name];
    if (typeof name==='string' && name.startsWith('enemy:') && typeIds.includes(name.slice(6))) return config.types[name.slice(6)];
    throw new Error('Unknown section: '+String(name));
  }
  function aliases(type) {
    const list=[], add=(from,...targets)=>targets.forEach(to=>list.push({from:from.split('.'),to:to.split('.')}));
    const p=type.pattern;
    if (['charge','heavy_charge'].includes(p)) add('range','pattern_params.trigger_range');
    if (p==='shield_cycle_bash') { add('damage','pattern_params.bash_damage'); add('active_seconds','pattern_params.bash_active_seconds'); }
    if (p==='ground_heat') { add('damage','pattern_params.heat.damage_per_tick'); add('tell_seconds','pattern_params.heat.tell'); }
    if (p==='locked_fist_sweep') for (const [field,sub] of [['damage','damage'],['tell_seconds','tell'],['active_seconds','active'],['recovery_seconds','recovery']]) add(field,'pattern_params.fist.'+sub);
    if (p==='return_disc') { add('speed','pattern_params.orbit_speed'); add('projectile.outbound_speed','projectile.speed','pattern_params.outbound_speed'); add('projectile.return_speed','pattern_params.return_speed'); add('projectile.outbound_distance','pattern_params.outbound_distance'); }
    if (type.typeId==='champion') add('projectile.length','range');
    if (type.typeId==='gunner') list.push({from:['projectile','speed'],to:['range'],product:['projectile','life']});
    return list;
  }
  function aliasValue(type,a) { return get(type,a.from)*(a.product?get(type,a.product):1); }
  function syncAliases(type) { for (const a of aliases(type)) put(type,a.to,aliasValue(type,a)); }
  function numericRule(name,path,value,target) {
    const key=path.at(-1), full=path.join('.'), enemy=name.startsWith('enemy:');
    let min=0,max=10000,integer=false,unit='';
    if (enemy) {
      let readOnlyReason=null;
      if(full==='default_count'){unit='count';readOnlyReason='参考数量；召唤数量由面板控制';}
      else if(full==='active_seconds'&&(target.projectile!==null||target.pattern==='ground_heat')){unit='s';readOnlyReason='发射后立即恢复；危险存续请调整 projectile.life 或 heat.life';}
      else if(target.typeId==='champion'&&full==='projectile.speed'){unit='wu/s';readOnlyReason='持续光束无飞行速度';}
      if(readOnlyReason){const fixed=get(BASE.types[target.typeId],path);return {min:fixed,max:fixed,integer:full==='default_count',unit,readOnly:true,readOnlyReason};}
      if (path[0]==='render' || ['stage'].includes(full) || ['multipart_owner_count','body_mitigation','shield_side_back_damage_multiplier'].includes(key)) return {min:get(BASE.types[target.typeId],path),max:get(BASE.types[target.typeId],path),integer:Number.isInteger(value),unit:'',readOnly:true};
      if (full==='hp') {min=1;max=2000000;unit='HP';}
      else if (/damage/.test(key)) {max=10000;unit='HP';if(key.endsWith('multiplier')){max=1;unit='×';}}
      else if (full==='collision_r') {min=4;max=80;unit='wu';}
      else if (full==='scale') {min=.1;max=4;unit='×';}
      else if (['default_count','burst_count','max_own_patches','parity'].includes(key)) {min=key==='burst_count'||key==='max_own_patches'?1:0;max=key==='parity'?1:key==='max_own_patches'?6:30;integer=true;unit='count';}
      else if (key==='closed_damage_multiplier') {max=1;unit='×';}
      else if (/angle|degrees|fan|turn_rate/.test(key)) {max=360;unit=key==='turn_rate_deg_per_second'?'deg/s':'deg';}
      else if (/speed/.test(key)) {min=path[0]==='projectile'?1:0;max=path[0]==='projectile'?1200:600;unit='wu/s';}
      else if (/radius/.test(key)) {min=1;max=60;unit='wu';if(key==='radius'&&path.includes('sweep'))max=1200;}
      else if (/range|distance|reach|length|offset/.test(key) && !/seconds/.test(key)) {min=key==='range'||key==='reach'||key==='length'||key==='outbound_distance'?1:0;max=1200;unit='wu';}
      else if (/seconds|life|tell|active|recovery|interval|attack_phase/.test(key)) {min=['life','tick_interval','period_seconds','parity_offset_seconds'].includes(key)?FIXED:0;max=10;unit='s';if(key==='tell_seconds')min=.05;
        if((key==='active_seconds'&&['charge','heavy_charge','diagonal_charge','shield_cycle_bash','locked_fist_sweep'].includes(target.pattern))||(key==='active'&&path[0]==='pattern_params'))min=FIXED;}
      else throw new Error('No numeric rule for '+name+'.'+full);
      const alias=aliases(target).find(a=>same(a.to,path));
      if (alias) return {min:alias.product?0:min,max:alias.product?12000:max,integer,unit,readOnly:true,aliasOf:alias.from,...(alias.product?{alsoDependsOn:alias.product}:{})};
      return {min,max,integer,unit,readOnly:false};
    }
    if (name==='hero') {if(key==='maxHp'){min=1;max=100000;unit='HP';}else if(key==='hp'){max=target.maxHp;unit='HP';}else if(key==='r'){min=4;max=40;unit='wu';}else if(key==='speed'){max=600;unit='wu/s';}}
    else if (name==='auto') {if(key==='cap'){min=1;max=200;integer=true;unit='owners';}else if(key==='damage'){max=100000;unit='HP';}else if(key==='critChance'){max=1;unit='probability';}else if(key==='critMultiplier'){min=1;max=10;unit='×';}else if(['reach','radius'].includes(key)){min=.000001;max=1200;unit='wu';}else{max=10;unit='s';if(key==='cycle')min=FIXED;}}
    else if(name==='limits'){if(['initialWaitBase','initialWaitStep','enemyWait'].includes(key)){max=60;unit='s';}else{integer=true;max=key==='normalCap'?200:key==='bossCap'?30:key==='tells'?10:200;min=key==='tells'?1:0;unit='count';}}
    else if(name==='cuda'){if(key==='maxOwners'){min=1;max=4;integer=true;unit='owners';}else if(key==='maxDepth'){max=2;integer=true;unit='hops';}else if(key.endsWith('Range')){max=1200;unit='wu';}else if(key==='interval'){max=60;unit='s';}else{max=100;unit='×';}}
    else if(key.includes('Degrees')){max=360;unit=key==='turn_rate_deg_per_second'?'deg/s':'deg';}
    else if(key==='cap'){min=1;max=200;integer=true;unit='owners';}
    else if(key==='damageMultiplier'){max=name==='steady_guard'?1:100;unit='×';}
    else if(key==='moveMultiplier'){max=1;unit='×';}
    else if(/Distance|Radius/.test(key)){min=key.endsWith('Radius')?.000001:0;max=1200;unit='wu';}
    else{max=key==='cooldown'?60:10;unit='s';if(key==='duration'||key==='active')min=FIXED;}
    if(name==='auto'){
      if(key==='contactStart')max=target.contactEnd-FIXED;
      if(key==='contactEnd'){min=target.contactStart+FIXED;max=target.cycle;}
    }
    if(name==='breakthrough'){
      for(const prefix of ['advance','contact','guard']){
        if(key===prefix+'Start')max=target[prefix+'End']-FIXED;
        if(key===prefix+'End'){min=target[prefix+'Start']+FIXED;max=target.duration;}
      }
    }
    return {min,max,integer,unit,readOnly:false};
  }
  function fields(config,name) {
    const target=section(config,name), result=[];
    function walk(value,path=[]) {
      if(typeof value==='number') { const rule=numericRule(name,path,value,target); if(name==='clear_space'&&['gauntletRadius','hammerRadius'].includes(path[0]))rule.min=config.auto.radius; const alias=rule.aliasOf; result.push({path,label:(name==='limits'?({initialWaitBase:'全局节奏 · 首次等待基础',initialWaitStep:'全局节奏 · 每召唤序号等待增量',enemyWait:'全局节奏 · 后续攻击等待'}[path[0]]||'全局容量 · '+path.join(' · ')):path.join(' · '))+(rule.readOnlyReason?' （'+rule.readOnlyReason+'）':'')+(rule.unit==='s'&&rule.min===FIXED?' (technical minimum 1/120s)':'')+(alias?' （随 '+alias.join('.')+(rule.alsoDependsOn?' × '+rule.alsoDependsOn.join('.'):'')+' 更新）':''),...rule,value}); }
      else if(value&&typeof value==='object') for(const key of Object.keys(value)) walk(value[key],[...path,key]);
    }
    walk(target);
    const derived=(path,label,value,unit)=>result.push({path:[path],label,unit,min:0,max:null,integer:false,readOnly:true,value});
    if(name==='hero')derived('bodyWidth','B = 2 × hero.r',2*config.hero.r,'wu');
    if(['breakthrough','clear_space','cuda'].includes(name))derived('effectiveDamage','Effective damage = '+target.damageMultiplier+' × D',target.damageMultiplier*config.auto.damage,'HP');
    if(name==='auto')derived('bodyWidth','Current B = 2 × hero.r',2*config.hero.r,'wu');
    return result;
  }
  // A local validation call passes its full section explicitly; no mutable module state.
  function applyPatch(target,patch,name,path=[],whole=target) {
    if(!plain(patch))throw new Error('Patch must be a plain object.');
    for(const key of Object.keys(patch)) {
      const descriptor=Object.getOwnPropertyDescriptor(patch,key), next=[...path,key];
      if(!descriptor||!Object.hasOwn(descriptor,'value'))throw new Error('Accessors are not patch values.');
      if(!Object.hasOwn(target,key))throw new Error('Unknown field: '+next.join('.'));
      const old=target[key], value=descriptor.value;
      if(typeof old==='number') {
        const rule=numericRule(name,next,old,whole);
        if(rule.readOnly)throw new Error('Read-only field: '+next.join('.')+(rule.aliasOf?' (edit '+rule.aliasOf.join('.')+')':rule.readOnlyReason?' ('+rule.readOnlyReason+')':''));
        if(typeof value!=='number'||!Number.isFinite(value))throw new Error('Expected finite number: '+next.join('.'));
        target[key]=value;
      } else if(plain(old))applyPatch(old,value,name,next,whole);
      else throw new Error('Read-only field: '+next.join('.'));
    }
  }
  function requireThat(ok,message) {if(!ok)throw new Error(message);}
  function validateShape(value,reference,path='config') {
    if(Array.isArray(reference)) { requireThat(Array.isArray(value)&&value.length===reference.length,'Invalid '+path); reference.forEach((v,i)=>validateShape(value[i],v,path+'.'+i)); return; }
    if(plain(reference)) {requireThat(plain(value)&&same(Object.keys(value).sort(),Object.keys(reference).sort()),'Unknown or missing field in '+path); for(const key of Object.keys(reference))validateShape(value[key],reference[key],path+'.'+key);return;}
    if(typeof reference==='number')requireThat(typeof value==='number'&&Number.isFinite(value),'Expected finite number: '+path);
    else requireThat(value===reference,'Read-only field: '+path);
  }
  function validateType(t) {
    const p=t.pattern, q=t.pattern_params, pr=t.projectile;
    for(const alias of aliases(t))requireThat(get(t,alias.to)===aliasValue(t,alias),'Inconsistent alias: '+t.typeId+'.'+alias.to.join('.'));
    if(['charge','heavy_charge','diagonal_charge','shield_cycle_bash','locked_fist_sweep'].includes(p))requireThat(t.active_seconds>=FIXED,'Actor contact duration must be at least 1/120 second.');
    if(['fixed_shot','return_disc','curved_arc_shot','alternating_lane'].includes(p))requireThat(pr!==null,'Projectile is required.');
    if(p==='shield_cycle_bash')requireThat(q.open_at_tell_seconds<=t.tell_seconds&&q.bash_radius<=q.bash_reach,'Invalid shield window or bash geometry.');
    if(p==='return_disc') {
      requireThat(pr.outbound_speed>0&&pr.return_speed>0&&pr.outbound_distance>0,'Disc distance and speeds must be positive.');
      requireThat(pr.life+1e-9>=pr.outbound_distance/pr.outbound_speed+pr.outbound_distance/pr.return_speed,'Disc lifetime cannot complete outbound and return travel.');
    }
    if(p==='curved_arc_shot')requireThat(pr.curve_seconds<=pr.life,'Curve time exceeds projectile lifetime.');
    if(p==='alternating_lane')requireThat(q.period_seconds>0&&q.parity_offset_seconds>0&&q.parity_offset_seconds<=q.period_seconds-FIXED&&q.slot_tolerance_seconds<Math.min(q.parity_offset_seconds,q.period_seconds-q.parity_offset_seconds)&&t.tell_seconds<Math.min(q.parity_offset_seconds,q.period_seconds-q.parity_offset_seconds),'Invalid alternating-lane period, parity offset, tolerance or tell.');
    if(p==='ground_heat')requireThat(q.heat.life>0&&q.heat.tick_interval>0&&q.heat.tell===t.tell_seconds,'Invalid heat lifetime, tick interval or shared tell.');
    if(p==='locked_fist_sweep')for(const [key,attack] of Object.entries({fist:q.fist,sweep:q.sweep}))requireThat(attack.active>=FIXED&&attack.tell>=0&&attack.recovery>=0&&(key!=='fist'||attack.radius<=attack.reach),'Invalid mech '+key+' timing or geometry.');
    if(Object.hasOwn(q,'max_distance'))requireThat(q.max_distance<=q.charge_speed*t.active_seconds+1e-9,'Charge distance exceeds speed × active duration.');
  }
  function validate(config) {
    requireThat(stageIds.includes(config?.stage),'Invalid stage.');
    const reference=config.growth===true?growthDefaults(config.stage):defaults(config.stage);
    requireThat(config.auto?.id===reference.auto.id||(config.stage===1&&config.auto?.id==='tray_sweep'),'Unknown or unowned automatic profile.');
    reference.auto.id=config.auto.id;
    validateShape(config,reference);
    requireThat(same(config.entry,reference.entry)&&same(config.encounters,reference.encounters),'Entry and formations are read-only.');
    requireThat(config.clear_space.gauntletRadius>=config.auto.radius&&config.clear_space.hammerRadius>=config.auto.radius,'Clear Space gauntletRadius and hammerRadius must each be >= auto.radius (carrier radius).');
    for(const name of ['hero','auto','breakthrough','clear_space','cuda','steady_guard','limits',...typeIds.map(id=>'enemy:'+id)]) {
      for(const field of fields(config,name)) {
        if(field.readOnly&&field.aliasOf)continue;
        if(field.path.length===1&&['bodyWidth','effectiveDamage'].includes(field.path[0]))continue;
        requireThat(Number.isFinite(field.value)&&field.value>=field.min&&field.value<=field.max&&(!field.integer||Number.isInteger(field.value)),'Out of bounds: '+name+'.'+field.path.join('.')+' ['+field.min+', '+field.max+']');
      }
    }
    const au=config.auto,b=config.breakthrough,c=config.clear_space;
    requireThat(config.hero.hp<=config.hero.maxHp,'Current HP exceeds maximum HP.');
    requireThat(0<=au.contactStart&&au.contactEnd-au.contactStart>=FIXED-1e-12&&au.contactEnd<=au.cycle&&au.radius<=au.reach,'Invalid automatic contact window, cycle or radius.');
    for(const key of ['advance','contact','guard'])requireThat(0<=b[key+'Start']&&b[key+'End']-b[key+'Start']>=FIXED-1e-12&&b[key+'End']<=b.duration,'Invalid Breakthrough '+key+' window.');
    requireThat(c.active>=FIXED&&c.windup+c.active+c.recovery>0,'Invalid Clear Space timing.');
    requireThat(config.cuda.edgeRange<=config.cuda.seedRange,'CUDA edge range exceeds seed range.');
    for(const t of Object.values(config.types))validateType(t);
  }
  function validatePatch(config,name,patch) {
    try {
      validate(config);
      const next=clone(config),target=section(next,name);
      applyPatch(target,patch,name);
      if(name.startsWith('enemy:'))syncAliases(target);
      validate(next);
      return {ok:true,value:next};
    } catch(error) {return {ok:false,error:String(error.message||error)};}
  }
  const api=Object.freeze({defaults,growthDefaults,validatePatch,fields,stageIds,typeIds});
  root.JensenCombatData=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
