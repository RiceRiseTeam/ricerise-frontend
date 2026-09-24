<script setup lang="ts">

import MapComponent from "@/components/MapComponent.vue";
import {ref} from "vue";

const mapComponentRef = ref<InstanceType<typeof MapComponent> | null> (null)

function onMapRightClick(pos: {lng: number; lat: number}){

}

function onMapLeftClick(){

}
</script>

<template>
    <div class="h-full">
        <MapComponent
                ref="mapComponentRef"
                @right-click="onMapRightClick"
                @
        />
    </div>
</template>

