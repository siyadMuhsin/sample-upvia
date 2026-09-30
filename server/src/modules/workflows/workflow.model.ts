import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowDocument extends Document {
  workflowType: 'OPPORTUNITY_APPROVAL' | 'TRAINING_PLACEMENT' | 'GRADUATION_CLEARANCE';
  entityId: string;
  currentState: string;
  history: Array<{
    fromState: string;
    toState: string;
    actionBy: mongoose.Types.ObjectId;
    actionRole: string;
    comment?: string;
    timestamp: Date;
  }>;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflowDocument>(
  {
    workflowType: {
      type: String,
      enum: ['OPPORTUNITY_APPROVAL', 'TRAINING_PLACEMENT', 'GRADUATION_CLEARANCE'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    currentState: { type: String, required: true },
    history: [
      {
        fromState: { type: String, required: true },
        toState: { type: String, required: true },
        actionBy: { type: Schema.Types.ObjectId, ref: 'User' },
        actionRole: { type: String, required: true },
        comment: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Workflow = mongoose.model<IWorkflowDocument>('Workflow', WorkflowSchema);
