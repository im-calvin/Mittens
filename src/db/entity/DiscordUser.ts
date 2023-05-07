import { Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "discord_users" })
export class DiscordUser {
  constructor(id: string) {
    this.id = id
  }
  // the discord user id of a particular user
  @PrimaryColumn()
  id: string;
}
