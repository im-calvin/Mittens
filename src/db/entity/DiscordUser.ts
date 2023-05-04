import { Entity, Column, PrimaryColumn, ManyToMany } from "typeorm";
import { Streamer } from "./Streamer.js";

@Entity()
export class DiscordUser {
  constructor(user_id: string, channel_id: string) {
    this.user_id = user_id;
    this.channel_id = channel_id;
  }
  // the discord user id of a particular user
  @ManyToMany((type) => Streamer, (Streamer) => Streamer.id)
  @PrimaryColumn()
  user_id: string;

  // the discord channel id to send the message in
  @Column("simple-array")
  @PrimaryColumn()
  channel_id: string; // JSONified array
}
