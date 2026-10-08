// Frontend form state only. These types do not define Backend request/response DTOs.
export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = LoginFormValues & {
  nickname: string;
  passwordConfirm: string;
};

export type FormErrors = Partial<Record<keyof SignupFormValues, string>>;

export function validateLogin(values: LoginFormValues): FormErrors {
  const errors: FormErrors = {};
  const email = values.email.trim();

  if (!email) errors.email = "이메일을 입력해 주세요.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "이메일 형식을 확인해 주세요.";
  }
  // Do not trim or impose an unconfirmed password policy.
  if (!values.password) errors.password = "비밀번호를 입력해 주세요.";
  return errors;
}

export function validateSignup(values: SignupFormValues): FormErrors {
  const errors = validateLogin(values);

  if (!values.nickname.trim()) errors.nickname = "닉네임을 입력해 주세요.";
  else if (values.nickname.length > 20) {
    errors.nickname = "닉네임은 20자 이내로 입력해 주세요.";
  }
  if (!values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호를 한 번 더 입력해 주세요.";
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않아요.";
  }
  return errors;
}

// UI submission boundaries, intentionally unavailable until the Backend contract
// is verified. Do not serialize these values directly as an assumed API DTO.
// TODO: map values to the verified POST /api/v1/auth/login contract here.
export const submitLogin: (values: LoginFormValues) => Promise<string> = async () =>
  "로그인 기능을 준비하고 있어요. 지금은 로그인할 수 없어요.";

// passwordConfirm is deliberately excluded from the submission boundary.
// TODO: map values to the verified POST /api/v1/auth/signup contract here.
export const submitSignup: (
  values: Omit<SignupFormValues, "passwordConfirm">,
) => Promise<string> = async () =>
  "회원가입 기능을 준비하고 있어요. 아직 계정이 생성되지 않았어요.";
