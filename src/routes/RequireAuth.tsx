import { Navigate, Outlet } from 'react-router-dom'
import { hasStoredAuth } from '@/api/auth'

export function RequireAuth() {
    
    if(import.meta.env.VITE_DEMO_UI === true) 
        return <Outlet />
    if (!hasStoredAuth()) {
        return <Navigate to="/login" replace />
    }
    return <Outlet />
}
