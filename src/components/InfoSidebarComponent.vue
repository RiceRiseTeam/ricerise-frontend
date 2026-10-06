<script setup lang="ts">

import SidebarComponent from "@/components/SidebarComponent.vue";
import {ref, watch} from "vue";
import type {DtoCommentDto, DtoLocationDto} from "@/api/api.ts";
import api from "@/api/http.ts";
import {AnimatePresence, Motion} from "motion-v";
import {useToast} from "@/composables/message.ts";
import {Clock3, Flame, LoaderCircle, Star} from '@respeak/lucide-motion-vue'

const emit = defineEmits<{
    (e: "on-create" ,loc: DtoLocationDto): void
}>()

const sidebar = ref<InstanceType<typeof SidebarComponent> | null>(null)
const toast = useToast()

const PAGE_SIZE = 10

const currentLocation = ref<DtoLocationDto | null>(null)
const currentComments = ref<DtoCommentDto[]>([])

type CommentOrder = 'rank' | 'time'
const commentOrder = ref<CommentOrder>('rank')
const commentsLoading = ref(false)
const commentsHasNext = ref(false)
const commentsContainer = ref<HTMLDivElement | null>(null)

const sortOptions: { key: CommentOrder; label: string; icon: any }[] = [
    {key: 'rank', label: '', icon: Flame},
    {key: 'time', label: '', icon: Clock3},
]

function formatTime(value?: string): string {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })
}

function commentCursor(order: CommentOrder) {
    const last = currentComments.value[currentComments.value.length - 1]
    if (!last) return {}
    return order === 'rank'
        ? {start_id: last.id, start_rank: last.rating}
        : {start_id: last.id, start_time: last.createdAt}
}

async function loadComments(reset = true) {
    if (commentsLoading.value) return
    commentsLoading.value = true
    try {
        const query = reset || currentComments.value.length === 0
            ? {page_size: PAGE_SIZE, ordered_by: commentOrder.value}
            : {page_size: PAGE_SIZE, ordered_by: commentOrder.value, ...commentCursor(commentOrder.value)}
        const resp = await api.map.locationIdCommentsList(currentLocation.value?.id ?? 0, query)
        if (resp.data.code !== 0) {
            toast.error("加载评论失败: " + resp.data.message)
            return
        }

        const data = resp.data.data ?? []
        if (reset) currentComments.value.length = 0
        currentComments.value.push(...data)
        commentsHasNext.value = data.length > 0
    }catch (e){
        toast.error("加载评论失败: 服务器错误")
    } finally {
        commentsLoading.value = false
    }
}

function onCommentsScroll() {
    const el = commentsContainer.value
    if (!el) return
    const remain = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remain < 48 && commentsHasNext.value && !commentsLoading.value) {
        loadComments(false)
    }
}

watch(commentOrder, () => {
    if (currentLocation.value) loadComments(true)
})

async function open(loc: DtoLocationDto){
    if (!loc.id) return
    currentLocation.value = loc
    sidebar.value?.open()
    currentComments.value.length = 0
    commentsHasNext.value = false
    await loadComments(true)
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
            <hr class="border-gray-300 shadow">
            <span class="text-xs text-gray-400">Desc: </span>
            <span class="min-h-40 max-h-40 px-1 text-sm">{{ currentLocation?.description }}</span>
            <hr class="border-gray-300 shadow">

            <div class="flex flex-col w-full h-full items-center overflow-y-auto overscroll-contain" ref="commentsContainer" @scroll="onCommentsScroll">
                <div class="flex items-center gap-2 w-full mb-2">
                    <div class="flex rounded-xl bg-white/85 border border-gray-200 p-1 shadow">
                        <button
                            v-for="opt in sortOptions"
                            :key="opt.key"
                            @click="commentOrder = opt.key"
                            class="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors"
                            :class="commentOrder === opt.key
                                ? 'bg-blue-400 text-white shadow'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-500'"
                        >
                            <component :is="opt.icon" :size="14"/>
                            {{ opt.label }}
                        </button>
                    </div>
                </div>

                <Motion
                    v-if="commentsLoading && currentComments.length === 0"
                    :initial="{ opacity: 0 }"
                    :animate="{ opacity: 1 }"
                    class="flex items-center justify-center gap-2 py-10 text-sm text-gray-500"
                >
                    <LoaderCircle class="animate-spin" :size="16"/>
                    加载评论中...
                </Motion>

                <ul class="flex flex-col space-y-2 w-full">
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
                            class="flex flex-col rounded-xl bg-white py-2 px-2 shadow-lg"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col">
                                    <span class="font-bold text-gray-800">{{ comment.user?.nickname ?? '匿名用户' }}</span>
                                    <span class="text-xs text-gray-400">@ {{ comment.user?.username ?? '-' }}</span>
                                </div>
                                <div class="flex items-center space-x-0.5">
                                    <Star
                                        v-for="n in 5"
                                        :key="n"
                                        :size="14"
                                        :class="n <= (comment.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'"
                                        :fill="n <= (comment.rating ?? 0) ? 'currentColor' : 'none'"
                                    />
                                </div>
                            </div>
                            <p class="mt-2 text-sm text-gray-700">{{ comment.content }}</p>
                            <span class="mt-2 text-xs text-gray-400">{{ formatTime(comment.createdAt) }}</span>
                        </Motion>
                    </AnimatePresence>
                </ul>

                <Motion
                    v-if="currentComments.length === 0 && !commentsLoading"
                    :initial="{ opacity: 0 }"
                    :animate="{ opacity: 1 }"
                    class="w-full py-2 text-center"
                >
                    <p class="text-gray-500 text-sm">暂无评论数据...</p>
                </Motion>

                <Motion
                    v-if="commentsLoading && currentComments.length > 0"
                    :initial="{ opacity: 0 }"
                    :animate="{ opacity: 1 }"
                    class="flex items-center justify-center gap-2 py-3 text-sm text-gray-500"
                >
                    <LoaderCircle class="animate-spin" :size="16"/>
                    加载中...
                </Motion>
            </div>

            <button class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-400 hover:bg-blue-400 hover:text-white transition-colors shadow-2xl" @click="onCreate">创建饭局</button>
            <hr class="border-gray-500 mt-auto">
            <span class="text-sm text-gray-500 mt-auto">收录于: {{ currentLocation?.createdAt }}</span>
        </div>
    </SidebarComponent>
</template>