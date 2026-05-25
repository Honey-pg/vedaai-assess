import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--background)] px-4">
      <SignIn
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
        signUpForceRedirectUrl="/"
      />
    </div>
  );
}
