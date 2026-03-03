import { Input } from "@heroui/input";
import React from 'react';
import { EyeFilledIcon, EyeSlashFilledIcon } from "@heroui/shared-icons";
import { Select, SelectItem } from "@heroui/select";
import { Alert, Button } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema } from "../assets/helpers/singUpValidationRules";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToast, ToastProvider } from "@heroui/toast";
import { HeartHandshake } from 'lucide-react';
import { Sparkles } from 'lucide-react';


export default function SignUp() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();


  const { handleSubmit, register, formState: { errors } } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  async function familySignUp(registerData) {
    setIsLoading(true);
    setErrMsg("");

    try {
      console.log("Data being sent:", registerData);

      const response = await apiServices.familySignUp(registerData);
      console.log("Success:", response.data);

      addToast({
        title: "Account Created Successfully",
        description: "You can now sign in with your new account.",
        color: "success",
      })

      navigate("/SignIn");

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
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide">CARING WITH COMPASSION</span>
            </div>

            <h1 className="mt-10 text-5xl font-bold leading-tight">
              Join our family today and experience exceptional senior care
            </h1>

            <p className="mt-6 text-lg text-white/80">
              A safe, comfortable home environment with specialized medical care, engaging activities, and compassionate support for your loved ones
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
              <h3 className="text-xl font-semibold">24/7 Professional Care</h3>
              <p className="text-white/70 mt-2">
                Experienced medical staff and caregivers available around the clock
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl">
              <h3 className="text-xl font-semibold">Comprehensive Services</h3>
              <p className="text-white/70 mt-2">
                Recreation programs, physical therapy, nutritious meals, and regular health monitoring
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">

          <form
            onSubmit={handleSubmit(familySignUp)}
            className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl space-y-5"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Create your account
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Start your journey with SilverNest
              </p>
            </div>

            {errMsg && (
              <Alert color="danger">
                {errMsg}
              </Alert>
            )}

            <Input
              {...register("firstName")}
              {...getInputProps("First Name", "text", errors.firstName)}
            />

            <Input
              {...register("lastName")}
              {...getInputProps("Last Name", "text", errors.lastName)}
            />

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

            <Input
              {...register("rePassword")}
              {...getInputProps("Confirm Password", "password", errors.rePassword)}
              type={isVisible ? "text" : "password"}
            />

            <Input
              {...register("phoneNumber")}
              {...getInputProps("Phone Number", "number", errors.phoneNumber)}
            />

            <Select
              {...register("relationship")}
              {...getInputProps("Relationship", undefined, errors.relationship)}
            >
              <SelectItem key="son">Son</SelectItem>
              <SelectItem key="daughter">Daughter</SelectItem>
              <SelectItem key="grandson">Grandson</SelectItem>
              <SelectItem key="granddaughter">Granddaughter</SelectItem>
              <SelectItem key="other">Other</SelectItem>
            </Select>
            <Input
              {...register("familyCode")}
              {...getInputProps("Family Access Code", "text", errors.familyCode)}
            />


            <Button
              isLoading={isLoading}
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-500 text-white font-medium"
            >
              Create Account
            </Button>

            <p className="text-sm text-center text-gray-500">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/SignIn")}
                className="text-blue-400 cursor-pointer font-medium"
              >
                Log in
              </span>
            </p>

          </form>

        </div>
      </div>
    </>
  );

}