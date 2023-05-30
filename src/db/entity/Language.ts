import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Relation, JoinColumn } from "typeorm";
import { Streamer } from "./Streamer.js";

@Entity({ name: "languages" })
export class Language {
  constructor(name: string) {
    this.name = name;
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  // the name of the group
  @Column("text")
  name: string;

  @OneToMany(() => Streamer, (streamer) => streamer.language)
  streamers: Relation<Streamer[]>;
}
