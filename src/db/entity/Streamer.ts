import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Video } from "./Video.js";
import { DiscordUser } from "./DiscordUser.js";
import { Group } from "./Group.js";

@Entity({ name: "streamers" })
export class Streamer {
  constructor(id: string, name: string, group: Group) {
    this.id = id;
    this.name = name;
    this.group = group;
  }

  // the yt-id of the streamer ("UCO_aKKYxn4tvrqPjcTzZ6EQ for Fauna")
  @PrimaryColumn()
  id: string;

  // the name of the streamer ("Ceres Fauna")
  @Column()
  name: string;

  // the group that the streamer belongs to ("Myth, Gamers...")
  @ManyToOne(() => Group, (group) => group.id)
  @JoinColumn({ name: "group_id" })
  group: Group;
}
