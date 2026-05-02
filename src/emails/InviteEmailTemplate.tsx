import { Html, Body, Container, Heading, Text, Button, Hr, Section } from "@react-email/components";

interface InviteEmailTemplateProps {
  inviterName: string;
  inviteUrl: string;
  babyNames: string[];
}

export function InviteEmailTemplate({
  inviterName,
  inviteUrl,
  babyNames,
}: InviteEmailTemplateProps) {
  const subjectLine =
    babyNames.length === 0
      ? `${inviterName} wants to share their baby's journey with you.`
      : babyNames.length === 1
        ? `${inviterName} wants to share ${babyNames[0]}'s journey with you.`
        : `${inviterName} wants to share ${babyNames.slice(0, -1).join(", ")} and ${babyNames[babyNames.length - 1]}'s journey with you.`;

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
          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 48, margin: 0 }}>👣</Text>
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
            You&apos;re invited to Baby Steps
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
            {subjectLine}
          </Text>

          <Button
            href={inviteUrl}
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
            Accept invite
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
            This invite expires in 24 hours. If you didn&apos;t expect this email, you can safely
            ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
