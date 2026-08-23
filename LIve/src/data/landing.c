<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>MonetizeAI | سیستم درآمد دلاری با هوش مصنوعی</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;800;900&display=swap');
    
    body {
      margin: 0;
      padding-top: 2.5rem;
      padding-bottom: 80px;
      min-height: 100vh;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background: linear-gradient(120deg, #080C28 0%, #1A0033 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .container {
      max-width: 500px;
      width: 90vw;
      margin: 2rem auto;
      background: rgba(30,20,60,0.82);
      border-radius: 2.2rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      border: 2px solid rgba(255,255,255,0.11);
      padding: 2.5rem 1.3rem;
      text-align: center;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      position: relative;
      animation: fadein 1.2s cubic-bezier(.34,.61,.71,.54);
      box-sizing: border-box;
    }
    
    @keyframes fadein {
      from {opacity: 0; transform: translateY(50px);}
      to {opacity: 1; transform: none;}
    }
    
    .logo-ai {
      width: 90px;
      height: 90px;
      margin: -2.2rem auto 1.5rem auto;
      background: none;
      border-radius: 1.5rem;
      box-shadow: 0 2px 18px #8A00FF44, 0 0 0 6px #fff2;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pop 1.1s cubic-bezier(.3,.88,.53,.92);
    }
    
    @keyframes pop {
      0% {transform: scale(0.5);}
      60% {transform: scale(1.1);}
      100% {transform: scale(1);}
    }
    
    .logo-ai img {
      width: 80px;
      height: 80px;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 0 18px #8A00FF99) drop-shadow(0 0 8px #0066FF88);
      border-radius: 1.2rem;
      background: none;
      transition: transform 0.2s;
    }
    
    @media (max-width:600px) {
      .logo-ai { width: 60px; height: 60px; }
      .logo-ai img { width: 52px; height: 52px; }
    }
    
    h1 {
      margin-bottom: .9rem;
      margin-top: 0;
      line-height: 1.3;
      animation: fadein 1.3s .4s both;
    }
    
    h1 .brand-name {
      display: block;
      font-size: 5.5rem;
      background: linear-gradient(90deg,#FFD700,#FF00CC,#8A00FF 90%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 900;
      letter-spacing: 0.01em;
      text-shadow: 0 3px 12px #8A00FF33;
      margin-bottom: 0.5rem;
    }
    
    h1 .subtitle {
      display: block;
      font-size: 2.3rem;
      color: #E0CCFF;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.4;
    }
    
    .desc {
      color: #E0CCFF;
      font-size: 1.05rem;
      margin-bottom: 2.1rem;
      line-height: 1.6;
      font-weight: 400;
      animation: fadein 1.1s .5s both;
      white-space: nowrap;
    }
    
    @media (max-width: 600px) {
      .desc {
        white-space: normal;
        font-size: 0.95rem;
      }
    }
    
    .cta-btn {
      display: inline-block;
      padding: 1.1rem 2.8rem;
      border-radius: 2rem;
      background: linear-gradient(90deg, #00fff7 0%, #8A00FF 60%, #FF00CC 100%);
      color: #fff;
      font-weight: 900;
      font-size: 1.17rem;
      border: none;
      text-decoration: none;
      box-shadow: 0 0 18px #00fff799, 0 0 8px #8A00FF55;
      margin-top: 1.1rem;
      cursor: pointer;
      letter-spacing: 0.04em;
      position: relative;
      overflow: hidden;
      transition: background 0.25s, box-shadow 0.25s, transform 0.18s;
      animation: cyberpunkPulse 2.2s infinite cubic-bezier(.45,.35,.5,1.15) alternate;
    }
    
    .cta-btn:hover {
      background: linear-gradient(90deg, #00fff7 0%, #8A00FF 60%, #FF00CC 100%);
      box-shadow: 0 0 32px #00fff7cc, 0 0 18px #8d7a0e99, 0 0 8px #6c105a99;
      border: 2px solid #FFD700;
      transform: scale(1.04) rotate(-1deg);
      filter: brightness(1.15) saturate(1.2);
    }
    
    @keyframes cyberpunkPulse {
      0% { box-shadow: 0 0 18px #00fff799, 0 0 8px #8A00FF55; }
      50% { box-shadow: 0 0 32px #FF00CC99, 0 0 18px #FFD70099, 0 0 8px #00fff7cc; }
      100% { box-shadow: 0 0 18px #00fff799, 0 0 8px #8A00FF55; }
    }
    
    .features-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 0;
      margin: 1.5rem 0;
      box-sizing: border-box;
    }
    
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      width: 100%;
      max-width: 100%;
      padding: 0;
      margin: 0;
      direction: rtl;
      box-sizing: border-box;
    }
    
    .feature-item {
      background: linear-gradient(135deg, rgba(138, 0, 255, 0.12), rgba(255, 0, 204, 0.08));
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 1.25rem;
      padding: 1.25rem 1.25rem;
      box-shadow: 0 8px 32px rgba(138, 0, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 0.95rem;
      line-height: 1.6;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    
    .feature-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .feature-item:hover::before {
      left: 100%;
    }
    
    .feature-item:hover {
      box-shadow: 0 12px 40px rgba(255, 0, 204, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      background: linear-gradient(135deg, rgba(138, 0, 255, 0.18), rgba(255, 0, 204, 0.12));
      border-color: rgba(255, 215, 0, 0.4);
      transform: translateY(-3px);
    }
    
    .feature-item.active {
      background: linear-gradient(135deg, rgba(138, 0, 255, 0.2), rgba(255, 0, 204, 0.15));
      border-color: rgba(255, 215, 0, 0.5);
      box-shadow: 0 12px 40px rgba(255, 0, 204, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    
    .feature-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 800;
      font-size: 1.05rem;
      background: linear-gradient(90deg, #FF00CC, #FFD700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      gap: 0.5rem;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    
    .feature-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      text-align: right;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .arrow {
      font-size: 1.2rem;
      transform: rotate(0deg);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, #FFD700, #FF00CC);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      flex-shrink: 0;
      font-weight: 900;
    }
    
    .feature-item.active .arrow {
      transform: rotate(90deg);
    }
    
    .feature-description {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: none;
      color: #E0CCFF;
      font-size: 0.95rem;
      line-height: 1.8;
      text-align: right;
      position: relative;
      z-index: 1;
    }
    
    .feature-item.active .feature-description {
      display: block;
      animation: fadeInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 600px) {
      .feature-item {
        font-size: 0.95rem;
        padding: 1rem 0.8rem;
      }
      .feature-header {
        font-size: 1rem;
      }
      .feature-description {
        font-size: 0.9rem;
      }
    }
    
    @media (max-width: 480px) {
      .feature-item {
        font-size: 0.9rem;
        padding: 0.9rem 0.7rem;
      }
      .feature-header {
        font-size: 0.95rem;
      }
      .feature-description {
        font-size: 0.85rem;
      }
    }
    
    .pricebox {
      margin: 1.5rem auto 1rem auto;
      background: rgba(8,12,40,0.97);
      border-radius: 1.6rem;
      padding: 1.9rem 1.3rem 1.3rem 1.3rem;
      border: 1.5px solid #8A00FF55;
      box-shadow: 0 4px 22px 0 #8A00FF19;
      color: #fff;
      font-size: 1.21rem;
      font-weight: 700;
      letter-spacing: .02em;
      text-align: center;
      animation: fadein 1.3s .7s both;
    }
    
    .price-value {
      font-size: 2.1rem;
      background: linear-gradient(90deg,#17e07b,#00c853 85%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
      margin-top: 0;
      display: block;
      text-shadow: 0 2px 8px rgba(23, 224, 123, 0.3);
    }
    
    .price-old {
      display: block;
      color: #ff3750;
      text-decoration: line-through;
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
      margin-top: -0.7rem;
      letter-spacing: 0.01em;
    }
    
    .price-desc {
      color: #E0CCFF;
      font-size: 1rem;
      font-weight: 400;
      margin: 0 0 1.1rem 0;
    }
    
    .guarantee {
      color: #88FFCC;
      font-size: .98rem;
      background: #002A18dd;
      border-radius: 1.1rem;
      margin: 1rem auto 0 auto;
      padding: .6rem 1.1rem;
      width: fit-content;
      box-shadow: 0 0 18px #18ffb933;
      letter-spacing: .01em;
    }
    
    .discount-badge {
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      background: #ff3750;
      border-radius: 1rem;
      margin: 1rem auto 0 auto;
      padding: 0.7rem 1.3rem;
      width: fit-content;
      box-shadow: 0 4px 15px rgba(255, 55, 80, 0.4);
      letter-spacing: 0.01em;
      text-align: center;
      display: block;
    }
    
    /* Payment Options Banner */
    .payment-options-banner {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      text-align: center;
      box-sizing: border-box;
    }
    
    .payment-options-link {
      display: inline-block;
      padding: 1.2rem 2.5rem;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #2abf1b;
      font-weight: 700;
      font-size: 1.2rem;
      text-decoration: none;
      border-radius: 2rem;
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      letter-spacing: 0.01em;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    
    .payment-options-link:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #32d924;
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
    }
    
    .payment-options-link:active {
      transform: translateY(0);
    }
    
    /* Compare Section */
    .compare-section {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      padding: 2rem 1.3rem;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      font-family: 'Vazirmatn', sans-serif;
      color: white;
      text-align: center;
      box-sizing: border-box;
    }
    
    .compare-section h2 {
      color: #FFD700;
      font-size: 1.4rem;
      margin-bottom: 1.5rem;
    }
    
    .compare-table {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    
    .compare-table .row {
      display: flex;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1rem;
      padding: 1rem 1rem;
      font-size: 1rem;
      gap: 0.5rem;
      border: 1px solid rgba(255,255,255,0.05);
    }
    
    .compare-table .row.header {
      background: linear-gradient(135deg, #ff00cc, #8A00FF);
      font-weight: 800;
      color: #fff;
      font-size: 1.1rem;
      border: none;
    }
    
    .compare-table .cell {
      width: 48%;
      text-align: center;
      line-height: 1.5;
    }
    
    .compare-section .note {
      margin-top: 2rem;
      color: #FFD700;
      font-size: 1.05rem;
      font-weight: 600;
      line-height: 1.6;
    }
    
    /* Countdown Box */
    .countdownbox {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      text-align: center;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
    }
    
    .countdown-title {
      font-size: 1.3rem;
      color: #FFD700;
      font-weight: 800;
      margin-bottom: 1.2rem;
      letter-spacing: .01em;
    }
    
    #countdown {
      font-size: 1.2rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      gap: 1.2rem;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(10, 5, 30, 0.9));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 2rem 2.5rem;
      box-shadow: 
        0 0 30px rgba(255, 215, 0, 0.3),
        0 0 60px rgba(138, 0, 255, 0.2),
        inset 0 2px 10px rgba(255, 255, 255, 0.1),
        inset 0 -2px 10px rgba(0, 0, 0, 0.5);
      direction: ltr;
      border: 2px solid rgba(255, 215, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    #countdown::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(255, 215, 0, 0.03) 2px,
          rgba(255, 215, 0, 0.03) 4px
        );
      pointer-events: none;
      z-index: 0;
    }
    
    #countdown span { 
      min-width: 90px; 
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      position: relative;
      z-index: 1;
      font-size: 0.75rem;
      color: rgba(255, 215, 0, 0.7);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    #countdown span:not(:last-child)::after {
      content: ':';
      position: absolute;
      right: -0.6rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 3rem;
      color: rgba(255, 215, 0, 0.4);
      font-weight: 300;
      z-index: 2;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      animation: blink 1s infinite;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }
    
    #countdown b {
      font-size: 4rem;
      margin: 0;
      color: #00FF88;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      display: block;
      font-weight: 700;
      letter-spacing: 0.05em;
      line-height: 1;
      text-shadow: 
        0 0 3px rgba(0, 255, 136, 0.3),
        0 2px 4px rgba(0, 0, 0, 0.8);
      background: linear-gradient(180deg, #00FF88, #00CC6A);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 2px rgba(0, 255, 136, 0.2));
    }
    
    /* Features Section */
    .features-click-reveal {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      padding: 2rem 1.3rem;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      color: white;
      font-family: 'Vazirmatn', sans-serif;
      text-align: center;
      box-sizing: border-box;
    }
    
    .features-click-reveal h2 {
      font-size: 1.5rem;
      color: #FFD700;
      margin-bottom: 0.8rem;
      font-weight: 800;
    }
    
    .hint {
      color: #ccc;
      font-size: 1rem;
      margin-bottom: 1.8rem;
    }
    
    .badge-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      justify-content: center;
    }
    
    .badge {
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      padding: 0.7rem 1.1rem;
      border-radius: 0.875rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 2px 12px rgba(138, 0, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
      position: relative;
      color: #fff;
      overflow: hidden;
    }
    
    .badge::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .badge:hover::before {
      left: 100%;
    }
    
    .badge:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 215, 0, 0.3);
      box-shadow: 0 4px 20px rgba(255, 0, 204, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
    }
    
    .badge:active {
      transform: translateY(0);
    }
    
    .popup {
      margin-top: 1.5rem;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      font-size: 0.95rem;
      color: #E0CCFF;
      line-height: 1.7;
      box-shadow: 0 8px 32px rgba(138, 0, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      max-width: 100%;
      margin-left: 0;
      margin-right: 0;
      display: none;
      text-align: right;
      box-sizing: border-box;
    }
    
    .popup.visible {
      display: block;
      animation: fadeInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* FAQ Box */
    .faqbox { 
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      box-sizing: border-box;
    }
    
    .faq-title { 
      font-size: 1.5rem;
      color: #FFD700; 
      font-weight: 800;
      margin-bottom: 1.5rem;
      letter-spacing: .01em;
      text-align: center;
    }
    
    .faq-item { 
      margin-bottom: 1rem;
    }
    
    .faq-item label { 
      display: block; 
      font-size: 1.05rem; 
      color: #fff; 
      cursor: pointer; 
      font-weight: 700; 
      padding: 1rem 1.2rem; 
      background: rgba(255, 255, 255, 0.05); 
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
    }
    
    .faq-item label:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255,215,0,0.3);
    }
    
    .faq-item input {
      display: none;
    }
    
    .faq-body { 
      max-height: 0; 
      overflow: hidden; 
      transition: max-height 0.4s cubic-bezier(.56,.24,.64,1.4); 
      background: rgba(138,0,255,0.15); 
      border-radius: 1rem; 
      color: #E0CCFF; 
      font-size: 1rem; 
      margin: 0.5rem 0 0 0; 
      padding: 0 1.2rem;
      line-height: 1.7;
    }
    
    .faq-item input:checked ~ .faq-body {
      max-height: 300px; 
      padding: 1.2rem;
    }
    
    .faq-item label:after {
      content: "+"; 
      float: left; 
      color: #FFD700; 
      font-size: 1.3rem; 
      margin-left: 0.5rem;
      font-weight: 700;
    }
    
    .faq-item input:checked + label:after {
      content: "–";
    }
    
    .faq-item input:checked + label {
      background: rgba(138,0,255,0.2);
      border-color: rgba(255,215,0,0.4);
    }
    
    /* Mockup Box */
    .mockupbox { 
      max-width: 700px;
      width: 90vw;
      margin: 1rem auto;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      text-align: center;
      box-sizing: border-box;
    }
    
    .mockup-title { 
      color: #FFD700; 
      font-weight: 800; 
      font-size: 1.5rem; 
      margin-bottom: 1.5rem;
    }
    
    .mockup-imgs { 
      display:flex; 
      flex-wrap:wrap; 
      gap:0.7rem; 
      justify-content:center; 
    }
    
    .mockup-imgs img { 
      border-radius:1rem; 
      box-shadow:0 2px 10px #8A00FF33; 
      width:120px; 
      max-width:32vw; 
      background:#fff;
      cursor: pointer;
    }
    
    .mockup-caption { 
      color:#E0CCFF; 
      font-size:.96rem; 
      margin-top:1rem;
    }
    
    /* Modal */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      padding-top: 60px;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.9);
    }
    
    .modal-content {
      margin: auto;
      display: block;
      width: 80%;
      max-width: 700px;
    }
    
    .close {
      position: absolute;
      top: 15px;
      right: 35px;
      color: #f1f1f1;
      font-size: 40px;
      font-weight: bold;
      transition: 0.3s;
      cursor: pointer;
    }
    
    .close:hover, .close:focus {
      color: #bbb;
      text-decoration: none;
    }
    
    /* Carousel Styles */
    .carousel-container {
      position: relative;
      max-width: 100%;
      margin: 0 auto;
      border-radius: 1.2rem;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(138, 0, 255, 0.4);
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .carousel-wrapper {
      position: relative;
      width: 100%;
      height: 600px;
    }
    
    .carousel-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    
    .carousel-slide.active {
      opacity: 1;
    }
    
    .carousel-slide img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 1rem;
      background: rgba(255,255,255,0.05);
    }
    
    .slide-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 1rem;
      text-align: center;
      font-weight: bold;
    }
    
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      padding: 1rem;
      cursor: pointer;
      font-size: 1.2rem;
      border-radius: 0.5rem;
      transition: background 0.3s;
      z-index: 10;
    }
    
    .carousel-btn:hover {
      background: rgba(0,0,0,0.8);
    }
    
    .carousel-btn.prev {
      left: 10px;
    }
    
    .carousel-btn.next {
      right: 10px;
    }
    
    .carousel-dots {
      text-align: center;
      margin-top: 1rem;
    }
    
    .dot {
      height: 12px;
      width: 12px;
      margin: 0 5px;
      background-color: rgba(255,255,255,0.3);
      border-radius: 50%;
      display: inline-block;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .dot.active, .dot:hover {
      background-color: #FFD700;
    }
    
    /* Video Reviews Section */
    .video-reviews-section {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      text-align: center;
      box-sizing: border-box;
    }
    
    .video-reviews-title {
      color: #FFD700;
      font-weight: 800;
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .video-container {
      position: relative;
      width: 100%;
      max-width: 100%;
      border-radius: 1.2rem;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(138, 0, 255, 0.4);
      background: rgba(0, 0, 0, 0.3);
    }
    
    .video-container video {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 1.2rem;
    }
    
    /* Footer */
    .mainfooter {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto 1.5rem auto;
      background: rgba(30,20,60,0.82);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(36,0,61,0.17);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      text-align: center;
      color: #E0CCFF;
      font-size: 1rem;
      box-sizing: border-box;
    }
    
    .mainfooter a {
      text-decoration: none;
      color: #FFD700;
      font-weight: 600;
    }
    
    .mainfooter a:hover {
      color: #FF00CC;
      text-decoration: underline;
    }
    
    /* Floating CTA Button */
    .floating-cta-btn {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      background: #29bf12;
      color: #fff;
      font-size: 1.2rem;
      font-weight: 800;
      padding: 1.2rem 1.5rem;
      text-align: center;
      text-decoration: none;
      display: block;
      z-index: 9999;
      box-shadow: 0 -4px 20px rgba(41, 191, 18, 0.4);
      border: none;
      border-top: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 1.5rem 1.5rem 0 0;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }
    
    .floating-cta-btn:hover {
      background: #22a00f;
      box-shadow: 0 -6px 30px rgba(41, 191, 18, 0.6);
      transform: translateY(-2px);
    }
    
    .floating-cta-btn:active {
      transform: translateY(0);
    }
    
    /* Payment Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      overflow-y: auto;
    }
    
    .modal-overlay.active {
      display: flex;
    }
    
    .modal-container {
      background: rgba(15, 8, 23, 0.95);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 2rem;
      width: 100%;
      max-width: 30rem;
      max-height: 90vh;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      position: relative;
    }
    
    .modal-header {
      position: relative;
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: transparent;
    }
    
    .modal-header-content {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: row-reverse;
    }
    
    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 0.25rem;
      letter-spacing: -0.01em;
      text-align: right;
    }
    
    .modal-subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
      font-weight: 500;
      text-align: right;
    }
    
    .modal-close-btn {
      padding: 0.5rem;
      width: 2.25rem;
      height: 2.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    
    .modal-body {
      display: flex;
      flex-direction: column;
      max-height: calc(90vh - 180px);
      min-height: 400px;
    }
    
    .modal-content {
      padding: 1rem 1.25rem;
      overflow-y: auto;
      flex: 1;
    }
    
    .modal-step {
      display: none;
    }
    
    .modal-step.active {
      display: block;
    }
    
    /* Step 1: User Info Form */
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group:last-child {
      margin-bottom: 0.5rem;
    }
    
    .form-label {
      display: block;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      text-align: right;
    }
    
    .form-input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      color: #fff;
      font-size: 1rem;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      transition: all 0.2s;
      box-sizing: border-box;
      font-weight: 500;
      text-align: right;
      direction: rtl;
    }
    
    .form-input:focus {
      outline: none;
      border-color: rgba(90, 24, 154, 0.6);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(90, 24, 154, 0.15);
    }
    
    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
      font-weight: 400;
    }
    
    /* Step 2: Cart */
    .cart-item {
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
    }
    
    .cart-item-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-direction: row-reverse;
    }
    
    .cart-icon {
      width: 2.75rem;
      height: 2.75rem;
      background: linear-gradient(135deg, #2c189a, #5a189a);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .cart-item-title {
      font-weight: 700;
      color: #fff;
      font-size: 1.15rem;
      margin-bottom: 0.25rem;
      text-align: right;
    }
    
    .cart-item-subtitle {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
      font-weight: 400;
      text-align: right;
    }
    
    .flex-1 {
      flex: 1;
    }
    
    .space-y-3 > * + * {
      margin-top: 0.75rem;
    }
    
    .cart-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.875rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      flex-direction: row-reverse;
    }
    
    .cart-price-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: right;
    }
    
    .cart-price-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      text-align: right;
      direction: rtl;
    }
    
    .payment-methods {
      margin-bottom: 1rem;
    }
    
    .payment-methods-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.75rem;
      text-align: right;
    }
    
    .payment-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.85rem;
      border-radius: 0.625rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      margin-bottom: 0.75rem;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.02);
      flex-direction: row-reverse;
      direction: rtl;
      max-width: 85%;
      margin-left: auto;
      margin-right: auto;
    }
    
    .payment-option:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(90, 24, 154, 0.4);
    }
    
    .payment-radio {
      width: 1.1rem;
      height: 1.1rem;
      accent-color: #5a189a;
      cursor: pointer;
    }
    
    .payment-option-content {
      flex: 1;
      text-align: right;
      direction: rtl;
    }
    
    .payment-option-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      justify-content: flex-start;
      direction: rtl;
    }
    
    .payment-option-badge {
      font-size: 0.75rem;
      color: #4ade80;
      font-weight: 500;
    }
    
    .payment-option-desc {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.65);
      font-weight: 500;
      text-align: right;
      direction: rtl;
    }
    
    .price-summary {
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
    }
    
    .price-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.625rem;
      gap: 0.5rem;
    }
    
    .price-row-total {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 0.625rem;
      margin-top: 0.625rem;
    }
    
    .price-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
      width: 100%;
    }
    
    .price-value {
      color: #fff;
      font-weight: 800;
      font-size: 2.2rem;
      text-align: center;
      direction: ltr;
      width: 100%;
      display: block;
    }
    
    .price-value-total {
      font-size: 2.5rem;
      font-weight: 900;
      color: #fff;
      text-align: center;
      direction: ltr;
      width: 100%;
      display: block;
    }
    
    .price-label.price-value-total {
      font-size: 1.5rem;
      font-weight: 800;
      text-align: center;
      width: 100%;
    }
    
    /* Card to Card Info */
    .card-to-card-info {
      border-radius: 1rem;
      padding: 0.75rem 0.875rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1rem;
      background: rgba(16, 9, 28, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .card-info-header {
      text-align: center;
      margin-bottom: 0.75rem;
    }
    
    .card-info-icon {
      width: 3rem;
      height: 3rem;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.4rem;
      color: #fff;
    }
    
    .card-info-icon svg {
      width: 24px;
      height: 24px;
    }
    
    .card-info-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .card-info-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .card-info-item {
      background: rgba(31, 41, 55, 0.5);
      border-radius: 0.75rem;
      padding: 0.75rem 0.875rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: row;
      box-sizing: border-box;
      min-width: 0;
      gap: 1rem;
    }
    
    .card-info-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      text-align: right;
      direction: rtl;
      word-wrap: break-word;
      overflow-wrap: break-word;
      flex-shrink: 0;
      min-width: fit-content;
    }
    
    .card-info-value {
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      text-align: left;
      direction: rtl;
      word-wrap: break-word;
      overflow-wrap: break-word;
      flex: 1;
      min-width: 0;
    }
    
    .card-number-wrapper {
      margin-bottom: 0;
      margin-top: 0;
    }
    
    .card-number-box {
      background: rgba(31, 41, 55, 0.5);
      border-radius: 0.75rem;
      padding: 0.875rem 0.75rem;
      margin-bottom: 0.6rem;
      text-align: center;
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .card-info-value.card-number {
      font-family: 'Courier New', monospace;
      font-weight: 800;
      letter-spacing: 0.05em;
      direction: ltr;
      text-align: center;
      white-space: nowrap;
      color: #fff;
      font-size: 1.1rem;
      display: block;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .copy-card-btn {
      width: 100%;
      height: 2.75rem;
      padding: 0;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      border: none;
      border-radius: 0.75rem;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      white-space: nowrap;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    
    .copy-card-btn:hover {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
    }
    
    .copy-card-btn:active {
      opacity: 0.9;
    }
    
    .copy-card-btn.copied {
      background: linear-gradient(135deg, #10b981, #059669);
    }
    
    .copy-success {
      position: absolute;
      background: rgba(16, 185, 129, 0.9);
      color: #fff;
      padding: 0.3rem 0.6rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      top: -2rem;
      right: 0;
      white-space: nowrap;
      animation: fadeInOut 2s ease;
      pointer-events: none;
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0; transform: translateY(0); }
      10%, 90% { opacity: 1; transform: translateY(-5px); }
    }
    
    .card-info-note {
      background: rgba(5, 46, 22, 0.6);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 0.75rem;
      padding: 1rem 0.875rem;
      text-align: center;
      font-size: 0.9rem;
      color: #E0CCFF;
      margin-top: 0.5rem;
      line-height: 1.7;
      word-wrap: break-word;
      overflow-wrap: break-word;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .card-info-note-text {
      color: #E0CCFF;
      font-size: 0.9rem;
      line-height: 1.6;
      text-align: right;
      direction: rtl;
    }
    
    .card-info-link {
      color: #10b981;
      font-weight: 800;
      text-decoration: none;
      background: rgba(16, 185, 129, 0.25);
      padding: 0.6rem 1rem;
      border-radius: 0.5rem;
      display: inline-block;
      margin: 0 auto;
      transition: all 0.2s;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 0.95rem;
      letter-spacing: 0.02em;
    }
    
    .card-info-link:hover {
      color: #10b981;
      background: rgba(16, 185, 129, 0.35);
      border-color: rgba(16, 185, 129, 0.5);
      transform: translateY(-1px);
    }
    
    .installment-description {
      margin-bottom: 0.75rem;
    }
    
    .installment-note-box {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 0.75rem;
      padding: 0.875rem;
      margin-top: 0.6rem;
      margin-bottom: 0.5rem;
    }
    
    .modal-footer {
      padding: 1.5rem 1.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: transparent;
    }
    
    .btn-primary {
      width: 100%;
      padding: 1rem 1.5rem;
      border-radius: 0.875rem;
      font-weight: 700;
      font-size: 1.05rem;
      transition: all 0.2s;
      background: linear-gradient(135deg, #29bf12, #22a00f);
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(41, 191, 18, 0.3);
      font-family: 'Vazirmatn', Tahoma, sans-serif;
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #22a00f, #1d8f0d);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(41, 191, 18, 0.4);
    }
    
    .btn-primary:active {
      transform: translateY(0);
    }
    
    .btn-next {
      background: linear-gradient(135deg, #2c189a, #5a189a);
      box-shadow: 0 4px 12px rgba(90, 24, 154, 0.3);
    }
    
    .btn-next:hover {
      background: linear-gradient(135deg, #5a189a, #7c3aed);
      box-shadow: 0 6px 16px rgba(90, 24, 154, 0.4);
    }
    
    .btn-submit-receipt {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .btn-submit-receipt:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      .container, .compare-section, .countdownbox, .features-click-reveal, .faqbox, .mockupbox, .video-reviews-section, .mainfooter, .payment-options-banner {
        width: 88vw;
        padding: 1.8rem 1rem;
      }
      
      .payment-options-banner {
        padding: 0;
        margin: 1rem auto;
      }
      
      .payment-options-link {
        font-size: 1.05rem;
        padding: 1rem 2rem;
      }
      
      h1 .brand-name { font-size: 3.5rem; }
      h1 .subtitle { font-size: 1.6rem; }
      .desc { font-size: 1rem; }
      .cta-btn { font-size: 1.05rem; padding: 1rem 2.2rem; }
      .discount-badge { font-size: 0.9rem; padding: 0.6rem 1.1rem; }
      
      .compare-section h2, .features-click-reveal h2, .faq-title, .mockup-title, .video-reviews-title {
        font-size: 1.3rem;
      }
      
      .countdown-title { font-size: 1.05rem; }
      #countdown { gap: 1rem; padding: 1.5rem 2rem; }
      #countdown span { min-width: 75px; }
      #countdown span:not(:last-child)::after { font-size: 2.5rem; right: -0.5rem; }
      #countdown b { font-size: 3.2rem; }
      
      .badge { font-size: 0.9rem; padding: 0.65rem 1rem; }
      .feature-item { padding: 0.8rem; }
      .feature-header { font-size: 0.9rem; }
      
      .floating-cta-btn {
        font-size: 1.1rem;
        padding: 1rem 1.2rem;
      }
      
      .modal-container {
        max-width: 95vw;
        max-height: 95vh;
        border-radius: 1.5rem;
      }
      
      .modal-header {
        padding: 1.25rem 1.5rem;
      }
      
      .modal-content {
        padding: 0.875rem 1rem;
      }
      
      .modal-title {
        font-size: 1.3rem;
      }
      
      .modal-subtitle {
        font-size: 0.8rem;
      }
      
      .form-input {
        padding: 0.875rem 1rem;
        font-size: 0.95rem;
      }
      
      .cart-item {
        padding: 1.125rem;
      }
      
      .cart-icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.15rem;
      }
      
      .cart-item-title {
        font-size: 1.05rem;
      }
      
      .cart-price-value {
        font-size: 1.35rem;
      }
      
      .payment-methods-title {
        font-size: 1rem;
      }
      
      .payment-option {
        padding: 0.875rem;
      }
      
      .price-summary {
        padding: 1.125rem;
      }
      
      .price-value {
        font-size: 1.8rem;
      }
      
      .price-value-total {
        font-size: 2rem;
      }
      
      .modal-footer {
        padding: 1.25rem 1.5rem;
      }
      
      .btn-primary {
        font-size: 1rem;
        padding: 0.95rem 1.25rem;
      }
    }
    
    @media (max-width: 480px) {
      .container, .compare-section, .countdownbox, .features-click-reveal, .faqbox, .mockupbox, .video-reviews-section, .mainfooter, .payment-options-banner {
        width: 86vw;
        padding: 1.5rem 0.9rem;
        border-radius: 1.8rem;
      }
      
      .payment-options-banner {
        padding: 0;
        margin: 1rem auto;
      }
      
      .payment-options-link {
        font-size: 1rem;
        padding: 0.9rem 1.8rem;
      }
      
      h1 .brand-name { font-size: 3rem; }
      h1 .subtitle { font-size: 1.5rem; }
      .desc { font-size: 0.95rem; }
      .cta-btn { font-size: 1rem; padding: 0.9rem 2rem; }
      .discount-badge { font-size: 0.85rem; padding: 0.5rem 1rem; }
      
      .compare-section h2, .features-click-reveal h2, .faq-title, .mockup-title, .video-reviews-title {
        font-size: 1.2rem;
      }
      
      .countdown-title { font-size: 0.95rem; }
      #countdown { font-size: 1rem; gap: 0.8rem; padding: 1.2rem 1.5rem; }
      #countdown span { min-width: 65px; font-size: 0.7rem; }
      #countdown span:not(:last-child)::after { font-size: 2rem; right: -0.4rem; }
      #countdown b { font-size: 2.8rem; }
      
      .badge { font-size: 0.85rem; padding: 0.6rem 0.9rem; }
      .feature-item { padding: 0.7rem; font-size: 0.9rem; }
      .feature-header { font-size: 0.85rem; }
      .feature-description { font-size: 0.85rem; }
      
      .compare-table .row { padding: 0.7rem 0.8rem; font-size: 0.85rem; }
      .compare-table .row.header { font-size: 0.95rem; }
      
      .carousel-wrapper { height: 450px; }
      .carousel-btn { padding: 0.8rem; font-size: 1rem; }
      
      .floating-cta-btn {
        font-size: 1rem;
        padding: 0.95rem 1rem;
      }
      
      .modal-container {
        max-width: 96vw;
        border-radius: 1.25rem;
      }
      
      .modal-header {
        padding: 1.25rem 1.25rem;
      }
      
      .modal-content {
        padding: 0.875rem 1rem;
      }
      
      .modal-title {
        font-size: 1.3rem;
      }
      
      .cart-item {
        padding: 1.25rem;
      }
      
      .cart-item-title {
        font-size: 1.15rem;
      }
      
      .cart-price-value {
        font-size: 1.35rem;
      }
      
      .price-value {
        font-size: 1.8rem;
      }
      
      .price-value-total {
        font-size: 2rem;
      }
      
      .btn-primary {
        font-size: 1.05rem;
        padding: 1rem 1.25rem;
      }
      
      .card-to-card-info {
        padding: 0.625rem 0.7rem;
      }
      
      .card-info-icon {
        width: 2.5rem;
        height: 2.5rem;
      }
      
      .card-info-icon svg {
        width: 18px;
        height: 18px;
      }
      
      .card-info-title {
        font-size: 1rem;
      }
      
      .card-info-item {
        padding: 0.6rem 0.7rem;
      }
      
      .card-info-label {
        font-size: 0.8rem;
      }
      
      .card-info-value {
        font-size: 0.85rem;
      }
      
      .card-number-box {
        padding: 0.7rem 0.6rem;
      }
      
      .card-info-value.card-number {
        font-size: 0.9rem;
      }
      
      .copy-card-btn {
        font-size: 0.8rem;
        height: 2.5rem;
        padding: 0;
      }
      
      .card-info-note {
        padding: 0.7rem 0.6rem;
        font-size: 0.8rem;
      }
    }
    
    @media (max-width: 400px) {
      .container, .compare-section, .countdownbox, .features-click-reveal, .faqbox, .mockupbox, .video-reviews-section, .mainfooter, .payment-options-banner {
        width: 85vw;
        padding: 1.3rem 0.8rem;
      }
      
      .payment-options-banner {
        padding: 0;
        margin: 1rem auto;
      }
      
      .payment-options-link {
        font-size: 0.95rem;
        padding: 0.85rem 1.5rem;
      }
      
      h1 .brand-name { font-size: 2.5rem; }
      h1 .subtitle { font-size: 1.3rem; }
      .desc { font-size: 0.9rem; }
      .discount-badge { font-size: 0.8rem; padding: 0.5rem 0.9rem; }
      
      #countdown { gap: 0.6rem; padding: 1rem 1.2rem; }
      #countdown span { min-width: 55px; font-size: 0.65rem; }
      #countdown span:not(:last-child)::after { font-size: 1.8rem; right: -0.3rem; }
      #countdown b { font-size: 2.2rem; }
      
      .carousel-wrapper { height: 400px; }
      
      .feature-item { padding: 0.6rem; font-size: 0.85rem; }
      .feature-header { font-size: 0.8rem; }
      .feature-description { font-size: 0.8rem; }
      
      .floating-cta-btn {
        font-size: 0.95rem;
        padding: 0.9rem 0.9rem;
      }
      
      .modal-container {
        max-width: 98vw;
        border-radius: 1.5rem;
      }
      
      .modal-header {
        padding: 1.125rem 1.25rem;
      }
      
      .modal-content {
        padding: 0.75rem 0.875rem;
      }
      
      .modal-title {
        font-size: 1.15rem;
      }
      
      .modal-subtitle {
        font-size: 0.75rem;
      }
      
      .form-input {
        padding: 0.8rem 0.95rem;
        font-size: 0.9rem;
      }
      
      .cart-item {
        padding: 1rem;
      }
      
      .cart-icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.1rem;
      }
      
      .cart-item-title {
        font-size: 1rem;
      }
      
      .cart-price-value {
        font-size: 1.25rem;
      }
      
      .payment-methods-title {
        font-size: 0.95rem;
      }
      
      .payment-option {
        padding: 0.875rem;
      }
      
      .price-summary {
        padding: 1rem;
      }
      
      .price-value-total {
        font-size: 1.25rem;
      }
      
      .modal-footer {
        padding: 1.125rem 1.25rem;
      }
      
      .btn-primary {
        font-size: 0.95rem;
        padding: 0.9rem 1.15rem;
      }
      
      .date-value {
        font-size: 1rem;
      }
      
      .card-to-card-info {
        padding: 0.625rem 0.75rem;
      }
      
      .card-info-icon {
        width: 2.75rem;
        height: 2.75rem;
      }
      
      .card-info-icon svg {
        width: 20px;
        height: 20px;
      }
      
      .card-info-title {
        font-size: 1.05rem;
      }
      
      .card-info-item {
        padding: 0.625rem 0.75rem;
      }
      
      .card-info-label {
        font-size: 0.85rem;
      }
      
      .card-info-value {
        font-size: 0.9rem;
      }
      
      .card-number-box {
        padding: 0.75rem 0.625rem;
      }
      
      .card-info-value.card-number {
        font-size: 0.95rem;
        letter-spacing: 0.03em;
      }
      
      .copy-card-btn {
        font-size: 0.85rem;
        height: 2.6rem;
        padding: 0;
      }
      
      .card-info-note {
        padding: 0.75rem 0.625rem;
        font-size: 0.85rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-ai">
      <img src="https://web.sianacademy.com/MonetizeAi/%D9%84%D9%88%DA%AF%D9%88%20%D8%B1%D8%A8%D8%A7%D8%AA/1404-04-31%2014.07.20%20_1_.jpg" alt="Monetize AI Logo" />
    </div>
    
    <h1>
      <span class="brand-name">MonetizeAI</span>
      <span class="subtitle">سیستم پولسازی خودکار با هوش مصنوعی</span>
    </h1>
    
    <div class="desc">
      اولین هوش مصنوعی درآمدزایی با هوش مصنوعی
    </div>
    
    <div class="features-wrapper">
      <div class="features-list">
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">⭐️ تیم هوش مصنوعی ۱۰ نفره (۲۴/۷)</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">همه کارهایی که باید خودت انجام بدی، از ایده تا فروش، توسط یک تیم هوشمند انجام میشه؛ انگار ده‌تا متخصص همیشه پشت‌صحنه دارن برای درآمد تو کار می‌کنن.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">⚡️ ساخت سیستم پولسازی بدون مهارت</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">فقط با موبایل، مرحله‌به‌مرحله جلو می‌ری و یه سیستم درآمدزایی واقعی می‌سازی… بدون اینکه لازم باشه چیزی بلد باشی.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">🔥 اتومات‌سازی کامل مسیر درآمد</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">تولید محتوا، پیدا کردن مشتری، فالوآپ، فروش… بخش زیادی از کار کاملاً خودکار انجام میشه. تو فقط نتیجه رو می‌گیری.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">🧠 آی ای کوچ شخصی سازی شده</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">هر سؤالی داشته باشی، هر مرحله‌ای گیر کنی، مربی هوشمند شخصی‌سازی‌شده راهکار آماده می‌ده؛ انگار خود سازنده ۲۴ ساعته همراهته.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">🎯 مسیر ۹ سطحی ساخت اولین درآمد واقعی</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">به‌جای ماه‌ها سردرگمی، مسیری داری که از صفر تا رسیدن به درآمد مشخص و تست‌شده‌ست؛ فقط طبق مراحل میری جلو و نتیجه می‌گیری.</div>
        </div>
      </div>
    </div>
    
    <div class="pricebox">
      <span class="price-old">۷.۵ میلیون</span>
      <span class="price-value">۴,۹۰۰,۰۰۰ تومان</span>
      <div class="price-desc">
        فقط با <b>۴,۹۰۰,۰۰۰ تومان</b> صاحب لایف‌تایم شو!
      </div>
      <div class="discount-badge">تخفیف ویژه فقط برای ۳۰۰ نفر اول</div>
    </div>
  </div>
  
  <!-- Payment Options Link -->
  <div class="payment-options-banner">
    <a href="#" class="payment-options-link" onclick="openPaymentOptionsModal(); return false;">
      💳 کارت به کارت و خرید قسطی
    </a>
  </div>
  
  <!-- Compare Section -->
  <section class="compare-section">
    <h2>⚔️ مقایسه قبل و بعد از مانتیاز</h2>
    <div class="compare-table">
      <div class="row header">
        <div class="cell">قبل از مانتیاز</div>
        <div class="cell">بعد از مانتیاز</div>
      </div>
      <div class="row">
        <div class="cell">سردرگم، بی‌مسیر</div>
        <div class="cell">مسیر دقیق و مرحله‌به‌مرحله</div>
      </div>
      <div class="row">
        <div class="cell">شروع از صفر هر روز</div>
        <div class="cell">سیستم خودکار همیشه روشن</div>
      </div>
      <div class="row">
        <div class="cell">ایده‌های حدسی و نامطمئن</div>
        <div class="cell">ایده‌های پولساز بر اساس داده واقعی</div>
      </div>
      <div class="row">
        <div class="cell">تولید محتوا و فروش با شانس</div>
        <div class="cell">محتوا و فروش هوشمند با AI</div>
      </div>
      <div class="row">
        <div class="cell">ده تا ابزار، ده تا هزینه</div>
        <div class="cell">همه‌چیز یک‌جا، یک سیستم واحد</div>
      </div>
    </div>
    <p class="note">📌 این فقط یه آموزش نیست؛ این یه بازی جدیه که تهش پول درمیاری!</p>
  </section>
  
  <!-- Countdown Box -->
  <div class="countdownbox">
    <div class="countdown-title">⏰ فرصت ویژه فقط تا پایان تخفیف!</div>
    <div id="countdown" dir="ltr">
      <span><b id="days">0</b>روز</span>
      <span><b id="hours">08</b>ساعت</span>
      <span><b id="minutes">00</b>دقیقه</span>
      <span><b id="seconds">00</b>ثانیه</span>
    </div>
  </div>
  
  <!-- Features Section -->
  <section class="features-click-reveal">
    <h2>🧠 دقیقاً چی دریافت می‌کنی؟</h2>
    <div class="hint">روی هر کادر بزن تا بیشتر بدونی 😉</div>
    <div class="badge-grid">
      <div class="badge" data-detail="کوچ هوشمند تو کل مسیر همراهته و بهت کمک میکنه کل مسیرو بسازی">🧠 کوچ هوشمند ۲۴/۷</div>
      <div class="badge" data-detail="تنها نمی‌مونی؛ هرجا گیر کردی راهنمایی فوری داری.">🤝 پشتیبانی دائمی</div>
      <div class="badge" data-detail="اسم، ساختار، مزیت؛ کل محصولت به‌صورت اتوماتیک ساخته می‌شه.">🛠 سرویس‌ساز خودکار</div>
      <div class="badge" data-detail="نقشه دقیق از صفر تا درآمد؛ فقط اجرا می‌کنی.">🎯 مسیر ۲۹ مرحله‌ای</div>
      <div class="badge" data-detail="کجا مشتری هست و چطور باید بهش بفروشی رو نشونت می‌ده.">🔍 مشتری‌یاب فوری</div>
      <div class="badge" data-detail="یه سیستم کامل که جای تو محتوا، پیام، فالوآپ و فروش رو انجام می‌ده.">⚙️ فروش خودکار</div>
      <div class="badge" data-detail="بدون اشتراک دلاری؛ همیشه فعال و نامحدود.">🔑 چت‌جی‌پی‌تی پلاس داخلی</div>
    </div>
    <div id="feature-detail-popup" class="popup"></div>
  </section>
  
  <!-- FAQ Section -->
  <div class="faqbox">
    <div class="faq-title">سوالات پرتکرار</div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq1"><label for="faq1">واقعاً می‌تونم با این سیستم پول دربیارم؟</label>
      <div class="faq-body">بله. مانیتایز‌اِی‌آی آموزش تئوری نیست؛ یه سیستم عملیه که از انتخاب ایده تا ساخت سرویس، تولید محتوا و جذب مشتری رو اتوماتیک برات انجام می‌ده.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq2"><label for="faq2">من مهارتی ندارم؛ بازم می‌تونم؟</label>
      <div class="faq-body">کاملاً. هدف مانیتایز ای آی همینه که کل اتفاقات به دست هوش مصنوعی انجام بشه شما فقط قدم به قدم بر اساس مراحل میری جلو</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq3"><label for="faq3">هزینه‌ی ماهانه یا اشتراک دلاری داره؟</label>
      <div class="faq-body">نه. اشتراک مانیتایز‌اِی‌آی مادام‌العمره و همه ابزارها + کوچ هوشمند + مسیر ۲۹ مرحله‌ای با یک پرداخت فعال می‌شه. هیچ هزینه پنهان یا اشتراک دلاری نداره.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq4"><label for="faq4">فالوئر کم دارم؛ چطور مشتری پیدا کنم؟</label>
      <div class="faq-body">نیازی به فالوئر نیست. ابزار مشتری‌یاب فوری در مانیتایز‌اِی‌آی نشون می‌ده مشتری واقعی کجاست و چطور باید بهش برسی. فروش از فالوئر نیست؛ از نیاز بازاره.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq5"><label for="faq5">من بلد نیستم محتوا بسازم؛ چی کار کنم؟</label>
      <div class="faq-body">نگران نباش. مانیتایز‌اِی‌آی خودش محتوا تولید می‌کنه: سناریو، ایده، کپشن، ساخت ویدیو، و حتی وایرال‌سازی تو همه اینا بهت کمک میکنه. تو فقط کافی‌یه اجرا کنی.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq6"><label for="faq6">اگه وسط مسیر گیر کنم؟ پشتیبانی دارم؟</label>
      <div class="faq-body">بله. کوچ هوشمند ۲۴/۷ همیشه همراهته و هرجا گیر کردی راه رو نشون می‌ده. علاوه بر اون، پشتیبانی انسانی هم داری. هیچ‌وقت تنها نمی‌مونی.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq7"><label for="faq7">چند روز طول می‌کشه به درآمد برسم؟</label>
      <div class="faq-body">به اجرای تو بستگی داره، ولی کاربران معمولاً بین ۲۰ تا ۴۵ روز اولین فروششون رو می‌زنن. مسیر طوری طراحی شده که سریع‌ترین نتیجه ممکن رو بده.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq8"><label for="faq8">فرق این پلتفرم با دوره‌های هوش مصنوعی چیه؟</label>
      <div class="faq-body">این دوره نیست. این یه سیستم کامل پولسازیه: ابزار داره، کوچ داره، مسیر داره، اتوماسیون داره، محتوا می‌سازه، سرویس می‌سازه، فروش می‌کنه. جایی که بقیه فقط «یاد می‌دن»، مانیتایز‌اِی‌آی «می‌سازه» و «اجرا می‌کنه».</div>
    </div>
  </div>
  
  <!-- Mockup Box with Carousel -->
  <div class="mockupbox">
    <div class="mockup-title">داخل MonetizeAI چه شکلیه؟</div>
    
    <div class="carousel-container">
      <div class="carousel-wrapper">
        <div class="carousel-slide active">
          <img src="https://web.sianacademy.com/MonetizeAi/%D8%AA%D8%B5%D8%A7%D9%88%DB%8C%D8%B1%20%D8%B1%D8%A8%D8%A7%D8%AA/Screenshot-1404-08-17-at-12.57.36%20(1).png" alt= پلتفرمداشبورد ت">
          <div class="slide-caption">داشبورد پلتفرم</div>
        </div>
        <div class="carousel-slide">
          <img src="https://web.sianacademy.com/MonetizeAi/%D8%AA%D8%B5%D8%A7%D9%88%DB%8C%D8%B1%20%D8%B1%D8%A8%D8%A7%D8%AA/Screenshot-1404-08-17-at-14.17.43%20(1).png" alt="پروفایل کاربری">
          <div class="slide-caption">مراحل قدم به قدم</div>
        </div>
        <div class="carousel-slide">
          <img src="https://web.sianacademy.com/MonetizeAi/%D8%AA%D8%B5%D8%A7%D9%88%DB%8C%D8%B1%20%D8%B1%D8%A8%D8%A7%D8%AA/Screenshot-1404-08-17-at-14.18.22.png" alt="ساخت به کمک هوش مصنوعی">
          <div class="slide-caption">ساخت با هوش مصنوعی</div>
        </div>
        <div class="carousel-slide">
          <img src="https://web.sianacademy.com/MonetizeAi/%D8%AA%D8%B5%D8%A7%D9%88%DB%8C%D8%B1%20%D8%B1%D8%A8%D8%A7%D8%AA/Screenshot-1404-08-17-at-14.20.33.png" alt="مراحل آموزشی">
          <div class="slide-caption">دستیار هوش مصنوعی</div>
        </div>
        <div class="carousel-slide">
          <img src="https://web.sianacademy.com/MonetizeAi/%D8%AA%D8%B5%D8%A7%D9%88%DB%8C%D8%B1%20%D8%B1%D8%A8%D8%A7%D8%AA/Screenshot-1404-08-17-at-18.41.31%20(1).png" alt="ابزارهای هوشمند">
          <div class="slide-caption">ابزارهای هوشمند</div>
        </div>
      </div>
      
      <button class="carousel-btn prev" onclick="changeSlide(-1)">❮</button>
      <button class="carousel-btn next" onclick="changeSlide(1)">❯</button>
      
      <div class="carousel-dots">
        <span class="dot active" onclick="currentSlide(1)"></span>
        <span class="dot" onclick="currentSlide(2)"></span>
        <span class="dot" onclick="currentSlide(3)"></span>
        <span class="dot" onclick="currentSlide(4)"></span>
        <span class="dot" onclick="currentSlide(5)"></span>
      </div>
    </div>
    
    <div class="mockup-caption">
      محیط واقعی MonetizeAI؛ حس پیشرفت مثل بازی و راحتی استفاده!
    </div>
  </div>
  
  <!-- Video Reviews Section -->
  <div class="video-reviews-section">
    <div class="video-reviews-title">نظرات افراد راجع به پلتفرم و حسین عباسیان</div>
    
    <div class="video-container">
      <video controls poster="" preload="metadata">
        <source src="https://web.sianacademy.com/MonetizeAi/%D9%88%DB%8C%D8%B3%20%D8%B1%D8%B6%D8%A7%DB%8C%D8%AA%20%D9%85%D8%A7%D9%86%D8%AA%DB%8C%D8%A7%D8%B2%20ai/+%D9%88%DB%8C%D8%AF%D9%8A%D9%94%D9%88%20%D8%B1%D8%B6%D8%A7%DB%8C%D8%AA.mp4" type="video/mp4">
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>
    </div>
  </div>
  
  <!-- Footer -->
  <footer class="mainfooter">
    <div class="footer-row">
      <span>© 2025 MonetizeAI • تمامی حقوق محفوظ است.</span>
    </div>
  </footer>
  
  <!-- JavaScript -->
  <script>
    // Countdown Timer - 8 hours (always resets to 8 hours)
    (function () {
      const EIGHT_HOURS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const STORAGE_KEY = 'countdown_end_time';
      
      const $d = document.getElementById('days'),
            $h = document.getElementById('hours'),
            $m = document.getElementById('minutes'),
            $s = document.getElementById('seconds');
      
      // Get or set end time
      let endTime = localStorage.getItem(STORAGE_KEY);
      if (!endTime || Date.now() >= parseInt(endTime)) {
        // Set new end time (8 hours from now)
        endTime = Date.now() + EIGHT_HOURS;
        localStorage.setItem(STORAGE_KEY, endTime.toString());
      } else {
        endTime = parseInt(endTime);
      }
      
      function tick() {
        let diff = endTime - Date.now();
        
        // If time is up, reset to 8 hours
        if (diff <= 0) {
          endTime = Date.now() + EIGHT_HOURS;
          localStorage.setItem(STORAGE_KEY, endTime.toString());
          diff = EIGHT_HOURS;
        }
        
        const sec  = Math.floor(diff / 1000) % 60,
              min  = Math.floor(diff / 60000) % 60,
              hour = Math.floor(diff / 3600000) % 24,
              day  = Math.floor(diff / 86400000);
        
        $d.textContent = day;
        $h.textContent = hour.toString().padStart(2,'0');
        $m.textContent = min.toString().padStart(2,'0');
        $s.textContent = sec.toString().padStart(2,'0');
        
        requestAnimationFrame(tick);
      }
      tick();
    })();
    
    // Features Click Reveal
    document.querySelectorAll('.badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const text = badge.getAttribute('data-detail');
        const popup = document.getElementById('feature-detail-popup');
        popup.textContent = text;
        popup.classList.add('visible');
      });
    });
    
    // Carousel functionality
    let slideIndex = 1;
    showSlide(slideIndex);
    
    // Auto slide every 4 seconds
    setInterval(() => {
      slideIndex++;
      if (slideIndex > 5) slideIndex = 1;
      showSlide(slideIndex);
    }, 4000);
    
    function changeSlide(n) {
      showSlide(slideIndex += n);
    }
    
    function currentSlide(n) {
      showSlide(slideIndex = n);
    }
    
    function showSlide(n) {
      let slides = document.getElementsByClassName("carousel-slide");
      let dots = document.getElementsByClassName("dot");
      
      if (n > slides.length) { slideIndex = 1; }
      if (n < 1) { slideIndex = slides.length; }
      
      for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
      }
      
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
      }
      
      if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].classList.add("active");
      }
      if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active");
      }
    }
  </script>
  
  <!-- Payment Modal -->
  <div class="modal-overlay" id="paymentModal">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-header-content">
          <div>
            <h3 class="modal-title">🛒 سبد خرید</h3>
            <p class="modal-subtitle" id="modalSubtitle">تکمیل اطلاعات</p>
          </div>
          <button class="modal-close-btn" onclick="closePaymentModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="modal-body">
        <div class="modal-content">
          <!-- Step 1: User Info -->
          <div class="modal-step active" id="step1">
            <div class="form-group">
              <label class="form-label">نام و نام خانوادگی</label>
              <input type="text" class="form-input" id="userName" placeholder="نام خود را وارد کنید" required>
            </div>
            <div class="form-group">
              <label class="form-label">شماره تماس</label>
              <input type="tel" class="form-input" id="userPhone" placeholder="09xxxxxxxxx" required>
            </div>
          </div>
          
          <!-- Step 2: Cart -->
          <div class="modal-step" id="step2">
            <div class="cart-item">
              <div class="cart-item-header">
                <div class="cart-icon">⚡</div>
                <div class="flex-1">
                  <h4 class="cart-item-title">اشتراک مادام‌العمر</h4>
                  <p class="cart-item-subtitle">دسترسی کامل به تمامی امکانات</p>
                </div>
              </div>
              <div class="cart-price-row">
                <span class="cart-price-label">قیمت:</span>
                <span class="cart-price-value">۴,۹۰۰,۰۰۰ تومان</span>
              </div>
            </div>
            
            <div class="payment-methods">
              <h4 class="payment-methods-title">💳 روش پرداخت</h4>
              <div class="space-y-3">
                <label class="payment-option">
                  <input type="radio" name="payment" class="payment-radio" value="online" checked>
                  <div class="payment-option-content">
                    <div class="payment-option-title">
                      <span>پرداخت آنلاین</span>
                      <span class="payment-option-badge">(پیشنهادی)</span>
                    </div>
                    <p class="payment-option-desc">پرداخت امن با درگاه‌های معتبر</p>
                  </div>
                </label>
                <label class="payment-option">
                  <input type="radio" name="payment" class="payment-radio" value="card-to-card">
                  <div class="payment-option-content">
                    <div class="payment-option-title">
                      <span>کارت به کارت</span>
                    </div>
                    <p class="payment-option-desc">انتقال مستقیم به شماره کارت</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div class="price-summary">
              <div class="price-row">
                <span class="price-label">قیمت پلن:</span>
                <span class="price-value">۴,۹۰۰,۰۰۰ تومان</span>
              </div>
              <div class="price-row price-row-total">
                <span class="price-label price-value-total">مجموع:</span>
                <span class="price-value-total">۴,۹۰۰,۰۰۰ تومان</span>
              </div>
            </div>
            
            <!-- Card to Card Info -->
            <div class="card-to-card-info" id="cardToCardInfo" style="display: none;">
              <div class="card-info-header">
                <div class="card-info-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                    <line x1="2" x2="22" y1="10" y2="10"></line>
                  </svg>
                </div>
                <h4 class="card-info-title">اطلاعات کارت به کارت</h4>
              </div>
              <div class="card-info-content">
                <div class="card-info-item">
                  <span class="card-info-label">مبلغ قابل پرداخت:</span>
                  <span class="card-info-value">۴,۹۰۰,۰۰۰ تومان</span>
                </div>
                <div class="card-number-wrapper">
                  <div class="card-number-box">
                  <span class="card-info-value card-number">5022-2913-2547-5315</span>
                  </div>
                  <button class="copy-card-btn" onclick="copyCardNumber(this, '5022-2913-2547-5315')">
                    📋 کپی
                  </button>
                </div>
                <div class="card-info-item">
                  <span class="card-info-label">به نام:</span>
                  <span class="card-info-value">حسین عباسیان</span>
                </div>
                <div class="card-info-note">
                  <div class="card-info-note-text">بعد از واریز برای فعال‌سازی، رسید واریزی رو به این آیدی تلگرام ارسال کنید:</div>
                  <a href="https://t.me/sian_academy_support" target="_blank" rel="noopener noreferrer" class="card-info-link">@sian_academy_support</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-primary btn-next" id="nextBtn" onclick="nextStep()">ادامه</button>
          <button class="btn-primary" id="payBtn" onclick="proceedToPayment()" style="display: none;">💳 پرداخت آنلاین</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Payment Options Modal -->
  <div class="modal-overlay" id="paymentOptionsModal">
    <div class="modal-container">
      <button class="modal-close-btn" onclick="closePaymentOptionsModal()" style="position: absolute; top: 1rem; left: 1rem; z-index: 100;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
      <div class="modal-body">
        <div class="modal-content">
          <div class="payment-methods">
            <h4 class="payment-methods-title">💳 انتخاب روش پرداخت</h4>
            <div class="space-y-3">
              <label class="payment-option">
                <input type="radio" name="paymentOption" class="payment-radio" value="card-to-card" checked>
                <div class="payment-option-content">
                  <div class="payment-option-title">
                    <span>کارت به کارت</span>
                  </div>
                  <p class="payment-option-desc">پرداخت کامل یکجا</p>
                </div>
              </label>
              <label class="payment-option">
                <input type="radio" name="paymentOption" class="payment-radio" value="installment">
                <div class="payment-option-content">
                  <div class="payment-option-title">
                    <span>خرید قسطی</span>
                  </div>
                  <p class="payment-option-desc">پرداخت در دو قسط</p>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Card to Card Info -->
          <div class="card-to-card-info" id="cardToCardInfoOption">
            <div class="card-info-header">
              <div class="card-info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
              </div>
              <h4 class="card-info-title">اطلاعات کارت به کارت</h4>
            </div>
            <div class="card-info-content">
              <div class="card-info-item">
                <span class="card-info-label">مبلغ قابل پرداخت:</span>
                <span class="card-info-value">۴,۹۰۰,۰۰۰ تومان</span>
              </div>
              <div class="card-number-wrapper">
                <div class="card-number-box">
                  <span class="card-info-value card-number">5022-2913-2547-5315</span>
                </div>
                <button class="copy-card-btn" onclick="copyCardNumber(this, '5022-2913-2547-5315')">
                  📋 کپی
                </button>
              </div>
              <div class="card-info-item">
                <span class="card-info-label">به نام:</span>
                <span class="card-info-value">حسین عباسیان</span>
              </div>
              <div class="card-info-note">
                بعد از واریز برای فعال‌سازی، رسید واریزی رو به این آیدی تلگرام ارسال کنید: <a href="https://t.me/sian_academy_support" target="_blank" rel="noopener noreferrer" class="card-info-link">@sian_academy_support</a>
              </div>
            </div>
          </div>
          
          <!-- Installment Info -->
          <div class="card-to-card-info" id="installmentInfo" style="display: none;">
            <div class="card-info-header">
              <div class="card-info-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h4 class="card-info-title">خرید قسطی</h4>
            </div>
            <div class="card-info-content">
              <div class="installment-description">
                <p style="color: #E0CCFF; font-size: 0.95rem; line-height: 1.7; text-align: right; margin-bottom: 0.75rem;">
                  برای خرید قسطی، مبلغ <strong style="color: #FFD700;">۲,۴۵۰,۰۰۰ تومان</strong> به شماره کارت زیر واریز کنید. بعد از واریز، رسید را برای پشتیبانی ارسال کنید.
                </p>
              </div>
              <div class="card-info-item">
                <span class="card-info-label">مبلغ قسط اول:</span>
                <span class="card-info-value" style="color: #10b981;">۲,۴۵۰,۰۰۰ تومان</span>
              </div>
              <div class="card-number-wrapper">
                <div class="card-number-box">
                  <span class="card-info-value card-number">5022-2913-2547-5315</span>
                </div>
                <button class="copy-card-btn" onclick="copyCardNumber(this, '5022-2913-2547-5315')">
                  📋 کپی
                </button>
              </div>
              <div class="card-info-item">
                <span class="card-info-label">به نام:</span>
                <span class="card-info-value">حسین عباسیان</span>
              </div>
              <div class="installment-note-box">
                <p style="color: #fff; font-size: 0.9rem; line-height: 1.6; text-align: center; margin: 0;">
                  بعد از واریز، پلتفرم برای شما تا پرداخت قسط بعدی فعال می‌گردد
                </p>
              </div>
              <div class="card-info-note">
                بعد از واریز برای فعال‌سازی، رسید واریزی رو به این آیدی تلگرام ارسال کنید: <a href="https://t.me/sian_academy_support" target="_blank" rel="noopener noreferrer" class="card-info-link">@sian_academy_support</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-primary" onclick="proceedToPaymentOption()">📤 ارسال رسید</button>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    let currentStep = 1;
    
    function openPaymentModal() {
      document.getElementById('paymentModal').classList.add('active');
      currentStep = 1;
      showStep(1);
      
      // Add event listeners for payment methods
      setTimeout(function() {
        const paymentRadios = document.querySelectorAll('input[name="payment"]');
        paymentRadios.forEach(radio => {
          radio.removeEventListener('change', updatePaymentMethod);
          radio.addEventListener('change', function() {
            if (currentStep === 2) {
              updatePaymentMethod();
            }
          });
        });
      }, 100);
    }
    
    function closePaymentModal() {
      document.getElementById('paymentModal').classList.remove('active');
      currentStep = 1;
      showStep(1);
      // Reset form
      document.getElementById('userName').value = '';
      document.getElementById('userPhone').value = '';
    }
    
    function showStep(step) {
      document.getElementById('step1').classList.remove('active');
      document.getElementById('step2').classList.remove('active');
      document.getElementById('nextBtn').style.display = 'none';
      document.getElementById('payBtn').style.display = 'none';
      
      if (step === 1) {
        document.getElementById('step1').classList.add('active');
        document.getElementById('nextBtn').style.display = 'block';
        document.getElementById('modalSubtitle').textContent = 'تکمیل اطلاعات';
      } else {
        document.getElementById('step2').classList.add('active');
        document.getElementById('modalSubtitle').textContent = 'تکمیل خرید اشتراک';
        updatePaymentMethod();
      }
    }
    
    function updatePaymentMethod() {
      const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
      const cardToCardInfo = document.getElementById('cardToCardInfo');
      const payBtn = document.getElementById('payBtn');
      
      if (paymentMethod === 'card-to-card') {
        cardToCardInfo.style.display = 'block';
        payBtn.textContent = '📤 ارسال رسید به پشتیبانی';
        payBtn.className = 'btn-primary btn-submit-receipt';
        payBtn.style.display = 'block';
      } else {
        cardToCardInfo.style.display = 'none';
        payBtn.textContent = '💳 پرداخت آنلاین';
        payBtn.className = 'btn-primary';
        payBtn.style.display = 'block';
      }
    }
    
    function nextStep() {
      const userName = document.getElementById('userName').value.trim();
      const userPhone = document.getElementById('userPhone').value.trim();
      
      if (!userName || !userPhone) {
        alert('لطفاً نام و شماره تماس خود را وارد کنید');
        return;
      }
      
      // Validate phone number (Iranian format)
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(userPhone)) {
        alert('لطفاً شماره تماس معتبر وارد کنید (مثال: 09123456789)');
        return;
      }
      
      currentStep = 2;
      showStep(2);
    }
    
    function proceedToPayment() {
      const userName = document.getElementById('userName').value.trim();
      const userPhone = document.getElementById('userPhone').value.trim();
      const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
      
      if (paymentMethod === 'card-to-card') {
        // For card-to-card, open support link
        window.open('https://t.me/sian_academy_support', '_blank');
        alert('لطفاً رسید پرداخت را به پشتیبانی ارسال کنید.\n\nمبلغ: ۴,۹۰۰,۰۰۰ تومان\nشماره کارت: 5022-2913-2547-5315\nبه نام: حسین عباسیان');
      } else {
        // For online payment, redirect to payment gateway
        console.log('User Info:', { userName, userPhone, paymentMethod });
        alert(`در حال انتقال به درگاه پرداخت...\n\nنام: ${userName}\nشماره تماس: ${userPhone}\nروش پرداخت: پرداخت آنلاین\n\nمبلغ: ۴,۹۰۰,۰۰۰ تومان`);
        // Here you can redirect to payment gateway
        // window.location.href = 'YOUR_PAYMENT_GATEWAY_URL';
      }
    }
    
    // Close modal when clicking outside
    document.getElementById('paymentModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closePaymentModal();
      }
    });
    
    // Listen for payment method changes
    document.addEventListener('DOMContentLoaded', function() {
      const paymentRadios = document.querySelectorAll('input[name="payment"]');
      paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
          if (currentStep === 2) {
            updatePaymentMethod();
          }
        });
      });
      
      // Payment options modal listeners
      const paymentOptionRadios = document.querySelectorAll('input[name="paymentOption"]');
      paymentOptionRadios.forEach(radio => {
        radio.addEventListener('change', updatePaymentOptionDisplay);
      });
    });
    
    // Payment Options Modal Functions
    function openPaymentOptionsModal() {
      document.getElementById('paymentOptionsModal').classList.add('active');
      updatePaymentOptionDisplay();
      calculateNextInstallmentDate();
    }
    
    function closePaymentOptionsModal() {
      document.getElementById('paymentOptionsModal').classList.remove('active');
    }
    
    function updatePaymentOptionDisplay() {
      const selectedOption = document.querySelector('input[name="paymentOption"]:checked').value;
      const cardToCardInfo = document.getElementById('cardToCardInfoOption');
      const installmentInfo = document.getElementById('installmentInfo');
      
      if (selectedOption === 'card-to-card') {
        cardToCardInfo.style.display = 'block';
        installmentInfo.style.display = 'none';
      } else {
        cardToCardInfo.style.display = 'none';
        installmentInfo.style.display = 'block';
        calculateNextInstallmentDate();
      }
    }
    
    function calculateNextInstallmentDate() {
      // Convert Gregorian to Persian (Jalali) date
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      
      const gregorianToPersian = (gYear, gMonth, gDay) => {
        const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        
        if (isLeap(gYear)) gDaysInMonth[1] = 29;
        
        let pYear = gYear - 621;
        let pMonth = 3;
        let pDay = 22;
        
        let days = 0;
        for (let i = 0; i < gYear - 621; i++) {
          days += isLeap(621 + i) ? 366 : 365;
        }
        
        for (let i = 0; i < gMonth; i++) {
          days += gDaysInMonth[i];
        }
        days += gDay - 1;
        
        const persianEpoch = 226899;
        const totalDays = days - persianEpoch;
        
        pYear = Math.floor(totalDays / 365.2422) + 1;
        let remainingDays = totalDays - Math.floor((pYear - 1) * 365.2422);
        
        const persianDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
        const isPersianLeap = (year) => {
          const a = (year + 2346) % 128;
          return a < 30 || (a < 62 && a % 4 === 1) || (a >= 62 && (a - 62) % 4 === 0);
        };
        
        if (isPersianLeap(pYear)) persianDaysInMonth[11] = 30;
        
        pMonth = 1;
        while (remainingDays >= persianDaysInMonth[pMonth - 1]) {
          remainingDays -= persianDaysInMonth[pMonth - 1];
          pMonth++;
        }
        pDay = remainingDays + 1;
        
        return { year: pYear, month: pMonth, day: pDay };
      };
      
      const persianDate = gregorianToPersian(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        nextMonth.getDate()
      );
      
      const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ];
      
      const toPersian = n => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
      
      const day = toPersian(persianDate.day);
      const month = persianMonths[persianDate.month - 1];
      
      document.getElementById('installmentDateValue').textContent = `${day} ${month}`;
    }
    
    function proceedToPaymentOption() {
      // باز کردن لینک پشتیبانی تلگرام
      window.open('https://t.me/sian_academy_support', '_blank');
      closePaymentOptionsModal();
    }
    
    // Close modal when clicking outside
    document.getElementById('paymentOptionsModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closePaymentOptionsModal();
      }
    });
    
    // Copy card number function
    function copyCardNumber(button, cardNumber) {
      const cardNumberClean = cardNumber.replace(/[^\d]/g, ''); // Remove non-digits
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cardNumberClean).then(() => {
          // Show success feedback
          const originalText = button.innerHTML;
          button.innerHTML = '✓ کپی شد!';
          button.classList.add('copied');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback to old method
          fallbackCopy(cardNumberClean, button);
        });
      } else {
        // Fallback for older browsers
        fallbackCopy(cardNumberClean, button);
      }
    }
    
    function fallbackCopy(text, button) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        const originalText = button.innerHTML;
        button.innerHTML = '✓ کپی شد!';
        button.classList.add('copied');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        alert('شماره کارت: ' + text);
      }
      
      document.body.removeChild(textarea);
    }
  </script>
</body>
</html>