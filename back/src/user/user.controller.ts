import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    /////////
    // GET //
    /////////

    @Get('/:name')
    async findOne(@Param('name') name: string) {
        if (!isNaN(+name)) {
            let id = +name;
            return await this.userService.findById(id);
        }
        else {
            return await this.userService.findByName(name);
        }
    }

    @Get('userInfo/:name')
    async getInfoUserProfil(@Param("name") name: string) {
        const user = await this.userService.findByName(name);
        return this.userService.getInfoUserProfil(user);
    }

    @Get('avatarByLogin/:login')
    async getAvatarByLogin(@Param("login") login: string) {
        const userByLogin: User = await this.userService.findByLogin(login);
        const avatarBase64 = this.userService.getAvatarBase64(userByLogin);
        return avatarBase64;
    }

    @Get('allOtherUsers/:name')
    async getAllOtherUserNames(@Param("name") name: string) {
        const user = await this.userService.findByName(name);
        return await this.userService.getAllOtherUserNames(user);
    }

    @Get('allOtherUsersWithoutFriends/:name')
    async getAllOtherUserNamesWithoutFriends(@Param("name") name: string) {
        const user = await this.userService.findByName(name);
        return await this.userService.getAllOtherUserNamesWithoutFriends(user);
    }

    @Get('allFriends/:name')
    async getDataFriends(@Param("name") name: string) {
        const user = await this.userService.findByName(name);
        return await this.userService.getDataFriends(user);
    }

    ///////////
    // POST //
    //////////

    @Post("addFriend/:name")
    async addFriends(@Param("name") nameCurrentUser: string, @Body('name') nameFriendToAdd: string) {
        try {
            const userCurrent = await this.userService.findByName(nameCurrentUser);
            const userFriendToAdd = await this.userService.findByName(nameFriendToAdd);
            await this.userService.addFriends(userCurrent, userFriendToAdd);
        }
        catch (error) {
            throw error;
        }
    }

    //////////
    // PUT //
    /////////
    @Put("logout/:name")
    async updateLogout(@Param("name") name: string) {
        const user = await this.userService.findByName(name);
        await this.userService.updateLogout(user);
    }

    @Put("uploadAvatar/:name")
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(@Param("name") name: string, @UploadedFile() avatar: Express.Multer.File) {
        const user = await this.userService.findByName(name);
        return await this.userService.uploadAvatar(user, avatar);
    }

    @Put("updateUser/:name")
    async updateUser(@Param("name") name: string, @Body() data: { name: string, twoFA: boolean }) {
        const user = await this.userService.findByName(name);
        return await this.userService.updateUser(user, data.name, data.twoFA,);
    }

    @Put("updateByLogin/:login")
    async updateByLogin(@Param("login") login: string,){

    }
    ////////////
    // DELETE //
    ///////////
    @Delete("removeFriend/:name")
    async deleteFriend(@Param("name") nameCurrentUser: string, @Body('name') nameFriendToRemove: string) {
        try {
            const userCurrent = await this.userService.findByName(nameCurrentUser);
            const userFriendToRemove = await this.userService.findByName(nameFriendToRemove);
            await this.userService.deleteFriend(userCurrent, userFriendToRemove);
        }
        catch (error) {
            throw error;
        }
    }
}