"use client";

import NodataOverlay from "@/components/no-data/NodataOverlay";
import { multiRAF } from "@/helpers/function.helper";
import { useAppSelector } from "@/redux/hooks";
import { useGetChatMessage } from "@/api/tantask/chat.tanstacl";
import { TAllmessage, TStateChat } from "@/types/chat.type";
import { Fragment, useEffect, useRef, useState } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import RecipientMessageItem from "../../message/recipient/RecipientMessageItem";
import SenderMessageItem from "../../message/sender/SenderMessageItem";
import LoadingGetMessage from "./LoadingGetMessage";
import ScrollToBottom from "./ScrollToBottom";

type TProps = {
    stateChat: TStateChat;
    dataSendMessage: TAllmessage;
};

export default function MessageList({ stateChat, dataSendMessage }: TProps) {
    const totalPageRef = useRef(0);
    const totalItemRef = useRef(0);
    const hasScrolledInitiallyRef = useRef(false);
    const shouldScrollRef = useRef(false);
    const isAtBottomRef = useRef(true);

    const [page, setPage] = useState(1);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [allMessages, setAllMessages] = useState<TAllmessage[]>([]);

    const virtuosoRef = useRef<VirtuosoHandle>(null);

    const user = useAppSelector((state) => state.user.info);

    const chatMessage = useGetChatMessage({
        pagination: { pageIndex: page, pageSize: 10 },
        filters: { chatGroupId: stateChat.chatGroupId },
        sort: { sortBy: `created_at`, isDesc: true },
    });

    /* ================= PAGINATION INFO ================= */

    useEffect(() => {
        if (chatMessage.data?.totalPage) totalPageRef.current = chatMessage.data.totalPage;
        if (chatMessage.data?.totalItem) totalItemRef.current = chatMessage.data.totalItem;
    }, [chatMessage.data?.totalPage, chatMessage.data?.totalItem]);

    useEffect(() => {
        isAtBottomRef.current = isAtBottom;
    }, [isAtBottom]);

    /* ================= LOAD API MESSAGES ================= */

    useEffect(() => {
        if (!chatMessage.data?.items) return;

        const messages = chatMessage.data.items.reverse();

        setAllMessages((prev) => {
            if (prev.length === 0) return messages;

            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = messages.filter((m) => !existingIds.has(m.id));

            return [...newMessages, ...prev];
        });
    }, [chatMessage.data?.items]);

    /* ================= INITIAL SCROLL ================= */

    useEffect(() => {
        if (!hasScrolledInitiallyRef.current && allMessages.length > 0) {
            hasScrolledInitiallyRef.current = true;
            multiRAF(scrollToBottom);
        }
    }, [allMessages.length]);

    /* ================= SOCKET MESSAGE ================= */

    useEffect(() => {
        if (!dataSendMessage?.chat_group_id) return;

        // chỉ append message đúng room đang mở
        if (Number(dataSendMessage.chat_group_id) !== Number(stateChat.chatGroupId)) return;

        // tránh duplicate khi API load trùng socket
        setAllMessages((prev) => {
            if (prev.some((m) => m.id === dataSendMessage.id)) return prev;
            return [...prev, dataSendMessage];
        });

        // scroll logic
        if (dataSendMessage.sender.id === user?.id || isAtBottomRef.current) {
            shouldScrollRef.current = true;
        }
    }, [dataSendMessage, stateChat.chatGroupId, user?.id]);

    /* ================= SCROLL WHEN MESSAGE APPENDED ================= */

    useEffect(() => {
        if (shouldScrollRef.current) {
            shouldScrollRef.current = false;
            multiRAF(scrollToBottom);
        }
    }, [allMessages.length]);

    /* ================= LOAD MORE ================= */

    const handleStartReached = () => {
        if (chatMessage.isFetching || page >= totalPageRef.current) return;
        setPage((prev) => prev + 1);
    };

    const scrollToBottom = () => {
        virtuosoRef.current?.scrollToIndex({
            index: allMessages.length - 1,
            align: "end",
        });
    };

    const firstItemIndex = Math.max(0, totalItemRef.current - allMessages.length);

    /* ================= RENDER ================= */

    return (
        <div style={{ position: "relative", height: "100%" }}>
            <ScrollToBottom isAtBottom={isAtBottom} onClick={scrollToBottom} />
            <LoadingGetMessage isLoading={chatMessage.isLoading} />
            <NodataOverlay visible={!chatMessage.isLoading && allMessages.length === 0} />

            <Virtuoso
                ref={virtuosoRef}
                data={allMessages}
                firstItemIndex={firstItemIndex}
                style={{ height: "100%" }}
                itemContent={(index, messageItem: TAllmessage) => {
                    const isMe = messageItem.sender.id === user?.id;

                    return (
                        <Fragment key={messageItem.id}>
                            {isMe ? (
                                <SenderMessageItem
                                    messageItem={{
                                        avatar: user?.avatar,
                                        full_name: user?.full_name,
                                        message_text: messageItem.message_text,
                                        created_at: messageItem.created_at,
                                        userId: messageItem.sender.id,
                                        roleId: user?.roleId || "",
                                    }}
                                />
                            ) : (
                                <RecipientMessageItem
                                    messageItem={{
                                        avatar: messageItem.sender.avatar,
                                        full_name: messageItem.sender.full_name,
                                        message_text: messageItem.message_text,
                                        created_at: messageItem.created_at,
                                        userId: messageItem.sender.id,
                                        roleId: messageItem.sender.role_id,
                                    }}
                                />
                            )}
                        </Fragment>
                    );
                }}
                atBottomStateChange={setIsAtBottom}
                startReached={handleStartReached}
            />
        </div>
    );
}
