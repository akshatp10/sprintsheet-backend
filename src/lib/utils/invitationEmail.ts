import { INVITATION_TTL_DAYS } from "@/features/invites/types/invitation.types";

const APP_NAME = "Sprintsheet";
const BRAND_COLOR = "#5B4BB5";
const FONT_STACK =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

export function buildInvitationEmail(input: {
	projectName: string;
	inviterName: string;
	role: "member" | "admin";
	link: string;
}) {
	const { projectName, inviterName, role, link } = input;

	const roleText = role === "admin" ? "an admin" : "a member";
	const roleLabel = role === "admin" ? "Admin" : "Member";

	const subject = `${inviterName} invited you to ${projectName}`;

	const text = [
		`${inviterName} invited you to join "${projectName}" on ${APP_NAME} as ${roleText}.`,
		"",
		`Accept the invitation: ${link}`,
		"",
		`This link expires in ${INVITATION_TTL_DAYS} days. If you weren't expecting this, you can ignore this email.`,
	].join("\n");

	const safeProject = escapeHtml(projectName);
	const safeInviter = escapeHtml(inviterName);
	const safeLink = escapeHtml(link);

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="color-scheme" content="light" />
	<meta name="supported-color-schemes" content="light" />
	<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F2EE;">
	<!-- Preview text shown next to the subject in the inbox -->
	<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
		${safeInviter} invited you to join ${safeProject} on ${APP_NAME}.
	</div>

	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F2EE;">
		<tr>
			<td align="center" style="padding:32px 16px;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;">

					<!-- Brand -->
					<tr>
						<td style="padding:32px 32px 0 32px;">
							<table role="presentation" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td width="28" height="28" align="center" valign="middle" bgcolor="${BRAND_COLOR}" style="width:28px;height:28px;border-radius:8px;font-family:${FONT_STACK};font-size:15px;font-weight:600;line-height:28px;color:#FFFFFF;">S</td>
									<td style="padding-left:10px;font-family:${FONT_STACK};font-size:18px;font-weight:600;color:#26262B;">${APP_NAME}</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Heading + message -->
					<tr>
						<td style="padding:24px 32px 0 32px;font-family:${FONT_STACK};">
							<h1 style="margin:0 0 12px 0;font-size:24px;line-height:32px;font-weight:600;color:#26262B;">You're invited to join ${safeProject}</h1>
							<p style="margin:0;font-size:16px;line-height:24px;color:#55535B;">
								<strong style="color:#26262B;">${safeInviter}</strong> invited you to collaborate on
								<strong style="color:#26262B;">${safeProject}</strong> in ${APP_NAME}.
							</p>
							<p style="margin:16px 0 0 0;font-size:14px;line-height:20px;color:#55535B;">
								Your role:
								<span style="display:inline-block;padding:2px 10px;border-radius:999px;background-color:#EEEBFA;color:${BRAND_COLOR};font-size:13px;font-weight:600;">${roleLabel}</span>
							</p>
						</td>
					</tr>

					<!-- Button -->
					<tr>
						<td style="padding:28px 32px 0 32px;">
							<table role="presentation" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td align="center" bgcolor="${BRAND_COLOR}" style="border-radius:10px;">
										<a href="${safeLink}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:16px;font-weight:600;line-height:20px;color:#FFFFFF;text-decoration:none;border-radius:10px;">Review invitation</a>
									</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Expiry + fallback link -->
					<tr>
						<td style="padding:24px 32px 0 32px;font-family:${FONT_STACK};font-size:13px;line-height:20px;color:#8A8891;">
							This invitation expires in ${INVITATION_TTL_DAYS} days.
						</td>
					</tr>
					<tr>
						<td style="padding:16px 32px 0 32px;font-family:${FONT_STACK};font-size:13px;line-height:20px;color:#8A8891;">
							Button not working? Copy and paste this link into your browser:<br />
							<a href="${safeLink}" target="_blank" style="color:${BRAND_COLOR};word-break:break-all;">${safeLink}</a>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding:24px 32px 32px 32px;font-family:${FONT_STACK};font-size:12px;line-height:18px;color:#A5A3AA;border-top:0;">
							If you weren't expecting this invitation, you can safely ignore this email.
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;

	return { subject, text, html };
}
