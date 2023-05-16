import { v3 } from "@google-cloud/translate";
import { readEnv } from "../utils/env.js";
import { Message } from "discord.js";
import Sentry from "@sentry/node";
import { targetConfidence, targetLanguage } from "../constants.js";

const translationClient = new v3.TranslationServiceClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!),
});
const parent = translationClient.locationPath(readEnv("GOOGLE_PROJECT_ID"), "global");

interface DetectedLanguage {
  confidence: boolean;
  language: string;
}

/**
 * Translates text using Google's Cloud Translate v3
 * @param text the text to translate
 * @returns the translated text in the target language
 */
async function translateText(text: string, language: string): Promise<string> {
  const transaction = Sentry.startTransaction({
    op: "translateText",
    name: "Translate text interaction",
  });
  const request = {
    targetLanguageCode: "en",
    contents: text.split("\n"),
    mimeType: "text/plain",
    parent,
  };

  const [{ translations }] = await translationClient.translateText(request);
  if (translations === null || translations === undefined) {
    throw new Error("No translation found");
  }
  const translatedText = translations.map((t) => t.translatedText).join("\n");
  transaction.finish();
  return translatedText;
}

/**
 * Detects the language of the text
 * @param text the text to translate
 * @returns true if the text is detected as the target language
 */
async function detectLanguage(text: string): Promise<DetectedLanguage> {
  const transaction = Sentry.startTransaction({
    op: "detectLanguage",
    name: "Detects the language of the text",
  });
  const request = { parent, content: text, mimeType: "text/plain" };

  const [{ languages }] = await translationClient.detectLanguage(request);

  if (languages === null || languages === undefined) {
    throw new Error("No detected language found");
  }

  const [language] = languages;

  if (
    language.confidence === null ||
    language.confidence === undefined ||
    language.languageCode === null ||
    language.languageCode === undefined
  )
    throw new Error("No detected language found");

  transaction.finish();
  return {
    confidence:
      language.confidence > targetConfidence &&
      targetLanguage.includes(language.languageCode),
    language: language.languageCode,
  };
}

/**
 * Handles the translation of a message
 * @param message the message object of the message
 */
export async function handleTranslate(message: Message) {
  const detectedLanguage = await detectLanguage(message.content);
  if (detectedLanguage.confidence) {
    const translatedText = await translateText(
      message.content,
      detectedLanguage.language
    );
    await message.channel.send(translatedText);
  }
}
