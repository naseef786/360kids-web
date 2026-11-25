export const resendConfirmationMessage =
  "If this account needs confirmation, a new link will arrive by email.";

export async function resendConfirmation(
  send: (email: string, redirectTo: string) => Promise<{ error: { status?: number } | null }>,
  email: string,
  redirectTo: string,
): Promise<{ status: number; message: string }> {
  const { error } = await send(email, redirectTo);
  if (error?.status === 429)
    return { status: 429, message: "Please wait before requesting another confirmation link." };
  if (error && (!error.status || error.status >= 500))
    return { status: 503, message: "Confirmation email is temporarily unavailable. Please try again." };
  // Do not reveal whether an email has an account or is already confirmed.
  return { status: 200, message: resendConfirmationMessage };
}
