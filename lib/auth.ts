import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { queryOne, execute } from "./db";
import type { User } from "./types";

export interface SessionData {
  userId?: number;
  currentPageId?: number;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "mishna_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: true,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function currentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await queryOne<User>("SELECT * FROM users WHERE id = ?", [session.userId]);
  if (!user) {
    session.destroy();
    return null;
  }
  return user;
}

/** מפנה ל-login.php-המקביל אם לא מחובר; אחרת מחזיר את המשתמש. */
export async function requireLogin(): Promise<User> {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedName || trimmedName.length > 100) {
    return { ok: false, error: "נא להזין שם תקין." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "כתובת אימייל לא תקינה." };
  }
  if (password.length < 6) {
    return { ok: false, error: "הסיסמה חייבת להכיל לפחות 6 תווים." };
  }

  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
  if (existing) {
    return { ok: false, error: "כתובת אימייל זו כבר רשומה במערכת." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await execute(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [trimmedName, normalizedEmail, passwordHash]
  );

  const session = await getSession();
  session.userId = result.insertId;
  await session.save();

  return { ok: true };
}

export async function attemptLogin(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await queryOne<User>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

  if (!user || !user.password_hash) {
    return { ok: false, error: "אימייל או סיסמה שגויים." };
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return { ok: false, error: "אימייל או סיסמה שגויים." };
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return { ok: true };
}

export async function logoutUser(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

/**
 * מוצא משתמש קיים לפי google_id, מקשר google_id לחשבון קיים לפי אימייל
 * (אם נרשם בעבר עם אימייל+סיסמה), או יוצר משתמש חדש ללא סיסמה — ואז מתחבר.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<User> {
  const normalizedEmail = profile.email.trim().toLowerCase();

  let user = await queryOne<User>("SELECT * FROM users WHERE google_id = ?", [profile.googleId]);

  if (!user) {
    const byEmail = await queryOne<User>("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (byEmail) {
      await execute("UPDATE users SET google_id = ? WHERE id = ?", [profile.googleId, byEmail.id]);
      user = { ...byEmail, google_id: profile.googleId };
    }
  }

  if (!user) {
    const result = await execute(
      "INSERT INTO users (name, email, password_hash, google_id) VALUES (?, ?, NULL, ?)",
      [profile.name.trim().slice(0, 100) || normalizedEmail, normalizedEmail, profile.googleId]
    );
    user = await queryOne<User>("SELECT * FROM users WHERE id = ?", [result.insertId]);
  }

  const session = await getSession();
  session.userId = user!.id;
  await session.save();

  return user!;
}
