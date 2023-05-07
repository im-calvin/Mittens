import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm";
import { DiscordUser } from "./DiscordUser.js";
import {Streamer} from "./Streamer.js";

@Entity({ name: "discord_user_subscriptions" })
export class DiscordUserSubscription {
  constructor(discordUser: DiscordUser, discordChannelId: string, streamer: Streamer) {
    this.discordUser = discordUser;
    this.discordChannelId = discordChannelId;
    this.streamer = streamer;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DiscordUser, (discordUser) => discordUser.id)
  @JoinColumn({ name: "discord_user_id" })
  discordUser: DiscordUser;

  @Column({ name: "discord_channel_id" })
  discordChannelId: string;

  @ManyToOne(() => Streamer, (streamer) => streamer.id)
  @JoinColumn({ name: "streamer_id" })
  streamer: Streamer;
}
