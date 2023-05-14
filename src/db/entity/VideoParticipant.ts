import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Streamer } from "./Streamer.js";
import { Video } from "./Video.js";

@Entity({ name: "video_participants" })
export class VideoParticipant {
  constructor(video: Relation<Video>, participantStreamer: Relation<Streamer>) {
    this.video = video;
    this.participantStreamer = participantStreamer;
  }
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => Video, (video) => video.id)
  @JoinColumn({ name: "video_id", referencedColumnName: "id" })
  video: Relation<Video>;

  // the streamer that is part of the video
  @ManyToOne(() => Streamer, (streamer) => streamer.id)
  @JoinColumn({ name: "participant_streamer_id", referencedColumnName: "id" })
  participantStreamer: Relation<Streamer>;
}
