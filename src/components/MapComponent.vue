<script setup lang="ts">

import {onMounted, onUnmounted, ref, shallowRef} from "vue";
import Loader from "@amap/amap-jsapi-loader"
import "@vuemap/amap-jsapi-types"
import type {ReGeocodeResult} from "@vuemap/amap-jsapi-types/plugins/Geocoder";

const emit = defineEmits<{
    (e: "view-change", southWest: AMap.LngLat | undefined, northEast: AMap.LngLat | undefined): void
    (e: "right-click", pos: {lng: number; lat: number}): void
    (e: "left-click"): void
}>()
const containerRef = ref<HTMLDivElement | null>(null);
const map = shallowRef<AMap.Map | null>(null);
const geocoder = ref<AMap.Geocoder | null>(null);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);

;(window as any)._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
}

onMounted(async () => {
    const aMap = await Loader.load({
        key: import.meta.env.VITE_AMAP_KEY,
        version: "2.0",
        plugins: ["AMap.Geocoder", "AMap.Scale"]
    })

    if (containerRef.value == null) return

    map.value = new aMap.Map(containerRef.value,
            {
                viewMode: "2D",
                zoom: 13,
                zooms: [10, 24],
                center: [120.155, 30.25] // 杭州
            }
    )

    if (map.value == null) return

    aMap.plugin("AMap.Geocoder", () => {
        geocoder.value = new aMap.Geocoder()
    })

    if (geocoder.value == null) return

    map.value.on("moveend", () => {
        if (timer.value != null){
            clearTimeout(timer.value)
        }

        timer.value = setTimeout(() => {
            timer.value = null;
            const bounds = map.value?.getBounds()
            console.log("moveed")
            emit("view-change", bounds?.southWest, bounds?.northEast)
        }, 500);
    })

    map.value.on("rightclick", (e: any) => {  // 高德Amap 没有event类型支持
        const lnglat = (e.lnglat as AMap.LngLat)
        emit("right-click", {
            lng: lnglat.lng,
            lat: lnglat.lat,
        })
    })

    map.value.on("click", (e: any) => {
        emit("left-click")
    })
})

onUnmounted(() => {
    if (map.value != null){
        map.value.destroy()
        map.value = null
    }
    if (timer.value != null){
        clearTimeout(timer.value)
        timer.value = null
    }
})

async function parseAddressAsync(lnglat: [number, number]){
    return new Promise<string>((resolve, reject) => {
        geocoder.value?.getAddress(lnglat, (status: string, info: string | ReGeocodeResult) => {
            if (status == "complete"){
                // 我草了 any any any any 这里貌似vuemap 的类型声明和高德对不上
                if ((info as any).info == "OK"){
                    resolve((info as any).regeocode?.formattedAddress)
                    return
                }
            }
            reject(new Error("获取地理位置失败"))
        })
    })
}

export interface MapPoint {
  name: string
  lnglat: AMap.LngLat
}

async function syncMarkers(points: MapPoint[]){
    map.value?.remove(map.value?.getAllOverlays("marker"))
    const markers = points.map(point => {
        const marker = new AMap.Marker({
            position: point.lnglat,
            title: point.name
        })
        return marker
    })

    map.value?.add(markers)
}

defineExpose({
    parseAddressAsync,
    syncMarkers
})

</script>

<template>
    <div ref="containerRef" class="h-full w-full"></div>
</template>