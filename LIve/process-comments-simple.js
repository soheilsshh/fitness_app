#!/usr/bin/env node

/**
 * اسکریپت تبدیل کامنت‌های بازه‌بندی شده به لیست خطی با absoluteTime
 * 
 * این اسکریپت فایل timedComments.ts را مستقیماً import می‌کند و پردازش می‌کند
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تنظیمات قابل تغییر
const DELAY_OFFSET = 180; // 3 دقیقه (180 ثانیه) - می‌توانید تغییر دهید
const VIDEO_DRIFT = -50; // negative means comments should be delayed by 50 seconds more
const OUTPUT_FILE = path.join(__dirname, 'comments_processed.json');

/**
 * تبدیل زمان از فرمت "HH:MM:SS:MS" به ثانیه مطلق
 */
function timeStringToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }

  const parts = timeStr.split(':').map(Number);
  
  if (parts.length === 4) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 100;
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

/**
 * پردازش کامنت‌ها از یک ماژول TypeScript
 */
async function processCommentsFromModule() {
  console.log('📖 در حال import کردن فایل timedComments...');
  
  try {
    // Import کردن فایل TypeScript (نیاز به ts-node یا tsx)
    // اما بهتر است از یک روش ساده‌تر استفاده کنیم
    // بجای import، مستقیماً فایل رو بخونیم و parse کنیم
    
    const inputFile = path.join(__dirname, 'src/data/timedComments.ts');
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    
    // استفاده از dynamic import با tsx یا ts-node
    // اما برای سادگی، از eval با دقت استفاده می‌کنیم
    
    // استخراج آرایه با regex دقیق‌تر
    const arrayStart = fileContent.indexOf('export const timedComments');
    if (arrayStart === -1) {
      throw new Error('❌ timedComments پیدا نشد');
    }
    
    // پیدا کردن اولین [
    let bracketPos = fileContent.indexOf('[', arrayStart);
    if (bracketPos === -1) {
      throw new Error('❌ شروع آرایه پیدا نشد');
    }
    
    // پیدا کردن آخرین ] قبل از تابع‌های helper
    const funcStart = fileContent.indexOf('// Helper function', bracketPos);
    const searchEnd = funcStart !== -1 ? funcStart : fileContent.length;
    
    // پیدا کردن آخرین ] در این محدوده
    const lastBracket = fileContent.lastIndexOf(']', searchEnd);
    if (lastBracket === -1 || lastBracket <= bracketPos) {
      throw new Error('❌ پایان آرایه پیدا نشد');
    }
    
    // استخراج آرایه کامل
    const arrayContent = fileContent.substring(bracketPos, lastBracket + 1);
    
    console.log(`✅ آرایه استخراج شد (${arrayContent.length} کاراکتر)`);
    
    // تبدیل undefined به null
    let cleanCode = arrayContent.replace(/\bundefined\b/g, 'null');
    
    // Parse با eval
    const timedComments = eval(`(${cleanCode})`);
    
    if (!Array.isArray(timedComments) || timedComments.length === 0) {
      throw new Error(`❌ آرایه خالی یا نامعتبر است (length: ${timedComments?.length || 0})`);
    }
    
    console.log(`✅ ${timedComments.length} بازه زمانی پیدا شد\n`);
    
    return timedComments;
    
  } catch (error) {
    console.error('❌ خطا در import:', error.message);
    throw error;
  }
}

/**
 * تبدیل کامنت‌های بازه‌بندی شده به لیست خطی
 */
function processComments(timedComments) {
  console.log(`🔄 در حال پردازش کامنت‌ها...`);
  
  const processedComments = [];
  let totalComments = 0;
  let negativeShifted = 0;

  timedComments.forEach((timeRange, rangeIndex) => {
    const startSeconds = timeStringToSeconds(timeRange.start);
    const endSeconds = timeStringToSeconds(timeRange.end);
    
    if (rangeIndex < 3 || rangeIndex === timedComments.length - 1) {
      console.log(`📦 بازه ${rangeIndex + 1}/${timedComments.length}: ${timeRange.start} → ${timeRange.end} (${startSeconds.toFixed(2)}s)`);
    }
    
    if (!timeRange.comments || !Array.isArray(timeRange.comments)) {
      return;
    }

    timeRange.comments.forEach((comment) => {
      const timeOffset = comment.timeOffset !== undefined && comment.timeOffset !== null 
        ? Number(comment.timeOffset) 
        : 0;

      const baseAbsoluteTime = startSeconds + timeOffset;
      const finalTimeRaw = baseAbsoluteTime + DELAY_OFFSET + VIDEO_DRIFT;
      const finalTime = finalTimeRaw < 0 ? (negativeShifted++, 0) : finalTimeRaw;

      const roundedFinalTime = Math.round(finalTime * 100) / 100;

      processedComments.push({
        username: comment.username || '',
        message: comment.message || '',
        absoluteTime: roundedFinalTime,
        isAdmin: comment.isAdmin === true || false,
        replyToUsername: comment.replyToUsername || null,
        replyToMessage: comment.replyToMessage || null
      });
      
      totalComments++;
    });
  });

  processedComments.sort((a, b) => a.absoluteTime - b.absoluteTime);

  console.log(`\n✅ پردازش کامل شد:`);
  console.log(`   📊 مجموع کامنت‌ها: ${totalComments}`);
  console.log(`   ↘️  کامنت‌هایی که پس از درفت منفی به 0 رسیدند: ${negativeShifted}`);
  console.log(`   ⏱️  DELAY_OFFSET: +${DELAY_OFFSET} ثانیه (${DELAY_OFFSET / 60} دقیقه)`);
  console.log(`   🎞️  VIDEO_DRIFT: ${VIDEO_DRIFT} ثانیه`);
  console.log(`   ⏰ بازه زمانی نهایی: ${processedComments[0]?.absoluteTime || 0}s تا ${processedComments[processedComments.length - 1]?.absoluteTime || 0}s`);

  return processedComments;
}

/**
 * ذخیره خروجی
 */
function saveOutput(processedComments) {
  console.log(`\n💾 در حال ذخیره فایل: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedComments, null, 2), 'utf-8');
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  console.log(`✅ فایل ذخیره شد (${fileSize} KB)`);
}

/**
 * Main
 */
async function main() {
  console.log('🚀 شروع پردازش کامنت‌ها...\n');
  console.log(`⚙️  تنظیمات:`);
  console.log(`   📤 فایل خروجی: ${OUTPUT_FILE}`);
  console.log(`   ⏱️  DELAY_OFFSET: ${DELAY_OFFSET} ثانیه (${DELAY_OFFSET / 60} دقیقه)`);
  console.log(`   🎞️  VIDEO_DRIFT: ${VIDEO_DRIFT} ثانیه\n`);

  try {
    const timedComments = await processCommentsFromModule();
    const processedComments = processComments(timedComments);
    saveOutput(processedComments);
    
    console.log('\n✨ پردازش موفقیت‌آمیز بود!');
  } catch (error) {
    console.error('\n❌ خطا:', error.message);
    process.exit(1);
  }
}

main();
