"use client";

import { NEXT_PUBLIC_BASE_DOMAIN } from "@/constant/app.constant";
import { getAccessToken } from "@/helpers/cookies.helper";
import { useAppSelector } from "@/redux/hooks";
import { createContext, useEffect, useRef, useState } from "react";

interface SocketContextType {
    socket: WebSocket | null;
    isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const info = useAppSelector((state) => state.user.info);

    useEffect(() => {
        let ws: WebSocket | null = null;

        (async () => {
            if (!info?.id) return;

            const accessToken = await getAccessToken();
            if (!accessToken) return;

            // IMPORTANT: ws:// + /ws
            const wsUrl = NEXT_PUBLIC_BASE_DOMAIN.replace(/^http/, "ws").replace(/\/+$/, "") + "/ws";

            console.log("Connecting WebSocket:", wsUrl);

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("WebSocket connected");
                setIsConnected(true);

                // Optional: send auth message if needed
                ws?.send(
                    JSON.stringify({
                        type: "AUTH",
                        payload: {
                            accessToken,
                        },
                    })
                );
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("WS message:", data);
                } catch (err) {
                    console.log("Invalid WS message", err);
                }
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected");
                setIsConnected(false);
            };

            ws.onerror = (err) => {
                console.log("WebSocket error", err);
            };

            socketRef.current = ws;
        })();

        return () => {
            if (socketRef.current) {
                console.log("Closing WebSocket connection");
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [info?.id]);

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                isConnected,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}
