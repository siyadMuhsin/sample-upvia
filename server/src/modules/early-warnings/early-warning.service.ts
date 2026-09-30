import { Student, Program, Company, Training, Opportunity, Alert, AlertRule } from '../../models';
import { AlertSeverity, OpportunityStatus } from '../../shared';

const DECLINING_OPPORTUNITY_MIN_PRIOR_COUNT = 3;
const DECLINING_OPPORTUNITY_DROP_RATIO = 0.5; // alert if recent count fell by 50%+
const LOW_CONVERSION_MIN_ACCEPTED = 3;
const LOW_CONVERSION_MAX_RATE = 5; // percent

export class EarlyWarningService {
  /**
   * Evaluates all early warning rules against live MongoDB documents
   */
  async evaluateAllRules(): Promise<{ createdCount: number; alerts: any[] }> {
    const generatedAlerts: any[] = [];
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    // Rule 1 [RED]: Student graduating within 6 months without training
    const graduatingStudents = await Student.find({
      studentStatus: { $in: ['EXPECTED_GRADUATE', 'CURRENT_STUDENT'] },
      expectedGraduationDate: { $lte: sixMonthsFromNow },
    }).populate('userId', 'firstNameEn lastNameEn email');

    for (const student of graduatingStudents) {
      const activeOrCompletedTraining = await Training.findOne({
        studentId: student._id,
        status: { $in: ['IN_TRAINING', 'COMPLETED', 'UNIVERSITY_ACCREDITED'] },
      });

      if (!activeOrCompletedTraining) {
        const studentUser = student.userId as any;
        const studentName = studentUser ? `${studentUser.firstNameEn} ${studentUser.lastNameEn}` : student.studentId;

        const existingAlert = await Alert.findOne({
          entityType: 'STUDENT',
          entityId: student._id,
          resolved: false,
          category: 'STUDENT_TRAINING',
        });

        if (!existingAlert) {
          const alert = await Alert.create({
            ruleCode: 'RULE_GRAD_NO_TRAINING',
            severity: AlertSeverity.RED,
            category: 'STUDENT_TRAINING',
            titleEn: `Urgent: Student ${studentName} near graduation without Co-op training`,
            titleAr: `تنبيه عاجل: الطالب ${studentName} يقترب من التخرج دون تدريب تعاوني`,
            descriptionEn: `Student is expected to graduate within 6 months (${student.expectedGraduationDate.toISOString().split('T')[0]}) but has no registered or completed cooperative training.`,
            descriptionAr: `من المتوقع تخرج الطالب خلال 6 أشهر دون وجود سجل تدريب تعاوني مكتمل أو ساري.`,
            entityType: 'STUDENT',
            entityId: student._id,
            entityName: studentName,
            universityId: student.universityId,
            collegeId: student.collegeId,
            programId: student.programId,
          });
          generatedAlerts.push(alert);
        }
      }
    }

    // Rule 2 [RED]: Program below target employment
    const programs = await Program.find().lean();
    for (const prog of programs) {
      if (prog.currentEmploymentRate && prog.currentEmploymentRate < (prog.targetEmploymentRate - 10)) {
        const existingAlert = await Alert.findOne({
          entityType: 'PROGRAM',
          entityId: prog._id,
          resolved: false,
        });

        if (!existingAlert) {
          const alert = await Alert.create({
            ruleCode: 'RULE_PROGRAM_UNDERPERFORMING',
            severity: AlertSeverity.RED,
            category: 'PROGRAM_EMPLOYMENT',
            titleEn: `Critical: Program ${prog.nameEn} below target employment`,
            titleAr: `حرج: البرنامج ${prog.nameAr} أقل من نسبة التوظيف المستهدفة`,
            descriptionEn: `Current employment rate is ${prog.currentEmploymentRate}%, which is severely below the target threshold of ${prog.targetEmploymentRate}%.`,
            descriptionAr: `نسبة التوظيف الحالية ${prog.currentEmploymentRate}% أقل بشكل ملحوظ من الهدف المستهدف ${prog.targetEmploymentRate}%.`,
            entityType: 'PROGRAM',
            entityId: prog._id,
            entityName: prog.nameEn,
            collegeId: prog.collegeId,
          });
          generatedAlerts.push(alert);
        }
      }
    }

    // Rule 3 [ORANGE]: Trainee attendance below 80%
    const activeTrainings = await Training.find({ status: 'IN_TRAINING' }).populate('studentId');
    for (const tr of activeTrainings) {
      if (tr.attendancePercentage < 80) {
        const existingAlert = await Alert.findOne({
          entityType: 'TRAINING',
          entityId: tr._id,
          resolved: false,
          category: 'ATTENDANCE_WARNING',
        });

        if (!existingAlert) {
          const alert = await Alert.create({
            ruleCode: 'RULE_ATTENDANCE_LOW',
            severity: AlertSeverity.ORANGE,
            category: 'ATTENDANCE_WARNING',
            titleEn: `Attendance Warning: Co-op trainee attendance dropped to ${tr.attendancePercentage}%`,
            titleAr: `تحذير حضور: انخفاض نسبة حضور المتدرب إلى ${tr.attendancePercentage}%`,
            descriptionEn: `Trainee at ${tr.trainingEntityName} has an attendance record of ${tr.attendancePercentage}%, falling below the mandatory 80% academic requirement.`,
            descriptionAr: `سجل حضور المتدرب في ${tr.trainingEntityName} انخفض إلى ${tr.attendancePercentage}%، وهو أقل من الحد الأدنى المقبول.`,
            entityType: 'TRAINING',
            entityId: tr._id,
            entityName: tr.trainingEntityName,
          });
          generatedAlerts.push(alert);
        }
      }
    }

    // Rule [ORANGE]: Declining internship/training opportunities per program.
    // Opportunity has no direct programId, so we match it to a program via the
    // same specialization-substring technique the matching engine already uses.
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    for (const prog of programs) {
      const specializationPattern = new RegExp(prog.nameEn, 'i');
      const [recentCount, priorCount] = await Promise.all([
        Opportunity.countDocuments({
          createdAt: { $gte: thirtyDaysAgo },
          requiredSpecializations: specializationPattern,
        }),
        Opportunity.countDocuments({
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
          requiredSpecializations: specializationPattern,
        }),
      ]);

      if (priorCount >= DECLINING_OPPORTUNITY_MIN_PRIOR_COUNT && recentCount <= priorCount * DECLINING_OPPORTUNITY_DROP_RATIO) {
        const existingAlert = await Alert.findOne({
          entityType: 'PROGRAM',
          entityId: prog._id,
          category: 'OPPORTUNITY_TREND',
          resolved: false,
        });

        if (!existingAlert) {
          const alert = await Alert.create({
            ruleCode: 'RULE_OPPORTUNITY_TREND_DECLINING',
            severity: AlertSeverity.ORANGE,
            category: 'OPPORTUNITY_TREND',
            titleEn: `Declining Opportunities: ${prog.nameEn} saw a drop in postings`,
            titleAr: `تراجع الفرص: انخفاض عدد الفرص المتاحة لبرنامج ${prog.nameAr}`,
            descriptionEn: `Opportunities matching this program's specialization fell from ${priorCount} (previous 30 days) to ${recentCount} (last 30 days), a decline of ${Math.round((1 - recentCount / priorCount) * 100)}%.`,
            descriptionAr: `انخفض عدد الفرص المتوافقة مع تخصص هذا البرنامج من ${priorCount} إلى ${recentCount} خلال آخر 30 يومًا.`,
            entityType: 'PROGRAM',
            entityId: prog._id,
            entityName: prog.nameEn,
            collegeId: prog.collegeId,
          });
          generatedAlerts.push(alert);
        }
      }
    }

    // Rule [ORANGE]: Companies accepting trainees but with 0%/low hiring conversion.
    const lowConversionCompanies = await Company.find({
      studentsAccepted: { $gte: LOW_CONVERSION_MIN_ACCEPTED },
      trainingToEmploymentRate: { $lte: LOW_CONVERSION_MAX_RATE },
    }).lean();

    for (const comp of lowConversionCompanies) {
      const existingAlert = await Alert.findOne({
        entityType: 'COMPANY',
        entityId: comp._id,
        category: 'COMPANY_CONVERSION',
        severity: AlertSeverity.ORANGE,
        resolved: false,
      });

      if (!existingAlert) {
        const alert = await Alert.create({
          ruleCode: 'RULE_COMPANY_LOW_CONVERSION',
          severity: AlertSeverity.ORANGE,
          category: 'COMPANY_CONVERSION',
          titleEn: `Low Conversion: ${comp.nameEn} has accepted ${comp.studentsAccepted} trainees but converts only ${comp.trainingToEmploymentRate}% to hires`,
          titleAr: `تحويل منخفض: ${comp.nameAr} استقبل ${comp.studentsAccepted} متدربًا لكن نسبة التوظيف ${comp.trainingToEmploymentRate}% فقط`,
          descriptionEn: `This partner has accepted ${comp.studentsAccepted} trainees to date but converts only ${comp.trainingToEmploymentRate}% of them into full-time hires, well below the expected conversion benchmark. Recommend reviewing this partnership.`,
          descriptionAr: `استقبل هذا الشريك ${comp.studentsAccepted} متدربًا حتى الآن لكن نسبة التحويل إلى التوظيف لا تتجاوز ${comp.trainingToEmploymentRate}%. يوصى بمراجعة هذه الشراكة.`,
          entityType: 'COMPANY',
          entityId: comp._id,
          entityName: comp.nameEn,
          companyId: comp._id,
        });
        generatedAlerts.push(alert);
      }
    }

    // Rule 4 [GREEN]: High-conversion hiring partner insight
    const topCompanies = await Company.find({ trainingToEmploymentRate: { $gte: 75 } }).lean();
    for (const comp of topCompanies) {
      const existingAlert = await Alert.findOne({
        entityType: 'COMPANY',
        entityId: comp._id,
        severity: AlertSeverity.GREEN,
      });

      if (!existingAlert) {
        const alert = await Alert.create({
          ruleCode: 'INSIGHT_HIGH_CONVERSION_PARTNER',
          severity: AlertSeverity.GREEN,
          category: 'COMPANY_CONVERSION',
          titleEn: `High Performance: ${comp.nameEn} achieves ${comp.trainingToEmploymentRate}% intern-to-hire conversion`,
          titleAr: `شريك متميز: ${comp.nameAr} يحقق نسبة تحويل تدريب إلى توظيف قدرها ${comp.trainingToEmploymentRate}%`,
          descriptionEn: `Outstanding industrial partner converting ${comp.trainingToEmploymentRate}% of university interns into full-time employees. Recommended for expanded seat allocations.`,
          descriptionAr: `شريك صناعي متميز يوظف ${comp.trainingToEmploymentRate}% من المتدربين. يوصى بزيادة عدد المقاعد المخصصة له.`,
          entityType: 'COMPANY',
          entityId: comp._id,
          entityName: comp.nameEn,
        });
        generatedAlerts.push(alert);
      }
    }

    return {
      createdCount: generatedAlerts.length,
      alerts: generatedAlerts,
    };
  }

  async getActiveAlerts(filter: any = {}) {
    return Alert.find({ ...filter, resolved: false }).sort({ createdAt: -1 });
  }

  async resolveAlert(alertId: string, userId: string) {
    return Alert.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
      { new: true }
    );
  }
}

export const earlyWarningService = new EarlyWarningService();
