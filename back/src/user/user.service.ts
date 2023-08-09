import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { FindOperator, Repository } from 'typeorm';
import { format } from 'date-fns';
import { UserStatus } from 'src/model/interfaces';
import { Friends } from './entities/friends.entity';
import { CreateFriendsDto } from './dto/createFriendsDto';
import { BlockerBlocked } from './entities/blockerBlocked.entity';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Friends) private readonly friendsRepo: Repository<Friends>,
        @InjectRepository(BlockerBlocked) private readonly blockerBlockedRepository: Repository<BlockerBlocked>,
    ) { }

    //transform string to a string base64 - use in the class only
    getAvatarBase64(user: User): string {
        try {
              const avatarPath = path.join(__dirname, '../../../src/avatars', user.avatar);
              const avatarBuffer = fs.readFileSync(avatarPath);
              const base64String = avatarBuffer.toString('base64');
              return base64String;
          } catch (error) {
            return null; 
          }
    }

    /////////
    // GET //
    /////////

    async findById(id: number) {
        return await this.userRepo.findOne({ where: { id: id } });
    }

    async findByName(name: string) {
        return await this.userRepo.findOne({ where: { name: name } });
    }

    async findBySocket(socket: string) {
        return await this.userRepo.findOne({ where: { socketChat: socket } })
    }

    async findByLogin(userLogin: string) {
        return await this.userRepo.findOne({ where: { login: userLogin } })
    }

    async getInfoUserProfil(user: User) {
        const matchs = await this.userRepo.createQueryBuilder('user')
            .leftJoinAndSelect('user.matchHistory', 'matchHistory')
            .innerJoinAndSelect('matchHistory.userRight', 'userRight')
            .where('user.id = :id', { id: user.id })
            .getOne()

        const matchHistoryWithAvatarBase64 = matchs?.matchHistory.map((match) => ({
            ...match,
            userRight: {
                ...match.userRight,
                avatar: this.getAvatarBase64(match.userRight),
            },
        }));

        const data = {
            name: user.name,
            status: user.status,
            date: format(user.createdAt, 'yyyy-MM-dd'),
            avatar: this.getAvatarBase64(user),
            twoFA: user.twoFA,
            matchHistory: matchHistoryWithAvatarBase64 || null,
        }
        return data;
    }

    //get a list of users without us, containing their name + status + avatar
    async getAllOtherUserNames(user: User) {
        const users = await this.userRepo.find();
        const userNames = users
            .filter((u) => u.id !== user.id)
            .map((u) => [u.name, u.status, this.getAvatarBase64(user)]);
        return userNames;
    }

    //get a array of friend's name - use in the class only
    private async getNameUserFriends(user: User) {
        const userRelation = await this.friendsRepo.findOne({ relations: ['user'], where: { user: { id: user.id } } });
        if (userRelation && userRelation.friends)
            return userRelation.friends;
        else
            return null;
    }

    //get a list of users without your friends, containing their name + status + avatar
    async getAllOtherUserNamesWithoutFriends(user: User) {
        const users = await this.userRepo.find();
        const tabFriends = await this.getNameUserFriends(user);
        let otherUserNames;
        if (tabFriends) {
            otherUserNames = users
                .filter((u) => u.id !== user.id && !tabFriends.includes(u.id))
                .map((u) => [u.name, u.status, this.getAvatarBase64(u)]);
        }
        else {
            otherUserNames = users
                .filter((u) => u.id !== user.id)
                .map((u) => [u.name, u.status, this.getAvatarBase64(u)]);
        }
        return otherUserNames;
    }

    //get a list of your friends, containing their name + status + avatar
    async getDataFriends(user: User) {
        const tabNameFriends = await this.getNameUserFriends(user);
        if (tabNameFriends) {
            const friends = [];
            for (const friend of tabNameFriends) {
                const user = await this.findById(friend);
                friends.push([user.name, user.status, this.getAvatarBase64(user)]);
            }
            return friends;
        }
        else {
            return null;
        }
    }

    async getBlockedUserNames(user: User): Promise<string[]> {
        const blockedByUsers = await this.blockerBlockedRepository.find({
            where: { blocker: { id: user.id } },
            relations: ['blocked'],
        });
        const blockedUserNames = blockedByUsers
            .map((blockerBlocked) => blockerBlocked.blocked.name);
        return blockedUserNames;
    }


    //////////
    // POST //
    //////////

    //add a friend to entity's user
    async addFriends(userCurrent: User, userFriendToAdd: User) {
        try {
            const friendsEntityUserCurrent = await this.friendsRepo.findOne({ relations: ['user'], where: { user: { id: userCurrent.id } } });
            if (friendsEntityUserCurrent) {
                friendsEntityUserCurrent.friends.push(userFriendToAdd.id);
                await this.friendsRepo.save(friendsEntityUserCurrent);
            }
            else {
                const data: CreateFriendsDto = {
                    friends: [userFriendToAdd.id],
                }
                const create = await this.friendsRepo.create(data)
                create.user = userCurrent;
                await this.friendsRepo.save(create);
            }

            const friendsEntityFriendToAdd = await this.friendsRepo.findOne({ relations: ['user'], where: { user: { id: userFriendToAdd.id } } });
            if (friendsEntityFriendToAdd) {
                friendsEntityFriendToAdd.friends.push(userCurrent.id);
                await this.friendsRepo.save(friendsEntityFriendToAdd);
            }
            else {
                const data: CreateFriendsDto = {
                    friends: [userCurrent.id],
                }
                const create = await this.friendsRepo.create(data)
                create.user = userFriendToAdd;
                await this.friendsRepo.save(create);
            }
        } catch (error) {
            throw error;
        }
    }

    /////////
    // PUT //
    /////////

    async updateLogout(user: User) {
        user.status = UserStatus.Offline;
        return await this.userRepo.update(user.id, { status: user.status });
    }

    async uploadAvatar(user: User, avatar: Express.Multer.File) {
        const avatarFileName = `${Date.now()}.${avatar.originalname.split('.').pop()}`;
        const avatarDirectory = path.join(__dirname, '../../../src/avatars/');
        const avatarPath = path.join(avatarDirectory, avatarFileName);
        fs.writeFileSync(avatarPath, avatar.buffer);

        await sharp(avatar.buffer).toFile(avatarPath);

        if (user.avatar !== 'avatar.png') {
            fs.unlink(avatarDirectory + user.avatar, (err) => {
                if (err) {
                    console.log('error avatar', err);
                }
            });
        }
        user.avatar = avatarFileName;
        return await this.userRepo.save(user);
    }

    async updateUser(user: User, nameToChange: string, twoFAToChange: boolean) {
        const wrongUser = await this.findByName(nameToChange);
        if (wrongUser) {
            return 'This nickname already exists';
        }
        if (nameToChange === '' && twoFAToChange === user.twoFA) {
            return 'You must fill at least one field';
        }
        if (nameToChange !== '') {
            await this.userRepo
                .createQueryBuilder()
                .update(User)
                .set({ name: nameToChange })
                .where("id = :id", { id: user.id })
                .execute();
            user.name = nameToChange
            await this.userRepo.save(user);

        }
        if (twoFAToChange !== user.twoFA) {
            user.twoFA = twoFAToChange;
            await this.userRepo.save(user);
        }
        return [user.name, user.twoFA, 'Information(s) registered'];
    }

    ////////////
    // DELETE //
    ////////////

    async deleteFriend(userCurrent: User, userFriendToRemove: User) {
        try {
            const friendsEntityuserCurrent = await this.friendsRepo.findOne({ relations: ['user'], where: { user: { id: userCurrent.id } } });
            friendsEntityuserCurrent.friends = friendsEntityuserCurrent.friends.filter(friendId => friendId !== userFriendToRemove.id)
            await this.friendsRepo.save(friendsEntityuserCurrent);

            const friendsEntityuserFriendToRemove = await this.friendsRepo.findOne({ relations: ['user'], where: { user: { id: userFriendToRemove.id } } });
            friendsEntityuserFriendToRemove.friends = friendsEntityuserFriendToRemove.friends.filter(friendId => friendId !== userCurrent.id)
            await this.friendsRepo.save(friendsEntityuserFriendToRemove);
        }
        catch (error) {
            throw error;
        }
    }

    ///////////
    // OTHER //
    ///////////

    async createBlockerBlocked(blocker: User, blocked: User) {
        const blockerBlocked = await this.blockerBlockedRepository.create();
        blockerBlocked.blocker = blocker;
        blockerBlocked.blocked = blocked;
        return await this.blockerBlockedRepository.save(blockerBlocked);
    }

    async findBlockerBlocked(blocker: User, blocked: User) {
        const blockerBlocked = await this.blockerBlockedRepository.findOne({
            where: {
                blocker: { id: new FindOperator('equal', blocker.id) },
                blocked: { id: new FindOperator('equal', blocked.id) },
            },
        });
        return blockerBlocked;
    }

    async removeBlockerBlocked(blockerBlocked: BlockerBlocked) {
        return await this.blockerBlockedRepository.remove(blockerBlocked);
    }
}
