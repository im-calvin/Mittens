import { AppDataSource } from "./data-source.js";
import { createConnection } from "typeorm";
import { Video } from "./entity/Video.js";
import { Streamer } from "./entity/Streamer.js";
import { Group } from "./entity/Group.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import Sentry from "@sentry/node";
import { init } from "../init.js";
import { DiscordUserSubscription } from "./entity/DiscordUserSubscription.js";

export default async function Setup(): Promise<void> {
  init();
  const boot = Sentry.startTransaction({
    op: "serverSetup",
    name: "Setting up the server",
  });

  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  console.log("Setting up the server");

  const hobbuzu = new DiscordUser("182310565333565440");
  const hororaibuEN = new Group("ホロライブEN");
  const fauna = new Streamer("UCO_aKKYxn4tvrqPjcTzZ6EQ", "Ceres Fauna", hororaibuEN);
  const video = new Video("テスト中", new Date(), "テストだけです", fauna);
  const discordUserSub = new DiscordUserSubscription(
    hobbuzu,
    "445609667431759874",
    fauna
  );

  await AppDataSource.transaction(async (em) => {
    await em.save(hobbuzu);
    await em.save(hororaibuEN);
    await em.save(fauna);
    await em.save(video);
    await em.save(discordUserSub);
  });

  const maybeFauna = await AppDataSource.manager.findOneBy(Streamer, {
    id: "UCO_aKKYxn4tvrqPjcTzZ6EQ",
  });
  console.log(maybeFauna);

  // for (let profile of profiles) {
  //   const user = new DiscordUser(
  //     profile.user_id,
  //     profile.channel_id,
  //     profile.streamer_id
  //   );
  //   await AppDataSource.manager.save(user);
  // }

  // for (let member of members) {
  //   const streamer = new Streamer(member.id, member.name, member.group);
  //   await AppDataSource.getRepository(Streamer).save(streamer); 
  // }

  console.log("Finished loading the server");

  boot.finish();
}

Setup();
