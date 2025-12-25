import { Box, Group, MantineSize, Text } from "@mantine/core";
import Avatar from "../avatar/Avatar";

type TProps = {
    fw?: string;
    sizeAvatar?: number | (string & {}) | MantineSize | undefined;
    full_name?: string;
    avatar?: string;
};

export default function TagUser({ full_name, avatar, fw = `normal`, sizeAvatar = `md` }: TProps) {
    // console.log({ full_name });
    return (
        <Group wrap="nowrap" gap={5}>
            <Box sx={{ flexShrink: 0 }}>
                <Avatar size={sizeAvatar} full_name={full_name} avatar={avatar} />
            </Box>
            <Text fw={fw} truncate>
                {full_name}
            </Text>
        </Group>
    );
}
