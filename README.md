# משנה של נשמה — מערכת ללימוד משניות לעילוי נשמה

מערכת רב-משתמשית ללימוד משנה יומית, עם מעקב התקדמות, רצף ימים, הישגים, ולוח הקדשות
לעילוי נשמה / לרפואה. נבנתה ב-PHP + MySQL (מתאים לאחסון משותף), Tailwind CSS, JS וניל.
טקסט 63 מסכתות המשנה (עברית עם ניקוד) מיובא ממאגר הנתונים הפתוח של Sefaria.

## מבנה הפרויקט

```
public_html/   ← web root (מה שמועלה לתיקיית public_html בהוסטינגר)
app/           ← קוד PHP פנימי (DB, אימות, פונקציות) — לא נגיש דרך הדפדפן
database/      ← schema.sql + סקריפט ייבוא תוכן מ-Sefaria
build/         ← קונפיגורציית Tailwind (להרצה מקומית בלבד, לא עולה לשרת כ"כלי build")
```

חשוב: `app/`, `database/` ו-`build/` צריכים להישאר **מחוץ** ל-`public_html` בשרת,
כך שלא ניתן לגשת אליהם דרך הדפדפן. זה קורה באופן טבעי אם מעלים אותם לתיקיית הבית של
הדומיין (רמה אחת מעל `public_html`), כפי שהם מסודרים כאן.

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
   פרטי ה-DB האמיתיים. **קובץ זה לא מועלה ל-git** (ראו `.gitignore`) — יש להעלות
   אותו ידנית לשרת (FTP / File Manager).
3. **העלאת קבצים**:
   - תוכן `public_html/` → לתוך תיקיית `public_html` של הדומיין בהוסטינגר.
   - `app/`, `database/` → לתיקיית הבית של הדומיין, **רמה אחת מעל** `public_html`
     (כך ש-PHP יכול לגשת אליהם דרך `require __DIR__.'/../app/...'`, אך הדפדפן לא).
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
6. גלשו לאתר, הירשמו, והתחילו ללמוד.

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
