# משנה של נשמה

מערכת ללימוד משניות לעילוי נשמת (או לרפואת) יקירכם — Next.js (App Router,
TypeScript) + MySQL, בעברית מלאה (RTL, כולל תמיכה בתאריך עברי ויארצייט).

כל עמוד לימוד ("דף הקדשה") נפתח על ידי משתמש — לעצמו (לימוד אישי, גומרים את כל
הש"ס בקצב הנבחר: שנה / 6 שנים / מותאם אישית) או כקבוצה (חברים מצטרפים דרך קישור
הזמנה ותופסים מסכתות פנויות — כל מסכת שייכת לחבר אחד בלבד). לכל משתתף נבנה לוח
לימוד אישי מתוך המסכתות שתפס, פרוש עד ליעד שנקבע. תזכורות אפשריות ב-WhatsApp
(ישירות מול Meta Cloud API) ובמייל, לפי העדפה אישית.

## תכונות עיקריות

- הרשמה/התחברות, כמה עמודי לימוד למשתמש עם מעבר מהיר ביניהם.
- עמוד לימוד אישי או קבוצתי; לוח תפיסת מסכתות בלעדי לעמודים קבוצתיים.
- לוח לימוד יומי אישי הנגזר אוטומטית מהמסכתות שנתפסו והיעד שנקבע.
- תמיכה מלאה בתאריך עברי (`@hebcal/core`): הצגת תאריך פטירה עברי, חישוב יארצייט
  הבא, לוח שנה חודשי עם תאריך עברי לכל יום.
- הישגים (רצף ימים, כמות משניות, סיום מסכת), הקראה קולית ושיתוף של המשנה היומית.
- תזכורות יומיות/שבועיות ב-WhatsApp (Meta Cloud API) ובמייל (SMTP), עם מנגנון
  cron יומי ומניעת שליחה כפולה.
