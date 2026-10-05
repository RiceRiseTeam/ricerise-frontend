<script setup lang="ts">

import {ErrorMessage, Field, Form} from "vee-validate";
import SidebarComponent from "@/components/SidebarComponent.vue";
import {ref} from "vue";
import type {DtoLocationDto} from "@/api/api.ts";
import {type DinnerCreateForm, dinnerCreateSchema} from "@/schemas/dinnerSchema.ts";
import {VueDatePicker} from "@vuepic/vue-datepicker";
import '@vuepic/vue-datepicker/dist/main.css'
import api from "@/api/http.ts";
import {useToast} from "@/composables/message.ts";
import { useRouter } from "vue-router"

const toast = useToast()
const router = useRouter()
const sidebar = ref<InstanceType<typeof SidebarComponent> | null>(null)
const currentLocation = ref<DtoLocationDto | null>(null)

function open(loc: DtoLocationDto){
    console.log("open")
    currentLocation.value = loc
    sidebar.value?.open()
}

async function onSubmit(form: any){
    form = form as DinnerCreateForm
    try {
        const resp = await api.dinners.dinnersCreate({
            location_id: currentLocation.value?.id ?? 0,
            max_people: form.max_people,
            meet_time: form.meet_time.toISOString()
        })
        if (resp.data.code !== 20000) {
            toast.error("创建饭局失败: " + resp.data.message)
            return
        }
        toast.success("创建饭局成功!")
        await router.replace({name: "dinner"})
    }catch (e){
        toast.error("创建饭局失败: 服务器错误")
    }
}

defineExpose({
    sidebar,
    open
})
</script>

<template>
    <SidebarComponent ref="sidebar" tittle="创建饭局">
        <Form
            :validation-schema="dinnerCreateSchema"
            @submit="onSubmit"
            class="flex flex-col space-y-2 w-full h-full"
        >
            <div class="flex items-center gap-2">
                <label for="meet_time" class="text-sm">约见时间</label>
                <Field name="meet_time" id="meet_time" v-slot="{ field, errors  }" class="rounded-lg flex-1 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors">
                    <VueDatePicker
                        :model-value="field.value"
                        @update:model-value="field.onChange"
                        :enable-time-picker="true"
                        :format="'yyyy-MM-dd HH:mm'"
                        model-type="yyyy-MM-dd HH:mm"
                        :clearable="false"
                        :is-required="true"
                    >
                        <template #dp-input="{ value }">
                            <input
                                type="text"
                                class="form-control rounded-lg flex-1 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                                :class="{ 'is-invalid': !!errors.length }"
                                :value="value"
                                @blur="field.onBlur"
                                @input="field.onInput"
                                placeholder="请选择日期时间"
                                autocomplete="off"
                            />
                        </template>
                    </VueDatePicker>
                </Field>
            </div>
            <ErrorMessage name="meet_time" class="px-17 text-sm text-red-600" />

            <div class="flex items-center gap-2">
                <label for="max_people" class="text-sm">约见人数</label>
                <Field name="max_people" id="max_people" type="number" class="rounded-lg flex-1 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"/>
            </div>
            <ErrorMessage name="max_people" class="px-17 text-sm text-red-600" />

            <div class="flex items-center gap2 mt-auto">
                <button type="submit" class="rounded-lg w-100 border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-400 hover:bg-blue-400 hover:text-white transition-colors">饭来</button>
            </div>
        </Form>
    </SidebarComponent>
</template>