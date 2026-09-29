<script setup lang="ts">

import MapComponent from "@/components/MapComponent.vue";
import {ref} from "vue";
import InfoSidebarComponent from "@/components/InfoSidebarComponent.vue";
import UploadSidebarComponent from "@/components/UploadSidebarComponent.vue";

const mapComponentRef = ref<InstanceType<typeof MapComponent> | null> (null)
const infoSidebarComponent = ref<InstanceType<typeof InfoSidebarComponent> | null>(null)
const uploadSidebarComponent = ref<InstanceType<typeof UploadSidebarComponent> | null>(null)

const uploadVisible = ref(false)
const currentLnglat = ref<{lng: number; lat: number} | null>(null)
const currentAddress = ref<string | null>(null)
async function onMapRightClick(pos: {lng: number; lat: number}){
    uploadSidebarComponent.value?.sidebar?.open()
    currentAddress.value = "[]loading..."
    currentLnglat.value = pos
    const address = await mapComponentRef.value?.parseAddressAsync([pos.lng, pos.lat])
    currentAddress.value = address ?? "[]获取地址失败!"
}

function onMapLeftClick(){
    infoSidebarComponent.value?.sidebar?.open()
}

function onMapViewChange(southWest: AMap.LngLat | undefined, northEast: AMap.LngLat | undefined){

}

function onSidebarClose(){
    uploadVisible.value = false
    currentAddress.value = null
    currentLnglat.value = null
}


</script>

<template>
    <div class="h-full">
        <MapComponent
                ref="mapComponentRef"
                @right-click="onMapRightClick"
                @left-click="onMapLeftClick"
                @view-change="onMapViewChange"
        />
        <InfoSidebarComponent ref="infoSidebarComponent"></InfoSidebarComponent>
        <UploadSidebarComponent ref="uploadSidebarComponent" :address="currentAddress"></UploadSidebarComponent>
    </div>
</template>