- טקסט המשניות מיובא ממאגר [Sefaria](https://www.sefaria.org) (Sefaria-Export).

## טכנולוגיה

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4 · MySQL
(`mysql2`) · `iron-session` (סשן מוצפן בעוגייה) · `bcryptjs` · `@hebcal/core`
· `nodemailer`.

## פיתוח מקומי

### דרישות

- Node.js 22+
- שרת MySQL/MariaDB זמין

### התקנה

```bash
npm install
cp .env.example .env.local
# ערכו את .env.local: פרטי DB, SESSION_SECRET (openssl rand -base64 32), וכו'
```

### הקמת מסד הנתונים

```bash
mysql -u root -e "CREATE DATABASE mishna_top CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root mishna_top < database/schema.sql
```

### ייבוא טקסט המשניות מ-Sefaria

```bash
node --env-file=.env.local --import tsx scripts/import-sefaria.ts
```

הסקריפט טוען את 63 המסכתות (`database/tractates-data.ts`) ואת טקסט כל
המשניות ממאגר ה-Export הציבורי של Sefaria (`storage.googleapis.com/sefaria-export`).
ריצה חוזרת בטוחה (idempotent).

### הרצה

```bash
npm run dev       # פיתוח, http://localhost:3000
npm run build     # build לפרודקשן
npm run start     # הרצת ה-build
npm run lint
npx tsc --noEmit  # בדיקת טיפוסים
```

## פריסה (Deploy) להוסטינגר — Node.js Web App

הפרויקט מיועד לרכיב **Node.js Web Apps** של Hostinger (hPanel → Websites →
Node.js), המחובר ישירות ל-GitHub — לא לאחסון המשותף (Shared Hosting) הקלאסי
המיועד ל-PHP.

1. **חיבור הריפו**: hPanel → **Websites** → האתר → **Node.js** → צרו אפליקציה
   חדשה → **Connect to GitHub** (אם האפליקציה של Hostinger מותקנת ב-GitHub אך
   אינה מזהה את הריפו — ודאו שהיא מורשית עליו תחת GitHub → Settings →
   Applications → Hostinger → Repository access).
2. **הגדרות Build**:
   - **Branch**: הענף הרצוי (למשל `main`).
   - **Root directory**: שורש הריפו (לא `build/` — זה שדה שנבחר אוטומטית
     ולעיתים שגוי; יש לוודא שהוא ריק/`.`).
   - **Framework preset**: Next.js (אם קיים באפשרויות) או Custom.
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm run start`
   - **Node version**: 22 ומעלה.
3. **משתני סביבה**: הוסיפו בהגדרות ה-Node App את כל המשתנים מ-`.env.example`
   עם ערכי הפרודקשן (`DB_HOST`/`DB_USER`/`DB_PASSWORD` של ה-MySQL שנוצר תחת
   Hostinger → Databases, `SESSION_SECRET` אקראי, `APP_URL` עם הדומיין
   האמיתי, וכו').
4. **מסד הנתונים**: צרו מסד MySQL תחת hPanel → Databases → MySQL Databases,
   ומלאו את פרטיו (`DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`) במשתני הסביבה.
   אין צורך בגישה מרוחקת למסד — ראו "הקמת מסד הנתונים בפרודקשן" למטה.
5. כל push לענף המחובר מפעיל build+deploy אוטומטי.

### הקמת מסד הנתונים בפרודקשן — `/api/setup`

אחרי הדיפלוי הראשון (עם `DB_*` ו-`SETUP_SECRET` מוגדרים במשתני הסביבה), פתחו
בדפדפן — פעם אחת בלבד — את:

```
https://<הדומיין שלכם>/api/setup?secret=<SETUP_SECRET>
```

זה ירוץ על השרת עצמו (עם חיבור ה-DB שכבר מוגדר לו) וייצור את כל הטבלאות + ייבא
את 63 המסכתות וכל טקסט המשניות מ-Sefaria — בלי צורך בגישה מרוחקת למסד או
בהרצת סקריפטים ידנית. הפעולה אידמפוטנטית — ניתן לפתוח שוב בבטחה אם היא נכשלה
באמצע (לדוגמה עקב timeout בדפדפן על ייבוא התוכן, שלוקח כמה דקות).

אם ההרצה המשולבת איטית מדי/נחתכת, אפשר לפצל לשני שלבים נפרדים:

```
.../api/setup?secret=<SETUP_SECRET>&step=schema      # רק טבלאות, מהיר
.../api/setup?secret=<SETUP_SECRET>&step=mishnayot   # רק ייבוא תוכן, כמה דקות
```

ולבדוק את המצב הנוכחי (לא משנה כלום) עם `&step=status`.

**אחרי שההקמה הצליחה, מומלץ למחוק את `SETUP_SECRET` ממשתני הסביבה בהוסטינגר** —
הנתיב יחסום כל בקשה בלי הסוד הנכון, אבל אין סיבה להשאיר אותו מוגדר.

### תזכורות אוטומטיות (Cron)

הגדירו ב-hPanel → **Advanced → Cron Jobs** הרצה יומית של:

```bash
curl -s -H "x-cron-secret: $CRON_SECRET" "https://<הדומיין שלכם>/api/cron/send-reminders"
```

(`$CRON_SECRET` — אותו ערך שהוגדר במשתנה הסביבה `CRON_SECRET`). לבדיקה יבשה
בלי שליחה בפועל, הוסיפו `&dry_run=1` לכתובת.

## הקמת WhatsApp (Meta Cloud API)

התזכורות ב-WhatsApp נשלחות ישירות מול ה-API הרשמי של Meta (ללא ספק צד-שלישי).
כל עוד `WHATSAPP_PHONE_NUMBER_ID`/`WHATSAPP_ACCESS_TOKEN` ריקים — תזכורות
WhatsApp כבויות בשקט, שאר המערכת ממשיכה לעבוד כרגיל.

1. צרו אפליקציית Business ב-[Meta for Developers](https://developers.facebook.com/)
   והוסיפו לה את מוצר **WhatsApp**.
2. הקימו/אמתו מספר טלפון לשליחה (Meta מספקת מספר בדיקה חינמי לפיתוח).
3. צרו **Access Token קבוע** (System User Token עם הרשאת `whatsapp_business_messaging`)
   — טוקנים זמניים מה-Playground פגים כעבור 24 שעות ואינם מתאימים לפרודקשן.
4. אשרו **תבנית הודעה (Template)** מסוג Utility בשם שיוגדר ב-
   `WHATSAPP_TEMPLATE_NAME` (למשל `daily_reminder`), בשפה שתואמת ל-
   `WHATSAPP_TEMPLATE_LANG` (למשל `he`) — הודעות יזומות מחוץ לחלון 24 שעות
   מותרות רק דרך תבנית מאושרת.
5. מלאו ב-`.env.local`/במשתני הסביבה בפרודקשן: `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_API_VERSION` (למשל `v20.0`).

## הקמת התחברות עם Google

התחברות/הרשמה עם Google היא **תוספת** לצד אימייל+סיסמה — לא מחליפה אותם. כל
עוד `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` ריקים, כפתור "התחברות עם Google"
פשוט לא מוצג, ושאר המערכת עובדת רגיל.

1. ב-[Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services
   → Credentials** → צרו **OAuth client ID** מסוג **Web application**.
2. במסך ה-**OAuth consent screen**, הוסיפו שם לאפליקציה ולוגו (אופציונלי),
   וסקופים בסיסיים (`openid`, `email`, `profile` — נבחרים אוטומטית).
3. תחת **Authorized redirect URIs** בפרטי ה-Client, הוסיפו בדיוק:
   ```
   https://<הדומיין שלכם>/auth/google/callback
   ```
   (ולפיתוח מקומי גם `http://localhost:3000/auth/google/callback`).
4. העתיקו את ה-**Client ID** וה-**Client secret** שנוצרו, ומלאו אותם ב-
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` במשתני הסביבה.
5. משתמש שנרשם בעבר עם אותו אימייל דרך אימייל+סיסמה, ואז מתחבר עם Google —
   מקושר אוטומטית לאותו חשבון (לא נוצר כפול).

## הקמת מייל (SMTP)

כל עוד `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` ריקים — תזכורות מייל כבויות
בשקט. ב-Hostinger ניתן ליצור תיבת מייל תחת hPanel → **Emails**, ולהשתמש
בפרטי ה-SMTP שלה (host כגון `smtp.hostinger.com`, פורט 587).

## מבנה הפרויקט

```
app/                 App Router: עמודים, layouts, route handlers, server actions
  (app)/             עמודים שדורשים התחברות (עטופים ב-AppShell)
  auth/google/       זרימת OAuth מול Google (redirect + callback)
  api/cron/          נקודת קצה ל-cron התזכורות
  api/setup/         נקודת קצה חד-פעמית להקמת מסד הנתונים בפרודקשן
lib/                 שכבת נתונים ולוגיקה עסקית (DB, auth, study-pages, progress, hebrew-date...)
lib/actions/         Server Actions
lib/services/        WhatsApp / Email / מנוע תזכורות / Google OAuth / הקמת מסד נתונים
components/          רכיבי UI משותפים (חלקם Client Components)
database/            schema.sql + נתוני מסכתות (tractates-data.ts)
scripts/             סקריפט ייבוא Sefaria (מריצים עם tsx, מחוץ ל-Next.js runtime)
```
