export function formatMessage<T = any>(message: T) {
  return Buffer.from(JSON.stringify(message));
}

export function parseMessage<T = any>(message: string) {
  try {
    return JSON.parse(message) as T;
  } catch (e: any) {
    return null;
  }
}
