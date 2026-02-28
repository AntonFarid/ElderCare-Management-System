import { z } from "zod";
import { nameRegex, emailRegex, passwordRegex } from "./regex";

// Zod Schema
export const signInSchema = z.object({
   
    email: z.string()
        .min(1, "Email is required")
        .regex(emailRegex, "Enter a valid email"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            passwordRegex,
            "Password must contain uppercase, lowercase, number and special character"
        ),
   
})