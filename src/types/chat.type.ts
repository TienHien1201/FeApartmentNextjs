import { TBaseTimestamps } from "./base.type";
import { TUser } from "./user.type";

export type TAllmessage = {
    id: number;
    message_text: string;
    created_at: string;
    chat_group_id: string;
    sender: {
        id: string;
        full_name: string;
        avatar: string;
        role_id: string;
    };
};
export type TMessageItem = {
    message_text: string;
    avatar: string | undefined;
    full_name: string | undefined;
    userId: string;
    roleId: string;
    created_at: string;
};

export type TStateChat = {
    chatGroupId: number;
    chatGroupName: string;
    chatGroupMembers: TStateChatMember[];
};

export type TStateChatMember = {
    userId: string;
    full_name: TUser["full_name"];
    avatar: TUser["avatar"];
    roleId: string;
};

export type TChatGroup = {
    id: string;
    name?: string;
    ownerId: string;
    Owner: TUser;
    ChatGroupMembers: TChatGroupMember[];
} & TBaseTimestamps;

export type TChatGroupMember = {
    id: string;
    userId: string;
    chatGroupId: string;
    Users: TUser;
    created_at: string;
    updated_at: string;
} & TBaseTimestamps;

export type TCreateRoomRes = {
    chatGroupId: number;
};

export type TCreateRoomReq = {
    accessToken: string;
    targetUserIds: string[];
    name?: string;
};

export type TSendMessageReq = {
    message: string;
    accessToken: string;
    chatGroupId: number;
};

export type TJoinRoomReq = {
    chatGroupId: string;
    accessToken: string;
};

export type TJoinRoomRes = {
    chatGroupId: string;
};

export type TLeaveRoomReq = {
    chatGroupId: string;
};
export type TSocketEvent<T = any> = {
    type: string;
    data?: T;
    message?: string;
};
