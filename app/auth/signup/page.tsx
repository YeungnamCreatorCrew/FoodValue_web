import type { Metadata } from "next";
import { AuthForm } from "../_components/auth-form";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
