import Swal from "sweetalert2";

export function isValidIranPhone(phone) {
  return /^09\d{9}$/.test(phone);
}

export function isValidOtp(otp) {
  return /^\d{4,6}$/.test(otp); 
}

export function toastSuccess(title, text) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "باشه",
    background: "#0b0b0f",
    color: "#fff",
    confirmButtonColor: "#15173D",
  });
}

export function toastError(title, text) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "متوجه شدم",
    background: "#0b0b0f",
    color: "#fff",
    confirmButtonColor: "#15173D",
  });
}
