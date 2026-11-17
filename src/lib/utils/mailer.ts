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

	const response = await fetch("https://api.brevo.com/v3/smtp/email", {
		method: "POST",
		headers: {
			accept: "application/json",
			"api-key": env.mail.apiKey!,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			sender: {
				name: "Sprintsheet",
				email: env.mail.from!.match(/<(.+)>/)?.[1] ?? env.mail.from,
			},
			to: [{ email: options.to }],
			subject: options.subject,
			textContent: options.text,
			htmlContent: options.html,
		}),
	});

	const result = await response.json();

	if (!response.ok) {
		console.error("[mail:brevo] Failed:", result);

		throw new Error(
			`Email sending failed: ${result.message ?? response.statusText}`,
		);
	}

	return result;
}
