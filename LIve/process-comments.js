#!/usr/bin/env node

/**
 * اسکریپت تبدیل کامنت‌های بازه‌بندی شده به لیست خطی با absoluteTime
 * 
 * این اسکریپت:
 * 1. فایل timedComments.ts را می‌خواند
 * 2. تمام بازه‌های زمانی را به ثانیه مطلق تبدیل می‌کند
 * 3. برای هر کامنت absoluteTime محاسبه می‌کند (startSeconds + timeOffset)
 * 4. DELAY_OFFSET (180 ثانیه) را اضافه می‌کند
 * 5. خروجی JSON ساده تولید می‌کند
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// تنظیمات قابل تغییر
const DELAY_OFFSET = 180; // 3 دقیقه (180 ثانیه) - می‌توانید تغییر دهید
const INPUT_FILE = path.join(__dirname, 'src/data/timedComments.ts');
const OUTPUT_FILE = path.join(__dirname, 'comments_processed.json');

/**
 * تبدیل زمان از فرمت "HH:MM:SS:MS" به ثانیه مطلق
 * @param {string} timeStr - زمان به فرمت "HH:MM:SS:MS" یا "HH:MM:SS"
 * @returns {number} - زمان به ثانیه
 */
function timeStringToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    console.warn(`⚠️  Invalid time string: ${timeStr}`);
    return 0;
  }

  const parts = timeStr.split(':').map(Number);
  
  if (parts.length === 4) {
    // Format: HH:MM:SS:MS
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 100;
  } else if (parts.length === 3) {
    // Format: HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // Format: MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  console.warn(`⚠️  Unknown time format: ${timeStr}`);
  return 0;
}

/**
 * خواندن و پارس کردن فایل timedComments.ts
 * 
 * این تابع فایل TypeScript را می‌خواند و آرایه timedComments را استخراج می‌کند
 */
function parseTimedCommentsFile() {
  console.log(`📖 در حال خواندن فایل: ${INPUT_FILE}`);
  
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`❌ فایل پیدا نشد: ${INPUT_FILE}`);
  }

  const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');
  
  // پیدا کردن موقعیت شروع آرایه
  const exportIndex = fileContent.indexOf('export const timedComments');
  if (exportIndex === -1) {
    throw new Error('❌ نتوانستیم export const timedComments را در فایل پیدا کنیم');
  }

  // پیدا کردن اولین [ بعد از export const timedComments
  let startIndex = fileContent.indexOf('[', exportIndex);
  if (startIndex === -1) {
    throw new Error('❌ نتوانستیم شروع آرایه را پیدا کنیم');
  }

  // پیدا کردن پایان آرایه با شمارش براکت‌ها
  let bracketCount = 0;
  let endIndex = startIndex;
  let inString = false;
  let stringChar = null;

  for (let i = startIndex; i < fileContent.length; i++) {
    const char = fileContent[i];
    const prevChar = i > 0 ? fileContent[i - 1] : '';

    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }

    if (!inString) {
      if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }

  if (bracketCount !== 0) {
    throw new Error('❌ نتوانستیم پایان آرایه را پیدا کنیم (براکت‌ها مطابقت ندارند)');
  }

  // استخراج آرایه
  const arrayString = fileContent.substring(startIndex, endIndex + 1);
  
  // Debug: نمایش اولین 200 کاراکتر از آرایه استخراج شده
  console.log(`🔍 طول آرایه استخراج شده: ${arrayString.length} کاراکتر`);
  console.log(`🔍 اولین 200 کاراکتر: ${arrayString.substring(0, 200)}...`);
  
  return parseArrayString(arrayString);
}

/**
 * پارس کردن رشته آرایه به object JavaScript
 * این تابع با استفاده از eval آرایه را parse می‌کند
 * ⚠️ استفاده از eval فقط برای فایل‌های محلی و مورد اعتماد
 */
