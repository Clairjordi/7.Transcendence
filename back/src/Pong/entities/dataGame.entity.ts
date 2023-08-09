import { Entity, Column, PrimaryGeneratedColumn, OneToOne} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity("dataGame")
export class DataGame {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  win: number;

  @Column({ default: 0 })
  loose: number;

  @Column('text', { array: true, default: '{}' })
  achievementImageUrls: string[]; 
 
  @Column( { default: 0 })
  level: number;

  //Relation
  @OneToOne(() => User, (user) => user.dataGame)
  user: User;
}