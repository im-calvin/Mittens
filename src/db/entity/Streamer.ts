import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToMany,
  ManyToOne,
} from "typeorm";
import { Video } from "./Video.js";
import { DiscordUser } from "./DiscordUser.js";

@Entity()
export class Streamer {
  constructor(id: string, name: string, group: string) {
    this.id = id;
    this.name = name;
    this.group = group;
  }
  // the id of the streamer (YouTube id)
  @ManyToMany((type) => DiscordUser, (DiscordUser) => DiscordUser.user_id)
  @ManyToMany((type) => Video, (Video) => Video.members)
  @PrimaryColumn()
  id: string;

  // the name of the streamer ("Ceres Fauna")
  @Column()
  name: string;

  // the group that the streamer belongs to. Accessible via a lookup table (Hololive)
  @Column()
  group: string;
}
