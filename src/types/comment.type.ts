import { TBaseTimestamps } from "./base.type";
import { TUser } from "./user.type";

export type TComment = {
    id: string;
    articleId: string;
    content: string;
    level: number;
    parentId: string | null;
    replyCount: number;
    userId: string;
    Users: TUser;
} & TBaseTimestamps;

export type TCreateCommentReq = {
    articleId: string;
    content: string;
    parentId: string | null;
};

export type TListComment = {
    id?: string;
    articleId: string;
    content: string;
    level: number;
    parentId: string | null;
    replyCount: number;
    userId: string;
    created_at?: string;
    updated_at?: string;
    isDeleted?: boolean;
    Users: {
        id?: string;
        email?: string;
        full_name: string;
        avatar?: string | undefined;
        googleId?: string | undefined;
        roleId?: string;
        isTotp?: boolean;
        created_at?: string;
        updated_at?: string;
        isDeleted?: boolean;
    };
};
