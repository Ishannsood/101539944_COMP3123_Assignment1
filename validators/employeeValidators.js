const { body, param, query } = require('express-validator');

const FIELDS = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];

// required=true for POST; required=false (optional) for PUT.
const field = (name, required) => {
  const chain = body(name);
  return required ? chain.exists({ checkNull: true }).withMessage(`${name} is required`).bail() : chain.optional();
};

const text = (name, required, max) =>
  field(name, required)
    .isString().withMessage(`${name} must be a string`).bail()
    .trim()
    .isLength({ min: 1, max }).withMessage(`${name} must be 1-${max} characters`);

const employeeBody = (required) => [
  text('first_name', required, 50),
  text('last_name', required, 50),
  field('email', required)
    .isString().withMessage('email must be a string').bail()
    .trim()
    .isEmail().withMessage('email format is invalid')
    .isLength({ max: 254 }).withMessage('email is too long')
    .toLowerCase(),
  text('position', required, 100),
  field('salary', required)
    .isFloat({ gt: 0, max: 10000000 }).withMessage('salary must be a positive number (max 10,000,000)')
    .toFloat(),
  field('date_of_joining', required)
    .isISO8601({ strict: true }).withMessage('date_of_joining must be a valid ISO 8601 date (e.g. 2024-05-30)')
    .toDate(),
  text('department', required, 100),
];

exports.createEmployee = employeeBody(true);

exports.updateEmployee = [
  body().custom((b) => {
    if (!b || !FIELDS.some((f) => f in b)) throw new Error(`Provide at least one of: ${FIELDS.join(', ')}`);
    return true;
  }),
  ...employeeBody(false),
];

exports.employeeIdParam = [param('eid').isMongoId().withMessage('eid must be a valid MongoDB ObjectId')];

exports.employeeIdQuery = [
  query('eid')
    .custom((v) => typeof v === 'string' && v.length > 0).withMessage('eid query parameter is required').bail()
    .isMongoId().withMessage('eid must be a valid MongoDB ObjectId'),
];

exports.FIELDS = FIELDS;
