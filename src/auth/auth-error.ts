/** Calendar access failed for want of valid credentials — drives the "Auth" face. */
export class AuthError extends Error {
  constructor(
    readonly accountId: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
