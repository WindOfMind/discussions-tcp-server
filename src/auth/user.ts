export const validateUsername = (username: string): boolean => {
    if (!/^\w+$/.test(username)) {
        return false;
    }

    return true;
};

export const COMMENT_USER_NAME_REGEX = /\B@(\w+)\b/g;
