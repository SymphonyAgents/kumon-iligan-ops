import { redirect } from 'next/navigation';

// Single-branch deployment: branch selection is gone — every user is auto-assigned
// to Iligan Branch on sign-in. This page just bounces back to the app root.
export default function OnboardingPage() {
  redirect('/');
}
