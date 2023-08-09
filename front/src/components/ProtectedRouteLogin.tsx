import Cookies from 'js-cookie';
import { Navigate, Outlet} from 'react-router-dom';;

export default function ProtectedRouteLogin() {
    const dataCookie = Cookies.get('auth');    
    let login: string = '';
    let name: boolean = false

    if (dataCookie) {
       ({ login, name } = JSON.parse(dataCookie));     
    }
    
    return (
      <>
        {login && name === false ? <Outlet /> : <Navigate to="/" replace/>}
        </>
      );
}