import { z } from "zod";
import { nameRegex, emailRegex, passwordRegex } from "./regex";

// Zod Schema
export const signUpSchema = z.object({
    name: z.string()
        .min(3, "Full Name must be at least 3 characters")
        .max(40, "Full Name must be at most 40 characters")
        .regex(nameRegex, "Enter a valid name"),

    email: z.string()
        .min(1, "Email is required")
        .regex(emailRegex, "Enter a valid email"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            passwordRegex,
            "Password must contain uppercase, lowercase, number and special character"
        ),

    rePassword: z.string().min(1, "Confirm Password is required"),


    dateOfBirth: z.string()
        .min(1, "Your Birth date is required")
        .refine(
            (date) => {
                const today = new Date();
                const birthDate = new Date(date);
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                return age >= 18;
            },
            { message: "You must be at least 18 years old" }
        ),

    gender: z.string()
        .min(1, "Your Gender is required")
        .refine((gender) => gender === "male" || gender === "female", {
            message: "Gender must be either Male or Female",
        }),


}).refine((data) => data.password === data.rePassword, {
    message: "Passwords do not match",
    path: ["rePassword"]});