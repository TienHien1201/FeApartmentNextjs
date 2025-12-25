import { useSearchNameUser } from "@/api/tantask/user.tanstack";
import NodataOverlay from "@/components/no-data/NodataOverlay";
import TagUser from "@/components/tag-user/TagUser";
import { SOCKET_CHAT_MES } from "@/constant/chat.constant";
import { emitToEvent, listenToEvent } from "@/helpers/chat.helper";
import { getAccessToken } from "@/helpers/cookies.helper";
import { animationList } from "@/helpers/function.helper";
import { useSocket } from "@/hooks/socket.hook";
import { useAppSelector } from "@/redux/hooks";
import { TCreateRoomReq, TCreateRoomRes, TSocketEvent } from "@/types/chat.type";
import { TUser } from "@/types/user.type";
import { ActionIcon, Box, Button, Divider, Group, Input, LoadingOverlay, Modal, Stack, Text } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type TProps = {
    opened: boolean;
    close: () => void;
};

export default function ModalCreateChatGroup({ opened, close }: TProps) {
    const [search, setSearch] = useState("");
    const searchNameUser = useSearchNameUser();
    const id = useAppSelector((state) => state.user.info?.id);
    const [userSelected, setUserSelected] = useState<TUser[]>([]);
    const [chatGroupName, setChatGroupName] = useState("");
    const { socket } = useSocket();
    const info = useAppSelector((state) => state.user.info);
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    /* ================= SEARCH USER ================= */
    const handleSearch = useDebouncedCallback((query: string) => {
        if (!query.trim()) return;
        searchNameUser.mutate(query);
    }, 500);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.currentTarget.value);
        handleSearch(event.currentTarget.value);
    };

    useEffect(() => {
        if (!opened) setSearch("");
    }, [opened]);

    /* ================= SOCKET LISTENER ================= */

    useEffect(() => {
        if (!socket) return;

        const unsubscribeSuccess = listenToEvent(socket, SOCKET_CHAT_MES.CREATE_ROOM, (data: TCreateRoomRes) => {
            toast.success("Tạo nhóm thành công");

            close();
            setChatGroupName("");
            setUserSelected([]);
            setLoading(false);

            queryClient.invalidateQueries({
                queryKey: ["chat-group-list-many"],
            });
        });

        const unsubscribeError = listenToEvent(socket, SOCKET_CHAT_MES.ERR, (err) => {
            toast.error(err?.message || "Create Room Failed");
            setLoading(false);
        });

        return () => {
            unsubscribeSuccess();
            unsubscribeError();
        };
    }, [socket, queryClient, close]);

    /* ================= ACTIONS ================= */
    const handleRemoveUser = (user: TUser) => {
        setUserSelected((prev) => prev.filter((u) => u.id !== user.id));
    };

    const handleCreateChatGroup = async () => {
        if (!socket || !info) return;

        const accessToken = await getAccessToken();
        if (!accessToken) return toast.error("Vui lòng đăng nhập");
        if (!chatGroupName.trim()) return toast.warning("Vui lòng nhập tên nhóm");
        if (userSelected.length < 2) return toast.warning("Vui lòng chọn ít nhất 2 người");

        setLoading(true);

        const payload: TCreateRoomReq = {
            targetUserIds: userSelected.map((u) => u.id),
            name: chatGroupName,
            accessToken,
        };

        emitToEvent(socket, SOCKET_CHAT_MES.CREATE_ROOM, payload);
    };

    /* ================= UI ================= */
    return (
        <Modal
            opened={opened}
            onClose={close}
            size="md"
            withCloseButton={false}
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            styles={{ body: { padding: 10 } }}
        >
            <Stack>
                <Input value={chatGroupName} onChange={(e) => setChatGroupName(e.target.value)} placeholder="Tên nhóm" />

                <Stack gap={5}>
                    <Text>Thành viên nhóm</Text>

                    <Group>
                        {userSelected.map((user, i) => (
                            <Group key={i} sx={{ ...animationList(i), gap: 5, flexWrap: "nowrap" }}>
                                <Box maw={380}>
                                    <TagUser sizeAvatar="sm" full_name={user.full_name} avatar={user.avatar} />
                                </Box>
                                <ActionIcon size="xs" radius="xl" variant="default" onClick={() => handleRemoveUser(user)}>
                                    <IconX size="70%" stroke={1.5} />
                                </ActionIcon>
                            </Group>
                        ))}
                    </Group>

                    <Box>
                        <Input
                            value={search}
                            onChange={handleChange}
                            leftSection={<IconSearch size={16} />}
                            variant="unstyled"
                            placeholder="Tìm kiếm người dùng"
                        />
                        <Divider />

                        <Stack
                            gap={2}
                            sx={{
                                minHeight: 100,
                                maxHeight: 500,
                                overflowY: "auto",
                                padding: 5,
                                position: "relative",
                            }}
                        >
                            <LoadingOverlay visible={searchNameUser.isPending} overlayProps={{ bg: "transparent" }} />

                            <NodataOverlay
                                width={50}
                                visible={
                                    !searchNameUser.isPending &&
                                    (!searchNameUser.data || searchNameUser.data.items?.length === 0 || searchNameUser.isError)
                                }
                            />

                            {searchNameUser.data?.items?.map((user, i) => {
                                if (user.id === id) return null;

                                return (
                                    <Box
                                        key={i}
                                        onClick={() =>
                                            setUserSelected((prev) =>
                                                prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
                                            )
                                        }
                                        sx={{
                                            ...animationList(i),
                                            padding: 5,
                                            cursor: "pointer",
                                            borderRadius: 5,
                                            "&:hover": {
                                                background: "var(--mantine-color-default-hover)",
                                            },
                                        }}
                                    >
                                        <TagUser sizeAvatar="sm" full_name={user.full_name} avatar={user.avatar} />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                </Stack>

                <Group justify="flex-end">
                    <Button variant="default" onClick={close}>
                        Đóng
                    </Button>
                    <Button loading={loading} onClick={handleCreateChatGroup}>
                        Tạo nhóm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
