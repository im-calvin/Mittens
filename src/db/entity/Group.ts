import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Relation,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Streamer } from "./Streamer.js";
import { Language } from "./Language.js";

@Entity({ name: "groups" })
export class Group {
  constructor(name: string) {
    this.name = name;
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  // the name of the group
  @Column({ type: "text", unique: true })
  name: string;

  @OneToMany(() => Streamer, (streamer) => streamer.group)
  streamers: Relation<Streamer[]>;

  @ManyToOne(() => Language, (language) => language.id, { eager: true })
  @JoinColumn({ name: "language_id", referencedColumnName: "id" })
  language: Relation<Language>;
}
