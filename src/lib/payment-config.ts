export const WISE_PAYMENT_LINK = "https://wise.com/pay/business/manojkumar21";
export const BINANCE_PAY_ID = "1078928519";

export const PAYMENT_DISPLAY_IDENTITY = {
  accountName: "SOFTWARE VALA",
  bankName: "INDIAN BANK",
  accountNumberMasked: "**********",
  ifscMasked: "***********",
  branchDetailsMasked: "************",
} as const;

export function getWiseQrSrc(size: number = 220): string {
  const safeSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : 220;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${safeSize}x${safeSize}&data=${encodeURIComponent(WISE_PAYMENT_LINK)}`;
}
