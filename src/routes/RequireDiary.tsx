import { Navigate, Outlet } from 'react-router-dom'
import { hasStoredAuth } from '@/api/auth'
import { getDiaryProfileId } from '@/api/onboarding'

export function RequireDiary() {

    if(import.meta.env.VITE_DEMO_UI === true) 
        return <Outlet />
    if (!hasStoredAuth()) {
        return <Navigate to="/login" replace />
    }
    if (getDiaryProfileId() == null) {
        return <Navigate to="/onboarding/role" replace />
    }
    return <Outlet />
}
