import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Streamer } from "./Streamer.js";
import { DiscordUser } from "./DiscordUser.js";

@Entity({ name: "videos" })
export class Video {
  constructor(id: string, scheduledTime: Date, title: string, streamer: Streamer) {
    this.id = id;
    this.scheduledTime = scheduledTime;
    this.title = title;
    this.streamer = streamer;
  }
  // the url of the video
  @PrimaryColumn()
  id: string;

  // the time that the video is scheduled to start
  @Column({
    type: "date",
    name: "scheduled_time",
  })
  scheduledTime: Date;

  // the title of the video
  @Column("text")
  title: string;

  // the streamer that is part of the video
  @ManyToOne(() => Streamer, (streamer) => streamer.id)
  @JoinColumn({ name: "streamer_id" })
  streamer: Streamer;

  // // the members that are in the video
  // @OneToMany((type) => Streamer, (Streamer) => Streamer.id)
  // @ManyToMany((type) => DiscordUser, (DiscordUser) => DiscordUser.streamer_ids)
  // @Column("simple-array")
  // members: string[];

  // // the owner of the video (yt-id)
  // @Column()
  // owner: string;
}
