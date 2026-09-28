import axios from 'axios'
import { http } from '@/api/http'
import { API_BASE_URE } from '@/config/apiBases'

export type LoginPayload = {
    email: string
    password: string
}

export type RegisterPayload = {
    email: string
    password: string
}

export async function loginRequest({ email, password }: LoginPayload): Promise<void> {

    await axios.get(`${API_BASE_URE}/api/users/0`, {
        auth: { username: email, password },
        validateStatus: (s) => s === 200 || s === 404 || s === 403,

    }).then((res) => {
        if (res.status === 401) {
            throw new Error('Неверный email или пароль')
        }
    }).catch((err) => {
        if (err.response?.status === 401) {
            throw new Error('Неверный email или пароль')
        }

        if (err.response?.status === 401) throw err
        if (!err.response) throw new Error('Нет связи с сервером')
        if (err.response.status === 401) {
            throw new Error('Неверный email или пароль')
        }
    })

    localStorage.setItem('fd_auth_email', email)
    localStorage.setItem('fd_auth_password', password)

    http.defaults.auth = { username: email, password }
}

export async function registerRequest({ email, password }: RegisterPayload): Promise<void> {
    const body = new URLSearchParams()
    body.set('email', email)
    body.set('password', password)

    await axios.post(`${API_BASE_URE}/registration`, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
}

export function logoutLocal(): void {
    localStorage.removeItem('fd_auth_email')
    localStorage.removeItem('fd_auth_password')
    delete http.defaults.auth
}

export function restoreAuthFromStorage(): void {
    const email = localStorage.getItem('fd_auth_email')
    const password = localStorage.getItem('fd_auth_password')
    if (email && password) {
        http.defaults.auth = { username: email, password }
    }
}
