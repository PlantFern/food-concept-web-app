import { logoutLocal, restoreAuthFromStorage } from '@/api/auth'
import axios from 'axios'
import { API_BASE_URE } from '@/config/apiBases'

export const http = axios.create({
    baseURL: API_BASE_URE,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

restoreAuthFromStorage()

http.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const isNetwork = !error.response;
        if (status === 401 && !isNetwork) {
            logoutLocal();
            const path = window.location.pathname
            if (path !== '/login' && path !== '/register' && path !== '/get-start') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    },
)

export default http
