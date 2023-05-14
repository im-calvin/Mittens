import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
  OneToMany,
} from "typeorm";
import { Streamer } from "./Streamer.js";
import { DiscordUser } from "./DiscordUser.js";

@Entity({ name: "videos" })
export class Video {
  constructor(
    id: string,
    scheduledTime: Date,
    title: string,
    hostStreamer: Relation<Streamer>
  ) {
    this.id = id;
    this.scheduledTime = scheduledTime;
    this.title = title;
    this.hostStreamer = hostStreamer;
  }
  // the url of the video
  @PrimaryColumn("varchar")
  id: string;

  // the time that the video is scheduled to start
  @Column({ type: "date", name: "scheduled_time" })
  scheduledTime: Date;

  // the title of the video
  @Column("text")
  title: string;

  // the streamer that is part of the video
  @ManyToOne(() => Streamer, (streamer) => streamer.videos)
  @JoinColumn({ name: "host_streamer_id", referencedColumnName: "id" })
  hostStreamer: Relation<Streamer>;

  @OneToMany(() => Streamer, (streamer) => streamer.id)
  participantStreamers: Relation<Streamer[]>;
}
