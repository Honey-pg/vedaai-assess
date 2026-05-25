import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { roleFromSessionClaims } from '@/lib/clerk/roleFromClaims';

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

const teacherOnlyPaths = createRouteMatcher([
  '/home(.*)',
  '/create(.*)',
  '/classes(.*)',
  '/groups(.*)',
  '/analytics(.*)',
  '/assignments(.*)',
  '/paper(.*)',
  '/submissions(.*)',
  '/grade(.*)',
  '/library(.*)',
  '/toolkit(.*)',
  '/teacher-toolkit(.*)',
  '/settings(.*)',
]);

const studentOnlyPaths = createRouteMatcher(['/student(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return NextResponse.next();

  const { sessionClaims } = await auth.protect();

  const role = roleFromSessionClaims(sessionClaims);

  if (!role && !isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (role === 'student' && teacherOnlyPaths(request)) {
    return NextResponse.redirect(new URL('/student/home', request.url));
  }

  if (role === 'teacher' && studentOnlyPaths(request)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (isOnboardingRoute(request) && role) {
    return NextResponse.redirect(
      new URL(role === 'student' ? '/student/join' : '/home', request.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Bare `/` is excluded by the catch-all regex below on some Next.js versions; Clerk must still run here.
    '/',
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte|ttf|woff2?|png|jpg|gif|svg|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
