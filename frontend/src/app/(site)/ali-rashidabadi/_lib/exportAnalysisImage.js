/**
 * Premium Fitino body-analysis report → PNG download (Canvas 2D).
 */

const FA = "۰۱۲۳۴۵۶۷۸۹";

function toFa(value) {
  return String(value ?? "").replace(/\d/g, (d) => FA[d]);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = wrapLines(ctx, text, maxWidth);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
  return lines.length * lineHeight;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawGlassCard(ctx, x, y, w, h, r = 20) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  ctx.fill();
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.25;
  ctx.stroke();
  // top highlight
  const g = ctx.createLinearGradient(x, y, x, y + 28);
  g.addColorStop(0, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  roundRect(ctx, x, y, w, Math.min(h, 28), r);
  ctx.fillStyle = g;
  ctx.fill();
}

/**
 * @param {object} analysis
 * @param {{ coachName?: string, fileName?: string }} [opts]
 */
export async function downloadAnalysisPng(analysis, opts = {}) {
  if (!analysis || typeof document === "undefined") return;

  const coachName = opts.coachName || "علی رشید آبادی";
  const fileName = opts.fileName || "fitino-analyz-badani.png";
  const logo = await loadImage("/fitino-logo.png");

  const W = 1080;
  const PAD = 48;
  const contentW = W - PAD * 2;

  let estH = 220;
  estH += 70;
  estH += Math.ceil((analysis.highlights?.length || 0) / 2) * 110;
  estH += analysis.chartBars ? 48 + analysis.chartBars.length * 52 : 0;
  if (analysis.aiWarning) {
    estH += 80 + Math.ceil((analysis.aiWarning.length || 0) / 48) * 28;
  }
  for (const sec of analysis.sections || []) {
    estH += 48 + Math.ceil((sec.body?.length || 0) / 52) * 28 + 28;
  }
  estH += 100;
  const H = Math.max(1400, estH);

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  // Deep Fitino background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a1211");
  bg.addColorStop(0.45, "#0e0e0e");
  bg.addColorStop(1, "#0b1514");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient glows
  const g1 = ctx.createRadialGradient(W * 0.85, 60, 10, W * 0.85, 80, 420);
  g1.addColorStop(0, "rgba(38,252,227,0.22)");
  g1.addColorStop(1, "rgba(38,252,227,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, 520);

  const g2 = ctx.createRadialGradient(80, H * 0.55, 10, 80, H * 0.55, 360);
  g2.addColorStop(0, "rgba(42,156,150,0.16)");
  g2.addColorStop(1, "rgba(42,156,150,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Outer frame
  roundRect(ctx, 18, 18, W - 36, H - 36, 28);
  ctx.strokeStyle = "rgba(38,252,227,0.22)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  roundRect(ctx, 26, 26, W - 52, H - 52, 24);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();

  let y = PAD + 12;

  // Header row: logo + brand
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(W - PAD - 28, y + 28, 28, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, W - PAD - 56, y, 56, 56);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(W - PAD - 28, y + 28, 28, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(38,252,227,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#26fce3";
  ctx.font = "800 26px IranianSansBlack, IranianSans, Tahoma, sans-serif";
  ctx.fillText("فیتینو", W - PAD - (logo ? 72 : 0), y + 26);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 14px IranianSans, Tahoma, sans-serif";
  ctx.fillText(`گزارش اختصاصی آنالیز بدنی · مربی ${coachName}`, W - PAD - (logo ? 72 : 0), y + 52);

  // Date chip (left)
  const dateFa = toFa(
    new Date().toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  ctx.font = "500 12px IranianSans, Tahoma, sans-serif";
  const dateW = ctx.measureText(dateFa).width + 24;
  roundRect(ctx, PAD, y + 10, dateW, 30, 15);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText(dateFa, PAD + 12, y + 30);

  y += 88;

  // Accent gradient line
  const lineGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  lineGrad.addColorStop(0, "rgba(38,252,227,0)");
  lineGrad.addColorStop(0.5, "rgba(38,252,227,0.55)");
  lineGrad.addColorStop(1, "rgba(38,252,227,0)");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 28;

  // Title card
  const titleLines = wrapLines(
    (() => {
      ctx.font = "800 32px IranianSansBlack, IranianSans, Tahoma, sans-serif";
      return ctx;
    })(),
    analysis.title || "گزارش آنالیز هوشمند بدنی",
    contentW - 40
  );
  const subLines = wrapLines(
    (() => {
      ctx.font = "400 15px IranianSans, Tahoma, sans-serif";
      return ctx;
    })(),
    analysis.subtitle || "",
    contentW - 40
  );
  const titleCardH = 36 + titleLines.length * 40 + 12 + subLines.length * 26 + 28;
  drawGlassCard(ctx, PAD, y, contentW, titleCardH, 22);

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 32px IranianSansBlack, IranianSans, Tahoma, sans-serif";
  let ty = y + 44;
  titleLines.forEach((ln) => {
    ctx.fillText(ln, W - PAD - 20, ty);
    ty += 40;
  });
  ty += 4;
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "400 15px IranianSans, Tahoma, sans-serif";
  subLines.forEach((ln) => {
    ctx.fillText(ln, W - PAD - 20, ty);
    ty += 26;
  });
  y += titleCardH + 22;

  // Badge centered
  const badge = analysis.meta?.badge || "";
  if (badge) {
    ctx.font = "700 13px IranianSans, Tahoma, sans-serif";
    const bw = ctx.measureText(badge).width + 36;
    const bx = (W - bw) / 2;
    roundRect(ctx, bx, y, bw, 34, 17);
    const badgeGrad = ctx.createLinearGradient(bx, y, bx + bw, y);
    badgeGrad.addColorStop(0, "rgba(24,114,114,0.35)");
    badgeGrad.addColorStop(1, "rgba(38,252,227,0.2)");
    ctx.fillStyle = badgeGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(38,252,227,0.5)";
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.fillStyle = "#26fce3";
    ctx.textAlign = "center";
    ctx.fillText(badge, W / 2, y + 22);
    y += 54;
  }

  // Highlights
  const highlights = analysis.highlights || [];
  const gap = 14;
  const colW = (contentW - gap) / 2;
  const cardH = 96;
  highlights.forEach((h, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + (1 - col) * (colW + gap);
    const cardY = y + row * (cardH + gap);
    drawGlassCard(ctx, x, cardY, colW, cardH, 18);
    // teal accent bar on the right of card
    ctx.fillStyle = "rgba(38,252,227,0.55)";
    roundRect(ctx, x + colW - 4, cardY + 18, 4, cardH - 36, 2);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "500 12px IranianSans, Tahoma, sans-serif";
    ctx.fillText(h.label, x + colW / 2, cardY + 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 18px IranianSansBlack, IranianSans, Tahoma, sans-serif";
    ctx.fillText(toFa(h.value), x + colW / 2, cardY + 64);
  });
  y += Math.ceil(highlights.length / 2) * (cardH + gap) + 10;

  // Biomechanics bars
  if (analysis.chartBars?.length) {
    const barsH = 40 + analysis.chartBars.length * 48;
    drawGlassCard(ctx, PAD, y, contentW, barsH, 20);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "700 14px IranianSans, Tahoma, sans-serif";
    ctx.fillText("نمای بیومکانیک تخمینی", W - PAD - 20, y + 28);
    let by = y + 48;
    for (const bar of analysis.chartBars) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "500 13px IranianSans, Tahoma, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(bar.label, W - PAD - 20, by + 8);
      ctx.textAlign = "left";
      ctx.fillStyle = "#26fce3";
      ctx.font = "700 13px IranianSans, Tahoma, sans-serif";
      ctx.fillText(`${toFa(bar.value)}٪`, PAD + 20, by + 8);
      by += 16;
      const trackX = PAD + 20;
      const trackW = contentW - 40;
      roundRect(ctx, trackX, by, trackW, 10, 5);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      const barW = (trackW * Math.min(100, Number(bar.value) || 0)) / 100;
      const barGrad = ctx.createLinearGradient(trackX + trackW - barW, 0, trackX + trackW, 0);
      barGrad.addColorStop(0, "#187272");
      barGrad.addColorStop(0.5, "#2a9c96");
      barGrad.addColorStop(1, "#26fce3");
      roundRect(ctx, trackX + trackW - barW, by, barW, 10, 5);
      ctx.fillStyle = barGrad;
      ctx.fill();
      by += 32;
    }
    y += barsH + 18;
  }

  // AI warning
  if (analysis.aiWarning) {
    ctx.font = "400 14px IranianSans, Tahoma, sans-serif";
    const warnLines = wrapLines(ctx, analysis.aiWarning, contentW - 48);
    const warnH = 52 + warnLines.length * 26;
    roundRect(ctx, PAD, y, contentW, warnH, 20);
    ctx.fillStyle = "rgba(251,146,60,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(251,146,60,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // left accent
    ctx.fillStyle = "rgba(251,146,60,0.7)";
    roundRect(ctx, PAD, y + 16, 4, warnH - 32, 2);
    ctx.fill();
    ctx.fillStyle = "#fdba74";
    ctx.font = "800 13px IranianSans, Tahoma, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("هشدار هوش مصنوعی", W - PAD - 24, y + 30);
    ctx.fillStyle = "rgba(255,247,237,0.92)";
    ctx.font = "400 14px IranianSans, Tahoma, sans-serif";
    warnLines.forEach((ln, i) => {
      ctx.fillText(ln, W - PAD - 24, y + 58 + i * 26);
    });
    y += warnH + 20;
  }

  // Sections
  for (const sec of analysis.sections || []) {
    ctx.font = "400 14px IranianSans, Tahoma, sans-serif";
    const bodyLines = wrapLines(ctx, sec.body, contentW - 48);
    const secH = 52 + bodyLines.length * 26;
    drawGlassCard(ctx, PAD, y, contentW, secH, 18);
    ctx.fillStyle = "#26fce3";
    ctx.font = "800 15px IranianSans, Tahoma, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(sec.title, W - PAD - 24, y + 30);
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "400 14px IranianSans, Tahoma, sans-serif";
    bodyLines.forEach((ln, i) => {
      ctx.fillText(ln, W - PAD - 24, y + 58 + i * 26);
    });
    y += secH + 16;
  }

  // Footer
  const footY = H - 56;
  const footGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  footGrad.addColorStop(0, "rgba(38,252,227,0)");
  footGrad.addColorStop(0.5, "rgba(38,252,227,0.35)");
  footGrad.addColorStop(1, "rgba(38,252,227,0)");
  ctx.strokeStyle = footGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, footY - 16);
  ctx.lineTo(W - PAD, footY - 16);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 12px IranianSans, Tahoma, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "fitinoo.ir  ·  این گزارش اولیه و تخمینی است و جایگزین مشاوره حضوری مربی نیست",
    W / 2,
    footY + 8
  );

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
