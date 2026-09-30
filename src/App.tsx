import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorPage } from "@/pages/ErrorPage.tsx";
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { StartPage } from "@/pages/auth/StartPage.tsx";
import { ChooseRolePage } from '@/pages/onboarding/ChooseRolePage';
import { DiaryProfileSetupPage } from '@/pages/onboarding/diaryProfile/DiaryProfileSetupPage';
import {ChooseScenarioPage} from "@/pages/onboarding/diaryProfile/ChooseScenarioPage.tsx";
import {LogoutPage} from "@/pages/auth/LogoutPage.tsx";


function App() {

    return (
        <div className = "container-md p-0">
            <BrowserRouter>
                <Routes>
                    <Route path = "/get-start" element={<StartPage />} />
                    <Route path = "/login" element={<LoginPage />}/>
                    <Route path = "/register" element={<RegisterPage />}/>
                    <Route path = "/logout" element={<LogoutPage />}/>

                    <Route path="/onboarding/role" element={<ChooseRolePage />} />
                    <Route path="/onboarding/scenario" element={<ChooseScenarioPage />} />
                    <Route path="/onboarding/profile-setup" element={<DiaryProfileSetupPage />} />

                    <Route path="/diary" element={<DiaryHomePage />} />
                    <Route path="/diary/relations" element={<DiaryHomePage />} />
                    <Route path="/diary/stats" element={<DiaryHomePage />} />
                    <Route path="/diary/profile" element={<DiaryHomePage />} />
                    <Route path="/diary/settings" element={<DiaryHomePage />} />

                    <Route path = "*" element={<ErrorPage code={404} />}/>
                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default App;
