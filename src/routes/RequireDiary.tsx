import { Navigate, Outlet } from 'react-router-dom'
import { hasStoredAuth } from '@/api/auth'
import { resolveDiaryProfileId } from '@/api/onboarding'
import { useEffect, useState } from 'react'

export function RequireDiary() {

    if(import.meta.env.VITE_DEMO_UI === true) 
        return <Outlet />;
    if (!hasStoredAuth()) {
        return <Navigate to="/login" replace />;
    }

    const [state, setState] = useState<'loading'|'ok'|'no-profile'>('loading')

    useEffect(() => {

        let cancelled = false;

        (async() => {
            const id = await resolveDiaryProfileId();
            if(!cancelled)
                setState(id != null ? 'ok' : 'no-profile');
        })();

        return () => {cancelled = true};
    }, []);

    if (state === 'loading') return null;
    if (state === 'no-profile') {
        return <Navigate to="/onboarding/role" replace />
    }
    return <Outlet />
}
