import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, ManyToMany } from "typeorm";
import { Streamer } from "./Streamer.js";

@Entity()
export class Video {
  constructor(url: string, scheduleTime: Date, title: string, members: string[]) {
    this.url = url;
    this.scheduledTime = scheduleTime;
    this.title = title;
    this.members = members;
  }
  // the url of the video
  @PrimaryColumn()
  url: string;

  // the time that the video is scheduled to start
  @Column("date")
  scheduledTime: Date;

  // the title of the video
  @Column("text")
  title: string;

  // the members that are in the video
  @ManyToMany((type) => Streamer, (Streamer) => Streamer.id)
  @Column("simple-array")
  members: string[]; // JSONified array
}
