import { Entity, Column, PrimaryColumn, ManyToMany } from "typeorm";
import { Streamer } from "./Streamer.js";
import { Video } from "./Video.js";

@Entity()
export class DiscordUser {
  constructor(user_id: string, channel_id: string, streamer_ids: string[]) {
    this.user_id = user_id;
    this.channel_id = channel_id;
    this.streamer_ids = streamer_ids;
  }
  // the discord user id of a particular user
  @ManyToMany((type) => Streamer, (Streamer) => Streamer.id)
  @PrimaryColumn()
  user_id: string;

  // the discor d channel id to send the message in
  @Column()
  @PrimaryColumn()
  channel_id: string;

  @ManyToMany((type) => Video, (Video) => Video.members)
  @Column("simple-array")
  streamer_ids: string[];
}
