const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  memberPayload,
  flatPayload,
  localDate,
  errorMessage,
} = require("../src/util/contracts.cjs");
test("member requests trim values, omit server fields and normalize empty email", () => {
  assert.deepEqual(
    memberPayload({
      fullName: " Asha Shah ",
      mobileNumber: " 9876543210 ",
      email: " ",
      status: "ACTIVE",
    }),
    { fullName: "Asha Shah", mobileNumber: "9876543210", email: null }
  );
});
test("flat requests use a numeric floor and omit server fields", () => {
  assert.deepEqual(
    flatPayload({ flatNumber: " 101 ", floorNumber: "1", flatId: "ignored" }),
    { flatNumber: "101", floorNumber: 1 }
  );
});
test("date inputs use local calendar dates", () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 5)), "2026-01-02");
});
test("network and session failures have actionable messages", () => {
  assert.match(errorMessage({}), /Cannot reach/);
  assert.match(errorMessage({ response: { status: 401 } }), /session/);
});
test("backend validation details are preserved", () => {
  assert.equal(
    errorMessage({
      response: {
        status: 400,
        data: {
          message: "Invalid input",
          details: { mobileNumber: "Invalid format" },
        },
      },
    }),
    "Invalid input mobileNumber: Invalid format"
  );
});
