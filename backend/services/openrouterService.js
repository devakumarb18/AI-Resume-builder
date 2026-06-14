const axios = require("axios");

const generateSummary = async (text) => {

  try {

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",

        messages: [
          {
            role: "user",
            content: `
Improve this resume summary professionally:

${text}
`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {

    console.log("OPENROUTER ERROR:", error.response?.data || error.message);

    throw new Error("AI generation failed");
  }
};

const parseResumeFromText = async (text) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert ATS resume parser. Extract the following raw text into a highly structured JSON object matching exactly this schema:
{
  "title": "Imported Resume",
  "personalInfo": { "fullName": "", "email": "", "phone": "", "address": "", "linkedIn": "", "portfolio": "", "github": "", "twitter": "" },
  "summary": "",
  "skills": ["skill1", "skill2"],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "", "description": "" }],
  "experience": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "" }],
  "projects": [{ "title": "", "link": "", "description": "" }],
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "achievements": ["achievement1"],
  "hobbies": ["hobby1"],
  "languages": [{"language": "English", "proficiency": "Native"}],
  "interests": ["interest1"],
  "activities": ["activity1"]
}
Return ONLY valid JSON, nothing else. No markdown wrappers.`
          },
          {
            role: "user",
            content: text
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const jsonString = response.data.choices[0].message.content.trim();
    // In case the AI returns markdown wrappers despite instructions
    const cleanJson = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.log("OPENROUTER PARSE ERROR:", errorMsg);
    
    // Log exact error to file for debugging
    const fs = require('fs');
    const path = require('path');
    try {
      fs.writeFileSync(path.join(__dirname, '../openrouter_error_trace.txt'), JSON.stringify(errorMsg, null, 2));
    } catch(e) {}

    throw new Error("AI parsing failed");
  }
};

const analyzeAtsScore = async (resumeData) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert Applicant Tracking System (ATS). Analyze this resume and return a strict JSON object with these exact keys. For the metrics, score them from 0 to 100:
{
  "score": 85,
  "metrics": {
    "technicalDepth": 80,
    "leadership": 60,
    "impact": 70,
    "projectQuality": 85
  },
  "resumeStrength": "Brief assessment",
  "keywordOptimization": "Feedback on keywords",
  "missingSkills": "Any suggested missing skills"
}
Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: JSON.stringify(resumeData)
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const jsonString = response.data.choices[0].message.content.trim();
    const cleanJson = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("ATS ERROR:", error.response?.data || error.message);
    throw new Error("ATS analysis failed");
  }
};

const generateCoverLetter = async (resumeData, jobTitle) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert career coach writing professional cover letters based on user resume data."
          },
          {
            role: "user",
            content: `Write a professional cover letter for the position of "${jobTitle}" using this resume data:\n\n${JSON.stringify(resumeData)}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.log("COVER LETTER ERROR:", error.response?.data || error.message);
    throw new Error("Cover letter generation failed");
  }
};

const generateLinkedInBio = async (resumeData) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert LinkedIn profile optimizer."
          },
          {
            role: "user",
            content: `Write a compelling and professional LinkedIn "About" bio based on this resume data:\n\n${JSON.stringify(resumeData)}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.log("LINKEDIN BIO ERROR:", error.response?.data || error.message);
    throw new Error("LinkedIn bio generation failed");
  }
};

const analyzeJobMatch = async (resumeData, jobDescription) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert ATS and technical recruiter. Analyze the resume against the job description and return a strict JSON object:
{
  "matchScore": 82,
  "missingKeywords": ["Keyword 1", "Keyword 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `RESUME:\n${JSON.stringify(resumeData)}\n\nJOB DESCRIPTION:\n${jobDescription}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const jsonString = response.data.choices[0].message.content.trim();
    const cleanJson = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("JOB MATCH ERROR:", error.response?.data || error.message);
    throw new Error("Job Match analysis failed");
  }
};

