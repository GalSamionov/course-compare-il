import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import {
  EMPTY_LOCAL,
  MAX_COMPARE,
  firstFreePosition,
  mergeIntoAccount,
  parseLocal,
  toAnswerParams,
  type AnswerParams,
  type CompareSlot,
  type LocalLists,
} from './lists';

export interface SavedAnswers {
  params: AnswerParams;
  updatedAt: string;
}

/**
 * מה שהדפדפן יודע על המבקר. העמודים סטטיים, ולכן כל זה נטען כאן, בדפדפן, ולא בשרת.
 * 'loading': לפני שבדקנו אם יש התחברות. זה גם מה שנבנה מראש ב-HTML.
 */
export type AccountState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'signed-out'; compare: string[] }
  | {
      status: 'signed-in';
      userId: string;
      email: string;
      /** מהחדש לישן. */
      saved: string[];
      /** לפי המקום, 1 עד 3. */
      compare: CompareSlot[];
      answers: SavedAnswers | null;
    };

type SignedIn = Extract<AccountState, { status: 'signed-in' }>;

/** 'full': אין מקום בהשוואה. 'error': המסד או הרשת לא ענו, ושום דבר לא השתנה. */
export type ListResult = 'ok' | 'full' | 'error';

const LOCAL_KEY = 'account-lists:v1';
const LOADING: AccountState = { status: 'loading' };

let state: AccountState = LOADING;
const listeners = new Set<() => void>();
let started = false;
/** טעינה אחת בכל פעם, כדי ששני אירועים צמודים לא יעבירו את הרשימות מהדפדפן פעמיים. */
let queue: Promise<void> = Promise.resolve();

function setState(next: AccountState) {
  state = next;
  for (const listener of listeners) listener();
}

/** משנה רק אם עדיין מחובר אותו משתמש. תשובה שמגיעה אחרי התנתקות לא מחזירה אותו. */
function updateSignedIn(userId: string, change: (current: SignedIn) => SignedIn) {
  if (state.status === 'signed-in' && state.userId === userId) setState(change(state));
}

function readLocal(): LocalLists {
  try {
    return parseLocal(window.localStorage.getItem(LOCAL_KEY));
  } catch {
    return EMPTY_LOCAL;
  }
}

function writeLocal(lists: LocalLists) {
  try {
    if (lists.compare.length === 0 && lists.save === null && lists.answers === null) {
      window.localStorage.removeItem(LOCAL_KEY);
    } else {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(lists));
    }
  } catch {
    // גלישה פרטית או אחסון חסום: הרשימה נשארת בזיכרון של הדף בלבד.
  }
}

async function fetchLists(userId: string) {
  const db = createBrowserSupabase();
  // ההרשאות במסד מחזירות ממילא רק את השורות של המשתמש. הסינון לפי user_id משתמש במפתח הראשי.
  const [saved, compare, answers] = await Promise.all([
    db.from('saved_courses').select('course_id').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('compare_items').select('course_id, position').eq('user_id', userId).order('position'),
    db.from('user_answers').select('answers, updated_at').eq('user_id', userId).maybeSingle(),
  ]);
  if (saved.error) throw saved.error;
  if (compare.error) throw compare.error;
  if (answers.error) throw answers.error;
  const params = answers.data ? toAnswerParams(answers.data.answers) : null;
  return {
    saved: saved.data.map((row) => row.course_id),
    compare: compare.data.map((row) => ({ courseId: row.course_id, position: row.position })),
    answers: answers.data && params ? { params, updatedAt: answers.data.updated_at } : null,
  };
}

/** מעביר לחשבון את מה שנשמר בדפדפן לפני ההתחברות. */
async function moveLocalIntoAccount(userId: string, account: { saved: string[]; compare: CompareSlot[] }) {
  const local = readLocal();
  const merged = mergeIntoAccount(account, local);
  if (merged.save.length === 0 && merged.compare.length === 0 && local.answers === null) return false;
  const db = createBrowserSupabase();
  if (merged.save.length > 0) {
    const { error } = await db
      .from('saved_courses')
      .upsert(
        merged.save.map((courseId) => ({ user_id: userId, course_id: courseId })),
        { onConflict: 'user_id,course_id', ignoreDuplicates: true },
      );
    if (error) throw error;
  }
  if (merged.compare.length > 0) {
    const { error } = await db
      .from('compare_items')
      .insert(merged.compare.map((slot) => ({ user_id: userId, course_id: slot.courseId, position: slot.position })));
    if (error) throw error;
  }
  if (local.answers !== null) {
    const { error } = await db.from('user_answers').upsert({ user_id: userId, answers: local.answers });
    if (error) throw error;
  }
  return true;
}

async function load(session: Session | null) {
  if (!session) {
    setState({ status: 'signed-out', compare: readLocal().compare });
    return;
  }
  const userId = session.user.id;
  if (state.status === 'signed-in' && state.userId === userId) return;
  try {
    let lists = await fetchLists(userId);
    if (await moveLocalIntoAccount(userId, lists)) lists = await fetchLists(userId);
    writeLocal(EMPTY_LOCAL);
    setState({ status: 'signed-in', userId, email: session.user.email ?? '', ...lists });
  } catch (error) {
    console.error('Loading the account lists failed', error);
    setState({ status: 'error' });
  }
}

