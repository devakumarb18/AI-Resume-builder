const puppeteer = require('puppeteer');

/**
 * Generate a PDF from HTML content using Puppeteer
 * @param {string} htmlContent - The complete HTML string to render
 * @returns {Buffer} - The PDF buffer
 */
exports.generatePdfFromHtml = async (htmlContent) => {
  let browser = null;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Puppeteer PDF Generation Error:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
