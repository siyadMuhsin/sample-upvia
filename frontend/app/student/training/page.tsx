'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Building2,
  UserCheck,
  Star,
} from 'lucide-react';

export default function StudentTrainingPage() {
  const [training, setTraining] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'tasks' | 'reports' | 'evaluate'>('overview');

  // Report submission state
  const [reportTitle, setReportTitle] = useState('');
  const [activities, setActivities] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [challenges, setChallenges] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Company evaluation state (student evaluates company 1-5 across 7 dimensions)
  const [trainingQuality, setTrainingQuality] = useState(5);
  const [tasksRelevance, setTasksRelevance] = useState(5);
  const [supervisionQuality, setSupervisionQuality] = useState(5);
  const [workEnvironment, setWorkEnvironment] = useState(5);
  const [specializationRelevance, setSpecializationRelevance] = useState(5);
  const [learningOpportunities, setLearningOpportunities] = useState(5);
  const [employmentOpportunities, setEmploymentOpportunities] = useState(5);
  const [companyComments, setCompanyComments] = useState('');
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/training/my');
      if (res.success && res.data) {
        setTraining(res.data);
        // Fetch detailed placement with tasks & attendance
        const detailRes = await apiClient(`/training/${res.data._id}`);
        if (detailRes.success && detailRes.data) {
          setTraining(detailRes.data);
        }

        // Fetch evaluations
        const evalRes = await apiClient(`/evaluations/training/${res.data._id}`);
        if (evalRes.success && evalRes.data) {
          setEvaluations(evalRes.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training) return;
    setIsSubmittingReport(true);
    try {
      const res = await apiClient('/training/reports', {
        method: 'POST',
        body: JSON.stringify({
          trainingId: training._id,
          reportType: 'WEEKLY',
          title: reportTitle,
          activities,
          tasksCompleted,
          skillsApplied: ['TypeScript', 'API Design'],
          challenges,
          learningOutcomes,
        }),
      });

      if (res.success) {
        setReportSuccess(true);
        setReportTitle('');
        setActivities('');
        setTasksCompleted('');
        setChallenges('');
        setLearningOutcomes('');
        fetchTrainingData();
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSubmitCompanyEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training) return;
    setIsSubmittingEval(true);
    try {
      const res = await apiClient('/evaluations/company', {
        method: 'POST',
        body: JSON.stringify({
          trainingId: training._id,
          trainingQuality,
          tasksRelevance,
          supervisionQuality,
          workEnvironment,
          specializationRelevance,
          learningOpportunities,
          employmentOpportunities,
          comments: companyComments,
        }),
      });

      if (res.success) {
        setEvalSuccess(true);
        fetchTrainingData();
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting evaluation');
    } finally {
      setIsSubmittingEval(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Cooperative Training Management"
        subtitle="Manage your active placement, daily attendance hours, weekly report submissions, and supervisor evaluations."
      />

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading placement records...</span>
        </div>
      ) : !training ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No active cooperative training placement found. Placements are accredited after employer selection.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={training.status} />
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {training.attendancePercentage}% Attendance
                </span>
              </div>

              <h2 className="text-xl font-bold text-upvia-navy">
                {training.trainingEntityName}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-upvia-secondary">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {training.companyId?.nameEn}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(training.startDate).toLocaleDateString()} – {new Date(training.endDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{training.durationWeeks} Weeks Placement</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
              <div className="text-left md:text-right rtl:text-right md:rtl:text-left">
                <p className="text-xs text-slate-400">Hours Completed</p>
                <p className="text-lg font-bold text-upvia-navy">{training.totalHoursCompleted} hrs</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-upvia-blue text-upvia-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview & Supervisors
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'attendance'
                  ? 'border-upvia-blue text-upvia-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Attendance Logs ({training.attendance?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-upvia-blue text-upvia-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Training Tasks ({training.tasks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-upvia-blue text-upvia-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Weekly Reports
            </button>
            <button
              onClick={() => setActiveTab('evaluate')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'evaluate'
                  ? 'border-upvia-blue text-upvia-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Company Evaluation
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-upvia-blue" />
                  <span>Assigned Supervisors</span>
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-slate-400 text-[11px] uppercase font-semibold">Academic Supervisor (University)</p>
                    <p className="font-bold text-sm text-upvia-navy mt-1">
                      {training.academicSupervisorId?.firstNameEn} {training.academicSupervisorId?.lastNameEn || 'Assigned by Faculty'}
                    </p>
                    <p className="text-slate-500 mt-0.5">{training.academicSupervisorId?.email || 'supervisor.academic@upvia.com'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-slate-400 text-[11px] uppercase font-semibold">Industrial Mentor (Company)</p>
                    <p className="font-bold text-sm text-upvia-navy mt-1">
                      {training.companySupervisorId?.firstNameEn} {training.companySupervisorId?.lastNameEn || 'Eng. Omar Al-Jadaan'}
                    </p>
                    <p className="text-slate-500 mt-0.5">{training.companySupervisorId?.email || 'supervisor.company@upvia.com'}</p>
                  </div>
                </div>
              </div>

              {/* Supervisor Evaluation Feedback */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Company Supervisor Rubric (10 Dimensions)</span>
                </h3>

                {evaluations?.supervisorEvaluations?.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                      <span>Overall Evaluation Score:</span>
                      <span className="text-base">{evaluations.supervisorEvaluations[0].averageScore} / 5.0</span>
                    </div>

                    <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{evaluations.supervisorEvaluations[0].feedback}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Mid-term and final supervisor evaluations will appear here once recorded.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Attendance Logs */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Check-out</th>
                    <th className="py-3 px-4">Hours Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {training.attendance?.map((att: any) => (
                    <tr key={att._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-upvia-navy">
                        {new Date(att.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={att.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{att.checkIn || '08:00 AM'}</td>
                      <td className="py-3 px-4 text-slate-600">{att.checkOut || '04:30 PM'}</td>
                      <td className="py-3 px-4 font-bold text-upvia-navy">{att.hours} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {training.tasks?.map((task: any) => (
                <div key={task._id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-sm text-upvia-navy">{task.title}</h4>
                    <p className="text-slate-600 mt-1">{task.description}</p>
                    <p className="text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Weekly Report Submission */}
          {activeTab === 'reports' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
              <h3 className="text-sm font-bold text-upvia-navy mb-4">Submit Weekly Training Report</h3>
              {reportSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  Weekly report submitted to Academic and Company Supervisors!
                </div>
              )}
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Report Title</label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Week 5: Microservices Telemetry Implementation"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Activities & Engagements</label>
                  <textarea
                    rows={3}
                    required
                    value={activities}
                    onChange={(e) => setActivities(e.target.value)}
                    placeholder="Describe main engineering tasks, meetings, and team collaborations..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Challenges & Resolution</label>
                  <textarea
                    rows={2}
                    required
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="Technical obstacles faced and how you overcame them..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Key Learning Outcomes</label>
                  <textarea
                    rows={2}
                    required
                    value={learningOutcomes}
                    onChange={(e) => setLearningOutcomes(e.target.value)}
                    placeholder="New frameworks, industry practices, or tools learned this week..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2.5 rounded-xl font-bold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-2xs flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReport ? 'Submitting...' : 'Submit Report'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 5: Company Evaluation */}
          {activeTab === 'evaluate' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
              <h3 className="text-sm font-bold text-upvia-navy mb-1">Evaluate Company Training Quality (7 Dimensions)</h3>
              <p className="text-xs text-upvia-secondary mb-6">
                Your feedback informs university accreditation and industrial partnership renewals.
              </p>

              {evalSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  Company evaluation submitted successfully!
                </div>
              )}

              <form onSubmit={handleSubmitCompanyEval} className="space-y-4 text-xs">
                {[
                  { label: 'Overall Training Quality', value: trainingQuality, set: setTrainingQuality },
                  { label: 'Relevance of Assigned Tasks to Specialization', value: tasksRelevance, set: setTasksRelevance },
                  { label: 'Quality of Industrial Supervision & Mentorship', value: supervisionQuality, set: setSupervisionQuality },
                  { label: 'Work Environment & Safety Culture', value: workEnvironment, set: setWorkEnvironment },
                  { label: 'Specialization Alignment & Technical Depth', value: specializationRelevance, set: setSpecializationRelevance },
                  { label: 'Hands-on Learning Opportunities', value: learningOpportunities, set: setLearningOpportunities },
                  { label: 'Post-Training Employment Opportunities', value: employmentOpportunities, set: setEmploymentOpportunities },
                ].map((dim, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">{dim.label}</span>
                    <select
                      value={dim.value}
                      onChange={(e) => dim.set(Number(e.target.value))}
                      className="py-1 px-3 border border-slate-200 rounded-lg text-xs font-bold text-upvia-navy focus:outline-none"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Very Good</option>
                      <option value={3}>3 - Good</option>
                      <option value={2}>2 - Fair</option>
                      <option value={1}>1 - Poor</option>
                    </select>
                  </div>
                ))}

                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1">Additional Comments for University Council</label>
                  <textarea
                    rows={3}
                    value={companyComments}
                    onChange={(e) => setCompanyComments(e.target.value)}
                    placeholder="Describe your overall experience at this training partner..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEval}
                  className="px-5 py-2.5 rounded-xl font-bold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-2xs"
                >
                  {isSubmittingEval ? 'Saving...' : 'Submit Evaluation'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
