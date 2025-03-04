export enum LogEvent {
    USER_ACCEPT = "USER_ACCEPT",
    USER_REJECT = "USER_REJECT",
    MODEL_GENERATE = "MODEL_GENERATE",
    MODEL_ERROR = "MODEL_ERROR",

    USER_SIGNUP = "USER_SIGNUP",
    USER_LOGIN = "USER_LOGIN",
    USER_LOGOUT = "USER_LOGOUT",

    USER_AUTH_GITHUB = "USER_AUTH_GITHUB",
}

export interface LogData {
    event: LogEvent;
    time_lapse: number;
    metadata: Record<string, any>;
}