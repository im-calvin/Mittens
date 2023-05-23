import Sentry from "@sentry/node";
import { Streamer } from "./db/entity/Streamer.js";
import { AppDataSource } from "./db/data-source.js";
import { Group } from "./db/entity/Group.js";

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
  if (groups === undefined) {
    throw new Error("Group table is empty");
  }

  transaction.finish();
  return groups;
}
