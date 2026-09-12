'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { apiClient } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import {
  GraduationCap,
  Star,
  CheckCircle2,
  Send,
  X,
  Award,
  DollarSign,
} from 'lucide-react';

export default function CompanyTraineesPage() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Evaluation modal
  const [evalTrainee, setEvalTrainee] = useState<any>(null);
  const [techSkills, setTechSkills] = useState(5);
  const [comm, setComm] = useState(5);
  const [problemSolving, setProblemSolving] = useState(5);
  const [teamwork, setTeamwork] = useState(5);
  const [prof, setProf] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);

  // Job offer modal
  const [offerTrainee, setOfferTrainee] = useState<any>(null);
  const [jobTitleEn, setJobTitleEn] = useState('Associate Cloud Software Engineer');
  const [salary, setSalary] = useState(18000);
  const [city, setCity] = useState('Dhahran');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainees();
  }, []);

  const fetchTrainees = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/training');
      if (res.success && res.data) {
        setTrainings(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTrainee) return;
    setIsSubmittingEval(true);
    try {
      const res = await apiClient('/evaluations/supervisor', {
        method: 'POST',
        body: JSON.stringify({
          trainingId: evalTrainee._id,
          technicalSkills: techSkills,
          communication: comm,
          problemSolving,
          teamwork,
          professionalism: prof,
          attendance: 5,
          qualityOfWork: 5,
          initiative: 5,
          learningAbility: 5,
          overallPerformance: 5,
          feedback,
        }),
      });
      if (res.success) {
        setSuccessMsg('Supervisor 10-dimension evaluation submitted successfully!');
        setEvalTrainee(null);
      }
    } catch (e: any) {
      alert(e.message || 'Error submitting evaluation');
    } finally {
      setIsSubmittingEval(false);
    }
  };

  const handleSendJobOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTrainee) return;
    setIsSubmittingOffer(true);
    try {
      const res = await apiClient('/job-offers', {
        method: 'POST',
        body: JSON.stringify({
          trainingId: offerTrainee._id,
          studentId: offerTrainee.studentId?._id,
          companyId: user?.companyId,
          jobTitleEn,
          salary,
          city,
          startDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        }),
      });
      if (res.success) {
        setSuccessMsg(`Job offer extended to ${offerTrainee.studentId?.userId?.firstNameEn}!`);
        setOfferTrainee(null);
      }
    } catch (e: any) {
      alert(e.message || 'Error creating job offer');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Active Trainees & Intern Performance"
        subtitle="Evaluate placed students across institutional rubrics and issue direct employment offers."
      />

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-upvia-blue border-t-transparent rounded-full animate-spin" />
          <span>Loading trainees...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {trainings.map((tr) => (
            <div
              key={tr._id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={tr.status} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {tr.attendancePercentage}% Attendance
                  </span>
                </div>

                <h3 className="text-base font-bold text-upvia-navy">
                  {tr.studentId?.userId?.firstNameEn} {tr.studentId?.userId?.lastNameEn}
                </h3>
                <p className="text-xs text-upvia-secondary mt-0.5">
                  Opportunity: {tr.opportunityId?.titleEn || 'Software Engineering Co-op'}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Hours Completed: <span className="font-bold text-upvia-navy">{tr.totalHoursCompleted} hrs</span>
                </p>
              </div>

              <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <button
                  onClick={() => setEvalTrainee(tr)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-upvia-navy hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Submit Evaluation</span>
                </button>

                <button
                  onClick={() => setOfferTrainee(tr)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Extend Job Offer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Rubric Modal */}
      {evalTrainee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-upvia-navy">
                Supervisor Rubric: {evalTrainee.studentId?.userId?.firstNameEn}
              </h3>
              <button onClick={() => setEvalTrainee(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="p-6 space-y-3.5 text-xs">
              {[
                { label: 'Technical Competency & Code Quality', val: techSkills, set: setTechSkills },
                { label: 'Communication & Team Synergy', val: comm, set: setComm },
                { label: 'Critical Problem Solving', val: problemSolving, set: setProblemSolving },
                { label: 'Teamwork & Reliability', val: teamwork, set: setTeamwork },
                { label: 'Workplace Professionalism & Ethics', val: prof, set: setProf },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <select
                    value={item.val}
                    onChange={(e) => item.set(Number(e.target.value))}
                    className="py-1 px-2.5 rounded-lg border border-slate-200 font-bold text-upvia-navy"
                  >
                    <option value={5}>5 - Exceptional</option>
                    <option value={4}>4 - Proficient</option>
                    <option value={3}>3 - Competent</option>
                    <option value={2}>2 - Needs Support</option>
                  </select>
                </div>
              ))}

              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">Supervisor Written Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide qualitative feedback on the trainee's engineering contributions..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEvalTrainee(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEval}
                  className="px-5 py-2 rounded-lg font-bold bg-upvia-blue text-white hover:bg-upvia-blue-hover shadow-2xs"
                >
                  {isSubmittingEval ? 'Saving...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Job Offer Modal */}
      {offerTrainee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-upvia-navy">Extend Permanent Job Offer</h3>
              <button onClick={() => setOfferTrainee(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendJobOffer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitleEn}
                  onChange={(e) => setJobTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Salary (SAR)</label>
                <input
                  type="number"
                  required
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Location City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOfferTrainee(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOffer}
                  className="px-5 py-2 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                >
                  {isSubmittingOffer ? 'Sending...' : 'Extend Formal Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
