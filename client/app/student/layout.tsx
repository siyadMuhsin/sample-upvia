'use client';

import React from 'react';
import { RouteGuard } from '../../components/layout/RouteGuard';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
