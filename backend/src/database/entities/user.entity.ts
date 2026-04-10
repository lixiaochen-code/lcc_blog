import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", default: "admin" })
  role!: "super_admin" | "admin";

  @Column({ type: "varchar", default: "active" })
  status!: "active" | "suspended";

  @Column({ type: "text", default: "[]" })
  permissionsJson!: string;

  @Column({ type: "int", default: 20 })
  dailyRequests!: number;

  @Column({ type: "int", default: 200000 })
  monthlyTokens!: number;

  @Column({ type: "varchar", default: "super_admin" })
  approvedBy!: string;

  @Column({ type: "varchar" })
  createdAt!: string;

  @Column({ type: "varchar" })
  updatedAt!: string;
}
