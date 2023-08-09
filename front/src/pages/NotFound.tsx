function UnknownPage() {
  return (
<div className="h-screen flex items-center justify-center bg-cover bg-fixed overflow-hidden" style={{ backgroundImage: "url('https://raw.githubusercontent.com/tailwindtoolbox/Rainblur-Landing-Page/main/header.png')" }}>
  <img className="w-[15%] mr-80 animate-spin-slow " src={require('../img/lost.png')} alt="notfound"></img>
  <img className="w-1/6" src={require('../img/404.png')} alt="404"></img>
  <style>
    {`
      @keyframes spin-slow {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .animate-spin-slow {
        animation: spin-slow 8s linear infinite;
      }
    `}
  </style>
</div>
  );
}

export default UnknownPage;