declare const _default: {
    get: (key: string) => Promise<null>;
    set: (key: string, value: string) => Promise<void>;
    del: (key: string) => Promise<void>;
    lpush: (key: string, value: string) => Promise<void>;
    lpop: () => Promise<null>;
    lrem: () => Promise<void>;
    lrange: () => Promise<never[]>;
    llen: () => Promise<number>;
    on: () => void;
};
export default _default;
//# sourceMappingURL=redis.d.ts.map