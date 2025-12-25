import { CHAT_BUBBLE, CHAT_OPENED } from "@/constant/chat.constant";
import { TStateChat } from "@/types/chat.type";
import _ from "lodash";
import { logWithColor } from "./function.helper";

// Lấy chat đã mở từ localStorage
export const getChatOpened = (key: string): TStateChat[] => {
    const stringLocal = localStorage.getItem(key);
    if (stringLocal === null) return [];
    const result = JSON.parse(stringLocal);
    if (!_.isArray(result)) return [];
    return result;
};

// Thêm chat mới
export const addChatOpened = (stateChatNew: TStateChat, onSuccess?: () => void) => {
    const chatListOpened = getChatOpened(CHAT_OPENED);
    const chatListBubble = getChatOpened(CHAT_BUBBLE);

    const isAdd = [...chatListOpened, ...chatListBubble].find((stateChat: TStateChat) => stateChat.chatGroupId === stateChatNew.chatGroupId);

    if (isAdd === undefined) {
        if (chatListOpened.length >= 2) {
            const itemOpenedRemove = chatListOpened.shift();
            chatListOpened.push(stateChatNew);

            if (itemOpenedRemove) chatListBubble.push(itemOpenedRemove);

            localStorage.setItem(CHAT_OPENED, JSON.stringify(chatListOpened));
            localStorage.setItem(CHAT_BUBBLE, JSON.stringify(chatListBubble));
        } else {
            chatListOpened.push(stateChatNew);
            localStorage.setItem(CHAT_OPENED, JSON.stringify(chatListOpened));
        }
    }

    if (onSuccess) onSuccess();
};

// Xóa chat
export const removeChatOpened = (stateChat: TStateChat, key: string, onSuccess?: () => void) => {
    const listChatOpened = getChatOpened(key);

    if (_.isArray(listChatOpened)) {
        _.remove(listChatOpened, (itemChat) => itemChat.chatGroupId === stateChat.chatGroupId);
        localStorage.setItem(key, JSON.stringify(listChatOpened));
    }

    if (onSuccess) onSuccess();
};

// Mở chat từ bubble
export const openChatFromBuble = (stateChat: TStateChat, onSuccess?: () => void) => {
    removeChatOpened(stateChat, CHAT_BUBBLE);
    addChatOpened(stateChat);
    if (onSuccess) onSuccess();
};

// =================== WebSocket Thuần ===================

// Lắng nghe sự kiện WebSocket thuần
export function listenToEvent(socket: WebSocket, type: string, callback: (data: any) => void) {
    if (!socket) return () => {};

    const handler = async (event: MessageEvent) => {
        try {
            let rawData = event.data;

            if (rawData instanceof Blob) {
                rawData = await rawData.text();
            }

            if (rawData instanceof ArrayBuffer) {
                rawData = new TextDecoder().decode(rawData);
            }

            if (typeof rawData !== "string") return;

            const res = JSON.parse(rawData);

            if (res.type === type) {
                callback(res.data);
            }
        } catch (e) {
            console.error("Invalid WS message", e);
        }
    };

    socket.addEventListener("message", handler);

    return () => {
        socket.removeEventListener("message", handler);
    };
}

// Gửi dữ liệu
export function emitToEvent(socket: WebSocket, type: string, payload: any) {
    if (!socket) return;

    socket.send(
        JSON.stringify({
            type,
            payload,
        })
    );

    logWithColor.sln().mes("🔵 EMIT - ", { color: "blue" }).mes(type, { color: "cyan", fontWeight: "bold" }).eln();
}

// Gỡ listener
export function removeEventListener(socket: WebSocket) {
    if (!socket) return;
    socket.onmessage = null;
    logWithColor.sln().mes("🔴 REMOVED ALL EVENT LISTENERS", { color: "red" }).eln();
}
