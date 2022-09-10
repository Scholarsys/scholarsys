const bcrpyt = require('bcrypt');
const User = require('../models/User/User');
const ErrorResponse = require('./../util/helpers/ErrorResponse');
const sendEmail = require('./email.service');
const { createToken } = require('./Token.service');
const path = require('path');
const crypto = require('crypto');
const { unlink } = require('fs');
const ROLES = {
	ADMIN: 1999,
	TEACHER: 666,
	STUDENT: 1
};
class UserService {
	static async findAll(option) {
		if (!option)
			return await User.findAll();
		if (option.teachers) {
			return await User.findAll({
				where: {
					role: 666
				}
			});
		}
		if (option.students) {
			return await User.findAll({
				where: {
					role: 1
				}
			});
		}
		if (option.agents) {
			return await User.findAll({
				where: {
					role: 987
				}
			});
		}
	}
	static async findStudentsByClasseId(classeId) {
		let classe = "{\"classeId\":"+classeId+"}"
		return await User.findAll({
			where: {
				role: 1,
				specificData: classe
			}
		});
	}
	static async create(newUser) {
		// TODO : Sanitize data

		try {
			const hashedPassword = await bcrpyt.hash(newUser.password, 10);
			newUser.password = hashedPassword;

			// TODO:  create function to handle image creation process in utils
			const random = crypto.randomBytes(20).toString('hex');
			const arrayWithExtensions = newUser.image.name.split('.');

			const ext = arrayWithExtensions[arrayWithExtensions.length - 1];

			let newImgName = `IMG_${random}.${ext}`;

			let sampleFile = newUser.image;

			const newUserData = {
				...newUser,
				password: hashedPassword,
				image: newImgName
			};
			if (newUserData.role === 666) {
				const specificData = { classesId: [newUser.classeId], salary: newUserData.salary };

				newUserData.specificData = JSON.stringify(specificData);
			}

			if (newUserData.role === 1) {
				const specificData = "{\"classeId\":"+newUser.classeId+"}"

				newUserData.specificData = specificData
				
				//const newSpeceficData = JSON.stringify({ classeId });
			
			}

			const user = await User.create(newUserData);

			sampleFile.name = newImgName;

			const uploadPath = path.join(__dirname, '..', '..', 'src', 'assets', 'user_images', sampleFile.name);
			sampleFile.mv(uploadPath, function (err) {

				if (err) ErrorResponse.internalError('error while uploading the file');
			});

			if (!user) {
				throw ErrorResponse.internalError('Error when creating the user');
			}

			const emailToken = createToken(user, { type: 'email' }); // throws error

			const body = `<h3> ${user.email} </h3> to confirm your account please click this link localhost:3000/confirm/${emailToken}.<h1>This link will expire in 30m.</h1>`;

			await sendEmail(user.email, 'Confirm your account', body);
		} catch (err) {
			throw ErrorResponse.internalError('Error when sending confirmation email');
		}
	}
	static async findOne(id) {
		try {
			const user = await User.findByPk(id);
			user.image = `${process.env.URL}/static/users_images/${user.image}`;
			return user;
		} catch (err) {
			throw ErrorResponse.notFound('could not find the user');
		}
	}
	static async updateOne(id, updatedUser) {
		// TODO : Sanitize data
		// TODO: Sanitize data & make sure data is passed or keep old values
		const hashedPassword = await bcrpyt.hash(updatedUser.password, 10);
		//updatedUser.password = hashedPassword;

		// TODO: handle image update
		if (updatedUser.image) {
			const user = await User.findByPk(id);
			const p = path.join(__dirname, '..', 'public', 'users_images', user.image);
			unlink(p, (err) => {
				if (err) {
					console.log(err);
				}
			});
			const random = crypto.randomBytes(20).toString('hex');
			const arrayWithExtensions = updatedUser.image.name.split('.');

			const ext = arrayWithExtensions[arrayWithExtensions.length - 1];

			let newImgName = `IMG_${random}.${ext}`;

			let sampleFile = updatedUser.image;

			updatedUser.image = newImgName;

			sampleFile.name = newImgName;

			sampleFile.mv(
				path.join(__dirname, '..', '..', 'src', 'assets', 'user_images', sampleFile.name),
				function (err) {
					if (err) ErrorResponse.internalError('error while uploading the file');
				}
			);
		}

		return await User.update(updatedUser, {
			where: {
				id
			}
		});
	}

	static async updateSalary(id, salary) {
		const user = await User.findByPk(id);
		const data = JSON.parse(JSON.parse(user.specificData));
		data.salary = salary;
		user.specificData = JSON.stringify(data);
		await user.save();
	}

	static async deleteOne(id) {
		try {
			return await User.destroy({
				where: {
					id: id
				}
			});
		} catch (err) {
			throw ErrorResponse.internalError('Could not delete this user');
		}
	}
	static async addClassToUser(id, classeId) {
		const user = await User.findByPk(id);
		if (user.role === ROLES.STUDENT) {
			const newSpeceficData = JSON.stringify({ classeId });
			console.log(newSpeceficData);
			user.specificData = newSpeceficData;
			await user.save();
		}

		if (user.role === ROLES.TEACHER) {
			const classes = await JSON.parse(user.specificData);
			const exist = classes.classesId.find((existingId) => existingId === classeId);
			if (exist) {
				throw ErrorResponse.badRequest('this teacher alraedy have this classe');
			}
			classes.classesId.push(classeId);
			const parsed = JSON.stringify(classes);
			user.specificData = parsed;
			await user.save();
		}
	}

	static async removeClassToUser(id, classeId) {
		const user = await User.findByPk(id);
		if (user.role === ROLES.STUDENT) {
			// const specificData = JSON.parse(user.specificData);
			// const keys = Object.keys(specificData);
			// const newClasseId = keys.find((k) => specificData[k] === classeId);
			user.specificData = null;
			await user.save();
		}
		if (user.role === ROLES.TEACHER) {
			const classes = await JSON.parse(JSON.parse(user.specificData));
			if (classes.classesId.length === 0) {
				throw ErrorResponse.badRequest('this teacher does not have any classes');
			}
			const newClassesId = classes.classesId.filter((classId) => classeId !== classId);

			const newSpecificData = {
				...JSON.parse(user.specificData),
				classesId: [...newClassesId]
			};

			user.specificData = JSON.stringify(newSpecificData);

			await user.save();
		}
	}
}

module.exports = UserService;
