export interface LoginEmailRequest {
  email: string;
}

export interface ValidateAccessCodeRequest {
  email: string;
  accessCode: string;
}

export interface SetupAccountRequest {
  inviteToken: string;
  username: string;
  password: string;
}

export interface ValidateAccessCodeResult {
  token: string;
  role: "employee";
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
  };
}

export interface VerifyInviteResult {
  name: string;
  email: string;
}
