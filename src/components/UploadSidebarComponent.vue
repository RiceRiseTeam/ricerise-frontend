<script setup lang="ts">

import SidebarComponent from "@/components/SidebarComponent.vue";
import {ref, watch} from "vue";
import {useToast} from "@/composables/message.ts";
import {ErrorMessage, Field, Form} from "vee-validate";
import {type MapUploadForm, mapUploadSchema} from "@/schemas/mapSchema.ts";

const props = defineProps<{
    address: string | null
}>()

const emit = defineEmits<{
    (e: "onSubmit", form: MapUploadForm) : void
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

async function onSubmit(form: any){
    console.log("t")
    emit("onSubmit", form as MapUploadForm)
}

</script>

<template>
    <SidebarComponent ref="sidebar" tittle="上传饭点">
        <Form
            :validation-schema="mapUploadSchema"
            @submit="onSubmit"
            class="flex flex-col space-y-2 w-full h-full"
        >
            <div class="flex items-center gap-2">
                <label for="name" class="text-sm">名称</label>
                <Field name="name" id="name" type="text" class="rounded-lg w-75 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
            </div>
            <ErrorMessage name="name" class="px-10 text-sm text-red-600" />

            <div class="flex items-center gap-2">
                <label for="address" class="text-sm">地址</label>
                <Field name="address" id="address" type="text" v-model="currentAddress" class="rounded-lg w-75 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
            </div>
            <ErrorMessage name="address" class="px-10 text-sm text-red-600" />

            <div class="flex items-center gap-2">
                <label for="description" class="text-sm">描述</label>
                <Field name="description" id="description" type="text" as="textarea" class="rounded-lg w-75 h-30 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
            </div>
            <ErrorMessage name="description" class="px-10 text-sm text-red-600" />

            <div class="flex items-center gap2 mt-auto">
                <button type="submit" class="rounded-lg w-100 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-400 hover:bg-blue-400 hover:text-white transition-colors">上传</button>
            </div>
        </Form>
    </SidebarComponent>
</template>