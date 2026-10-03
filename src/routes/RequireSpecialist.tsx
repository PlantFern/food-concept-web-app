import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { hasStoredAuth, restoreAuthFromStorage } from '@/api/auth'
import { getMySpecialist } from '@/api/specialist'

export function RequireSpecialist() {

    if(import.meta.env.VITE_DEMO_UI === true) 
    return <Outlet />
    
    const [ok, setOk] = useState<boolean | null>(null)

    useEffect(() => {
        restoreAuthFromStorage()
        if (!hasStoredAuth()) {
            setOk(false)
            return
        }
        let cancelled = false;
        (async () => {
            const me = await getMySpecialist()
            if (!cancelled) setOk(me != null)
        })()
        return () => {
            cancelled = true
        }
    }, [])

    if (ok === null) return null
    if (!hasStoredAuth()) return <Navigate to="/login" replace />
    if (!ok) return <Navigate to="/onboarding/role" replace />
    return <Outlet />
}
