import axios, {type AxiosInstance, type InternalAxiosRequestConfig} from "axios"
import {tokenStorage} from "@/store/auth.ts";
import { Api } from "./api";

const api = new Api({
    timeout: 10000
})

api.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()
    if (token && config.headers){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api