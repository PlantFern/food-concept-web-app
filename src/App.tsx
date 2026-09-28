import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorPage } from "@/pages/ErrorPage.tsx"
import { StartPage } from "@/pages/auth/StartPage.tsx";


function App() {

    return (
        <div className = "container-md p-0">
            <BrowserRouter>
                <Routes>
                    <Route path = "/get-start" element={<StartPage />} />

                    <Route path = "*" element={<ErrorPage code={404} />}/>
                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default App;