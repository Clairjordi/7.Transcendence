import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import Typed from 'typed.js';
import { io } from 'socket.io-client';
import API from '../components/api';

export const Login: React.FC = () => {

  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isNameTaken, setIsNameTaken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [stateAvatar, setStateAvatar] = useState<string>('');

  const location = useLocation();

  const urlLogin = new URLSearchParams(location.search);
  const usrLogin = urlLogin.get('login');
  const socketUser = useMemo(() => io('http://localhost:3001/user'), []);

  const avatarSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fileInput = photoRef.current;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const avatarFile = fileInput.files[0];

      const usrLogin = urlLogin.get('login') as string;

      const formData = new FormData();
      formData.append('avatar', avatarFile);
      formData.append('login', usrLogin);

      try {
        const avatarName = await axios.post('http://localhost:3001/auth/avatar', formData);
        if (avatarName) {
          setStateAvatar('Successfully uploaded')
          setTimeout(() => {
            setStateAvatar('');
          }, 3000);
        }
      } catch (error) {
        console.error(error);

      }
    }
    else {
      setStateAvatar('Failed upload avatar, please try again')
          setTimeout(() => {
            setStateAvatar('');
          }, 4000);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          setPhotoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoName(null);
      setPhotoPreview(null);
    }
  };

  const handleTwoFAChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formRef.current) {
      const nameInput = formRef.current.elements.namedItem('name') as HTMLInputElement;

      if (nameInput) {
        const name = nameInput.value;

        if (!name) {
          setIsNameTaken('You must fill a nickname in order to continue.');
          setTimeout(() => {
            setIsNameTaken('');
          }, 5000);
          return;
        }

        const data = {
          name: name,
          login: usrLogin,
          avatar: 'avatar.png',
          twoFA: isChecked,
        };

        try {
          const response = await axios.put('http://localhost:3001/auth/complete', data);

          if (response.data === 'This nickname already exists. Please choose another one.') {
            
            setIsNameTaken(response.data);
            setTimeout(() => {
              setIsNameTaken('');
            }, 4000);
          } else {
            const token = response.data.decodedName;
            Cookies.set('token', token, { expires: 30 });
            const dataAuth = { login: usrLogin, name: true }
            Cookies.set('auth', JSON.stringify(dataAuth));

            formRef.current.reset();

            if (isChecked) {
              const qrCodeUrl = response.data.qrCodeUrl;
              setQrCodeUrl(qrCodeUrl);
            }
            else {
              socketUser.emit('user modify');
              window.location.href = '/home';
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  useEffect(() => {
    let typed: Typed | null = null;

    if (qrCodeUrl) {
      const options = {
        strings: ['Please, scan this QR Code to configure 2FA in <br /> your authenticator application'],
        typeSpeed: 60,
        backSpeed: 50,
        backDelay: 50,
        loop: false,
      };

      typed = new Typed('#qr-animated-text', options);
    }

    return () => {
      if (typed) {
        typed.destroy();
      }
    };
  }, [qrCodeUrl]);

  //for avatar give By login
  useEffect(() => {
    if (usrLogin) {
      API.get(`user/avatarByLogin/${encodeURIComponent(usrLogin)}`).then(response => {
        if (response.data !== ''){
          setAvatarBase64(response.data);
        }
      })
        .catch(error => {
          if (error) {
            console.log(error.response.data.message);
          }
        });
    }
    return () => { };
  }, [avatarBase64]);
  
  return (

    <div className="relative h-full overflow-y-hidden">
      {qrCodeUrl ? (
        <div className="h-screen flex flex-col items-center justify-center p-5 bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: `url(${require('../img/header.png')})` }}>
          <div className="flex justify-center items-center h-screen">
            <div className="absolute top-2/5transform -translate-x-1/2 -translate-y-1/2" style={{ left: '30%', wordBreak: 'break-word' }}>
              <div className="text-2xl font-bold mb-12 ml-40 text-white text-center">
                <span id="qr-animated-text">
                  Please scan this QR Code to configure 2FA in your authenticator application
                </span>
              </div>
            </div>
            <div className="absolute ml-10 top-2/5 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '60%' }}>
              <img src={qrCodeUrl} alt="QR Code" className='mr-10' />
            </div>
            <button className="group relative h-12 w-48 overflow-hidden rounded-lg bg-teal-500 text-lg shadow" style={{ top: '30%' }}>
              <div className="absolute inset-0 w-3 bg-white transition-all duration-[250ms] ease-out group-hover:w-full"></div>
              <a href="/home" className="relative text-white group-hover:text-gray-800">DONE</a>
            </button>
          </div>
        </div>

      ) : (

        <div className="flex flex-col justify-center items-center h-screen p-5 bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
          <div className="xl:w-4/5 mx-auto max-s-screen md:flex no-wrap">
            <div className="w-full md:w-4/12 flex-grow relative">
              <div className="h-full bg-slate-900 p-3">
                <div className="text-center">
                  <div className="mt-2">
                    {!photoPreview && (
                      <img className="flex xl:w-40 xl:h-40 w-40 h-40 mt-4 m-auto rounded-full shadow"
                        src={avatarBase64! !== null ? `data:image/png;base64,${avatarBase64!}` : require('../img/avatar.png')}
                        alt="avatar"  />
                    )}
                    {photoPreview && (
                      <span className="flex xl:w-40 xl:h-40 w-40 h-40 mb- mt-4 rounded-full m-auto shadow" style={{ backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', backgroundImage: `url('${photoPreview}')` }}></span>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={photoRef} onChange={handlePhotoChange} />
                  <button type="button" className="inline-flex text-white bg-slate-700 hover:bg-slate-600 focus:ring-1 focus:outline-none focus:ring-slate-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center mt-5" onClick={() => { photoRef.current?.click() }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    BROWSE FILE
                  </button>
                  <button type="button" onClick={avatarSubmit} className="text-white bg-slate-700 hover:bg-slate-600 focus:ring-1 focus:outline-none focus:ring-slate-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 ml-4 mb-4 text-center">
                    UPLOAD
                  </button>
                  {stateAvatar &&
                    <p className={`text-center italic left-1/2 ${stateAvatar === 'Successfully uploaded' ? "text-green-600" : "text-red-600"}`} >
                      {stateAvatar}
                    </p>}
                </div>
              </div>
            </div>
            <div className="w-full md:w-9/12 mx-2 flex-grow">
              <div className="bg-slate-900 h-full p-3 shadow-sm rounded-sm">
                <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
                  <span className="text-green-400">
                    <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span className='text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10'>PERSONAL INFORMATION</span>
                </div>
                <form ref={formRef} onSubmit={handleFormSubmit} className="relative w-full h-full p-3 mt-6">
                  <div className="flex flex-wrap mx-3 mb-2">
                    <div className="w-full md:w-1/2 px-3 mb-6 md:mb-2">
                      <label className="block uppercase tracking-wide text-gray-300 text-xs font-bold mb-2" htmlFor="grid-first-name">
                        Nickname
                      </label>
                      <input name="name" className="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-0.5 leading-tight focus:outline-none focus:bg-white" id="grid-first-name" type="text" placeholder="Toto" />
                      {isNameTaken &&
                        <p className={`${isNameTaken === 'Nickname set' ? 'text-green-500' : 'text-red-500'} text-xs italic`}>{isNameTaken}
                        </p>}
                    </div>
                    <div className="w-full md:w-1/2 px-3">
                    </div>
                    <ul className="bg-gray-00 text-gray-200 hover:text-gray-700 hover:shadow py-2 px-3 mt-3 divide-y rounded shadow-sm">
                      <li className="flex items-center">
                        <label className="relative inline-flex items-center mb-1 cursor-pointer">
                          <input type="checkbox" value="" className="sr-only peer" onChange={handleTwoFAChange} />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-slate-400 dark:peer-focus:ring-slate-200 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-slate-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-200 dark:text-gray-300">
                            Two-factor authentication
                          </span>
                        </label>
                      </li>
                    </ul>
                  </div>
                  <div className="absolute right-6 bottom-7.5 md:1/2 px-3">
                    <button type="submit" onClick={handleFormSubmit} className="text-white bg-slate-700 hover:bg-slate-600 focus:ring-1 focus:outline-none focus:ring-slate-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">SUBMIT</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}  