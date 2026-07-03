import { toast } from "sonner";

export function isValidIranPhone(phone) {
  return /^09\d{9}$/.test(phone);
}

export function isValidOtp(otp) {
  return /^\d{4,6}$/.test(otp);
}

export function toastSuccess(title, text) {
  if (text) {
    return toast.success(title, { description: text });
  }
  return toast.success(title);
}

export function toastError(title, text) {
  if (text) {
    return toast.error(title, { description: text });
  }
  return toast.error(title);
}
