<script setup lang="ts">

import {AnimatePresence, Motion} from "motion-v";
import {ref} from "vue";

defineProps<{
    tittle: string
}>()

const emit = defineEmits<{
    (e: 'on-open'): void
    (e: 'on-close'): void
}>()

const visible = ref(false)

function close(){
    if (visible.value) {
        visible.value = false
        emit("on-close")
    }
}

function open() {
    if (!visible.value) {
        visible.value = true
        emit("on-open")
    }
}

defineExpose({
    open,
    close
})

</script>

<template>
    <AnimatePresence>
        <Motion
                as="div"
                v-if="visible"
                :initial="{ x: -400, opacity: 0 }"
                :animate="{ x: 0, opacity: 1 }"
                :exit="{ x: -400, opacity: 0 }"
                :transition="{ type: 'spring', stiffness: 300, damping: 30 }"
                class="absolute left-0 top-0 z-20 flex h-full w-96 flex-col gap-4 bg-white/95 p-6 shadow-2xl backdrop-blur"
        >
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-800">{{tittle}}</h2>
                <button class="text-gray-400 hover:text-gray-600" @click="close()">✕</button>
            </div>
            <slot></slot>
        </Motion>
    </AnimatePresence>
</template>