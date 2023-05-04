import { AppDataSource } from "./data-source.js";
import { Video } from "./entity/Video.js";
import { Streamer } from "./entity/Streamer.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import Sentry from "@sentry/node";
import members from "../../members.json" assert { type: "json" };
import { init } from "../init.js";

export default async function Setup(): Promise<void> {
  init();
  const boot = Sentry.startTransaction({
    op: "serverSetup",
    name: "Setting up the server",
  });

  await AppDataSource.initialize();

  console.log("Setting up the server");

  for (let member of members) {
    const streamer = new Streamer(member.id, member.name, member.group);
    await AppDataSource.manager.save(streamer);
  }

  console.log("Finished loading the server");

  boot.finish();
}

Setup();
