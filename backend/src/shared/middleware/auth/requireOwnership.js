function readByPath(obj, path) {
  if (!path) return '';
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function requireOwnership({ checks, allowRoles = [], from = 'query', key = 'userId' } = {}) {
  const normalizedChecks = Array.isArray(checks) && checks.length
    ? checks
    : [{ from, key }];

  return (req, res, next) => {
    const authUserId = String(req.user?.id || '');
    if (!authUserId) return res.status(401).json({ message: 'Unauthorized' });

    const role = String(req.user?.role || '').toLowerCase();
    const bypassRoles = new Set(
      (Array.isArray(allowRoles) ? allowRoles : [])
        .map((allowedRole) => String(allowedRole || '').toLowerCase())
        .filter(Boolean)
    );
    if (bypassRoles.has(role)) {
      return next();
    }

    const hasOwnership = normalizedChecks.some((check) => {
      const source = check?.from || 'query';
      const path = check?.key || 'userId';
      const sourceObj =
        source === 'params' ? req.params
        : source === 'body' ? req.body
        : req.query;
      const ownerId = readByPath(sourceObj, path);
      return ownerId && String(ownerId) === authUserId;
    });

    if (!hasOwnership) {
      return res.status(403).json({ message: 'Forbidden: ownership mismatch' });
    }

    return next();
  };
}
