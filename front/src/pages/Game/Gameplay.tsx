import { GameClassic } from "./ClassGameClassic";
import { MouseEvent, useEffect, useState } from 'react';
import { useRef } from "react";
import { useParams } from 'react-router-dom';

export const Gameplay = () => {
    const [exitGame, setExit] = useState(0);
    const [endGame, setEnd] = useState(0);
    const [namePlayer, setNamePlayer] = useState(['', '']);
    const { otherPlayer, statusReceived } = useParams();
    const gameref = useRef<HTMLCanvasElement | null>(null);
    var gameplayref = useRef<GameClassic | null>(null);
    let status: string = '';

    if (!statusReceived)
        status = '';
    else
        status = statusReceived;
    useEffect(() => {
        if (!gameplayref.current && otherPlayer) {
            gameplayref.current = new GameClassic(gameref, otherPlayer, status, setExit, setEnd, setNamePlayer);
        }
        return () => {
            gameplayref.current?.cleanGame();
        };
    }, []);

    const crossExit = (e: MouseEvent) => {
        gameplayref.current?.clickHandler(e);
    };

    return (

        <div className="h-screen bg-black flex flex-col items-center justify-center">
        <div className="grid grid-cols-3">
        <div className="flex items-center justify-start">
            <img src={require('../../img/fighter1.png')}></img>
        </div>
        <div className="flex items-center justify-center">
        <p className="text-white">
            {otherPlayer !== 'noMatchMaking' && namePlayer[1] === 'Waiting ...' ? (
                <>
                <span className="font-bold ml-36 mr-36">Waiting for {otherPlayer} ...</span>
                </>
            ) : (
                <>
                <span className="font-bold">{namePlayer[0]}</span>
                <span className="text-gray-300 text-xl ml-36 mr-36"> VS </span>
                <span className="font-bold">{namePlayer[1]}</span>
                </>
            )}
            </p>
        </div>
        <div className="flex items-center justify-end">
            <img src={require('../../img/fighter2.png')}></img>
        </div>
        </div>
            <div className="p-2 bg-black">
                <div className="p-1.5 bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 w-auto m-auto overscroll-contain" style={{ height: '100%', position: 'relative' }}>
                    {exitGame === 1 && <div className="absolute" style={{ top: '20%' }}>
                        <div className='z-10 relative'>
                            <img className="rounded-full w-1/5 m-auto" src={require('../../img/win.jpg')} alt="Win"></img>
                        </div>
                    </div>}
                    {exitGame === 2 && <div className="absolute" style={{ top: '20%' }}>
                        <div className='z-10 relative'>
                            <img className="rounded-full w-1/5 m-auto" src={require('../../img/lose.jpg')} alt="Lose"></img>
                        </div>
                    </div>}
                    {exitGame === 3 && <div className="absolute" style={{ top: '20%' }}>
                        <div className='z-10 relative'>
                            <img className="rounded-full w-1/5 m-auto" src={require('../../img/left.jpg')} alt="Lose"></img>
                        </div>
                    </div>}
                    <div className="absolute h-[95.5%] md:h-[97.5%] xl:h-[98.5%] w-1/2 border-r-4 border-dashed border-white">
                        {endGame === 1 && <div className="absolute top-2/3" style={{ left: '85%', transform: 'translateX(-80%)' }}>
                            <button onClick={gameplayref.current?.clickRetry} className="text-white text-sm bg-slate-800 font-semibold px-4 py-2 rounded-lg hover:scale-110">
                                RETRY
                            </button>
                        </div>}
                    </div>
                    <div className="float-right w-1/2">
                        <button className="text-white absolute top-2 right-4 text-2xl font-extrabold hover:text-red-500 hover:scale-125" onClick={crossExit}>
                            X
                        </button>
                        {endGame === 1 && <div className="absolute top-[65.6%] xl:top-[66.3%]" style={{ right: '42%', transform: 'translateX(80%)' }}>
                            <button onClick={gameplayref.current?.clickHandler} className="text-white text-sm bg-slate-800 font-semibold px-4 py-2 rounded-lg hover:scale-110">
                                QUIT
                            </button>
                        </div>}
                    </div>
                    <canvas className=" bg-black w-[100%] flex flex-wrap overflow-auto overscroll-contain m-auto" width={1500} height={700} ref={gameref} />
                </div>
            </div>
        </div>
    );
};