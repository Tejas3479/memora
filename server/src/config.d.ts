export declare const config: {
    server: {
        port: number;
        host: string;
        corsOrigin: string;
    };
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    qdrant: {
        url: string;
        apiKey: string | undefined;
    };
    jwt: {
        privateKey: string;
        publicKey: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    embedding: {
        mode: "cloud" | "local";
        voyageApiKey: string;
        dimension: number;
    };
    llm: {
        googleApiKey: string;
        model: string;
    };
    stripe: {
        secretKey: string;
        webhookSecret: string;
    };
    encryption: {
        tokenKey: string;
    };
    integrations: {
        slack: {
            clientId: string | undefined;
            clientSecret: string | undefined;
        };
        notion: {
            clientId: string | undefined;
            clientSecret: string | undefined;
        };
        google: {
            clientId: string | undefined;
            clientSecret: string | undefined;
        };
        github: {
            clientId: string | undefined;
            clientSecret: string | undefined;
        };
    };
};
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map