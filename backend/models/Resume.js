const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  startDate: { type: String },
  endDate: { type: String },
  description: { type: String }
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  position: { type: String, default: '' },
  startDate: { type: String },
  endDate: { type: String },
  description: { type: String }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  link: { type: String },
  description: { type: String }
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String },
  date: { type: String }
});

const languageSchema = new mongoose.Schema({
  language: { type: String, default: '' },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Native'] }
});

const customSectionSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  content: { type: String, default: '' }
});

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for faster queries
  },
  title: {
    type: String,
    required: [true, 'Please add a resume title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  personalInfo: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    github: { type: String, default: '' }, // Added for developer portfolio
    twitter: { type: String, default: '' }
  },
  summary: {
    type: String,
    default: ''
  },
  skills: [{ type: String }],
  education: [educationSchema],
  experience: [experienceSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  languages: [languageSchema],
  customSections: [customSectionSchema], // Dynamic sections
  achievements: [{ type: String }],
  hobbies: [{ type: String }],
  interests: [{ type: String }],
  activities: [{ type: String }],
  showIcons: { type: Boolean, default: true },
  pageMode: { type: String, enum: ['one-page', 'two-page'], default: 'one-page' },
  template: {
    type: String,
    enum: ['Modern', 'Minimal', 'ATS Friendly', 'Creative', 'Corporate', 'Developer Portfolio'],
    default: 'Modern'
  },
  themeColor: {
    type: String,
    default: '#3b82f6' // Default blue
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  atsScore: {
    type: Number,
    default: 0
  },
  sectionOrder: [{
    type: String
  }]
}, { timestamps: true });

// Add text index for searchability
resumeSchema.index({ title: 'text', 'personalInfo.fullName': 'text' });

module.exports = mongoose.model('Resume', resumeSchema);
