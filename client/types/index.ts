// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'customer' | 'worker' | 'admin';
    profileImage?: string;
    phone?: string;
    isVerified: boolean;
    status: 'active' | 'banned' | 'suspended';
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// ─── Worker Profile ──────────────────────────────────────────────────────────

export type WorkerAvailability = 'available' | 'busy' | 'unavailable';

export type ServiceCategory =
    | 'Web Development'
    | 'Mobile Development'
    | 'Graphic Design'
    | 'Digital Marketing'
    | 'Content Writing'
    | 'Video Editing'
    | 'Photography'
    | 'Plumbing'
    | 'Electrical'
    | 'Carpentry'
    | 'Painting'
    | 'Cleaning'
    | 'Tutoring'
    | 'Cooking'
    | 'Other';

export interface WorkerLocation {
    city: string;
    district: string;
    province: string;
}

export interface WorkerProfile {
    _id: string;
    userId: User | string;
    bio: string;
    skills: string[];
    experience: number;
    location: WorkerLocation;
    hourlyRate: number;
    availability: WorkerAvailability;
    certifications: string[];
    portfolio: string[];
    category: ServiceCategory;
    averageRating: number;
    totalReviews: number;
    completedJobs: number;
    isVerified: boolean;
    totalEarnings: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Gig ─────────────────────────────────────────────────────────────────────

export interface Gig {
    _id: string;
    workerId: User | string;
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    pricingModel?: 'fixed' | 'hourly' | 'daily' | 'custom';
    pricingDescription?: string;
    images: string[];
    deliveryTime?: number;
    deliveryUnit?: 'hours' | 'days' | 'weeks';
    locationType: 'island-wide' | 'remote' | 'districts' | 'radius';
    allowedDistricts?: string[];
    locationCoordinates?: {
        type: 'Point';
        coordinates: [number, number]; // [lng, lat]
    };
    locationRadiusKm?: number;
    workerRating?: number;
    workerReviewsCount?: number;
    isActive: boolean;
    tags: string[];
    totalOrders: number;
    views: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Job ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'accepted' | 'awaiting-payment' | 'in-progress' | 'under-review' | 'completed' | 'cancelled' | 'disputed';

export interface Job {
    _id: string;
    customerId: User | string;
    workerId?: User | string;
    gigId?: string;
    title: string;
    description: string;
    category: ServiceCategory;
    budget: number;
    status: JobStatus;
    deadline?: string;
    location?: string;
    attachments: string[];
    completedAt?: string;
    cancelReason?: string;
    complaintDetails?: {
        reason: string;
        date: string;
        attachments: string[];
    };
    isReviewed: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
    _id: string;
    customerId: User | string;
    workerId: User | string;
    jobId: Job | string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    images?: string[];
    isEdited?: boolean;
    reply?: {
        text: string;
        createdAt: string;
    };
    likes?: string[];
    createdAt: string;
    updatedAt: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
    _id: string;
    senderId: User | string;
    receiverId: User | string;
    conversationId: string;
    message: string;
    messageType: 'text' | 'image' | 'file' | 'quotation' | 'location';
    quotationDetails?: {
        title: string;
        description: string;
        budget: number;
        deliveryTime: number;
        deliveryUnit: string;
        status: 'pending' | 'accepted' | 'rejected';
    };
    fileUrl?: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

export interface Conversation {
    conversationId: string;
    otherUser: User;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType =
    | 'job_request'
    | 'job_accepted'
    | 'job_in_progress'
    | 'job_under_review'
    | 'job_completed'
    | 'job_cancelled'
    | 'job_disputed'
    | 'new_message'
    | 'new_review'
    | 'account_verified'
    | 'payment_received'
    | 'system';

export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: string;
    link?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    token?: string;
    user?: User;
    count?: number;
    total?: number;
    pages?: number;
    currentPage?: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    count: number;
    total: number;
    pages: number;
    currentPage: number;
    data: T[];
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface GigFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    locationType?: string;
    districts?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    sort?: string;
    page?: number;
    limit?: number;
}

export interface WorkerFilters {
    category?: string;
    search?: string;
    location?: string;
    availability?: WorkerAvailability;
    minRating?: number;
    maxRate?: number;
    page?: number;
    limit?: number;
}

export interface JobFilters {
    status?: JobStatus;
    page?: number;
    limit?: number;
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface LoginFormData {
    email: string;
    password?: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    phone: string;
    password?: string;
    confirmPassword?: string;
    role: 'customer' | 'worker';
}

export interface JobFormData {
    title: string;
    description: string;
    category: ServiceCategory;
    budget: number;
    deadline?: string;
    location?: string;
    workerId?: string;
}

export interface GigFormData {
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    pricingModel?: 'fixed' | 'hourly' | 'daily' | 'custom';
    pricingDescription?: string;
    deliveryTime?: number;
    deliveryUnit?: 'hours' | 'days' | 'weeks';
    locationType: 'island-wide' | 'remote' | 'districts' | 'radius';
    allowedDistricts?: string[];
    locationCoordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
    locationRadiusKm?: number;
    tags?: string[];
}

export interface ReviewFormData {
    jobId: string;
    workerId: string;
    rating: number;
    comment: string;
    direction?: 'customer_to_worker' | 'worker_to_customer';
}

// ─── Withdrawal ───────────────────────────────────────────────────────────────

export interface WithdrawalRequest {
    _id: string;
    workerId: User | string;
    amount: number;
    bankName: string;
    accountNumber: string;
    branchName: string;
    accountHolderName: string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    adminNote?: string;
    processedAt?: string;
    slipEmailSentAt?: string;
    transactionRef?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BankDetails {
    bankName: string;
    accountNumber: string;
    branchName: string;
    accountHolderName: string;
}
