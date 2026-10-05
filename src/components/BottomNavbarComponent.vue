<script setup lang="ts">
import {AnimatePresence, Motion} from "motion-v";
import {computed, nextTick, onMounted, type Ref, ref} from "vue";
import {userStorage} from "@/store/auth";
import {RouterLink} from "vue-router"

interface Command {
    name: string
    description: string
}

interface Message {
    role: string
    content: string
}

const text = ref('')
const showPanel = ref(false)
const activeIndex = ref(0)
const textareaRef = ref<HTMLTextAreaElement>()
const messages: Ref<Message[]> = ref([])

messages.value.push({
    role: "user",
    content: "你好"
}, {
    role: "agent",
    content: "你也好"
})

const commands: Command[] = [
    { name: "/chat",    description: "和大肥鱼聊天" },
    { name: "/search",   description: "搜索饭点" },
    { name: "/rest",   description: "重置大肥鱼上下文" },
    { name: "/schp",    description: "搜索匹配的参与者" },
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

onMounted(() => {
    isLogin.value = userStorage.getCurrentUser() !== null
})
</script>

<template>
    <Motion
        :initial="{ y: 40, opacity: 0 }"
        :animate="{ y: 0, opacity: 1 }"
        :transition="{ duration: 0.5, type: 'spring' }"
    >
        <div class="absolute bottom-22 left-1/2 -translate-x-1/2 w-170 flex flex-col">
            <AnimatePresence>
                <Motion
                    v-for="message in messages"
                    :initial="{ y: 20, opacity: 0 }"
                    :animate="{ y: 0, opacity: 1 }"
                    :transition="{ duration: 0.1, type: 'spring' }"
                    class="bg-white/85 backdrop-blur-sm border border-gray-200 shadow rounded-2xl flex flex-col px-2 py-1 min-w-30"
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
                class="flex-1 border-none outline-none h-full field-sizing-content max-h-40" placeholder="给吃白饭的大肥鱼发送消息... "/>
        </nav>
    </Motion>
</template>