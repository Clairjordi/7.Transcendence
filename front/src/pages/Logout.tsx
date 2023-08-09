import Cookies from 'js-cookie';
import { useEffect, useMemo } from "react";
import API from '../components/api';
import { io } from 'socket.io-client';

export const Logout = () => {
  const socketUser = useMemo(() => io('http://localhost:3001/user'), []);
  
  useEffect(() => {
    const token = Cookies.get('token');
    if (token){
      API.put(`user/logout/${encodeURIComponent(token)}`)
    }

    socketUser.emit('user modify');

    Cookies.remove('token');
    Cookies.remove('auth');

    setTimeout(() => {
      window.location.href = '/';
    }, 100); 
  }, [socketUser]);

  return (
      <div></div>
  );
};
  