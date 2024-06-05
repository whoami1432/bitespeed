'use strict';

const pool = require('../../database/db');

exports.checkAlreadyOrdered = async (email, phone) => {
	const { rows } = await pool.query(`select id, email, "phoneNumber", "linkedId", "linkPrecedence" from "Contact" where ((email = $1 OR "phoneNumber" = $2) AND "linkPrecedence" = 'Primary')`, [
		email,
		phone
	]);
	return rows;
};

exports.insertCustomer = async (email, phone, linkedId, linkPrecedence) => {
	const { rows } = await pool.query('insert into "Contact" (email, "phoneNumber", "linkedId", "linkPrecedence") values ($1, $2, $3, $4) returning *;', [email, phone, linkedId, linkPrecedence]);
	return rows;
};

exports.updateCustomer = async (linkedId, linkPrecedence, id) => {
	const { rows } = await pool.query('Update "Contact" set "linkedId" = $1, "linkPrecedence" = $2 where id = $3returning *;', [linkedId, linkPrecedence, id]);
	return rows;
};
