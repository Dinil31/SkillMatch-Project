import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
    .object({
        name: z
            .string()
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name cannot exceed 50 characters'),
        email: z.string().email('Please enter a valid email address'),
        phone: z
            .string()
            .min(9, 'Please enter a valid phone number')
            .max(15, 'Phone number is too long')
            .regex(/^(\+94|0)[0-9]{9}$/, 'Enter a valid Sri Lankan number (e.g. 0771234567)'),
        password: z
            .string()
            .min(6, 'Password must be at least 6 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string(),
        role: z.enum(['customer', 'worker'], {
            required_error: 'Please select a role',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
    .object({
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

// ─── Gig Schema ──────────────────────────────────────────────────────────────

export const gigSchema = z.object({
    title: z
        .string()
        .min(10, 'Title must be at least 10 characters')
        .max(100, 'Title cannot exceed 100 characters'),
    description: z
        .string()
        .min(50, 'Description must be at least 50 characters')
        .max(2000, 'Description cannot exceed 2000 characters'),
    category: z.string().min(1, 'Please select a category'),
    price: z
        .number({ invalid_type_error: 'Price must be a number' })
        .min(100, 'Price must be at least LKR 100'),
    pricingModel: z.enum(['fixed', 'hourly', 'daily', 'custom']).default('fixed'),
    pricingDescription: z.string().max(200, 'Pricing description cannot exceed 200 characters').optional(),
    deliveryTime: z
        .number({ invalid_type_error: 'Delivery time must be a number' })
        .min(1, 'Delivery time must be at least 1').optional(),
    deliveryUnit: z.enum(['hours', 'days', 'weeks']).default('days').optional(),
    tags: z.array(z.string()).optional(),
    locationType: z.enum(['island-wide', 'remote', 'districts', 'radius']).default('island-wide'),
    allowedDistricts: z.array(z.string()).optional(),
    locationCoordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }).optional(),
    locationRadiusKm: z.number().min(1).max(500).optional(),
});

// ─── Job Schema ──────────────────────────────────────────────────────────────

export const jobSchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title cannot exceed 100 characters'),
    description: z
        .string()
        .min(20, 'Description must be at least 20 characters')
        .max(2000, 'Description cannot exceed 2000 characters'),
    category: z.string().min(1, 'Please select a category'),
    budget: z
        .number({ invalid_type_error: 'Budget must be a number' })
        .min(100, 'Budget must be at least LKR 100'),
    deadline: z.string().optional(),
    location: z.string().optional(),
    workerId: z.string().optional(),
});

// ─── Review Schema ───────────────────────────────────────────────────────────

export const reviewSchema = z.object({
    rating: z
        .number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
    comment: z
        .string()
        .min(10, 'Comment must be at least 10 characters')
        .max(1000, 'Comment cannot exceed 1000 characters'),
    jobId: z.string().min(1, 'Job ID is required'),
    workerId: z.string().min(1, 'Worker ID is required'),
});

// ─── Worker Profile Schema ───────────────────────────────────────────────────

export const workerProfileSchema = z.object({
    bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
    skills: z.array(z.string()).max(20, 'Cannot have more than 20 skills').optional(),
    experience: z.number().min(0).max(50).optional(),
    category: z.string().min(1, 'Please select a category'),
    hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').optional(),
    availability: z.enum(['available', 'busy', 'unavailable']).optional(),
    locationType: z.enum(['island-wide', 'remote', 'districts', 'radius']).default('island-wide'),
    allowedDistricts: z.array(z.string()).optional(),
    locationRadiusKm: z.number().optional(),
    locationCoordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }).optional(),
});

// ─── Message Schema ──────────────────────────────────────────────────────────

export const messageSchema = z.object({
    message: z
        .string()
        .min(1, 'Message cannot be empty')
        .max(2000, 'Message cannot exceed 2000 characters'),
    receiverId: z.string().min(1, 'Receiver is required'),
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type GigFormValues = z.infer<typeof gigSchema>;
export type JobFormValues = z.infer<typeof jobSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type WorkerProfileFormValues = z.infer<typeof workerProfileSchema>;
export type MessageFormValues = z.infer<typeof messageSchema>;
