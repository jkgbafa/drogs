import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  applyAction,
  visibleState,
  parseRoster,
  validateProfile,
  STORAGE_KEY,
} from "../../src/registration/model.mjs";
const bishop = { id: "b1", email: "bishop@example.com" },
  other = { id: "b2", email: "other@example.com" },
  pastor = { id: "p1", email: "john@example.com" },
  office = { id: "office", email: "office@example.com", office: true };
const profile = (actor, role = "pastor", name = "John Doe") => ({
  role,
  name,
  email: actor.email,
  phone: "+233201234567",
  dob: "1990-02-01",
  church: "Grace",
  organization: "First Love",
  photo: `${actor.id}/portrait/image.jpg`,
  bishopId: "B1",
});
function setup() {
  let s = emptyState();
  s = applyAction(s, bishop, "submit", profile(bishop, "bishop", "A Bishop"));
  s = applyAction(s, office, "approveBishop", {
    userId: bishop.id,
    referenceId: "B1",
  });
  return s;
}
test("fresh registration has a separate storage key and zero counts", () => {
  assert.notEqual(STORAGE_KEY, "drogs-2027");
  assert.equal(emptyState().registrations.length, 0);
  assert.equal(emptyState().profiles.length, 0);
});
test("bishop cannot self-approve or add a list while pending", () => {
  let s = applyAction(
    emptyState(),
    bishop,
    "submit",
    profile(bishop, "bishop"),
  );
  assert.throws(
    () => applyAction(s, bishop, "approveBishop", { userId: "b1" }),
    /Office/,
  );
  assert.throws(
    () =>
      applyAction(s, bishop, "addRoster", {
        rows: [{ name: "John", email: "john@example.com" }],
      }),
    /approved/,
  );
});
test("unmatched pastor is Unclaimed and cannot pay, linked pastor can", () => {
  let s = setup();
  s = applyAction(s, pastor, "submit", profile(pastor));
  assert.equal(s.registrations.at(-1).status, "unclaimed");
  assert.throws(
    () =>
      applyAction(s, pastor, "payment", { proof: "a", nonrefundable: true }),
    /unlocks/,
  );
  s = applyAction(s, bishop, "addRoster", {
    rows: [{ name: "John Doe", email: pastor.email }],
  });
  assert.equal(s.registrations.at(-1).status, "confirmed");
  assert.equal(s.registrations.at(-1).amount, 50);
  s = applyAction(s, pastor, "payment", {
    proof: "p1/receipt/a.jpg",
    nonrefundable: true,
  });
  assert.equal(s.registrations.at(-1).payment, "pending");
  assert.throws(
    () => applyAction(s, pastor, "reviewPayment", { result: "verified" }),
    /Office/,
  );
  s = applyAction(s, office, "reviewPayment", {
    userId: "p1",
    result: "verified",
  });
  assert.equal(s.registrations.at(-1).payment, "verified");
});
test("name-only and fuzzy-name matches require explicit confirmation", () => {
  let s = setup();
  s = applyAction(s, bishop, "addRoster", {
    rows: [{ name: "Jon Doe", email: pastor.email }],
  });
  s = applyAction(s, pastor, "submit", profile(pastor));
  assert.equal(s.registrations.at(-1).status, "unclaimed");
  assert.throws(
    () => applyAction(s, other, "claim", { userId: "p1" }),
    /selected bishop/,
  );
  s = applyAction(s, bishop, "claim", {
    userId: "p1",
    rosterId: s.rosters[0].id,
  });
  assert.equal(s.registrations.at(-1).status, "confirmed");
  assert.equal(s.rosters.length, 1);
  assert.throws(
    () => applyAction(s, bishop, "claim", { userId: "p1" }),
    /no longer/,
  );
});
test("duplicate-contact ambiguous candidates are not auto matched", () => {
  let s = setup();
  s = applyAction(s, bishop, "addRoster", {
    rows: [
      { name: "John Doe", email: pastor.email },
      { name: "John Doe", phone: "+233201234567" },
    ],
  });
  s = applyAction(s, pastor, "submit", profile(pastor));
  assert.equal(s.registrations.at(-1).status, "unclaimed");
});
test("removal preserves payment and next cycle has fresh counts and no copied payment", () => {
  let s = setup();
  s = applyAction(s, bishop, "addRoster", {
    rows: [{ name: "John Doe", email: pastor.email }],
  });
  s = applyAction(s, pastor, "submit", profile(pastor));
  s = applyAction(s, pastor, "payment", {
    proof: "p1/receipt/a",
    nonrefundable: true,
  });
  s = applyAction(s, bishop, "removeRoster", {
    id: s.rosters[0].id,
    reason: "Dismissed",
  });
  assert.equal(s.registrations.at(-1).status, "removed");
  assert.equal(s.registrations.at(-1).payment, "pending");
  const old = structuredClone(s.registrations);
  s = applyAction(s, office, "openYear", { year: 2028 });
  assert.deepEqual(s.registrations, old);
  assert.equal(s.registrations.filter((r) => r.year === 2028).length, 0);
  s = applyAction(s, bishop, "carryRoster");
  assert.equal(s.rosters.filter((r) => r.year === 2028).length, 0);
  s = applyAction(s, pastor, "submit", profile(pastor));
  assert.equal(s.registrations.at(-1).payment, "unpaid");
  assert.equal(s.registrations.at(-1).status, "unclaimed");
});
test("wrong bishop list never matches, drafts and unrelated profiles remain private", () => {
  let s = setup();
  s = applyAction(s, other, "submit", profile(other, "bishop", "Other"));
  s = applyAction(s, office, "approveBishop", {
    userId: "b2",
    referenceId: "B2",
  });
  s = applyAction(s, bishop, "addRoster", {
    rows: [{ name: "John Doe", email: pastor.email }],
  });
  s = applyAction(s, pastor, "save", { ...profile(pastor), bishopId: "B2" });
  assert.equal(visibleState(s, other, []).registrations.length, 1);
  s = applyAction(s, pastor, "submit", { ...profile(pastor), bishopId: "B2" });
  assert.equal(s.registrations.at(-1).status, "unclaimed");
  assert.equal(visibleState(s, bishop, []).registrations.length, 1);
  assert.equal(visibleState(s, pastor, []).profiles.length, 1);
});
test("failed bulk import is atomic, duplicates and invalid birth dates rejected", () => {
  const s = setup();
  assert.throws(() =>
    applyAction(s, bishop, "addRoster", {
      rows: [{ name: "Valid", email: "v@example.com" }, { name: "Invalid" }],
    }),
  );
  assert.equal(s.rosters.length, 0);
  assert.throws(() =>
    validateProfile({ ...profile(pastor), dob: "1990-02-31" }, pastor.email),
  );
  assert.deepEqual(
    parseRoster('name,email,phone,church\n"Doe, John",john@example.com,,Grace'),
    [
      {
        name: "Doe, John",
        email: "john@example.com",
        phone: "",
        church: "Grace",
      },
    ],
  );
});
