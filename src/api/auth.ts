import axios from 'axios'
import { http } from '@/api/http'
import { API_BASE_URE } from '@/config/apiBases'
import { clearOnboardingProfile } from '@/api/onboarding'

export type LoginPayload = {
    email: string
    password: string
}

export type RegisterPayload = {
    email: string
    password: string
}

export async function loginRequest({ email, password }: LoginPayload): Promise<void> {

    await axios.get(`${API_BASE_URE}/api/users/my-profile`, {
        auth: { username: email, password },
    })

    localStorage.setItem('fd_auth_email', email);
    localStorage.setItem('fd_auth_password', password);

    http.defaults.auth = { username: email, password }
}

export async function registerRequest({ email, password }: RegisterPayload): Promise<void> {
    await axios.post(
        `${API_BASE_URE}/registration`,
        { email, password, login: null },
        { headers: { 'Content-Type': 'application/json' } },
    )
}

export function logoutLocal(): void {
    localStorage.removeItem('fd_auth_email')
    localStorage.removeItem('fd_auth_password')
    localStorage.removeItem('fd_diary_profile_id')
    clearOnboardingProfile()
    delete http.defaults.auth
}

export function restoreAuthFromStorage(): void {
    const email = localStorage.getItem('fd_auth_email')
    const password = localStorage.getItem('fd_auth_password')
    if (email && password) {
        http.defaults.auth = { username: email, password }
    }
}
