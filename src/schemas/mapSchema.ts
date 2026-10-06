import { z } from "zod";

export const mapUploadSchema = z.object({
    name: z.string("名称不得为空")
        .min(2, "名称过短 (<2)")
        .max(128, "名称过长 (>128)"),
    address: z.string("地址不得为空"),
    description: z.string("描述不得为空")
        .min(2,"描述过短 (<2)")
        .max(1024,"描述过长 (>1024)")
})

export const mapCommentSchema = z.object({
    rank: z.int("请打分").min(1).max(5),
    content: z.string("请输入评价内容").min(2).max(1024)
})

export type MapUploadForm = z.infer<typeof mapUploadSchema>;
export type MapCommentSchema = z.infer<typeof mapCommentSchema>