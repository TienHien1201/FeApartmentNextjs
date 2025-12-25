export type TBaseTimestamps = {
    isDeleted: boolean;
    created_at: string;
    updated_at: string;
};

export type TSocketRes<T> = {
    status: string;
    message: string;
    data: T;
};
