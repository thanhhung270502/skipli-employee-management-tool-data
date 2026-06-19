export interface Owner {
  phoneNumber: string;
  accessCode: string;
  accessCodeExpiry: Date | null;
  updatedAt: Date;
}

export interface CreateAccessCodeRequest {
  phoneNumber: string;
}

export interface ValidateAccessCodeRequest {
  phoneNumber: string;
  accessCode: string;
}

export interface ValidateAccessCodeResult {
  token: string;
  role: "owner";
  phoneNumber: string;
}
