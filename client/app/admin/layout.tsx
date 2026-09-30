'use client';

import React from 'react';
import { RouteGuard } from '../../components/layout/RouteGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
