<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue"
import NProgress from 'nprogress'
import {AnimatePresence, Motion} from "motion-v";
import api from "@/api/http.ts";
import {useToast} from "@/composables/message.ts";
import type {DtoDinnerDto} from "@/api/api";
import { AnimateIcon,CookingPot ,MessageSquareShare, Bell, X } from '@respeak/lucide-motion-vue'

interface ChatMessage {
    userid: number
    username: string,
    message: string
}

const toast = useToast()
const currentDinners: Ref<DtoDinnerDto[]> = ref([])
const selectedId: Ref<number | null> = ref(null)
const messages: Ref<Map<number, ChatMessage[]>> = ref(new Map())

async function onUpdateStatus(id: number ,status: 2 | 3 | 4){
    try {
        const resp = await api.dinners.patchDinners(id, {
            status: status
        })

        if (resp.data.code !== 0) {
            toast.error("操作失败: " + resp.data.message)
            return
        }
    }catch (e){
        toast.error("操作失败: 服务器错误")
    }

    await refreshDinners()
}

async function refreshDinners(){
    try {
        const resp = await api.dinners.dinnersList()
        if (resp.data.code !== 0){
            toast.error("加载饭局失败: " + resp.data.message)
            return
        }
        currentDinners.value.length = 0
        currentDinners.value.push(...resp.data.data)
    }catch (e) {
        toast.error("加载饭局失败: 服务器错误")
    }
}

onMounted(async () => {
    NProgress.done()
    await refreshDinners()
})
</script>

<template>
    <div class="h-full w-full flex">
        <div class="flex flex-col w-150 bg-white shadow-2xl border-gray-50 items-center space-y-1 px-1 py-1">
            <AnimatePresence>
                <Motion
                    v-for="dinner in currentDinners"
                    :key="dinner.id"
                    as="div"
                    :initial="{ opacity: 0, x: 50, scale: 0.9 }"
                    :animate="{ opacity: 1, x: 0, scale: 1 }"
                    :exit="{ opacity: 0, x: 50, scale: 0.9 }"
                    :transition="{ type: 'spring', stiffness: 300, damping: 30 }"
                    class="flex flex-col w-full rounded-2xl px-4 py-3 shadow-lg space-y-1 transition-colors"
                    :class="[(dinner.id === selectedId) ? 'bg-blue-100  ' : 'bg-white']"
                    @click="() => selectedId = dinner.id ?? 0"
                >
                    <div class="flex">
                        <div class="flex flex-col">
                            <span class="font-bold text-lg">{{ dinner.location?.name }}</span>
                            <span class="text-sm text-gray-500"> {{dinner.location?.address}}</span>
                        </div>
                        <span v-if="dinner.status === 0" class="my-auto ml-auto px-5 text-lg text-green-500">招募中</span>
                        <span v-if="dinner.status === 1" class="my-auto ml-auto px-5 text-lg text-red-300">已满员</span>
                        <span v-if="dinner.status === 2" class="my-auto ml-auto px-5 text-lg text-blue-400">进行中</span>
                        <span v-if="dinner.status === 3" class="my-auto ml-auto px-5 text-lg text-gray-500">已结束</span>
                        <span v-if="dinner.status === 4" class="my-auto ml-auto px-5 text-lg text-gray-500">已取消</span>
                    </div>
                    <hr class="text-gray-300 mt-1">
                    <span class="text-sm">开始于:</span>
                    <span class="text-sm">发起者: {{ dinner.host?.nickname }}</span>

                    <div class="flex">
                        <img
                            v-for="p in dinner.participants"
                            class="h-10 w-10 rounded-full object-cover"
                            src="/icon.ico"
                            :alt="p.nickname"
                        />
                    </div>

                    <div class="flex my-1 space-x-2">
                        <button @click="async () => await onUpdateStatus(dinner.id ?? 0,2)" class="flex inline-flex items-center justify-center flex-1 bg-blue-400 h-10 rounded-lg text-white shadow border-gray-50" v-if="dinner.status <= 1">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <CookingPot :size="20"/>
                            </AnimateIcon>
                            开始
                        </button>
                        <button @click="async () => await onUpdateStatus(dinner.id ?? 0,4)" class="flex inline-flex items-center justify-center flex-1 bg-white h-10 rounded-lg shadow border-gray-50" v-if="dinner.status <= 1">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <X :size="20"/>
                            </AnimateIcon>
                            取消
                        </button>
                        <button @click="async () => await onUpdateStatus(dinner.id ?? 0,3)" class="flex inline-flex items-center justify-center flex-1 bg-red-400 h-10 rounded-lg text-white shadow border-gray-50" v-if="dinner.status === 2">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <X :size="20"/>
                            </AnimateIcon>
                            结束
                        </button>
                        <button class="flex inline-flex items-center justify-center flex-1 bg-white h-10 rounded-lg shadow border-gray-50" v-if="dinner.status <= 1">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <MessageSquareShare :size="20"/>
                            </AnimateIcon>
                            分享
                        </button>
                    </div>
                </Motion>
            </AnimatePresence>
            <span v-if="currentDinners.length === 0" class="text-sm text-gray-500 my-auto" >当前暂无饭局...</span>
        </div>
        <div class="flex-1 bg-blue-50 relative">
            <div class="absolute h-15 w-150 bottom-3 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-sm rounded-4xl overflow-hidden shadow-2xl flex items-center px-4">
                <input class="flex-1 outline-none" placeholder="和大家打个招呼吧">
            </div>
        </div>
    </div>
</template>