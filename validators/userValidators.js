const { body } = require('express-validator');

exports.signup = [
  body('username')
    .exists({ checkNull: true }).withMessage('username is required').bail()
    .isString().withMessage('username must be a string').bail()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('username must be 3-30 characters')
    .matches(/^[A-Za-z0-9_.-]+$/).withMessage('username may only contain letters, numbers, _ . -'),
  body('email')
    .exists({ checkNull: true }).withMessage('email is required').bail()
    .isString().withMessage('email must be a string').bail()
    .trim()
    .isEmail().withMessage('email format is invalid')
    .isLength({ max: 254 }).withMessage('email is too long')
    .toLowerCase(),
  body('password')
    .exists({ checkNull: true }).withMessage('password is required').bail()
    .isString().withMessage('password must be a string').bail()
    .isLength({ min: 8, max: 72 }).withMessage('password must be 8-72 characters')
    .matches(/[a-z]/).withMessage('password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('password must contain an uppercase letter')
    .matches(/\d/).withMessage('password must contain a number'),
];

exports.login = [
  body().custom((b) => {
    if (!b || (!b.username && !b.email)) throw new Error('Either username or email is required');
    return true;
  }),
  body('username').optional().isString().withMessage('username must be a string').bail().trim().notEmpty().withMessage('username cannot be empty'),
  body('email').optional().isString().withMessage('email must be a string').bail().trim().isEmail().withMessage('email format is invalid').toLowerCase(),
  body('password')
    .exists({ checkNull: true }).withMessage('password is required').bail()
    .isString().withMessage('password must be a string').bail()
    .notEmpty().withMessage('password cannot be empty')
    .isLength({ max: 72 }).withMessage('password is too long'),
];
