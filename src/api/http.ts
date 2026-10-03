import axios, {type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig} from "axios"
import {tokenStorage} from "@/store/auth.ts";
import { Api } from "./api";
import {useToast} from "@/composables/message.ts";
import {type Ref, ref, watch} from "vue";

const api = new Api({
    timeout: 10000
})

interface QueueItem {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    config: AxiosRequestConfig;
}

const isRefreshing: Ref<boolean, boolean> = ref(false);
export const waitRefresh = new Promise<void>((resolve) => {
    const stop = watch(isRefreshing, (v) => {
        if (v){
            stop()
            resolve()
        }
    }, {immediate: true})
})

let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((item) => {
        if (error) {
            item.reject(error);
        } else {
            item.config.headers = item.config.headers || {};
            item.config.headers["Authorization"] = `Bearer ${token}`;
            item.resolve(api.instance(item.config));
        }
    });
    failedQueue = [];
};


api.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()
    if (token && config.headers){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.instance.interceptors.response.use(async (response) => {
    const code = response.data?.code as number
    const config = response.config as AxiosRequestConfig & { _retry?: boolean };
    if (code === 40100){
        if (config._retry){
            tokenStorage.clearAccessToken()
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
            const toast = useToast()
            toast.warning("登录已过期")
            return Promise.reject(new Error("Refresh Token is invalid"))
        }

        config._retry = true
        if (isRefreshing.value){
            return new Promise((resolve, reject) => {
                failedQueue.push({resolve, reject, config})
            })
        }

        isRefreshing.value = true

        try{
            const resp = await api.auth.refreshCreate()
            if (resp.data.code === 0){
                const newAccessToken = resp.data.data.access_token;
                tokenStorage.setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);

                config.headers = config.headers || {};
                config.headers["Authorization"] = `Bearer ${newAccessToken}`;
                console.log("refresh success")
                return api.instance(config);
            }
        }catch (e){
            processQueue(e, null)
            tokenStorage.clearAccessToken()
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
            const toast = useToast()
            toast.error("服务器链接错误")
            return Promise.reject(e)
        }
    }
    return response
}
)

export default api