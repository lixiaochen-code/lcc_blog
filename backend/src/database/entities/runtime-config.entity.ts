import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "runtime_configs" })
export class RuntimeConfigEntity {
  @PrimaryColumn({ type: "int" })
  id!: number;

  @Column({ type: "text" })
  configJson!: string;

  @Column({ type: "varchar" })
  updatedAt!: string;
}
