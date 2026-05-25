import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Lora, Bricolage_Grotesque } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { BackendAuthRegistrar } from '@/components/providers';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const lora = Lora({
  variable: '--font-paper',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'VedaAI - AI Assessment Creator',
  description: 'Generate professional assessment papers powered by AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plusJakarta.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#FF5C28',
              borderRadius: '12px',
            },
            elements: {
              card: 'rounded-2xl shadow-lg border border-[#EAECF0]',
              footer: '',
            },
          }}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/sign-in"
        >
          <BackendAuthRegistrar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
