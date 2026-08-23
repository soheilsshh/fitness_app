// Timed comments based on video playback time
// Format: time in seconds -> array of messages

export interface TimedComment {
  username: string;
  message: string;
  isAdmin?: boolean;
  timeOffset?: number; // seconds from start of this time range
  offsetSeconds?: number; // optional alias for timeOffset
  replyToUsername?: string; // username of the message being replied to
  replyToMessage?: string; // content of the message being replied to
}

export interface TimeRange {
  start: string; // time format: "HH:MM:SS:MS"
  end: string; // time format: "HH:MM:SS:MS"
  startTimeVideo?: string; // optional alias for start
  endTimeVideo?: string; // optional alias for end
  comments: TimedComment[];
}

export const timedComments: TimeRange[] = [
  {
    start: "00:00:00:00",
    end: "00:10:00:00",
    comments: [
        { username: "مهدی نادری", message: "بچه‌ها شروع شده یا نه؟", timeOffset: 112.5 },
        { username: "سارا محمودی", message: "من تصویر دارم ولی هنوز صدا نیست", timeOffset: 131.25 },
        { username: "پژمان رفیعی", message: "به به تعداد نفراتو ماشالا بهتون🔥", timeOffset: 148 },
        { username: "هستی نیک‌پور", message: "تو استوریا گفته بود محشره، ببینیم چی میشه", timeOffset: 167 },
        { username: "بهار خالقی", message: "سلام به همگی 🙌🏻", timeOffset: 185 },
        { username: "آرمان رستگار", message: "من اولین بارمه شرکت میکنم، امیدوارم مفید باشه", timeOffset: 204 },
        { username: "زهرا ابراهیمی", message: "من دفعه قبل جا موندم… این بار از اول هستم 😭🔥", timeOffset: 222 },
        { username: "سامان کیانی", message: "کسی میدونه تا کی قراره باشه؟", timeOffset: 239 },
        { username: "الهه پاکدل", message: "خیلی وقته آقای رشیدآبادیو دنبال میکنم همیشه حرفای درست حسابی و بدرد بخوری میزنه امیدوارم این یکی هم همینطور باشه", timeOffset: 258 },
        { username: "علی رهنما", message: "صدا که هنوز نیست درسته؟", timeOffset: 276 },
        { username: "فائزه فیروزی", message: "از صبح منتظرشش بودممم", timeOffset: 295 },
        { username: "محمدرضا یاری", message: "تو کارگاه های قبلی یکی از دوستام شرکت کرده بود و برنامه تمرینیشو جدی جدی عوض کرده بود! گفت شرکت کنم منم یادبگیرم", timeOffset: 312 },
        { username: "سمیه واعظی", message: "کاش زودتر شروع شه من وسط کارم دارم نگاه می‌کنم", timeOffset: 331 },
        { username: "شایان مولایی", message: "چند دقیقه دیگه شروع میشه مثل اینکه", timeOffset: 350 },
        { username: "نرگس همتی", message: "من تنها دلیلی که اومدم اینه که گفتن سیستم آماده میده…", timeOffset: 368 },
        { username: "مهبد انصاری", message: "من قول دادم تا آخر بمونم 😂", timeOffset: 387 },
        { username: "پریا هاشمی", message: "از صبح استرس داشتم برای کارگاه 😭", timeOffset: 406 },
        { username: "امیرسام قنبری", message: "جدی جدی از هوش مصنوعی خیلیا دارن پول در میارن", timeOffset: 425 },
        { username: "کیانا رحیمی", message: "من فقط بخاطر بخش خودکارسازی اومدم ببینم چی میگه", timeOffset: 444 },
        { username: "پوریا صادقی", message: "بچه‌ها من از ترکیه دارم می‌بینم کسی مشکل سرعت داره؟", timeOffset: 462 },
        { username: "ناهید مرادی", message: "کارگاه قبلی اوایلش بودم فوق العاده بود متاسفانه کار پیش اومد رفتم این یکیو تا آخر میمونم", timeOffset: 481 },
        { username: "ارسلان جوادی", message: "کاش واقعا همون‌قدر که میگن مفید باشه", timeOffset: 500 },
        { username: "یگانه انوری", message: "من تازه رسیدم… هنوز شروع نشده؟", timeOffset: 518 },
        { username: "شهاب ایمانی", message: "های", timeOffset: 537 },
        { username: "امیرفرهاد کاظمی", message: "اگه سیستم آماده بده من همین امشب شروع میکنم", timeOffset: 556 },
        { username: "الهه سلطانی", message: "همین که لگ نداره خوبه", timeOffset: 574 },
        { username: "دانیال عباسی", message: "حس میکنم واقعا تنها راه نجاتمون همین هوش مصنوعیه!", timeOffset: 592 },
        { username: "مونا دارابی", message: "تخمه اوردم", timeOffset: 610 },
        { username: "محسن فلاح", message: "یعنی واقعاً برنامه غذایی و تمرینی اختصاصی میده؟ کسی خبر داره؟", timeOffset: 629 },
        { username: "لیلا شریفی", message: "من فقط امیدوارم یوتیوبی الکی نباشه 😭", timeOffset: 648 },
        { username: "کامران معظمی", message: "حس میکنم قراره خیلی چیزا یاد بگیریم امشب", timeOffset: 666 }
    ]
  },
  {
    start: "00:10:00:00",
    end: "00:10:04:00",
    comments: [
      { username: "علی رضایی", message: "سلاممم 🙌🏻", timeOffset: 0},
      { username: "زهرا احمدی", message: "اومدممم 😍", timeOffset: 0.5},
      { username: "محمد کریمی", message: "شروع شد؟", timeOffset: 1},
      { username: "فاطمه حسینی", message: "من دارم تصویر ولی صدا نیست", timeOffset: 1.5},
      { username: "حسین محمدی", message: "وایییی بالاخره شروع شد 😭", timeOffset: 2},
      { username: "مریم صادقی", message: "های", timeOffset: 2.5},
      { username: "رضا نوری", message: ".", timeOffset: 3},
      { username: "سارا قاسمی", message: "شروع نشده هنوز", timeOffset: 3.5},
      { username: "امیر جعفری", message: "بنظرم کارگاه خفنیه", timeOffset: 4},
    ]
  },
  {
    start: "00:10:04:00",
    end: "00:11:00:00",
    comments: [
      { username: "نگین رحیمی", message: "صدا واضحه، تصویرم عالیه", timeOffset: 0},
      { username: "مهدی موسوی", message: "سلام آقای رشیدآبادی، خیلی مشتاق بودم این کارگاه بودم", timeOffset: 6.22},
      { username: "سمیرا اکبری", message: "من از اینستا باهاتون آشنا شدم، بالاخره شرکت کردم 😅", timeOffset: 12.44},
      { username: "سینا حیدری", message: "ایشالا واقعا فرق داشته باشه با بقیه وبینارا", timeOffset: 18.67},
      { username: "مهسا فتحی", message: "مسیر واقعی یعنی چی دقیقا؟", timeOffset: 24.89},
      { username: "آرمان خان", message: "حس میکنم فرق میکنه با وبینارای دیگه", timeOffset: 31.11},
      { username: "نرگس امینی", message: "همین که دوره نمیفروشین باعث میشه تا آخر ببینم😁", timeOffset: 37.33},
      { username: "پریسا سلیمی", message: "من دفعه قبل ثبت‌نام نکردم پشیمون شدم، این بار تا آخر هستم", timeOffset: 43.56},
      { username: "کامران شریفی", message: "من دوستم معرفی کرد گفت ذهنیتش کامل عوض شده با این صبحتاشون", timeOffset: 49.78},
      { username: "الهام باقری", message: "صدای آقای رشیدآبادی عالیه، شروع کنیم دیگه", timeOffset: 56},
      { username: "ادمین", message: "ممنون ازتون، لطفاً تا آخر کارگاه بمونید چون قراره مسیر واقعی آنالیز بدنی و برنامه‌ریزی با AI مرحله‌به‌مرحله باز بشه", replyToUsername: "الهام باقری", replyToMessage: "صدای آقای رشیدآبادی عالیه، شروع کنیم دیگه", isAdmin: true, timeOffset: undefined},
    ]
  },
  {
    start: "00:11:00:00",
    end: "00:11:20:00",
    comments: [
      { username: "سعید نصیری", message: "صدا عالیه", timeOffset: 0},
      { username: "نیلوفر تقوی", message: "همه چی اوکیه ✅", timeOffset: 2},
      { username: "شایان فروغی", message: "من دارم واضح می‌شنوم", timeOffset: 4},
      { username: "فرزانه رستمی", message: "بله بله خوبه", timeOffset: 6},
      { username: "پویان یزدانی", message: "تصویر واضحه", timeOffset: 8},
      { username: "شادی هاشمی", message: "آقای رشیدآبادی صدا خیلی خوبه", timeOffset: 10},
      { username: "یاسر کیانی", message: "اوکی 👌", timeOffset: 12},
      { username: "ندا ملکی", message: "منم دارم بدون مشکل", timeOffset: 14},
      { username: "آیدا مرادی", message: "همه چی درسته", timeOffset: 16},
      { username: "شهاب علوی", message: "برای منم اوکیه", timeOffset: 18},
      { username: "فرهاد صفری", message: "الان خیلی واضح شد", timeOffset: 20},
    ]
  },
  {
    start: "00:11:20:00",
    end: "00:12:37:00",
    comments: [
      { username: "بهزاد ایرانی", message: "دقیقاً همه شدن استاد موفقیت 😒", timeOffset: 0},
      { username: "الناز خسروی", message: "حالم بهم میخوره از این مدرس های موفقیت", timeOffset: 5.5},
      { username: "کامیار سامانی", message: "دقیقا حالم از رویا فروشی بهم میخوره", timeOffset: 11},
      { username: "ناهید غفاری", message: "من خودم چند تا دوره خریدم فقط وعده بود", timeOffset: 16.5},
      { username: "سپهر بهرامی", message: "واقعاً خسته شدیم از شعارا", timeOffset: 22},
      { username: "داریوش فرهادی", message: "تو باید روشد کنی", timeOffset: 27.5},
      { username: "شیرین کاظمی", message: "خیلی مسخره شده وضعیت اینستاگرام", timeOffset: 33},
      { username: "آرش منصوری", message: "من شمارو ۳ ساله دنبال میکنم واقعا یکی از متفاوت ترین آدمایی بودین که دیدم هیچوقت رویا فروشی نکردین", timeOffset: 38.5},
      { username: "ملیکا جلالی", message: "ایول همین که اینارو دیس میکنی خوبه", timeOffset: 44},
      { username: "فرشید عباسی", message: "کاش تا آخرش همین‌طور واقعی بمونه", timeOffset: 49.5},
      { username: "لیلا زارعی", message: "👏🏻", timeOffset: 55},
      { username: "محسن طاهری", message: "ببینیم واقعا چیکار می‌کنین", timeOffset: 60.5},
      { username: "مرجان قربانی", message: "فقط شعار نباشه لطفاً", timeOffset: 66},
      { username: "سمانه رفیعی", message: "من فقط دنبال یه مسیر واقعیمید", timeOffset: 71.5},
      { username: "هادی خلیلی", message: "به امید اینکه فرق داشته باشه 🙌", timeOffset: 77},
    ]
  },
  {
    start: "00:12:38:00",
    end: "00:14:12:00",
    comments: [
      { username: "نیما حق‌شناس", message: "یعنی چی سیستم می‌دین؟ 😳", timeOffset: 0},
      { username: "شقایق باباخانی", message: "یعنی کل ابزار هایی که نیاز داریم؟", timeOffset: 6.27},
      { username: "مسعود ذوالفقاری", message: "آقای رشیدآبادی من منتظرم ببینم دقیقاً چطوریه", timeOffset: 12.53},
      { username: "راحله زمانی", message: "پشمام ایول", timeOffset: 18.8},
      { username: "امید فیروزی", message: "دمت گرم، این جمله خیلی مهم بود", timeOffset: 25.07},
      { username: "رامین شهبازی", message: "فقط شعار نباشه همینو می‌خوام", timeOffset: 31.33},
      { username: "بیتا خدایی", message: "اگه واقعا سیستم می‌دین یعنی متفاوته واقعاً", timeOffset: 37.6},
      { username: "کیوان روشن", message: "بیشتر توضیح بده!", timeOffset: 43.87},
      { username: "نازیلا شکوهی", message: "خیلی کنجکاو شدم الان", timeOffset: 50.13},
      { username: "رامتین نوروزی", message: "اگه واقعا ابزار می‌دین محشره", timeOffset: 56.4},
      { username: "مانی سلطانی", message: "فکر نکنم چطوری میخواد ابزار هارو بهمون بده؟؟", timeOffset: 62.67},
      { username: "دینا قدیری", message: "بده زودتر", timeOffset: 68.93},
      { username: "نگار صبوری", message: "آقای رشیدآبادی سیستم یعنی چی توضیح بدین لطفا", timeOffset: 75.2},
      { username: "حامد شمشیری", message: "بچه‌ها کسی می‌دونه سیستم یعنی چی دقیق؟", timeOffset: 81.47},
      { username: "پگاه ابراهیمی", message: "احتمالاً یه پلتفرم یا ابزاره اگه پلتفرم باشه خیلی خوبه", timeOffset: 87.73},
      { username: "هستی معصومی", message: "اولین باره دارم اینقدر مشتاق میشم واسه یه وبینار", timeOffset: 94},
    ]
  },
  {
    start: "00:14:12:00",
    end: "00:14:59:00",
    comments: [
      { username: "ساسان فلاحی", message: "قول می‌دم 🙌", timeOffset: 0},
      { username: "علی رضایی", message: "تا آخرش هستم", timeOffset: 2.47},
      { username: "زهرا احمدی", message: "باشه استاد ✋", timeOffset: 4.95},
      { username: "محمد کریمی", message: "قول می‌دم تا آخر بمونم", timeOffset: 7.42},
      { username: "فاطمه حسینی", message: "اگه واقعا اجرایی باشه حتما", timeOffset: 9.89},
      { username: "حسین محمدی", message: "قول می‌دم، ببینیم چی داری 😅", timeOffset: 12.37},
      { username: "مریم صادقی", message: "تلاشمو میکنم ولی قول نمیدم شرمنده🦦", timeOffset: 14.84},
      { username: "سارا قاسمی", message: "قول می‌دم، ولی انتظار دارم چیز خاصی ببینم", timeOffset: 17.32},
      { username: "امیر جعفری", message: "هستمت 👊", timeOffset: 19.79},
      { username: "نگین رحیمی", message: "باشه قول دادم", timeOffset: 22.26},
      { username: "مهدی موسوی", message: "منم قول می‌دم ❤️", timeOffset: 24.74},
      { username: "سینا حیدری", message: "قول دادم فقط ناامیدمون نکن 😅", timeOffset: 27.21},
      { username: "مهسا فتحی", message: "من هستم تا آخر استاد", timeOffset: 29.68},
      { username: "پریسا سلیمی", message: "تا آخر کارگاه باهاتم", timeOffset: 32.16},
      { username: "کامران شریفی", message: "باشه استاد، ادامه بده فقط 😍", timeOffset: 34.63},
      { username: "الهام باقری", message: "قول می‌دم چون حس می‌کنم واقعیه", timeOffset: 37.11},
      { username: "سعید نصیری", message: "قول دادم 🙋‍♀️", timeOffset: 39.58},
      { username: "نیلوفر تقوی", message: "من که ترک نمی‌کنم این کارگاهو", timeOffset: 42.05},
      { username: "شایان فروغی", message: "آره بریم تا آخرش 👏", timeOffset: 44.53},
      { username: "فرزانه رستمی", message: "قول می‌دم چون مسیرت منطقیه", timeOffset: 47},
    ]
  },
  {
    start: "00:14:59:00",
    end: "00:15:30:00",
    comments: [
      { username: "شادی هاشمی", message: "یعنی کارمند اداری هم در خطرن؟", timeOffset: 0},
      { username: "یاسر کیانی", message: "من پزشکم منم همیشه این ترسو دارم", timeOffset: 3.88},
      { username: "ندا ملکی", message: "آقای رشیدآبادی منظور شغل‌هاست یا نقش‌ها؟", timeOffset: 7.75},
      { username: "آیدا مرادی", message: "من برنامه‌نویسم، واقعاً داره اتفاق میفته پروژه بهم نمیدن خیلی وقته میگن هوش مصنوعی انجام میده…", timeOffset: 11.63},
      { username: "شهاب علوی", message: "اگه یادبگیرم هنوز فرصت هست؟", timeOffset: 15.5},
      { username: "فرهاد صفری", message: "واقعا می‌گیره یا کسی که AI بلد نیست رو می‌گیره؟", timeOffset: 19.38},
      { username: "مینا پارسا", message: "واقعا جمله خیلی ترسناکه", timeOffset: 23.25},
      { username: "بهزاد ایرانی", message: "من گرافیستم شغل منو که واقعا نابود کرد:)", timeOffset: 27.13},
      { username: "الناز خسروی", message: "بیشتر تهدید یا فرصت؟", timeOffset: 31},
    ]
  },
  {
    start: "00:15:30:00",
    end: "00:17:16:00",
    comments: [
      { username: "ناهید غفاری", message: "واقعاً همین الانش داره اتفاق می‌افته", timeOffset: 0},
      { username: "نازنین توکلی", message: "یعنی واقعاً شغل‌هامونو می‌گیرن؟", timeOffset: 7.57},
      { username: "داریوش فرهادی", message: "من تولید محتوام، مشتریام کم شدن از وقتی چت جی پی تی اومده", timeOffset: 15.14},
      { username: "آرش منصوری", message: "یه نفر تو شرکتمون باعث شد ۳ نفر اخراج بشن چون کارای اون ۳ نفرم با هوش مصنوعی میزد!!!!!", timeOffset: 22.71},
      { username: "ملیکا جلالی", message: "بله، فقط اونایی که بلدن ازش پول بسازن برنده‌ان", timeOffset: 30.29},
      { username: "لیلا زارعی", message: "هوش مصنوعی افسردم کرده…", timeOffset: 37.86},
      { username: "محسن طاهری", message: "این جمله رو باید قاب کرد زد رو دیوار", timeOffset: 45.43},
      { username: "پوریا صالحی", message: "من با n8n تازه یادگرفتم اکثر کارهامو اتوماتیک کردم پشم ریزونه", timeOffset: 53},
      { username: "گلنار مهدوی", message: "خیلی نامردیه الان کسی که تخصصش از منی که سالها برنامه نویسی کردم کمتره داره پول بیشتری در میاره چون با هوش مصنوعی بلده کار کنه!", timeOffset: 60.57},
      { username: "سمانه رفیعی", message: "استاد، میشه بگید اونایی که بلدن دقیقاً چی بلدن؟", timeOffset: 68.14},
      { username: "هادی خلیلی", message: "واقعاً، من دو ساله می‌خوام شروع کنم ولی فقط نگاه کردم", timeOffset: 75.71},
      { username: "نیما حق‌شناس", message: "در نهایت هوش مصنوعی هممون رو نابود میکنه", timeOffset: 83.29},
      { username: "شقایق باباخانی", message: "اصلا نمیدونم از کجا باید شروع کنم", timeOffset: 90.86},
      { username: "مسعود ذوالفقاری", message: "واقعیت همینه، هرکی یاد نگیره حذف میشه", timeOffset: 98.43},
      { username: "راحله زمانی", message: "استاد، لطفاً یه مثال واقعی از درآمد بگو", timeOffset: 106},
    ]
  },
  {
    start: "00:17:16:00",
    end: "00:18:02:00",
    comments: [
      { username: "امیررضا کریمی", message: "من فعلاً تو اون ۹۹٪م متاسفانه", timeOffset: 0},
      { username: "سارا احمدی", message: "دقیقاً خودمم حس کردم فقط دارم تماشا می‌کنم", timeOffset: 3.83},
      { username: "فاطمه نوری", message: "من جزو اون ۱٪ می‌خوام باشم 💪", timeOffset: 7.67},
      { username: "زهرا صادقی", message: "دردناکه ولی درسته، اکثر ما فقط مصرف‌کننده‌ایم", timeOffset: 11.5},
      { username: "حسین علیزاده", message: "من از صبح تا شب دارم Reels می‌بینم در مورد AI، ولی کاری نکردم", timeOffset: 15.33},
      { username: "رضا کاظمی", message: "تو هر دوره‌ای برنده‌ها اقلیتن، اینم از هموناست", timeOffset: 19.17},
      { username: "نرگس جعفری", message: "من حس جاموندن دارم", timeOffset: 23},
      { username: "امیرحسین طاهری", message: "من جز اون یه درصدم", timeOffset: 26.83},
      { username: "سمیرا رحیمی", message: "آقای رشیدآبادی لطفاً بگو چطوری جزو اون ۱٪ بشیم؟", timeOffset: 30.67},
      { username: "مهسا شریفی", message: "یه نقشه عملی برای جزو اون ۱٪ شدن بده", timeOffset: 34.5},
      { username: "الهام رستمی", message: "۹۹٪ هنوز نمی‌دونن چی رو دارن از دست می‌دن", timeOffset: 38.33},
      { username: "سعید نجفی", message: "اگه جزو اون ۱٪ نشیم، به زودی استخدامشون میشیم 😶", timeOffset: 42.17},
      { username: "نیلوفر اکبری", message: "آقای رشیدآبادی، تو همون ۱٪‌ی، یاد بده ما هم بشیم 🙌", timeOffset: 46},
    ]
  },
  {
    start: "00:18:02:00",
    end: "00:19:11:00",
    comments: [
      { username: "شایان محمودی", message: "یادمه اون موقع هیچ‌کس جدی نمی‌گرفت اینترنت رو", timeOffset: 0},
      { username: "فرزانه یوسفی", message: "واقعاً شبیه همونه، فقط فرقش اینه الان سرعت دیوونه‌کننده‌ست", timeOffset: 5.75},
      { username: "شادی مهدوی", message: "دقیقا تاریخ همیشه تکرار میشه", timeOffset: 11.5},
      { username: "یاسر نادری", message: "منم حس اون دوران رو دارم، انگار یه موج جدید داره شکل می‌گیره", timeOffset: 17.25},
      { username: "ندا رضوی", message: "واقعاً فرصت قرن همینه", timeOffset: 23},
      { username: "آیدا صالحی", message: "دقیقاً مثل روزای اول یوتیوب و اینستا", timeOffset: 28.75},
      { username: "شهاب کرمانی", message: "سنی ازم گذشته ولی اون موقع شروع نکردم، دیگه تکرار نمی‌کنم این اشتباه رو", timeOffset: 34.5},
      { username: "فرهاد رضوانی", message: "استاد این تشبیه عالی بود", timeOffset: 40.25},
      { username: "مهدی صفری", message: "من یادمه اولین بار که دیدم یاهو مسنجر اومده، هیچ‌کس باورش نمی‌کرد 😅", timeOffset: 46},
      { username: "محمدعلی نوری", message: "منم مثل اون موقع حس می‌کنم فقط یه اقلیت دارن جدی می‌گیرن", timeOffset: 51.75},
      { username: "حسین‌رضا احمدی", message: "همیشه نسل بعد می‌فهمه چی از دست داده", timeOffset: 57.5},
      { username: "امیرمحمد رضایی", message: "هوش مصنوعی خیلی خفن تر از اینترنته", timeOffset: 63.25},
      { username: "سارا محمدی", message: "اصل پول اینترنتو بلاگرا در اوردن 😂", timeOffset: 69},
    ]
  },
  {
    start: "00:19:11:00",
    end: "00:19:57:00",
    comments: [
      { username: "فاطمه احمدی", message: "الان سرعت رشد AI هزار برابر اینترنته", timeOffset: 0},
      { username: "زهرا رضایی", message: "استاد فرقش همینه دیگه، الان فرصت کمتره 😐", timeOffset: 3.83},
      { username: "مریم موسوی", message: "اون موقع اگه دیر شروع می‌کردی، هنوز وقت داشتی، الان نداری", timeOffset: 7.67},
      { username: "نرگس جعفری", message: "یعنی الان باید بدوی، نه راه بری اونم با این وضعیت مملکت", timeOffset: 11.5},
      { username: "مهسا شریفی", message: "لرزه افتاد به جونم از دست این هوش مصنوعی", timeOffset: 15.33},
      { username: "پریسا امینی", message: "این یکی دیگه آخرین فرصته", timeOffset: 19.17},
      { username: "نیلوفر اکبری", message: "الان هر روز یه ابزار جدید درمیاد 😳", timeOffset: 23},
      { username: "ندا رضوی", message: "فرقش اینه که اون موقع یادگیری زمان‌بر بود الان همه کارو خود هوش مصنوعی انجام میده", timeOffset: 26.83},
      { username: "آیدا صالحی", message: "واقعاً درسته، الان همه‌چیز اتوماتیک‌تره", timeOffset: 30.67},
      { username: "شادی مهدوی", message: "آره اون موقع ۱۰ سال طول کشید اینترنت همه‌گیر شه الان ۶ ماه 😳", timeOffset: 34.5},
      { username: "فرزانه یوسفی", message: "بگو تروخدا چطوری ازش استفاده کنیم", timeOffset: 38.33},
      { username: "شایان محمودی", message: "واقعاً با اینترنت قابل مقایسه نیست، این یکی همه‌چیو می‌بلعه", timeOffset: 42.17},
      { username: "پویان حسینی", message: "الان حس می‌کنم عقب افتادن دیگه جبران نداره", timeOffset: 46},
    ]
  },
  {
    start: "00:19:57:00",
    end: "00:20:27:00",
    comments: [
      { username: "مهدی صفری", message: "دقیقا منم همیشه تماشا کردم، بسه دیگه 😐", timeOffset: 0},
      { username: "علی‌رضا فتحی", message: "سخته بابا اصلا نمیدونم از کجا باید شروع کنم", timeOffset: 4.29},
      { username: "حسین‌رضا احمدی", message: "تماشاچی باشی کنسله", timeOffset: 8.57},
      { username: "امیرمحمد رضایی", message: "تو هر دوره‌ ای از تاریخ تماشاچیا بازنده‌ بودن", timeOffset: 12.86},
      { username: "امیررضا کریمی", message: "منم اون تماشاچیم که حالش از تماشاچی بهم میخوره", timeOffset: 17.14},
      { username: "محمدحسین رضایی", message: "اکثرا تماشاچین چون امن ترین انتخابه🤦‍♂️", timeOffset: 21.43},
      { username: "علی محمدی", message: "من خودم یه شرکت دارم همه کارمندام هوش مصنوعیه و واقعا دارم پول در میارم", timeOffset: 25.71},
      { username: "زهرا صادقی", message: "شروع کن زودتر هیجان دارم", timeOffset: 30},
    ]
  },
  {
    start: "00:20:27:00",
    end: "00:21:33:00",
    comments: [
      { username: "حسین علیزاده", message: "اوکی شما به ما یه مسیر قدم به قدم درست بده کیه که نره", timeOffset: 0},
      { username: "مریم موسوی", message: "والا همه تا الان شعار میدادن هیچکس مسیر درست بهمون نداده", timeOffset: 16.5},
      { username: "رضا کاظمی", message: "واقعاً تو این سالا فقط دور باطل بودم", timeOffset: 33},
      { username: "امیرحسین طاهری", message: "مشکل اینکه تو ایرانیم", timeOffset: 49.5},
      { username: "سمیرا رحیمی", message: "کل مسیر زندگیم حس میکنم اشتباه بوده", timeOffset: 66},
    ]
  },
  {
    start: "00:21:33:00",
    end: "00:22:46:00",
    comments: [
      { username: "مهسا شریفی", message: "آقای رشیدآبادی دمت گرم، از همونا نیستی که فقط حرف می‌زنن", timeOffset: 0},
      { username: "آرمان قاسمی", message: "من از همون اول حس کردم این کارگاه فرق داره", timeOffset: 7.3},
      { username: "پریسا امینی", message: "آره واقعاً معلومه عملی کار کردی نه تئوری", timeOffset: 14.6},
      { username: "الهام رستمی", message: "چند ساله دنبالش میکنم آدم درستیه 🔥", timeOffset: 21.9},
      { username: "سعید نجفی", message: "اینجا فرقشو با بقیه حس کردم", timeOffset: 29.2},
      { username: "نیلوفر اکبری", message: "باور هاتو باور کن😂", timeOffset: 36.5},
      { username: "شایان محمودی", message: "از لحن و انرژی‌ت معلومه آدم پخته‌ای هستی", timeOffset: 43.8},
      { username: "فرزانه یوسفی", message: "من انقدر حرف انگیزشی شنیدم که بیزار شدم", timeOffset: 51.1},
      { username: "شادی مهدوی", message: "ببینم واقعا همینی که میگی هستی یا ن!", timeOffset: 58.4},
      { username: "یاسر نادری", message: "من عاشق جدیتت شدم 😅", timeOffset: 65.7},
      { username: "ندا رضوی", message: "واقعاً انرژی واقعی داره این کارگاه دمتون گرم بابت کامنتای پر انرژیتون", timeOffset: 73},
    ]
  },
  {
    start: "00:22:46:00",
    end: "00:25:40:00",
    comments: [
      { username: "آیدا صالحی", message: "دقیقاً همینه 😔", timeOffset: 0},
      { username: "مهدی صفری", message: "من هر روز همینو تجربه می‌کنم", timeOffset: 13.38},
      { username: "علی‌رضا فتحی", message: "هیچکس مثل آدمی که میدونه چقدر پتانسیل داره و ازش استفاده نمیکنه حالش بد نیس", timeOffset: 26.77},
      { username: "محمدعلی نوری", message: "من هر شب با همین فکر می‌خوابم که چرا نمی‌تونم نزدیک شم", timeOffset: 40.15},
      { username: "حسین‌رضا احمدی", message: "دقیقاً حس بن‌بست با امید همزمان 😔", timeOffset: 53.54},
      { username: "امیرمحمد رضایی", message: "استاد، من چند ساله تو همین چرخه‌ام", timeOffset: 66.92},
      { username: "امیررضا کریمی", message: "دردِ امیدِ بی‌نتیجه… تلخ‌ترین حسه", timeOffset: 80.31},
      { username: "فاطمه نوری", message: "خیلی چرخه مزخرفیه", timeOffset: 93.69},
      { username: "علی محمدی", message: "آره، درد واقعی اینه که امید داری ولی راه نه", timeOffset: 107.08},
      { username: "زهرا صادقی", message: "منم هزار بار این حس رو تجربه کردم", timeOffset: 120.46},
      { username: "حسین علیزاده", message: "خیلیا الان تو این حلقه گیر کردن", timeOffset: 133.85},
      { username: "مریم موسوی", message: "منم انگیزه دارم، منم میخوام ولی چرا نمیتونم؟:)", timeOffset: 147.23},
      { username: "نرگس جعفری", message: "همه‌ی ما می‌تونستیم ولی خب اینجا ایرانه", timeOffset: 160.62},
      { username: "امیرحسین طاهری", message: "با دلار نزدیک ۱۲۰ هزارتومن ده برابر این حس بدتره", timeOffset: 174},
    ]
  },
  {
    start: "00:25:40:00",
    end: "00:27:37:00",
    comments: [
      { username: "سینا باقری", message: "آره استاد، دقیقاً مسیر نداشتم… فقط می‌دویدیم", timeOffset: 0},
      { username: "مهسا شریفی", message: "مشکل اینکه تنبلیم", timeOffset: 23.4},
      { username: "پریسا امینی", message: "آره دقیقاً، بدون مسیر فقط خسته می‌شی", timeOffset: 46.8},
      { username: "الهام رستمی", message: "همه‌ی شکستای من از بی‌عرضگیم بوده! همین", timeOffset: 70.2},
      { username: "سعید نجفی", message: "مسیر اشتباه داشتن از نداشتن مسیر بدتره بنظرم", timeOffset: 93.6},
      { username: "نیلوفر اکبری", message: "منم دقیقاً دنبال یه مسیر درست حسابیم", timeOffset: 117},
    ]
  },
  {
    start: "00:27:37:00",
    end: "00:29:03:00",
    comments: [
      { username: "فرزانه یوسفی", message: "ریدم تو کل تایمای زندگیم حس میکنم", timeOffset: 0},
      { username: "پویان حسینی", message: "۹۰ درصد زندگیم سر مسیرای چرتو پرت تلف شده الان ۴۷ سالم شده هیچی به هیچ", timeOffset: 12.29},
      { username: "شادی مهدوی", message: "واقعاً هیچی مثل وقت تلف‌شده آدمو داغون نمیکنه", timeOffset: 24.57},
      { username: "یاسر نادری", message: "مهم ترین چیزی که داریم زمانه وقتی اینو میفهمی که ۵۰ سالت میگذره…", timeOffset: 36.86},
      { username: "آیدا صالحی", message: "عمرم رو دادم واسه مسیرای احمقانه ای که بقیه بهم گفته بودن", timeOffset: 49.14},
      { username: "فرهاد رضوانی", message: "پول برمی‌گرده، زمان نه", timeOffset: 61.43},
      { username: "مهدی صفری", message: "واقعاً باید بجنبم قبل از اینکه دوباره دیر ش", timeOffset: 73.71},
      { username: "علی‌رضا فتحی", message: "وقت تلف‌شده بدترین بدهیه زندگیه", timeOffset: 86},
    ]
  },
  {
    start: "00:29:03:00",
    end: "00:29:38:00",
    comments: [
      { username: "حسین‌رضا احمدی", message: "دقیقاً مسیر اشتباه، انگیزه رو هم می‌کشه", timeOffset: 0},
      { username: "امیرمحمد رضایی", message: "من سال‌ها فکر می‌کردم بی‌عرضه‌ام، ولی فقط مسیرم اشتباه بود", timeOffset: 17.5},
      { username: "امیررضا کریمی", message: "مسیر غلط باعث ناامیدی میشه", timeOffset: 35},
    ]
  },
  {
    start: "00:29:38:00",
    end: "00:30:03:00",
    comments: [
      { username: "سارا احمدی", message: "اره بریم سراغ اصل مطلب", timeOffset: 0},
      { username: "محمدحسین رضایی", message: "مسیر نشون بده لطفا", timeOffset: 12.5},
      { username: "فاطمه نوری", message: "به‌جاش باید بریم دنبال راه‌حل", timeOffset: 25},
    ]
  },
  {
    start: "00:30:03:00",
    end: "00:30:51:00",
    comments: [
      { username: "زهرا صادقی", message: "آره والله همین آزادی مهم‌تر از پوله", timeOffset: 0},
      { username: "حسین علیزاده", message: "پول وسیله‌ست آزادی هدفه", timeOffset: 8},
      { username: "مریم موسوی", message: "پول بدون آزادی به درد نمیخوره", timeOffset: 16},
      { username: "رضا کاظمی", message: "دقیقاً  آزادی واقعی یعنی انتخاب", timeOffset: 24},
      { username: "نرگس جعفری", message: "پول مهم ترین چیز دنیاس بنظرم", timeOffset: 32},
      { username: "سینا باقری", message: "خیلی منطقی صحبت میکنی خیلی خوبه 👌🏼", timeOffset: 40},
      { username: "مهسا شریفی", message: "اینارو باید توی مدارس درس بدن واقعاً", timeOffset: 48},
    ]
  },
  {
    start: "00:30:51:00",
    end: "00:31:34:00",
    comments: [
      { username: "آرمان قاسمی", message: "دقیقا پول همیشه از به یه دردی خوردنه", timeOffset: 0},
      { username: "کامران فرهادی", message: "مثل بابک زنجانی که مسئله فروش نفت ایرانو حل کرد 😂", timeOffset: 3.91},
      { username: "الهام رستمی", message: "همینه دقیقاً، حل مسئله یعنی خلق ارزش", timeOffset: 7.82},
      { username: "سعید نجفی", message: "دقیقا مثلا من اسنپم مشکل رفت و آمد مردمو حل میکنم 😂", timeOffset: 11.73},
      { username: "نیلوفر اکبری", message: "همینه دقیقاً، حل مسئله یعنی ارزش", timeOffset: 15.64},
      { username: "شایان محمودی", message: "پول از حل درده دقیقا", timeOffset: 19.55},
      { username: "یاسر نادری", message: "درست گفتی، اگه مسئله‌ای حل نکنی دلیلی نداره کسی بهت پول بده", timeOffset: 23.45},
      { username: "آیدا صالحی", message: "منم هر وقت مشکلی حل کردم درآمد داشتم", timeOffset: 27.36},
      { username: "شهاب کرمانی", message: "واقعاً همینه پول = راه‌حل", timeOffset: 31.27},
      { username: "فرهاد رضوانی", message: "اینو اگه ملت بفهمن نصف مشکلات کشور حل میشه و دیگه ملت دنبال مفت خوری نیستن!", timeOffset: 35.18},
      { username: "مهدی صفری", message: "آفرین دقیقاااا منم از وقتی تمرکزم رفت روی حل مشکل مشتریام فروشم چند برابر شد", timeOffset: 39.09},
      { username: "علی‌رضا فتحی", message: "دقیقاً همینه، اگه درد مردم رو بفهمی، پول میاد خودش", timeOffset: 43},
    ]
  },
  {
    start: "00:31:34:00",
    end: "00:33:34:00",
    comments: [
      { username: "محمدعلی نوری", message: "آره واقعاً، هرکسی یه مسئله‌ای حل می‌کنه", timeOffset: 0},
      { username: "حسین‌رضا احمدی", message: "همیشه همین بوده، هرکسی یه دردی رو درمان می‌کنه", timeOffset: 10},
      { username: "امیرمحمد رضایی", message: "چون مفیدن، نه فقط فعالن", timeOffset: 20},
      { username: "امیررضا کریمی", message: "کسی که درد مردم رو می‌فهمه همیشه پول داره", timeOffset: 30},
      { username: "سارا احمدی", message: "ضبط میشه کارگاه؟", timeOffset: 40},
      { username: "محمدحسین رضایی", message: "منم کارمند بانکم نیازات بانکی مردمو حل میکنم", timeOffset: 50},
      { username: "فاطمه نوری", message: "واسه همینه هرکسی جنس و محصول کاربردی تری میاره تو بازار بیشتر پول در میاره و میفروشه", timeOffset: 60},
      { username: "علی محمدی", message: "ساقیم مشکل مواد مردمو حل میکنم 😂", timeOffset: 70},
      { username: "زهرا صادقی", message: "این حرفا پایه‌ی اقتصاده، آفرین 👏🏻", timeOffset: 80},
      { username: "حسین علیزاده", message: "منم تو کارم دیدم هرجا مشکل مشتری رو درست حل کردم برکتش برمیگرده به زندگی آدم", timeOffset: 90},
      { username: "مریم موسوی", message: "یعنی تو هر کاری میشه ثروتمند شد اگه نگاه حل مسئله داشته باشی", timeOffset: 100},
      { username: "رضا کاظمی", message: "من این جمله رو یادداشت کردم", timeOffset: 110},
      { username: "امیرحسین طاهری", message: "منی که لباس میفروشم یه مسئله رو حل میکنم؟", timeOffset: 120},
    ]
  },
  {
    start: "00:33:34:00",
    end: "00:34:15:00",
    comments: [
      { username: "سمیرا رحیمی", message: "مثل اسنپ که سوپر میلیادر شده چون مشکل چندین میلیون ایرانیو حل کرده تو  حمل نقل و غذا", timeOffset: 0},
      { username: "سینا باقری", message: "دقیقااااا همین 👏🏻👏🏻👏🏻", timeOffset: 5.13},
      { username: "مهسا شریفی", message: "مشکل از کجا پیدا کنیم؟", timeOffset: 10.25},
      { username: "آرمان قاسمی", message: "کاش ۵ سال پیش اینو می‌فهمیدم…🙂", timeOffset: 15.38},
      { username: "پریسا امینی", message: "بهترین جمله کارگاه تا اینجا 👌🏻", timeOffset: 20.5},
      { username: "کامران فرهادی", message: "نیاز مردم مهم ترین چیزه واقعا همه کاسبای درست حسابی اینو میدونن", timeOffset: 25.63},
      { username: "سعید نجفی", message: "هرچی مسئله مهم تریم از آدما حل کنی پول بیشتری میتونی بگیری مثل دکترا", timeOffset: 30.75},
      { username: "نیلوفر اکبری", message: "اگه بشه با هوش مصنوعی مسئله مردمو حل کرد خیلی خوب میشه", timeOffset: 35.88},
      { username: "شایان محمودی", message: "همش چرتو پرت شندیم از مدرس ها ایشون خیلی درست دارن میگن دقیقا همینه ولی خب چطوری مسائلو پیدا کنیمو حل کنیم؟", timeOffset: 41},
    ]
  },
  {
    start: "00:34:15:00",
    end: "00:34:36:00",
    comments: [
      { username: "فرزانه یوسفی", message: "هر چی ابزار بهتر، زندگی راحت‌تر", timeOffset: 0},
      { username: "پویان حسینی", message: "ماشین شد ابزار حل مسئله تو جابه‌جایی", timeOffset: 4.2},
      { username: "شادی مهدوی", message: "آفرین عجب مثال هایی", timeOffset: 8.4},
      { username: "یاسر نادری", message: "همه چی از نیاز شروع میشه", timeOffset: 12.6},
      { username: "ندا رضوی", message: "دقیقا هر وسیله ای دور ورم میبینیم یه دردیو دوا میکنه", timeOffset: 16.8},
      { username: "شهاب کرمانی", message: "این بخش خیلی ذهن باز کرد", timeOffset: 21},
    ]
  },
  {
    start: "00:34:36:00",
    end: "00:35:46:00",
    comments: [
      { username: "مهدی صفری", message: "چقدر خوشحالم زمانی دارم زندگی میکنم که هوش مصنوعی وجود داره", timeOffset: 0},
      { username: "محمدعلی نوری", message: "انسان تنبل برای هر مشکلی یه ابزار میسازه", timeOffset: 5.83},
      { username: "حسین‌رضا احمدی", message: "گوشی خودش یه ابر ابزار مسئله‌حله", timeOffset: 11.67},
      { username: "امیرمحمد رضایی", message: "الان سرعت حل مسئله شده مهم‌ترین چیز حتی تو نونوایی", timeOffset: 17.5},
      { username: "محمدحسین رضایی", message: "هوش مصنوعی داره جای مغز رو می‌گیره", timeOffset: 23.33},
      { username: "فاطمه نوری", message: "کشاورزی هم خودش یه ابزار بود برای حل گرسنگی", timeOffset: 29.17},
      { username: "علی محمدی", message: "استاد دمت گرم، خیلی ساده ولی عمیق توضیح میدی", timeOffset: 35},
      { username: "زهرا صادقی", message: "الان طلایی‌ترین ابزار همین هوش مصنوعیه", timeOffset: 40.83},
      { username: "حسین علیزاده", message: "من خسته‌م از تماشا کردن", timeOffset: 46.67},
      { username: "مریم موسوی", message: "همیشه پیشگاما تاریخ‌ساز شدن", timeOffset: 52.5},
      { username: "رضا کاظمی", message: "من سال‌ها فقط شاهد موفقیت بقیه بودم", timeOffset: 58.33},
      { username: "نرگس جعفری", message: "همیشه تو دلم بوده پیشگام باشم ولی شرایطش نبوده", timeOffset: 64.17},
      { username: "امیرحسین طاهری", message: "کل تفاوت زندگی تو همین انتخابه", timeOffset: 70}
    ]
  },
  {
    start: "00:35:46:00",
    end: "00:37:19:00",
    comments: [
      { username: "سمیرا رحیمی", message: "یعنی الان وسط انقلابیم؟", timeOffset: 0},
      { username: "سینا باقری", message: "هوش مصنوعی مثل یه مغز باهوش تر عمل میکنه", timeOffset: 8.45},
      { username: "مهسا شریفی", message: "من تازه فهمیدم چرا همه درباره هوش مصنوعی حرف می‌زنن", timeOffset: 16.91},
      { username: "آرمان قاسمی", message: "هوش مصنوعی داره دنیارو میگیره", timeOffset: 25.36},
      { username: "کامران فرهادی", message: "هرکی استفاده نکنه حذف میشه", timeOffset: 33.82},
      { username: "الهام رستمی", message: "باید ازش پول دربیاریم نه بترسیم", timeOffset: 42.27},
      { username: "سعید نجفی", message: "واقعا هوش مصنوعی برگ ریزوووون خفن", timeOffset: 50.73},
      { username: "نیلوفر اکبری", message: "مثل وقتی که گوشی اومد همه چیز عوض شد", timeOffset: 59.18},
      { username: "شایان محمودی", message: "چه جمله قشنگی، انقلاب حل مسئله", timeOffset: 67.64},
      { username: "فرزانه یوسفی", message: "تو هر انقلابی یه عده همیشه نابود شدن", timeOffset: 76.09},
      { username: "پویان حسینی", message: "اونایی که دیر می‌فهمن فقط مصرف‌کننده می‌شن", timeOffset: 84.55},
      { username: "یاسر نادری", message: "تو این دوران طلایی باختن گناه بزرگیه", timeOffset: 93},
    ]
  },
  {
    start: "00:37:19:00",
    end: "00:37:49:00",
    comments: [
      { username: "آیدا صالحی", message: "آره واقعاً فهمیدم باید مسئله حل کنم نه محتوا بسازم فقط", timeOffset: 0},
      { username: "شهاب کرمانی", message: "دمت گرم استاد، درس اصلی همین بود", timeOffset: 3},
      { username: "فرهاد رضوانی", message: "الان انگیزه‌ام ده برابر شد 💪", timeOffset: 6},
      { username: "علی‌رضا فتحی", message: "پول = حل مسئله حک شد تو ذهنم", timeOffset: 9},
      { username: "محمدعلی نوری", message: "بنظرم با هوش مصنوعی میشه هر مسئله رو واقعا حل کرد یا کمک کرد بهتر حل بش", timeOffset: 12},
      { username: "حسین‌رضا احمدی", message: "الان می‌فهمم چرا تا حالا پول در نمیوردم", timeOffset: 15},
      { username: "امیرمحمد رضایی", message: "چقدر مهم بود این نکته", timeOffset: 18},
      { username: "امیررضا کریمی", message: "به‌معنی واقعی کلمه آنلاک شدم 😅", timeOffset: 21},
      { username: "سارا احمدی", message: "الان فقط باید مشکل پیدا کنم و حلش کنم به کمک هوش مصنوعی منتظرم کامل توضیح بدی", timeOffset: 24},
      { username: "محمدحسین رضایی", message: "فقط باید راه‌حل ساخت و فروخت", timeOffset: 27},
      { username: "فاطمه نوری", message: "خیلی خوشحالم اینجا هستم 🙌", timeOffset: 30},
    ]
  },
  {
    start: "00:37:49:00",
    end: "00:38:24:00",
    comments: [
      { username: "علی محمدی", message: "ترکیبشون ترسناک و هیجان‌انگیزه", timeOffset: 0},
      { username: "زهرا صادقی", message: "یعنی هر مشکلی؟ حتی مشکل مشتری گرفتن؟", timeOffset: 2.92},
      { username: "رضا کاظمی", message: "جدی اگه اینقدر قویه چرا همه استفاده نمی‌کنن؟", timeOffset: 5.83},
      { username: "ادمین", message: "چون اکثر افراد فقط «مصرف‌کننده» هستن، «سازنده» نیستن", replyToUsername: "رضا کاظمی", replyToMessage: "جدی اگه اینقدر قویه چرا همه استفاده نمی‌...", isAdmin: true, timeOffset: 8.75},
      { username: "نرگس جعفری", message: "کسی اینجا تونسته با AI پروژه بگیره؟", timeOffset: 11.67},
      { username: "امیرحسین طاهری", message: "من هنوز نمی‌دونم چه مسئله‌ای حل کنم 😐", timeOffset: 14.58},
      { username: "سمیرا رحیمی", message: "از دوروبرت شروع کن، مشکلات واقعی مردم", timeOffset: 17.5},
      { username: "سینا باقری", message: "آره دقیقاً هر مشکلی یه فرصته", timeOffset: 20.42},
      { username: "مهسا شریفی", message: "من تو کارم از AI کمک گرفتم، نتیجه بهتر شد واقعاً", timeOffset: 23.33},
      { username: "آرمان قاسمی", message: "استاد یعنی AI جایگزین ما نمی‌شه، با ما کامل میشه؟", timeOffset: 26.25},
      { username: "پریسا امینی", message: "اگه اینو یکی دو سال پیش می‌گفتن مسخره می‌کردیم 😅", timeOffset: 29.17},
      { username: "ادمین", message: "بله اگر «تعریف درست از مشکل» داشته باشید", replyToUsername: "پریسا امینی", replyToMessage: "اگه اینو یکی دو سال پیش می‌گفتن مسخره می...", isAdmin: true, timeOffset: 32.08},
      { username: "الهام رستمی", message: "البته هنوز خیلیا می‌ترسن ازش", timeOffset: 35},
      { username: "نیلوفر اکبری", message: "قدم اول چیه؟ فقط یه سرویس بسازیم؟", timeOffset: undefined},
      { username: "ادمین", message: "بله، سرویس ساده که مشکل حل کنه، نه پیچیده", replyToUsername: "نیلوفر اکبری", replyToMessage: "قدم اول چیه؟ فقط یه سرویس بسازیم؟", isAdmin: true, timeOffset: undefined},
      { username: "یاسر نادری", message: "مهم اینه ازش کار بکشیم، نه فقط چت کنیم 😅", timeOffset: undefined},
    ]
  },
{
    start: "00:38:24:00",
    end: "00:38:50:00",
    comments: [
      { username: "آیدا صالحی", message: "من فقط گوشی دارم، یعنی منم می‌تونم؟", timeOffset: 0},
      { username: "ادمین", message: "۹۰٪ سرویس‌هایی پر تقاضا با گوشی هم قابل ساختن هست", replyToUsername: "آیدا صالحی", replyToMessage: "من فقط گوشی دارم، یعنی منم می‌تونم؟", isAdmin: true, timeOffset: 4.33},
      { username: "مهدی صفری", message: "گوشی من قدیمیه، بازم میشه؟", timeOffset: 8.67},
      { username: "علی‌رضا فتحی", message: "مهم شروعه، مدل گوشی مهم نیست", timeOffset: 13},
      { username: "محمدعلی نوری", message: "یه راه ساده بگو از کجا شروع کنیم؟", timeOffset: 17.33},
      { username: "حسین‌رضا احمدی", message: "خودم با GPT چندتا کار انجام دادم، شدنیه", timeOffset: 21.67},
      { username: "امیرمحمد رضایی", message: "شروع کردن سخت‌ترین بخششه", timeOffset: 26},
      { username: "امیررضا کریمی", message: "دم شما گرم که مسیر رو ساده می‌کنی", timeOffset: undefined}
    ]
  },
  {
    start: "00:38:50:00",
    end: "00:40:23:00",
    comments: [
      { username: "محمدحسین رضایی", message: "دقیقاً… پول همونجاست که مشکل هست", timeOffset: 0},
      { username: "فاطمه نوری", message: "این فرمول خیلی تمیزه  مشکل  راه‌حل  پول", timeOffset: 7.75},
      { username: "علی محمدی", message: "یعنی فقط باید مشکل مردم رو پیدا کنیم؟", timeOffset: 15.5},
      { username: "ادمین", message: "بله؛ کوچک، واقعی و فوری", replyToUsername: "علی محمدی", replyToMessage: "یعنی فقط باید مشکل مردم رو پیدا کنیم؟", isAdmin: true, timeOffset: 23.25},
      { username: "زهرا صادقی", message: "فروش همیشه سخت‌ترین قسمت بود", timeOffset: 31},
      { username: "حسین علیزاده", message: "هوش مصنوعی فروش رو هم آسون کرده؟ 😳", timeOffset: 38.75},
      { username: "مریم موسوی", message: "می‌تونیم برای خارج هم سرویس بدیم؟", timeOffset: 46.5},
      { username: "ادمین", message: "بله، فقط مسئله درست رو هدف بگیرین", replyToUsername: "مریم موسوی", replyToMessage: "می‌تونیم برای خارج هم سرویس بدیم؟", isAdmin: true, timeOffset: 54.25},
      { username: "نرگس جعفری", message: "من چطور بفهمم مردم حاضرن براش پول بدن؟", timeOffset: 62},
      { username: "سمیرا رحیمی", message: "این فرمول جواب می‌ده واقعا من دقیقا سیستم پول در اوردنم همینه اومدم اینجا بهترش کنم", timeOffset: 69.75},
      { username: "مهسا شریفی", message: "فروش هم با هوش مصنوعی؟ این خیلی خفنه", timeOffset: 77.5},
      { username: "آرمان قاسمی", message: "کسی تجربه فروش با هوش منصوعی داشته؟", timeOffset: 85.25},
      { username: "پریسا امینی", message: "من همه فروش های دایرکتمو هوش مصنوعی انجام میده خیلی خفنه", timeOffset: 93},
      { username: "سعید نجفی", message: "آره، حس می‌کنم عقلانی‌ترین روشه", timeOffset: undefined},
      { username: "فرزانه یوسفی", message: "فقط باید انجامش داد", timeOffset: undefined},
    ]
  },
  {
    start: "00:40:23:00",
    end: "00:40:51:00",
    comments: [
      { username: "پویان حسینی", message: "یعنی همین چیزی که داری قدم‌به‌قدم توضیح می‌دی؟", timeOffset: 0},
      { username: "یاسر نادری", message: "چندتا مرحله داره این سیستم؟", timeOffset: 4.67},
      { username: "ندا رضوی", message: "یعنی بدون مهارت قبلی هم میشه؟", timeOffset: 9.33},
      { username: "آیدا صالحی", message: "کنجکاو شدم دقیقاً چطور کار می‌کنه", timeOffset: 14},
      { username: "فرهاد رضوانی", message: "خیلی مشتاق شدم ببینم ابزاراش چیه", timeOffset: 18.67},
      { username: "مهدی صفری", message: "میرِسیم به بخش‌های عملی؟", timeOffset: 23.33},
      { username: "ادمین", message: "بله، به‌زودی وارد مراحل اجرایی می‌شه", replyToUsername: "مهدی صفری", replyToMessage: "میرِسیم به بخش‌های عملی؟", isAdmin: true, timeOffset: 28},
      { username: "علی‌رضا فتحی", message: "من عضو این سیستم شدم همین الان 📝", timeOffset: undefined},
    ]
  },
  {
    start: "00:40:51:00",
    end: "00:41:47:00",
    comments: [
      { username: "حسین‌رضا احمدی", message: "بهتر از اینستاگرام کار کردن؟", timeOffset: 0},
      { username: "امیررضا کریمی", message: "خب فروش فیزیکی چی؟", timeOffset: 4.31},
      { username: "سارا احمدی", message: "فریلنسری هم همیشه ناپایداره پروژه نیست خیلی وقتا", timeOffset: 8.62},
      { username: "محمدحسین رضایی", message: "من فریلنس بودم، استرس دائمی مشتری داشتم", timeOffset: 12.92},
      { username: "زهرا صادقی", message: "این که می‌گه منطقی‌تره قبول دارم", timeOffset: 17.23},
      { username: "حسین علیزاده", message: "کسب و کار اینترنتی برای همه راحت نیست", timeOffset: 21.54},
      { username: "رضا کاظمی", message: "مسیرهای دیگه خیلی رقابت بالاست", timeOffset: 25.85},
      { username: "نرگس جعفری", message: "دقیقا هوش مصنوعی هنوز خلوت‌تره نسبت به بقیه", timeOffset: 30.15},
      { username: "امیرحسین طاهری", message: "خیلیا تو اینستا شکست خوردن چون دیر رفتن", timeOffset: 34.46},
      { username: "مهسا شریفی", message: "من مدتی تولید محتوا کردم ولی درآمد کم بود", timeOffset: 38.77},
      { username: "آرمان قاسمی", message: "یعنی از امروز باید بریم سراغ هوش مصنوعی واقعاً", timeOffset: 43.08},
      { username: "پریسا امینی", message: "از بین همه مسیرها این یکی آینده‌ست", timeOffset: 47.38},
      { username: "کامران فرهادی", message: "استاد واقعاً خوب توضیح داد", timeOffset: 51.69},
      { username: "الهام رستمی", message: "مسیر درست از همه‌چی مهم‌ تره", timeOffset: 56},
    ]
  },
  {
    start: "00:41:47:00",
    end: "00:43:13:00",
    comments: [
  { username: "سحر شکیبا", message: "مقیاس‌پذیری هم داره؟", timeOffset: 0},
  { username: "ادمین", message: "بله، از یه نفر تا هزار مشتری قابل توسعه‌ست", replyToUsername: "سحر شکیبا", replyToMessage: "مقیاس‌پذیری هم داره؟", isAdmin: true, timeOffset: 8.6},
  { username: "علی یکتا", message: "پس میشه تنها هم شروع کرد", timeOffset: 17.2},
  { username: "مریم کیانی", message: "این که خودش فروش کمک می‌کنه عالیه", timeOffset: 25.8},
  { username: "اکبر میرزایی", message: "من از فروش همیشه می‌ترسیدم 😅", timeOffset: 34.4},
  { username: "پریسا دواتگر", message: "امنیت شغلی هم بیشتره انگار", timeOffset: 43},
  { username: "مانی بهشتی", message: "بیزینس‌های قدیمی گیر دارن واقعا", timeOffset: 51.6},
  { username: "الهام نادری", message: "می‌تونم کنار شغلم شروع کنم؟", timeOffset: 60.2},
  { username: "ادمین", message: "بله، بدون ریسک ترک کار", replyToUsername: "الهام نادری", replyToMessage: "می‌تونم کنار شغلم شروع کنم؟", isAdmin: true, timeOffset: 68.8},
  { username: "کاوه زارع", message: "آزادی مکانیش خیلی مهمه", timeOffset: 77.4},
  { username: "صبا یحیی‌پور", message: "الان دیگه هر جا گوشی باشه بیزینس هست", timeOffset: 86},
  { username: "ماهان فتاحی", message: "استرس تامین کالا نداره 😅", timeOffset: undefined},
  { username: "آرزو مبینی", message: "یعنی میشه خودکار سودسازی کرد؟", timeOffset: undefined},
  { username: "ادمین", message: "تا حد زیادی بله، هدف همین هست", replyToUsername: "آرزو مبینی", replyToMessage: "یعنی میشه خودکار سودسازی کرد؟", isAdmin: true, timeOffset: undefined},
    ]
  },
  {
    start: "00:43:13:00",
    end: "00:43:27:00",
    comments: [
      { username: "سعید نجفی", message: "پس نیاز به کدنویسی سنگین نداره؟", timeOffset: 0},
      { username: "ادمین", message: "نه، همین گوشی کافیه", replyToUsername: "سعید نجفی", replyToMessage: "پس نیاز به کدنویسی سنگین نداره؟", isAdmin: true, timeOffset: 7},
      { username: "نیلوفر اکبری", message: "ساده‌تر از چیزی بود که تصور می‌کردم", timeOffset: 14},
      { username: "شایان محمودی", message: "من از امروز به هوش مصنوعی نگاه دوست رو دارم", timeOffset: undefined},
    ]
  },
  {
    start: "00:43:27:00",
    end: "00:43:46:00",
    comments: [
      { username: "فرزانه یوسفی", message: "الان دقیقاً تو چه بازه‌ای هستیم؟", timeOffset: 0},
      { username: "ادمین", message: "تو اوج شروع موج AI", replyToUsername: "فرزانه یوسفی", replyToMessage: "الان دقیقاً تو چه بازه‌ای هستیم؟", isAdmin: true, timeOffset: 2.11},
      { username: "پویان حسینی", message: "فرصتای بزرگ همیشه کوتاهن", timeOffset: 4.22},
      { username: "شادی مهدوی", message: "کسی مثل من که همیشه دیر فهمیده باید بجنبه", timeOffset: 6.33},
      { username: "یاسر نادری", message: "یعنی چند سال دیگه دیر حساب میشه؟", timeOffset: 8.44},
      { username: "ندا رضوی", message: "به نظرم حتی چند ماه دیگه", timeOffset: 10.56},
      { username: "آیدا صالحی", message: "سرعت پیشرفت عجیب شده واقعاً", timeOffset: 12.67},
      { username: "شهاب کرمانی", message: "الان هنوز رقابت کمه", timeOffset: 14.78},
      { username: "فرهاد رضوانی", message: "دقیقاً مثل اول اینستاگرام", timeOffset: 16.89},
      { username: "مهدی صفری", message: "من که نمی‌خوام دوباره عقب بمونم", timeOffset: 19},
      { username: "علی‌رضا فتحی", message: "من از امروز جدی می‌گیرمش", timeOffset: undefined},
    ]
  },
  {
    start: "00:43:46:00",
    end: "00:43:58:00",
    comments: [
      { username: "محمدعلی نوری", message: "خب بریم ببینیم چطوریه مسیر دقیقاً", timeOffset: 0},
      { username: "حسین‌رضا احمدی", message: "یعنی هر مرحله رو توضیح میدی؟", timeOffset: 4},
      { username: "ادمین", message: "بله، از انتخاب ایده تا ساخت بیزینس کامل", replyToUsername: "حسین‌رضا احمدی", replyToMessage: "یعنی هر مرحله رو توضیح میدی؟", isAdmin: true, timeOffset: 8},
      { username: "امیررضا کریمی", message: "استاد، لطفاً کندتر توضیح بده ما یادداشت کنیم", timeOffset: 12},
      { username: "سارا احمدی", message: "هیجان دارمممم", timeOffset: undefined},
    ]
  },
  {
    start: "00:43:58:00",
    end: "00:44:11:00",
    comments: [
      { username: "محمدحسین رضایی", message: "منم از شهر کوچیکم", timeOffset: 0},
      { username: "فاطمه نوری", message: "منم از شهر کوچیک شروع کردم رفیق", timeOffset: 3.25},
      { username: "علی محمدی", message: "پس شرایط اولیه مهم نیست واقعاً", timeOffset: 6.5},
      { username: "زهرا صادقی", message: "احترام قائلم برای کسی که از صفر رسیده", timeOffset: 9.75},
      { username: "حسین علیزاده", message: "منم تو روستا بزرگ شدم…", timeOffset: 13},
    ]
  },
  {
    start: "00:44:11:00",
    end: "00:44:42:00",
    comments: [
      { username: "مریم موسوی", message: "خیلی سخته کارکردن تو اون سن", timeOffset: 0},
      { username: "رضا کاظمی", message: "منم تجربه‌ش رو داشتم… دردناکه", timeOffset: 7.75},
      { username: "نرگس جعفری", message: "احترام دارم به کسی که از صفر صفر شروع کرده", timeOffset: 15.5},
      { username: "امیرحسین طاهری", message: "واقعاً از دل تاریکی میشه نور پیدا کرد", timeOffset: 23.25},
      { username: "سینا باقری", message: "مسیر قهرمانا معمولاً همین‌طوری شروع میشه", timeOffset: 31},
    ]
  },
  {
    start: "00:44:42:00",
    end: "00:45:10:00",
    comments: [
      { username: "مهسا شریفی", message: "کار تو کوره؟ ۹ سالگی؟ 😳", timeOffset: 0},
      { username: "پریسا امینی", message: "منم بچگی کار کردم… می‌فهمم چقدر سخته", timeOffset: 5.6},
      { username: "کامران فرهادی", message: "تابلو برق؟", timeOffset: 11.2},
      { username: "الهام رستمی", message: "دم غیرتت گرم", timeOffset: 16.8},
      { username: "نیلوفر اکبری", message: "چقدر تفاوت داره کودکی آدما باهم", timeOffset: 22.4},
      { username: "شایان محمودی", message: "تو از همون اول خلاف جریان رفتی", timeOffset: 28},
    ]
  },
  {
    start: "00:45:10:00",
    end: "00:45:37:00",
    comments: [
      { username: "آیدا صالحی", message: "منم از یه جایی به بعد فهمیدم باید واسه خودم بسازم", timeOffset: 0},
      { username: "فرهاد رضوانی", message: "کار کردن برای بقیه یعنی وقتت مال تو نیست", timeOffset: 9},
      { username: "مهدی صفری", message: "تصمیم سختی بوده قطعا", timeOffset: 18},
      { username: "علی‌رضا فتحی", message: "شاگردی خیلی مزخرفه همش استا کار بهت زور میگه", timeOffset: 27},
    ]
  },
  {
    start: "00:45:37:00",
    end: "00:46:00:00",
    comments: [
      { username: "محمدعلی نوری", message: "اینترنت برای خیلیامون معجزه بود", timeOffset: 0},
      { username: "حسین‌رضا احمدی", message: "منم اولین تغییرات زندگیم با اینترنت شروع شد", timeOffset: 11.5},
      { username: "امیرمحمد رضایی", message: "وقتی دنیا بزرگ‌تر از شهرت میشه", timeOffset: 23},
    ]
  },
  {
    start: "00:46:00:00",
    end: "00:46:49:00",
    comments: [
      { username: "علی محمدی", message: "یادگیری واقعا اعتیاد داره", timeOffset: 0},
      { username: "زهرا صادقی", message: "آدم وقتی می‌فهمه جهان چقدر بزرگه، نمی‌تونه وایس", timeOffset: 9.8},
      { username: "حسین علیزاده", message: "میفهمم واقعا یادگیری بهترین حس دنیاس مثل حس الانمون", timeOffset: 19.6},
      { username: "مریم موسوی", message: "آدم وقتی یادمیگیری امید پیدا میکنه که یه راهی هست", timeOffset: 29.4},
      { username: "رضا کاظمی", message: "کاش این عشق به یادگیری رو همه تجربه کنن", timeOffset: 39.2},
      { username: "سمیرا رحیمی", message: "اینکه بچه‌ای و به‌جای غر زدن دنبال یادگیری باشی… نادره", timeOffset: 49},
    ]
  },
  {
    start: "00:46:49:00",
    end: "00:47:13:00",
    comments: [
      { username: "مهسا شریفی", message: "منم صد بار شروع کردم و ول کردم", timeOffset: 0},
      { username: "آرمان قاسمی", message: "سخت‌ترین بخش همین شکستای اولیه‌س", timeOffset: 6},
      { username: "پریسا امینی", message: "منم ده تا پیج ساختم، هیچ‌کدوم نگرفت 🤦‍♂️", timeOffset: 12},
      { username: "الهام رستمی", message: "قشنگیش اینه که جا نزدی", timeOffset: 18},
      { username: "نیلوفر اکبری", message: "شکست‌هات نشونه‌ست که داشتی جلو می‌رفتی", timeOffset: 24},
    ]
  },
  {
    start: "00:47:13:00",
    end: "00:47:49:00",
    comments: [
      { username: "شایان محمودی", message: "اولین پول آنلاین خیلیی شیرینه", timeOffset: 0},
      { username: "فرزانه یوسفی", message: "پشمام تو این کاور زده بودی؟", timeOffset: 7.2},
      { username: "پویان حسینی", message: "منم اولین پروژه‌مو یادمه هنوز 😅", timeOffset: 14.4},
      { username: "شادی مهدوی", message: "یادمه اون انیمیشن گاد فادر شو رووووو تو زده بودییی", timeOffset: 21.6},
      { username: "یاسر نادری", message: "منم یادمه این دیس به رضا پیش رو بود آهنگه 😂", timeOffset: 28.8},
      { username: "آیدا صالحی", message: "چطوری تو اون سن با این آدمای معروف کار کردی؟؟", timeOffset: 36},
    ]
  },
  {
    start: "00:47:49:00",
    end: "00:48:26:00",
    comments: [
      { username: "شهاب کرمانی", message: "بالاخره یکی از پیجات گرفت دیگه 🤣", timeOffset: 0},
      { username: "فرهاد رضوانی", message: "وااای یادمه این پیجو واسه تو بود😂", timeOffset: 6.17},
      { username: "علی‌رضا فتحی", message: "می‌تونم بپرسم چقدر زمان برد تا ۱۵کا شد؟", timeOffset: 12.33},
      { username: "محمدعلی نوری", message: "چه جالب… اگه این موفق شد چرا ادامه ندادی؟", timeOffset: 18.5},
      { username: "حسین‌رضا احمدی", message: "منم یه پیج دانستنی داشتم، ۵۰۰ تا موند 😐", timeOffset: 24.67},
      { username: "امیرمحمد رضایی", message: "۱۵کا بدون ربات؟", timeOffset: 30.83},
      { username: "سارا احمدی", message: "الانم پیج فعالیه؟", timeOffset: 37},
    ]
  },
  {
    start: "00:48:26:00",
    end: "00:49:23:00",
    comments: [
      { username: "محمدحسین رضایی", message: "خیلی شجاعت میخواد ماشالا بهت", timeOffset: 0},
      { username: "فاطمه نوری", message: "من ۲۵ سالمه هنوز جرئتشو ندارم", timeOffset: 6.33},
      { username: "زهرا صادقی", message: "چقدر جرئت می‌خواد دل کندن از خونه", timeOffset: 12.67},
      { username: "حسین علیزاده", message: "تهران برای بچهٔ شهر کوچیک خیلی ترسناکه اوایل تجربشو داشت", timeOffset: 19},
      { username: "مریم موسوی", message: "خانواده چی گفتن؟ راحت گذاشتن بری؟", timeOffset: 25.33},
      { username: "رضا کاظمی", message: "تو ۱۷ سالگی خیلیا هنوز دنبال پلی‌استیشنن 😅", timeOffset: 31.67},
      { username: "نرگس جعفری", message: "چی باعث شد همچین تصمیم بگیری؟", timeOffset: 38},
      { username: "امیرحسین طاهری", message: "تو اون سن… تنهایی واقعاً سخت می‌چسبه به جان", timeOffset: 44.33},
      { username: "سمیرا رحیمی", message: "احترام ویژه برای کسی که با دست خالی شروع کردن مخصوصا بچه های این کارگاه 🙌", timeOffset: 50.67},
      { username: "مهسا شریفی", message: "من چند ساله می‌گم می‌رم تهران، هنوز جرعتشو پیدا نکردم", timeOffset: 57},
    ]
  },
  {
    start: "00:49:23:00",
    end: "00:50:14:00",
    comments: [
      { username: "آرمان قاسمی", message: "اولین خونه همیشه مقدسه حتی اگه اتاقک باشه", timeOffset: 0},
      { username: "پریسا امینی", message: "منم اتاق ۱۲ متری داشتم… افتخارم بود", timeOffset: 10.2},
      { username: "کامران فرهادی", message: "واقعا تو اون سن؟؟", timeOffset: 20.4},
      { username: "سعید نجفی", message: "منم اولین‌بار که مستقل شدم حتی تخت نداشتم", timeOffset: 30.6},
      { username: "نیلوفر اکبری", message: "وقتی کسی از کف شروع می‌کنه، سقف نداره", timeOffset: 40.8},
      { username: "شایان محمودی", message: "منم حس کردم با اولین خونه، انگار دنیارو بهم داده بودن", timeOffset: 51},
    ]
  },
  {
    start: "00:50:14:00",
    end: "00:50:44:00",
    comments: [
      { username: "فرزانه یوسفی", message: "رفیق واقعی پیدا کردن خودش یه خوش‌شانسیه", timeOffset: 0},
      { username: "پویان حسینی", message: "علی‌ها نعمتن تو زندگی", timeOffset: 6},
      { username: "یاسر نادری", message: "دو نفر علیه دنیا…", timeOffset: 12},
      { username: "ندا رضوی", message: "منم یه رفیق داشتم که زندگیمو عوض کرد، قشنگ زندگیمو نابود کرد😂", timeOffset: 18},
      { username: "آیدا صالحی", message: "علی هم از صفر اومده بود؟", timeOffset: 24},
      { username: "فرهاد رضوانی", message: "علی کجاست الان؟ هنوز باهات کار می‌کنه؟", timeOffset: 30},
    ]
  },
  {
    start: "00:50:44:00",
    end: "00:51:09:00",
    comments: [
      { username: "محمدعلی نوری", message: "تهرانو باید اینجوری شکست داد", timeOffset: 0},
      { username: "حسین‌رضا احمدی", message: "آدم وقتی هدف داره ساعت معنی نداره", timeOffset: 5},
      { username: "امیرمحمد رضایی", message: "منم یه مدت این‌طوری بودم… هنوز یادم نرفته فشارش", timeOffset: 10},
      { username: "امیررضا کریمی", message: "ماشالله بهتون 👏🏻👏🏻👏🏻", timeOffset: 15},
      { username: "سارا احمدی", message: "منم باید از تنبلی دربیام واقعاً", timeOffset: 20},
      { username: "محمدحسین رضایی", message: "بدون تلاش اینطوری نتیجه بدست نمیاد", timeOffset: 25},
    ]
  },
  {
    start: "00:51:09:00",
    end: "00:51:53:00",
    comments: [
      { username: "فاطمه نوری", message: "اوووف رسیدیم به AI 👀🔥", timeOffset: 0},
      { username: "علی محمدی", message: "دقیقا یادمه اوایلی که هوش مصنوعی اومده بود خیلی عجیب بود", timeOffset: 7.33},
      { username: "زهرا صادقی", message: "یعنی این‌قدر تاثیر داشت؟", timeOffset: 14.67},
      { username: "مریم موسوی", message: "کارایی که قبلاً روزا طول می‌کشید الان تو چند دقیقه انجام میشه", timeOffset: 22},
      { username: "رضا کاظمی", message: "دمت گرم که ازش درست استفاده کردی", timeOffset: 29.33},
      { username: "نرگس جعفری", message: "خیلیا هنوز نمی‌دونن چی دستشونه", timeOffset: 36.67},
      { username: "امیرحسین طاهری", message: "کاش بگی از کجا مشتری پیدا می‌کردی", timeOffset: 44},
    ]
  },
  {
    start: "00:51:53:00",
    end: "00:52:54:00",
    comments: [
      { username: "سمیرا رحیمی", message: "اگه واقعاً اینجوریه چرا همه هنوز یاد نگرفتن؟", timeOffset: 0},
      { username: "سینا باقری", message: "کارمندای هوش مصنوعی یعنی چی؟ دقیق توضیح میدی؟", timeOffset: 15.25},
      { username: "سعید نجفی", message: "کارمند انسانی باید رقابت کنه با کارمندای هوش مصنوعی 😐", timeOffset: 30.5},
      { username: "نیلوفر اکبری", message: "منم باید یه کارمند هوش مصنوعی استخدام کنم 😂", timeOffset: 45.75},
      { username: "شایان محمودی", message: "هرکی نخواد از هوش مصنوعی استفاده کنه قطعا حذف میشه بدم حذف میشه", timeOffset: 61},
    ]
  },
  {
    start: "00:52:54:00",
    end: "00:53:40:00",
    comments: [
      { username: "فرزانه یوسفی", message: "۵ماه  و ۶۰کا؟ اینو باید توضیح بدی دقیقاً", timeOffset: 0},
      { username: "پویان حسینی", message: "چی پست می‌ذاشتین؟", timeOffset: 6.57},
      { username: "یاسر نادری", message: "من ۳ ساله موندم روی ۳۰۰ تا فالوور 🤦‍♂️", timeOffset: 13.14},
      { username: "آیدا صالحی", message: "یعنی میشه واقعاً بدون باشگاه رفتن هم به این نتیجه رسید؟؟", timeOffset: 19.71},
      { username: "شهاب کرمانی", message: "خیلیا هنوز نمی‌دونن AI چه قدرتی داره توی مارکتینگ و بازاریابی", timeOffset: 26.29},
      { username: "فرهاد رضوانی", message: "من بدم نمیاد همین مسیر رو کپی کنم 😅", timeOffset: 32.86},
      { username: "مهدی صفری", message: "تو ایران اگه به بازار خارجی‌ها برسی، دیگه سقف نداری", timeOffset: 39.43},
      { username: "علی‌رضا فتحی", message: "خیلی از مدرسا فقط حرف می‌زنن، شما انجام دادین", timeOffset: 46},
    ]
  },
  {
    start: "00:53:40:00",
    end: "00:53:55:00",
    comments: [
      { username: "حسین‌رضا احمدی", message: "۲۴ ساعته یعنی واقعاً اتومات؟", timeOffset: 0},
      { username: "امیرمحمد رضایی", message: "چجوری مشتری خارجی پیدا می‌کردین دقیقاً؟", timeOffset: 3},
      { username: "سارا احمدی", message: "منم می‌خوام AI واسم بازاریابی کنه 😅", timeOffset: 6},
      { username: "زهرا صادقی", message: "از اون هیکل تا این تغییر…دمت گرم پسر", timeOffset: 9},
      { username: "حسین علیزاده", message: "فروش اتومات… خیلی خفنه", timeOffset: 12},
      { username: "مریم موسوی", message: "خیلیا فقط رؤیا می‌فروشن، تو واقعا انجام دادی ایول", timeOffset: 15},
    ]
  },
  {
    start: "00:53:55:00",
    end: "00:54:06:00",
    comments: [
      { username: "رضا کاظمی", message: "رویای هر جوان ایرانی، به دلار در بیاره به ریال خرج کنه😂", timeOffset: 0},
      { username: "سمیرا رحیمی", message: "میوه‌ی تمام ۱۴ ساعت‌ه", timeOffset: 5.5},
      { username: "مهسا شریفی", message: "پول بیرون کشیدن از اینترنت… حسش خداسس دیگه دلار باشه روانی میشه آدم 😂", timeOffset: 11},
    ]
  },
  {
    start: "00:54:06:00",
    end: "00:54:29:00",
    comments: [
      { username: "آرمان قاسمی", message: "یعنی از کف روستا رسیدی به بالاشهر تهران؟ دمت گرم!", timeOffset: 0},
      { username: "کامران فرهادی", message: "کاش بیشتر توضیح بدی چقدر طول کشید", timeOffset: 11.5},
      { username: "الهام رستمی", message: "خیلی علاقه دارم منم یادگیرم مسیرش رو توضیح میدین؟", timeOffset: 23},
    ]
  },
  {
    start: "00:54:29:00",
    end: "00:55:57:00",
    comments: [
      { username: "سعید نجفی", message: "من ۲ ساله به ۵k نرسیدم، افسردگی گرفتم 😅", timeOffset: 0},
      { username: "نیلوفر اکبری", message: "چی می‌فروختی دقیق؟", timeOffset: 29.33},
      { username: "شایان محمودی", message: "تو همین بازه من فقط هدف‌گذاری کردم 😂", timeOffset: 58.67},
      { username: "ندا رضوی", message: "آموزشت کی شروع میشه؟ من آماده‌ام", timeOffset: 88},
    ]
  },
  {
    start: "00:55:57:00",
    end: "00:57:02:00",
    comments: [
      { username: "شهاب کرمانی", message: "چجوری اتوماتیکش کردی؟", timeOffset: 0},
      { username: "ادمین", message: "با ابزارهای AI در کنار ساختار درست بیزینس", replyToUsername: "شهاب کرمانی", replyToMessage: "چجوری اتوماتیکش کردی؟", isAdmin: true, timeOffset: 65},
      { username: "فرهاد رضوانی", message: "این همون سیستم پول‌سازی ۲۴ ساعته‌ست نه؟", timeOffset: undefined},
    ]
  },
  {
    start: "00:57:02:00",
    end: "00:57:52:00",
    comments: [
      { username: "مهدی صفری", message: "جدی؟ رضا صائمی هم با همین سیستم رفت جلو؟", timeOffset: 0},
      { username: "علی‌رضا فتحی", message: "آنکا رو می‌شناسم! اصلاً پیجش ترکوند", timeOffset: 8.33},
      { username: "محمدعلی نوری", message: "یعنی همه‌ی اینا با سیستم هوش مصنوعی انقدر رشد کردن؟", timeOffset: 16.67},
      { username: "حسین‌رضا احمدی", message: "چه جالب، همشون رشد سریع داشتن", timeOffset: 25},
      { username: "امیرمحمد رضایی", message: "پرسیکا و رضا رو میشناسم من همیشه تعجب می‌کردم چجوری اینقدر سریع رفتن بالا", timeOffset: 33.33},
      { username: "امیررضا کریمی", message: "خب منم می‌خوام تو لیست نفر بعد باشم", timeOffset: 41.67},
      { username: "سارا احمدی", message: "همه‌شون تو بازه کوتاه نتیجه گرفتن؟", timeOffset: 50},
    ]
  },
  {
    start: "00:57:52:00",
    end: "00:58:10:00",
    comments: [
      { username: "علی محمدی", message: "منم یکی از همونا بشم عالیه", timeOffset: 0},
      { username: "زهرا صادقی", message: "کی بوده از همینجا شروع کرده موفق شده؟", timeOffset: 9},
      { username: "مریم موسوی", message: "حس می‌کنم خیلی عقبم 😐", timeOffset: 18},
    ]
  },
  {
    start: "00:58:10:00",
    end: "00:58:22:00",
    comments: [
      { username: "امیرحسین طاهری", message: "شدیدااااا آمادم", timeOffset: 0},
      { username: "سمیرا رحیمی", message: "خب من که آماده‌ام، شروع کنیم 💪", timeOffset: 2.4},
      { username: "سینا باقری", message: "منتظرم فقط بگی مسیرو", timeOffset: 4.8},
      { username: "آرمان قاسمی", message: "یعنی الان دیگه واقعا کارگاه شروع میشه؟", timeOffset: 7.2},
      { username: "پریسا امینی", message: "از اول وبینار منتظر همین بخششم ایول", timeOffset: 9.6},
      { username: "کامران فرهادی", message: "آمادم شروع کنیم", timeOffset: 12},
    ]
  },
  {
    start: "00:58:22:00",
    end: "00:59:09:00",
    comments: [
      { username: "سعید نجفی", message: "بگو لطفا زودتر شروع کنیم خیلی هیجان دارم!", timeOffset: 0},
      { username: "نیلوفر اکبری", message: "ضبط نمی‌شه؟ 😳", timeOffset: 6.71},
      { username: "شایان محمودی", message: "باشه تا آخر هستم ✋", timeOffset: 13.43},
      { username: "فرزانه یوسفی", message: "هدیه‌ها چیان دقیقاً؟", timeOffset: 20.14},
      { username: "پویان حسینی", message: "تمرکز داریم استاد بگو فقط 🔥", timeOffset: 26.86},
      { username: "آیدا صالحی", message: "من برا هدیه نیومدم ولی خب بدمم نمیاد 😂", timeOffset: 33.57},
      { username: "شهاب کرمانی", message: "من تا تهش هستم، کارای دیگمو هم کنسل کردم", timeOffset: 40.29},
      { username: "مهدی صفری", message: "حس می‌کنم آخرش چیز خفنی در انتظاره", timeOffset: 47},
    ]
  },
  {
    start: "00:59:09:00",
    end: "00:59:20:00",
    comments: [
      { username: "علی‌رضا فتحی", message: "این وبینار ضبط نمیشه", timeOffset: 0},
      { username: "محمدعلی نوری", message: "پس اسکرین‌شات بگیریم؟ 😅", timeOffset: 5.5},
      { username: "حسین‌رضا احمدی", message: "قول دادیم، پس می‌مونیم تا تهش", timeOffset: 11},
    ]
  },
  {
    start: "00:59:20:00",
    end: "01:00:22:00",
    comments: [
      { username: "محمدحسین رضایی", message: "یعنی تا آخر عمر AI Coach داشته باشیم؟ 🤯", timeOffset: 0},
      { username: "فاطمه نوری", message: "اوووف این خیلی خفنه واقعاً ارزش داره موندن", timeOffset: 12.4},
      { username: "علی محمدی", message: "مادام‌العمر یعنی همیشه؟ لازم نیست تمدیدش کنیم؟", timeOffset: 24.8},
      { username: "ادمین", message: "بله همیشه میتونین استفاده کنین", replyToUsername: "علی محمدی", replyToMessage: "مادام‌العمر یعنی همیشه؟ لازم نیست تمدیدش...", isAdmin: true, timeOffset: 37.2},
      { username: "زهرا صادقی", message: "کاش من برنده بشمممم", timeOffset: 49.6},
      { username: "حسین علیزاده", message: "ماهانه ۲۰ دلاره چت جی پی تی این دائمی باشه خیلی خوبه!", timeOffset: 62},
      { username: "مریم موسوی", message: "😳 دم‌تون گرم، این خیلی خفنه", timeOffset: undefined},
      { username: "ادمین", message: "فقط برای کسانی که تا پایان همراه باشن", replyToUsername: "مریم موسوی", replyToMessage: "😳 دم‌تون گرم، این خیلی خفنه", isAdmin: true, timeOffset: undefined},
    ]
  },
  {
    start: "01:00:22:00",
    end: "01:00:27:00",
    comments: [
      { username: "رضا کاظمی", message: "حالا وقتشه شروع کنیم", timeOffset: 0},
      { username: "نرگس جعفری", message: "بالاخره! بزن بریم 🔥", timeOffset: 0.83},
      { username: "سمیرا رحیمی", message: "بریم ببینیم این سیستم چه شکلیه !", timeOffset: 1.67},
      { username: "سینا باقری", message: "دل شوره گرفتم ولی خوبه 😅", timeOffset: 2.5},
      { username: "مهسا شریفی", message: "Let's goooo 💪", timeOffset: 3.33},
      { username: "آرمان قاسمی", message: "من آماده‌ام، شروع کنید لطفا", timeOffset: 4.17},
      { username: "کامران فرهادی", message: "من تکون نمی‌خورم از اینجا", timeOffset: 5},
    ]
  },
  {
    start: "01:00:27:00",
    end: "01:02:20:00",
    comments: [
      { username: "شایان محمودی", message: "چقدر مسیر واضح و مشخصی! دمت گرم فقط کاش همرو توضیح بدی", timeOffset: 0},
      { username: "فرزانه یوسفی", message: "هر قدم رو جدا جدا یاد می‌گیریم؟", timeOffset: 12.56},
      { username: "پویان حسینی", message: "اینو باید طلایی نوشت، کل مسیر ساخت بیزینس همینه! بهترین مسیر ممکنه اگه درست اجر بشه", timeOffset: 25.11},
      { username: "شادی مهدوی", message: "انتخاب ایده همیشه سخت‌ترینش بوده برای من", timeOffset: 37.67},
      { username: "یاسر نادری", message: "وای تبدیل مخاطب همیشه کابوسم بود 😅", timeOffset: 50.22},
      { username: "ادمین", message: "همه‌چیز مرحله‌به‌مرحله آموزش داده می‌شه", replyToUsername: "یاسر نادری", replyToMessage: "وای تبدیل مخاطب همیشه کابوسم بود 😅", isAdmin: true, timeOffset: 62.78},
      { username: "ندا رضوی", message: "اتوماسیون کامل همون بخش جذابه 🔥", timeOffset: 75.33},
      { username: "آیدا صالحی", message: "یعنی آخرش دیگه سیستم خودش کار می‌کنه؟؟؟", timeOffset: 87.89},
      { username: "مهدی صفری", message: "به‌نظرم قدم آخر هیجان‌انگیزه اتومات شدن", timeOffset: 100.44},
      { username: "علی‌رضا فتحی", message: "من سالهاست کارآفرینی میکنم و چندین شرکت موفق دارم این یکی از بهترین مسیر های ممکنه‌ آفرین بر شما دوست عزیز", timeOffset: 113},
      { username: "محمدعلی نوری", message: "خداکنه همرو بیاد توضیح بده خیلی مسیر واقعی و خفنیه بنظر منم", timeOffset: undefined},
    ]
  },
  {
    start: "01:02:20:00",
    end: "01:02:47:00",
    comments: [
      { username: "امیرمحمد رضایی", message: "دقیقاً مشکل من همیشه همین بوده 😐", timeOffset: 0},
      { username: "امیررضا کریمی", message: "خب درد مردم رو از کجا بفهمیم؟", timeOffset: 5.4},
      { username: "ادمین", message: "ایده یعنی راه‌حل یک نیاز واقعی", replyToUsername: "محمدحسین رضایی", replyToMessage: "من هزار بار شروع کردم بدون ایده درست", isAdmin: true, timeOffset: 10.8},
      { username: "فاطمه نوری", message: "چطور بفهمیم کدوم درد ارزشمنده؟", timeOffset: 16.2},
      { username: "زهرا صادقی", message: "یعنی اول باید بریم درد مردم رو کنکاش کنیم؟", timeOffset: 21.6},
      { username: "حسین علیزاده", message: "فکر می‌کردم ایده یعنی خلاقیت عجیب، نه حل درد", timeOffset: 27},
      { username: "ادمین", message: "ساده‌ترین دردها معمولاً پول‌سازترین‌ها هستن", replyToUsername: "حسین علیزاده", replyToMessage: "فکر می‌کردم ایده یعنی خلاقیت عجیب، نه حل...", isAdmin: true, timeOffset: undefined},
      { username: "مریم موسوی", message: "بیشتر توضیح بدین لطفا چطوری ایده رو پیدا کنیم!؟", timeOffset: undefined},
    ]
  },
  {
    start: "01:02:47:00",
    end: "01:02:56:00",
    comments: [
      { username: "سینا باقری", message: "من تخصص دارم ولی پول نه، این بدترینشه 😂", timeOffset: 0},
      { username: "مهسا شریفی", message: "خب اگه مهارت نداریم چی؟ از صفر هم جواب می‌ده؟", timeOffset: 1.8},
      { username: "ادمین", message: "بله، مسیر برای هر دو گروه طراحی شده", replyToUsername: "مهسا شریفی", replyToMessage: "خب اگه مهارت نداریم چی؟ از صفر هم جواب م...", isAdmin: true, timeOffset: 3.6},
      { username: "پریسا امینی", message: "من کارم نرم‌افزار بوده، روش پول در اوردن ازشو بلد نیستم", timeOffset: 5.4},
      { username: "کامران فرهادی", message: "من مهارت دارم ولی مشتری نه", timeOffset: 7.2},
      { username: "الهام رستمی", message: "اگه تخصص داشته باشی که عالیه… ولی بدونشم می‌شه؟", timeOffset: 9},
      { username: "سعید نجفی", message: "من از تخصصم متنفرم، یه مسیر جدید میخوام", timeOffset: undefined},
    ]
  },
  {
    start: "01:02:56:00",
    end: "01:03:52:00",
    comments: [
      { username: "فرزانه یوسفی", message: "آها یعنی باید ببینم شغلم چه دردی رو حل می‌کنه", timeOffset: 0},
      { username: "پویان حسینی", message: "من برنامه‌نویسم، مسئله اتوماسیون و سرعت رو حل می‌کنم", timeOffset: 4.67},
      { username: "شادی مهدوی", message: "من مربی ورزشم، سلامتی و اعتماد به نفسو حل می‌کنم 💪", timeOffset: 9.33},
      { username: "یاسر نادری", message: "چقدر قشنگ گفتی، هرکاری یه فلسفه حل مسئله داره", timeOffset: 14},
      { username: "ندا رضوی", message: "من مشاور کنکورم، استرس و سردرگمی بچه ها رو حل می‌کنم", timeOffset: 18.67},
      { username: "آیدا صالحی", message: "من تولیدمحتوام… کمک می‌کنم دیده بشن", timeOffset: 23.33},
      { username: "شهاب کرمانی", message: "من آرایشگرم، حس خوب و اعتمادبه‌نفس می‌دم ✂️", timeOffset: 28},
      { username: "فرهاد رضوانی", message: "چقدر حس ارزشمندی می‌ده این نگاه", timeOffset: 32.67},
      { username: "مهدی صفری", message: "من مترجمم، مسئله بلد نبودن زبان رو حل میکنم", timeOffset: 37.33},
      { username: "محمدعلی نوری", message: "من حسابدارم، نظم مالی ایجاد می‌کنم", timeOffset: 42},
      { username: "حسین‌رضا احمدی", message: "من فروشنده‌ام، نیاز مردم رو به محصول وصل می‌کنم", timeOffset: 46.67},
      { username: "امیرمحمد رضایی", message: "من بیکارم، نیاز تنبلی خودمو برطرف میکنم 😂", timeOffset: 51.33},
      { username: "امیررضا کریمی", message: "من دیجیتال مارکترم، رشد کسب‌وکارها رو حل می‌کنم", timeOffset: 56},
    ]
  },
  {
    start: "01:03:52:00",
    end: "01:05:34:00",
    comments: [
      { username: "علی محمدی", message: "من ایده ساخت ربات برنامه غذایی دارم 🍽️", timeOffset: 0},
      { username: "زهرا صادقی", message: "ایده ساخت روزومه هوشمندو دارم همشو هم با چت جی پی قابل انجامه فایلش رو هم با گاما میسازم", timeOffset: 5.67},
      { username: "حسین علیزاده", message: "پس فقط باید بپرسم مردم چی می‌خوان", timeOffset: 11.33},
      { username: "مریم موسوی", message: "مسئله تولید محتوای پیجای آنلاین شاپو میخوام حل کنم سناریو هارو از چت جی پی تی میگیرم میدم هوش مصنوعی veo3 میسازه و بعد یه ادیت ساده هم میزنم روش میدم بهشون کل فرایند هم اتوماسیون میشه خیلی راحت", timeOffset: 17},
      { username: "نرگس جعفری", message: "یه بات برای پیدا کردن مشتری‌ها از سایت های کاریابی فریلنسرها", timeOffset: 22.67},
      { username: "امیرحسین طاهری", message: "آرایشگرم یه سایت با هوش مصنوعی میخوام بزنم مدل های جذاب مو رو توش بزاره خودکار بعد سفارش بدن به من", timeOffset: 28.33},
      { username: "سمیرا رحیمی", message: "منم مدرس زبانم بنظرم میتونم توی کلاس هام هوش مصنوعی رو بیارم و آموزش بدم بهشون چطوری باهاش زبان یادبگیرن نرخ موفقیت بچه ها خیلی میره بالا پول بیشتریم میتونم بگیرم", timeOffset: 34},
      { username: "سینا باقری", message: "من صفرم صفر… ولی به‌نظرم ایده برای نوبت‌دهی آنلاین خوبه خود هوش منصوعیم میسازه دیگه", timeOffset: 39.67},
      { username: "مهسا شریفی", message: "AI داره همه‌چی رو ساده کرده واقعاً", timeOffset: 45.33},
      { username: "آرمان قاسمی", message: "تولید پست آماده برای پیج‌های کوچیک", timeOffset: 51},
      { username: "پریسا امینی", message: "پس فقط باید یه مشکل واقعی پیدا کنم", timeOffset: 56.67},
      { username: "کامران فرهادی", message: "ربات تشخیص ایده‌های پول‌ساز خودکار", timeOffset: 62.33},
      { username: "الهام رستمی", message: "من یه ایده دارم: ربات مشاور انتخاب رشته با AI", timeOffset: 68},
      { username: "سعید نجفی", message: "جالب شد… همه دارن ایده می‌دن 😅", timeOffset: 73.67},
      { username: "ادمین", message: "هرچی دردی بزرگ‌تر، ایده ارزشمندتر", replyToUsername: "سعید نجفی", replyToMessage: "جالب شد… همه دارن ایده می‌دن 😅", isAdmin: true, timeOffset: 79.33},
      { username: "نیلوفر اکبری", message: "یه سرویس مدیریت استرس با AI برای دانشجوها خیلی لازم داریم 😑", timeOffset: 85},
      { username: "شایان محمودی", message: "من همیشه دنبال محصول بودم، نه نیاز مردم", timeOffset: 90.67},
      { username: "فرزانه یوسفی", message: "حالا تازه دارم می‌بینم چقدر فرصت اطرافم هست", timeOffset: 96.33},
      { username: "پویان حسینی", message: "الان ایده هوش مصنوعی فروشنده خیلی جذابه بزارن مردم رو پیجشون واسشون بفروشه خیلیم راحته", timeOffset: 102},
      { username: "شادی مهدوی", message: "من که فقط از هوش منصوعی میخوام تو رشد کسب و کارم استفاده کنم توی فروش و بازاریابی ایدمو دارم", timeOffset: undefined},
    ]
  },
  {
    start: "01:05:34:00",
    end: "01:05:50:00",
    comments: [
      { username: "آیدا صالحی", message: "مثل وقتی که راجع به چیز صحبت میکنیم یا فکر میکنیم تو اکسپلورمون میاد😂", timeOffset: 0},
      { username: "شهاب کرمانی", message: "چی باید دقیقا ازش بپرسیم بهمون ایده بده؟", timeOffset: 4},
      { username: "فرهاد رضوانی", message: "دقیقاً مشکل همینه… ما حسّی تصمیم می‌گیریم", timeOffset: 8},
      { username: "مهدی صفری", message: "اگر AI بگه مردم دنبال چی‌ان، فقط باید بسازیمش", timeOffset: 12},
      { username: "علی‌رضا فتحی", message: "حس می‌کنم مهم‌ترین کمک هوش مصنوعی همین کشف نیازه", timeOffset: 16},
    ]
  },
  {
    start: "01:05:50:00",
    end: "01:06:11:00",
    comments: [
      { username: "امیررضا کریمی", message: "سرویس یعنی چی دقیق؟ محصول دیجیتال؟", timeOffset: 0},
      { username: "ادمین", message: "هم محصول دیجیتال میتونه باشه هم ترکیبی از محصول دیجیتال و فیزیکی همشون در خدمت بر طرف کردن نیازن", replyToUsername: "امیررضا کریمی", replyToMessage: "سرویس یعنی چی دقیق؟ محصول دیجیتال؟", isAdmin: true, timeOffset: 5.25},
      { username: "سارا احمدی", message: "پس باید چیزی ساخت که مردم حاضر شن براش پول بدن", timeOffset: 10.5},
      { username: "ادمین", message: "تبدیل نیاز به راه‌حل قابل فروش = سرویس", replyToUsername: "سارا احمدی", replyToMessage: "پس باید چیزی ساخت که مردم حاضر شن براش پ...", isAdmin: true, timeOffset: 15.75},
      { username: "محمدحسین رضایی", message: "من بلد نیستم سرویس بسازم ولی دیدم با ترکیب چنتا هوش منصوعی مختلف واقعا میشه محصولات سرویس های خیلی خفنی ساخت", timeOffset: 21},
      { username: "فاطمه نوری", message: "حتی میشه ساختار محصول رو از هوش مصنوعی گرفت خودت بسازی حالا فیزیکی یا دیجیتال یا هرچیزی چون هوش مصنوعی میدونه دقیقا چه ساختاری باید داشته باشه محصولت که نیاز کاربر رو به بهترین شکل حل کنه!", timeOffset: undefined},
      { username: "علی محمدی", message: "به قول شما مشکل رو حل کن، پول خودش میاد", timeOffset: undefined},
    ]
  },
  {
    start: "01:06:11:00",
    end: "01:06:49:00",
    comments: [
      { username: "مریم موسوی", message: "اسم سرویس هم خودش می‌ده؟ اوف", timeOffset: 0},
      { username: "رضا کاظمی", message: "این عالیه برای کسی که صفره", timeOffset: 3.8},
      { username: "نرگس جعفری", message: "یعنی حتی لازم نیست طراح باشم؟", timeOffset: 7.6},
      { username: "امیرحسین طاهری", message: "کد نویسیم نمیخواد دیگه نه؟؟ ایووول", timeOffset: 11.4},
      { username: "ادمین", message: "نه اصلا همه بخش های سرویس و محصول رو خود هوش مصنوعی میتونه به صورت کامل بسازه", replyToUsername: "امیرحسین طاهری", replyToMessage: "کد نویسیم نمیخواد دیگه نه؟؟ ایووول", isAdmin: true, timeOffset: 15.2},
      { username: "سمیرا رحیمی", message: "پس چرا انقدر سختش کرده بودم تو ذهنم؟", timeOffset: 19},
      { username: "سینا باقری", message: "مزیت رقابتی یعنی چیزی که بقیه ندارن درسته؟", timeOffset: 22.8},
      { username: "مهسا شریفی", message: "AI همه اطلاعات بازار رو داره… پس بهتر می‌سازه از آدما", timeOffset: 26.6},
      { username: "پریسا امینی", message: "یعنی فقط کافیه بهش بگیم این نیازو حل کنیم خودش میگه چطوری حل کنیم درسته؟؟ و همونم میدیم هوش مصنوعی راه حل رو میسازه؟؟", timeOffset: 30.4},
      { username: "کامران فرهادی", message: "دیگه لازم نیست سه ماه طول بکشه اسم انتخاب کنیم 😅", timeOffset: 34.2},
      { username: "الهام رستمی", message: "یعنی واقعاً می‌تونیم به کمک AI محصول کامل بسازیم؟", timeOffset: 38},
      { username: "ادمین", message: "بله دقیقا حتی اگه کار دیگه ای هم بخواین انجام بدین مثلا خدمات اضافه تری بدین اون رو هم میتونن کاملا به کمک هوش مصنوعی انجام بدین مثلا یه جلسه مشاوره رایگان به صورت هدیه روی محصول که محتوای جلسه رو هوش مصنوعی داده", replyToUsername: "الهام رستمی", replyToMessage: "یعنی واقعاً می‌تونیم به کمک AI محصول کام...", isAdmin: true, timeOffset: undefined},
      { username: "سعید نجفی", message: "فشار روانی ساخت محصول از رو دوشم برداشته شد 😂", timeOffset: undefined},
    ]
  },
  {
    start: "01:06:49:00",
    end: "01:06:55:00",
    comments: [
      { username: "فرزانه یوسفی", message: "یعنی لوگو و استایل و اینا؟", timeOffset: 0},
      { username: "پویان حسینی", message: "برند یعنی هویت کسب‌وکار دیگه؟", timeOffset: 1},
      { username: "ادمین", message: "بله، هویت بصری برای اعتمادسازی ضروریه", replyToUsername: "پویان حسینی", replyToMessage: "برند یعنی هویت کسب‌وکار دیگه؟", isAdmin: true, timeOffset: 2},
      { username: "شادی مهدوی", message: "اینجا دیگه سرویس شکل واقعی می‌گیره", timeOffset: 3},
      { username: "ندا رضوی", message: "با AI اینم حل میشه دیگه؟", timeOffset: 4},
      { username: "آیدا صالحی", message: "حس حرفه‌ای بودن می‌ده به کار", timeOffset: 5},
      { username: "شهاب کرمانی", message: "من همیشه برندم خجالت‌بر‌انگیز میشد وقتی لوگو اینارو خودم طراحی میکردم 🙃", timeOffset: 6},
      { username: "فرهاد رضوانی", message: "خوب شد داری قدم‌به‌قدم پیش میری دمت گرم", timeOffset: undefined},
    ]
  },
  {
    start: "01:06:55:00",
    end: "01:07:22:00",
    comments: [
      { username: "علی‌رضا فتحی", message: "یعنی لوگو هم خودش می‌سازه؟ 🤯", timeOffset: 0},
      { username: "محمدعلی نوری", message: "اسم و رنگ برند هم؟ پس دیگه چی مونده ما انجام بدیم؟ 😂", timeOffset: 3.86},
      { username: "حسین‌رضا احمدی", message: "چقدر کارایی که لازم نیست یاد بگیریم 😌", timeOffset: 7.71},
      { username: "امیررضا کریمی", message: "اینجا بیزینس قیافه پیدا می‌کنه خوبه", timeOffset: 11.57},
      { username: "سارا احمدی", message: "چقدر آتلیه و طراح پول ازم گرفتن بی‌خودی", timeOffset: 15.43},
      { username: "محمدحسین رضایی", message: "یه لوگو واسه برندم با هوش مصنوعی زدم خدا شد خیلی خوبه", timeOffset: 19.29},
      { username: "فاطمه نوری", message: "خیلی از برندهای بزرگ الان همین‌کارو می‌کنن", timeOffset: 23.14},
      { username: "علی محمدی", message: "من تو یه شرکت مواد غذایی بزرگ کار میکنن خیلی از کارهاشونو هوش مصنوعی انجام میده خیلی جالبه لوگوشنم جدیدا با هوش مصنوعی زدن", timeOffset: 27},
    ]
  },
  {
    start: "01:07:22:00",
    end: "01:08:54:00",
    comments: [
      { username: "مریم موسوی", message: "هوش مصنوعی یعنی خودش فالوور میاره؟", timeOffset: 0},
      { username: "نرگس جعفری", message: "تولید محتوا سخت‌ترین بخششه برای من", timeOffset: 15.33},
      { username: "ادمین", message: "AI کمک می‌کنه هم سریع‌تر هم بهتر دیده شید", replyToUsername: "نرگس جعفری", replyToMessage: "تولید محتوا سخت‌ترین بخششه برای من", isAdmin: true, timeOffset: 30.67},
      { username: "امیرحسین طاهری", message: "تا الان تولید محتوا کار حضرت فیل بود", timeOffset: 46},
      { username: "سینا باقری", message: "کسی می‌دونه چقدر می‌شه با هوش مصنوعی رشد کرد؟", timeOffset: 61.33},
      { username: "مهسا شریفی", message: "چند درصد تولید محتوارو میشه اتوماسیون کرد با هوش مصنوعی؟", timeOffset: 76.67},
      { username: "آرمان قاسمی", message: "AI دقیقاً می‌فهمه مردم چی دوست دارن ببینن", timeOffset: 92},
      { username: "پریسا امینی", message: "من که اهل دیده شدن و تولید محتوا نبودم، این کمک بزرگیه", timeOffset: undefined},
    ]
  },
  {
    start: "01:08:54:00",
    end: "01:09:39:00",
    comments: [
      { username: "نیلوفر اکبری", message: "من هرچی پست گذاشتم جز خودم و دوستم ندیدن 😂", timeOffset: 0},
      { username: "ادمین", message: "AI رفتار مخاطب رو می‌سنجه و محتوا رو دقیق می‌سازه", replyToUsername: "نیلوفر اکبری", replyToMessage: "من هرچی پست گذاشتم جز خودم و دوستم ندیدن...", isAdmin: true, timeOffset: 11.25},
      { username: "شایان محمودی", message: "خیلی مهمه چطوری باهاش صحبت میکنی و پرامیت میدی بهش!", timeOffset: 22.5},
      { username: "فرزانه یوسفی", message: "پس باید ببینیم مردم چی می‌خوان، نه چی ما می‌خوایم", timeOffset: 33.75},
      { username: "شادی مهدوی", message: "اگر بشه این کارو کرد، خیلی خوبه", timeOffset: 45},
      { username: "یاسر نادری", message: "من شدیداً نیاز دارم یکی به‌جای من فکر کنه مغز خودم دیگه نمیکشع", timeOffset: undefined},
    ]
  },
  {
    start: "01:09:39:00",
    end: "01:10:16:00",
    comments: [
      { username: "فرهاد رضوانی", message: "دیگه رسماً نیازی به من نیست 😂", timeOffset: 0},
      { username: "مهدی صفری", message: "n8n چیه؟ شنیدم راجع بهش خیلی خفنه!", timeOffset: 5.29},
      { username: "علی‌رضا فتحی", message: "وای این خیلی خوبه خودش همه کارو انجام بده", timeOffset: 10.57},
      { username: "ادمین", message: "تمام مراحل بدون دخالت دست میتونه انجام بشه", replyToUsername: "علی‌رضا فتحی", replyToMessage: "وای این خیلی خوبه خودش همه کارو انجام بد...", isAdmin: true, timeOffset: 15.86},
      { username: "محمدعلی نوری", message: "make رو شنیده بودم ولی فکر نمی‌کردم انقدر قوی باشه", timeOffset: 21.14},
      { username: "حسین‌رضا احمدی", message: "من از فردا صبح بیکار رسمی‌ام 😂", timeOffset: 26.43},
      { username: "ادمین", message: "فقط یک‌بار تنظیم می‌کنین، بقیه مسیر خودکار", replyToUsername: "حسین‌رضا احمدی", replyToMessage: "من از فردا صبح بیکار رسمی‌ام 😂", isAdmin: true, timeOffset: 31.71},
      { username: "امیرمحمد رضایی", message: "اتوماسیون هوشمنده واقعا جذابه واسم", timeOffset: 37},
      { username: "امیررضا کریمی", message: "من همیشه می‌خواستم کسی به‌جای من دایرکت جواب بده", timeOffset: undefined},
      { username: "فاطمه نوری", message: "الان فهمیدم چرا می‌گین سیستم پول‌سازی", timeOffset: undefined},
    ]
  },
  {
    start: "01:10:16:00",
    end: "01:10:40:00",
    comments: [
      { username: "حسین علیزاده", message: "آره مشکل من دقیقاً همین فروش بوده", timeOffset: 0},
      { username: "مریم موسوی", message: "من همیشه تو این قدم به فاک میرم", timeOffset: 8},
      { username: "رضا کاظمی", message: "دقیقا من ۳۰ هزارتا فالوور دارم بدون درآمد به هیچ دردیم جز پز دادن نمیخوره", timeOffset: 16},
      { username: "نرگس جعفری", message: "اینو هم هوش مصنوعی میتونه انجام بده؟؟", timeOffset: 24},
    ]
  },
  {
    start: "01:10:40:00",
    end: "01:10:53:00",
    comments: [
      { username: "سینا باقری", message: "خداوکیلی راست می‌گه… ویو داشتم، پول نه 😐", timeOffset: 0},
      { username: "مهسا شریفی", message: "من هزار بار وایرال شد پستام دریغ از یدونه مشتری 😂", timeOffset: 4.33},
      { username: "آرمان قاسمی", message: "اگه هوش منصوعی خودش فروشم انجام بده فوق العاده میشه", timeOffset: 8.67},
      { username: "پریسا امینی", message: "این بخش احتمالاً مهم‌ترینشه", timeOffset: 13},
    ]
  },
  {
    start: "01:10:53:00",
    end: "01:12:07:00",
    comments: [
      { username: "نیلوفر اکبری", message: "فروشنده ۲۴ ساعته؟ واقعیه؟؟", timeOffset: 0},
      { username: "شایان محمودی", message: "من از چَت کردن با مشتری‌ها متنفرم، این خیل خووبه", timeOffset: 8.22},
      { username: "فرزانه یوسفی", message: "اتفاقا من روی پیجم یه هوش منصوعی هست هم کامنتارو خیل بامزه جواب میده هم دایرکتارو لحنش مثل خودمه دقیقا 😂", timeOffset: 16.44},
      { username: "پویان حسینی", message: "خدایی بدجور لازمش داشتم", timeOffset: 24.67},
      { username: "شادی مهدوی", message: "با چند نفر همزمان میتونه حرف بزنه؟", timeOffset: 32.89},
      { username: "ادمین", message: "میتونه مکالمه همزمان با صدها نفر داشته باشه", replyToUsername: "شادی مهدوی", replyToMessage: "با چند نفر همزمان میتونه حرف بزنه؟", isAdmin: true, timeOffset: 41.11},
      { username: "ندا رضوی", message: "من خجالت می‌کشم قیمت بگم، این نجاتم میده 😂", timeOffset: 49.33},
      { username: "آیدا صالحی", message: "اینکه دقیقا بر اساس رفتار مخاطب و سن و شخصیت و پیجش پیشنهاد میده فوق العادس رو پیج یکی از دوستام دیده بودم خیلی جالب بود واقعا!!!", timeOffset: 57.56},
      { username: "شهاب کرمانی", message: "من رسماً دارم عاشق این سیستم می‌شم", timeOffset: 65.78},
      { username: "فرهاد رضوانی", message: "فروشنده‌ای که شب تا صبح هم کار کنه… واقعا دنیای عجیبی شده", timeOffset: 74},
      { username: "مهدی صفری", message: "اگه این کار کنه، از خوشحالی میمیرم", timeOffset: undefined},
    ]
  },
  {
    start: "01:12:07:00",
    end: "01:12:46:00",
    comments: [
      { username: "امیرمحمد رضایی", message: "همه‌ش خودکار؟ حتی پشتیبانی؟ 😳", timeOffset: 0},
      { username: "امیررضا کریمی", message: "من اینو می‌خواممممم", timeOffset: 4.88},
      { username: "سارا احمدی", message: "این دقیقاً همون چیزیه که پولدار میکنه آدمو واقعی نه چرتو پرت", timeOffset: 9.75},
      { username: "محمدحسین رضایی", message: "من تا حالا خودم هم تولیدکننده محتوا بودم هم فروشنده هم پشتیبان 😐", timeOffset: 14.63},
      { username: "فاطمه نوری", message: "پشتیبانی خودکار… آخیش", timeOffset: 19.5},
      { username: "ادمین", message: "همه قدم‌ها بهم وصل می‌شن و یه جریان اتوماتیک کامل میسازن", replyToUsername: "فاطمه نوری", replyToMessage: "پشتیبانی خودکار… آخیش", isAdmin: true, timeOffset: 24.38},
      { username: "علی محمدی", message: "اگه این واقعی باشه، دیگه هیچکس نباید فقیر بمونه!!!", timeOffset: 29.25},
      { username: "زهرا صادقی", message: "من الان رفتم تو مود استارتاپ جهانی", timeOffset: 34.13},
      { username: "حسین علیزاده", message: "کارمندهای هوش مصنوعی خسته نمی‌شن… کاش ما هم نمی‌شدیم", timeOffset: 39},
      { username: "مریم موسوی", message: "من اینو می‌خوام چون خسته‌ام از جون کندن", timeOffset: undefined},
    ]
  },
  {
    start: "01:12:46:00",
    end: "01:13:30:00",
    comments: [
      { username: "امیرحسین طاهری", message: "اینکه میتونه خودش فکر کنه و خودشو اصلاح کنه شبیه فیلمای علمی تخیلیه", timeOffset: 0},
      { username: "سمیرا رحیمی", message: "چیه کارمند واقعی همش پول میخواد حقوق میخواد قهر میکنه هوش مصنوعی قشنگ مثل سگ کار میکنه واست", timeOffset: 6.29},
      { username: "سینا باقری", message: "خداوکیلی کاش آدم‌های واقعی هم اینطوری بودن", timeOffset: 12.57},
      { username: "مهسا شریفی", message: "ده تا مغز کار می‌کنن، من فقط تصمیم بگیرم 😌😂", timeOffset: 18.86},
      { username: "ادمین", message: "تیم همیشه درحال کار کردنه، حتی وقتی شما نباشید", replyToUsername: "مهسا شریفی", replyToMessage: "ده تا مغز کار می‌کنن، من فقط تصمیم بگیرم...", isAdmin: true, timeOffset: 25.14},
      { username: "آرمان قاسمی", message: "حس قدرت بی‌سابقه‌ایه هرکسی این سیستمو داشته باشه", timeOffset: 31.43},
      { username: "پریسا امینی", message: "من فقط دستور بدم بیشتر کار کن هوش مصنوعی احمق بیشتررررر پول در بیار واسم 😂", timeOffset: 37.71},
      { username: "کامران فرهادی", message: "بچه ها من میترسم اینا باهوش بشن بیان سراغمونا😂 😂", timeOffset: 44},
      { username: "الهام رستمی", message: "تا اون موقع انقدر ازشون کار کشیدیم پولدار شدیم فرار میکنیم😂", timeOffset: undefined},
    ]
  },
  {
    start: "01:13:30:00",
    end: "01:14:03:18",
    comments: [
      { username: "شایان محمودی", message: "خیلی مسیر درست حسابی بود واقعا دمت گرممم", timeOffset: 0},
      { username: "فرزانه یوسفی", message: "اینکه هوش منصوعی همشو انجام میده باعث میشه کم نیاری و خسته نشی", timeOffset: 16.59},
      { username: "پویان حسینی", message: "این دقیقااا همون چیزی بود که همیشه دنبالش بودم", timeOffset: 33.18},
    ]
  },
  {
    start: "01:14:03:00",
    end: "01:14:19:00",
    comments: [
      { username: "ندا رضوی", message: "مسیر هست ولی شجاعت می‌خواد قدم برداریم", timeOffset: 0},
      { username: "آیدا صالحی", message: "راست می‌گه، از حالا به بعد بهونه‌ آوردن مسخره‌ست اونم توی این دوران که زندگی میکنیم", timeOffset: 4},
      { username: "شهاب کرمانی", message: "مسیر هست، فقط آدم باید آدم باشه و همین مسیرو بره", timeOffset: 8},
      { username: "فرهاد رضوانی", message: "بهترین مسیر ممکنه کل کاسبی هم همیشه همین بوده الان با هوش مصنوعی همش اتوماتیک شده", timeOffset: 12},
      { username: "مهدی صفری", message: "الان دیگه شروع نکردن احمقانه‌ست", timeOffset: 16},
    ]
  },
  {
    start: "01:14:19:00",
    end: "01:15:05:00",
    comments: [
      { username: "حسین‌رضا احمدی", message: "اگه آدما میتونستن تصمیم درستو بگیرن که وضعیت ممکلت این نبود", timeOffset: 0},
      { username: "امیرمحمد رضایی", message: "با وجود این ابزار قدرتمند تصمیم نگرفتن و شروع نکردن بزرگ ترین اشتباهه! من که تصمیمو گرفتم", timeOffset: 7.67},
      { username: "امیررضا کریمی", message: "من توی لحظه‌های مهم معمولاً فرار می‌کنم و گند میزنم به فرصت هام…", timeOffset: 15.33},
      { username: "سارا احمدی", message: "تصمیم‌های سخت زندگی آسون می‌سازن", timeOffset: 23},
      { username: "محمدحسین رضایی", message: "یه حس بد دارم از اینکه دیر فهمیدم", timeOffset: 30.67},
      { username: "فاطمه نوری", message: "ولی هنوز دیر نشده… تا وقتی تصمیم بگیرم", timeOffset: 38.33},
      { username: "علی محمدی", message: "من امشب باید تصمیم بگیرم، همین", timeOffset: 46},
    ]
  },
  {
    start: "01:15:05:00",
    end: "01:15:43:00",
    comments: [
      { username: "حسین علیزاده", message: "اگه اون موقع شروع میکردم و تصمیم میگرفتم الان خیلی جلوتر بودم 🤦‍♂️", timeOffset: 0},
      { username: "مریم موسوی", message: "خیلی تلخه وقتی دلیل بدبختیات خودتی اینکه تصمیم نگرفتی از منطقه امنت بیرون بیای", timeOffset: 19},
      { username: "رضا کاظمی", message: "اگر ۶ ماه دیگه باز همینجا باشم… تقصیر خودممونه", timeOffset: 38},
    ]
  },
  {
    start: "01:15:43:00",
    end: "01:16:02:00",
    comments: [
      { username: "سمیرا رحیمی", message: "عقب انداختن کارها بزرگ ترین اشتباهه آدم باید کاری که میدونه درسته رو انجام بده", timeOffset: 0},
      { username: "سینا باقری", message: "من همین الان انتخاب کردم انجامش بدم 👊", timeOffset: 3.17},
      { username: "مهسا شریفی", message: "اگه الان حرکت نکنم ۶ ماه دیگه باید دوباره همین حرفا رو گوش بدم", timeOffset: 6.33},
      { username: "آرمان قاسمی", message: "شجاعت می‌خواد", timeOffset: 9.5},
      { username: "پریسا امینی", message: "کسی دیگه هم داره قلبش تند می‌زنه؟", timeOffset: 12.67},
      { username: "کامران فرهادی", message: "کاش مغزم این بار نزنه زیرش", timeOffset: 15.83},
      { username: "الهام رستمی", message: "از خودم خسته شدم از عقب افتادن", timeOffset: 19},
    ]
  },
  {
    start: "01:16:02:00",
    end: "01:17:06:00",
    comments: [
      { username: "نیلوفر اکبری", message: "آزمون و خطا رو تا دلت بخواد رفتم، تهش هیچی 😐", timeOffset: 0},
      { username: "شایان محمودی", message: "من دیگه حوصله با کله رفتن تو دیوار رو ندارم", timeOffset: 5.33},
      { username: "فرزانه یوسفی", message: "قطعا تصمیمم استفاده از سیستم شماست!", timeOffset: 10.67},
      { username: "پویان حسینی", message: "قبلا راه یک رو ده ها بار رفتم فقط شکست خوردم", timeOffset: 16},
      { username: "شادی مهدوی", message: "منظورتون از سیستم چیه کاش بیشتر توضیح بدین خیلی مشتاقم!", timeOffset: 21.33},
      { username: "یاسر نادری", message: "شدنی نیست تنهایی موفق شدن بنظرم", timeOffset: 26.67},
      { username: "ندا رضوی", message: "سیستم شما چیه؟؟ بیشتر توضیح بدین", timeOffset: 32},
      { username: "آیدا صالحی", message: "من نمیفهمم منظورتون از سیستم چیه", timeOffset: 37.33},
      { username: "شهاب کرمانی", message: "صدرصد مسیر دوم ولی بیشتر توضیح بدین ببنیم چیه دقیقا", timeOffset: 42.67},
      { username: "فرهاد رضوانی", message: "سیستم یعنی کل ابزار ها؟", timeOffset: 48},
      { username: "مهدی صفری", message: "آموزش هم داره سیستمتون؟", timeOffset: 53.33},
      { username: "علی‌رضا فتحی", message: "بستگی داره سیستمی که ازش تعریف میکنین چی باشه دقیقا، ولی اگه یه چیز درست حسابی باشه قطعا مسیر دو تصمیمه", timeOffset: 58.67},
      { username: "محمدعلی نوری", message: "قطعا در کنار کسی که خودش موفق بوده شانس موفقیت خیلی بیشتره", timeOffset: 64},
    ]
  },
  {
    start: "01:17:06:00",
    end: "01:17:21:00",
    comments: [
      { username: "امیررضا کریمی", message: "فرض کن یه اپلیکیشن باشه که هرچی برای پیشرفت بدنی نیاز داری توش باشه 😂 خیلی خوب میشه", timeOffset: 0},
      { username: "سارا احمدی", message: "یه هوش مصنوعی پیشرفته که خودش برنامه تمرین و تغذیه‌تو بسازه خیلی خوبه", timeOffset: 3.75},
      { username: "محمدحسین رضایی", message: "بچه‌ها کسی می‌دونه چیه سوپرایزش؟", timeOffset: 7.5},
      { username: "فاطمه نوری", message: "یعنی تخفیف؟ اپلیکیشن؟ اشتراک؟ بگو دیگه 😐", timeOffset: 11.25},
      { username: "علی محمدی", message: "من دیگه دودلم نیستم، فقط بگو چیه 🤦‍♂️", timeOffset: 15},
    ]
  },
{
    start: "01:17:21:00",
    end: "01:17:49:00",
    comments: [
      { username: "حسین علیزاده", message: "مربی چقدر حرفه‌ای توضیح میده", timeOffset: 0},
      { username: "مریم موسوی", message: "این همون اپلیکیشنیه که گفتی پیشرفتو خودکار پیگیری می‌کنه؟", timeOffset: 4},
      { username: "رضا کاظمی", message: "عجب چیزیه! خودش برنامه تمرین و تغذیه‌تو می‌سازه؟", timeOffset: 8},
      { username: "نرگس جعفری", message: "کِی لانچ رسمی میشه؟؟", timeOffset: 12},
      { username: "امیرحسین طاهری", message: "من الان فقط می‌خوام ببینم چطوری کار می‌کنه", timeOffset: 16},
      { username: "سمیرا رحیمی", message: "این اپلیکیشن دقیقا چیه؟؟", timeOffset: 20},
      { username: "سینا باقری", message: "بازش کنین دقیقا چیه و چطوری میتونه به ما کمک کنه؟", timeOffset: 24},
      { username: "مهسا شریفی", message: "بچه ها من این اپ رو از همون اول عضو شدم فوق‌العادسسس اصلا فکر نمیکردم همچین اپلیکیشنی تو ایران باشه", timeOffset: 28},
    ]
  },
{
    start: "01:17:49:00",
    end: "01:18:27:00",
    comments: [
      { username: "کامران فرهادی", message: "چطوری کار میکنه و میتونیم ازش استفاده کنیم؟؟", timeOffset: 0},
      { username: "الهام رستمی", message: "خیلی دوست دارم بدونم دقیقا چیه؟", timeOffset: 6.33},
      { username: "سعید نجفی", message: "چند ماه صبر ارزششو داره وقتی نتیجش بشه همچین اپلیکیشنی", timeOffset: 12.67},
      { username: "نیلوفر اکبری", message: "توسط متخصص طراحی شده؟؟", timeOffset: 19},
      { username: "ادمین", message: "بله، تیم فنی و مربیان متخصص پشت این اپلیکیشن بودن", replyToUsername: "نیلوفر اکبری", replyToMessage: "توسط متخصص طراحی شده؟؟", isAdmin: true, timeOffset: 25.33},
      { username: "شایان محمودی", message: "الان توقعمون رفت بالا… معرفیش کنین ببنیم چیه این اپلیکیشن", timeOffset: 31.67},
      { username: "فرزانه یوسفی", message: "شما ساختی، ما استفاده می‌کنیم، تیم‌ورک نامحسوس 😂", timeOffset: 38},
      { username: "پویان حسینی", message: "من به چیزی اعتماد می‌کنم که براش زحمت کشیده باشن", timeOffset: undefined},
    ]
  },
{
    start: "01:18:27:00",
    end: "01:18:00:43",
    comments: [
      { username: "یاسر نادری", message: "وااای چقدر خفنه 🤯", timeOffset: 0},
      { username: "ندا رضوی", message: "این واقعاً تو ایرانه؟ عجب چیز خفنیه", timeOffset: -1.77},
      { username: "آیدا صالحی", message: "انگار یه اپلیکیشن خارجی گرونه", timeOffset: -3.54},
      { username: "شهاب کرمانی", message: "اینا همه امکاناتشه؟ خیلی حرفه‌ایه", timeOffset: -5.31},
      { username: "فرهاد رضوانی", message: "من فکر نمی‌کردم اینقدر کامل باشه 😳", timeOffset: -7.09},
      { username: "ادمین", message: "این فقط یه بخششه، جلوتر امکانات بیشتری می‌بینین", replyToUsername: "فرهاد رضوانی", replyToMessage: "من فکر نمی‌کردم اینقدر کامل باشه 😳", isAdmin: true, timeOffset: -8.86},
      { username: "مهدی صفری", message: "تجربه کاربریش خیلی تمیزه", timeOffset: -10.63},
      { username: "علی‌رضا فتحی", message: "شدیداا مشتاقم ازش استفاده کنمم", timeOffset: -12.4},
      { username: "محمدعلی نوری", message: "من انتظار نداشتم UI و طراحیش انقدر حرفه ای باشه!", timeOffset: -14.17},
      { username: "حسین‌رضا احمدی", message: "این اگه همون چیزی باشه که تو ذهنم فوق العادس", timeOffset: -15.94},
      { username: "امیرمحمد رضایی", message: "هوش مصنوعی هم داره؟؟", timeOffset: -17.71},
      { username: "امیررضا کریمی", message: "این همون پنل پیگیری پیشرفته؟", timeOffset: -19.48},
      { username: "سارا احمدی", message: "هزینش چقدره؟؟", timeOffset: -21.26},
      { username: "محمدحسین رضایی", message: "اشتراکیه؟", timeOffset: -23.03},
      { username: "فاطمه نوری", message: "ابزار پیگیری پیشرفت هم داره؟", timeOffset: -24.8},
      { username: "علی محمدی", message: "چه قابلیت هایی داره؟", timeOffset: -26.57},
      { username: "زهرا صادقی", message: "هزینش چقدره؟ امیدوارم گرون نباشه خیلی خفنه", timeOffset: undefined},
    ]
  },
{
    start: "01:18:43:00",
    end: "01:19:07:00",
    comments: [
      { username: "رضا کاظمی", message: "بچه ها اشتراکشو من قبلا گرفتم هوش مصنوعیش فوق العادس روزانه پیشرفتتو تحلیل میکنه و برنامتو کالیبره می‌کنه", timeOffset: 0},
      { username: "رضا کاظمی", message: "یعنی چی مربی هم نظارت داره؟ پایش خودکار هم داره؟؟", timeOffset: 2.67},
      { username: "نرگس جعفری", message: "همچین اپلیکیشنیو اولین باره تو ایران میبینم 👏🏻👏🏻 دمتون گرم سختیشو به جون خریدن و مثل بقیه وبینارا دوره نفروختین", timeOffset: 5.33},
      { username: "امیرحسین طاهری", message: "برنامه غذایی هم میده؟؟", timeOffset: 8},
      { username: "سمیرا رحیمی", message: "قدم به قدمشو خود هوش مصنوعی میسازه یعنی؟ از تحلیل بدن تا برنامه‌ریزی؟", timeOffset: 10.67},
      { username: "سینا باقری", message: "اگه امکان ارتباط مستقیم با مربی هم داشته باشه خیلی خوبه", timeOffset: 13.33},
      { username: "مهسا شریفی", message: "الان فهمیدم چرا گفتی برنامه نه آموزش، دم تیم نوآور و حرفه ایتون گرم 👏🏻", timeOffset: 16},
      { username: "آرمان قاسمی", message: "از کجا میتونم دانلودش کنم؟", timeOffset: 18.67},
      { username: "پریسا امینی", message: "چطوری باید دسترسی داشته باشیم بهش؟؟", timeOffset: 21.33},
      { username: "کامران فرهادی", message: "روی اندروید هم میاد؟", timeOffset: 24},
      { username: "ادمین", message: "بله اپلیکیشن روی همه گوشی ها و حتی لپ تاپ و کامپیوتر قابل اجرا و استفادست", replyToUsername: "کامران فرهادی", replyToMessage: "روی اندروید هم میاد؟", isAdmin: true, timeOffset: undefined},
    ]
  },
  {
    start: "01:19:07:00",
    end: "01:20:00:00",
    comments: [
      { username: "پویان حسینی", message: "یعنی هر سوالی درباره برنامه‌م بپرسم جواب میده؟", timeOffset: 0},
      { username: "شادی مهدوی", message: "پرامپت ها همش راجع به تمرین و تغذیه‌ست؟", timeOffset: 5.3},
      { username: "یاسر نادری", message: "روی چه اطلاعاتی آموزش دیده هوش مصنوعیش؟", timeOffset: 10.6},
      { username: "ادمین", message: "روی داده‌های واقعی بدنی و تغذیه‌ای زیر نظر مربیان فیتینو", replyToUsername: "یاسر نادری", replyToMessage: "روی چه اطلاعاتی آموزش دیده هوش مصنوعیش؟", isAdmin: true, timeOffset: 15.9},
      { username: "ندا رضوی", message: "سابقه تمریناتمو یادش می‌مونه؟", timeOffset: 21.2},
      { username: "ادمین", message: "جواب دقیق بر اساس مرحله‌ای که هستید میده", replyToUsername: "ندا رضوی", replyToMessage: "سابقه تمریناتمو یادش می‌مونه؟", isAdmin: true, timeOffset: 26.5},
      { username: "آیدا صالحی", message: "این خیلی خوبه که دقیقا واسه پایش بدنی آموزش داده شده هوش مصنوعیش و مخصوص همین کاره", timeOffset: 31.8},
      { username: "شهاب کرمانی", message: "متخصص تغذیه جدا ویزیتش خیلی گرونه، این چقدره؟", timeOffset: 37.1},
      { username: "فرهاد رضوانی", message: "یعنی برنامه روزانه‌هم میده برای پیشرفت؟", timeOffset: 42.4},
      { username: "مهدی صفری", message: "سرعت تحلیلش چطوره دقیقه؟", timeOffset: 47.7},
      { username: "سعید نجفی", message: "من دارم پلن VIP رو، خیلی سریعه هوش مصنوعیش بلافاصله که داده جدید ثبت میکنی برنامه رو آپدیت می‌کنه دقیق و کامله", timeOffset: 53},
      { username: "علی‌رضا فتحی", message: "بعد از ۳ ماه باید دوباره ثبت‌نام کنیم؟ بیشتر توضیح بده", timeOffset: undefined},
      { username: "محمدعلی نوری", message: "همین که همه چی یکجا و زیر نظر مربیه قانع شدم که باید ثبت‌نام کنم😂😂 فقط بگو چطوری باید بگیرم", timeOffset: undefined},
    ]
  },
  {
    start: "01:20:00:00",
    end: "01:20:35:00",
    comments: [
      { username: "علی محمدی", message: "وااو همرو خودش انجام میده؟", timeOffset: 0},
      { username: "زهرا صادقی", message: "بلاخره یه اپلیکیشن درست حسابی تو ایران پیدا کردیم😂", timeOffset: 2.5},
      { username: "حسین علیزاده", message: "کار میکنه ابزار هاش واقعا؟؟", timeOffset: 5},
      { username: "ادمین", message: "بله، همه بخش‌ها تست شده و آماده‌ست برای اجرا", replyToUsername: "حسین علیزاده", replyToMessage: "کار میکنه ابزار هاش واقعا؟؟", isAdmin: true, timeOffset: 7.5},
      { username: "مریم موسوی", message: "ایده یابی هوشمند یعنی چی بیشتر توضیح بدین؟", timeOffset: 10},
      { username: "ادمین", message: "ابزار ایده یابی هوشمند بر اساس علایق شما و مهارت های شما و بازار بهترین ایده های ممکن رو واستون پیدا میکنه", replyToUsername: "مریم موسوی", replyToMessage: "ایده یابی هوشمند یعنی چی بیشتر توضیح بدی...", isAdmin: true, timeOffset: 12.5},
      { username: "رضا کاظمی", message: "سیستم مدیریت فروش هم داره؟", timeOffset: 15},
      { username: "نرگس جعفری", message: "تا حالا هیچ‌چیزی این‌قدر کامل ندیده بودم", timeOffset: 17.5},
      { username: "امیرحسین طاهری", message: "می‌خوام بدونم مشتری‌یابی چطوری کار میکنه؟", timeOffset: 20},
      { username: "سمیرا رحیمی", message: "هزینش چقدره؟؟", timeOffset: 22.5},
      { username: "سینا باقری", message: "اگه واقعا همه این چیزارو داشته باشه فوق العادس🔥", timeOffset: 25},
      { username: "مهسا شریفی", message: "اشتراکیه؟", timeOffset: 27.5},
      { username: "آرمان قاسمی", message: "دقیقا برای همین اسمش برنامه اختصاصیه نه یه رژیم عمومی ساده", timeOffset: 30},
      { username: "پریسا امینی", message: "از همین امشب میتونم ازش استفاده کنن؟", timeOffset: 32.5},
      { username: "کامران فرهادی", message: "هر ماه باید اشتراکشو تمدید کنیم؟", timeOffset: 35},
    ]
  },
  {
    start: "01:20:35:00",
    end: "01:21:10:00",
    comments: [
      { username: "شادی مهدوی", message: "این‌که بازخورد می‌ده خیلی مهمه", timeOffset: 0},
      { username: "یاسر نادری", message: "یعنی اگه اشتباه کنیم خودش اصلاح میکنه؟", timeOffset: 7},
      { username: "ندا رضوی", message: "خیلی حرفه ایه دمتون گرم دقیقا واسه آدمایی مثل ما ساخته شده که میخوان هوش مصنوعیو وارد کارشون کنن", timeOffset: 14},
      { username: "آیدا صالحی", message: "من عاشق این بخش شدم، همین الان", timeOffset: 21},
      { username: "شهاب کرمانی", message: "این واقعاً فرق بین سیستم و دوره‌ست", timeOffset: 28},
      { username: "فرهاد رضوانی", message: "ایول مثل یه مربی تو همه مراحل کنارته 👌🏼", timeOffset: 35},
    ]
  },
  {
    start: "01:21:10:00",
    end: "01:21:35:00",
    comments: [
      { username: "نیلوفر اکبری", message: "من قبلا تهیه کردم اشتراکشو واقعا پلتفرم فوق العاده ایه 👌👌", timeOffset: 0},
      { username: "امیرمحمد رضایی", message: "منم گرفتم اشتراکشو سیستم اتوماسیونم این ماه تموم شد تقریبا ۹۰ درصد کارهارو خود هوش مصنوعی انجام میده", timeOffset: 6.25},
      { username: "امیررضا کریمی", message: "همه مراحلی که تو کارگاه گفتین رو با این پلتفرم میشه پیش برد دیگه درسته؟", timeOffset: 12.5},
      { username: "شایان محمودی", message: "اره همرو داره کامل هم‌ آموزش داره هم هوش مصنوعی که اون بخش هارو میسازه دارمش من رو گوشیم", timeOffset: 18.75},
      { username: "سارا احمدی", message: "یه چیز جالبی که من اشتراکشو تهیه کردم داشت این بود که مدام آپدیت میشه و بهترو بهتر میشه قشنگ مشخصه یه تیم فنی درست حسابی پشتشه", timeOffset: 25},
    ]
  },
  {
    start: "01:21:35:00",
    end: "01:22:05:00",
    comments: [
      { username: "محمدحسین رضایی", message: "چقدر طول کشیده به این درآمد برسه؟", timeOffset: 0},
      { username: "فاطمه نوری", message: "مشتریاش خارجی بودن؟", timeOffset: 7.5},
      { username: "علی محمدی", message: "این درآمد تو ماه؟ یا کل پروژه؟", timeOffset: 15},
      { username: "زهرا صادقی", message: "کاش درآمد من این بود", timeOffset: 22.5},
      { username: "حسین علیزاده", message: "مشتریارو هوش مصنوعی پیدا کرده واسش؟", timeOffset: 30},
    ]
  },
  {
    start: "01:22:05:00",
    end: "01:24:05:00",
    comments: [
      { username: "کامران فرهادی", message: "اینا رو جدا بخوای بگیری (مربی + متخصص تغذیه + باشگاه) هزینه‌ش خیلی بیشتر از این میشه", timeOffset: 0},
      { username: "الهام رستمی", message: "تو این پلن پایش روزانه هم قاطیشه یا جدا حساب میشه؟؟؟", timeOffset: 12},
      { username: "سعید نجفی", message: "ماه پیش یه دوره آنلاین بی‌کیفیت رو ۲۰۰ تومن خریدم اصلا پیگیری نداشت 🤦‍♂️", timeOffset: 24},
      { username: "نیلوفر اکبری", message: "پشتیبانی مربی هم داره پلتفرم؟ جایی به مشکل خوردیم جواب میدین؟", timeOffset: 36},
      { username: "ادمین", message: "بله هر روز هفته هر سوالی داشته باشین میتونین از مربی بپرسین تا توی مسیر رسیدن به هدفتون تنها نمونین", replyToUsername: "نیلوفر اکبری", replyToMessage: "پشتیبانی مربی هم داره پلتفرم؟ جایی به م...", isAdmin: true, timeOffset: 48},
      { username: "شایان محمودی", message: "چقدر پشیمونم کلی پول سر باشگاه‌های چرت و پرت بدون برنامه هزینه کردم", timeOffset: 60},
      { username: "فرزانه یوسفی", message: "اره دقیقا ارزون‌ترین متخصص تغذیه که دیدم ویزیتش ماهی چند میلیونه", timeOffset: 72},
      { username: "پویان حسینی", message: "برنامه غذایی بر اساس سفره ایرانی هم می‌بندین؟؟ ایول", timeOffset: 84},
      { username: "شادی مهدوی", message: "پس اینجا هزینه اضافه‌ای نداره یا این پلتفرم باید ماهانه شارژ کنیم؟", timeOffset: 96},
      { username: "یاسر نادری", message: "اگر مربی و متخصص تغذیه رو جدا بگیری هزینه‌ش خیلی بیشتره", timeOffset: 108},
      { username: "ندا رضوی", message: "دقیقا درست میگن واقعا همه این خدمات رو توی یه پلتفرم داره من دیدم رو گوشی دوستم داشت استفاده میکرد خیلی جالب بود", timeOffset: 120},
    ]
  },
  {
    start: "01:24:05:00",
    end: "01:24:38:00",
    comments: [
      { username: "فرهاد رضوانی", message: "یعنی این برنامه جای مربی و متخصص تغذیه و باشگاه رو با هم می‌گیره؟", timeOffset: 0},
      { username: "مهدی صفری", message: "خب این پلن هزینه‌ش ماهانه‌ست؟", timeOffset: 4.13},
      { username: "علی‌رضا فتحی", message: "هزینه این دوره چقدره؟", timeOffset: 8.25},
      { username: "محمدعلی نوری", message: "خیلی از این خدمات اصلا جای دیگه یکجا پیدا نمیشه", timeOffset: 12.38},
      { username: "حسین‌رضا احمدی", message: "پایش هوش مصنوعی رو هم بدون هزینه اضافه میدین؟", timeOffset: 16.5},
      { username: "امیرمحمد رضایی", message: "اگه بخوای مربی و متخصص تغذیه رو جدا بگیری ماهی چند میلیون آب می‌خوره", timeOffset: 20.63},
      { username: "امیررضا کریمی", message: "خیلی دوست دارم بدونم قیمت دوره شما چقدره!", timeOffset: 24.75},
      { username: "سارا احمدی", message: "بنظرم برای یه برنامه اختصاصی ۳ ماهه کامل به این قیمت واقعا می‌ارزه", timeOffset: 28.88},
      { username: "محمدحسین رضایی", message: "من قبلا جدا جدا مربی و متخصص تغذیه گرفته بودم خیلی گرون‌تر از این می‌شد ولی این پلن همرو داره", timeOffset: 33},
    ]
  },
  {
    start: "01:24:38:00",
    end: "01:26:20:00",
    comments: [
      { username: "ندا رضوی", message: "هزینه دوره شما چقدره؟", timeOffset: 0},
      { username: "آیدا صالحی", message: "پلن ۳ ماهه یکجا حساب میشه؟", timeOffset: 14.57},
      { username: "شهاب کرمانی", message: "بعد از ۳ ماه باید تمدید کنیم؟", timeOffset: 29.14},
      { username: "فرهاد رضوانی", message: "بنظرم برای این کیفیت خیلی هم منصفانه‌ست", timeOffset: 43.71},
      { username: "مهدی صفری", message: "با پایش روزانه AI و همراهی مربی بنظرم واقعا می‌ارزه", timeOffset: 58.28},
      { username: "علی‌رضا فتحی", message: "امیدوارم قیمت مناسبی داشته باشه🙌", timeOffset: 72.85},
      { username: "محمدعلی نوری", message: "امیدوارم امکان پرداخت قسطی هم داشته باشه", timeOffset: 87.42},
    ]
  },
  {
    start: "01:26:20:00",
    end: "01:28:37:00",
    comments: [
      { username: "امیررضا کریمی", message: "خیلی خوبه بنظرم می ارزه", timeOffset: 0},
      { username: "سارا احمدی", message: "یکجا باید کل ۳ ماه رو پرداخت کنیم؟؟", timeOffset: 12.45},
      { username: "محمدحسین رضایی", message: "قسطی هم میشه خرید کرد؟", timeOffset: 24.9},
      { username: "فاطمه نوری", message: "پلن VIP فرق داره با CIP؟", timeOffset: 37.35},
      { username: "علی محمدی", message: "پایش روزانه توی هر دو پلن هست؟ خیلی خوبه اگه اینطوریه", timeOffset: 49.8},
      { username: "ادمین", message: "بله، پایش هوشمند روزانه توی هر دو پلن هست؛ فرق اصلیشون سطح پشتیبانی مربیه", replyToUsername: "زهرا صادقی", replyToMessage: "پلن CIP دقیقا چه فرقی با VIP داره؟", isAdmin: true, timeOffset: 62.25},
      { username: "حسین علیزاده", message: "من فقط نگرانم زود تموم بشه ظرفیتش", timeOffset: 74.7},
      { username: "مریم موسوی", message: "یعنی همین یه پرداخت، هم مربی هم AI هم برنامه غذایی همرو داره؟", timeOffset: 87.15},
      { username: "ادمین", message: "بله دقیقا، همه‌ی این‌ها توی یک پلن ۳ ماهه‌ست", replyToUsername: "مریم موسوی", replyToMessage: "یعنی همین یه پرداخت، هم مربی هم AI هم برنامه غذایی همرو داره؟", isAdmin: true, timeOffset: 99.6},
      { username: "رضا کاظمی", message: "می ارزه ولی الان توی کارتم ندارم این مبلغو 🤦‍♂️", timeOffset: 112.05},
      { username: "نرگس جعفری", message: "من الان باید فقط راه پرداخت رو بدونم بگیرمش", timeOffset: 124.5},
    ]
  },
  {
    start: "01:28:37:00",
    end: "01:29:04:00",
    comments: [
      { username: "سمیرا رحیمی", message: "واقعا؟؟؟", timeOffset: 0},
      { username: "سینا باقری", message: "استرس گرفتم ظرفیت تموم شه 😐", timeOffset: 2.7},
      { username: "ادمین", message: "ظرفیت این دوره محدود به ۵۰۰ نفره", replyToUsername: "سینا باقری", replyToMessage: "استرس گرفتم ظرفیت تموم شه 😐", isAdmin: true, timeOffset: 5.4},
      { username: "مهسا شریفی", message: "دمتون گرمممم خیلی خوبه این قیمت واسه همچین برنامه‌ای فقط بگین چطوری ثبت‌نام کنیم؟؟", timeOffset: 8.1},
      { username: "آرمان قاسمی", message: "دقیقاً چجوری باید ثبت‌نام کنیم؟ لینک میاد؟", timeOffset: 10.8},
      { username: "پریسا امینی", message: "بعد از ۳ ماه هزینه اضافه‌ای هم داره؟", timeOffset: 13.5},
      { username: "کامران فرهادی", message: "دیگه نیاز نیست جای دیگه مربی بگیریم؟؟", timeOffset: 16.2},
      { username: "الهام رستمی", message: "من اعلان می‌ذارم همین الان دکمه بزنم", timeOffset: 18.9},
      { username: "سعید نجفی", message: "واقعا این پلن ارزشش رو داره، من پلن VIP رو گرفتم ۱ میلیون و ۴۹۰ تومنه برای ۳ ماه کامل واقعا می‌ارزه", timeOffset: 21.6},
      { username: "نیلوفر اکبری", message: "حساب کردم روزی حدود ۱۶ هزار تومن میشه، به نسبت باشگاه و مربی جدا خیلی مقرون‌به‌صرفه‌ست", timeOffset: 24.3},
    ]
  },
  {
    start: "01:29:04:00",
    end: "01:31:13:00",
    comments: [
      { username: "پویان حسینی", message: "لینک ثبت‌نام رو نمیزارین؟", timeOffset: 0},
      { username: "شادی مهدوی", message: "از کجا ثبت نام کنیم؟؟", timeOffset: 6.45},
      { username: "یاسر نادری", message: "میشه یکم فرصت بدین باید پول قرض کنم 😂", timeOffset: 12.9},
      { username: "ندا رضوی", message: "شت خیلی ظرفیتش زود پر میشه لطفا بیشتر ظرفیت باز کنین", timeOffset: 19.35},
      { username: "آیدا صالحی", message: "۱۲ شب همین امشب؟؟", timeOffset: 25.8},
      { username: "ادمین", message: "بله، ظرفیت این دوره ۵۰۰ نفره و داره تکمیل میشه", replyToUsername: "آیدا صالحی", replyToMessage: "۱۲ شب همین امشب؟؟", isAdmin: true, timeOffset: 32.25},
      { username: "شهاب کرمانی", message: "سایت باز نمیشه فکنم همه ریختن تو سایت 🤦‍♂️", timeOffset: 38.7},
      { username: "فرهاد رضوانی", message: "قسطی هم میشه تهیه کرد؟؟", timeOffset: 45.15},
      { username: "ادمین", message: "بله امکانش هست داخل سایت شرایطش نوشته شده کلیک کنین و ببینین", replyToUsername: "فرهاد رضوانی", replyToMessage: "قسطی هم میشه تهیه کرد؟؟", isAdmin: true, timeOffset: 51.6},
      { username: "مهدی صفری", message: "نحوه ثبت نام رو لطفا بگین ثبت نام کنم", timeOffset: 58.05},
      { username: "علی‌رضا فتحی", message: "ای کاش ظرفیت پر نشه تا چند ساعت دیگه که پول رو جور میکنم", timeOffset: 64.5},
      { username: "محمدعلی نوری", message: "با این قیمت، معلومه سریع پر میشه", timeOffset: 70.95},
      { username: "حسین‌رضا احمدی", message: "همین الان چند نفر ثبت‌نام کردن؟", timeOffset: 77.4},
      { username: "الهام رستمی", message: "من گرفتم", timeOffset: 83.85},
      { username: "امیرمحمد رضایی", message: "منم ثبت نام کردم", timeOffset: 90.3},
      { username: "امیررضا کریمی", message: "خریدم", timeOffset: 96.75},
      { username: "سارا احمدی", message: "حس میکنم بلاخره یجا پولمو درست خرج کردم", timeOffset: 103.2},
      { username: "محمدحسین رضایی", message: "من پرداخت کردم، پنلم فعال شد", timeOffset: 109.65},
      { username: "فاطمه نوری", message: "منم گرفتم چقدر پنلش حرفه‌ای و در عین حال سادس!", timeOffset: 116.1},
      { username: "علی محمدی", message: "آقا نخرین ظرفیت واسه منم بزارین 😂", timeOffset: 122.55},
      { username: "زهرا صادقی", message: "پلن VIP رو گرفتم کد فعال‌سازی کی میاد؟؟", timeOffset: 125.5},
      { username: "ادمین", message: "بلافاصله بعد از پرداخت، پیامکی", replyToUsername: "زهرا صادقی", replyToMessage: "پلن VIP رو گرفتم کد فعال‌سازی کی میاد؟؟", isAdmin: true, timeOffset: 128.45},
      { username: "حسین علیزاده", message: "ظرفیت رو باید بیشتر میذاشتین بنظرم خیلی کمه ۵۰۰ نفر", timeOffset: 128.9},
    ]
  },
{
    start: "01:31:13:00",
    end: "01:33:36:00",
    comments: [
      { username: "رضا کاظمی", message: "لطفاً لینک ثبت‌نام رو سریع بدین", timeOffset: 0},
      { username: "نرگس جعفری", message: "لینک باز نمیشهه چرااا میخوام ثبت‌نام کنم", timeOffset: 7.53},
      { username: "امیرحسین طاهری", message: "لینک بچه ها پایین صفحه اومده کلیک کنین روش یکم منتظر بمونین باز میشه", timeOffset: 15.06},
      { username: "سعید نجفی", message: "من گرفتم", timeOffset: 22.59},
      { username: "سمیرا رحیمی", message: "ثبت نام منم تکمیل شد", timeOffset: 30.12},
      { username: "سینا باقری", message: "واسه منم فعال شد دم تیم خفنتون گرم آقای رشیدآبادی حلالتون", timeOffset: 37.65},
      { username: "مهسا شریفی", message: "بچه‌ها هرکی ثبت‌نام کرد الان بگه ببینیم چند نفریم", timeOffset: 45.18},
      { username: "آرمان قاسمی", message: "من دارم میرم ثبت‌نام کنم", timeOffset: 52.71},
      { username: "پریسا امینی", message: "من دارم بابامو راضی میکنم پول بده😂", timeOffset: 60.24},
      { username: "کامران فرهادی", message: "منم تصمیمو گرفتم پلن VIP رو میگیرم", timeOffset: 67.77},
      { username: "الهام رستمی", message: "بهترین تصمیمه بنظرم خیلی بهتر از باشگاه‌های بی‌برنامه‌ایه که قبلا رفتم یه برنامه درست حسابیه خیلی فرق میکنه", timeOffset: 75.3},
      { username: "سعید نجفی", message: "منم گرفتم بچه ها روی خودتون سرمایه‌گذاری کنید تا ظرفیت تموم نشده", timeOffset: 82.83},
      { username: "نیلوفر اکبری", message: "ثبت‌نام کردم همین الان", timeOffset: 90.36},
      { username: "شایان محمودی", message: "واسه منم فعال شد پنلش خیلی تمیزه دمشون گرم", timeOffset: 97.89},
      { username: "فرزانه یوسفی", message: "من واسه خواهرم هم همین پلن رو گرفتم", timeOffset: 105.42},
      { username: "پویان حسینی", message: "فعال شد واسه منم", timeOffset: 112.95},
      { username: "شادی مهدوی", message: "با این قیمت یه برنامه اختصاصی این‌شکلی جای دیگه گیر نمیاد، منم گرفتمش 😂❤️", timeOffset: 120.48},
      { username: "یاسر نادری", message: "اینکه همه‌مون تو یه گروه پشتیبانی مشترک با مربی هستیم خیلی خوبه", timeOffset: 128.01},
      { username: "ندا رضوی", message: "پلن CIP هم همینجوری فعال میشه؟ منم امشب می‌خرمش", timeOffset: 142.97},
    ]
  }
];

// Helper function to convert seconds to time string format "HH:MM:SS:MS"
export function secondsToTimeString(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const ms = Math.floor((seconds - totalSeconds) * 100);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
}

// Helper function to convert time string like "01:23:36:05" to seconds
export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 4) {
    // Format: HH:MM:SS:MS
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 100;
  } else if (parts.length === 3) {
    // Format: MM:SS:MS or HH:MM:SS
    return parts[0] * 60 + parts[1] + (parts[2] || 0) / 100;
  } else if (parts.length === 2) {
    // Format: MM:SS
    return parts[0] * 60 + parts[1];
  }
  return 0;
}
