import React, { useEffect, useMemo, useState } from 'react';
import Typed from 'typed.js';
import { useLocation } from 'react-router-dom';
import config from '../config';
import axios from 'axios'
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';

interface UserProfile {
  login: string;
}

export const Home: React.FC = () => {
  const socketUser = useMemo(() => io('http://localhost:3001/user'), []);
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const code = urlParams.get('code');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      try {
        const response = await axios.post('http://localhost:3001/auth/token', {
          code: code,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri
        });
    
        if (response.status === 201) {
          const data = response.data;
          const accessToken = data.access_token;
          getUserProfile(accessToken);

        } else {
          console.error("Access token failure");
        }

      } catch (error) {
        console.error("Error exchanging code for token:", error);
      }
    };

    const getUserProfile = async (accessToken: string) => {
      try {
        const response = await axios.get('https://api.intra.42.fr/v2/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 200) {
          const userProfileData = response.data;

          const filteredProfile: UserProfile = {
            login:userProfileData.login,
          }

          setUserProfile(filteredProfile);
          saveUserProfile(filteredProfile)

        } else {
          console.error('Failed to retrieve user profile');
        }
      } catch (error) {
        console.error('Error retrieving user profile:', error);
      }
    };
    
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

        }
      }
    }

    if (code) {     
      const cookie = Cookies.get('token');
      if(!cookie)
       exchangeCodeForToken();
    }

    const options = {
      strings: ['Challenge your friends and become the Pong Master !'],
      typeSpeed: 60,
      backSpeed: 30,
      backDelay: 5000,
      loop: true,
    };

    const typed = new Typed('#animated-text', options);

    return () => {
      typed.destroy();
    };
  }, []);

    return (
    <div className="min-h-screen bg-cover bg-fixed overflow-hidden" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
      <div className="container pt-24 md:pt-42 mx-auto flex flex-wrap flex-col md:flex-row items-center">
        <div className="flex flex-col w-full xl:w-2/5 justify-center">
          <h1 className="my-2 text-4xl md:text-6xl text-white opacity-75 font-bold font-mono text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500">
              TRANSCENDENCE
            </span>
          </h1>
          <p className="leading-normal text-gray-300 text-2xl mt-2 mb-10 text-center">
            <span id="animated-text">Challenge your friends and become the Pong Game Master !</span>
          </p>
          <a href='/game' className="bg-none cursor-pointer inline-block text-lg py-3 px-3 relative text-white no-underline z-10 font-bold
            before:bg-gray-900 before:h-full before:absolute before:w-full before:-z-10 before:top-3 before:right-3
            after:border-white after:border-solid after:border-2 after:h-full after:opacity-100 after:absolute after:top-0 after:right-0 after:w-full
            hover:before:translate-x-3 hover:before:-translate-y-3
            hover:after:-translate-x-3 hover:after:translate-y-3
            hover:before:transition-transform hover:before:duration-500 hover:before:ease-in
            hover:after:transition-transform hover:after:duration-500 hover:after:ease-in
            after:transition-transform after:duration-500
            before:transition-transform before:duration-500"
            style={{display: 'inline-block', width: 'fit-content', margin: '0 auto'}}>
              Let's PLAY
          </a>
        </div>
        <div className="w-full xl:w-3/5 p-12">
          <img className="mx-auto w-full md:w-4/5 transition hover:scale-105 duration-700 ease-in-out hover:rotate-6" src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWJiYWYzODEyNzkwNTFkODFjZGMyOGJjOGFmNGFkMmJjY2JjZDhlNyZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/aTGwuEFyg6d8c/giphy.gif" />
        </div>
      </div>
    </div>
    );
  };