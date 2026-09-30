import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorPage } from "@/pages/ErrorPage.tsx";
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { StartPage } from "@/pages/auth/StartPage.tsx";
import { ChooseRolePage } from '@/pages/onboarding/ChooseRolePage';


function App() {

    return (
        <div className = "container-md p-0">
            <BrowserRouter>
                <Routes>
                    <Route path = "/get-start" element={<StartPage />} />
                    <Route path = "/login" element={<LoginPage />}/>
                    <Route path = "/register" element={<RegisterPage />}/>

                    <Route path="/onboarding/role" element={<ChooseRolePage />} />
                    <Route path = "*" element={<ErrorPage code={404} />}/>
                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default App;