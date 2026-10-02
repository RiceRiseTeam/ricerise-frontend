import { z } from "zod";

const password = z
    .string({error: "密码不得为空"})
    .trim()
    .min(12, "密码过短 (<12)")
    .max(32, "密码过长 (>32)")
    .regex(/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/, "用户只能包含字母、数字和英文符号")
export const userRegisterSchema = z.object({
    username: z
        .string({error: "用户名不得为空"})
        .trim()
        .min(8, "用户名过短 (<8)")
        .max(64, "用户名过长 (>64)")
        .regex(/^[A-Za-z0-9_]+$/, "用户只能包含字母、数字和下划线"),
    nickname: z.string("昵称不得为空")
        .trim()
        .min(8, "昵称过短 (<8)")
        .max(32, "昵称过长 (>32)")
        .regex(/^[\p{Script=Han}A-Za-z0-9_]+$/u, "昵称不得包含特殊符号"),
    email: z.email("邮箱格式不正确"),
    password: password,
    confirmPassword: password
}).refine((data) => data.confirmPassword === data.password, {
    path: ["confirmPassword"],
    error: "两次输入的密码不一致"
});

export type UserRegisterForm = z.infer<typeof userRegisterSchema>;

export const userLoginSchema = z.object(
    {
        userId: z.string("用户名/邮箱不得为空").trim(),
        password: password,
    }
)

export type UserLoginForm = z.infer<typeof userLoginSchema>;