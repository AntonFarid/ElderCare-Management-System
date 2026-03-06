import React, { useState, useEffect } from 'react';
import { Input, Button, Select, SelectItem, Alert, Progress, Divider } from "@heroui/react";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@heroui/shared-icons";
import {
  HeartHandshake, Sparkles, UserIcon, LockIcon, HeartIcon,
  ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon, SearchIcon
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { apiServices } from "../services/AuthApi";

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [elderlyList, setElderlyList] = useState([]);
  const [elderlySearch, setElderlySearch] = useState("");
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    relationship: "",
    customRelationship: "",
    elderlyId: "",
  });

  // Fetch elderly list for the "Connect to Loved One" step
  useEffect(() => {
    async function fetchElderly() {
      try {
        const res = await apiServices.getAllElderly();
        console.log("Elderly API response:", res.data);
        const elders = res.data?.data || [];
        console.log("Parsed elders:", elders);
        setElderlyList(Array.isArray(elders) ? elders : []);
      } catch (err) {
        console.error("Failed to fetch elderly list:", err);
        setElderlyList([]);
      }
    }
    fetchElderly();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
    if (field === "relationship") {
      setShowOtherRelationship(value === "Other");
    }
  };

  // Password strength logic
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z\d]/.test(pw)) score++;

    if (score <= 2) return { level: 25, label: "WEAK PASSWORD", color: "danger" };
    if (score <= 3) return { level: 50, label: "FAIR PASSWORD", color: "warning" };
    if (score <= 4) return { level: 75, label: "STRONG PASSWORD", color: "primary" };
    return { level: 100, label: "VERY STRONG", color: "success" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const validateStep1 = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = "First name is required";
    if (!formData.lastName.trim()) e.lastName = "Last name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Password must be at least 6 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) e.password = "Must have uppercase, lowercase, and number";
    if (!formData.confirmPassword) e.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!formData.elderlyId) e.elderlyId = "Please select a loved one";
    if (!formData.relationship) e.relationship = "Relationship is required";
    if (formData.relationship === "Other" && !formData.customRelationship.trim()) {
      e.customRelationship = "Please specify the relationship";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setErrMsg("");
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { handleNext(); return; }
    if (!validateStep2()) return;

    setIsLoading(true);
    setErrMsg("");

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phoneNumber || undefined,
        relationship: formData.relationship === "Other" ? formData.customRelationship : formData.relationship,
        elderlyId: parseInt(formData.elderlyId),
      };

      await apiServices.familySignUp(payload);

      addToast({
        title: "Account Created Successfully!",
        description: "You can now sign in with your new account.",
        color: "success",
      });

      navigate("/signin");
    } catch (error) {
      const res = error.response?.data;
      if (res?.message) setErrMsg(res.message);
      else if (res?.errors) setErrMsg(Object.values(res.errors).flat().join(". "));
      else setErrMsg(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredElderly = elderlyList.filter(e => {
    const name = `${e.firstName} ${e.lastName} ${e.roomNumber || ""}`.toLowerCase();
    return name.includes(elderlySearch.toLowerCase());
  });

  return (
    <div className="min-h-screen grid md:grid-cols-2">

      {/* LEFT SIDE */}
      <div className="hidden md:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold">SilverNest</h2>
        </div>

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
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 md:p-8 overflow-y-auto">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-5"
        >
          {/* Step Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Current Step</p>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Step {step} of 2: {step === 1 ? "Registration" : "Linking to Resident"}
                </h2>
              </div>
              <span className="text-xs font-semibold text-blue-500">{step === 1 ? "50%" : "100%"} Complete</span>
            </div>
            <Progress
              value={step === 1 ? 50 : 100}
              color="primary"
              size="sm"
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              {step === 1 ? "→ Next: Linking to Resident" : "← Previous: Registration"}
            </p>
          </div>

          {errMsg && <Alert color="danger">{errMsg}</Alert>}

          {/* STEP 1 */}
          {step === 1 && (
            <>
              {/* Personal Information */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={formData.firstName}
                    onValueChange={(v) => handleChange("firstName", v)}
                    isInvalid={!!errors.firstName}
                    errorMessage={errors.firstName}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Last Name"
                    placeholder="Smith"
                    value={formData.lastName}
                    onValueChange={(v) => handleChange("lastName", v)}
                    isInvalid={!!errors.lastName}
                    errorMessage={errors.lastName}
                    variant="bordered"
                    size="sm"
                  />
                </div>
                <div className="mt-3">
                  <Input
                    label="Email Address"
                    placeholder="john.smith@email.com"
                    type="email"
                    value={formData.email}
                    onValueChange={(v) => handleChange("email", v)}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                    variant="bordered"
                    size="sm"
                  />
                </div>
                <div className="mt-3">
                  <Input
                    label="Phone Number"
                    placeholder="(555) 123-4567"
                    value={formData.phoneNumber}
                    onValueChange={(v) => handleChange("phoneNumber", v)}
                    variant="bordered"
                    size="sm"
                  />
                </div>
              </div>

              <Divider />

              {/* Account Security */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Account Security
                  </h3>
                </div>
                <Input
                  label="Create Password"
                  placeholder="Min 6 characters"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onValueChange={(v) => handleChange("password", v)}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  variant="bordered"
                  size="sm"
                  endContent={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                      {showPassword ? <EyeSlashFilledIcon className="w-4 h-4" /> : <EyeFilledIcon className="w-4 h-4" />}
                    </button>
                  }
                />
                {formData.password && (
                  <div className="mt-1.5">
                    <Progress value={passwordStrength.level} color={passwordStrength.color} size="sm" />
                    <p className={`text-xs mt-0.5 font-semibold text-${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
                <div className="mt-3">
                  <Input
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onValueChange={(v) => handleChange("confirmPassword", v)}
                    isInvalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword}
                    variant="bordered"
                    size="sm"
                    endContent={
                      <div className="flex items-center gap-1">
                        {passwordsMatch && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400">
                          {showConfirm ? <EyeSlashFilledIcon className="w-4 h-4" /> : <EyeFilledIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
              >
                Continue to Step 2
              </Button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              {/* Connect to Loved One */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HeartIcon className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Connect to Loved One
                  </h3>
                </div>

                <Select
                  label="Select your loved one"
                  placeholder="Search by name or room..."
                  selectedKeys={formData.elderlyId ? [formData.elderlyId] : []}
                  onSelectionChange={(keys) => handleChange("elderlyId", [...keys][0] || "")}
                  isInvalid={!!errors.elderlyId}
                  errorMessage={errors.elderlyId}
                  variant="bordered"
                  size="sm"
                >
                  {filteredElderly.map((el) => (
                    <SelectItem key={String(el.id || el.Id)} textValue={`${el.firstName} ${el.lastName}`}>
                      <div className="flex justify-between">
                        <span>{el.firstName} {el.lastName}</span>
                        {el.roomNumber && <span className="text-xs text-gray-400">Room {el.roomNumber}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <div className="mt-3">
                  <Select
                    label="Relationship"
                    placeholder="Select your relationship"
                    selectedKeys={formData.relationship ? [formData.relationship] : []}
                    onSelectionChange={(keys) => handleChange("relationship", [...keys][0] || "")}
                    isInvalid={!!errors.relationship}
                    errorMessage={errors.relationship}
                    variant="bordered"
                    size="sm"
                  >
                    <SelectItem key="Son">Son</SelectItem>
                    <SelectItem key="Daughter">Daughter</SelectItem>
                    <SelectItem key="Grandson">Grandson</SelectItem>
                    <SelectItem key="Granddaughter">Granddaughter</SelectItem>
                    <SelectItem key="Spouse">Spouse</SelectItem>
                    <SelectItem key="Sibling">Sibling</SelectItem>
                    <SelectItem key="Niece">Niece</SelectItem>
                    <SelectItem key="Nephew">Nephew</SelectItem>
                    <SelectItem key="Other">Other</SelectItem>
                  </Select>
                </div>

                {showOtherRelationship && (
                  <div className="mt-3">
                    <Input
                      label="Specify Relationship"
                      placeholder="e.g. Legal Guardian"
                      value={formData.customRelationship}
                      onValueChange={(v) => handleChange("customRelationship", v)}
                      isInvalid={!!errors.customRelationship}
                      errorMessage={errors.customRelationship}
                      variant="bordered"
                      size="sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="flat"
                  className="flex-1"
                  startContent={<ArrowLeftIcon className="w-4 h-4" />}
                  onPress={handleBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium"
                  endContent={!isLoading && <ArrowRightIcon className="w-4 h-4" />}
                >
                  Register & Connect
                </Button>
              </div>
            </>
          )}

          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/signin")}
              className="text-blue-500 cursor-pointer font-medium hover:text-blue-400"
            >
              Login here
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}