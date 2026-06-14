const pdfService = require('../services/pdfService');
const Resume = require('../models/Resume');
// In a real app we'd probably use a template engine like Handlebars or EJS here.
// For simplicity, we will expect the frontend to either send the compiled HTML
// OR we construct a basic HTML layout based on the JSON data.

/**
 * @desc    Generate PDF from Resume ID
 * @route   GET /api/resume/:id/pdf
 * @access  Private
 */
exports.downloadPdf = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Authorization check
    if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Increment download analytics
    resume.downloads += 1;
    await resume.save();

    // Determine basic theme colors based on template
    let primaryColor = resume.themeColor || '#3b82f6';
    let fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    let headerStyle = "text-align: center; border-bottom: 2px solid " + primaryColor + "; padding-bottom: 10px;";
    
    if (resume.template === 'Minimal') {
      headerStyle = "text-align: left; border-bottom: 1px solid #eee; padding-bottom: 20px;";
    } else if (resume.template === 'Corporate') {
      fontFamily = "'Georgia', serif";
      headerStyle = "text-align: center; border-top: 4px solid " + primaryColor + "; border-bottom: 1px solid #ccc; padding: 20px 0;";
    } else if (resume.template === 'Creative') {
      headerStyle = "text-align: right; background-color: " + primaryColor + "; color: white; padding: 20px;";
    }

    // Build simple HTML representation of the resume for Puppeteer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${resume.personalInfo.fullName || 'Resume'}</title>
        <style>
          body { font-family: ${fontFamily}; color: #333; line-height: 1.5; margin: 0; padding: 0; }
          .header { ${headerStyle} margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
          .contact-info { font-size: 13px; margin-top: 8px; opacity: 0.9; }
          .section { margin-bottom: 25px; }
          .section h2 { font-size: 16px; text-transform: uppercase; color: ${primaryColor}; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
          .item { margin-bottom: 15px; }
          .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; }
          .item-sub { font-style: italic; font-size: 14px; margin-bottom: 5px; color: #555; }
          .item-desc { font-size: 13px; text-align: justify; }
          .skills { font-size: 14px; line-height: 1.8; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${resume.personalInfo.fullName || 'Your Name'}</h1>
          <div class="contact-info">
            ${resume.personalInfo.email ? resume.personalInfo.email + ' | ' : ''}
            ${resume.personalInfo.phone ? resume.personalInfo.phone + ' | ' : ''}
            ${resume.personalInfo.address ? resume.personalInfo.address : ''}
          </div>
        </div>

        ${resume.summary ? `
        <div class="section">
          <h2>Professional Summary</h2>
          <div class="item-desc">${resume.summary}</div>
        </div>` : ''}

        ${resume.experience.length > 0 ? `
        <div class="section">
          <h2>Experience</h2>
          ${resume.experience.map(exp => `
            <div class="item">
              <div class="item-header">
                <span>${exp.position}</span>
                <span>${exp.startDate} - ${exp.endDate}</span>
              </div>
              <div class="item-sub">${exp.company}</div>
              <div class="item-desc">${exp.description || ''}</div>
            </div>
          `).join('')}
        </div>` : ''}

        ${resume.education.length > 0 ? `
        <div class="section">
          <h2>Education</h2>
          ${resume.education.map(edu => `
            <div class="item">
              <div class="item-header">
                <span>${edu.degree}</span>
                <span>${edu.startDate} - ${edu.endDate}</span>
              </div>
              <div class="item-sub">${edu.institution}</div>
            </div>
          `).join('')}
        </div>` : ''}

        ${resume.skills.length > 0 ? `
        <div class="section">
          <h2>Skills</h2>
          <div class="skills">${resume.skills.join(', ')}</div>
        </div>` : ''}
      </body>
      </html>
    `;

    const pdfBuffer = await pdfService.generatePdfFromHtml(htmlContent);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resume.personalInfo.fullName || 'resume'}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
