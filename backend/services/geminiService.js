const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generateSummary = async (text) => {
  try {

    const prompt = `
Improve this resume summary professionally:

${text}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return response.text();

  } catch (error) {

    // Log to file for deep debugging
    const fs = require('fs');
    const path = require('path');
    const errorDetails = error.stack || error.toString();
    fs.writeFileSync(path.join(__dirname, '../ai_error_trace.txt'), errorDetails);

    console.log("GEMINI ERROR:", error.message);

    throw error;
  }
};

module.exports = {
  generateSummary,
};
