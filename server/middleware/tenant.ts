function resolveUnit(req: any): string {
  const userUnit = req.user?.unit;

  // Authenticated non-admin users are ALWAYS locked to their own unit
  // regardless of what X-System header says
  if (req.user && !req.user.isAdmin && userUnit && userUnit !== 'main') {
    return userUnit;
  }

  // For unauthenticated requests or main/admin users, trust X-System header
  const xSystem = req.headers?.['x-system'];
  if (xSystem === 'franchise' || xSystem === 'factory') return xSystem;

  // Fall back to user's unit (admin accessing a specific system via unit)
  if (userUnit && userUnit !== 'main') return userUnit;

  return 'main';
}

export function getTenantFilter(req: any): Record<string, string> {
  const unit = resolveUnit(req);
  if (unit === 'main') return {};
  return { unit };
}

export function getTenantUnit(req: any): string {
  return resolveUnit(req);
}
