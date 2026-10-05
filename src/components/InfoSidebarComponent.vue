<script setup lang="ts">

import SidebarComponent from "@/components/SidebarComponent.vue";
import {ref} from "vue";
import type {DtoCommentDto, DtoLocationDto} from "@/api/api.ts";
import api from "@/api/http.ts";
import {AnimatePresence, Motion} from "motion-v";
import {useToast} from "@/composables/message.ts";

const emit = defineEmits<{
    (e: "on-create" ,loc: DtoLocationDto): void
}>()

const sidebar = ref<InstanceType<typeof SidebarComponent> | null>(null)
const toast = useToast()

const currentLocation = ref<DtoLocationDto | null>(null)
const currentComments = ref<DtoCommentDto[]>([])

async function open(loc: DtoLocationDto){
    if (!loc.id) return
    currentLocation.value = loc
    sidebar.value?.open()
    try {
        const resp = await api.map.locationIdCommentsList(loc.id)
        if (resp.data.code !== 0){
            toast.error("加载评论失败: " + resp.data.message)
            return
        }

        currentComments.value.push(...resp.data.data)
    }catch (e){
        toast.error("加载评论失败: 服务器错误")
    }
}

function onCreate(){
    if (currentLocation.value) {
        emit("on-create", currentLocation.value)
    }
}

defineExpose({
    sidebar,
    open
})
</script>

<template>
    <SidebarComponent ref="sidebar" tittle="饭点详情">
        <div class="flex flex-col space-y-2 h-full w-full">
            <h1 class="text-4xl font-bold">{{ currentLocation?.name }}</h1>
            <span class="text-sm text-gray-500 mt--2" >{{ currentLocation?.address}}</span>
            <hr class="border-gray-500">
            <span class="min-h-20 max-h-40">{{ currentLocation?.description }}</span>


            <div class="flex flex-col w-full h-full items-center overflow-y-auto overscroll-contain">
                <ul class="flex flex-col">
                    <AnimatePresence>
                        <Motion
                            as="li"
                            v-for="comment in currentComments"
                            :key="comment.id"
                            layout
                            :initial="{ opacity: 0, y: 12 }"
                            :animate="{ opacity: 1, y: 0 }"
                            :exit="{ opacity: 0 }"
                            :transition="{ duration: 0.25, ease: 'easeOut' }"
                            class="w-full border border-gray-500"
                        >
                            <span>{{ comment.content }}</span>
                        </Motion>
                    </AnimatePresence>
                </ul>
                <p class="text-gray-500 text-sm" v-if="currentComments.length === 0"> 暂无评论数据...</p>
            </div>

            <button class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-400 hover:bg-blue-400 hover:text-white transition-colors" @click="onCreate">创建饭局</button>
            <hr class="border-gray-500 mt-auto">
            <span class="text-sm text-gray-500 mt-auto">收录于: {{ currentLocation?.createdAt }}</span>
        </div>
    </SidebarComponent>
</template>