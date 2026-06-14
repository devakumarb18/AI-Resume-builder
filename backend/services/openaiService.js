const fs = require('fs');

const transcribeAudio = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('file', fileBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Transcription failed');
    }
    
    return data.text;
  } catch (error) {
    console.error("WHISPER API ERROR:", error.message);
    throw new Error("Audio transcription failed");
  }
};

module.exports = {
  transcribeAudio
};
