import {restoreAuthFromStorage} from "@/api/auth.ts";
import axios from "axios";
import {API_BASE_URE} from "@/config/apiBases.ts";

export const http = axios.create({

    baseURL: API_BASE_URE,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

restoreAuthFromStorage();

http.interceptors.response.use(
    (config) =>  {
        return config;
    },
    (error) => Promise.reject(error),
)

http.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
)

export default http;