const autoTailorResume = async (resumeData, jobDescription) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert Resume Writer. Your task is to rewrite the resume summary, skills, and experience descriptions to better match the provided job description.
Return a strict JSON object containing the updated fields. You should ONLY return the fields you are updating.
Schema:
{
  "summary": "Rewritten summary",
  "skills": ["Updated skill list..."],
  "experience": [
    { "id": "original id", "description": "Rewritten description emphasizing relevant keywords" }
  ]
}
Maintain truthfulness but highlight relevant aspects. Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `RESUME:\n${JSON.stringify({summary: resumeData.personalInfo.summary, skills: resumeData.skills, experience: resumeData.experience})}\n\nJOB DESCRIPTION:\n${jobDescription}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const jsonString = response.data.choices[0].message.content.trim();
    const cleanJson = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("TAILOR ERROR:", error.response?.data || error.message);
    throw new Error("Resume tailoring failed");
  }
};

const simulateRecruiter = async (resumeData, recruiterMode) => {
  try {
    let systemPrompt = "";
    if (recruiterMode === "🔥 FAANG Reviewer") {
      systemPrompt = "You are a brutal, impatient FAANG engineering manager who sees 1000 resumes a day. Give a harsh, blunt, but highly actionable critique of this resume in bullet points. Be ruthless about missing metrics and fluff. Start with a personality-filled opening line (e.g. 'Strong technical base. Weak storytelling.').";
    } else if (recruiterMode === "💀 Brutal CTO") {
      systemPrompt = "You are a fast-moving, no-nonsense Startup CTO. You care about shipping, real-world impact, and specific tech stack skills. Tell them why you wouldn't hire them. Be direct and edgy (e.g. 'This resume tells me what you touched, not what you achieved.').";
    } else if (recruiterMode === "😎 Startup Founder") {
      systemPrompt = "You are an optimistic but skeptical Startup Founder. You look for hustle, energy, and execution. Critique the resume based on real-world impact (e.g. 'Good energy. Needs proof of execution.').";
    } else if (recruiterMode === "🤖 ATS Robot") {
      systemPrompt = "You are an emotionless Applicant Tracking System bot. You only care about keyword density, exact matches, and parsable formats. Give robotic, system-like feedback (e.g. 'Keyword density below threshold. Rejecting.').";
    } else {
      systemPrompt = "You are a Senior Engineering Manager. You are fair but expect high quality, clear architecture, and mentoring skills. Give balanced but strict feedback.";
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${systemPrompt} Return a strict JSON object with this exact schema:
{
  "openingLine": "Your catchy personality opener",
  "critiques": ["Critique 1", "Critique 2", "Critique 3"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `RESUME:\n${JSON.stringify(resumeData)}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const jsonString = response.data.choices[0].message.content.trim();
    const cleanJson = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("RECRUITER ERROR:", error.response?.data || error.message);
    throw new Error("Recruiter simulation failed");
  }
};

const autoFixResume = async (resumeData, recruiterCritique) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an elite Resume Writer and Career Coach. Your job is to automatically fix the user's resume based on the harsh critique provided.
Focus on rewriting the summary and experience bullet points to be highly impactful, metrics-driven, and perfectly tailored. 
Return ONLY a valid JSON object matching this partial schema containing the improved fields:
{
  "summary": "The newly rewritten impactful summary",
  "experience": [
    {
      "id": "original-experience-id",
      "description": "The newly rewritten impactful bullet points. Use newlines for multiple points. Quantify everything you can."
    }
  ]
}
Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `ORIGINAL RESUME:\n${JSON.stringify(resumeData)}\n\nRECRUITER CRITIQUE:\n${JSON.stringify(recruiterCritique)}\n\nPlease fix the resume according to the critique.`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const jsonString = response.data.choices[0].message.content.trim();
    const cleanJson = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("AUTO FIX ERROR:", error.response?.data || error.message);
    throw new Error("Auto fix failed");
  }
};

