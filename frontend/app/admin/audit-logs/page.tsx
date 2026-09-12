'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Activity,
  Layers,
  FileCode,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs(page, entityFilter, actionFilter);
  }, [page, entityFilter, actionFilter]);

  const fetchLogs = async (pageNum: number, entity: string, action: string) => {
    setIsLoading(true);
    try {
      let query = `/audit?page=${pageNum}&limit=15`;
      if (entity) query += `&entity=${encodeURIComponent(entity)}`;
      if (action) query += `&action=${encodeURIComponent(action)}`;

      const res = await apiClient(query);
      if (res.success && res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'LOGIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Institutional Audit Trail & Event Telemetry"
        subtitle="Immutable transaction logging recording all administrative overrides, status transitions, accreditation decisions, and system events."
        actions={
          <button
            onClick={() => fetchLogs(page, entityFilter, actionFilter)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter By:</span>
          </div>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20 focus:border-upvia-blue"
          >
            <option value="">All Entities</option>
            <option value="USER">User Account</option>
            <option value="STUDENT">Student Record</option>
            <option value="COMPANY">Company Profile</option>
            <option value="OPPORTUNITY">Training Opportunity</option>
            <option value="APPLICATION">Application Pipeline</option>
            <option value="TRAINING">Co-op Placement</option>
            <option value="EVALUATION">Supervisor Evaluation</option>
            <option value="JOB_OFFER">Job Offer</option>
            <option value="EARLY_WARNING">Early Warning Rule</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20 focus:border-upvia-blue"
          >
            <option value="">All Action Types</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="EVALUATE">EVALUATE</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {logs.length} of {totalCount} logged events
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
            <span>Querying institutional audit ledger...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400">
            No audit records match the selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isExpanded = expandedLogId === (log._id || log.id);
              const dateObj = new Date(log.timestamp || log.createdAt);
              return (
                <div key={log._id || log.id} className="transition-colors hover:bg-slate-50/50">
                  <div
                    onClick={() => toggleExpand(log._id || log.id)}
                    className="p-4 sm:px-6 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-upvia-navy">{log.entity}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-mono text-slate-500 truncate max-w-[120px] sm:max-w-none">
                          {log.entityId ? `#${String(log.entityId).substring(0, 10)}...` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[11px]">
                          {log.performedBy ? String(log.performedBy).substring(0, 10) : 'System'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[11px] whitespace-nowrap">
                          {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Inspection */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/80 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Full Entity ID
                          </span>
                          <span className="text-xs font-mono text-slate-800 break-all">{log.entityId || 'N/A'}</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Performed By (User ID)
                          </span>
                          <span className="text-xs font-mono text-slate-800 break-all">{log.performedBy || 'SYSTEM'}</span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            IP & Client Origin
                          </span>
                          <span className="text-xs font-mono text-slate-800 break-all">
                            {log.ipAddress || '127.0.0.1'} / {log.userAgent ? log.userAgent.substring(0, 30) : 'System Worker'}
                          </span>
                        </div>
                      </div>

                      {/* State Changes / Payload */}
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-2 font-sans font-semibold">
                          <FileCode className="w-3.5 h-3.5 text-upvia-cyan" />
                          <span>Event Payload & State Changes</span>
                        </div>
                        <pre className="leading-relaxed">
                          {JSON.stringify(
                            {
                              action: log.action,
                              entity: log.entity,
                              changes: log.changes || log.metadata || log.details || {},
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
