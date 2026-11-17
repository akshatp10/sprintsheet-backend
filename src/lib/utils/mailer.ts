import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";

export interface MailOptions {
	to: string;
	subject: string;
	text: string;
	html: string;
}

// undefined = not initialised yet, null = console mode (no real sending)
let transport: Transporter | null | undefined;

function getTransport(): Transporter | null {
	if (transport !== undefined) return transport;

	if (env.mail.transport !== "smtp") {
		transport = null;
		return transport;
	}

	transport = nodemailer.createTransport({
		host: env.mail.host,
		port: env.mail.port,
		secure: env.mail.port === 465,
		auth: { user: env.mail.user, pass: env.mail.pass },
	});

	return transport;
}

export async function sendMail(options: MailOptions) {
	const mailTransport = getTransport();

	if (!mailTransport) {
		console.log(
			`\n[mail:console] to=${options.to}\nsubject: ${options.subject}\n${options.text}\n`,
		);
		return;
	}

	await mailTransport.sendMail({
		from: env.mail.from,
		...options,
	});
}
