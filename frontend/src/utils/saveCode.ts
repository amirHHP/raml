/** Save codes are the durable player identity (deviceId). */

export function normalizeSaveCode(raw: string): string {
  return raw.trim();
}

export function assertValidSaveCode(raw: string): string {
  const code = normalizeSaveCode(raw);
  if (code.length < 8) {
    throw new Error('کد ذخیره نامعتبر است');
  }
  return code;
}
