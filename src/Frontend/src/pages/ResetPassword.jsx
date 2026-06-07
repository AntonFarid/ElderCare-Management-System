import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiServices } from '../services/AuthApi';
import { addToast } from '@heroui/toast';
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { Input, Button } from '@heroui/react';

// Zod schema for reset password validation
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, 'Password must contain uppercase, lowercase, and a number'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible1, setIsVisible1] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get email and token from URL params if available
  const defaultEmail = searchParams.get('email') || '';
  const defaultToken = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultEmail,
      token: defaultToken
    }
  });

  const toggleVisibility1 = () => setIsVisible1(!isVisible1);
  const toggleVisibility2 = () => setIsVisible2(!isVisible2);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await apiServices.resetPassword(data);
      addToast({
        title: 'Success',
        description: response.data.message || 'Password has been reset successfully.',
        color: 'success',
      });
      // Redirect to signin
      navigate('/signin');
    } catch (err) {
      console.error(err);
      
      // Handle validation errors from backend
      const errorMessage = err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.';
      
      addToast({
        title: 'Error',
        description: errorMessage,
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Please enter your email, the token you received, and your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            variant="bordered"
            {...register('email')}
            isInvalid={!!errors.email}
            errorMessage={errors.email?.message}
            className="w-full"
            isReadOnly={!!defaultEmail}
          />

          <Input
            type="text"
            label="Reset Token"
            placeholder="Paste your reset token here"
            variant="bordered"
            {...register('token')}
            isInvalid={!!errors.token}
            errorMessage={errors.token?.message}
            className="w-full"
          />

          <Input
            label="New Password"
            placeholder="Enter new password"
            variant="bordered"
            endContent={
              <button className="focus:outline-none" type="button" onClick={toggleVisibility1}>
                {isVisible1 ? (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            type={isVisible1 ? "text" : "password"}
            startContent={<Lock className="w-4 h-4 text-gray-400" />}
            {...register('newPassword')}
            isInvalid={!!errors.newPassword}
            errorMessage={errors.newPassword?.message}
          />

          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            variant="bordered"
            endContent={
              <button className="focus:outline-none" type="button" onClick={toggleVisibility2}>
                {isVisible2 ? (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            type={isVisible2 ? "text" : "password"}
            startContent={<Lock className="w-4 h-4 text-gray-400" />}
            {...register('confirmNewPassword')}
            isInvalid={!!errors.confirmNewPassword}
            errorMessage={errors.confirmNewPassword?.message}
          />

          <Button
            type="submit"
            color="success"
            isLoading={isLoading}
            className="w-full font-semibold text-white mt-4"
          >
            Reset Password
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/signin"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel and return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
