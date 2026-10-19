// Short, mobile-readable versions of the policies on zaraimandi.com
// (Terms & Conditions, Privacy Policy, Cancellation & Refund). Each page links
// to the full text on the website. Update here when the website changes.

export type LegalDoc = "terms" | "privacy" | "refunds";

type Bi = { en: string; ur: string };
export type LegalSection = { title: Bi; points: Bi[] };
export type LegalContent = {
  title: Bi;
  sections: LegalSection[];
  url: string;
};

export const LEGAL_URL = "https://zaraimandi.com/terms-and-conditions";

export const LEGAL: Record<LegalDoc, LegalContent> = {
  terms: {
    title: { en: "Terms & Conditions", ur: "شرائط و ضوابط" },
    sections: [
      {
        title: { en: "Who can use it", ur: "کون استعمال کر سکتا ہے" },
        points: [
          { en: "The terms apply to everyone using Zarai Mandi: customers, vendors and anyone sharing agri content.", ur: "یہ شرائط ہر صارف پر لاگو ہیں: گاہک، فروخت کنندہ اور زرعی مواد شیئر کرنے والے۔" },
          { en: "You must be of legal age to use the service.", ur: "سروس استعمال کرنے کے لیے آپ کا قانونی عمر کا ہونا ضروری ہے۔" },
          { en: "We may update these terms; using the app after an update means you accept the new version.", ur: "ہم یہ شرائط بدل سکتے ہیں؛ تبدیلی کے بعد ایپ کا استعمال نئی شرائط کی قبولیت ہے۔" },
        ],
      },
      {
        title: { en: "Fair use", ur: "درست استعمال" },
        points: [
          { en: "No unlawful use, harassment, false information or harmful code.", ur: "غیر قانونی استعمال، ہراسانی، غلط معلومات یا نقصان دہ کوڈ کی اجازت نہیں۔" },
          { en: "No copying of our content and no scraping or collecting other users' data.", ur: "ہمارا مواد نقل کرنا یا دوسرے صارفین کا ڈیٹا جمع کرنا منع ہے۔" },
        ],
      },
      {
        title: { en: "Our content", ur: "ہمارا مواد" },
        points: [
          { en: "The app, software, rates, reports and videos belong to Zarai Mandi.", ur: "ایپ، سافٹ ویئر، ریٹس، رپورٹس اور ویڈیوز زرعی منڈی کی ملکیت ہیں۔" },
          { en: "Your subscription lets you use them for yourself; it does not give you ownership.", ur: "سبسکرپشن آپ کو ذاتی استعمال کی اجازت دیتی ہے، ملکیت نہیں۔" },
        ],
      },
      {
        title: { en: "Rates and responsibility", ur: "ریٹس اور ذمہ داری" },
        points: [
          { en: "We work hard on accuracy but cannot guarantee every rate. Use the app at your own risk.", ur: "ہم درستگی کی پوری کوشش کرتے ہیں مگر ہر ریٹ کی ضمانت نہیں دے سکتے۔ استعمال اپنی ذمہ داری پر کریں۔" },
          { en: "You are responsible for any claim caused by breaking these terms.", ur: "ان شرائط کی خلاف ورزی سے پیدا ہونے والے کسی دعوے کے آپ ذمہ دار ہیں۔" },
        ],
      },
      {
        title: { en: "Ending access", ur: "رسائی کا خاتمہ" },
        points: [
          { en: "We may suspend or end an account for false registration details, misuse, legal requests or breaking these terms.", ur: "غلط رجسٹریشن، غلط استعمال، قانونی درخواست یا شرائط کی خلاف ورزی پر اکاؤنٹ معطل یا ختم کیا جا سکتا ہے۔" },
        ],
      },
      {
        title: { en: "Law", ur: "قانون" },
        points: [
          { en: "Pakistani law applies. Disputes are heard by the courts of Sindh at Karachi.", ur: "پاکستانی قانون لاگو ہے۔ تنازعات کی سماعت کراچی، سندھ کی عدالتوں میں ہوگی۔" },
          { en: "If one part of these terms is unenforceable, the rest still applies.", ur: "اگر کوئی شق قابلِ نفاذ نہ ہو تو باقی شرائط برقرار رہیں گی۔" },
        ],
      },
    ],
    url: LEGAL_URL,
  },

  privacy: {
    title: { en: "Privacy Policy", ur: "رازداری کی پالیسی" },
    sections: [
      {
        title: { en: "What we collect", ur: "ہم کیا جمع کرتے ہیں" },
        points: [
          { en: "Contact details: name, phone number, email and address.", ur: "رابطے کی معلومات: نام، فون نمبر، ای میل اور پتہ۔" },
          { en: "Account details: your login and profile (city, products you follow).", ur: "اکاؤنٹ کی معلومات: لاگ اِن اور پروفائل (شہر، آپ کی منتخب اجناس)۔" },
          { en: "Messages you send us in the app, by email, WhatsApp or social media.", ur: "ایپ، ای میل، واٹس ایپ یا سوشل میڈیا پر بھیجے گئے پیغامات۔" },
          { en: "Subscription and payment history.", ur: "سبسکرپشن اور ادائیگی کی تاریخ۔" },
        ],
      },
      {
        title: { en: "How we use it", ur: "ہم اسے کیسے استعمال کرتے ہیں" },
        points: [
          { en: "To provide your subscription and answer your questions.", ur: "آپ کی سبسکرپشن فراہم کرنے اور سوالات کے جواب کے لیے۔" },
          { en: "To improve the app, and to prevent fraud and misuse.", ur: "ایپ بہتر بنانے اور دھوکہ دہی روکنے کے لیے۔" },
          { en: "To meet legal and financial obligations and resolve disputes.", ur: "قانونی اور مالی ذمہ داریاں پوری کرنے اور تنازعات حل کرنے کے لیے۔" },
          { en: "To send service updates, newsletters and relevant offers.", ur: "سروس اپڈیٹس، خبرنامے اور متعلقہ پیشکشیں بھیجنے کے لیے۔" },
        ],
      },
      {
        title: { en: "Who we share it with", ur: "ہم کس سے شیئر کرتے ہیں" },
        points: [
          { en: "Banks, payment processors and verification services — only to complete payments and verify accounts.", ur: "بینک، ادائیگی اور تصدیقی ادارے — صرف ادائیگی مکمل کرنے اور اکاؤنٹ کی تصدیق کے لیے۔" },
          { en: "Anyone you ask us to share it with.", ur: "جس کے ساتھ آپ خود شیئر کرنے کا کہیں۔" },
        ],
      },
      {
        title: { en: "Keeping it safe", ur: "حفاظت" },
        points: [
          { en: "We use physical, technical and organisational safeguards against loss or misuse.", ur: "ہم نقصان یا غلط استعمال سے بچاؤ کے لیے جسمانی، تکنیکی اور انتظامی حفاظتی اقدامات کرتے ہیں۔" },
          { en: "If a breach affects you, we will tell you and the regulators where the law requires.", ur: "اگر کسی خلاف ورزی سے آپ متاثر ہوں تو قانون کے مطابق آپ اور متعلقہ اداروں کو مطلع کیا جائے گا۔" },
        ],
      },
      {
        title: { en: "How long we keep it", ur: "ہم کب تک رکھتے ہیں" },
        points: [
          { en: "While your account is active, and afterwards only as long as legal, tax or accounting rules require.", ur: "جب تک اکاؤنٹ فعال ہے، اور اس کے بعد صرف اتنی دیر جتنی قانونی، ٹیکس یا اکاؤنٹنگ قواعد تقاضا کریں۔" },
        ],
      },
    ],
    url: "https://zaraimandi.com/privacy-policy",
  },

  refunds: {
    title: { en: "Cancellation & Refunds", ur: "منسوخی اور رقم کی واپسی" },
    sections: [
      {
        title: { en: "Cancelling", ur: "منسوخی" },
        points: [
          { en: "If you cancel early, our team will ask why and may offer to restore your plan for the rest of the term.", ur: "اگر آپ پہلے منسوخ کریں تو ہماری ٹیم وجہ پوچھے گی اور باقی مدت کے لیے پلان بحال کرنے کی پیشکش کر سکتی ہے۔" },
          { en: "Don't need a commodity anymore? Move the remaining balance to another commodity group.", ur: "کسی جنس کی ضرورت نہیں رہی؟ باقی بیلنس کسی دوسرے گروپ پر منتقل کریں۔" },
          { en: "If you don't renew, we'll contact you about renewing or changing your plan.", ur: "اگر آپ تجدید نہ کریں تو ہم تجدید یا پلان کی تبدیلی کے لیے رابطہ کریں گے۔" },
        ],
      },
      {
        title: { en: "Failed payments", ur: "ناکام ادائیگی" },
        points: [
          { en: "A failed renewal is retried after 1, 2 and 3 more days.", ur: "ناکام تجدید کی ادائیگی 1، 2 اور 3 دن بعد دوبارہ کوشش کی جاتی ہے۔" },
          { en: "After three failed attempts the subscription is cancelled and paid access ends. We'll reach out to help restore it.", ur: "تین ناکام کوششوں کے بعد سبسکرپشن منسوخ ہو جاتی ہے اور رسائی ختم۔ ہم بحالی میں مدد کے لیے رابطہ کریں گے۔" },
        ],
      },
      {
        title: { en: "Refunds", ur: "رقم کی واپسی" },
        points: [
          { en: "All services are final once purchased — no returns, exchanges or refunds.", ur: "خریداری کے بعد تمام سروسز حتمی ہیں — واپسی، تبادلہ یا رقم کی واپسی نہیں۔" },
          { en: "Cancelling a subscription does not give a refund, because it is a digital service.", ur: "سبسکرپشن منسوخ کرنے پر رقم واپس نہیں ہوتی کیونکہ یہ ڈیجیٹل سروس ہے۔" },
        ],
      },
      {
        title: { en: "Complaints", ur: "شکایات" },
        points: [
          { en: "Call, email or WhatsApp us with details and proof (receipt or screenshot). We aim to reply within 2–3 working days.", ur: "تفصیل اور ثبوت (رسید یا اسکرین شاٹ) کے ساتھ کال، ای میل یا واٹس ایپ کریں۔ ہم 2 سے 3 کاروباری دنوں میں جواب دینے کی کوشش کرتے ہیں۔" },
        ],
      },
    ],
    url: "https://zaraimandi.com/cancellation-and-refund",
  },
};
