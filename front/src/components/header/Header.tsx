function Header() {
  return (
    <div className="bg-gray-100 font-sans w-full min-h m-0">
      <div className="bg-black shadow">
        <div className="container mx-auto px-50">
          <div className="flex items-center justify-between py-6">
            <div className="flex flex-shrink-0 items-center">
              <a href="/home"><img className="h-14 w-auto" src="https://cdn6.aptoide.com/imgs/b/6/3/b63c95e4f77e64717f00e588b19812f7_icon.png" alt="logo" /></a>
            </div>

            <div className="hidden sm:flex sm:items-center">
              <a href="/home" className="text-white text-lg font-semibold hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 hover:scale-110 mr-10">HOME</a>
              <a href="/private" className="text-white text-lg font-semibold hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10 hover:scale-110">PROFILE</a>
              <a href="/chat" className="text-white text-lg font-semibold hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 mr-10 hover:scale-110">CHAT</a>
              <a href="/game" className="text-white text-lg font-semibold hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r from-green-400 via-pink-500 to-purple-500 hover:scale-110">GAME</a>
            </div>

            <div className="hidden sm:flex sm:items-center">
              <button className="group relative text-white text-sm font-semibold border px-4 py-2 rounded-lg overflow-hidden rounded-lg text-lg hover:bg-red-500 hover:border-red-500 hover:text-black hover:scale-90 transform transition-all duration-250 ease-out">
                <div className="absolute inset-0 w-0 bg-red-500 transition-all duration-250 ease-out group-hover:w-full"></div>
                <a href="/logout" className="relative text-white hover:text-black">LOGOUT</a>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;