# משנה של נשמה — מערכת ללימוד משניות לעילוי נשמה

מערכת רב-משתמשית ללימוד משנה, עם **עמודי לימוד** (הקדשות) שכל אחד יכול לפתוח —
**אישי** (לומדים לבד את כל הש"ס בקצב שבוחרים: שנה / 6 שנים / מותאם אישית) או
**קבוצתי** (מזמינים אחרים דרך קישור, וכל חבר תופס מסכת פנויה בלעדית). לכל משתתף
נבנה אוטומטית לוח לימוד אישי שפורש את המשניות שנותרו לו עד לתאריך היעד. כולל מעקב
התקדמות, רצף ימים, הישגים, ותזכורות ב-WhatsApp ובמייל. נבנה ב-PHP + MySQL (מתאים
לאחסון משותף), Tailwind CSS, JS וניל. טקסט 63 מסכתות המשנה (עברית עם ניקוד) מיובא
ממאגר הנתונים הפתוח של Sefaria.

## מושגי יסוד

- **עמוד לימוד (`study_pages`)** — העוגן: הקדשה (שם, תאריך, לעילוי נשמה/לרפואה) +
  אופן לימוד (`solo`/`group`) + קצב יעד (`year`/`six_years`/`custom`) שממנו נגזר
  `target_end_date`.
- **תפיסת מסכת (`tractate_claims`)** — בעמוד אישי כל 63 המסכתות נתפסות אוטומטית
  לבעלים. בעמוד קבוצתי כל חבר תופס בעצמו מסכת פנויה (בלעדי — `UNIQUE(study_page_id, tractate_id)`)
  דרך לוח התפיסה (`tractates.php`).
- **לוח לימוד אישי (`member_schedule`)** — נבנה/נבנה-מחדש אוטומטית (`generateMemberSchedule()`
  ב-`app/functions.php`) בכל תפיסה/שחרור של מסכת: פורש את המשניות שטרם נלמדו
  מהמסכתות שהחבר תפס, שווה בשווה, מהיום ועד `target_end_date`.
- **"עמוד נוכחי" בסשן** — משתמש יכול להיות חבר בכמה עמודים; `getCurrentPageId()`/
  `setCurrentPageId()` ב-`app/functions.php` שומרים איזה עמוד מוצג כרגע בניווט
  (מתחלף דרך בורר העמודים בסרגל הצד או `/page.php?id=`).

## מבנה הפרויקט

```
public_html/     ← web root (מה שמועלה לתיקיית public_html בהוסטינגר)
app/             ← קוד PHP פנימי (DB, אימות, פונקציות, שירותי WhatsApp/מייל) — לא נגיש דרך הדפדפן
  services/      ← whatsapp_service.php, email_service.php
database/        ← schema.sql + סקריפט ייבוא תוכן מ-Sefaria
cron/            ← send_reminders.php — סקריפט CLI יומי לתזכורות
build/           ← קונפיגורציית Tailwind (להרצה מקומית בלבד, לא עולה לשרת כ"כלי build")
```

חשוב: `app/`, `database/`, `cron/` ו-`build/` צריכים להישאר **מחוץ** ל-`public_html`
בשרת, כך שלא ניתן לגשת אליהם דרך הדפדפן. זה קורה באופן טבעי אם מעלים אותם לתיקיית
הבית של הדומיין (רמה אחת מעל `public_html`), כפי שהם מסודרים כאן.

## הרצה מקומית

1. התקינו MySQL/MariaDB ו-PHP 8.1+.
2. צרו בסיס נתונים וטענו את הסכמה (יש לוודא charset utf8mb4!):
   ```
   mysql -e "CREATE DATABASE mishna_top CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql --default-character-set=utf8mb4 mishna_top < database/schema.sql
   ```
3. העתיקו `app/config.php.example` ל-`app/config.php` ומלאו את פרטי ה-DB המקומיים.
4. ייבוא תוכן המשניות (חד פעמי, דורש גישה לאינטרנט):
   ```
   php database/import_sefaria.php
   ```
5. בניית Tailwind:
   ```
   cd build && npm install && npm run build
   ```
6. הרצת שרת פיתוח:
   ```
   php -S localhost:8000 -t public_html
   ```

## פריסה להוסטינגר (Shared Hosting)

1. **בסיס נתונים**: ב-hPanel → Databases → MySQL Databases, צרו DB + משתמש, ורשמו
   את הפרטים (host הוא בד"כ `localhost`).
2. **קונפיגורציה**: העתיקו `app/config.php.example` ל-`app/config.php` ומלאו את
   פרטי ה-DB האמיתיים (ופרטי WhatsApp אם מוכנים — ראו סעיף למטה). **קובץ זה לא
   מועלה ל-git** (ראו `.gitignore`) — יש להעלות אותו ידנית לשרת (FTP / File Manager).
3. **העלאת קבצים**:
   - תוכן `public_html/` → לתוך תיקיית `public_html` של הדומיין בהוסטינגר.
   - `app/`, `database/`, `cron/` → לתיקיית הבית של הדומיין, **רמה אחת מעל**
     `public_html` (כך ש-PHP יכול לגשת אליהם דרך `require __DIR__.'/../app/...'`,
     אך הדפדפן לא).
4. **ייבוא הסכמה**: hPanel → Databases → phpMyAdmin → בחרו את ה-DB → Import →
   העלו את `database/schema.sql`. **חשוב**: תחת Character set of the file בחרו
   `utf8mb4` (הקובץ כולל גם `SET NAMES utf8mb4` כרשת ביטחון).
5. **ייבוא תוכן המשניות** (חד פעמי): אם יש לכם SSH (בחלק מהתוכניות):
   ```
   php database/import_sefaria.php
   ```
   אם אין SSH — הריצו זאת פעם אחת דרך hPanel → Advanced → Cron Jobs (אפשר ליצור
   Cron ואז ללחוץ "הרץ עכשיו", או להריץ בשעה קרובה ואז למחוק את המשימה):
   ```
   php /home/USERNAME/domains/yourdomain.com/database/import_sefaria.php
   ```
   (התאימו את הנתיב למבנה בפועל בחשבון שלכם).
6. **תזכורות יומיות**: ב-hPanel → Advanced → Cron Jobs, הוסיפו משימה שרצה פעם ביום
   (למשל 08:00):
   ```
   php /home/USERNAME/domains/yourdomain.com/cron/send_reminders.php
   ```
   מומלץ לבדוק קודם עם `--dry-run` (דרך SSH אם יש, או זמנית ידנית) כדי לוודא
   שהלוגיקה עובדת לפני שמפעילים שליחה אמיתית.
7. גלשו לאתר, הירשמו, והתחילו ללמוד.

### עדכון עיצוב (Tailwind)

כל שינוי בקבצי ה-PHP שמוסיף/מסיר קלאסים של Tailwind דורש בנייה מחדש של קובץ ה-CSS
הסטטי (`public_html/assets/css/app.css`), כי אין build בזמן ריצה בשרת:

```
cd build && npm run build
```

יש להעלות מחדש את `public_html/assets/css/app.css` לשרת לאחר כל שינוי עיצובי.

## מקור תוכן המשניות

הטקסט מיובא ממאגר [Sefaria-Export](https://github.com/Sefaria/Sefaria-Export)
(ציבורי, ללא צורך במפתח API), המתארח ב-Google Cloud Storage. `database/tractates_data.php`
מכיל את רשימת 63 המסכתות בסדר המסורתי עם קישור לקובץ העברי של כל מסכת.

## הקמת תזכורות WhatsApp (Meta Cloud API)

תזכורות ה-WhatsApp נשלחות דרך ה-API הרשמי של מטא (WhatsApp Business Platform / Cloud
API) — **לא** דרך ספק חיצוני. עד שהחשבון לא מוגדר, ההעדפות של המשתמשים נשמרות כרגיל
אך שום הודעה לא נשלחת (המערכת מזהה זאת אוטומטית לפי `config.php`). שלבי הקמה:

1. **חשבון Meta Business**: היכנסו ל-[business.facebook.com](https://business.facebook.com)
   וצרו חשבון עסקי (אם אין כבר).
2. **אפליקציית WhatsApp**: ב-[developers.facebook.com](https://developers.facebook.com) →
   My Apps → Create App → סוג "Business" → הוסיפו את המוצר **WhatsApp**.
3. **מספר טלפון**: תחת WhatsApp → API Setup, מטא מספקת מספר בדיקה חינמי לשלב הפיתוח,
   או חברו מספר עסקי משלכם (דורש אימות). שם רשומים **Phone Number ID**.
4. **Access Token קבוע**: טוקן הבדיקה הזמני פג אחרי 24 שעות. ליצירת טוקן קבוע —
   System Users תחת Business Settings → הקצו הרשאות `whatsapp_business_messaging`
   ל-App שיצרתם וצרו טוקן ללא תפוגה.
5. **תבנית הודעה (Template)**: הודעות יזומות (business-initiated, מחוץ לחלון שיחה
   של 24 שעות מהמשתמש) **חייבות** תבנית מאושרת. ב-WhatsApp Manager → Message Templates
   → צרו תבנית מקטגוריית Utility, בעברית, עם משתנים לשם המשתמש ולתוכן התזכורת
   (תואם למבנה שב-`app/services/whatsapp_service.php` — פרמטר יחיד לגוף ההודעה).
   האישור לוקח בד"כ דקות עד שעות.
6. **מילוי `config.php`**: `whatsapp_phone_number_id`, `whatsapp_access_token`,
   `whatsapp_template_name` (שם התבנית שאושרה), `whatsapp_template_lang` (בד"כ `he`).
7. בדקו עם `php cron/send_reminders.php --dry-run` (רואים למי היה נשלח, בלי לשלוח),
   ואז בלי הדגל לשליחה אמיתית.

### מייל

ברירת המחדל היא `mail()` המובנה של PHP — עובד ללא הגדרה נוספת על הוסטינגר Shared
Hosting כשהדומיין מקושר לחשבון. אם רוצים deliverability טוב יותר (SPF/DKIM תקינים,
פחות סיכוי לספאם), אפשר להחליף את `app/services/email_service.php` ל-SMTP אמיתי
דרך PHPMailer (`composer require phpmailer/phpmailer`) מול חשבון המייל שסופק ע"י
הוסטינגר או ספק כמו SendGrid/Mailgun.
