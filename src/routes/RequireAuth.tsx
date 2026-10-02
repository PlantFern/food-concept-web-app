import { Navigate, Outlet } from 'react-router-dom'
import { hasStoredAuth } from '@/api/auth'

export function RequireAuth() {
    if (!hasStoredAuth()) {
        return <Navigate to="/login" replace />
    }
    return <Outlet />
}
