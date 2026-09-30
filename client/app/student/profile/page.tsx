'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { apiClient } from '../../../lib/api';
import {
  GraduationCap,
  Award,
  BookOpen,
  Code2,
  FolderGit2,
  CheckCircle2,
  Globe,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states for editable sections
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/students/me');
      if (res.success && res.data) {
        setProfile(res.data);
        setLinkedinUrl(res.data.linkedinUrl || '');
        setGithubUrl(res.data.githubUrl || '');
        setPortfolioUrl(res.data.portfolioUrl || '');
        setSkills(res.data.skills || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await apiClient('/students/me', {
        method: 'PUT',
        body: JSON.stringify({
          linkedinUrl,
          githubUrl,
          portfolioUrl,
          skills,
        }),
      });
      if (res.success) {
        setMessage('Profile updated successfully! Completion score recalculated.');
        setProfile(res.data);
      }
    } catch (e: any) {
      setMessage(e.message || 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Student Professional Profile"
        subtitle="Unified institutional profile combining verified SIS academic data with your portfolio, technical competencies, and project history."
        actions={
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-upvia-blue text-white hover:bg-upvia-blue-hover transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        }
      />

      {message && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic Data (Locked/Verified from University SIS) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-upvia-secondary mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Academic Records</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-5 text-slate-600">
              Synchronized automatically with the university Academic System. No manual data entry required.
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-slate-400">Student ID</p>
                <p className="font-bold text-upvia-navy mt-0.5">{profile?.studentId}</p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-slate-400">Degree & Major</p>
                <p className="font-bold text-upvia-navy mt-0.5">{profile?.programId?.nameEn} ({profile?.programId?.code})</p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-slate-400">College</p>
                <p className="font-bold text-upvia-navy mt-0.5">{profile?.collegeId?.nameEn}</p>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <div>
                  <p className="text-slate-400">Cumulative GPA</p>
                  <p className="font-bold text-base text-upvia-blue mt-0.5">{profile?.gpa} / {profile?.maxGpa}</p>
                </div>
                <div>
                  <p className="text-slate-400">Credits Earned</p>
                  <p className="font-bold text-base text-upvia-navy mt-0.5">{profile?.creditsCompleted} / 132</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-slate-400">Expected Graduation</p>
                <p className="font-bold text-upvia-navy mt-0.5">
                  {profile?.expectedGraduationDate ? new Date(profile.expectedGraduationDate).toLocaleDateString() : '---'}
                </p>
              </div>
            </div>

            {/* Passed Coursework */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="font-bold text-xs text-upvia-navy mb-2.5">Passed Core Courses</p>
              <div className="flex flex-wrap gap-1.5">
                {profile?.passedCourses?.map((c: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Professional Portfolio, Technical Competencies & Links */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Online Profiles */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-upvia-blue" />
              <span>Professional & Portfolio Links</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub / GitLab</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Website</label>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-upvia-blue/20"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills Competency Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-upvia-blue" />
                <span>Verified Skills & Competencies ({skills.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-upvia-navy">{s.skillNameEn}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Competency Level: {s.level} / 5</p>
                  </div>
                  {s.verified && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Engineering Projects */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-upvia-blue" />
              <span>Featured Engineering Projects</span>
            </h3>

            <div className="space-y-4">
              {profile?.projects?.map((proj: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-upvia-navy">{proj.title}</h4>
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-upvia-blue hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Code Repository</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-slate-600 leading-relaxed">{proj.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {proj.technologies?.map((tech: string, tIdx: number) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-200/70 text-slate-700 font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
