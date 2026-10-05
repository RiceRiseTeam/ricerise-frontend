<script setup lang="ts">

import MapComponent, { type MapPoint } from "@/components/MapComponent.vue";
import {onMounted, ref} from "vue";
import InfoSidebarComponent from "@/components/InfoSidebarComponent.vue";
import UploadSidebarComponent from "@/components/UploadSidebarComponent.vue";

import NProgress from 'nprogress'
import api from "@/api/http";
import type { DtoLocationDto } from "@/api/api";
import type {MapUploadForm} from "@/schemas/mapSchema.ts";
import {useToast} from "@/composables/message.ts";
import BottomNavbarComponent from "@/components/BottomNavbarComponent.vue";
import CreateSidebarComponent from "@/components/CreateSidebarComponent.vue";
import {userStorage} from "@/store/auth";

const mapComponentRef = ref<InstanceType<typeof MapComponent> | null> (null)
const infoSidebarComponent = ref<InstanceType<typeof InfoSidebarComponent> | null>(null)
const uploadSidebarComponent = ref<InstanceType<typeof UploadSidebarComponent> | null>(null)
const createSidebarComponent = ref<InstanceType<typeof CreateSidebarComponent> | null>(null)

const currentLnglat = ref<{lng: number; lat: number} | null>(null)
const currentAddress = ref<string | null>(null)

const toast = useToast()

async function onMapRightClick(pos: {lng: number; lat: number}){
    infoSidebarComponent.value?.sidebar?.close()
    uploadSidebarComponent.value?.sidebar?.open()
    currentAddress.value = "- loading..."
    currentLnglat.value = pos
    const address = await mapComponentRef.value?.parseAddressAsync([pos.lng, pos.lat])
    currentAddress.value = address ?? "- 获取地址失败!"
}

function onMapLeftClick(){

}

async function onMapViewChange(southWest: AMap.LngLat | undefined, northEast: AMap.LngLat | undefined){
    if (!southWest || !northEast) return
    const locations = await api.map.locationViewCreate({max_lat: northEast.lat, max_lng: northEast.lng, min_lat: southWest.lat, min_lng: southWest.lng})
    console.log(locations.data)
    if (locations.data.code != 0) {
        return
    }
    const points: MapPoint[] = []
    locations.data.data?.forEach((loc: DtoLocationDto) => {
        if (!loc.name || !loc.longitude || !loc.latitude) return
        points.push({
            name: loc.name,
            lnglat: AMap.LngLat.from([loc.longitude, loc.latitude]),
            onClick: () => {
                uploadSidebarComponent.value?.sidebar?.close()
                infoSidebarComponent.value?.open(loc)
            }
        })
    })

    await mapComponentRef.value?.syncMarkers(points)
}

async function onUpload(form: MapUploadForm){
    if (!currentLnglat.value){
        toast.error("获取坐标点错误")
        return
    }
    try{
        const resp = await api.map.locationsCreate({
            name: form.name,
            address: form.address,
            description: form.description,
            latitude: currentLnglat.value?.lat ?? 0,
            longitude: currentLnglat.value?.lng ?? 0
        })
        if (resp.data.code != 20000){
            toast.error("上传失败: " + resp.data.message)
            return
        }

        toast.success("上传成功!")
        uploadSidebarComponent.value?.sidebar?.close()
    }catch (e){
        toast.error("上传失败: 服务器错误")
    }
}

function onCreateDinner(loc: DtoLocationDto){
    infoSidebarComponent.value?.sidebar?.close()
    createSidebarComponent.value?.open(loc)
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
        <InfoSidebarComponent ref="infoSidebarComponent" @on-create="onCreateDinner"></InfoSidebarComponent>
        <UploadSidebarComponent ref="uploadSidebarComponent" @onSubmit="onUpload" :address="currentAddress"></UploadSidebarComponent>
        <BottomNavbarComponent></BottomNavbarComponent>
        <CreateSidebarComponent ref="createSidebarComponent"></CreateSidebarComponent>
    </div>
</template>

