import { env } from "@/config/env";

export interface MailOptions {
	to: string;
	subject: string;
	text: string;
	html: string;
}

export async function sendMail(options: MailOptions) {
	if (env.mail.transport === "console") {
		console.log(
			`\n[mail:console] to=${options.to}\n` +
				`subject: ${options.subject}\n${options.text}\n`,
		);
		return;
	}

	if (env.mail.transport !== "brevo") {
		throw new Error(`Unsupported mail transport: ${env.mail.transport}`);
	}

	const from = env.mail.from!;
	const senderMatch = from.match(/^(.*?)\s*<(.+)>$/);

	const response = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			accept: "application/json",
			"api-key": env.mail.apiKey!,
			"content-type": "application/json",
		},
		signal: AbortSignal.timeout(10_000),
		body: JSON.stringify({
			sender: {
				name: senderMatch?.[1] || "Sprintsheet",
				email: senderMatch?.[2] ?? from,
			},
			to: [{ email: options.to }],
			subject: options.subject,
			textContent: options.text,
			htmlContent: options.html,
		}),
	});

	const responseText = await response.text();

	let result: Record<string, unknown> = {};

	try {
		result = responseText ? JSON.parse(responseText) : {};
	} catch {
		result = { rawResponse: responseText };
	}

	if (!response.ok) {
		console.error("[mail:brevo] Failed:", {
			status: response.status,
			result,
		});

		throw new Error(
			`Email sending failed (${response.status}): ${
				result.message ?? response.statusText
			}`,
		);
	}

	return result;
}
