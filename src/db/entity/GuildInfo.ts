import { Entity, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm";

@Entity({ name: "guild_info" })
export class GuildInfo {
  constructor() {}

  // the name of the group
  @PrimaryColumn({ type: "text", name: "discord_guild_id" })
  discordGuildId: string;

  @PrimaryColumn({ type: "integer", name: "translate_status" })
  status: boolean;

  @PrimaryColumn({ type: "text", name: "cmd_prefix" })
  prefix: string;
}
