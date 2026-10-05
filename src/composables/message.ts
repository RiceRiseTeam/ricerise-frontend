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

type SSEEventType = 'toast' | 'chat' | 'agent' | string;
const SSEListeners = new Map<SSEEventType, Set<(data: any)=> void>>();

const INITIAL_RETRY_DELAY = 1000
const MAX_RETRY_DELAY = 30000

let retryDelay = INITIAL_RETRY_DELAY
let controller: AbortController | null = null
let running = false
let visibilityBound = false
let lastEventId: string | null = null

async function connectSSE(signal: AbortSignal){
    const token = tokenStorage.getAccessToken()
    const headers: Record<string, string> = {"Authorization": `Bearer ${token}`}
    if (lastEventId) {
        headers["Last-Event-ID"] = lastEventId
    }
    await fetchEventSource("/api/v1/sse", {
        headers,
        signal,
        openWhenHidden: true,
        async onmessage(msg) {
            if (msg.id) {
                lastEventId = msg.id
            }
            try {
                SSEListeners.get(msg.event)?.forEach((handler) => {
                    handler(JSON.parse(msg.data))
                })
            } catch (e) {
                console.error("SSE 消息解析失败", e)
            }
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
                throw new Error(`SSE 连接失败: ${response.status}`)
            }
            retryDelay = INITIAL_RETRY_DELAY
        },
        onerror(err){
            throw err
        }
    })
}

async function runSSE(){
    const myController = new AbortController()
    controller = myController
    running = true

    while (!myController.signal.aborted) {
        try {
            await connectSSE(myController.signal)
            break
        } catch (e) {
            if (myController.signal.aborted) break
            console.warn(`SSE 连接中断，${retryDelay}ms 后重连`, e)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
        }
    }

    if (controller === myController) {
        controller = null
        running = false
    }
}

function initSSE(){
    if (running) return
    void runSSE()
}

function reconnectSSE(){
    controller?.abort()
    controller = null
    running = false
    initSSE()
}

function bindVisibilityReconnect(){
    if (visibilityBound || typeof document === "undefined") return
    visibilityBound = true
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            reconnectSSE()
        }
    })
}

export function useSSE(){
    bindVisibilityReconnect()
    return {
        init: initSSE,
        reconnect: reconnectSSE,
        stop(){
            controller?.abort()
            controller = null
            running = false
        },
        on(event: SSEEventType, handler: (data: any)=> void) {
            if (!SSEListeners.has(event)) SSEListeners.set(event, new Set());
            SSEListeners.get(event)!.add(handler);
            return () => {
                SSEListeners.get(event)?.delete(handler)
            }
        }
    }
}