function start() {
  // INITIAL_SESSION מגיע מיד עם ההתחברות שבעוגיות (או בלעדיה), ו-SIGNED_IN/SIGNED_OUT כשהיא משתנה,
  // גם בלשונית אחרת. לפי Supabase, לא קוראים ל-Supabase מתוך ה-callback עצמו, ולכן ממשיכים בתור.
  createBrowserSupabase().auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return;
    setTimeout(() => {
      queue = queue.then(() => load(session));
    }, 0);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    start();
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * המצב של המבקר, לכל רכיב בדף. בבנייה מראש ובהידרציה: 'loading', ומיד אחר כך המצב האמיתי.
 * כך הדפים נשארים סטטיים, ואין אי-התאמה בין ה-HTML לדפדפן.
 */
export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

/** עמוד ההתחברות, עם הדרך חזרה לעמוד הנוכחי. */
export function loginHref(): string {
  const here = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname === '/login') return here;
  return `/login?next=${encodeURIComponent(here)}`;
}

/** מבקר לא מחובר ביקש לשמור: זוכרים את הבקשה בדפדפן, והיא מתבצעת מיד אחרי ההתחברות. */
export function rememberForLogin(pending: { save?: string; answers?: AnswerParams }) {
  const local = readLocal();
  writeLocal({ ...local, save: pending.save ?? local.save, answers: pending.answers ?? local.answers });
}

export async function toggleSaved(courseId: string): Promise<ListResult> {
  if (state.status !== 'signed-in') return 'error';
  const { userId } = state;
  const db = createBrowserSupabase();
  if (state.saved.includes(courseId)) {
    const { error } = await db.from('saved_courses').delete().eq('user_id', userId).eq('course_id', courseId);
    if (error) return 'error';
    // המסד מוציא אותו גם מההשוואה (on delete cascade).
    updateSignedIn(userId, (s) => ({
      ...s,
      saved: s.saved.filter((id) => id !== courseId),
      compare: s.compare.filter((slot) => slot.courseId !== courseId),
    }));
    return 'ok';
  }
  const { error } = await db
    .from('saved_courses')
    .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  if (error) return 'error';
  updateSignedIn(userId, (s) => ({ ...s, saved: [courseId, ...s.saved.filter((id) => id !== courseId)] }));
  return 'ok';
}

export async function toggleCompare(courseId: string): Promise<ListResult> {
  if (state.status === 'signed-out') {
    const has = state.compare.includes(courseId);
    if (!has && state.compare.length >= MAX_COMPARE) return 'full';
    const compare = has ? state.compare.filter((id) => id !== courseId) : [...state.compare, courseId];
    writeLocal({ ...readLocal(), compare });
    setState({ status: 'signed-out', compare });
    return 'ok';
  }
  if (state.status !== 'signed-in') return 'error';
  const { userId } = state;
  const db = createBrowserSupabase();
  if (state.compare.some((slot) => slot.courseId === courseId)) {
    const { error } = await db.from('compare_items').delete().eq('user_id', userId).eq('course_id', courseId);
    if (error) return 'error';
    updateSignedIn(userId, (s) => ({ ...s, compare: s.compare.filter((slot) => slot.courseId !== courseId) }));
    return 'ok';
  }
  const position = firstFreePosition(state.compare);
  if (position === null) return 'full';
  // קורס בהשוואה תמיד שמור: המסד דורש שורה ב-saved_courses.
  if (!state.saved.includes(courseId)) {
    const saved = await toggleSaved(courseId);
    if (saved !== 'ok') return saved;
  }
  const { error } = await db.from('compare_items').insert({ user_id: userId, course_id: courseId, position });
  // 23505/23514: לשונית אחרת תפסה את המקום בינתיים.
  if (error) return error.code === '23505' || error.code === '23514' ? 'full' : 'error';
  updateSignedIn(userId, (s) => ({
    ...s,
    compare: [...s.compare, { courseId, position }].sort((a, b) => a.position - b.position),
  }));
  return 'ok';
}

export async function saveAnswers(params: AnswerParams): Promise<ListResult> {
  if (state.status !== 'signed-in') return 'error';
  const { userId } = state;
  const { error } = await createBrowserSupabase().from('user_answers').upsert({ user_id: userId, answers: params });
  if (error) return 'error';
  updateSignedIn(userId, (s) => ({ ...s, answers: { params, updatedAt: new Date().toISOString() } }));
  return 'ok';
}

/**
 * התנתקות. 'global': מכל המכשירים. 'local': רק כאן, אחרי מחיקת החשבון, כשההתחברות כבר לא תקפה.
 * האירוע SIGNED_OUT מעדכן את כל הדף.
 */
export async function signOut(scope: 'global' | 'local' = 'global'): Promise<ListResult> {
  const { error } = await createBrowserSupabase().auth.signOut({ scope });
  return error ? 'error' : 'ok';
}

/**
 * מחיקת החשבון: הנתיב בשרת מוחק את המשתמש, והמסד מוחק איתו את כל השורות שלו.
 * מה שנשמר בדפדפן נמחק גם הוא. ההתחברות שבדפדפן נמחקת אחר כך, עם signOut('local').
 */
export async function deleteAccount(): Promise<ListResult> {
  try {
    const response = await fetch('/api/account/delete', { method: 'POST' });
    if (!response.ok) return 'error';
  } catch {
    return 'error';
  }
  writeLocal(EMPTY_LOCAL);
  return 'ok';
}
