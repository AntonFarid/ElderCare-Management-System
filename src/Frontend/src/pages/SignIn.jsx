import React from 'react';
import { EyeFilledIcon, EyeSlashFilledIcon } from "@heroui/shared-icons";
import { Alert, Button, Input } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "../assets/helpers/singInValidationRules";
import axios from "axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addToast, ToastProvider } from "@heroui/toast";
import { HeartHandshake } from 'lucide-react';
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { apiServices } from "../services/AuthApi";


export default function SignIn() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const navigate = useNavigate();
  const { setUserToken } = useContext(AuthContext)

  const { handleSubmit, register, formState: { errors } } = useForm({
    resolver: zodResolver(signInSchema),
  });

  async function signIn(loginData) {
    setIsLoading(true);
    setErrMsg("");

    try {
      console.log("Data being sent:", loginData);

      const response = await apiServices.signIn(loginData);
      const { token, userType } = response.data.data;

      localStorage.setItem("token", token);
      apiServices.setToken(token);
      setUserToken(token);

      addToast({
        title: "Welcome Back!",
        description: "Successfully logged in to your account.",
        color: "success",
      });

      // Role-based redirection
      if (userType === "Admin") {
        navigate("/admin/dashboard");
      } else if (userType === "FamilyMember") {
        navigate("/family/home");
      } else if (userType === "TeamLeader") {
        navigate("/teamleader/dashboard");
      } else if (userType === "Employee") {
        navigate("/employee/dashboard");
      } else {
        navigate("/SignIn");
      }

    } catch (error) {
      if (error.response) {
        setErrMsg(error.response.data.error || error.response.data.message || "Something went wrong");
        console.log("Error response:", error.response.data);
      } else {
        setErrMsg(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function getInputProps(label, type, field) {
    return {
      label,
      type,
      isInvalid: !!field,
      errorMessage: field?.message,
    };
  }

  return (
    <>

      <div className="min-h-screen grid md:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white">

          {/* Logo and Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold">SilverNest</h2>
          </div>

          {/* Main Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium tracking-wide">WELCOME BACK</span>
            </div>

            <h1 className="mt-10 text-5xl font-bold leading-tight">
              Great to see you again! Continue managing exceptional care.
            </h1>

            <p className="mt-6 text-lg text-white/80">
              Access your account to monitor resident care, update schedules, and stay connected with your team.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
              <h3 className="text-xl font-semibold">Stay Connected</h3>
              <p className="text-white/70 mt-2">
                Access real-time updates on residents and staff activities.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
              <h3 className="text-xl font-semibold">Secure Access</h3>
              <p className="text-white/70 mt-2">
                Your data is protected with industry-standard security measures.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <form
            onSubmit={handleSubmit(signIn)}
            className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl space-y-5"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your SilverNest account
              </p>
            </div>

            {errMsg && (
              <Alert color="danger">
                {errMsg}
              </Alert>
            )}

            <Input
              {...register("email")}
              {...getInputProps("Email Address", "email", errors.email)}
            />

            <Input
              {...register("password")}
              {...getInputProps("Password", "password", errors.password)}
              type={isVisible ? "text" : "password"}
              endContent={
                <button type="button" onClick={toggleVisibility}>
                  {isVisible ? <EyeSlashFilledIcon /> : <EyeFilledIcon />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-blue-500 cursor-pointer font-medium hover:text-blue-400">
                Forgot password?
              </Link>
            </div>

            <Button
              isLoading={isLoading}
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-400 text-white font-medium"
            >
              Sign In
            </Button>

            <p className="text-sm text-center text-gray-500">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/SignUp")}
                className="text-blue-500 cursor-pointer font-medium hover:text-blue-400"
              >
                Sign up
              </span>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}