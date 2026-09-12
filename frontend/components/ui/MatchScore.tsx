import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, BookOpen, ChevronRight, X } from 'lucide-react';
import { IMatchScoreResult } from '@upvia/shared';

interface MatchScoreProps {
  score: number;
  breakdown?: IMatchScoreResult['breakdown'];
  matchedSkills?: IMatchScoreResult['matchedSkills'];
  missingSkills?: IMatchScoreResult['missingSkills'];
  recommendedCourses?: IMatchScoreResult['recommendedCourses'];
  explanation?: string;
  size?: 'sm' | 'md' | 'lg';
  showModalTrigger?: boolean;
}

export const MatchScore: React.FC<MatchScoreProps> = ({
  score,
  breakdown,
  matchedSkills = [],
  missingSkills = [],
  recommendedCourses = [],
  explanation,
  size = 'md',
  showModalTrigger = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (s >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (s >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3.5 py-1.5 text-base font-bold';
      case 'md':
      default:
        return 'px-2.5 py-1 text-sm font-semibold';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => showModalTrigger && setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border transition-all duration-150 ${getScoreColor(
          score
        )} ${getBadgeSize()} ${showModalTrigger ? 'cursor-pointer hover:shadow-sm active:scale-95' : 'cursor-default'}`}
        title="Click to view explainable match breakdown"
      >
        <Sparkles className="w-3.5 h-3.5 text-upvia-cyan" />
        <span>{score}% Match</span>
      </button>

      {/* Explainable Match Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left rtl:text-right max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-upvia-blue to-upvia-cyan text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {score}%
                </div>
                <div>
                  <h3 className="text-base font-bold text-upvia-navy">Explainable Match Breakdown</h3>
                  <p className="text-xs text-upvia-secondary">Deterministic Multi-Dimensional Scoring</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {explanation && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs leading-relaxed">
                  <p className="font-semibold mb-0.5">Algorithm Verdict:</p>
                  <p>{explanation}</p>
                </div>
              )}

              {/* Dimensional Weights Breakdown */}
              {breakdown && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Weighted Criteria Fit</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <span className="text-slate-600">Specialization (30%)</span>
                      <span className="font-bold text-upvia-navy">{breakdown.specializationScore}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <span className="text-slate-600">Skills Fit (30%)</span>
                      <span className="font-bold text-upvia-navy">{breakdown.skillsScore}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <span className="text-slate-600">Academic Standing (15%)</span>
                      <span className="font-bold text-upvia-navy">{breakdown.academicEligibilityScore}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <span className="text-slate-600">Cumulative GPA (10%)</span>
                      <span className="font-bold text-upvia-navy">{breakdown.gpaScore}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Matched Skills */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-700 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Matched Skills ({matchedSkills.length})
                </h4>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs">
                        {s.name} (Lvl {s.studentLevel}/{s.requiredLevel})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No direct required skills verified yet.</p>
                )}
              </div>

              {/* Missing Skills & Recommendations */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 mb-2.5 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Skill Gaps ({missingSkills.length})
                </h4>
                {missingSkills.length > 0 ? (
                  <div className="space-y-2">
                    {missingSkills.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-amber-200/70 bg-amber-50/40 flex items-center justify-between text-xs">
                        <span className="font-medium text-amber-900">{s.name}</span>
                        <span className="text-amber-700">Target Level {s.requiredLevel}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">All prerequisite skills satisfied!</p>
                )}
              </div>

              {/* Recommended Courses */}
              {recommendedCourses.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-upvia-blue mb-2.5 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-upvia-blue" />
                    Recommended Preparatory Courses
                  </h4>
                  <div className="space-y-1.5">
                    {recommendedCourses.map((c, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between items-center">
                        <span className="font-semibold text-upvia-navy">{c.courseCode}: {c.name}</span>
                        <span className="text-xs text-upvia-secondary">Addresses: {c.targetSkill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 text-right rtl:text-left">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-upvia-navy text-white hover:bg-upvia-navy-light transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
