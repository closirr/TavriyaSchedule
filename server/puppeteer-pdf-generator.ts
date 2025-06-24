import puppeteer from 'puppeteer';
import { Lesson } from '@shared/schema';
import { generateScheduleHTML } from './html-pdf-generator';

export async function generateSchedulePuppeteerPDF(lessons: Lesson[], title: string = "Розклад занять"): Promise<Buffer> {
  let browser;
  
  try {
    // Launch puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Generate HTML content
    const htmlContent = generateScheduleHTML(lessons, title);
    
    // Set content and generate PDF
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Generate PDF with proper settings for Ukrainian text
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    throw new Error('Помилка генерації PDF з HTML');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function generateWeeklySchedulePuppeteerPDF(lessons: Lesson[]): Promise<Buffer> {
  return generateSchedulePuppeteerPDF(lessons, "Тижневий розклад занять");
}

export async function generateGroupSchedulePuppeteerPDF(lessons: Lesson[], group: string): Promise<Buffer> {
  const groupLessons = lessons.filter(l => l.group === group);
  return generateSchedulePuppeteerPDF(groupLessons, `Розклад занять для групи ${group}`);
}