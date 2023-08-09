import React from 'react';

interface PopupBlockProps {
    isBlocked: boolean;
    blocker: string;
}

export const Block: React.FC<PopupBlockProps> = ({ isBlocked, blocker }) => {

    return (
        <div className="popup fixed top-0 left-0 w-full h-full z-50 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="popup-content">
                <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
                    <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                        <div className="relative px-4 py-10 bg-slate-950 mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
                            <div className="max-w-md mx-auto">
                                <div className="flex items-center space-x-5">
                                    <div className="h-14 w-14 bg-slate-700 rounded-full flex justify-center items-center">
                                        {isBlocked ? (
                                            "🚫"
                                        ) : (
                                            <img src={require('../../img/unblock.png')} alt="Unblocked" />
                                        )}</div>
                                    <div className="block pl-2 font-semibold text-xl self-start text-gray-700">
                                        <p className="leading-relaxed text-white mt-2">
                                        {isBlocked ? (
                                            "Block"
                                        ) : (
                                            "UnBlock"
                                        )}</p>

                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    <div className="py-4 text-base mt-2 leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                        <div className="flex flex-col">
                                            <label className="leading-loose text-white">
                                            {isBlocked ? (
                                            `You have been blocked by ${blocker}`
                                        ) : (
                                            `${blocker} has unblocked you`
                                        )}</label>                                                
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