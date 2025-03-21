import { User } from "../types/user";

const USER_ENDPOINT: string = "http://127.0.0.1:8001/users";

export async function registerUser(id: string, firstName: string, lastName: string, email: string): Promise<User> {
    const response = await fetch(USER_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: id,
            first_name: firstName,
            last_name: lastName,
            email: email,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to register user");
    }

    return data;
}
