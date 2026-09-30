import { createRouter, createWebHistory } from "vue-router"
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
    minimum: 0.1
})

const routes = [
    {
        path: "/",
        name: "home",
        component: () => import("@/views/HomeView.vue")
    },
    {
        path: "/register",
        name: "register",
        component: () => import("@/views/RegisterView.vue")
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/views/LoginView.vue")
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

router.beforeEach((to, from, next) => {
    NProgress.start()
    next()
})

router.onError(() => {
    NProgress.done()
})

export default router