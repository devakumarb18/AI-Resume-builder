const { generateSummary } = require("../services/openrouterService");
const fs = require('fs');
const path = require('path');

exports.improveText = async (req, res) => {

  try {

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required"
      });
    }

    const improvedText = await generateSummary(text);

    res.status(200).json({
      success: true,
      improvedText,
    });

  } catch (error) {

    // Log to file for deep debugging
    const errorDetails = error.stack || error.toString();
    fs.writeFileSync(path.join(__dirname, '../ai_error_trace.txt'), errorDetails);
    
    console.log("AI CONTROLLER ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: `AI generation failed: ${error.message}`,
    });
  }
};

exports.getAtsScore = async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ success: false, message: "Resume data is required" });
    
    const { analyzeAtsScore } = require("../services/openrouterService");
    const result = await analyzeAtsScore(resumeData);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("ATS CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `ATS analysis failed: ${error.message}` });
  }
};

exports.generateCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobTitle } = req.body;
    if (!resumeData) return res.status(400).json({ success: false, message: "Resume data is required" });
    
    const { generateCoverLetter } = require("../services/openrouterService");
    const result = await generateCoverLetter(resumeData, jobTitle || 'Professional Position');
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("COVER LETTER CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `Cover letter generation failed: ${error.message}` });
  }
};

exports.generateLinkedInBio = async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ success: false, message: "Resume data is required" });
    
    const { generateLinkedInBio } = require("../services/openrouterService");
    const result = await generateLinkedInBio(resumeData);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("LINKEDIN CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `LinkedIn bio generation failed: ${error.message}` });
  }
};

exports.analyzeJobMatch = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) return res.status(400).json({ success: false, message: "Resume data and Job Description are required" });
    
    const { analyzeJobMatch } = require("../services/openrouterService");
    const result = await analyzeJobMatch(resumeData, jobDescription);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("JOB MATCH CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `Job Match analysis failed: ${error.message}` });
  }
};

exports.autoTailorResume = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData || !jobDescription) return res.status(400).json({ success: false, message: "Resume data and Job Description are required" });
    
    const { autoTailorResume } = require("../services/openrouterService");
    const result = await autoTailorResume(resumeData, jobDescription);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("TAILOR CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `Resume tailoring failed: ${error.message}` });
  }
};

exports.simulateRecruiter = async (req, res) => {
  try {
    const { resumeData, recruiterMode } = req.body;
    if (!resumeData) return res.status(400).json({ success: false, message: "Resume data is required" });
    
    const { simulateRecruiter } = require("../services/openrouterService");
    const result = await simulateRecruiter(resumeData, recruiterMode || "FAANG");
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("RECRUITER CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `Recruiter simulation failed: ${error.message}` });
  }
};

exports.autoFixResume = async (req, res) => {
  try {
    const { resumeData, recruiterCritique } = req.body;
    if (!resumeData || !recruiterCritique) return res.status(400).json({ success: false, message: "Resume data and critique are required" });
    
    const { autoFixResume } = require("../services/openrouterService");
    const result = await autoFixResume(resumeData, recruiterCritique);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log("AUTO FIX CONTROLLER ERROR:", error.message);
    res.status(500).json({ success: false, message: `Auto fix failed: ${error.message}` });
  }
};
