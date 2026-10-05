<script setup lang="ts">

import {onMounted, ref, type Ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import NProgress from "nprogress";
import {Motion} from "motion-v";
import type {DtoDinnerDto} from "@/api/api.ts";
import api from "@/api/http.ts";
import {AlignLeft} from "@respeak/lucide-motion-vue";
import {useToast} from "@/composables/message.ts";
const route = useRoute()
const router = useRouter()
const toast = useToast()

const currentDinnerId: Ref<number | null> = ref(null)
const currentDinner: Ref<DtoDinnerDto | null> = ref(null)
const currentInviteCode: Ref<string | null> = ref(null)

onMounted(async () => {
    const dinnerId = route.query.id
    const inviteCode = route.query.code
    if (!dinnerId || !inviteCode){
        await router.replace({name: "home"})
        return
    }
    currentDinnerId.value = Array.isArray(dinnerId) ? parseInt(dinnerId[0] ?? "0") : parseInt(dinnerId)
    currentInviteCode.value = Array.isArray(inviteCode) ? inviteCode[0] ?? "" : inviteCode

    try{
        const resp = await api.dinners.getDinners(currentDinnerId.value)
        if (resp.data.code !== 0) {
            throw new Error("")
        }
        currentDinner.value = resp.data.data
    }catch (e){
        await router.replace({name: "home"})
    }

    NProgress.done()
})

async function join(){
    try{
        const resp = await api.dinners.idParticipantsCreate(currentDinnerId.value ?? 0, {
            code: currentInviteCode.value ?? ""
        })
        if (resp.data.code !== 0){
            toast.error("加入失败: " + resp.data.message)
            return
        }
    }catch (e){
        toast.error("加入失败: 服务器错误")
        return
    }

    toast.success("加入成功! 正在跳转...")
    await router.replace({name: "dinner"})
}

async function left(){
    await router.replace({name: "home"})
}

</script>

<template>
    <div class="flex flex-col items-center justify-center w-full h-full">
        <Motion
            :initial="{ y: 20, opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :transition="{ duration: 0.5 }"
            as="div"
            class="flex flex-col px-4 py-4 bg-white/85 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-2xl w-1/5 h-1/2"
        >
            <div class="flex pb-2">
                <AlignLeft animate class="text-blue-400"></AlignLeft>
                <h1 class="text-lg font-bold text-blue-400 text-shadow pl-2">邀请</h1>
            </div>

            <span class="font-sm text-gray-500">{{currentDinner?.host?.nickname}}</span>
            <div>
                <span class="text-2xl font-bold">邀请你</span>
                <span class="text-blue-400">加入饭局</span>
            </div>
            <div class="flex flex-col border border-gray-200 rounded-lg my-2 px-2 py-2">
                <span class="font-bold">{{ currentDinner?.location?.name }}</span>
                <span class="text-sm">{{ currentDinner?.location?.address }}</span>
                <hr class="text-gray-200 my-1">
                <div class="flex">
                    <img
                        v-for="p in currentDinner?.participants"
                        class="h-10 w-10 rounded-full object-cover"
                        src="/icon.ico"
                        :alt="p.nickname"
                    />
                    <span class="mt-auto ml-auto text-gray-300 text-xs">{{ currentDinner?.participants?.length }} / {{currentDinner?.max}}</span>
                </div>
            </div>
            <div class="flex mt-auto my-5 h-10 space-x-1">
                <button @click="join" class="flex-1 bg-blue-400 text-white rounded-2xl h-full border border-gray-200 shadow hover:brightness-95">确认</button>
                <button @click="left" class="flex-1 bg-white rounded-2xl h-full border border-gray-200 shadow hover:brightness-95">取消</button>
            </div>
        </Motion>
    </div>
</template>