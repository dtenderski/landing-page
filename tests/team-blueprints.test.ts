import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TIER_TEAM_PLANS,
  totalMembers,
  formatTierTeamPlan,
  formatTeamPlansForPrompt,
  parseTierNumber,
  tierPlanToTimAgen,
  type TierNumber,
} from "../shared/team-blueprints";

test("all 4 tiers present with matching tier numbers", () => {
  for (const t of [1, 2, 3, 4] as TierNumber[]) {
    assert.ok(TIER_TEAM_PLANS[t], `tier ${t} missing`);
    assert.equal(TIER_TEAM_PLANS[t].tier, t);
    assert.ok(TIER_TEAM_PLANS[t].teams.length >= 1, `tier ${t} has no team`);
  }
});

test("tiers 1-3 are single-team; tier 4 is multi-department with a lead", () => {
  assert.equal(TIER_TEAM_PLANS[1].teams.length, 1);
  assert.equal(TIER_TEAM_PLANS[2].teams.length, 1);
  assert.equal(TIER_TEAM_PLANS[3].teams.length, 1);
  assert.ok(TIER_TEAM_PLANS[4].teams.length >= 2, "tier 4 should be multi-team");
  assert.ok(TIER_TEAM_PLANS[4].lead, "tier 4 should have a coordinating lead");
});

test("every team has exactly one orchestrator", () => {
  for (const t of [1, 2, 3, 4] as TierNumber[]) {
    for (const team of TIER_TEAM_PLANS[t].teams) {
      const orchestrators = team.members.filter((m) => m.role === "orchestrator");
      assert.equal(orchestrators.length, 1, `tier ${t} team "${team.name}" must have one orchestrator`);
    }
  }
});

test("totalMembers counts team members plus the lead", () => {
  for (const t of [1, 2, 3, 4] as TierNumber[]) {
    const plan = TIER_TEAM_PLANS[t];
    const expected = plan.teams.reduce((n, tm) => n + tm.members.length, 0) + (plan.lead ? 1 : 0);
    assert.equal(totalMembers(plan), expected);
  }
});

test("gate strings never embed the ◆ marker (added at render time only)", () => {
  for (const t of [1, 2, 3, 4] as TierNumber[]) {
    const plan = TIER_TEAM_PLANS[t];
    const allMembers = [...plan.teams.flatMap((tm) => tm.members), ...(plan.lead ? [plan.lead] : [])];
    for (const m of allMembers) {
      for (const g of m.gates ?? []) {
        assert.ok(!g.includes("◆"), `gate for "${m.title}" should not embed ◆`);
      }
    }
  }
});

test("formatTierTeamPlan renders tier 4 team names and gates with ◆", () => {
  const txt = formatTierTeamPlan(TIER_TEAM_PLANS[4]);
  assert.match(txt, /Tim Marketing/);
  assert.match(txt, /Tim Administrasi/);
  assert.match(txt, /◆/);
});

test("formatTeamPlansForPrompt covers all four tier labels", () => {
  const txt = formatTeamPlansForPrompt();
  assert.match(txt, /Tier 1/);
  assert.match(txt, /Tier 2/);
  assert.match(txt, /Tier 3/);
  assert.match(txt, /Tier 4/);
});

test("parseTierNumber extracts 1-4 from free text, null otherwise", () => {
  assert.equal(parseTierNumber("Tier 2 — Chatbot Menengah (Rp 2.499.000)"), 2);
  assert.equal(parseTierNumber("tier4 enterprise"), 4);
  assert.equal(parseTierNumber("TIER 1"), 1);
  assert.equal(parseTierNumber("Paket Bisnis"), null);
  assert.equal(parseTierNumber("Tier 9"), null);
  assert.equal(parseTierNumber(undefined), null);
  assert.equal(parseTierNumber(""), null);
});

test("tierPlanToTimAgen mirrors the blueprint headcount for every tier", () => {
  for (const t of [1, 2, 3, 4] as TierNumber[]) {
    const rows = tierPlanToTimAgen(t);
    assert.equal(rows.length, totalMembers(TIER_TEAM_PLANS[t]), `tier ${t} headcount`);
    for (const r of rows) {
      assert.ok(r.peran && r.tugas && r.tim, "each row has tim/peran/tugas");
      assert.ok(!r.gerbang.includes("◆"), "gerbang carries no ◆ glyph");
    }
  }
});

test("tierPlanToTimAgen: tier 4 includes the coordinating lead + multiple teams", () => {
  const rows = tierPlanToTimAgen(4);
  assert.ok(rows.some((r) => r.tim === "Koordinasi Pusat"), "lead grouped under Koordinasi Pusat");
  const teams = new Set(rows.map((r) => r.tim));
  assert.ok(teams.size >= 3, "tier 4 spans multiple teams");
});

test("tierPlanToTimAgen: tier 1 is a single small team, gates default to '-'", () => {
  const rows = tierPlanToTimAgen(1);
  const teams = new Set(rows.map((r) => r.tim));
  assert.equal(teams.size, 1);
  assert.ok(rows.every((r) => r.gerbang === "-"), "tier 1 has no default gates");
});
