import React from 'react';
import { requireSuperadmin } from '@/lib/superadmin';
import SuperadminShell from './SuperadminShell';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin('/superadmin');
  return <SuperadminShell>{children}</SuperadminShell>;
}
