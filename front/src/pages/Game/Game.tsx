
export const Game = () => {

    return (

        <div className="relative h-full overflow-y-hidden">
            <div className="flex h-screen justify-center items-center bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
                <div className="container sm:px-6 xl:px-44 w-full">
                    <div className="flex flex-col jusitfy-center items-center space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 w-full">
                            <div className="relative group flex justify-center items-center h-full w-full">
                                <img className="object-center object-cover h-full w-full" src={ require('../../img/original.png' )} alt="girl-image" />
                                <button className="mb-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 bottom-4 z-10 absolute text-base font-medium leading-none text-gray-800 py-3 w-36 bg-white">
                                   <a href="gameplay/noMatchMaking"className="text-black text-lg font-semibold hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 hover:scale-110">ORIGINAL</a>
                                </button>
                                <div className="mb-10 absolute opacity-0 group-hover:opacity-100 transition duration-500 bottom-3 py-6 z-0 px-20 w-36 bg-white bg-opacity-50" />
                            </div>
                            <div className="relative group justify-center items-center h-full w-full border-l-4 border-dashed border-white hidden lg:flex">
                                <img className="object-center object-cover h-full w-full" src={ require('../../img/custom.png' )} alt="girl-image" />
                                <button className="mb-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 bottom-4 z-10 absolute text-base font-medium leading-none text-gray-800 py-3 w-36 bg-white">
                                   <a href="custom/noMatchMaking" className="text-black text-lg font-semibold hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 hover:scale-110">CUSTOM</a>
                                </button>
                                <div className="mb-10 absolute opacity-0 group-hover:opacity-100 transition duration-500 bottom-3 py-6 z-0 px-20 w-36 bg-white bg-opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    );
}