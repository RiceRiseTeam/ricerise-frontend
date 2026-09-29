<script setup lang="ts">

import SidebarComponent from "@/components/SidebarComponent.vue";
import {ref} from "vue";

const sidebar = ref<InstanceType<typeof SidebarComponent> | null>(null)

defineExpose({
    sidebar
})
</script>

<template>
    <SidebarComponent ref="sidebar" tittle="饭点详情">

    </SidebarComponent>
</template>