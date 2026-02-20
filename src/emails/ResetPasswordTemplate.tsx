import { Html, Body, Container, Heading, Text, Button, Hr, Section } from "@react-email/components";

interface ResetPasswordTemplateProps {
  resetUrl: string;
  userName: string;
}

export function ResetPasswordTemplate({ resetUrl, userName }: ResetPasswordTemplateProps) {
  return (
    <Html>
      <Body
        style={{
          background: "#FCFAF7",
          fontFamily: "Inter, -apple-system, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: "40px auto",
            background: "#ffffff",
            borderRadius: 32,
            padding: "48px 40px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Lock icon */}
          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 48, margin: 0 }}>🔒</Text>
          </Section>

          <Heading
            style={{
              color: "#292524",
              fontSize: 24,
              fontWeight: 700,
              margin: "0 0 12px",
              textAlign: "center",
            }}
          >
            Reset your password, {userName}
          </Heading>

          <Text
            style={{
              color: "#78716C",
              fontSize: 15,
              lineHeight: 1.6,
              margin: "0 0 32px",
              textAlign: "center",
            }}
          >
            Click the button below to create a new password. This link expires in 1 hour.
          </Text>

          <Button
            href={resetUrl}
            style={{
              background: "linear-gradient(135deg, #F06292, #FFB74D)",
              color: "#ffffff",
              borderRadius: 24,
              padding: "14px 32px",
              display: "block",
              textAlign: "center",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Reset Password
          </Button>

          <Hr style={{ borderColor: "#E7E5E4", margin: "32px 0" }} />

          <Text
            style={{
              color: "#A8A29E",
              fontSize: 12,
              textAlign: "center",
              margin: 0,
            }}
          >
            If you did not request a password reset, you can safely ignore this email. Your password
            will not be changed.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

