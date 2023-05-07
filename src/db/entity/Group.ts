import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "groups" })
export class Group {
  constructor(name: string) {
    this.name = name;
  }

  @PrimaryGeneratedColumn()
  id: number;

  // the name of the group
  @Column()
  name: string;
}
