import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Relation,
  JoinColumn,
} from "typeorm";
import { Streamer } from "./Streamer.js";

@Entity({ name: "groups" })
export class Group {
  constructor(name: string) {
    this.name = name;
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  // the name of the group
  @Column("text")
  name: string;

  @OneToMany(() => Streamer, (streamer) => streamer.group)
  streamers: Relation<Streamer[]>;
}
