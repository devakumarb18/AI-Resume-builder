const Resume = require('../models/Resume');
const { generateResumeFromNotes, chatWithAssistant } = require('../services/openrouterService');

/**
 * @desc    Create new resume
 * @route   POST /api/resume/create
 * @access  Private
 */
exports.createResume = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.userId = req.user.id;

    const resume = await Resume.create(req.body);

    res.status(201).json({
      success: true,
      data: resume
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all resumes for logged in user
 * @route   GET /api/resume/all
 * @access  Private
 */
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single resume
 * @route   GET /api/resume/:id
 * @access  Private
 */
exports.getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Make sure user owns resume
    if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to access this resume' });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update resume
 * @route   PUT /api/resume/update/:id
 * @access  Private
 */
exports.updateResume = async (req, res, next) => {
  try {
    let resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Make sure user owns resume
    if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this resume' });
    }

    resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete resume
 * @route   DELETE /api/resume/delete/:id
 * @access  Private
 */
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Make sure user owns resume
    if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this resume' });
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get public shared resume
 * @route   GET /api/resume/share/:id
 * @access  Public
 */
exports.getPublicResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (!resume.isPublic) {
      return res.status(403).json({ success: false, error: 'This resume is not public' });
    }

    // Increment views
    resume.views += 1;
    await resume.save();

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Duplicate an existing resume
 * @route   POST /api/resume/duplicate/:id
 * @access  Private
 */
exports.duplicateResume = async (req, res, next) => {
  try {
    const originalResume = await Resume.findById(req.params.id);

    if (!originalResume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (originalResume.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Copy data but change title and reset analytics
    const newResumeData = originalResume.toObject();
    delete newResumeData._id;
    delete newResumeData.createdAt;
    delete newResumeData.updatedAt;
    newResumeData.title = `${newResumeData.title} (Copy)`;
    newResumeData.views = 0;
    newResumeData.downloads = 0;
    newResumeData.isPublic = false;

    const duplicate = await Resume.create(newResumeData);

    res.status(201).json({
      success: true,
      data: duplicate
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Generate a completely new resume from messy notes using AI
 * @route   POST /api/resume/magic-generate
 * @access  Private
 */
exports.magicGenerateResume = async (req, res, next) => {
  try {
    const { rawNotes } = req.body;
    if (!rawNotes || rawNotes.trim() === '') {
      return res.status(400).json({ success: false, error: 'Raw notes are required' });
    }

    // 1. Call AI to structure the notes into our JSON schema
    const generatedData = await generateResumeFromNotes(rawNotes);

    // 2. Add required fields and user ID
    generatedData.userId = req.user.id;
    if (!generatedData.title) {
      generatedData.title = 'AI Generated Resume';
    }

    // 3. Save to database as a new resume
    const newResume = await Resume.create(generatedData);

    res.status(201).json({
      success: true,
      data: newResume
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Chat with AI Assistant to edit resume
 * @route   POST /api/resume/chat
 * @access  Private
 */
exports.chatWithAssistantController = async (req, res, next) => {
  try {
    const { resumeData, chatHistory, userMessage } = req.body;
    
    if (!resumeData || !userMessage) {
      return res.status(400).json({ success: false, error: 'resumeData and userMessage are required' });
    }

    const aiResponse = await chatWithAssistant(resumeData, chatHistory || [], userMessage);

    res.status(200).json({
      success: true,
      data: aiResponse
    });
  } catch (err) {
    next(err);
  }
};

const { transcribeAudio } = require('../services/openaiService');
const fs = require('fs');

/**
 * @desc    Transcribe audio using Whisper API
 * @route   POST /api/resume/transcribe
 * @access  Private
 */
exports.transcribeAudioController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided' });
    }

    const text = await transcribeAudio(req.file.path);
    
    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      text: text
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};
