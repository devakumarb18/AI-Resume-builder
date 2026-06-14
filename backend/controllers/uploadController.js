const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { parseResumeFromText } = require("../services/openrouterService");

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    // 1. Read the uploaded PDF file
    const dataBuffer = fs.readFileSync(req.file.path);

    // 2. Extract text using pdf-parse v2 syntax
    const parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();
    const extractedText = pdfData.text;
    await parser.destroy();

    if (!extractedText || extractedText.trim().length < 50) {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Could not extract sufficient text from the PDF" });
    }

    // 3. Send text to OpenRouter to parse into JSON
    const parsedJSON = await parseResumeFromText(extractedText);

    // 4. Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // 5. Return the JSON to the frontend
    res.status(200).json({
      success: true,
      resumeData: parsedJSON
    });

  } catch (error) {
    console.log("UPLOAD CONTROLLER ERROR:", error);
    
    // Log exact error to file for debugging
    const fs = require('fs');
    const path = require('path');
    const errorDetails = error.stack || error.toString();
    try {
      fs.writeFileSync(path.join(__dirname, '../upload_error_trace.txt'), errorDetails);
    } catch(e) {}

    // Attempt to clean up the file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "PDF parsing or AI extraction failed"
    });
  }
};
