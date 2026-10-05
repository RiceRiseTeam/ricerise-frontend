<script setup lang="ts">

import {type UserLoginForm, userLoginSchema} from "@/schemas/userSchema.ts";
import {ErrorMessage, Field, Form, useForm} from "vee-validate";
import api from "@/api/http.ts";
import {useToast} from "@/composables/message.ts";
import {tokenStorage, userStorage} from "@/store/auth.ts";
import {Motion} from "motion-v"
import {onMounted, ref} from "vue";
import NProgress from "nprogress";
import { AlignLeft, LoaderCircle  } from '@respeak/lucide-motion-vue'
import { useRouter } from "vue-router"

const toast = useToast()
const router = useRouter()
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function onSubmit(form: any){
    form = form as UserLoginForm
    isExpanded.value = true
    try {
        const resp = await api.auth.loginCreate({
            user_id: form.userId,
            password: form.password
        })
        if (resp.status !== 200 || resp.data?.code !== 0){
            isExpanded.value = false
            toast.error("登录失败: " + resp.data?.message)
            return
        }
        const token = resp.data?.data?.access_token ?? ""
        tokenStorage.setAccessToken(token)
        userStorage.setCurrentUser(resp.data?.data?.user)
        toast.success("登录成功")
        await sleep(500)
        router.replace({name: "home"})
    }catch (e){
        isExpanded.value = false
        toast.error("登录失败: 服务器连接错误")
    }
}
const isExpanded = ref(false)

onMounted(() => {
    NProgress.done()
})
</script>

<template>
    <div class="flex h-full w-full items-center justify-center bg-white">
        <Motion
            :initial="{ y: 20, opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :transition="{ duration: 0.5 }"
            as="div"
            class="flex rounded-3xl border border-gray-200 shadow overflow-hidden w-170 h-100"
        >
            <Motion
                layout
                as="div"
                class="bg-blue-400 pl-3 pt-2 flex"
                :class="[isExpanded ? 'w-full' : 'w-50']"
                :transition="{ duration: 0.2, ease: 'easeInOut', type: 'spring'}"
            >
                <div>
                    <AlignLeft animate class="text-white"></AlignLeft>
                    <h1 class="text-5xl font-bold text-white text-shadow pl-5">登录</h1>
                    <span class="text-white mx-25 whitespace-nowrap">饭来~</span>
                </div>

                <div class="relative w-full" v-if="isExpanded">
                    <div class="absolute bottom-2 right-7 flex">
                        <LoaderCircle animate class="text-white px-1"></LoaderCircle>
                        <span class="text-white">饭卡加载中...</span>
                    </div>
                </div>
            </Motion>
            <Form
                :validation-schema="userLoginSchema"
                @submit="onSubmit"
                v-slot="{ meta }"
                class="space-y-2 px-5 py-10"
                :class="isExpanded ? 'hidden' :'w-full'"
            >
                <div>
                    <label for="userId" class="w-full block text-sm font-medium text-gray-700">用户名/邮箱</label>
                    <Field
                            name="userId"
                            id="userId"
                            type="text"
                            class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                            :class="{ 'border-red-500': meta.touched && !meta.valid }"
                    />
                    <div class="min-h-6">
                        <ErrorMessage name="userId" class="px-3 py-2 text-sm text-red-600" />
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
                    <Field
                            name="password"
                            id="password"
                            type="password"
                            class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                    />
                    <div class="min-h-6">
                        <ErrorMessage name="password" class="px-3 py-2 text-sm text-red-600" />
                    </div>
                </div>
                <hr class="border-gray-200 my-4 py-3 mx-auto w-[75%]">
                <button type="submit" class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 hover:bg-blue-300 hover:text-white transition-colors">提交</button>
            </Form>
        </Motion>
    </div>
</template>

<style scoped>

</style>