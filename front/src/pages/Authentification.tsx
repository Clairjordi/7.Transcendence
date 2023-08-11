export const Authentification = () => {
  return (
    <div className="min-h-screen bg-cover bg-fixed bg-deep-purple-accent-700" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
      <div className="sm:py-48 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-56">
        <div className="relative">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-25"></div>
          <div className="relative p-16">
            <div className="max-w-xl sm:mx-auto lg:max-w-2xl">
              <div className="flex flex-col mb-16 sm:text-center sm:mb-0">
                <div className="mb-6 sm:mx-auto">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-accent-400">
                    <img className="animate-bounce mb-6 sm:mx-auto" src="https://cdn-icons-png.flaticon.com/512/124/124192.png?w=740&t=st=1685722552~exp=1685723152~hmac=bcca0db486328e055ad0e1bdd65d57eeee13e21f87c364269c115d8ecf3a26fb" alt="ping-pong" />
                  </div>
                </div>
                <div className="max-w-xl mb-10 md:mx-auto sm:text-center lg:max-w-2xl md:mb-12">
                  <h2 className="max-w-lg mb-6 font-sans text-3xl font-bold leading-none tracking-tight text-white sm:text-4xl md:mx-auto">
                    <span className="relative">Start your journey on TRANSCENDENCE</span>
                  </h2>
                  <p className="text-base text-indigo-100 md:text-lg">
                    Became the Master of Pong Game !
                  </p>
                </div>
                <div>
                  <button className="group relative h-12 w-48 overflow-hidden rounded-lg bg-teal-500 text-lg shadow">
                    <div className="absolute inset-0 w-3 bg-white transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                    <a href="https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-948bb2bad23c6e2d58763655bddb9336385afdcd8825fda37610805fdcc9d8f1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fhome&response_type=code" className="relative text-white group-hover:text-gray-800">LOGIN</a>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}  