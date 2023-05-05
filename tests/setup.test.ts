import {scheduleJob} from "src/utils/schedule.js";
import Setup from "src/db/setup.js";
import { describe, test } from "node:test";

Setup();

describe("Schedule smoke test", () => {
  test("schedule job", () => {});
});
