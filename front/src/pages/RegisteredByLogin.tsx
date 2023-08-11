import axios from 'axios';
import Cookies from 'js-cookie';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

interface UserProfile {
    login: string;
}

interface PopupRegisteredProps {
    onClose: () => void;
}

export const PopupRegistered: React.FC<PopupRegisteredProps> = ({ onClose }) => {
    const [login, setLogin] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const socketUser = useMemo(() => io('http://localhost:3001/user'), []);

    const handleChangeChannelTitle = (event: ChangeEvent<HTMLInputElement>) => {
        setLogin(event.target.value);
    };
    
    //registered user 
    const saveUserProfile = async (profile: UserProfile) => {
      try {
        const response = await axios.post('http://localhost:3001/auth/profile', profile);
        if (response.status === 201) {
          checkCompleteProfile(profile)
        } else {
          console.error('Failed to save user profile');
        }
      } catch (error) {
        console.error('Error saving user profile:', error);
      }
    };

    const checkCompleteProfile = async (profile: UserProfile) => {
        const response = await axios.post('http://localhost:3001/auth/find', profile, {
          headers: {
            'Content-Type': 'application/json',
          },
          transformRequest: [(data) => JSON.stringify(data)],
        });
        const dataAuth = {login: response.data.login, name: false, twoFA: response.data.twoFA};
        Cookies.set('auth',  JSON.stringify(dataAuth));
        if (!response.data.name)
        {
          const usrLogin = response.data.login;
          window.location.href = `/login?login=${usrLogin}`
        }
        else if (response.data.twoFA && isLoggedIn === false)
        {
          const usrName = response.data.name;
          window.location.href = `/2fa?name=${usrName}`
          setIsLoggedIn(true);
        }
        else if (response.data.name && isLoggedIn === false)
        {
          const tokenrelog = Cookies.set('token', response.data.name)        
          if (tokenrelog){
            await axios.put('http://localhost:3001/auth/relog', response.data)
            setIsLoggedIn(true);
            socketUser.emit('user modify');
            window.location.href = '/home'
          }
        }
      }

    //check if login is registered or not
    const clickDone = () => {
        const loginTocheck: UserProfile = {
            login:login,
          }
        saveUserProfile(loginTocheck);
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
                                        <h2 className="leading-relaxed text-white">Registered or Login</h2>
                                        <p className="text-sm text-gray-200 font-normal leading-relaxed">Please put your login</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="flex flex-col">
                                            <label className="leading-loose text-white">Login</label>
                                            <input type="text" className="px-4 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                                placeholder="titi"
                                                value={login} onChange={handleChangeChannelTitle} />
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
