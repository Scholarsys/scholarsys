const UserService = require('../services/user.service');
// TODO : handle cases when find might return empty array or not obj
// TODO : ADD Service layer & clean up controller

class userController {
	static getAll = async (_, res, next) => {
		try {
			return res.status(200).json(await UserService.findAll());
		} catch (err) {
			next(err);
		}
	};
	static getTeachers = async (_, res, next) => {
		try {
			return res.status(200).json(await UserService.findAll({ teachers: true }));
		} catch (err) {
			next(err);
		}
	};
	static getAgents = async (_, res, next) => {
		try {
			return res.status(200).json(await UserService.findAll({ agents: true }));
		} catch (err) {
			next(err);
		}
	};
	static getStudents = async (_, res, next) => {
		try {
			return res.status(200).json(await UserService.findAll({ students: true }));
		} catch (err) {
			next(err);
		}
	};

	static create = async (req, res, next) => {
		const { firstname, lastname, email, password, phoneNumber, birthDate, role } = req.body;
		if (role === null || role === undefined || role === "") {
			role = "1"
		}

		const newUser = {
			firstname,
			lastname,
			email,
			password,
			phoneNumber,
			birthDate,
			image: req.files.image
		};
		if (role) newUser.role = role;

		try {
			await UserService.create(newUser);

			return res
				.status(201)
				.json({ message: `${newUser.firstname} created.Please confirm your account.` });
		} catch (err) {
			console.log(err);

			next(err);
		}
	};

	static getOne = async (req, res, next) => {
		const id = req.params.id;
		try {
			const user = await UserService.findOne(id);
			return res.status(200).json(user);
		} catch (err) {
			next(err);
		}
	};

	static update = async (req, res, next) => {
		const { firstname, lastname, email, password, phoneNumber, birthDate } = req.body;
		let updatedUser = {
			firstname,
			lastname,
			email,
			password,
			phoneNumber,
			birthDate
		};

		const id = req.params.id;
		try {
			updatedUser = UserService.updateOne(id, updatedUser);
			return res.status(204).json(updatedUser);
		} catch (err) {
			// console.log(err);
			next(err);
		}
	};
	static delete = async (req, res, next) => {
		const id = req.params.id;
		try {
			await UserService.deleteOne(id);
			return res.status(200).json({ message: `user ${id} deleted` });
		} catch (err) {
			next(err);
		}
	};
}

module.exports = userController;