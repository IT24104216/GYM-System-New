import { z } from 'zod';
import { BRANCH_OPTIONS } from '../../shared/constants/branches.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  branch: z.enum(BRANCH_OPTIONS),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'password must include an uppercase letter')
    .regex(/[a-z]/, 'password must include a lowercase letter')
    .regex(/\d/, 'password must include a number'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'password must include an uppercase letter')
    .regex(/[a-z]/, 'password must include a lowercase letter')
    .regex(/\d/, 'password must include a number'),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
