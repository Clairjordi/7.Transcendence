import React, { ChangeEvent, useState } from 'react';
import { Socket } from 'socket.io-client';

interface PopupPasswordProps {
    nameUser: string;
    socketChat: Socket;
    chanNameForSetPassword: string;
    setChanNameForSetPassword: React.Dispatch<React.SetStateAction<string>>;
    onClose: () => void;
}

const SetPasswordChanProtected: React.FC<PopupPasswordProps> = ({ nameUser, socketChat, chanNameForSetPassword, setChanNameForSetPassword, onClose }) => {
    const [password, setPassword] = useState<string>('');
    const [stateNameChan, setstateNameChan] = useState<string>('');


    const handleChangePass = (event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const clickDone = () => {
        socketChat.emit('passwordValidation', {channelName: chanNameForSetPassword, password: password});
        socketChat.once('statusPasswordValidation', (response) => {
            if(response === 'validated'){
                const data = { userName: nameUser, chanName: chanNameForSetPassword }
                socketChat.emit('joinChannel', data);
                setChanNameForSetPassword('');
                onClose();
            }
            else{
                setstateNameChan(response);
                setPassword('');
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
                                        <h2 className="leading-relaxed text-white mt-2">Enter Password</h2>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-4 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="flex flex-col">
                                            <label className="leading-loose text-white mb-1">Password required to join the channel: {chanNameForSetPassword}</label>
                                            <input id="grid-password" type="password" className="px-4 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                                placeholder="************"
                                                value={password} onChange={handleChangePass}/>
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

export default SetPasswordChanProtected
