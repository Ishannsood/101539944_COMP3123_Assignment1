const router = require('express').Router();
const { signup, login } = require('../controllers/userController');
const validators = require('../validators/userValidators');
const validate = require('../middleware/validate');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiters');

router.post('/signup', signupLimiter, validators.signup, validate, signup);
router.post('/login', loginLimiter, validators.login, validate, login);

module.exports = router;
