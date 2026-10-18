const router = require('express').Router();
const ctrl = require('../controllers/employeeController');
const v = require('../validators/employeeValidators');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth); // every employee route requires a valid JWT

router.get('/employees', ctrl.getEmployees);
router.post('/employees', v.createEmployee, validate, ctrl.createEmployee);
router.get('/employees/:eid', v.employeeIdParam, validate, ctrl.getEmployee);
router.put('/employees/:eid', v.employeeIdParam, v.updateEmployee, validate, ctrl.updateEmployee);
router.delete('/employees', v.employeeIdQuery, validate, ctrl.deleteEmployee);

module.exports = router;
