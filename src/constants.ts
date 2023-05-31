import Sentry from "@sentry/node";
import { Streamer } from "./db/entity/Streamer.js";
import { AppDataSource } from "./db/data-source.js";
import { Group } from "./db/entity/Group.js";
import { Language } from "./db/entity/Language.js";

export const targetConfidence = 0.7; // the confidence to be greater than to translate the message [0, 1]
export const targetLanguage = ["ja"]; // possible languages to translate from (ISO 691)

export const intervalTime = 5; // the interval for scraping

export async function getDBStreamers(): Promise<Streamer[]> {
  const transaction = Sentry.startTransaction({
    op: "getDBStreamers",
    name: "Gets all of the streamers in the database",
  });
  const streamers = await AppDataSource.getRepository(Streamer).find();
  if (streamers === undefined) {
    throw new Error("Streamer table is empty");
  }

  transaction.finish();
  return streamers;
}

export async function getGroups(): Promise<Group[]> {
  const transaction = Sentry.startTransaction({
    op: "getGroups",
    name: "Gets all of the groups in the database",
  });
  const groups = await AppDataSource.getRepository(Group).find();

  transaction.finish();
  return groups;
}

export async function getStreamersByLanguage(language: Language): Promise<Streamer[]> {
  const transaction = Sentry.startTransaction({
    op: "getLanguages",
    name: "Get all of the streamers related to a language in the database",
  });

  const streamers = await AppDataSource.getRepository(Streamer)
    .createQueryBuilder("streamers")
    .leftJoinAndSelect("streamers.language", "language")
    .where("streamers.language_id = :id", { id: language.id })
    .getMany();

  transaction.finish();
  return streamers;
}

export async function getLanguages(): Promise<Language[]> {
  const transaction = Sentry.startTransaction({
    op: "getLanguages",
    name: "Get all of the streamers related to a language in the database",
  });

  const languages = await AppDataSource.getRepository(Language).find();

  transaction.finish();
  return languages;
}
