"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { AuthInput } from "./auth-input";
import {
  submitLogin,
  submitSignup,
  validateLogin,
  validateSignup,
  type SignupFormValues,
} from "../_lib/form";

type Field = keyof SignupFormValues;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [values, setValues] = useState<SignupFormValues>({
    email: "", nickname: "", password: "", passwordConfirm: "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const submitting = useRef(false);
  const validate = signup ? validateSignup : validateLogin;
  const errors = validate(values);
  const action = signup ? "회원가입" : "로그인";

  function fieldProps(name: Field) {
    return {
      id: `${mode}-${name}`,
      name,
      value: values[name],
      required: true,
      disabled: pending,
      error: submitted || touched[name] ? errors[name] : undefined,
      onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues((previous) => ({ ...previous, [name]: event.target.value }));
        setMessage("");
        setFailure("");
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setSubmitted(true);
    setMessage("");
    setFailure("");

    const nextErrors = validate(values);
    const order: Field[] = signup
      ? ["email", "nickname", "password", "passwordConfirm"]
      : ["email", "password"];
    const firstInvalid = order.find((name) => nextErrors[name]);
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }

    submitting.current = true;
    setPending(true);
    try {
      const loginValues = { email: values.email.trim(), password: values.password };
      const notice = signup
        ? await submitSignup({ ...loginValues, nickname: values.nickname.trim() })
        : await submitLogin(loginValues);
      setMessage(notice);
    } catch {
      setFailure("요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-[26px] leading-snug font-bold tracking-tight">
          {signup ? "FoodValue 시작하기" : "다시 만나서 반가워요"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {signup ? "나만의 닉네임으로 함께해요." : "이메일로 간편하게 로그인하고"}
          <br />
          {signup ? "가치 있는 식생활을 함께 시작해 볼까요?" : "가치 있는 식생활을 이어가세요."}
        </p>
      </header>

      <form method="post" noValidate onSubmit={handleSubmit} aria-label={action} aria-busy={pending}>
        <div className="space-y-5">
          <AuthInput {...fieldProps("email")} label="이메일" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="example@email.com" />
          {signup && (
            <AuthInput {...fieldProps("nickname")} label="닉네임" autoComplete="nickname" maxLength={20} placeholder="어떤 이름으로 불러드릴까요?" hint={`최대 20자 · ${values.nickname.length}/20`} />
          )}
          <AuthInput {...fieldProps("password")} label="비밀번호" type="password" autoComplete={signup ? "new-password" : "current-password"} placeholder="비밀번호를 입력해 주세요" />
          {signup && (
            <AuthInput {...fieldProps("passwordConfirm")} label="비밀번호 확인" type="password" autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력해 주세요" />
          )}
        </div>

        <button type="submit" disabled={pending} className="mt-8 min-h-14 w-full rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-white outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "확인 중…" : action}
        </button>
        <div role="status" aria-atomic="true">
          {message && <p className="mt-4 rounded-2xl bg-primary-soft px-4 py-3 text-sm leading-6 text-primary">{message}</p>}
        </div>
        <div role="alert" aria-atomic="true">
          {failure && <p className="mt-4 text-sm text-danger">{failure}</p>}
        </div>
      </form>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted">
        {signup ? "이미 계정이 있으신가요?" : "계정이 없으신가요?"}
        <Link href={signup ? "/auth/login" : "/auth/signup"} className="inline-flex min-h-11 items-center rounded-md px-1 font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary">
          {signup ? "로그인" : "회원가입"}
        </Link>
      </p>
    </>
  );
}
