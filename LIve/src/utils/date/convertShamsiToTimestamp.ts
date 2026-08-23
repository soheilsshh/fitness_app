import moment from "jalali-moment";

export function convertShamsiToTimestamp(shamsiDate: string): number {
  // Input example: "1403-09-12" or "1403/09/12"
  // Convert to jalali-moment format: "jYYYY-jMM-jDD"
  const normalizedDate = shamsiDate.replace(/\//g, '-');
  
  return moment(normalizedDate, "jYYYY-jMM-jDD")
    .locale("fa")
    .startOf("day")
    .toDate()
    .getTime();
}

