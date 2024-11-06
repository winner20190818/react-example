import dayjs, { type Dayjs as __Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import updateLocale from "dayjs/plugin/updateLocale";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(updateLocale);
dayjs.extend(localizedFormat);
dayjs.tz.setDefault("Asia/Manila");
dayjs.updateLocale("en-us", {
  weekStart: 1,
});

export const dayjsManila = dayjs;
export function formatDate(date: Parameters<typeof dayjs>[0], type?: "date" | "time" | "datetime") {
  const _date = dayjsManila(date);
  switch (type) {
    case "date":
      return _date.format("YYYY-MM-DD");
    case "time":
      return _date.format("HH:mm");
    case "datetime":
    default:
      return _date.format("YYYY-MM-DD HH:mm");
  }
}
export type Dayjs = __Dayjs;
