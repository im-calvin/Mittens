import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  Relation,
  Index,
} from "typeorm";
import { DiscordUser } from "./DiscordUser.js";
import { Streamer } from "./Streamer.js";

@Entity({ name: "discord_user_subscriptions" })
@Index(["discordUser", "discordChannelId", "streamer"], { unique: true })
export class DiscordUserSubscription {
  constructor(
    discordUser: Relation<DiscordUser>,
    discordChannelId: string,
    streamer: Relation<Streamer>
  ) {
    this.discordUser = discordUser;
    this.discordChannelId = discordChannelId;
    this.streamer = streamer;
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => DiscordUser, (discordUser) => discordUser.id, { eager: true })
  @JoinColumn({ name: "discord_user_id", referencedColumnName: "id" })
  discordUser: Relation<DiscordUser>;

  @Column({ name: "discord_channel_id" })
  discordChannelId: string;

  @ManyToOne(() => Streamer, (streamer) => streamer.id)
  @JoinColumn({ name: "streamer_id", referencedColumnName: "id" })
  streamer: Relation<Streamer>;
}
