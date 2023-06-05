import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Relation, JoinColumn } from "typeorm";
import { Streamer } from "./Streamer.js";

enum HololiveLanguage {
  HOLOSTARS_ENGLISH = "Holostars English",
  HOLOSTARS_JAPAN = "Holostars Japan",
  HOLOLIVE_ENGLISH = "Hololive English",
  HOLOLIVE_JAPAN = "Hololive Japan",
  HOLOLIVE_INDONESIA = "Hololive Indonesia",
}

@Entity({ name: "languages" })
export class Language {
  constructor(name: HololiveLanguage) {
    this.name = name;
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  // the name of the group
  @Column("text")
  name: HololiveLanguage;

  @OneToMany(() => Streamer, (streamer) => streamer.language)
  streamers: Relation<Streamer[]>;
}
