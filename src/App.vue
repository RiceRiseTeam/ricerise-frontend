<script setup lang="ts">
import {RouterView} from "vue-router"
import MessageContainerComponent from "@/components/MessageContainerComponent.vue";
</script>

<template>
    <RouterView v-slot = "{ Component, route }">
        <Transition mode="out-in">
            <component :is = "Component" :key="route.fullPath"></component>
        </Transition>
    </RouterView>
    <MessageContainerComponent></MessageContainerComponent>
</template>

<style scoped>
</style>
