<script setup lang="ts">

import MapComponent, { type MapPoint } from "@/components/MapComponent.vue";
import {onMounted, ref} from "vue";
import InfoSidebarComponent from "@/components/InfoSidebarComponent.vue";
import UploadSidebarComponent from "@/components/UploadSidebarComponent.vue";

import NProgress from 'nprogress'
import api from "@/api/http";
import type { DtoLocationDto } from "@/api/api";

const mapComponentRef = ref<InstanceType<typeof MapComponent> | null> (null)
const infoSidebarComponent = ref<InstanceType<typeof InfoSidebarComponent> | null>(null)
const uploadSidebarComponent = ref<InstanceType<typeof UploadSidebarComponent> | null>(null)

const currentLnglat = ref<{lng: number; lat: number} | null>(null)
const currentAddress = ref<string | null>(null)

async function onMapRightClick(pos: {lng: number; lat: number}){
    infoSidebarComponent.value?.sidebar?.close()
    uploadSidebarComponent.value?.sidebar?.open()
    currentAddress.value = "- loading..."
    currentLnglat.value = pos
    const address = await mapComponentRef.value?.parseAddressAsync([pos.lng, pos.lat])
    currentAddress.value = address ?? "- 获取地址失败!"
}

function onMapLeftClick(){
    uploadSidebarComponent.value?.sidebar?.close()
    infoSidebarComponent.value?.sidebar?.open()
}

async function onMapViewChange(southWest: AMap.LngLat | undefined, northEast: AMap.LngLat | undefined){
    if (!southWest || !northEast) return
    const locations = await api.map.locationViewCreate({max_lat: northEast.lat, max_lng: northEast.lng, min_lat: southWest.lat, min_lng: southWest.lng})
    if (locations.data.code != 20000) {
        return
    }
    const points: MapPoint[] = []
    locations.data.data?.forEach((loc: DtoLocationDto) => {
        if (!loc.name || !loc.longitude || !loc.latitude) return
        points.push({
            name: loc.name,
            lnglat: AMap.LngLat.from([loc.longitude, loc.latitude])
        })
    })

    await mapComponentRef.value?.syncMarkers(points)
}

onMounted(() => {
    NProgress.done()
})


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

