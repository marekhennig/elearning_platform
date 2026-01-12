import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  explanation: { type: String }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  questions: [questionSchema],
  passingScore: { type: Number, default: 70 },
  timeLimit: { type: Number, default: 30 },
  maxAttempts: { type: Number, default: 3 }
});

export const Quiz = mongoose.model('Quiz', quizSchema);