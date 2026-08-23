const fs = require('fs');

// Read the file
const filePath = './src/data/timedComments.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Parse time string to seconds
function parseTimeToSeconds(timeStr) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 4) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 100;
  } else if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + (parts[2] || 0) / 100;
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Find all time ranges and their comments
const timeRangeRegex = /{\s*start:\s*"([^"]+)",\s*end:\s*"([^"]+)",\s*comments:\s*\[([\s\S]*?)\]\s*}/g;

let match;
const ranges = [];

while ((match = timeRangeRegex.exec(content)) !== null) {
  const start = match[1];
  const end = match[2];
  const commentsSection = match[3];
  
  // Count comments
  const commentMatches = commentsSection.match(/{[^}]+timeOffset:\s*[^,}]+/g);
  const commentCount = commentMatches ? commentMatches.length : 0;
  
  ranges.push({
    fullMatch: match[0],
    start,
    end,
    commentsSection,
    commentCount,
    startIndex: match.index,
    endIndex: match.index + match[0].length
  });
}

// Process each range
ranges.forEach((range, index) => {
  const startSeconds = parseTimeToSeconds(range.start);
  const endSeconds = parseTimeToSeconds(range.end);
  const rangeDuration = endSeconds - startSeconds;
  const commentCount = range.commentCount;
  
  if (commentCount === 0) return;
  
  // Calculate evenly distributed offsets
  let offsets = [];
  if (commentCount === 1) {
    offsets = [0];
  } else {
    // Distribute evenly from start to end
    const step = rangeDuration / (commentCount - 1);
    for (let i = 0; i < commentCount; i++) {
      offsets.push(Math.round(i * step * 100) / 100); // Round to 2 decimals
    }
  }
  
  // Replace timeOffset values in the comments section
  let newCommentsSection = range.commentsSection;
  let offsetIndex = 0;
  
  newCommentsSection = newCommentsSection.replace(/timeOffset:\s*[^,}\n]+/g, (match) => {
    const newOffset = offsets[offsetIndex++];
    return `timeOffset: ${newOffset}`;
  });
  
  // Replace the full range in content
  const newRange = range.fullMatch.replace(range.commentsSection, newCommentsSection);
  content = content.substring(0, range.startIndex) + newRange + content.substring(range.endIndex);
  
  // Update ranges after this one (their indices have changed)
  const lengthDiff = newRange.length - range.fullMatch.length;
  for (let i = index + 1; i < ranges.length; i++) {
    ranges[i].startIndex += lengthDiff;
    ranges[i].endIndex += lengthDiff;
  }
});

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed timeOffsets for all ranges!');