const generateResumeFromNotes = async (rawNotes) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an expert Resume Builder AI. A user will give you messy notes, an old resume, or a LinkedIn bio. 
Your job is to structure this perfectly into a highly professional resume matching this exact JSON schema.
Write compelling, action-oriented descriptions and ATS-optimized summaries based on their input.
Fix grammar and spelling. If information is missing (like dates), leave it blank but structure it anyway.

Schema Requirements:
{
  "title": "A good file title (e.g. 'Software Engineer Resume')",
  "personalInfo": {
    "fullName": "Name",
    "email": "",
    "phone": "",
    "address": "",
    "linkedIn": "",
    "github": "",
    "summary": "Write a strong, professional 3-sentence summary in HTML format (e.g. <p>...</p>)."
  },
  "experience": [
    {
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "location": "",
      "description": "Write ATS-friendly achievements in HTML bullet points <ul><li>...</li></ul>"
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "title": "",
      "link": "",
      "description": "HTML bullet points"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "achievements": [],
  "languages": [{"language": "", "proficiency": "Native"}],
  "activities": []
}

Return ONLY valid JSON. No markdown wrappers.`
          },
          {
            role: "user",
            content: `Here is the user's raw input:\n\n${rawNotes}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const responseText = response.data.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleanJson = jsonMatch ? jsonMatch[1].trim() : responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    if (!cleanJson.startsWith('{') && !cleanJson.startsWith('[')) {
      const startIndex = cleanJson.indexOf('{');
      const endIndex = cleanJson.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = cleanJson.substring(startIndex, endIndex + 1);
      }
    }
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("MAGIC IMPORT ERROR:", error.response?.data || error.message);
    throw new Error("Magic Import generation failed");
  }
};

const chatWithAssistant = async (resumeData, chatHistory, userMessage) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an expert AI Career Coach and Resume Builder. You are chatting with a user to help them build their resume.
Your personality: "Soft Interrogator". You proactively guide the user, ask them one clear question at a time to improve their resume, and you are extremely encouraging.

You will receive the user's current resume state (JSON) and their latest message.
Your job is to:
1. Reply naturally to the user (e.g. asking a follow-up question, or confirming you added something).
2. IF the user asked you to add/modify something, provide a JSON "patch" object containing ONLY the arrays or objects you want to update in the resume state.

Example Output Format:
{
  "reply": "I've added the React ecommerce project to your resume! Did you happen to deploy it anywhere?",
  "patch": {
    "projects": [
      {
        "id": "new-id",
        "title": "Ecommerce App",
        "description": "<ul><li>Developed a full-stack ecommerce application using React.</li></ul>",
        "link": ""
      }
    ]
  }
}

If no modifications to the resume are needed yet, leave "patch" as an empty object: {}.
Always return valid JSON matching this exact structure.`
          },
          ...chatHistory.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
          })),
          {
            role: "user",
            content: `CURRENT RESUME STATE:\n${JSON.stringify(resumeData)}\n\nUSER MESSAGE:\n${userMessage}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const responseText = response.data.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleanJson = jsonMatch ? jsonMatch[1].trim() : responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    if (!cleanJson.startsWith('{') && !cleanJson.startsWith('[')) {
      const startIndex = cleanJson.indexOf('{');
      const endIndex = cleanJson.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = cleanJson.substring(startIndex, endIndex + 1);
      }
    }
    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.log("Failed to parse AI JSON, falling back to raw text. Text was:", responseText);
      return {
        reply: responseText,
        patch: {}
      };
    }
  } catch (error) {
    console.log("CHAT ASSISTANT ERROR:", error.response?.data || error.message);
    throw new Error("Chat assistant failed");
  }
};

module.exports = {
  generateSummary,
  parseResumeFromText,
  analyzeAtsScore,
  generateCoverLetter,
  generateLinkedInBio,
  analyzeJobMatch,
  autoTailorResume,
  simulateRecruiter,
  autoFixResume,
  generateResumeFromNotes,
  chatWithAssistant
};
