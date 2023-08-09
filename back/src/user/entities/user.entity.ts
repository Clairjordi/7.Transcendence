import { Message } from "src/Chat/entities/message.entity";
import { UserChannel } from "src/Chat/entities/userChannel.entity";
import { DataGame } from "src/Pong/entities/dataGame.entity";
import { UserStatus } from "src/model/interfaces";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Friends } from "./friends.entity";
import { MatchHistory } from "src/Pong/entities/matchHistory.entity";
import { BlockerBlocked } from "./blockerBlocked.entity";

@Entity("users")
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    avatar: string;

    @Column({ unique: true, nullable: true })
    name: string;

    @Column({ nullable: true, default: false })
    twoFA: boolean;

    @Column({ unique: true, nullable: true })
    secretKey: string;

    @Column({ unique: true })
    login: string;

    @Column({ default: UserStatus.Online })
    status: UserStatus;

    @Column({ unique: true, nullable: true })
    publicKey: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    socketChat: string;

    @OneToMany(() => Message, (message) => message.user)
    messages: Message[];

    @OneToMany(() => UserChannel, (userChannel) => userChannel.user)
    userChannel: UserChannel[];

    // Relation ManyToMany avec l'entité BlockerBlocked pour les bloqueurs
    @OneToMany(() => BlockerBlocked, (blockerBlocked) => blockerBlocked.blocker)
    blockedByUsers: BlockerBlocked[];

    // Relation ManyToMany avec l'entité BlockerBlocked pour les utilisateurs bloqués
    @OneToMany(() => BlockerBlocked, (blockerBlocked) => blockerBlocked.blocked)
    blockedUsers: BlockerBlocked[];

    @OneToOne(() => Friends, friends => friends.user, { cascade: true })
    @JoinColumn()
    friends: Friends;

    @OneToOne(() => DataGame, dataGame => dataGame.user, { cascade: true })
    @JoinColumn()
    dataGame: DataGame;

    @OneToMany(() => MatchHistory, (matchHistory) => matchHistory.userLeft || matchHistory.userRight)
    matchHistory: MatchHistory[];
}
