import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import API from '../components/api';

interface Match {
    scorePlayerLeft: number;
    scorePlayerRight: number;
    userRight: DataUser;
}

interface DataGame {
    win: number,
    loose: number,
    achievementImageUrls: string[],
    level: number,
}

interface DataUser {
    name: string,
    status: string,
    date: string,
    avatar: string,
    matchHistory: Match[],
}

interface DataFriends {
    name: string,
    status: string,
    avatar: string
}

export const Public = () => {
    const [dataGame, setDataGame] = useState<DataGame>();
    const [dataUser, setDataUser] = useState<DataUser>();
    const [dataFriends, setDataFriends] = useState<DataFriends[]>([]);
    const socketUser = useMemo(() => io('http://localhost:3001/user'), []);
    const { userName } = useParams();

    useEffect(() => {
        if (userName) {
            socketUser.once('user modification', () => {
                window.location.reload();
            })
            socketUser.once('user Name modification', (data: { newName: string }) => {
                window.location.href = `/public/${data.newName}`;
            })

            socketUser.once('user Avatar modification', () => {
                window.location.reload();
            })

            const socketGameplay = io('http://localhost:3001/gameplay');
            socketGameplay.emit('getDataGame', userName);
            socketGameplay.on('resultDataGame', (data) => {
                if (data === null) {
                    const dataToNull = {
                        win: 0,
                        loose: 0,
                        achievementImageUrls: [],
                        level: 0,
                    }
                    setDataGame(dataToNull);
                }
                else {
                    setDataGame(data);
                }
            });

            API.get(`user/userInfo/${encodeURIComponent(userName)}`).then(response => {
                setDataUser(response.data)
            }).catch(error => {
                if (error) {
                    console.log(error.response.data.message);
                }
            });

            API.get(`user/allFriends/${encodeURIComponent(userName)}`).then(response => {
                if (response.data === '') {
                    setDataFriends([]);
                }
                else {
                    const friendArray: any[][] = response.data;
                    const friendsData: DataFriends[] = friendArray.map((friend) => ({
                        name: friend[0],
                        status: friend[1],
                        avatar: friend[2]
                    }));
                    setDataFriends(friendsData)
                }
            }).catch(error => {
                if (error) {
                    console.log(error.response.data.message);
                }
            });

            return () => {
                socketGameplay.off('resultDataGame');
                socketUser.disconnect();
                socketGameplay.disconnect();

            };
        }
    }, [userName, socketUser]);

    return (
        <div className="h-full overflow-y-hidden">
            <div className="flex flex-col justify-center items-center h-screen p-5 bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
                <div className="xl:w-4/5 mx-auto max-s-screen md:flex">
                    <div className="w-full md:w-4/12 flex flex-col">
                        <div className="bg-slate-900 p-3">
                            <div className="image overflow-hidden">
                                {dataUser?.name && (
                                    <img className="flex xl:w-60 xl:h-60 w-40 h-40 m-auto rounded-full mt-5"
                                        src={dataUser?.avatar !== null ? `data:image/png;base64,${dataUser?.avatar}` : require('../img/avatar.png')}
                                        alt="avatar" />)}
                            </div>
                            <h1 className="text-gray-200 font-bold text-xl leading-8 my-1">{dataUser?.name}</h1>
                            <h3 className="text-gray-300 font-lg text-semibold leading-6">Level {dataGame?.level}</h3>
                            <ul className="bg-gray-100 text-gray-600 py-2 px-3 mt-3 divide-y rounded shadow-sm">
                                <li className="flex items-center py-3">
                                    <span>STATUS</span>
                                    <span className="ml-auto">
                                        <span
                                            className={`py-1 px-2 rounded text-white text-sm ${dataUser?.status === 'online' ? "bg-green-500" : dataUser?.status === 'offline' ? 'bg-red-500' : 'bg-blue-500'}`}>{dataUser?.status}</span>
                                    </span>
                                </li>
                                <li className="flex items-center py-3">
                                    <span>MEMBER SINCE</span>
                                    <span className="ml-auto">{dataUser?.date}</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-slate-900 my-2 p-3 flex-grow">
                            <div className="flex items-center space-x-3 font-semibold text-gray-900 text-xl leading-8">
                                <span className="text-green-400">
                                    <svg className="h-5 fill-current" xmlns="http://www.w3.org/2000/svg" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </span>
                                <span className='text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10'>FRIENDS</span>
                            </div>
                            <div className="rounded-lg overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'black #1f2937' }}>
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
                                <div className="grid grid-cols-4 overflow-y-auto max-h-28">
                                    {dataFriends.length > 0 ? (
                                        dataFriends.map((friend, index) => (
                                            <div key={index} className="text-center my-1">
                                                <img className="h-16 w-16 rounded-full mx-auto mb-2"
                                                    src={friend.avatar !== null ? `data:image/png;base64,${friend.avatar}` : require('../img/avatar.png')}

                                                    alt="avatar" />
                                                <a href={`/public/${friend.name}`} className={`py-1 px-3 rounded text-white text-sm ${friend.status === 'online' ? "bg-green-500" : friend.status === 'offline' ? 'bg-red-500' : 'bg-blue-500'}`}>{friend.name}</a>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-4 mt-8">
                                            <div className="rounded px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-black">
                                                Empty friend list
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-9/12 mx-2 flex-grow">
                        <div className="bg-slate-900 p-3 shadow-sm rounded-sm" style={{ height: '99%' }}>
                            <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8">
                                <span className="text-green-400">
                                    <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <span className='text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10'>STATISTICS</span>
                            </div>
                            <div className="text-white">
                                <div className=' w-[40%] mx-auto mt-10 mb-10'>
                                    <div className="flex flex-wrap justify-between text-sm">
                                        <div className="flex items-center">
                                            <div className='text-green-400 mr-4'>▲</div>
                                            <div className="font-semibold text-xl mr-4">WINS :</div>
                                            <div className='text-lg'>{dataGame?.win}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className='text-red-400 mr-4'>▼</div>
                                            <div className="font-semibold text-xl text-gray-400 mr-4">LOSES :</div>
                                            <div className='text-lg'>{dataGame?.loose}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center mt-2">
                                    {dataGame && dataGame.achievementImageUrls.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {dataGame.achievementImageUrls.map((imageUrl, index) => (
                                                <img key={index} src={require('../img/' + imageUrl)} alt="achievement" className="w-36 h-36 mr-2" />))}
                                        </div>
                                    ) : (
                                        <div className="mt-12 mb-12 text-lg items-center justify-center">Win matches to unlock achievements 🔓 </div>
                                    )}
                                </div>
                                <div className="bg-slate-900 p-3 mt-2">
                                    <div>
                                        <div className="flex items-center space-x-2 font-semibold text-gray-900 leading-8 mb-3">
                                            <span className="text-green-400">
                                                <svg className="h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </span>
                                            <span className='text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10'>MATCH HISTORY</span>
                                        </div>

                                        <div className="match-history-scroll">
                                            <div className="inline-block min-w-full shadow rounded-lg overflow-y-auto max-h-72">
                                                <table className="min-w-full">
                                                    <tbody>
                                                        {dataUser?.matchHistory && dataUser?.name ? (
                                                            dataUser?.matchHistory?.map((match, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-2/5">
                                                                        <div className="flex items-center">
                                                                            <div className="flex-shrink-0 w-10 h-10 hidden sm:table-cell">
                                                                                <img className="h-full rounded-full"
                                                                                    src={dataUser.avatar !== null ? `data:image/png;base64,${dataUser.avatar}` : require('../img/avatar.png')}
                                                                                    alt="avatar"></img>
                                                                            </div>
                                                                            <div className="ml-3">
                                                                                <p className="text-gray-900 whitespace-no-wrap">
                                                                                    {dataUser?.name}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                                        <p className="text-gray-900 whitespace-no-wrap text-center">
                                                                            {match.scorePlayerLeft}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                                                        <p className="text-gray-900 whitespace-no-wrap text-center">
                                                                            {match.scorePlayerRight}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-2/5">
                                                                        <div className="flex items-center float-right">
                                                                            <div className="mr-3">
                                                                                <p className="text-gray-900 whitespace-no-wrap text-right">
                                                                                    {match?.userRight?.name}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex-shrink-0 w-10 h-10 hidden sm:table-cell">
                                                                                <img className="h-full rounded-full"
                                                                                    src={match?.userRight?.avatar !== null ? `data:image/png;base64,${match?.userRight?.avatar}` : require('../img/avatar.png')}
                                                                                    alt="avatar"></img>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td className="col-span-4 px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-black">
                                                                    No match history yet !
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
                    </div>
                </div>
            </div>
        </div>
    );
};
