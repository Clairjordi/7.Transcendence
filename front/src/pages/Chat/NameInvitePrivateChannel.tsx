import React, { ChangeEvent, useState } from 'react';
import { Socket } from 'socket.io-client';

interface DataOtherUser {
    name: string,
    status: string,
    avatar: string,
    role: 'owner' | 'admin' | 'user' | 'directMessage';
}

interface PopupInviteProps {
    nameUser: string;
    userToWrite: DataOtherUser[];
    socketChat: Socket;
    onClose: () => void;
}

const NameInvitePrivateChannel: React.FC<PopupInviteProps> = ({ nameUser, userToWrite, socketChat, onClose }) => {
    const [channelTitle, setchannelTitle] = useState<string>('');
    const [stateNameChan, setstateNameChan] = useState<string>('');


    const handleChangeChannelTitle = (event: ChangeEvent<HTMLInputElement>) => {
        setchannelTitle(event.target.value);
    };

    //invite to send by DM for join a private channel
    const clickDone = () => {
        socketChat.emit('getDataInvitPrivateChannel', { memberName: nameUser, channelName: channelTitle })
        socketChat.once('dataInvitPrivateChannel', (response: string) => {
            if (response === 'owner' || response === 'admin') {
                let data = { userName1: nameUser, userName2: userToWrite[0].name, invite: nameUser } as { userName1: string; userName2: string; text?: string };
                socketChat.emit('createDMChannel', data);
                socketChat.once('DMChannel created', () => {
                    const messageText = `${nameUser} invites you to join the private channel: ${channelTitle}\nClick for join Channel: ${channelTitle}`;
                    data = { ...data, text: messageText }
                    socketChat.emit('createDMMessage', data);
                    onClose();
                })
            }
            else {
                setstateNameChan(response);
                setchannelTitle('');
                setTimeout(() => {
                    setstateNameChan('');
                }, 4000);
            }
        })
    }

    return (
        <div className="popup fixed top-0 left-0 w-full h-full z-50 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="popup-content">
                <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
                    <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                        <div className="relative px-4 py-10 bg-slate-950 mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center space-x-5">
                                    <div className="h-14 w-14 bg-slate-700 rounded-full flex justify-center items-center">💬</div>
                                    <div className="block pl-2 font-semibold text-xl self-start text-gray-700">
                                        <h2 className="leading-relaxed text-white">Invite a friend on a private Channel</h2>
                                        <p className="text-sm text-gray-200 font-normal leading-relaxed">where you meet your friends and start a discussion !</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="flex flex-col">
                                            <label className="leading-loose text-white">Private Channel Title</label>
                                            <input type="text" className="px-4 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                                placeholder="Channel title"
                                                value={channelTitle} onChange={handleChangeChannelTitle}
                                            />
                                            <p className="text-xs italic visible h-1 text-red-600">
                                                {stateNameChan}</p>
                                        </div>

                                    </div>
                                    <div className="pt-4 flex items-center space-x-4">
                                        <button className="flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none hover:scale-105" onClick={onClose}>
                                            <svg className="w-6 h-6 mr-3" fill="none" stroke="red" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> Cancel
                                        </button>
                                        <button onClick={clickDone} className="bg-slate-800 flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none hover:scale-105">Done</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default NameInvitePrivateChannel
