import { Entity, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity({ name: "guild_translate_statuses" })
export class GuildTranslate {
  constructor() {}

  // the name of the group
  @PrimaryColumn({ type: "text", name: "discord_guild_id" })
  discordGuildId: string;

  @PrimaryColumn({ type: "integer", name: "status" })
  status: boolean;
}
