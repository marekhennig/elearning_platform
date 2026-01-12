import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }
});

export const Course = mongoose.model('Course', courseSchema);