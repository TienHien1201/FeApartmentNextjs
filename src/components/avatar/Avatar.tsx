import { checkPathImage } from "@/helpers/function.helper";
import { Avatar as AvatarMantine, AvatarProps } from "@mantine/core";
import { forwardRef } from "react";

type TProps = {
    full_name?: string;
    avatar?: string;
} & AvatarProps;

const Avatar = forwardRef<HTMLDivElement, TProps & React.ComponentPropsWithoutRef<"div">>(({ full_name, avatar, ...props }, ref) => {
    return (
        <AvatarMantine
            {...props}
            ref={ref}
            alt="avatar"
            src={checkPathImage(avatar)}
            color={`initials`}
            name={!avatar ? (full_name as string | undefined) : `??`}
            variant="filled"
        ></AvatarMantine>
    );
});

Avatar.displayName = "Avatar";

export default Avatar;
