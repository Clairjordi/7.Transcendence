import React, { ChangeEvent, useEffect, useMemo, useState, KeyboardEvent, useRef } from 'react';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import ChatResearchUser from './ChatResearchUser';
import API from '../../components/api';
import PopupChannel from './AddChanel';
import NameInvitePrivateChannel from './NameInvitePrivateChannel';
import SetPasswordChanExist from './SetPasswordChanExist';
import SetPasswordChanProtected from './SetPasswordChanProtected';
import { PrivateChannelForbidden } from './PrivateChannelForbidden';
import { Block } from './Block';
import { AvatarModify } from './AvatarModify';

interface Message {
  id: number,
  name: string,
  createdAt: string,
  text: string
  invite: string,
  validityLink: boolean,
}

interface DataOtherUser {
  name: string,
  status: string,
  avatar: string,
  role: 'owner' | 'admin' | 'user' | 'directMessage';
}

interface DataUsersDM {
  name: string,
  status: string,
  avatar: string,
}

interface DataChannel {
  chanName: string,
  status: string,
  password: string,
}

interface BlockData {
  isBlocked: boolean,
  blocker: string,
}

export const Chat = () => {
  const [isDropdownOpenUsers, setIsDropdownOpenUsers] = useState(false);
  const [isDropdownOpenChannels, setIsDropdownOpenChannels] = useState(false);
  const [openDropdownMembers, setOpenDropdownMembers] = useState<number[]>([]); //menu deroulant user liste members
  const [isPopupOpen, setIsPopupOpen] = useState(false); //pop up create channel
  const [isPopupPrivateChanOpen, setIsPopupPrivateChanOpen] = useState(false); // pop up donner le nom de l'invite du channel prive
  const [isPopupPrivateForbiddenOpen, setIsPopupPrivateForbiddenOpen] = useState(false); //pop up interdiction de rejoindre un channel prive sans invitation
  const [block, setBlock] = useState<BlockData>(); //pop up block/unblock
  const [isPopupPasswordOpen, setIsPopupPasswordOpen] = useState(false); //pop up set le pass du channel protected
  const [chanNameForSetPassword, setChanNameForSetPassword,] = useState<string>(''); //stockage du password pour pop up 

  const [isPopupSetPasswordChanExist, setIsPopupSetPasswordChanExist] = useState(false); //pop up set le password channel existant

  const [users, setUsers] = useState<DataOtherUser[]>([]);// donne tous les users a part toi meme pour research
  const [channels, setChannels] = useState<string[]>([]); // donne tous les channels a part DM pour research
  const [DMUserName, setDMUserName] = useState<string>(''); //retour du research, quel DM a ete selectionne
  const [channelName, setChannelName] = useState<string>(''); //retour du research, quel channel a ete selectionne

  const [DMusersData, setDMUsersData] = useState<DataUsersDM[]>([]); //informations (nom, avatar...) user de la liste de DM
  const [channelNamesData, setChannelNamesData] = useState<DataChannel[]>([]); // informations (nom, status...) chan de la liste de channel

  const [chanData, setChanData] = useState<DataChannel>(); //pour affichage nom du channel dans l'en-tete + donnees du channel en cours
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);  //contient tous les messages d'un channel
  const [messageText, setMessageText] = useState<string>(''); //ce qui a ete recupere dans l'input du send  //sendmessages value

  const [channelMembers, setChannelMembers] = useState<DataOtherUser[]>([]); //informations (nom, avatar...) user de la liste des membres
  const [userStatusInChannel, setUserStatusInChannel] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [usersBlocked, setUsersBlocked] = useState<string[]>([]);

  const nameUser = Cookies.get('token')!;
  const socketChat = useMemo(() => io('http://localhost:3001/chat', { query: { nameUser } }), [nameUser]); // recuperation du name lors de la connection
  const socketUser = useMemo(() => io('http://localhost:3001/user'), []);

  const mainDivRef = useRef<HTMLDivElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  //close the drop-down list when you click on anything other than the button
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {

      if (mainDivRef.current && !mainDivRef.current.contains(event.target as Node)) {
        setOpenDropdownMembers([]);
      }
    }
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  //RealTime message, block, remove DM et channel, join channel, searchList, mute, kick, ban
  useEffect(() => {
    socketChat.on('message created', (message: Message, channelName: string) => {
      if (channelName === chanData?.chanName) {
        const data = { nameUser: nameUser, messageName: message.name }
        socketChat.emit('messageBlocked', data);
        socketChat.once('statusMessageBlocked', (status: boolean) => {
          if (status === true) {
            const messageBlocked = {
              id: message.id,
              name: message.name,
              createdAt: message.createdAt,
              text: "content of this msg is blocked",
              invite: message.invite,
              validityLink: message.validityLink,
            }
            setChannelMessages((prevMessages) => [...prevMessages, messageBlocked]);
          }
          else {
            setChannelMessages((prevMessages) => [...prevMessages, message]);
          }
        })
      }
    })

    //block - adding or removing blocked users
    socketChat.on('userBlocked', (userBlocked: string, status: boolean) => {
      if (status === true) {
        setUsersBlocked((prevuserBlocked) => [...prevuserBlocked, userBlocked]);
      }
      else {
        const updatedBlockedUsers = usersBlocked.filter((user) => user !== userBlocked);
        setUsersBlocked(updatedBlockedUsers);
      }
      if (chanData?.chanName !== undefined && channels.includes(chanData.chanName)) {
        socketChat.emit('getChannelMessages', { userName: nameUser, chanName: chanData?.chanName });
        socketChat.once('getChannelMessages', (tabMessage: Message[]) => {
          setChannelMessages(tabMessage);
        });
      }
      else {
        const data = { userName1: nameUser, userName2: userBlocked };
        socketChat.emit('getDMChannelMessages', data);
        socketChat.once('getDMChannelMessages', (tabMessage: Message[]) => {
          setChannelMessages(tabMessage);
        });
      }
    })

    //block - message when you have been blocked
    socketChat.on('popUpBlocked', (isBlocked: boolean, blocker: string,) => {
      const data = {
        isBlocked: isBlocked,
        blocker: blocker,
      }
      setBlock(data);


      setTimeout(() => {
        setBlock(undefined);
      }, 2000);

    })

    //quit DM
    socketChat.on('quitDMChannel', (channelName: string) => {
      if (channelName === chanData?.chanName) {
        setMessageText('');
        setChannelMembers([]);
        const messageRemove = {
          id: 0,
          name: 'Status Direct Message : ',
          createdAt: '',
          text: `${channelName} has been removed`,
          invite: '',
          validityLink: false,
        }
        setChannelMessages([messageRemove]);
        setTimeout(() => {
          setChannelMessages([]);
        }, 4000);
        setChanData(undefined);
        socketChat.emit('getCommonUsersDirectMessage', nameUser);
        socketChat.once('getCommonUsersDirectMessage', (userData: DataUsersDM[]) => {
          setDMUsersData(userData);
        });
      }
    })

    //quit channel
    socketChat.on('channelLeft', (channelName: string, message: string, status: string) => {
      if (channelName === chanData?.chanName) {
        if (status === 'quit') {
          setMessageText('');
          setChannelMembers([]);
          const messageRemove = {
            id: 0,
            name: 'Status channel :',
            createdAt: '',
            text: message,
            invite: '',
            validityLink: false,
          }
          setChannelMessages([messageRemove]);
          setTimeout(() => {
            setChannelMessages([]);
          }, 4000);
          setChanData(undefined);
        }
        if (status === 'update') {
          socketChat.emit('getChannelMembers', channelName);
          socketChat.once('listChannelMembers', (tabMember: DataOtherUser[]) => {
            setChannelMembers(tabMember);
          });
        }
      }
    })

    //join channel
    socketChat.on('refreshListMembers', (channelName: string) => {
      if (channelName === chanData?.chanName) {
        socketChat.emit('getChannelMembers', channelName);
        socketChat.once('listChannelMembers', (tabMember: DataOtherUser[]) => {
          setChannelMembers(tabMember);
        });
      }
    })

    //list channel for research
    socketChat.on('channelListRealTime', () => {
      socketChat.emit('getAllChannelNamesExceptDM');
      socketChat.once('getAllChannelNamesExceptDM', (tabChannel: string[]) => {
        setChannels(tabChannel);
      });
    })

    //mute
    socketChat.on('userMuteStatusUpdated', (isMuted: boolean, channelName: string) => {
      if (channelName === chanData?.chanName) {
        setIsMuted(isMuted);
      }
    });


    //ban
    socketChat.on('userBan', (channelName: string, message: string) => {
      if (channelName === chanData?.chanName) {
        setMessageText('');
        setChannelMembers([]);
        const messageBan = {
          id: 0,
          name: 'Status channel :',
          createdAt: '',
          text: message,
          invite: '',
          validityLink: false,
        }
        setChannelMessages([messageBan]);
        setTimeout(() => {
          setChannelMessages([]);
        }, 4000);
        setChanData(undefined);
      }
    })

    //kick
    socketChat.on('userKick', (channelName: string, userName: string, message: string) => {
      if (channelName === chanData?.chanName) {
        if (userName === nameUser) {
          setMessageText('');
          setChannelMembers([]);
          const messageKick = {
            id: 0,
            name: 'Status channel :',
            createdAt: '',
            text: message,
            invite: '',
            validityLink: false,
          }
          setChannelMessages([messageKick]);
          setTimeout(() => {
            setChannelMessages([]);
          }, 4000);
          setChanData(undefined);

        }
        else {
          socketChat.emit('getChannelMembers', channelName);
          socketChat.once('listChannelMembers', (tabMember: DataOtherUser[]) => {
            setChannelMembers(tabMember);
          });
        }
      }
    })

    return () => {
      socketChat.off('message created');
      socketChat.off('quitDMChannel');
      socketChat.off('channelLeft');
      socketChat.off('userJoinAChannel');
      socketChat.off('channelListRealTime');
      socketChat.off('userMute');
    };
  }, [nameUser, socketChat, chanData]);

  //useEffect Realtime users data
  useEffect(() => {
    const refreshData = () => {
      if (channelMembers.length !== 0) {
        if (chanData?.status !== 'directMessages') {
          socketChat.emit('getChannelMembers', chanData?.chanName);
          socketChat.once('listChannelMembers', (tabMember: DataOtherUser[]) => {
            const membersWithRoles: DataOtherUser[] = tabMember.map((member) => ({
              ...member,
              role: member.role === 'owner' ? 'owner' : member.role === 'admin' ? 'admin' : 'user',
            }));
            setChannelMembers(membersWithRoles);
          });
        }
        else {
          socketChat.emit('getChannelMembersDM', chanData?.chanName);
          socketChat.once('getChannelMembersDM', (tabMember: DataOtherUser[]) => {
            setChannelMembers(tabMember);
          });
        }
      }
    }

    socketUser.on('user modification', () => {
      refreshData();
    });

    socketUser.on('user Name modification', (data: { newName: string, oldName: string }) => {
      const { newName, oldName } = data;
      const dataToSend = { newName: newName, oldName: oldName, chanData: chanData }
      socketChat.emit('modifyChannelDM', dataToSend);
      socketChat.once('modificateNameChannelDM', (chanName: DataChannel) => {
        if (chanName) {
          setChanData(chanName);
          socketChat.emit('getChannelMembersDM', chanName.chanName);
          socketChat.once('getChannelMembersDM', (tabMember: DataOtherUser[]) => {
            setChannelMembers(tabMember);
          });

        }
        else {
          refreshData();
        }
        setData();
      })
    });

    socketUser.on('user Avatar modification', () => {
      if (chanData) {
        setAvatarLoading(true);
        window.location.reload();
      }
    })

    return () => {
      socketChat.off('user modification');
      socketUser.off('user Name modification');
      socketUser.off('user Avatar modification')

    };
  }, [socketUser, channelMembers, channelName, nameUser, chanData]);


  //UseEffect research data
  const setData = () => {
    API.get(`user/allOtherUsers/${encodeURIComponent(nameUser)}`).then(tabUser => {
      const userArray: [string, string, string][] = tabUser.data;
      const otherUserData: DataOtherUser[] = userArray.map((user) => ({
        name: user[0],
        status: user[1],
        avatar: user[2],
        role: 'user',
      }));
      setUsers(otherUserData);
    })
      .catch(error => {
        if (error) {
          console.log(error.response.data.message);
        }
      });
    socketChat.emit('getAllChannelNamesExceptDM');
    socketChat.once('getAllChannelNamesExceptDM', (tabChannel: string[]) => {
      setChannels(tabChannel);
    });
  };

  useEffect(() => {
    setData();
    return () => { };
  }, [nameUser, socketChat]);

  //check if a DM is add on list + give DM list
  useEffect(() => {
    if (DMUserName !== '') {
      const data = { userName1: nameUser, userName2: DMUserName }
      socketChat.emit('createDMChannel', data);
      setDMUserName('');
    }

    socketChat.emit('getCommonUsersDirectMessage', nameUser);
    socketChat.on('getCommonUsersDirectMessage', (userData: DataUsersDM[]) => {
      setDMUsersData(userData);
    });

    return () => {
      socketChat.off('getCommonUsersDirectMessage');
    };
  }, [DMUserName, nameUser, socketChat, DMusersData]);

  //check if a channel is add on list + give channels list
  useEffect(() => {
    if (channelName !== '') {
      socketChat.emit('getChannelData', { nameUser: nameUser, chanName: channelName });
      socketChat.once('channelData', (chan: DataChannel, partOfIt: string) => {
        if (partOfIt === 'ok for join') {
          if (chan.status === 'protected') {
            handlePopupTriggerPassword();
            setChanNameForSetPassword(channelName);
          }
          else if (chan.status === 'private') {
            setIsPopupPrivateForbiddenOpen(true)
            setTimeout(() => {
              setIsPopupPrivateForbiddenOpen(false)
            }, 2000);
          }
          else {
            const data = { userName: nameUser, chanName: channelName }
            socketChat.emit('joinChannel', data);
          }
        }
      })
      setChannelName('');
    }
    socketChat.emit('getUserChannels', nameUser);
    socketChat.on('getUserChannels', (tabChannel: DataChannel[]) => {
      setChannelNamesData(tabChannel);
    });

    return () => {
      socketChat.off('getUserChannels');
    };
  }, [channelName, nameUser, channelNamesData]);

  const handleClickSetPublic = () => {
    if (chanData?.chanName !== undefined) {
      socketChat.emit('setPublic', chanData.chanName);
    }
  }

  const handleClickRemoveChannel = (channel: string) => {
    const data = { userName: nameUser, chanName: channel }
    socketChat.emit('quitChannel', data);
  }

  const handleClickRemoveDMChannel = (user2: string) => {
    const data = { userName1: nameUser, userName2: user2 }
    socketChat.emit('quitDMChannel', data);
  }

  const handleClickBlock = (userName: string) => {
    socketChat.emit('blockUser', userName);
  }

  const handleClickKick = (userName: string) => {
    const data = { adminName: nameUser, userName: userName, chanName: chanData?.chanName }
    socketChat.emit('kickChannel', data);
  }

  const handleClickMute = (userName: string) => {
    const seconds = 20;
    const data = { adminName: nameUser, userName: userName, chanName: chanData?.chanName, durationSeconds: seconds }
    socketChat.emit('muteChannel', data);
  }

  const handleClickBan = (userName: string) => {
    const seconds = 20;
    const data = { adminName: nameUser, userName: userName, chanName: chanData?.chanName, durationSeconds: seconds }
    socketChat.emit('banChannel', data);
  }

  const handleClickSetAdmin = (userName: string) => {
    const data = { userName: userName, chanName: chanData?.chanName }
    socketChat.emit('setAdminChannel', data);
  }

  //display message + member Channel
  const handleClickChannel = (channel: DataChannel) => {
    setChanData(channel);
    socketChat.emit('getChannelMembers', channel.chanName);
    socketChat.on('listChannelMembers', (tabMember: DataOtherUser[]) => {
      setChannelMembers(tabMember);
      const memberMe = tabMember.find((member) => member.name === nameUser);
      if (memberMe)
        setUserStatusInChannel(memberMe.role)
    });

    socketChat.emit('getChannelMessages', { userName: nameUser, chanName: channel.chanName });
    socketChat.on('getChannelMessages', (tabMessage: Message[]) => {
      setChannelMessages(tabMessage);
    });

    socketChat.emit('getUsersBlocked', { nameUser: nameUser, chanName: channel.chanName });
    socketChat.on('listUsersBlocked', (usersBlocked: string[]) => {
      setUsersBlocked(usersBlocked);
    })

    return () => {
      socketChat.off('listChannelMembers');
      socketChat.off('getChannelMessages');
      socketChat.off('listUsersBlocked');
    };
  };

  //// display message + member DM
  const handleClickDM = (user2: string) => {

    socketChat.emit('getNameDMChannel', { nameUser, user2 });
    socketChat.on('nameDMChannel', (nameDMChannel: string) => {
      const dataChan = {
        chanName: nameDMChannel,
        status: 'directMessages',
        password: '',
      }
      setChanData(dataChan);
      socketChat.emit('getChannelMembersDM', nameDMChannel);
      socketChat.on('getChannelMembersDM', (member: DataOtherUser[]) => {
        setChannelMembers(member);
        if (member)
          setUserStatusInChannel(member[0].role)
      });

      socketChat.emit('getUsersBlocked', { nameUser: nameUser, chanName: nameDMChannel });
      socketChat.on('listUsersBlocked', (usersBlocked: string[]) => {
        setUsersBlocked(usersBlocked);
      })

    })

    const data = { userName1: nameUser, userName2: user2 };
    socketChat.emit('getDMChannelMessages', data);
    socketChat.on('getDMChannelMessages', (tabMessage: Message[]) => {
      setChannelMessages(tabMessage);
    });

    return () => {
      socketChat.off('getDMChannelMessages');
      socketChat.off('nameDMChannel');
      socketChat.off('getChannelMembersDM');
      socketChat.off('listUsersBlocked');
    };
  };

  //RealTime when closing the user DM list or channel button
  useEffect(() => {
    if (isDropdownOpenUsers === false || isDropdownOpenChannels === false) {
      setMessageText('');
      setChannelMembers([]);
      setChannelMessages([]);
      const data = {
        chanName: '',
        status: '',
        password: '',
      }
      setChanData(data);
      setUserStatusInChannel('');
    }

    return () => { };
  }, [isDropdownOpenUsers, isDropdownOpenChannels]);


  const toggleDropdownUsers = () => {
    setIsDropdownOpenUsers(!isDropdownOpenUsers);
  };

  const toggleDropdownChannels = () => {
    setIsDropdownOpenChannels(!isDropdownOpenChannels);

  };

  function toggleDropdownOptions(event: React.MouseEvent, index: number) {
    event.stopPropagation();
    setOpenDropdownMembers((prevState) =>
      prevState.includes(index) ? prevState.filter((item) => item !== index) : [...prevState, index]
    );
  }

  const handleChangeMessageText = (event: ChangeEvent<HTMLInputElement>) => {
    setMessageText(event.target.value);
  };

  // Send a message
  const handleClickMessageText = () => {
    if (isMuted || chanData === undefined || messageText === "")
      return;

    if (chanData?.status === 'directMessages') {
      if (chanData.chanName.includes(nameUser)) {
        const user2 = chanData.chanName.replace(nameUser, "").replace("_", "").trim();
        const data = {
          userName1: nameUser,
          userName2: user2,
          text: messageText,
        }
        socketChat.emit('createDMMessage', data);
      }
    }
    else {
      const data = {
        userName: nameUser,
        chanName: chanData?.chanName,
        text: messageText
      }
      socketChat.emit('createMessage', data);
    }
    setMessageText('');
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleClickMessageText();
    }
  };

  //use for createDMForPlay
  function escapeHtml(text: string) {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (match) => map[match]);
  }

  //DM to invite an another player to game
  const createDMForPlay = (userTowrite: string) => {
    try {
      if (nameUser !== userTowrite) {
        let data = { userName1: nameUser, userName2: userTowrite, invite: nameUser } as { userName1: string; userName2: string; text?: string };
        socketChat.emit('createDMChannel', data);
        socketChat.once('DMChannel created', () => {
          const messageText = `Play with ${nameUser}\n<a href=/gameplay/${nameUser}/invited>Click here</a>`;
          const escapedMessageText = escapeHtml(messageText);

          data = { ...data, text: escapedMessageText }
          socketChat.emit('createDMMessage', data);
          window.location.href = `/gameplay/${userTowrite}/guest`;
        })
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  // link for join a private channel
  const handleJoinChannel = (chanName: string, message: Message) => {
    if (message.validityLink === true) {
      const data = { userName: nameUser, chanName: chanName }
      socketChat.emit('joinChannel', data);
      const messageIndex = channelMessages.findIndex((msg) => msg === message);
      if (messageIndex !== -1) {
        socketChat.emit('modifyValidityLink', message);
        socketChat.on('validityLinkModified', (validityLink: boolean) => {
          channelMessages[messageIndex].validityLink = validityLink;
          setChannelMessages([...channelMessages]);
        })
      }
    }
  }

  // pop up for button 'add channel'
  const handlePopupTriggerAddChannel = () => {
    setIsPopupOpen(!isPopupOpen);
  }

  // pop up for button 'setPassword'
  const handlePopupTriggerSetPasswordChannel = () => {
    setIsPopupSetPasswordChanExist(!isPopupSetPasswordChanExist);
    if (chanData?.chanName !== undefined)
      setChanNameForSetPassword(chanData.chanName);
  }

  // pop up for button 'invite on a private channel'
  const handlePopupTriggerInvitePrivateChannel = () => {
    setIsPopupPrivateChanOpen(!isPopupPrivateChanOpen);
  }

  // pop up for button 'join a protected channel'
  const handlePopupTriggerPassword = () => {
    setIsPopupPasswordOpen(!isPopupPasswordOpen);
  }

  function OptChannel(memberName: string) {
    return [
      <div key={`setPass-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handlePopupTriggerSetPasswordChannel()}>set Password</div>,
      <div key={`remove-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickSetPublic()}>Remove Password</div>
    ];
  }

  function OptOwner(memberName: string) {
    return [
      <div key={`block-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickBlock(memberName)}>{usersBlocked.includes(memberName) ? 'Unblock' : 'Block'}</div>,
      <div key={`mute-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickMute(memberName)}>Mute</div>,
      <div key={`ban-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickBan(memberName)}>Ban</div>,
      <div key={`kick-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickKick(memberName)}>Kick</div>,
      <div key={`set-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickSetAdmin(memberName)}>Set admin</div>,
      <div key={`play-${memberName}`} className="block text-gray-200 px-4 py-2 text-sm hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => createDMForPlay(memberName)}>Play</div>,
    ];
  }

  function OptAdmin(memberName: string) {
    return [
      <>
        <div key={`block-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickBlock(memberName)}>{usersBlocked.includes(memberName) ? 'Unblock' : 'Block'}</div>,
        <div key={`mute-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickMute(memberName)}>Mute</div>,
        <div key={`ban-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickBan(memberName)}>Ban</div>,
        <div key={`kick-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickKick(memberName)}>Kick</div>,
        <div key={`play-${memberName}`} className="block text-gray-200 px-4 py-2 text-sm hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => createDMForPlay(memberName)}>Play</div>,
      </>
    ];
  }

  function OptUser(memberName: string) {
    return [
      <div key={`block-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickBlock(memberName)}>{usersBlocked.includes(memberName) ? 'Unblock' : 'Block'}</div>,
      <div key={`play-${memberName}`} className="block text-gray-200 px-4 py-2 text-sm hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => createDMForPlay(memberName)}>Play</div>,
    ];
  }

  function OptDM(memberName: string) {
    return [
      <div key={`block-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => handleClickBlock(memberName)}>{usersBlocked.includes(memberName) ? 'Unblock' : 'Block'}</div>,
      <div key={`invite-${memberName}`} className="block px-4 py-2 hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={handlePopupTriggerInvitePrivateChannel}>Invite channel</div>,
      <div key={`play-${memberName}`} className="block text-gray-200 px-4 py-2 text-sm hover:bg-slate-800 hover:text-white hover:cursor-pointer" onClick={() => createDMForPlay(memberName)}>Play</div>,
    ];
  }

  return (
    <div className="h-full w-full" >
      {avatarLoading ? (
        <div className="h-screen pt-8 p-2 bg-cover bg-fixed" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
          <AvatarModify />

        </div>
      ) : (
        <>
          {isPopupOpen && (
            <>
              <div className="popup-overlay" onClick={handlePopupTriggerAddChannel} />
              <PopupChannel nameUser={nameUser} socketChat={socketChat} setChannelNamesData={setChannelNamesData} onClose={handlePopupTriggerAddChannel} />
            </>)}
          {isPopupPrivateChanOpen && (
            <>
              <div className="popup-overlay" onClick={handlePopupTriggerInvitePrivateChannel} />
              <NameInvitePrivateChannel nameUser={nameUser} userToWrite={channelMembers} socketChat={socketChat} onClose={handlePopupTriggerInvitePrivateChannel} />
            </>)}
          {isPopupSetPasswordChanExist && (
            <>
              <div className="popup-overlay" onClick={handlePopupTriggerSetPasswordChannel} />
              <SetPasswordChanExist socketChat={socketChat} chanNameForSetPassword={chanNameForSetPassword} setChanNameForSetPassword={setChanNameForSetPassword} onClose={handlePopupTriggerSetPasswordChannel} />
            </>)}
          {isPopupPasswordOpen && (
            <>
              <div className="popup-overlay" onClick={handlePopupTriggerPassword} />
              <SetPasswordChanProtected nameUser={nameUser} socketChat={socketChat} chanNameForSetPassword={chanNameForSetPassword} setChanNameForSetPassword={setChanNameForSetPassword} onClose={handlePopupTriggerPassword} />
            </>)}
          {isPopupPrivateForbiddenOpen && (
            <>
              <PrivateChannelForbidden />
            </>)}
          {block && (
            <>
              <Block isBlocked={block.isBlocked} blocker={block.blocker} />
            </>)}

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
          <div className="flex flex-row bg-white">
            <div className="bg-slate-950 flex flex-col w-2/5">
              <div><ChatResearchUser users={users.map(user => user.name)} channels={channels} setDMUserName={setDMUserName} setChannelName={setChannelName} /></div>
              <div className="flex" style={{ borderTopWidth: '1px', borderBottomWidth: '1px' }}>
                <div className='flex w-full h-full bg-slate-950 back p-3 hover:bg-gray-900'>
                  <div className="w-2/4">
                    <div className='w-4/5 xl:w-2/5'>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="gray" className="w-full p-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                  </div>
                  <button id="dropdownChannels" data-dropdown-placement="bottom" onClick={toggleDropdownChannels} type="button" className="xl:text-lg text-md text-gray-200 font-semibold w-full flex items-center">
                    Channels
                    <svg className={`w-4 h-4 ml-2 ${isDropdownOpenChannels ? 'transform rotate-180' : ''}`} aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  <div className='w-2/5 xl:w-1/5' onClick={handlePopupTriggerAddChannel}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="gray" className="w-full p-2 hover:scale-110">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </div>
              </div>
              {isDropdownOpenChannels && (
                <div id="dropdownChannels" className="z-10 overflow-y-auto max-h-96">
                  <ul className="py-2" aria-labelledby="dropdownChannelsButton">
                    {channelNamesData.map((channel, index) =>
                      <li key={index} className="flex items-center justify-between" style={{ borderBottomWidth: '1px', cursor: 'pointer' }}>
                        <div className='flex w-full h-full bg-slate-950 back p-3 hover:bg-gray-900'>
                          <div className="w-2/4 flex items-center justify-center">
                            {channel.status === 'public' && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            )}
                            {channel.status === 'private' && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
                              </svg>
                            )}
                            {channel.status === 'protected' && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            )}
                          </div>
                          <div className="w-full flex items-center ml-5 mb-2">
                            <div>
                              <div className="text-lg text-gray-200 mt-2 font-semibold" onClick={() => handleClickChannel(channel)}>
                                {channel.chanName}</div>
                            </div>
                          </div>
                        </div>
                        <div className='w-1/5 flex items-center mb-5'>
                          <div className='' onClick={() => handleClickRemoveChannel(channel.chanName)}>{channel.chanName}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-slate-700 hover:text-slate-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {/* Private Messages */}
              <div className="flex flex-row items-center justify-between" style={{ borderBottomWidth: '1px' }}>
                <div className='flex w-full h-full bg-slate-950 back p-3 hover:bg-gray-900'>
                  <div className="w-2/4">
                    <div className='w-4/5 xl:w-2/5'>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="gray" className="w-full p-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    </div>
                  </div>
                  <button id="dropdownUsers" data-dropdown-placement="bottom" onClick={toggleDropdownUsers} type="button" className="xl:text-lg text-md text-gray-200 font-semibold w-full flex items-center">
                    Private Messages
                    <svg className={`w-4 h-4 ml-2 ${isDropdownOpenUsers ? 'transform rotate-180' : ''}`} aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  <div className='w-3/5 xl:w-1/5'></div>
                </div>
              </div>
              {isDropdownOpenUsers && (
                <div id="dropdownUsers" className="z-10 overflow-y-auto max-h-96">
                  <ul className="py-2" aria-labelledby="dropdownUsersButton">
                    {DMusersData.map((userDM, index) =>
                      <li key={index} className="flex items-center justify-between" style={{ borderBottomWidth: '1px', cursor: 'pointer' }}>
                        <div className='flex w-full h-full bg-slate-950 back p-3 hover:bg-gray-900 '>
                          <div className="w-2/4 flex items-center justify-center">
                            <div className='w-4/5 xl:w-2/5 relative mb-2'>
                              <img
                                src={userDM.avatar !== null ? `data:image/png;base64,${userDM.avatar}` : require('../../img/avatar.png')}
                                className="object-cover h-12 w-12 rounded-full" alt="avatar" />
                              <span className={`absolute w-3.5 h-3.5 ${userDM.status === 'online' ? "bg-green-400" : userDM.status === 'offline' ? 'bg-red-400' : 'bg-blue-400'} rounded-full`} style={{ bottom: '0', right: '0' }}></span>
                            </div>
                          </div>
                          <div className="w-full flex items-center ml-5 mb-2">
                            <div className="text-lg text-gray-200 font-semibold" onClick={() => handleClickDM(userDM.name)}>{userDM.name}</div>
                          </div>
                        </div>
                        <div className='w-1/5 flex items-center mb-7'>
                          <div onClick={() => handleClickRemoveDMChannel(userDM.name)}>{userDM.name}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mr-1 text-slate-700 hover:text-slate-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="w-full px-5 flex flex-col justify-between h-screen bg-cover bg-fixed overflow-hidden" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
              <div className="relative">
                <div className="absolute py-6 px-6 bg-slate-900" style={{ left: 'calc(-1.5rem)', right: 'calc(-1.5rem)' }}>
                  <p className="text-white font-semibold"> {chanData?.chanName}</p>
                </div>
                <div className="flex justify-start mt-24 mb-4">
                  <ul className="overflow-y-auto" style={{ maxHeight: '600px', minWidth: '1000px' }}>
                    {channelMessages.map((message, index) =>
                      <li key={index} >
                        <div className="ml-2 py-3 mb-5 px-4 rounded-br-3xl rounded-tr-3xl rounded-tl-xl text-black" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'grid', gridTemplateColumns: 'auto auto' }}>
                          <div className='flex items-center'>
                            <div className="text-lg font-bold text-gray-600">{message.name}</div>
                            <div className="ml-2 text-[0.6rem]" >{message.createdAt}</div>
                          </div>
                          <br></br>
                          <div className='mt-2 text-gray-800 text-sm'>{message.text.split('\n').map((line, lineIndex) => {
                            if (line.includes('&lt;a href=') && message.invite !== '') {
                              const search = line.indexOf(nameUser);
                              if (search !== -1) {
                                return (
                                  <span key={lineIndex}>{`=> you invited a person to play with you`}</span>
                                );
                              } else {
                                const linkStartIndex = line.indexOf('&lt;a href=') + 12;
                                const linkEndIndex = line.indexOf('&gt;');
                                const link = line.substring(linkStartIndex, linkEndIndex);
                                const linkText = line.substring(linkEndIndex + 4, line.lastIndexOf('&lt;/a&gt;'));
                                return (
                                  <React.Fragment key={lineIndex}>
                                    <span className="border-b-2 border-indigo-800" dangerouslySetInnerHTML={{ __html: `<a href="${link}">${linkText}</a>` }} />
                                    <br />
                                  </React.Fragment>
                                );
                              }
                            }
                            else if (line.includes('Click for join Channel') && message.invite !== '') {
                              const search = line.indexOf(message.invite);
                              if (message.invite === nameUser || search !== -1) {
                                return (
                                  <span key={lineIndex}>{`=> you invited a person to join a private Channel`}</span>
                                );
                              } else {
                                const channelNameStartIndex = line.indexOf(':') + 2;
                                const channelName = line.substring(channelNameStartIndex);
                                const newLine = line.substring(0, channelNameStartIndex - 2);
                                return (
                                  <span
                                    key={lineIndex}
                                    className="cursor-pointer text-blue-500 underline"
                                    onClick={() => handleJoinChannel(channelName, message)}>
                                    {newLine}
                                  </span>
                                )
                              }
                            } else {
                              return (
                                <React.Fragment key={lineIndex}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              );
                            }
                          })}</div>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="py-5 relative">
                <input className="w-full bg-gray-100 py-5 px-3 rounded-xl pr-12" type="text" placeholder={isMuted ? "You are muted. Cannot send messages for the moment." : "Write your message"} value={messageText} onChange={handleChangeMessageText} onKeyDown={handleKeyPress} disabled={isMuted} />
                <button className="absolute right-2 top-7 h-fit bg-slate-700 hover:bg-slate-600 transition duration-500 ease-in-out rounded-lg px-4 py-3 flex items-center justify-center" type="button" onClick={handleClickMessageText}>
                  <span className="font-bold text-white">Send</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 ml-2 transform rotate-90">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-slate-950 p-0.5 flex flex-col w-2/5">
              <div className="border-b-1 py-4 px-2">
                <div className="text-lg text-gray-200 font-semibold py-1 px-2 w-full">MEMBERS</div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '800px' }}>
                <ul >
                  {channelMembers.map((member, index) =>
                    <li key={index} className='relative overflow-visible' style={{ scrollbarWidth: 'thin', scrollbarColor: 'black #1f2937' }}>
                      <div className="flex flex-row items-center justify-between" style={{ borderTopWidth: '1px', borderBottomWidth: '1px' }}>
                        <div className='flex w-full h-full bg-slate-950 p-3'>
                          <div className="w-2/4">
                            <div className='w-4/5 xl:w-2/5 relative'>
                              <img
                                src={member.avatar !== null ? `data:image/png;base64,${member.avatar}` : require('../../img/avatar.png')}
                                className="object-cover h-12 w-12 rounded-full" alt="avatar" />
                              <span className={`absolute w-3.5 h-3.5 ${member.status === 'online' ? "bg-green-400" : member.status === 'offline' ? 'bg-red-400' : 'bg-blue-400'} rounded-full`} style={{ bottom: '0', right: '0' }}></span>
                            </div>
                          </div>
                          <div className="xl:w-full w-1/2 flex items-center">
                            <a href={`/public/${member.name}`} className={`text-lg font-semibold ${member.role === 'owner' ? 'text-sky-600' : member.role === 'admin' ? 'text-violet-400' : 'text-gray-200'}`}>
                              {member.name}
                            </a>
                          </div>
                        </div>
                        <div ref={mainDivRef}>
                          <button id="dropdownMenuIconButton" data-user-index={index} data-dropdown-toggle="dropdownDots" onClick={(e) => toggleDropdownOptions(e, index)} className="relative items-center p-2 text-sm font-medium text-center rounded-lg text-white bg-slate-950 hover:bg-gray-900" type="button">
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                              <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                            </svg>
                          </button>
                        </div>
                        {openDropdownMembers.includes(index) && (
                          <div id="dropdownDots" className="z-50 overflow-visible absolute top-[23%] right-[7%] divide-y rounded-lg shadow w-40 bg-slate-900 divide-gray-600">
                            <ul className="py-2 text-sm text-gray-200" aria-labelledby="dropdownMenuIconButton">
                              {userStatusInChannel === 'owner' && member.name === nameUser && OptChannel(member.name)}
                              {userStatusInChannel === 'owner' && member.name !== nameUser && OptOwner(member.name)}
                              {userStatusInChannel === 'admin' && member.name !== nameUser && OptAdmin(member.name)}
                              {userStatusInChannel === 'user' && member.name !== nameUser && OptUser(member.name)}
                              {userStatusInChannel === 'directMessage' && member.name !== nameUser && OptDM(member.name)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
