const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { FIELDS } = require('../validators/employeeValidators');

// Whitelist: clients can never set `user` (owner), _id or timestamps.
const pickFields = (body) => FIELDS.reduce((acc, f) => (f in body ? { ...acc, [f]: body[f] } : acc), {});

// Ownership check. The owner is ALWAYS part of the query, taken from the verified JWT (req.user),
// never from client input. 403 if the employee exists but belongs to someone else, 404 if it does not exist.
const getOwnedEmployee = async (eid, userId) => {
  const employee = await Employee.findOne({ _id: eid, user: userId });
  if (employee) return employee;

  if (await Employee.exists({ _id: eid })) {
    logger.warn('Authorization failure: employee belongs to another user', { userId: String(userId), employeeId: eid });
    throw new AppError('Forbidden: this employee belongs to another user', 403);
  }
  throw new AppError('Employee not found', 404);
};

// GET /api/v1/emp/employees
exports.getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ user: req.user._id }).sort({ created_at: -1 });
  logger.info('Employees listed', { userId: req.user.id, count: employees.length });
  res.status(200).json({ status: 'success', count: employees.length, data: employees });
});

// POST /api/v1/emp/employees
exports.createEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.create({ ...pickFields(req.body), user: req.user._id });
  logger.info('Employee created', { userId: req.user.id, employeeId: employee.id });
  res.status(201).json({ status: 'success', message: 'Employee created successfully', data: employee });
});

// GET /api/v1/emp/employees/:eid
exports.getEmployee = asyncHandler(async (req, res) => {
  const employee = await getOwnedEmployee(req.params.eid, req.user._id);
  res.status(200).json({ status: 'success', data: employee });
});

// PUT /api/v1/emp/employees/:eid
exports.updateEmployee = asyncHandler(async (req, res) => {
  const employee = await getOwnedEmployee(req.params.eid, req.user._id);
  employee.set(pickFields(req.body));
  await employee.save();
  logger.info('Employee updated', { userId: req.user.id, employeeId: employee.id });
  res.status(200).json({ status: 'success', message: 'Employee updated successfully', data: employee });
});

// DELETE /api/v1/emp/employees?eid=xxx
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const { eid } = req.query;
  await getOwnedEmployee(eid, req.user._id);
  await Employee.deleteOne({ _id: eid, user: req.user._id });
  logger.info('Employee deleted', { userId: req.user.id, employeeId: eid });
  res.status(204).send();
});
