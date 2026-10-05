import { createRouter, createWebHistory } from "vue-router"
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {userStorage} from "@/store/auth";

NProgress.configure({
    minimum: 0.1
})

const routes = [
    {
        path: "/",
        name: "home",
        component: () => import("@/views/HomeView.vue"),
        meta: { requiresAuth: true }
    },
    {
        path: "/register",
        name: "register",
        component: () => import("@/views/RegisterView.vue"),
        meta: { guestOnly: true }
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/views/LoginView.vue"),
        meta: { guestOnly: true }
    },
    {
        path: "/invite",
        name: "invite",
        component: () => import("@/views/InviteView.vue"),
        meta: { requiresAuth: true }
    },
    {
        path: "/dinner",
        name: "dinner",
        component: () => import("@/views/DinnerView.vue"),
        meta: { requiresAuth: true }
    },
    {
        path: "/admin",
        name: "admin",
        component: () => import("@/views/AdminView.vue"),
        meta: {
            requiresAuth: true,
            adminOnly: true
        }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
]


const router = createRouter({
    history: createWebHistory(),
    routes}
)

router.beforeEach((to) => {
    const isLoggedIn = userStorage.getCurrentUser() !== null

    if (to.meta.guestOnly && isLoggedIn) {
        return { name: "home" }
    }

    if (to.meta.requiresAuth && !isLoggedIn) {
        return {
            name: "login",
            query: { redirect: to.fullPath }
        }
    }

    if (to.meta.adminOnly && (userStorage.getCurrentUser()?.permissionLevel ?? 0) < 1){
        return { name: "home" }
    }

    return true
})

router.beforeEach((to, from, next) => {
    NProgress.start()
    next()
})

router.onError(() => {
    NProgress.done()
})

export default router