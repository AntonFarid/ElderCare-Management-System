import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { apiServices } from '../services/AuthApi';
import { addToast } from '@heroui/toast';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input, Button } from '@heroui/react';

// Zod schema for forgot password validation
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await apiServices.forgotPassword(data.email);
      addToast({
        title: 'Success',
        description: response.data.message || 'If your email is registered, you will receive a reset link shortly.',
        color: 'success',
      });
      // Don't auto-redirect immediately, let them read the toast
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: err.response?.data?.message || 'Something went wrong. Please try again.',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
          <p className="text-gray-500 mt-2 text-sm">
            No worries! Enter your email address below and we'll send you a password reset token.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              variant="bordered"
              {...register('email')}
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
              startContent={<Mail className="w-4 h-4 text-gray-400" />}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            color="primary"
            isLoading={isLoading}
            className="w-full font-semibold"
            endContent={!isLoading && <ArrowRight className="w-4 h-4" />}
          >
            Send Reset Token
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/signin"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
