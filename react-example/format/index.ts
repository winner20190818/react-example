import { formatDate } from "./date";

export { formatDate };

type Options = {
  interval?: number;
  round?: number;
  separator?: string;
};

export function formatAmount(value: number | string = 0, options?: Options) {
  const { round = 2, interval = 3, separator = "," } = options || {};

  // 1. 将输入值转换为数字类型并处理无效输入
  let numericValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numericValue)) {
    numericValue = 0;
  }

  // 2. 处理舍入
  numericValue = parseFloat(numericValue.toFixed(round));

  // 3. 将数字转换为字符串并分离整数部分和小数部分
  let [integerPart, decimalPart] = numericValue.toString().split(".");

  const regex = new RegExp(`\\B(?=(\\d{${interval}})+(?!\\d))`, "g");
  integerPart = integerPart.replace(regex, separator);

  // 5. 返回格式化后的字符串
  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

export function maskPhoneNumber(number?: string) {
  if (!number) return "";
  return number.replace(/(\d{3})\d{4}(\d{2,})/, "$1****$2");
}

export function maskEmail(email?: string): string {
  if (!email) return "";

  // Split the email into username and domain parts
  const [username, domain] = email.split("@");

  if (!username || !domain) return ""; // If either part is missing, return an empty string

  // Mask the username (keep the first and last characters, replace the rest with '*')
  const maskedUsername =
    username.length > 2
      ? `${username[0]}${"*".repeat(username.length - 2)}${username[username.length - 1]}`
      : username[0] + "*"; // If username length is 2 or less, only keep the first character and replace the second with '*'

  // Split domain into name and TLD
  const domainParts = domain.split(".");
  const maskedDomain =
    domainParts.length > 1
      ? `${domainParts[0][0]}${"*".repeat(domainParts[0].length - 2)}${
          domainParts[0][domainParts[0].length - 1]
        }.${domainParts.slice(1).join(".")}` // Keep first and last character of domain name
      : domain; // If domain is not correctly formatted, return the original domain

  // Combine masked username and masked domain
  return `${maskedUsername}@${maskedDomain}`;
}
