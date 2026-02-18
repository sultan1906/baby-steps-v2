import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getResend } from "@/lib/resend";
import { VerifyEmailTemplate } from "@/emails/VerifyEmailTemplate";
import { ResetPasswordTemplate } from "@/emails/ResetPasswordTemplate";
import { render } from "@react-email/components";

let _auth: ReturnType<typeof betterAuth> | undefined;

function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),

      emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 6,

        sendResetPassword: async ({ user, url }) => {
          const html = await render(ResetPasswordTemplate({ resetUrl: url, userName: user.name }));
          await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: user.email,
            subject: "Reset your Baby Steps password",
            html,
          });
        },
      },

      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,

        sendVerificationEmail: async ({ user, url }) => {
          const html = await render(
            VerifyEmailTemplate({ verificationUrl: url, userName: user.name })
          );
          await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: user.email,
            subject: "Verify your Baby Steps email",
            html,
          });
        },
      },

      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },

      session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // refresh if older than 1 day
        cookieCache: { enabled: true, maxAge: 5 * 60 },
      },

      trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
    });
  }
  return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    return Reflect.get(getAuth(), prop);
  },
  has(_, prop) {
    return Reflect.has(getAuth(), prop);
  },
});
