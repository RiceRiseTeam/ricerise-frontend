import { z } from "zod";
import {mapUploadSchema} from "@/schemas/mapSchema.ts";

export const dinnerCreateSchema = z.object({
    meet_time: z.coerce.date({
        error: "请输入时间",
    }).refine((date) => date > new Date(), {
        error: "日期时间必须晚于当前时间"
    }),
    max_people: z.int("请输入人数").min(2, "总不能一个人吃吧")
})

export type DinnerCreateForm = z.infer<typeof dinnerCreateSchema>;