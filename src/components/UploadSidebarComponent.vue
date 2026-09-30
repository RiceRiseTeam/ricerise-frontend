<script setup lang="ts">

import SidebarComponent from "@/components/SidebarComponent.vue";
import {ref, watch} from "vue";

const props = defineProps<{
    address: string | null
}>()

const sidebar = ref<InstanceType<typeof SidebarComponent> | null>(null)

defineExpose({
    sidebar
})

const currentAddress = ref(props.address)

watch(
        () => props.address,
        (val) => {
            currentAddress.value = val
        }
)

</script>

<template>
    <SidebarComponent ref="sidebar" tittle="上传饭点">
        <div class="flex items-center gap-2">
            <label class="text-sm">名称</label>
            <input class="rounded-lg w-75 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
        </div>

        <div class="flex items-center gap-2">
            <label class="text-sm">地址</label>
            <input v-model="currentAddress" class="rounded-lg w-75 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
        </div>

        <div class="flex items-center gap-2">
            <label class="text-sm">描述</label>
            <textarea class="rounded-lg w-75 h-30 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
        </div>

        <div class="flex items-center gap2 mt-auto">
            <button class="rounded-lg w-100 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 hover:bg-blue-300 hover:text-white transition-colors">上传</button>
        </div>
    </SidebarComponent>
</template>