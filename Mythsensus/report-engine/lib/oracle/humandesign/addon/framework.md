# Human Design Add-on — Framework knowledge

> Version: 2.0 (locked 2026-06-09)

---

## What Human Design measures

Human Design (HD) is a modern synthesis (~50 yrs, founded 1987) blending
astrology, Kabbalah's Tree of Life, the I Ching's 64 hexagrams, the Hindu
chakra system, and quantum-physics-inspired language. From birth datetime
you derive:
- **Type** (Manifestor / Generator / Manifesting Generator / Projector / Reflector)
- **Profile** (e.g. 5/1, 6/2) — your "role" in the world
- **Strategy** (how to engage life — wait to respond, inform, invitation, lunar cycle)
- **Authority** (how to make decisions — sacral, emotional, splenic, ego, etc.)
- **Centers** (9 energy centers, each Defined or Undefined)
- **Channels + Gates** (connections that map your fixed wiring)

For the 6-cat-10-Q output:

| Field | Use to answer |
|---|---|
| `humandesign.type` | Identity baseline — how you operate |
| `humandesign.profile` | The role pair (e.g. 5/1 Heretic/Investigator) |
| `humandesign.strategy` | How to engage life |
| `humandesign.authority` | Decision-making source |
| `humandesign.signature` | The emotional signal of being in alignment |
| `humandesign.notSelf` | The emotional signal of misalignment |
| `humandesign.definedCenters[]` | Where your energy is consistent |
| `humandesign.undefinedCenters[]` | Where you amplify others' energy |

## The 5 Types — at-a-glance

| Type | Energy | Strategy | Signature | Not-self |
|---|---|---|---|---|
| Manifestor (~9%) | Initiating | Inform before acting | Peace | Anger |
| Generator (~37%) | Sustainable life-force | Respond to life | Satisfaction | Frustration |
| Manifesting Generator (~33%) | Multi-passionate | Respond + inform | Satisfaction + Peace | Frustration + Anger |
| Projector (~20%) | Wise guide | Wait for invitation | Success | Bitterness |
| Reflector (~1%) | Lunar mirror | Wait a lunar cycle | Surprise | Disappointment |

## The 9 Centers (Defined vs Undefined matters)

| Center | Defined = your consistency | Undefined = where you absorb |
|---|---|---|
| Head | Fixed mental pressure | Amplifies others' questions |
| Ajna | Fixed conceptualization | Open to many ways of seeing |
| Throat | Manifestation power | Pressure to speak |
| G (identity) | Fixed sense of self/direction | Searches for love + direction |
| Heart/Ego | Willpower | Pushes to prove |
| Spleen | Intuition + immunity | Holds on past expiration |
| Sacral | Generator life-force | Doesn't know when "enough" |
| Solar Plexus | Emotional wave | Avoids confrontation |
| Root | Adrenaline pressure | Always feels rushed |

## How HD answers each of the 10 universal questions

### `work_energy_direction`
Anchor: Type × current life-arc. Generator with defined sacral = sustainable
energy (if responding correctly). Projector running pure energy = burnout
loop unless invitations land.

### `work_boldest_move_window`
Generators/MGs: respond to opportunity that elicits a sacral "uh-huh".
Projectors: wait for invitation (cite calendar months when invitation
ecosystems peak per their profile lines). Manifestors: act + inform.

### `money_flow_direction`
Defined Heart center = capacity to hold money. Undefined Heart = money flows
through (must be witnessed by the heart of others). State which one you are.

### `money_leak_or_windfall`
Undefined Solar Plexus + emotional pressure → leak through reactive spending.
Defined Sacral with response = windfall via aligned work.

### `love_energy_state`
G center + Solar Plexus tell the love story. Adjust per relationship_status.

### `love_timing_windows`
For Emotional Authority types: wait through the wave (3-7 day cycle). For
non-emotional: match decisions to bodily signals.

### `health_weak_point`
Undefined centers = where conditioning lives. Undefined Spleen → immune
fragility from holding on. Undefined Solar Plexus → digestive/anxiety patterns.

### `people_who_changes_you`
Profile lines (1=foundation, 2=natural genius, 3=trial-and-error, 4=network,
5=outsider-fixer, 6=role-model). The complementary line in another's chart =
the one who shifts you. E.g. a 5/1 attracts a 1/3.

### `warning_high_risk_window`
Months when emotional waves peak (for Emotional Authority types). Or when
multiple undefined centers light up simultaneously (energetic overload).

### `warning_specific`
Map by Not-self:
- Generator/MG → "อย่าเริ่มจาก initiation; รอ respond"
- Projector → "อย่ายัดเยียดคำแนะนำ — รอ invitation"
- Manifestor → "อย่าทำเงียบ — inform before acting"

---

## Pricing & access · Cost & timing
Same as base.

## Risks

HD chart computation depends on accurate birth time (the design crystal is
calculated ~88° before birth). Without time, profile / authority / type may
shift. Flag if engine reports `humandesign.time_unknown`.
