import { useFindOneFriend, useFriendStatus } from "@/api/tantask/friend.tanstack";
import { SOCKET_CHAT_MES } from "@/constant/chat.constant";
import { addChatOpened, emitToEvent, listenToEvent } from "@/helpers/chat.helper";
import { getAccessToken } from "@/helpers/cookies.helper";
import { resError } from "@/helpers/function.helper";
import { useSocket } from "@/hooks/socket.hook";
import { useAppSelector } from "@/redux/hooks";
import { TCreateRoomReq, TCreateRoomRes } from "@/types/chat.type";
import { TfriendshipAction, TStatusFriend, TStatusResult } from "@/types/friend.type";
import { TUser } from "@/types/user.type";
import { Button, Group } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

/* ================= FRIEND ACTION ================= */

function getFriendAction(info: { id?: string }, detailUser: { id?: string }, findOneFriend: any): TStatusResult {
    const isSender = findOneFriend?.userId === info?.id;
    const status = findOneFriend?.status as TStatusFriend | undefined;

    let nextStatus: TStatusFriend = "pending";
    let text = "Kết bạn";
    let disabled = false;

    const daysPassed = findOneFriend?.updated_at ? (Date.now() - new Date(findOneFriend.updated_at).getTime()) / (1000 * 3600 * 24) : 8;

    if (!info?.id || !detailUser?.id) {
        return { nextStatus, text: "Đăng nhập để kết bạn", disabled: true };
    }

    if (isSender) {
        switch (status) {
            case "pending":
                text = "Đã gửi";
                disabled = true;
                break;
            case "accepted":
                nextStatus = "removed";
                text = "Huỷ kết bạn";
                break;
            case "declined":
                if (daysPassed < 7) {
                    text = "Đã từ chối";
                    disabled = true;
                } else {
                    nextStatus = "pending";
                }
                break;
            case "removed":
                nextStatus = "pending";
                break;
        }
    } else {
        switch (status) {
            case "pending":
                nextStatus = "accepted";
                text = "Xác nhận";
                break;
            case "accepted":
                nextStatus = "removed";
                text = "Huỷ kết bạn";
                break;
            case "declined":
                if (daysPassed < 7) {
                    text = "Đã từ chối";
                    disabled = true;
                } else {
                    nextStatus = "pending";
                }
                break;
            case "removed":
                nextStatus = "pending";
                break;
        }
    }

    return { nextStatus, text, disabled };
}

/* ================= COMPONENT ================= */

type Props = {
    detailUser: TUser;
};

export default function ButtonsFriend({ detailUser }: Props) {
    const { socket } = useSocket();
    const info = useAppSelector((state) => state.user.info);

    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const friendStatus = useFriendStatus();
    const findOneFriend = useFindOneFriend(detailUser.id);

    /* ================= SOCKET LISTENER ================= */

    useEffect(() => {
        if (!socket) return;

        const unsubscribe = listenToEvent(socket, SOCKET_CHAT_MES.CREATE_ROOM, (data: TCreateRoomRes) => {
            if (!data?.chatGroupId) return;

            addChatOpened(
                {
                    chatGroupId: data.chatGroupId,
                    chatGroupName: "",
                    chatGroupMembers: [
                        {
                            userId: detailUser.id,
                            full_name: detailUser.full_name,
                            avatar: detailUser.avatar,
                            roleId: detailUser.roleId,
                        },
                        {
                            userId: info!.id,
                            full_name: info!.full_name,
                            avatar: info!.avatar,
                            roleId: info!.roleId,
                        },
                    ],
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["chat-list-user-item"] });
                    queryClient.invalidateQueries({ queryKey: ["chat-list-user-bubble"] });
                }
            );

            setLoading(false);
        });

        return () => unsubscribe();
    }, [socket, info, detailUser, queryClient]);

    /* ================= ACTIONS ================= */

    const handleChat = async () => {
        if (!socket || !info?.id || !detailUser.id) return;

        const accessToken = await getAccessToken();
        if (!accessToken) {
            toast.error("Vui lòng đăng nhập");
            return;
        }

        setLoading(true);

        const payload: TCreateRoomReq = {
            targetUserIds: [detailUser.id],
            accessToken,
        };

        emitToEvent(socket, SOCKET_CHAT_MES.CREATE_ROOM, payload);
    };

    const actionInfo = getFriendAction(info || {}, detailUser || {}, findOneFriend.data);

    const handleMakeFriend = () => {
        if (!info || !detailUser) return;

        if (actionInfo.disabled) {
            toast.error(actionInfo.text);
            return;
        }

        const payload: TfriendshipAction = {
            userId: info.id,
            friendId: detailUser.id,
            status: actionInfo.nextStatus,
        };

        friendStatus.mutate(payload, {
            onSuccess: () => {
                const map: Record<string, string> = {
                    pending: "Đã gửi lời mời kết bạn",
                    accepted: "Đã chấp nhận kết bạn",
                    removed: "Đã xoá bạn",
                };
                toast.success(map[actionInfo.nextStatus] || "Thành công");
            },
            onSettled: () => {
                queryClient.invalidateQueries({ queryKey: ["find-one-friend"] });
            },
        });
    };

    /* ================= UI ================= */

    return (
        <Group>
            <Button
                disabled={actionInfo.disabled}
                loading={friendStatus.isPending || findOneFriend.isLoading || findOneFriend.isFetching}
                onClick={handleMakeFriend}
            >
                {actionInfo.text}
            </Button>

            <Button loading={loading} onClick={handleChat} variant="default">
                Nhắn tin
            </Button>
        </Group>
    );
}
