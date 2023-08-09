import { useState, useRef, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios'
import API from '../components/api';
import Typed from 'typed.js';
import { Socket, io } from 'socket.io-client';

interface DataUser {
  name: string,
  avatar: string,
  twoFA: boolean,
}

interface DataFriends {
  name: string,
  avatar: string
}

export const Private = () => {
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const [dataFriends, setDataFriends] = useState<DataFriends[]>([]);
  const [dataUser, setDataUser] = useState<DataUser | null>(null);
  const [stateAvatar, setStateAvatar] = useState<string>('');
  const [stateDataUser, setStateDataUser] = useState<string>('');
  const [checked, setChecked] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  let nameUser = Cookies.get('token')!;
  const socketUser = useMemo(() => io('http://localhost:3001/user'), []);
  const socketChat: Socket = useMemo(() => io('http://localhost:3001/chat'), []);

  //modification other user, information user, list of friends, set twoFA, set QRcode
  useEffect(() => {
    socketUser.once('user modification', () => {
      window.location.reload();
    })

    socketUser.once('user Name modification', (data: { newName: string, oldName: string }) => {
      if (data.oldName !== nameUser && data.newName !== nameUser){
        window.location.reload();
      }
    })

    socketUser.once('user Avatar modification', (name: string) => {
       if (name !== nameUser)
        window.location.reload();
    })

    API.get(`user/userInfo/${encodeURIComponent(nameUser)}`)
      .then((response) => {
        setDataUser(response.data);
        if (response.data.twoFA === true) {
          setChecked(true);
        }
        else {
          setChecked(false);
        }
      })
      .catch((error) => {
        if (error) {
          console.log(error.response.data.message);
        }
      });

    API.get(`user/allFriends/${encodeURIComponent(nameUser)}`).then(response => {
      if (response.data === '') {
        setDataFriends([]);
      } else {
        const friendArray: any[][] = response.data;
        const friendsData: DataFriends[] = friendArray.map(friend => ({
          name: friend[0],
          status: friend[1],
          avatar: friend[2],
        }));
        setDataFriends(friendsData);
      }
    })
      .catch(error => {
        if (error) {
          console.log(error.response.data.message);
        }
      });

    const twoFAValue = Cookies.get('twoFA');
    if (twoFAValue) {
      const isChecked = twoFAValue === 'true';
      setChecked(isChecked);
    }

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
  }, [nameUser, qrCodeUrl, socketUser]);

  //remove a friend
  const removeSubmitFriends = (removeFriend: string) => {
    const data = {
      data: {
        name: removeFriend,
      },
    };
    API.delete(`user/removeFriend/${encodeURIComponent(nameUser)}`, data).then(() => {
      API.get(`user/allFriends/${encodeURIComponent(nameUser)}`)
        .then(response => {
          if (response.data === '') {
            setDataFriends([]);
          } else {
            const friendArray: any[][] = response.data;
            const friendsData: DataFriends[] = friendArray.map(friend => ({
              name: friend[0],
              status: friend[1],
              avatar: friend[2],
            }));
            setDataFriends(friendsData);
            socketUser.emit('user modify');
          }
        })
        .catch(error => {
          if (error) {
            console.log(error.response.data.message);
          }
        });
    })
      .catch(error => {
        if (error) {
          console.log(error.response.data.message);
        }
      });
  };

  //registered the new avatar in the database
  const avatarSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (photoName !== null) {
      const fileInput = photoRef.current;
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const avatarFile = fileInput.files[0];
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        API.put(`user/uploadAvatar/${encodeURIComponent(nameUser)}`, formData).then((newAvatar) => {
          API.get(`user/userInfo/${encodeURIComponent(nameUser)}`)
            .then(response => {
              setDataUser(response.data);
            })
            .catch(error => {
              if (error) {
                console.log(error.response.data.message);
              }
            });
          setPhotoName('');
          setStateAvatar('Successfully uploaded');
          socketUser.emit('user Avatar modify', nameUser);
          setTimeout(() => {
            setStateAvatar('');
          }, 5000);
        })
          .catch(error => {
            if (error) {
              console.log(error.response.data.message);
            }
          });
      }
    } else {
      setStateAvatar('Please, choose an avatar');
      setTimeout(() => {
        setStateAvatar('');
      }, 5000);
    }
  };

  //change avatar only on the page
  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoName(file.name);

      const reader = new FileReader();
      reader.onload = e => {
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

  //set if twoFA button is true or false and change value in the database
  const handleTwoFAChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setChecked(checked);
    Cookies.set('twoFA', checked.toString());
    if (checked) {
      QRCodeDoubleAuth(nameUser);
    }
    else if (!checked) {
      disabledtwoFA(nameUser);
    }
  };

  //registered name in the database
  const dataUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
    };
    API.put(`user/updateUser/${encodeURIComponent(nameUser)}`, data).then(response => {
      if (response.data === 'You must fill at least one field' ||
        response.data === 'This nickname already exists') {
        setStateDataUser(response.data);
        setTimeout(() => {
          setStateDataUser('');
        }, 4000);
      } else {
        const data = {
          name: response.data[0],
          message: response.data[2],
        };
        if (data.name !== nameUser) {
          const dataToSend = { newName: data.name, oldName: nameUser }
          socketUser.emit('user Name modify', dataToSend);
          const dataToSendForChanName = { newName: data.name, oldName: nameUser, chanData: undefined }
          socketChat.emit('modifyChannelDM', dataToSendForChanName);
          Cookies.remove('token');
          Cookies.set('token', data.name);
          nameUser = data.name;
        }      
        setStateDataUser(data.message);
        setTimeout(() => {
          setStateDataUser('');
        }, 5000);
      }
    })
      .catch(error => {
        console.log(error);
      });
  };

  //set twoFA to false in the database
  const disabledtwoFA = async (name: string) => {
    try {
      await axios.put('http://localhost:3001/auth/twoFA', { name: name });
    } catch (error) {
      console.error(error);
    }
  };

  //scan the QRcode (change interface)
  const QRCodeDoubleAuth = async (name: string) => {
    try {
      const response = await axios.put('http://localhost:3001/auth/qrcode', { name: name });
      if (response.status === 200) {
        const qrCodeUrl = response.data.qrCodeUrl;
        setQrCodeUrl(qrCodeUrl);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
              <a href="/private" className="relative text-white group-hover:text-gray-800">DONE</a>
            </button>
          </div>
        </div>

      ) : (

        <div className="flex flex-col justify-center items-center h-screen p-5 bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
          <div className="xl:w-4/5 h-3/5 mx-auto max-s-screen md:flex no-wrap">
            <div className="w-full md:w-4/12 flex-grow relative">
              <div className="h-full bg-slate-900 p-3">
                <div className="text-center mt-16">
                  <div className="mt-2">
                    {!photoPreview && (
                      <img className="flex xl:w-60 xl:h-60 w-40 h-40 mb-6 m-auto rounded-full"
                        src={dataUser?.avatar !== null ? `data:image/png;base64,${dataUser?.avatar}` : require('../img/avatar.png')}
                        alt="avatar" />
                    )
                    }
                    {photoPreview && (
                      <span className="flex xl:w-60 xl:h-60 w-40 h-40 mb-6 rounded-full m-auto" style={{ backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', backgroundImage: `url('${photoPreview}')` }}></span>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={photoRef} onChange={handlePhotoChange} />
                  <button type="button" className="inline-flex text-white bg-slate-700 hover:bg-slate-600 focus:ring-1 focus:outline-none focus:ring-slate-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center mt-2" onClick={() => { photoRef.current?.click() }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    BROWSE FILE
                  </button>
                  <button type="button" onClick={avatarSubmit} className="text-white bg-slate-700 hover:bg-slate-600 focus:ring-1 focus:outline-none focus:ring-slate-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 ml-4 mb-4 text-center">
                    UPLOAD
                  </button>
                  {stateAvatar &&
                    <p className={`text-center italic bottom-6 left-1/2 mt-2 ${stateAvatar === 'Successfully uploaded' ? "text-green-600" : stateAvatar === 'Please, choose an avatar' ? "text-orange-500" : "text-red-600"}`} >
                      {stateAvatar}
                    </p>}
                </div>
                <a href={`/public/${nameUser}`} className="btn group flex items-center bg-transparent text-sm text-gray-300 tracking-widest absolute bottom-3 right-3">
                  <span className="relative pr-4 pb-1 text-white after:transition-transform after:duration-500 after:ease-out after:absolute after:bottom-0 after:left-0 after:block after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-indigo-800 after:content-[''] after:group-hover:origin-bottom-left after:group-hover:scale-x-100">
                    View profile
                  </span>
                  <svg viewBox="0 0 46 16" height="10" width="20" xmlns="http://www.w3.org/2000/svg" id="arrow-horizontal" className="-translate-x-2 fill-slate-500 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:scale-x-105 group-hover:fill-white">
                    <path transform="translate(30)" d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z" data-name="Path 10" id="Path_10"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div className="w-full md:w-9/12 mx-2 flex-grow">
              <div className="bg-slate-900 h-2/4 p-3 shadow-sm rounded-sm">
                <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
                  <span className="text-green-400">
                    <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span className='text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10'>PERSONAL INFORMATION</span>
                </div>
                <form className="relative w-full p-3" onSubmit={dataUserSubmit}>
                  <div className="flex flex-wrap mx-3 mb-10">
                    <div className="w-full md:w-1/2 px-3 mb-6 md:mb-2 mt-5">
                      <label className="block uppercase tracking-wide text-gray-300 text-xs font-bold mb-2" htmlFor="grid-first-name">
                        Nickname
                      </label>
                      <input className="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-0.5 leading-tight focus:outline-none focus:bg-white"
                        id="grid-first-name" type="text" name='name' placeholder={dataUser?.name} />
                      {stateDataUser &&
                        <p className={`${stateDataUser === 'Information(s) registered' ? 'text-green-500' : 'text-red-500'} text-xs italic`}>{stateDataUser}
                        </p>}
                    </div>
                    <div className="w-full md:w-1/2 px-3">
                    </div>
                    <ul className="bg-gray-00 text-gray-200 hover:text-gray-700 hover:shadow py-2 px-3 mt-3 divide-y rounded shadow-sm">
                      <li className="flex items-center">
                        <label className="relative inline-flex items-center mb-1 cursor-pointer">
                          <input type="checkbox" value="" className="sr-only peer" onChange={handleTwoFAChange} checked={checked} />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-slate-400 dark:peer-focus:ring-slate-200 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-slate-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-200 dark:text-gray-300">
                            Two-factor authentication
                          </span>
                        </label>
                      </li>
                    </ul>
                    <div className="absolute right-6 bottom-14 md:1/2 px-3">
                      <button type="submit" className="text-white bg-slate-700 hover:bg-slate-600 focus:ring-1 focus:outline-none focus:ring-slate-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">SUBMIT</button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-slate-900 p-3 mt-2" style={{ height: '48.4%' }}>
                <div>
                  <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8 mb-3">
                    <span className="text-green-400">
                      <svg className="h-5 fill-current" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <span className='text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10'>FRIENDS LIST</span>
                    <a href="/addfriend">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="w-6 h-6 hover:scale-125">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </a>
                  </div>
                  <div className="rounded-lg max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'black #1f2937' }}>
                    <style>
                      {`
                  ::-webkit-scrollbar {
                    width: 20px;
                    background-color: #1f2937;
                  }
                  ::-webkit-scrollbar-thumb {
                    background-color: black;
                    border-radius: 5px;
                  }
                  ::-webkit-scrollbar-thumb:hover {
                    background-color: #00000080;
                  }
                  ::-webkit-scrollbar-corner {
                    background-color: #1f2937;
                  }
                  `}
                    </style>
                    <table className="min-w-full">
                      <tbody>
                        {dataFriends.length > 0 ? (
                          dataFriends.map((friend, index) => (
                            <tr key={index}>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-2/5">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 w-10 h-10 hidden sm:table-cell">
                                    <img className="h-full rounded-full" src={friend.avatar !== null ? `data:image/png;base64,${friend.avatar}` : require('../img/avatar.png')} alt="avatar"></img>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-gray-900 text-base whitespace-no-wrap">
                                      {friend.name}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="border-b border-gray-200 bg-white">
                              </td>
                              <td className="border-b border-gray-200 bg-white">
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-2/5">
                                <div className="float-right">
                                  <button className="group relative text-red-500 text-sm font-semibold border border-red-500 px-4 py-2 rounded-lg overflow-hidden rounded-lg text-lg hover:bg-red-500 hover:border-red-500 hover:text-white hover:scale-90 transform transition-all duration-250 ease-out bg-transparent"
                                    onClick={() => removeSubmitFriends(friend.name)}
                                  >
                                    <div className="absolute inset-0 w-0 bg-red-500 transition-all duration-250 ease-out group-hover:w-full"></div>
                                    <div className="relative text-red-500 hover:text-white">REMOVE</div>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-black">
                              Empty friend list
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}