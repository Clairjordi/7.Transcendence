import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Public } from "./pages/Public";
import { Private } from "./pages/Private";
import { Chat } from "./pages/Chat/Chat";
import { Game } from "./pages/Game/Game";
import Header from "./components/header/Header";
import UnknownPage from "./pages/NotFound";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Logout } from "./pages/Logout";
import { Gameplay } from "./pages/Game/Gameplay";
import { Custom } from "./pages/Game/Custom";
import ProtectedRoutes from "./components/ProtectedRoutes";
import { Authentification } from './pages/Authentification';
import AddFriend from "./pages/AddFriend";
import { DoubleAuth } from "./pages/2fa";
import ProtectedRouteLogin from "./components/ProtectedRouteLogin";
import ProtectedRoute2FA from "./components/ProtectedRoute2FA";

const isHeaderVisible = (pathname: string) => {
  const visiblePaths = ['/home'];
  
  if (visiblePaths.includes(pathname)) {
    return true;
  }
  return false;
};

function App() {
  return (
      <Router>
        {isHeaderVisible(window.location.pathname) && <Header />}
        <Routes>
          <Route path="/" element={<Authentification />} />
          <Route path="*" element={<UnknownPage />} />
          <Route path="/home" element={<Home />} />
          <Route element={<ProtectedRoute2FA />} >
            <Route path="/2fa" element={< DoubleAuth />} />
          </ Route>
          <Route element={<ProtectedRouteLogin />} >
            <Route path="/login" element={<Login />} />   
          </ Route>
          <Route element={<ProtectedRoutes />} >          
            <Route path="/public/:userName" element={<Public />} />
            <Route path="/private" element={<Private />} />
            <Route path="/addfriend" element={<AddFriend />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/game" element={<Game />} />
            <Route path="/gameplay/:otherPlayer/:statusReceived?" element={<Gameplay />} />
            <Route path="/custom/:otherPlayer/:statusReceived?" element={<Custom />} />
            <Route path="/logout" element={<Logout />} />
          </ Route>
        </Routes>
      </Router>
  );
}

export default App;