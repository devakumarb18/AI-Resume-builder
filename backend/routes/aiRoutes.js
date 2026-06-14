const express = require("express");
const router = express.Router();

const { improveText, getAtsScore, generateCoverLetter, generateLinkedInBio, analyzeJobMatch, autoTailorResume, simulateRecruiter, autoFixResume } = require("../controllers/aiController");

router.post("/improve", improveText);
router.post("/ats-score", getAtsScore);
router.post("/cover-letter", generateCoverLetter);
router.post("/linkedin-bio", generateLinkedInBio);
router.post("/job-match", analyzeJobMatch);
router.post("/tailor-resume", autoTailorResume);
router.post("/simulate-recruiter", simulateRecruiter);
router.post("/auto-fix-roast", autoFixResume);

module.exports = router;
