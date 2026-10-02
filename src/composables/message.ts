import {ref, type Ref} from "vue";
import {number} from "motion-v";

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