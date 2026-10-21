import { RequestHandler } from "express";

export const authRegisterController: RequestHandler = async (req, res) => {
	res.json({ message: "Registering the user" });
};

export const authLoginController: RequestHandler = async (req, res) => {
	res.json({ message: "User Logged in" });
};
