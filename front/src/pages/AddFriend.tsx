import Cookies from "js-cookie";
import { FormEvent, useEffect, useMemo, useState } from "react";
import API from '../components/api';
import { io } from "socket.io-client";

interface dataUser {
    name: string,
    status: string,
    avatar: string
}

interface dataUserFiltered {
    name: string,
    status: string,
    avatar: string
}

function AddFriend() {
    const [users, setUsers] = useState<dataUser[]>([]);
    const [usersFiltered, setUserFiltered] = useState<dataUserFiltered[]>([]);
    const userName: string = Cookies.get('token') || '';
    const socketUser = useMemo(() => io('http://localhost:3001/user'), []);

    socketUser.once('user Name modification', () => {
        window.location.reload();
    })

    socketUser.once('user Avatar modification', () => {
        window.location.reload();
    })

    socketUser.once('user modification', () => {
        window.location.reload();
    })

    const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const searchValue = (form.elements.namedItem("default-search") as HTMLInputElement)?.value;
        event.currentTarget.reset();
        if (searchValue === "") {
            setUserFiltered([]);
        }
        else {
            const resultSearchUser = users.filter(user => user.name.toLowerCase().startsWith(searchValue.toLowerCase()));
            setUserFiltered(resultSearchUser);
        }
    };

    const addSubmit = (userToAdd: string) => {
        const data = {
            name: userToAdd,
        }
        API.post(`user/addFriend/${encodeURIComponent(userName)}`, data).then(() => {
            API.get(`user/allOtherUsersWithoutFriends/${encodeURIComponent(userName)}`).then(response => {
                const userArray: any[][] = response.data;
                const userData: dataUser[] = userArray.map((user) => ({
                    name: user[0],
                    status: user[1],
                    avatar: user[2]
                }));
                setUsers(userData);
                setUserFiltered(userData);
                socketUser.emit('user modify');
            })
        })
            .catch(error => {
                if (error) {
                    console.log(error.response.data.message);
                }
            });
    }

    useEffect(() => {
        API.get(`user/allOtherUsersWithoutFriends/${encodeURIComponent(userName)}`).then(response => {
            const userArray: any[][] = response.data;
            const userData: dataUser[] = userArray.map((user) => ({
                name: user[0],
                status: user[1],
                avatar: user[2]
            }));
            setUsers(userData)
        })
            .catch(error => {
                if (error) {
                    console.log(error.response.data.message);
                }
            });

        return () => {
        };
    }, [userName]);

    return (
        <div className="h-screen pt-8 p-2 bg-cover bg-fixed" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
            <div className=" w-[85%] mx-auto">
                <div className="p-2">
                    <form onSubmit={handleFormSubmit}>
                        <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">Search</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input type="search"
                                id="default-search"
                                className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Write nickname..." />
                            <button type="submit"
                                className="text-white absolute right-2.5 bottom-2.5 bg-slate-700 hover:bg-slate-800 focus:ring-1 focus:outline-none focus:ring-slate-500 font-medium rounded-lg text-sm px-4 py-2">
                                SEARCH
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="mt-8 mb-8 w-[90%] mx-auto">
                <div className="grid grid-cols-4 gap-4">
                    {usersFiltered.length > 0 ? (
                        usersFiltered.map((userFiltered, index) => (
                            <div key={index} className="rounded-lg shadow bg-gray-800 p-2">
                                <div className="flex flex-col items-center pb-5">
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="flex items-center">
                                            <img className="w-32 h-32 mt-5 rounded-full"
                                                src={userFiltered.avatar !== null ? `data:image/png;base64,${userFiltered.avatar}` : require('../img/avatar.png')}

                                                alt="avatar" />
                                            <h5 className="ml-1 mt-5 text-xl font-medium text-gray-200">{userFiltered.name}</h5>
                                        </div>
                                        <div className="flex mt-4 ml-16 space-x-3 md:mt-4">
                                            <button className="inline-flex items-center px-5 py-2 text-sm font-medium text-center text-white bg-slate-500 rounded-lg hover:bg-slate-600" onClick={() => addSubmit(userFiltered.name)}>
                                                Add +
                                            </button>
                                            <a href={`/public/${userFiltered.name}`} className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-950 bg-gray-100 rounded-lg hover:bg-gray-300">Profil</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        users.length > 0 ? (
                            users.map((user, index) => (
                                <div key={index} className="rounded-lg shadow bg-gray-800 p-2">
                                    <div className="flex flex-col items-center pb-5">
                                        <div className="flex flex-row items-center justify-between">
                                            <div className="flex items-center">
                                                <img className="w-32 h-32 mt-5 rounded-full"
                                                    src={user.avatar !== null ? `data:image/png;base64,${user.avatar}` : require('../img/avatar.png')}

                                                    alt="avatarUsers" />
                                                <h5 className="ml-1 mt-5 text-xl font-medium text-gray-200">{user.name}</h5>
                                            </div>
                                            <div className="flex mt-4 ml-16 space-x-3 md:mt-4">
                                                <button className="inline-flex items-center px-5 py-2 text-sm font-medium text-center text-white bg-slate-500 rounded-lg hover:bg-slate-600" onClick={() => addSubmit(user.name)}>
                                                    Add +
                                                </button>
                                                <a href={`/public/${user.name}`} className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-950 bg-gray-100 rounded-lg hover:bg-gray-300">Profil</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            null
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddFriend;