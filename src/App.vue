<script setup lang="ts">
import { RouterView } from "vue-router"
</script>

<template>
    <RouterView v-slot = "{ Component }">
        <Transition mode="out-in">
            <component :is = "Component"></component>
        </Transition>
    </RouterView>
</template>

<style scoped>
</style>
