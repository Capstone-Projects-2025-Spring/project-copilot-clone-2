export const convertToSnakeCase = (obj: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
            key.replace(/([A-Z])/g, "_$1").toLowerCase(), // Convert camelCase to snake_case
            value
        ])
    );
}