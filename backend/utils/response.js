function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function error(res, message, status = 500, details = null) {
  const body = { success: false, error: message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, error };
