import moment from "jalali-moment";

export function timestampToShamsi(timestamp: number, format: string = "jYYYY/jMM/jDD"): string {
  return moment(timestamp)
    .locale("fa")
    .format(format);
}

export function timestampToShamsiFull(timestamp: number): string {
  return moment(timestamp)
    .locale("fa")
    .format("jD jMMMM jYYYY");
}

export function timestampToShamsiDayMonth(timestamp: number): string {
  return moment(timestamp)
    .locale("fa")
    .format("jD jMMMM");
}

