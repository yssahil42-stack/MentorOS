import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  GraduationCap,
  Bell,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AppSettingsSection } from '../../components/settings/AppSettingsSection';
import { api } from '../../services/api';

export default function StudentSettingsPage() {
  const { showToast } = useWorkspace();
  const { user, refreshUser } = useAuth();

  const [institution, setInstitution] = useState('Stanford University');
  const [major, setMajor] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('Year 3, Semester 1');
  const [enrolledCredits, setEnrolledCredits] = useState('16');
  const [targetGpa, setTargetGpa] = useState('3.85');
  const [minPassingGrade, setMinPassingGrade] = useState('B+');

  const [pomodoroFocusTime, setPomodoroFocusTime] = useState('50');
  const [shortBreakTime, setShortBreakTime] = useState('10');
  const [autoScheduleExams, setAutoScheduleExams] = useState(true);
  const [dailyFocusBriefing, setDailyFocusBriefing] = useState(true);

  const [notifyDeadlinesHours, setNotifyDeadlinesHours] = useState('48');
  const [notifyExamsDays, setNotifyExamsDays] = useState('7');
  const [courseLagWarning, setCourseLagWarning] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mentoros_settings_student_${user?.id ?? 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.institution) setInstitution(parsed.institution);
        if (parsed.major) setMajor(parsed.major);
        if (parsed.semester) setSemester(parsed.semester);
        if (parsed.enrolledCredits) setEnrolledCredits(parsed.enrolledCredits);
        if (parsed.targetGpa) setTargetGpa(parsed.targetGpa);
        if (parsed.minPassingGrade) setMinPassingGrade(parsed.minPassingGrade);
        if (parsed.pomodoroFocusTime) setPomodoroFocusTime(parsed.pomodoroFocusTime);
        if (parsed.shortBreakTime) setShortBreakTime(parsed.shortBreakTime);
        if (parsed.autoScheduleExams !== undefined) setAutoScheduleExams(parsed.autoScheduleExams);
        if (parsed.dailyFocusBriefing !== undefined)
          setDailyFocusBriefing(parsed.dailyFocusBriefing);
        if (parsed.notifyDeadlinesHours) setNotifyDeadlinesHours(parsed.notifyDeadlinesHours);
        if (parsed.notifyExamsDays) setNotifyExamsDays(parsed.notifyExamsDays);
        if (parsed.courseLagWarning !== undefined) setCourseLagWarning(parsed.courseLagWarning);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      institution,
      major,
      semester,
      enrolledCredits,
      targetGpa,
      minPassingGrade,
      pomodoroFocusTime,
      shortBreakTime,
      autoScheduleExams,
      dailyFocusBriefing,
      notifyDeadlinesHours,
      notifyExamsDays,
      courseLagWarning,
    };

    try {
      localStorage.setItem(
        `mentoros_settings_student_${user?.id ?? 'guest'}`,
        JSON.stringify(payload)
      );
      try {
        await api.patch('/auth/me/onboarding', {
          profile_data: {
            ...((user?.profile_data as Record<string, unknown>) || {}),
            student_settings: payload,
          },
        });
        if (refreshUser) await refreshUser();
      } catch {
        // offline fallback
      }
      showToast('Student academic settings saved successfully!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Settings className="w-5 h-5 text-orange-500" />
          </span>
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
            STUDENT ACADEMIC CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
          Academic Settings
        </h1>
        <p className="text-xs md:text-sm text-text-muted">
          Configure degree pathways, target GPA goals, study intervals, exam alerts, and application
          behavior.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Academic Program & Degree Goals */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <GraduationCap className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Degree &amp; Academic Curriculum
              </h3>
              <p className="text-xs text-text-muted">
                Aligns syllabus parsing, assignment priority, and study roadmap milestones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                University / Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Degree / Academic Major
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Current Term / Semester
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Year 3, Semester 1"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Enrolled Credit Hours
              </label>
              <input
                type="number"
                value={enrolledCredits}
                onChange={(e) => setEnrolledCredits(e.target.value)}
                placeholder="16"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Target GPA (Cumulative)
              </label>
              <input
                type="text"
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                placeholder="3.85 / 4.0"
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Minimum Desired Course Grade
              </label>
              <select
                value={minPassingGrade}
                onChange={(e) => setMinPassingGrade(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="A+">A+ (Dean&apos;s Honor)</option>
                <option value="A">A (Excellent)</option>
                <option value="A-">A-</option>
                <option value="B+">B+ (Very Good)</option>
                <option value="B">B (Good)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Study Sessions & Focus Strategy */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Study Sessions &amp; Focus Intervals
              </h3>
              <p className="text-xs text-text-muted">
                Calibrate study timer intervals, break cadence, and intelligent revision blocks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Deep Study Focus Interval
              </label>
              <select
                value={pomodoroFocusTime}
                onChange={(e) => setPomodoroFocusTime(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="25">25 Minutes (Standard Pomodoro)</option>
                <option value="45">45 Minutes (Lecture Block)</option>
                <option value="50">50 Minutes (Deep Work)</option>
                <option value="90">90 Minutes (Ultradian Cycle)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Short Break Duration
              </label>
              <select
                value={shortBreakTime}
                onChange={(e) => setShortBreakTime(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-border-base space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScheduleExams}
                onChange={(e) => setAutoScheduleExams(e.target.checked)}
                className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">
                  Auto-schedule Exam Preparation Blocks
                </span>
                <p className="text-3xs text-text-muted">
                  Automatically generates spaced-repetition study blocks before test dates
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dailyFocusBriefing}
                onChange={(e) => setDailyFocusBriefing(e.target.checked)}
                className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">Morning Daily Focus Briefing</span>
                <p className="text-3xs text-text-muted">
                  Display daily tasks and timetable overview at top of dashboard
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Academic Alerts & Reminders */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-base">
            <Bell className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Academic Alerts &amp; Deadlines
              </h3>
              <p className="text-xs text-text-muted">
                Receive proactive reminders before assignment deadlines, quizzes, and exams
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Assignment Deadline Advance Warning
              </label>
              <select
                value={notifyDeadlinesHours}
                onChange={(e) => setNotifyDeadlinesHours(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="12">12 Hours Prior</option>
                <option value="24">24 Hours Prior</option>
                <option value="48">48 Hours Prior (Recommended)</option>
                <option value="72">72 Hours Prior</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary block">
                Exam Preparation Lead Time
              </label>
              <select
                value={notifyExamsDays}
                onChange={(e) => setNotifyExamsDays(e.target.value)}
                className="w-full bg-bg-surface border border-border-base rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="3">3 Days Before</option>
                <option value="7">7 Days Before (Standard)</option>
                <option value="14">14 Days Before (Comprehensive)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-border-base">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={courseLagWarning}
                onChange={(e) => setCourseLagWarning(e.target.checked)}
                className="rounded text-orange-500 bg-bg-surface border-border-base focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-medium text-text-primary">Coursework Progress Warning</span>
                <p className="text-3xs text-text-muted">
                  Notify if completion rate in any enrolled course falls below 60%
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Global Application & System Settings */}
        <AppSettingsSection />

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm font-semibold"
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving Settings...' : 'Save Academic Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
