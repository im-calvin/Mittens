import { translateText } from "../src/translate/Translate.js";
import { expect, test, jest, describe } from "@jest/globals";

describe("Test translate", () => {
  test("おはよう - good morning", async () => {
    const translatedText = await translateText("おはよう", "en");
    expect(translatedText).toBe("good morning");
  });
});
