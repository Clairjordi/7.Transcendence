import axios from 'axios';
import Cookies from 'js-cookie';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

export const DoubleAuth = () => {
    
    const [pincode, setPincode] = useState(['', '', '', '', '', '']);
    const [formStatus, setFormStatus] = useState(null);

    const location = useLocation();

    const urlName = new URLSearchParams(location.search);
    const usrName = urlName.get('name');
    const socketUser = useMemo(() => io('http://localhost:3001/user'), []);

    const handlePincodeChange = (index: number, value: string) => {
        setPincode((prevPincode) => {
            const newPincode = [...prevPincode];
            newPincode[index] = value;
            return newPincode;
        });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const code = pincode.join('');

        try {
            const response = await axios.post('http://localhost:3001/auth/verify', { code, usrName });
            if (response.status === 201) {
                if (usrName){
                    const tokenrelog = Cookies.set('token', usrName);
                    if (tokenrelog){
                      await axios.put('http://localhost:3001/auth/relog',  { name: usrName })
                    }
                    socketUser.emit('user modify');

                    window.location.href = '/home';
                }
            } else {
              alert('Two-factor code verification failed');
            }
          } catch (error) {
            console.error('Error verifying two-factor code:', error);
            alert('Two-factor code verification failed');

          }

        setPincode(['', '', '', '', '', '']);
        setFormStatus(null);
    };

    return (

        <div className="min-h-screen bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
            <div className="sm:py-56 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-56">
                <div className="relative">
                    <div className="absolute inset-0 bg-gray-500 bg-opacity-25"></div>
                    <div className="relative p-16">
                        <div className="max-w-xl sm:mx-auto lg:max-w-2xl">
                            <div className="flex flex-col mb-16 sm:text-center sm:mb-0">
                                <div className="mb-6 sm:mx-auto">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-accent-400">
                                        <img className="animate-bounce mb-6 sm:mx-auto" src="https://cdn-icons-png.flaticon.com/512/7380/7380525.png" alt="2fa" />
                                    </div>
                                </div>
                                <form id="form" onSubmit={handleSubmit} className="p-1">
                                    <div className="max-w-xl mb-6 md:mx-auto sm:text-center lg:max-w-2xl md:mb-8">
                                        <h2 className="max-w-lg mb-2 font-sans text-3xl font-bold leading-none tracking-tight text-white sm:text-4xl md:mx-auto">
                                            <span className="relative">2FA Authentication</span>
                                        </h2>
                                        <p className="text-base text-indigo-100 md:text-lg">
                                            Enter 6-digit code from your authenticator app
                                        </p>
                                    </div>
                                    <div className={`form__group ${formStatus === 'success' ? 'form__group--success' : ''} ${formStatus === 'error' ? 'form__group--error' : ''}`}>
                                        <div className="flex justify-center">
                                            {pincode.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    type="tel"
                                                    name={`pincode-${index + 1}`}
                                                    maxLength={1}
                                                    pattern="[\d]*"
                                                    tabIndex={index + 1}
                                                    placeholder="*"
                                                    autoComplete="off"
                                                    value={digit}
                                                    onChange={(e) => handlePincodeChange(index, e.target.value)}
                                                    className="w-1/12 h-12 text-xl text-center border-b-2 border-white focus:outline-none"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" className="button button--primary group relative h-12 w-48 overflow-hidden rounded-lg bg-teal-500 text-lg shadow mt-8" disabled={pincode.join('').length !== 6}>
                                        <div className="absolute inset-0 w-3 bg-white transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                                        <p className="relative text-white group-hover:text-gray-800">CONTINUE</p>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};