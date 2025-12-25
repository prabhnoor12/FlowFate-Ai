const Joi = require('joi');
const { AppError } = require('../utils/error_handling');

/**
 * Enhanced validation middleware supporting async Joi schemas, custom error formatting, and flexible targets.
 * @param {Object} schemas - { body, query, params, headers, cookies } Joi schemas
 * @param {Object} [options] - Joi validation options
 * @returns {Function} Express middleware
 */
function validate(schemas = {}, options = { abortEarly: false, stripUnknown: true }) {
	const targets = ['body', 'query', 'params', 'headers', 'cookies'];
	return async (req, res, next) => {
		try {
			for (const key of targets) {
				if (schemas[key]) {
					// Support async Joi schemas
					const result = typeof schemas[key].validateAsync === 'function'
						? await schemas[key].validateAsync(req[key], options)
						: schemas[key].validate(req[key], options);
					if (result.error) {
						return next(formatValidationError(key, result.error));
					}
					req[key] = result.value || result;
				}
			}
			next();
		} catch (err) {
			// Handle async validation errors
			if (err.isJoi) {
				return next(formatValidationError('unknown', err));
			}
			next(err);
		}
	};
}

function formatValidationError(key, error) {
	return new AppError(
		`Validation error in ${key}: ${error.details ? error.details.map(d => d.message).join(', ') : error.message}`,
		400,
		error.details || error.message
	);
}

module.exports = validate;
