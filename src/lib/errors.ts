export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export async function runAction<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof UserError) throw err;
    console.error(`[action:${label}] unexpected error`, err);
    throw new UserError("Something went wrong. Please try again.");
  }
}
