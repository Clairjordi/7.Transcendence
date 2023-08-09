import Cookies from 'js-cookie';
import { Navigate, Outlet} from 'react-router-dom';
import Header from './header/Header';

  export default function ProtectedRoutes() {
    const userName: string | undefined = Cookies.get('token');

    const isHeaderVisible = (pathname: string) => {
      const visiblePaths = ['/home', "/public", "/private", "/addfriend", "/chat", "/chatuser", "/game"];
      
      if (visiblePaths.includes(pathname) || pathname.startsWith('/public/')) {
        return true;
      }
      return false;
    };

    const pathname = window.location.pathname;
    const shouldDisplayHeader = isHeaderVisible(pathname);

    return (
      <>
        {shouldDisplayHeader && <Header />}
        {userName ? <Outlet /> : <Navigate to="/"  replace/>}
        </>
      );
}