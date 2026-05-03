export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignInResult = {
  error?: string;
  redirectTo?: string;
};

export type SignOutResult = {
  error?: string;
};