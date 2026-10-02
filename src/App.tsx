import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AlertProvider } from '@/components/ui/Alert'
import { ErrorPage } from '@/pages/ErrorPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { StartPage } from '@/pages/auth/StartPage'
import { LogoutPage } from '@/pages/auth/LogoutPage'
import { ChooseRolePage } from '@/pages/onboarding/ChooseRolePage'
import { ChooseScenarioPage } from '@/pages/onboarding/diaryProfile/ChooseScenarioPage'
import { DiaryProfileSetupPage } from '@/pages/onboarding/diaryProfile/DiaryProfileSetupPage'
import { GoalManualPage } from '@/pages/onboarding/diaryProfile/GoalManualPage'
import { GoalAutoPage } from '@/pages/onboarding/diaryProfile/GoalAutoPage'
import { DiaryHomePage } from '@/pages/diary/DiaryHomePage'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireDiary } from '@/routes/RequireDiary'

function App() {
    return (
        <div className="container-md p-0">
            <AlertProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Navigate to="/get-start" replace />} />
                        <Route path="/get-start" element={<StartPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/logout" element={<LogoutPage />} />

                        <Route element={<RequireAuth />}>
                            <Route path="/onboarding/role" element={<ChooseRolePage />} />
                            <Route path="/onboarding/scenario" element={<ChooseScenarioPage />} />
                            <Route path="/onboarding/profile-setup" element={<DiaryProfileSetupPage />} />
                            <Route path="/onboarding/diary/goal-manual" element={<GoalManualPage />} />
                            <Route path="/onboarding/diary/goal-auto" element={<GoalAutoPage />} />
                        </Route>

                        <Route element={<RequireDiary />}>
                            <Route path="/diary" element={<DiaryHomePage />} />
                            <Route path="/diary/relations" element={<DiaryHomePage />} />
                            <Route path="/diary/stats" element={<DiaryHomePage />} />
                            <Route path="/diary/profile" element={<DiaryHomePage />} />
                            <Route path="/diary/settings" element={<DiaryHomePage />} />
                        </Route>

                        <Route path="*" element={<ErrorPage code={404} />} />
                    </Routes>
                </BrowserRouter>
            </AlertProvider>
        </div>
    )
}

export default App
