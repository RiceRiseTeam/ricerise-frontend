<script setup lang="ts">
import {nextTick, onMounted, type Ref, ref, watch} from "vue"
import NProgress from 'nprogress'
import {AnimatePresence, Motion} from "motion-v";
import api from "@/api/http.ts";
import {useSSE, useToast} from "@/composables/message.ts";
import type {DtoDinnerDto, DtoUserDto} from "@/api/api";
import { AnimateIcon,CookingPot ,MessageSquareShare, MapPin, X } from '@respeak/lucide-motion-vue'
import {useRouter} from "vue-router"
import {userStorage} from "@/store/auth.ts";

interface ChatMessage {
    userid: number
    username: string,
    message: string
}

const toast = useToast()
const router = useRouter()
const sse = useSSE()

sse.on("chat", (data: any) => {
    console.log(data)
    const user = data.user as DtoUserDto
    const dinnerId = data.dinnerId ?? selectedId.value ?? 0

    if(!messages.value.has(dinnerId)){
        messages.value.set(dinnerId, [])
    }

    messages.value.get(dinnerId)?.push({
        userid: user?.id ?? 0,
        username: user?.nickname ?? "",
        message: data.message
    })
})

const currentDinners: Ref<DtoDinnerDto[]> = ref([])
const selectedId: Ref<number | null> = ref(null)
const messages: Ref<Map<number, ChatMessage[]>> = ref(new Map())
const messageInput = ref("");
const scrollRef: Ref<HTMLDivElement | null> = ref(null)
const showCommentWindow = ref(false)

async function scrollToBottom() {
    await nextTick()
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
}

watch(selectedId, scrollToBottom)
watch(messages, scrollToBottom, {deep: true})


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

async function generateInviteCode(dinnerId: number) {
    try{
        const resp = await api.dinners.idCodeList(dinnerId)
        if (resp.data.code !== 0){
            toast.error("生成邀请链接失败: " + resp.data.message)
            return
        }

        const { href } = router.resolve({name: "invite", query: {id: dinnerId, code: resp.data.data.code}})
        const inviteUrl = new URL(href, window.location.origin).href

        try {
            await navigator.clipboard.writeText(inviteUrl)
            toast.success("邀请链接已经复制到剪贴板")
        } catch (err) {
            toast.error("邀请链接复制失败")
        }
    }catch (e){
        toast.error("生成邀请链接失败: 服务器错误")
    }
}

async function sendMessage(){
    try{
        const resp = await api.dinners.idMessagesCreate(selectedId.value ?? 0, {
            message: messageInput.value
        })
        if(!messages.value.has(selectedId.value ?? 0)){
            messages.value.set(selectedId.value ?? 0, [])
        }

        const user = userStorage.getCurrentUser()
        if (!user){
            return
        }

        messageInput.value = ""
    }catch (e){

    }
}

onMounted(async () => {
    NProgress.done()
    await refreshDinners()
    if (currentDinners.value.length > 0){
        selectedId.value = currentDinners.value[0]?.id ?? 0
    }
})
</script>

<template>
    <div class="relative h-full w-full">
        <div class="h-full w-full flex">
        <div class="flex flex-col w-1/3 bg-white shadow-2xl border border-gray-200 items-center space-y-1 px-2 py-2 z-99">
            <div class="flex">
                <CookingPot animate></CookingPot>
                <span class="text-2xl font-bold">饭局列表</span>
            </div>
            <span class="text-sm text-gray-500 translate-y--2">{{ currentDinners.length }} 餐待完成</span>
            <AnimatePresence>
                <Motion
                    v-for="dinner in currentDinners"
                    :key="dinner.id"
                    as="div"
                    :initial="{ opacity: 0, x: 50, scale: 0.9 }"
                    :animate="{ opacity: 1, x: 0, scale: 1 }"
                    :exit="{ opacity: 0, x: 50, scale: 0.9 }"
                    :transition="{ type: 'spring', stiffness: 300, damping: 30 }"
                    class="flex flex-col w-full bg-white rounded-2xl px-4 py-3 shadow-lg space-y-1 transition-transform"
                    :class="[(dinner.id === selectedId) ? 'scale-103 z-99 translate-x-2' : 'bg-white']"
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
                    <span class="text-sm">开始于: {{ dinner.meet_time }}</span>
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
                        <button @click="async () => await onUpdateStatus(dinner.id ?? 0,2)" class="inline-flex items-center justify-center flex-1 bg-blue-400 h-10 rounded-lg text-white shadow border-gray-50" v-if="(dinner.status ?? 0)<= 1">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <CookingPot :size="20"/>
                            </AnimateIcon>
                            开始
                        </button>
                        <button @click="async () => await onUpdateStatus(dinner.id ?? 0,4)" class="inline-flex items-center justify-center flex-1 bg-white h-10 rounded-lg shadow border-gray-50" v-if="(dinner.status ?? 0) <= 1">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <X :size="20"/>
                            </AnimateIcon>
                            取消
                        </button>
                        <button @click="async () => await onUpdateStatus(dinner.id ?? 0,3)" class="inline-flex items-center justify-center flex-1 bg-red-400 h-10 rounded-lg text-white shadow border-gray-50" v-if="(dinner.status ?? 0) === 2">
                            <AnimateIcon animateOnHover triggerTarget="parent">
                                <X :size="20"/>
                            </AnimateIcon>
                            结束
                        </button>
                        <button @click="async () => await generateInviteCode(dinner.id ?? 0)" class="inline-flex items-center justify-center flex-1 bg-white h-10 rounded-lg shadow border-gray-50" v-if="(dinner.status ?? 0 ) <= 1">
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
            <div ref="scrollRef" class="flex flex-col px-4 py-2 space-y-2 overflow-y-auto h-full pb-20" v-if="messages.get(selectedId ?? 0)">
                <AnimatePresence>
                    <Motion
                        v-for="(message, index) in messages.get(selectedId ?? 0)"
                        :key="`${message.userid}-${index}`"
                        :initial="{ y: 20, opacity: 0 }"
                        :animate="{ y: 0, opacity: 1 }"
                        :transition="{ duration: 0.2 }"
                        class="bg-white/85 w-1/3 flex flex-col rounded-lg shadow px-2 py-2"
                        :class="[message.userid === userStorage.getCurrentUser()?.id ? 'ml-auto' : 'mr-auto']"
                    >
                        <span class="text-sm text-blue-400">{{message.username}}</span>
                        <span>{{message.message}}</span>
                    </Motion>
                </AnimatePresence>
            </div>
            <div class="absolute h-15 w-150 bottom-3 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-sm rounded-4xl overflow-hidden shadow-2xl flex items-center px-4">
                <input @keydown.enter="sendMessage" v-model="messageInput" class="flex-1 outline-none" placeholder="和大家打个招呼吧">
            </div>
        </div>
    </div>
    <button @click="async () => await router.replace({name: 'home'})" class="absolute right-4 top-4 flex flex-col items-center justify-center rounded-full bg-white/85 h-15 w-15 shadow hover:bg-blue-400 hover:text-white transition-colors backdrop-blur-sm">
        <AnimateIcon animateOnHover triggerTarget="parent">
            <MapPin class="text-shadow" :size="24"/>
            <span class="text-xs">地图</span>
        </AnimateIcon>
    </button>

    <div>
        
    </div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-2/3 flex flex-col bg-white shadow-2xl border border-gray-200 rounded-2xl px-4 py-4">
        <span class="text-lg font-bold">提交评论</span>
    </div>
    </div>
</template>