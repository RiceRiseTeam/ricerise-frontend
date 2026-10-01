<script setup lang="ts">

import {AnimatePresence, Motion} from "motion-v";
import {useToast} from "@/composables/message.ts";
import { Check, Bell, X } from '@respeak/lucide-motion-vue'

const { toasts, remove } = useToast()
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-4 right-4 z-9999 gap-3 space-y-2">
            <AnimatePresence>
                <Motion
                    v-for="toast in toasts"
                    :key="toast.id"
                    as="div"
                    :initial="{ opacity: 0, x: 50, scale: 0.9 }"
                    :animate="{ opacity: 1, x: 0, scale: 1 }"
                    :exit="{ opacity: 0, x: 50, scale: 0.9 }"
                    :transition="{ type: 'spring', stiffness: 300, damping: 30 }"
                    class="flex rounded-lg items-center px-4 py-3 shadow-lg bg-white w-75 space-x-2"
                >
                    <Check animate class="text-green-600" v-if="toast.type=='success'"/>
                    <Bell animate class="text-blue-400" v-if="toast.type=='info'"/>
                    <X animate class="text-red-500" v-if="toast.type=='error'"/>

                    <span class="flex text-sm">{{toast.message}}</span>
                </Motion>
            </AnimatePresence>
        </div>
    </Teleport>
</template>