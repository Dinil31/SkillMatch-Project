import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: {
        default: 'SkillMatch.lk — Sri Lanka\'s Freelance Marketplace',
        template: '%s | SkillMatch.lk',
    },
    description:
        'Connect with skilled professionals across Sri Lanka. Find workers for web development, design, plumbing, electrical work, and more.',
    keywords: [
        'freelance',
        'Sri Lanka',
        'skilled workers',
        'marketplace',
        'jobs',
        'gigs',
        'hire',
    ],
    authors: [{ name: 'SkillMatch.lk' }],
    creator: 'SkillMatch.lk',
    openGraph: {
        type: 'website',
        locale: 'en_LK',
        url: 'https://skillmatch.lk',
        siteName: 'SkillMatch.lk',
        title: 'SkillMatch.lk — Sri Lanka\'s Freelance Marketplace',
        description: 'Connect with skilled professionals across Sri Lanka.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SkillMatch.lk',
        description: 'Sri Lanka\'s premier freelance marketplace',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'var(--toast-bg, #fff)',
                            color: 'var(--toast-color, #1f2937)',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#fff' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#fff' },
                        },
                    }}
                />
            </body>
        </html>
    );
}
