import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "sessions" })
export class SessionEntity {
  @PrimaryColumn({ type: "varchar" })
  token!: string;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar" })
  createdAt!: string;
}
