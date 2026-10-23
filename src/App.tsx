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
import { ProductsPage } from '@/pages/diary/ProductsPage'
import { ProductCreateFormPage } from '@/pages/diary/ProductCreateFormPage'
import { ProductDetailPage } from '@/pages/diary/ProductDetailPage'
import { RecipeDetailPage } from '@/pages/diary/RecipeDetailPage'
import { RecipeCreateFormPage } from '@/pages/diary/RecipeCreateFormPage'
import { SettingsPage } from '@/pages/diary/SettingsPage'
import { DiarySettingsPage } from '@/pages/diary/DiarySettingsPage'
import { GoalsPage } from '@/pages/diary/GoalsPage'
import { SleepLogFormPage } from '@/pages/diary/SleepLogFormPage'
import { WeightLogFormPage } from '@/pages/diary/WeightLogFormPage'
import { FoodRecordFormPage } from '@/pages/diary/FoodRecordFormPage'
import { MealTemplateFormPage } from '@/pages/diary/MealTemplateFormPage'
import { MealPhotoFormPage } from '@/pages/diary/MealPhotoFormPage'
import { CommentFormPage } from '@/pages/diary/CommentFormPage'
import { QuickProductFormPage } from '@/pages/diary/QuickProductFormPage'
import { MySpecialistsPage } from '@/pages/diary/MySpecialistsPage'
import { MySpecialistRelationsPage } from '@/pages/diary/MySpecialistRelationsPage'
import { SpecialistSearchPage } from '@/pages/diary/SpecialistSearchPage'
import { ClientsPage } from '@/pages/specialist/ClientsPage'
import { ClientDiaryPage } from '@/pages/specialist/ClientDiaryPage'
import { SpecialistSettingsPage } from '@/pages/specialist/SpecialistSettingsPage'
import { RequireAuth } from '@/routes/RequireAuth'
import { RequireDiary } from '@/routes/RequireDiary'
import { RequireSpecialist } from '@/routes/RequireSpecialist'

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

                            <Route path="/diary/products" element={<ProductsPage />} />
                            <Route path="/diary/products/create" element={<ProductCreateFormPage />} />
                            <Route path="/diary/products/:productId" element={<ProductDetailPage />} />
                            <Route path="/diary/recipes/create" element={<RecipeCreateFormPage />} />
                            <Route path="/diary/recipes/:recipeId" element={<RecipeDetailPage />} />

                            <Route path="/diary/settings" element={<SettingsPage />} />
                            <Route path="/diary/settings/diary" element={<DiarySettingsPage />} />
                            <Route path="/diary/settings/goals" element={<GoalsPage />} />
                            <Route path="/diary/settings/specialists" element={<MySpecialistsPage />} />
                            <Route path="/diary/specialists/search" element={<SpecialistSearchPage />} />
                            <Route path="/diary/specialists/relations" element={<MySpecialistRelationsPage />} />

                            <Route path="/diary/sleep-log/add" element={<SleepLogFormPage />} />
                            <Route path="/diary/sleep-log/:sleepLogId/edit" element={<SleepLogFormPage />} />

                            <Route path="/diary/weight-log/add" element={<WeightLogFormPage />} />
                            <Route path="/diary/weight-log/:weightLogId/edit" element={<WeightLogFormPage />} />

                            <Route path="/diary/food-records/:recordId/edit" element={<FoodRecordFormPage />} />
                            <Route path="/diary/food-records/quick" element={<QuickProductFormPage />} />

                            <Route path="/diary/meals/photo" element={<MealPhotoFormPage />} />

                            <Route path="/diary/templates/add" element={<MealTemplateFormPage />} />
                            <Route path="/diary/templates/:templateId/edit" element={<MealTemplateFormPage />} />

                            <Route path="/diary/comments/add" element={<CommentFormPage />} />
                            <Route path="/diary/comments/:commentId/edit" element={<CommentFormPage />} />
                        </Route>

                        <Route element={<RequireSpecialist />}>
                            <Route path="/specialist" element={<Navigate to="/specialist/clients" replace />} />
                            <Route path="/specialist/clients" element={<ClientsPage />} />
                            <Route
                                path="/specialist/clients/:diaryProfileId/diary"
                                element={<ClientDiaryPage />}
                            />
                            <Route path="/specialist/settings" element={<SpecialistSettingsPage />} />
                        </Route>

                        <Route path="*" element={<ErrorPage code={404} />} />
                    </Routes>
                </BrowserRouter>
            </AlertProvider>
        </div>
    )
}

export default App
