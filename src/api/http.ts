import axios, {type AxiosInstance, type InternalAxiosRequestConfig} from "axios"
import {tokenStorage} from "@/store/auth.ts";

const http: AxiosInstance = axios.create({
    baseURL: "/api/v1",
    withCredentials: true
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()
    if (token && config.headers){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})