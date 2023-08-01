import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, Relation } from "typeorm";
import { Video } from "./Video.js";
import { Group } from "./Group.js";
import { DiscordUserSubscription } from "./DiscordUserSubscription.js";
import { VideoParticipant } from "./VideoParticipant.js";
import { Language } from "./Language.js";

@Entity({ name: "streamers" })
export class Streamer {
  constructor(id: string, name: string, group: Relation<Group>) {
    this.id = id;
    this.name = name;
    this.group = group;
  }

  // the yt-id of the streamer ("UCO_aKKYxn4tvrqPjcTzZ6EQ for Fauna")
  @PrimaryColumn("text")
  id: string;

  // the name of the streamer ("Ceres Fauna")
  @Column("text")
  name: string;

  // the group that the streamer belongs to ("Myth, Gamers...")
  @ManyToOne(() => Group, (group) => group.id, { eager: true })
  @JoinColumn({ name: "group_id", referencedColumnName: "id" })
  group: Relation<Group>;

  @OneToMany(() => Video, (video) => video.hostStreamer, { eager: true })
  videos: Relation<Video[]>;

  @OneToMany(() => DiscordUserSubscription, (subscription) => subscription.streamer, {
    eager: true,
  })
  subcriptions: Relation<DiscordUserSubscription[]>;

  @OneToMany(() => VideoParticipant, (participant) => participant.streamer)
  videoParticipant: Relation<VideoParticipant[]>;
}
