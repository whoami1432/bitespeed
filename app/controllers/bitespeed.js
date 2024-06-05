'use strict';

const { logger } = require('../../config/logger');
const bitespeed = require('../models/bitespeed');

exports.identify = async (req, res, next) => {
	try {
		logger.info({ requestId: req.id, message: `ip: ${req.ip}  ${req.method}/  ${req.originalUrl} bitespeed identify request received` });

		const { email, phone } = req.body;

		if (!email || !phone) {
			return res.status(400).json({
				Message: 'Required field not found'
			});
		}

		const validateEmailId = email ? validateEmail(email) : null;
		const validatePhone = phone ? isValidPhoneNumber(phone) : null;

		if (email && !validateEmailId) {
			return res.status(200).json({
				Message: 'Emailid is not valid'
			});
		} else if (phone && !validatePhone) {
			return res.status(200).json({
				Message: 'Phone is not valid'
			});
		}

		/** Check the order is already available */
		const checkAlreadyOrdered = await bitespeed.checkAlreadyOrdered(email, phone);
		if (checkAlreadyOrdered.length > 0) {
			if (checkAlreadyOrdered.length > 1) {
				const primary = checkAlreadyOrdered.find(e => e.email === email && e.phoneNumber === phone);
				const primaryIntoSecondary = checkAlreadyOrdered.filter(e => e.email !== email || e.phoneNumber !== phone);
				const data = {
					primaryContatctId: primary?.id,
					emails: [primary?.email],
					phoneNumbers: [primary?.phoneNumber],
					secondaryContactIds: []
				};
				for (let i = 0; i < primaryIntoSecondary.length; i++) {
					const { id: updateId } = primaryIntoSecondary[i];
					const { id, email, phoneNumber } = await bitespeed.updateCustomer(checkAlreadyOrdered[0]?.id, 'Secondary', updateId);
					data.secondaryContactIds.push(id);
					if (!data.emails.includes(email)) data.emails.push(email);
					if (!data.phoneNumbers.includes(phoneNumber)) data.phoneNumbers.push(phoneNumber);
				}
				return res.status(200).json({
					Message: 'Contact updated successfully',
					contact: {
						primaryContatctId: data.primaryContatctId,
						emails: [...new Set([data.emails])],
						phoneNumbers: [...new Set([data.phoneNumbers])],
						secondaryContactIds: [...new Set([data.secondaryContactIds])]
					}
				});
			}
			const { id: primaryid, email: primaryEmail, phoneNumber: primaryPhone } = checkAlreadyOrdered[0];
			const [{ id: secondaryId, phoneNumber: secondaryPhone, email: secondaryEmailId }] = await bitespeed.insertCustomer(email, phone, id, 'Secondary');
			return res.status(200).json({
				Message: 'Contact created successfully',
				contact: {
					primaryContatctId: primaryid,
					emails: [...new Set([primaryEmail, secondaryEmailId])],
					phoneNumbers: [...new Set([primaryPhone, secondaryPhone])],
					secondaryContactIds: [secondaryId]
				}
			});
		} else {
			const [{ id, phoneNumber, email: emailid }] = await bitespeed.insertCustomer(email, phone, null, 'Primary');
			return res.status(200).json({
				Message: 'Contact created successfully',
				contact: {
					primaryContatctId: id,
					emails: [emailid],
					phoneNumbers: [phoneNumber],
					secondaryContactIds: []
				}
			});
		}
	} catch (error) {
		next(error);
	}
};

function validateEmail(email) {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

function isValidPhoneNumber(phoneNumber) {
	const phoneRegex = /^\d{10}$/;
	return phoneRegex.test(phoneNumber);
}
