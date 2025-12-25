import { Text, Tooltip } from "@mantine/core";
import Avatar from "./Avatar";

type TProps = {
    full_name?: string;
    avatar?: string;
};

export default function AvatarTooltip({ full_name, avatar }: TProps) {
    return (
        <Tooltip
            label={
                <Text truncate maw={100}>
                    {full_name}
                </Text>
            }
            position="left"
        >
            <Avatar full_name={full_name} avatar={avatar} />
        </Tooltip>
    );
}
