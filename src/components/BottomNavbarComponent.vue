<script setup lang="ts">
import {AnimatePresence, Motion} from "motion-v";
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, type Ref, ref, watch} from "vue";
import {tokenStorage, userStorage} from "@/store/auth";
import {RouterLink} from "vue-router"
import {fetchEventSource} from "@microsoft/fetch-event-source";
import api from "@/api/http";
import {useToast} from "@/composables/message";

interface Command {
    name: string
    description: string
}

interface Message {
    role: string
    content: string
}

interface AgentEvent {
    sessionId: number
    type: string
    message: string
}

const toast = useToast()

const text = ref('')
const showPanel = ref(false)
const activeIndex = ref(0)
const textareaRef = ref<HTMLTextAreaElement>()
const scrollRef = ref<HTMLDivElement | null>(null)
const messages: Ref<Message[]> = ref([])
const sessionId = ref<number | null>(null)
const isStreaming = ref(false)
let streamController: AbortController | null = null

const commands: Command[] = [
    { name: "/rest",   description: "重置大肥鱼上下文" },
]

const commandKeyword = computed(() => {
    const match = text.value.match(/(?:^|\s)\/(\S*)$/)
    return match ? match[1] : null
})

const isLogin = ref(false)

const filteredCommands = computed(() => {
    if (commandKeyword.value === null) return []
    const kw = commandKeyword.value?.toLowerCase()
    return commands.filter(c =>
        c.name.slice(1).toLowerCase().startsWith(kw ?? "")
    )
})

function handleInput() {
    const kw = commandKeyword.value
    if (kw !== null && filteredCommands.value.length > 0) {
        showPanel.value = true
        activeIndex.value = 0
    } else {
        showPanel.value = false
    }
}

async function selectCommand(command: Command) {
    text.value = text.value.replace(/(?:^|\s)\/(\S*)$/, (m) => {
        const prefix = m.startsWith(' ') ? ' ' : ''
        return `${prefix}${command.name} `
    })
    showPanel.value = false
    await nextTick()
    textareaRef.value?.focus()
}

async function scrollToBottom() {
    await nextTick()
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
}

watch(messages, scrollToBottom, {deep: true})

async function handleEnter() {
    if (showPanel.value && filteredCommands.value.length > 0) {
        await selectCommand(filteredCommands.value[activeIndex.value]!)
        return
    }
    await sendMessage()
}

async function newSession() {
    try {
        const resp = await api.chat.sessionList()
        if (resp.data.code !== 0) {
            toast.error("获取会话失败: " + resp.data.message)
            return
        }
        sessionId.value = resp.data.data?.session_id ?? null
    } catch (e) {
        toast.error("获取会话失败: 服务器错误")
    }
}

