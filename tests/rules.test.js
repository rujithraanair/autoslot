import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import fs from "fs";

const testEnv = await initializeTestEnvironment({
  projectId: "autoslot-test",
  firestore: {
    rules: fs.readFileSync("firestore.rules", "utf8"),
    host: "127.0.0.1",
    port: 8080
  }
});

const db = testEnv.unauthenticatedContext().firestore();

const futureTime = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
const pastTime = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

const validPayload = {
  bookingRef: "#AS-4021",
  idempotencyKey: "uuid-1",
  status: "Booked",
  dateKey: "2026-11-20",
  slotId24: "10-30",
  time: "10:30 AM",
  end: "11:30 AM",
  slotTimestamp: futureTime,
  name: "Ali Bin Ahmad",
  phone: "012-3456789",
  plate: "JQV 8899",
  model: "Perodua Myvi",
  service: "Exhaust Repair",
  notes: ""
};

// Test 1: Valid future booking succeeds
await assertSucceeds(setDoc(doc(db, "bookings", "2026-11-20_10-30"), validPayload));
console.log("PASS: Valid booking saved.");

// Test 2: Simultaneous / out-of-date page trying to book the same slot fails
await assertFails(setDoc(doc(db, "bookings", "2026-11-20_10-30"), {
  ...validPayload,
  bookingRef: "#AS-9999",
  idempotencyKey: "uuid-2",
  name: "Second User"
}));
console.log("PASS: Duplicate / out-of-date slot request rejected.");

// Test 3: Slot in the past fails
await assertFails(setDoc(doc(db, "bookings", "2026-11-15_10-30"), {
  ...validPayload,
  dateKey: "2026-11-15",
  slotTimestamp: pastTime
}));
console.log("PASS: Past slot rejected.");

await testEnv.cleanup();