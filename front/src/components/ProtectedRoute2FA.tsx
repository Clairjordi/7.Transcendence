import Cookies from 'js-cookie';
import { Navigate, Outlet} from 'react-router-dom';

  export default function ProtectedRoute2FA() {
    const userName: string | undefined = Cookies.get('token');
    const dataCookie = Cookies.get('auth');    
    let login: string = '';
    let name: boolean = false;
    let twoFA: boolean = false;

    if (dataCookie) {
       ({ login, name, twoFA } = JSON.parse(dataCookie));     
    }

    return (
        <>
          {!userName && twoFA ? <Outlet /> : <Navigate to="/" replace/>}
          </>
        );
    }