async function sendMessage() {
    const content = text.value.trim()
    if (!content) return

    text.value = ""
    showPanel.value = false

    if (content === "/rest") {
        streamController?.abort()
        streamController = null
        isStreaming.value = false
        messages.value = []
        await newSession()
        return
    }

    if (sessionId.value === null) {
        toast.error("会话尚未就绪")
        return
    }

    streamController?.abort()

    const currentSessionId = sessionId.value
    messages.value.push({ role: "user", content })

    const agentMessage = reactive<Message>({ role: "agent", content: "" })
    messages.value.push(agentMessage)
    isStreaming.value = true

    const controller = new AbortController()
    streamController = controller

    try {
        await fetchEventSource(`/api/v1/chat/${currentSessionId}/stream`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${tokenStorage.getAccessToken()}` },
            signal: controller.signal,
            openWhenHidden: true,
            async onopen(response) {
                if (!response.ok) {
                    throw new Error(`SSE 连接失败: ${response.status}`)
                }
                const resp = await api.chat.idMessagesCreate(currentSessionId, { input: content })
                if (resp.data.code !== 0) {
                    toast.error("发送失败: " + resp.data.message)
                }
            },
            onmessage(msg) {
                if (msg.event !== "agent") return
                let event: AgentEvent
                try {
                    event = JSON.parse(msg.data)
                } catch (e) {
                    return
                }
                if (event.type === "text") {
                    agentMessage.content += event.message
                } else if (event.type === "error") {
                    toast.error(event.message)
                    agentMessage.content += (agentMessage.content ? "\n" : "") + event.message
                } else if (event.type === "done") {
                    controller.abort()
                }
            },
            onclose() {
                // 服务器在 agent 完成本次流式响应后主动关闭连接
            },
            onerror(err) {
                throw err
            }
        })
    } catch (e) {
        if (!controller.signal.aborted) {
            toast.error("对话失败: 服务器错误")
        }
    } finally {
        if (!agentMessage.content) {
            const idx = messages.value.indexOf(agentMessage)
            if (idx !== -1) messages.value.splice(idx, 1)
        }
        if (streamController === controller) {
            streamController = null
            isStreaming.value = false
        }
    }
}

onMounted(async () => {
    isLogin.value = userStorage.getCurrentUser() !== null
    if (isLogin.value) {
        await newSession()
    }
})

onBeforeUnmount(() => {
    streamController?.abort()
    streamController = null
})
</script>

<template>
    <Motion
        :initial="{ y: 40, opacity: 0 }"
        :animate="{ y: 0, opacity: 1 }"
        :transition="{ duration: 0.5, type: 'spring' }"
    >
        <div ref="scrollRef" class="absolute bottom-22 left-1/2 -translate-x-1/2 w-170 flex flex-col space-y-1 max-h-100 overflow-y-auto no-scrollbar">
            <AnimatePresence>
                <Motion
                    v-for="(message, index) in messages"
                    :key="index"
                    :initial="{ y: 20, opacity: 0 }"
                    :animate="{ y: 0, opacity: 1 }"
                    :transition="{ duration: 0.1, type: 'spring' }"
                    class="bg-white/85 backdrop-blur-sm border border-gray-200 shadow rounded-2xl flex flex-col px-2 py-1 min-w-30 max-w-140 break-words"
                    :class="[message.role === 'user' ? 'ml-auto' : 'mr-auto']"
                >
                    <span class="text-sm text-gray-500">{{ message.role }}</span>
                    <span>{{message.content}}</span>
                </Motion>
            </AnimatePresence>
        </div>
        <Motion
            layout
            v-if="showPanel"
            :initial="{ y: 20, opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :transition="{ duration: 0.2, type: 'spring' }"
            as="div"
            class="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 max-h-64 overflow-y-auto bg-white/85 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg my-1 mx-5"
        >
            <li
                v-for="(command, i) in filteredCommands"
                :key="command.name"
                @click="selectCommand(command)"
                @mouseenter="activeIndex = i"
                :class="[
                'flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors',
                i === activeIndex ? 'bg-white' : '']"
            >
                <span class="font-bold text-blue-500">{{ command.name }}</span>
                <span class="text-sm text-gray-500">{{ command.description }}</span>
            </li>
        </Motion>

        <nav class="flex items-center fixed border-none shadow-2xl w-175 min-h-15 bottom-5 left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-sm rounded-4xl overflow-hidden px-5 py-2 space-x-2">
            <img
                v-if="isLogin"
                class="h-10 w-10 rounded-full object-cover"
                src="/icon.ico" alt="t"
            />
            <div v-if="isLogin" class="flex flex-col">
                <span >{{ userStorage.getCurrentUser()?.nickname }}</span>
                <span class="text-sm text-gray-500">@ {{ userStorage.getCurrentUser()?.username }}</span>
            </div>
            <div v-if="!isLogin">
                <RouterLink to="/login">登录</RouterLink>
                <RouterLink to="/register">注册</RouterLink>
            </div>
            <hr class="h-6 w-px border-0 bg-gray-300">

            <textarea
                ref="textareaRef"
                v-model="text"
                @input="handleInput"
                @keydown.enter.exact.prevent="handleEnter"
                :disabled="!isLogin"
                class="flex-1 border-none outline-none h-full field-sizing-content max-h-40 bg-transparent disabled:cursor-not-allowed" placeholder="给吃白饭的大肥鱼发送消息... "/>
        </nav>
    </Motion>
</template>

<style scoped>
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}
</style>
