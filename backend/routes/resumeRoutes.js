const express = require('express');
const router = express.Router();
const {
  createResume,
  getResumes,
  getResume,
  updateResume,
  deleteResume,
  getPublicResume,
  duplicateResume,
  magicGenerateResume,
  chatWithAssistantController,
  transcribeAudioController
} = require('../controllers/resumeController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { downloadPdf } = require('../controllers/pdfController');
const { protect } = require('../middleware/authMiddleware');

// Public route for shared resumes (must be before protect middleware)
router.get('/share/:id', getPublicResume);

// Protect all other resume routes
router.use(protect);

router.post('/create', createResume);
router.post('/magic-generate', magicGenerateResume);
router.post('/chat', chatWithAssistantController);
router.post('/transcribe', upload.single('audio'), transcribeAudioController);
router.get('/all', getResumes);
router.get('/:id', getResume);
router.get('/:id/pdf', downloadPdf);
router.post('/duplicate/:id', duplicateResume);
router.put('/update/:id', updateResume);
router.delete('/delete/:id', deleteResume);

module.exports = router;
