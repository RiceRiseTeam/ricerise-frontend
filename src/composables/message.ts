import {ref, type Ref} from "vue";
import {number} from "motion-v";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import {tokenStorage} from "@/store/auth.ts";
import {waitRefresh} from "@/api/http.ts";

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export interface ToastItem {
    id: number
    type: ToastType
    message: string
    duration: number
}

const toasts: Ref<ToastItem[]> = ref([])
let startId = 0

function addToast(type: ToastType, message: string, duration = 3000): number{
    const id = ++startId;
    toasts.value.push({id, duration, message, type})
    if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
    }
    return id
}

function removeToast(id: number){
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
}

export function useToast(){
    return {
        toasts,
        remove: removeToast,
        success: (msg: string, d?: number) => addToast('success', msg, d),
        error:   (msg: string, d?: number) => addToast('error', msg, d),
        warning: (msg: string, d?: number) => addToast('warning', msg, d),
        info:    (msg: string, d?: number) => addToast('info', msg, d),
    }
}

class RetriableError extends Error {}

type SSEEventType = 'invite' | 'agent' | 'notice' | string;
const SSEListeners = new Map<SSEEventType, Set<(data: any)=> void>>();

async function initSSE(){
    const token = tokenStorage.getAccessToken()
    try {
        await fetchEventSource("/api/v1/sse", {
            headers: {"Authorization": `Bearer ${token}`},
            async onmessage(msg) {
                SSEListeners.get(msg.event)?.forEach((handler) => {
                    handler(msg.data)
                })
            },
            async onclose() {
                throw new RetriableError()
            },
            async onopen(response) {
                if (response.status === 401) {
                    await waitRefresh
                    throw new RetriableError()
                }
                if (response.status !== 200){
                    throw new Error("")
                }
            },
            onerror(err){
                throw err
            }
        }
    )
    }catch (e) {
        if (e instanceof RetriableError){
            await initSSE()
        }
    }
}

export function useSSE(){
    return {
        init: initSSE,
        on(event: SSEEventType, handler: (data: any)=> void) {
            if (!SSEListeners.has(event)) SSEListeners.set(event, new Set());
            SSEListeners.get(event)!.add(handler);
        }
    }
}