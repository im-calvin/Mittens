import { Entity, PrimaryColumn, OneToMany, Relation, JoinColumn } from "typeorm";
import { DiscordUserSubscription } from "./DiscordUserSubscription.js";

@Entity({ name: "discord_users" })
export class DiscordUser {
  constructor(id: string) {
    this.id = id;
  }
  // the discord user id of a particular user
  @PrimaryColumn("text")
  id: string;

  @OneToMany(() => DiscordUserSubscription, (subscription) => subscription.discordUser)
  subscriptions: Relation<DiscordUserSubscription[]>;
}
