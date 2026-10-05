<script setup lang="ts">

import {userLoginSchema, type UserRegisterForm, userRegisterSchema} from "@/schemas/userSchema.ts";
import {AlignLeft, LoaderCircle} from "@respeak/lucide-motion-vue";
import {ErrorMessage, Field, Form} from "vee-validate";
import {Motion} from "motion-v";
import {onMounted} from "vue";
import NProgress from "nprogress";
import api from "@/api/http.ts";
import {useToast} from "@/composables/message.ts";
import { useRouter } from "vue-router"

const toast = useToast()
const router = useRouter()

async function onSubmit(form: any){
    form = form as UserRegisterForm
    try {
        const resp = await api.auth.registerCreate({
            username: form.username,
            nickname: form.nickname,
            email: form.email,
            password: form.password,
        })

        if (resp.data.code !== 0){
            toast.error("注册失败: " + resp.data.message)
            return
        }

        toast.success("注册成功! 正在跳转")
        router.replace({name: "login"})
    }catch (e){
        toast.error("注册失败: 服务器错误")
    }
}

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
            class="flex rounded-3xl border border-gray-200 shadow overflow-hidden w-170"
        >
            <Motion
                layout
                as="div"
                class="bg-blue-400 pl-3 pt-2 flex w-50"
                :transition="{ duration: 0.2, ease: 'easeInOut', type: 'spring', delay: 0.1}"
            >
                <div>
                    <AlignLeft animate class="text-white"></AlignLeft>
                    <h1 class="text-5xl font-bold text-white text-shadow pl-5">注册</h1>
                    <span class="text-white mx-20 whitespace-nowrap">饭卡信息填写</span>
                </div>
            </Motion>
            <Form
                :validation-schema="userRegisterSchema"
                @submit="onSubmit"
                v-slot="{ meta }"
                class="space-y-2 px-5 py-10 w-full"
            >
                <div>
                    <label for="userId" class="w-full block text-sm font-medium text-gray-700">用户名</label>
                    <Field
                        name="username"
                        id="username"
                        type="text"
                        class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                        :class="{ 'border-red-500': meta.touched && !meta.valid }"
                    />
                    <div class="min-h-7">
                        <ErrorMessage name="username" class="px-3 py-2 text-sm text-red-600" />
                    </div>
                </div>
                <div>
                    <label for="nickname" class="w-full block text-sm font-medium text-gray-700">昵称</label>
                    <Field
                        name="nickname"
                        id="nickname"
                        type="text"
                        class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                        :class="{ 'border-red-500': meta.touched && !meta.valid }"
                    />
                    <div class="min-h-7">
                        <ErrorMessage name="nickname" class="px-3 py-2 text-sm text-red-600" />
                    </div>
                </div>
                <div>
                    <label for="email" class="w-full block text-sm font-medium text-gray-700">邮箱</label>
                    <Field
                        name="email"
                        id="email"
                        type="email"
                        class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                        :class="{ 'border-red-500': meta.touched && !meta.valid }"
                    />
                    <div class="min-h-7">
                        <ErrorMessage name="email" class="px-3 py-2 text-sm text-red-600" />
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
                    <div class="min-h-7">
                        <ErrorMessage name="password" class="px-3 py-2 text-sm text-red-600" />
                    </div>
                </div>
                <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700">确认密码</label>
                    <Field
                        name="confirmPassword"
                        id="confirmPassword"
                        type="password"
                        class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 transition-colors"
                    />
                    <div class="min-h-7">
                        <ErrorMessage name="confirmPassword" class="px-3 py-2 text-sm text-red-600" />
                    </div>
                </div>
                <hr class="border-gray-200 my-4 py-3 mx-auto w-[75%]">
                <button type="submit" class="rounded-lg w-full border border-gray-200 px-3 py-2 outline-none focus:border-b-blue-300 hover:bg-blue-300 hover:text-white transition-colors">申请饭卡</button>
            </Form>
        </Motion>
    </div>
</template>