function parseArrayString(arrayString) {
  try {
    // تبدیل undefined به null برای JSON compatibility
    let cleanCode = arrayString.replace(/undefined/g, 'null');
    
    // حذف کامنت‌های خطی (باید قبل از تبدیل undefined انجام شود)
    cleanCode = cleanCode.replace(/\/\/[^\n]*/g, '');
    
    // حذف کامنت‌های بلوکی
    cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // حذف export const timedComments و باقی کد قبل از آرایه
    // فقط آرایه را نگه داریم
    if (!cleanCode.trim().startsWith('[')) {
      // اگر با [ شروع نمی‌شود، پیدا کردن اولین [
      const firstBracket = cleanCode.indexOf('[');
      if (firstBracket !== -1) {
        cleanCode = cleanCode.substring(firstBracket);
      }
    }
    
    // حذف کد بعد از آرایه (مثل تابع‌های helper)
    const lastBracket = cleanCode.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleanCode = cleanCode.substring(0, lastBracket + 1);
    }
    
    // eval کردن آرایه (با احتیاط - فقط برای فایل‌های محلی)
    const timedComments = eval(`(${cleanCode})`);
    
    if (!Array.isArray(timedComments)) {
      throw new Error('❌ نتیجه parse شده آرایه نیست');
    }
    
    console.log(`✅ ${timedComments.length} بازه زمانی پیدا شد`);
    return timedComments;
  } catch (error) {
    console.error('❌ خطا در پارس کردن آرایه:', error.message);
    console.error('💡 راه حل: مطمئن شوید فایل timedComments.ts فرمت صحیح دارد');
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
  let skippedComments = 0;

  timedComments.forEach((timeRange, rangeIndex) => {
    const startSeconds = timeStringToSeconds(timeRange.start);
    const endSeconds = timeStringToSeconds(timeRange.end);
    
    console.log(`\n📦 بازه ${rangeIndex + 1}: ${timeRange.start} → ${timeRange.end} (${startSeconds.toFixed(2)}s - ${endSeconds.toFixed(2)}s)`);
    
    if (!timeRange.comments || !Array.isArray(timeRange.comments)) {
      console.warn(`⚠️  بازه ${rangeIndex + 1} کامنت ندارد`);
      return;
    }

    timeRange.comments.forEach((comment, commentIndex) => {
      // تبدیل timeOffset به عدد (اگر undefined یا null بود، 0 می‌شود)
      const timeOffset = comment.timeOffset !== undefined && comment.timeOffset !== null 
        ? Number(comment.timeOffset) 
        : 0;

      // محاسبه absoluteTime اولیه
      let absoluteTime = startSeconds + timeOffset;

      // اضافه کردن DELAY_OFFSET (3 دقیقه = 180 ثانیه)
      absoluteTime += DELAY_OFFSET;

      // اگر زمان منفی شد، صفر کن
      if (absoluteTime < 0) {
        console.warn(`⚠️  کامنت در بازه ${rangeIndex + 1} زمان منفی دارد، صفر شد: ${comment.message.substring(0, 30)}...`);
        absoluteTime = 0;
        skippedComments++;
      }

      // ساخت کامنت پردازش شده
      const processedComment = {
        username: comment.username || '',
        message: comment.message || '',
        absoluteTime: Math.round(absoluteTime * 100) / 100, // گرد کردن به 2 رقم اعشار
        isAdmin: comment.isAdmin === true || false,
        replyToUsername: comment.replyToUsername || null,
        replyToMessage: comment.replyToMessage || null
      };

      processedComments.push(processedComment);
      totalComments++;
    });
  });

  // مرتب‌سازی بر اساس absoluteTime
  processedComments.sort((a, b) => a.absoluteTime - b.absoluteTime);

  console.log(`\n✅ پردازش کامل شد:`);
  console.log(`   📊 مجموع کامنت‌ها: ${totalComments}`);
  console.log(`   ⏭️  کامنت‌های رد شده: ${skippedComments}`);
  console.log(`   ⏰ بازه زمانی: ${processedComments[0]?.absoluteTime || 0}s تا ${processedComments[processedComments.length - 1]?.absoluteTime || 0}s`);
  console.log(`   ⏱️  DELAY_OFFSET اعمال شده: +${DELAY_OFFSET} ثانیه (${DELAY_OFFSET / 60} دقیقه)`);

  return processedComments;
}

/**
 * ذخیره خروجی به فایل JSON
 */
function saveOutput(processedComments) {
  console.log(`\n💾 در حال ذخیره فایل: ${OUTPUT_FILE}`);
  
  const output = JSON.stringify(processedComments, null, 2);
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  console.log(`✅ فایل با موفقیت ذخیره شد (${fileSize} KB)`);
  console.log(`📁 مسیر فایل: ${OUTPUT_FILE}`);
}

/**
 * تابع اصلی
 */
function main() {
  console.log('🚀 شروع پردازش کامنت‌ها...\n');
  console.log(`⚙️  تنظیمات:`);
  console.log(`   📝 فایل ورودی: ${INPUT_FILE}`);
  console.log(`   📤 فایل خروجی: ${OUTPUT_FILE}`);
  console.log(`   ⏱️  DELAY_OFFSET: ${DELAY_OFFSET} ثانیه (${DELAY_OFFSET / 60} دقیقه)\n`);

  try {
    // 1. خواندن فایل
    const timedComments = parseTimedCommentsFile();

    // 2. پردازش کامنت‌ها
    const processedComments = processComments(timedComments);

    // 3. ذخیره خروجی
    saveOutput(processedComments);

    console.log('\n✨ پردازش با موفقیت به پایان رسید!');
    console.log('\n📌 نکته:');
    console.log('   حالا می‌توانید از فایل comments_processed.json استفاده کنید');
    console.log('   و در پخش‌کننده چت فقط بررسی کنید:');
    console.log('   if (videoAbsoluteTime >= comment.absoluteTime) render()');
    
  } catch (error) {
    console.error('\n❌ خطا در پردازش:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// اجرای اسکریپت
main();

