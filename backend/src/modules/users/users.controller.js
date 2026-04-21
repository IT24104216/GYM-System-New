export function getusersStatus(_req, res) {
  res.json({
    module: 'users',
    status: 'ready',
  });
}
