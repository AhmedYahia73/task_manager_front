import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  X, 
  User, 
  Users, 
  Bot, 
  ChevronDown, 
  Calendar, 
  AlertTriangle,
  MessageSquare,
  ListTodo,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { useGet } from '@/hooks/useGet';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { isAdminRole } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// ─────────────────────────────────────────────
// Regex Keyword Definitions & Canonical Dictionaries (Spelling Tolerance Engine)
// ─────────────────────────────────────────────
const BOUNDARY_START = '(?:^|[\\s,.:;،؛_!؟\\-\\(\\)\\[\\]])';
const BOUNDARY_END = '(?=[\\s,.:;،؛_!؟\\-\\(\\)\\[\\]]|$)';

function makeKw(pattern) {
  return new RegExp(BOUNDARY_START + '(' + pattern + ')' + BOUNDARY_END, 'giu');
}
const makeKwRegex = makeKw;

const KW_DEFS = [
  { 
    field: 'project', 
    re: makeKw('(?:في|فى|بـ?|لـ?|ال)?\\s*(?:بروجيكت|بروجكت|برجكت|بروجك|بروجيك|مشروع|مشاريع|projects?|projs?|prjs?)'),
    canonical: ['بروجكت', 'بروجيكت', 'مشروع', 'project']
  },
  { 
    field: 'group', 
    re: makeKw('(?:في|فى|بـ?|لـ?|ال)?\\s*(?:جروب|قروب|جرووب|قرووب|جروبات|قروبات|جرب|قرب|مجموعة|مجموعه|مجموعات|groups?|grps?)'),
    canonical: ['جروب', 'قروب', 'مجموعة', 'group']
  },
  { 
    field: 'name', 
    re: makeKw('(?:ال)?(?:اسم|اسمه|اسمها|اسمو|باسم|باسمه|باسمها|بإسم|بإسمه|عنوان|عنوانه|عنوانها|مسمى|المسمى|تسمية|names?|named|titled|titles?)'),
    canonical: ['اسم', 'اسمه', 'عنوان', 'name', 'title']
  },
  { 
    field: 'description', 
    re: makeKw('(?:ال)?(?:ديسكربشن|دسكربشن|ديسكريبشن|دسكريبشن|ديسكربشنز|وصف|وصفه|وصفها|تفاصيل|تفصيله|تفصيلها|descriptions?|desc|details?)'),
    canonical: ['ديسكربشن', 'دسكربشن', 'وصف', 'تفاصيل', 'description']
  },
  { 
    field: 'urgent_date', 
    re: makeKw('(?:تاريخ\\s+العاجل|تاريخ\\s+التحول\\s+لعاجل|تاريخ\\s+عاجل|موعد\\s+العاجل|عاجل\\s+يوم|عاجل\\s+تاريخ|عاجل\\s+في|عاجل\\s+فى|عاجل|العاجل|تاريخ_عاجل|urgent(?:\\s+date)?)'),
    canonical: ['عاجل', 'العاجل', 'urgent']
  },
  { 
    field: 'date', 
    re: makeKw('(?:في|فى|ال)?\\s*(?:تاريخ\\s+التسليم|وقت\\s+التسليم|موعد\\s+التسليم|ميعاد\\s+التسليم|يوم\\s+التسليم|تسليم|التسليم|ديدلاين|الديدلاين|ديد\\s+لاين|الديد\\s+لاين|تاريخ_التسليم|delivery(?:\\s+date)?|deadline|due(?:\\s+date)?)'),
    canonical: ['تسليم', 'التسليم', 'ديدلاين', 'deadline', 'delivery']
  },
  { 
    field: 'leader', 
    re: makeKw('(?:في|فى|ال)?\\s*(?:ليدر|الليدر|ليد|الليد|ليدرز|مسؤول|المسؤول|مسؤل|المسؤل|قائد|القائد|مدير|المدير|leaders?|leads?)'),
    canonical: ['ليدر', 'مسؤول', 'قائد', 'leader']
  },
  { 
    field: 'user', 
    re: makeKw('(?:في|فى|ال)?\\s*(?:يوزر|يوزرز|اليوزر|اليوزرز|مستخدم|مستخدمين|المستخدم|المستخدمين|موظف|موظفين|الموظف|الموظفين|مهندس|مهندسين|المهندس|المهندسين|اعضاء|أعضاء|users?|assignees?)'),
    canonical: ['يوزر', 'مستخدم', 'موظف', 'user', 'assignee']
  },
];

// Multi-task start split regex with speech variations
const TASK_START_REGEX = /(?:^|[\n,،;]|\s+و\s*|\s+ثم\s*)(?:عاوز\s+اضيف\s+|عايز\s+اضيف\s+|عاوز\s+اعمل\s+|عايز\s+اعمل\s+|اضف\s+|ضيف\s+|اعمل\s+|اضافة\s+)?(?:تاسك|تسك|مهمة|مهمه|tasks?)(?=[\s,.:;،؛_!؟\-]|$)/giu;

// ─────────────────────────────────────────────
// Transliteration & Phonetic Normalization
// ─────────────────────────────────────────────
const ARABIC_TO_LATIN = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'g', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'o', 'ي': 'y', 'ى': 'y', 'ئ': 'e', 'ء': 'a', 'ؤ': 'o',
  'ة': 'a', 'پ': 'p', 'چ': 'ch', 'ڤ': 'v', 'گ': 'g'
};

function arabicToLatin(str) {
  if (!str) return '';
  return str.split('').map(c => ARABIC_TO_LATIN[c] || c).join('');
}

function phoneticSimplify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[ieya]/g, 'i')
    .replace(/[uo]/g, 'u')
    .replace(/[bp]/g, 'b')
    .replace(/[ckq]/g, 'k')
    .replace(/[sz]/g, 's')
    .replace(/(.)\1+/g, '$1');
}

function normalize(str) {
  if (!str) return '';
  let s = String(str).toLowerCase().trim();
  s = s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0640]/g, '');
  s = s.replace(/[\-_.:;،,\/\\()[\]{}]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function normalizeToken(t) {
  return (t || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u0640\u064B-\u065F]/g, '')
    .replace(/^([وفلب]|ال)+/u, '')
    .trim();
}

function levenshtein(a, b) {
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] 
        ? dp[i - 1][j - 1] 
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1.0;

  // Substring match
  if (na.includes(nb) || nb.includes(na)) {
    const minL = Math.min(na.length, nb.length);
    const maxL = Math.max(na.length, nb.length);
    return 0.8 + (minL / maxL) * 0.19;
  }

  // Cross-lingual phonetic transliteration comparison
  const pa = phoneticSimplify(arabicToLatin(na));
  const pb = phoneticSimplify(arabicToLatin(nb));
  if (pa === pb) return 0.95;
  if (pa && pb && (pa.includes(pb) || pb.includes(pa))) {
    const minL = Math.min(pa.length, pb.length);
    const maxL = Math.max(pa.length, pb.length);
    return 0.85 + (minL / maxL) * 0.1;
  }
  if (pa && pb && Math.min(pa.length, pb.length) >= 4) {
    const pdist = levenshtein(pa, pb);
    if (pdist <= 1) return 0.88;
    if (pdist <= 2) return 0.75;
  }

  // Token matching
  const tokensA = na.split(' ');
  const tokensB = nb.split(' ');
  let tokenMatches = 0;
  for (const wA of tokensA) {
    for (const wB of tokensB) {
      if (wA === wB) {
        tokenMatches += 1;
      } else if (wA.length >= 3 && (wB.startsWith(wA) || wA.startsWith(wB))) {
        tokenMatches += 0.85;
      } else if (Math.min(wA.length, wB.length) >= 4 && levenshtein(wA, wB) <= 2) {
        tokenMatches += 0.75;
      }
    }
  }
  const tokenScore = (tokenMatches * 2) / (tokensA.length + tokensB.length);
  const maxLen = Math.max(na.length, nb.length);
  const editScore = Math.max(0, 1 - levenshtein(na, nb) / maxLen);

  return Math.max(tokenScore, editScore);
}

function fuzzyMatchProject(query, projectsList, threshold = 0.35) {
  if (!query || !projectsList?.length) return null;
  let best = null;
  let bestScore = threshold;

  for (const item of projectsList) {
    const score = similarity(query, item.name);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

function fuzzyMatchGroup(query, groupsList, projectId = null, threshold = 0.35) {
  if (!query || !groupsList?.length) return null;

  // If a project is selected/specified, strictly search within groups belonging to that project (where project_id)
  const candidateGroups = (projectId !== null && projectId !== undefined && projectId !== '')
    ? groupsList.filter(item => String(item.project_id) === String(projectId))
    : groupsList;

  if (!candidateGroups.length) return null;

  let best = null;
  let bestScore = threshold;

  for (const item of candidateGroups) {
    const score = similarity(query, item.name);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

function fuzzyMatchUser(query, usersList, threshold = 0.5) {
  if (!query || !usersList?.length) return null;
  const cleanQ = query.replace(/^@\s*/, '').trim();
  const qTokens = cleanQ.split(/\s+/).filter(Boolean).map(w => phoneticSimplify(arabicToLatin(normalize(w))));
  if (!qTokens.length) return null;

  let best = null;
  let bestScore = threshold;

  for (const item of usersList) {
    const uTokens = (item.name || '').split(/\s+/).filter(Boolean).map(w => phoneticSimplify(arabicToLatin(normalize(w))));
    let matchedTokens = 0;
    for (const q of qTokens) {
      for (const u of uTokens) {
        if (q === u) {
          matchedTokens += 1;
          break;
        } else if (Math.min(q.length, u.length) >= 3 && (u.startsWith(q) || q.startsWith(u))) {
          matchedTokens += 0.85;
          break;
        } else if (Math.min(q.length, u.length) >= 3 && levenshtein(q, u) <= 1) {
          matchedTokens += 0.8;
          break;
        }
      }
    }
    const score = matchedTokens / qTokens.length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

function cleanValue(val) {
  if (!val) return '';
  return val
    .replace(/^[:\-—=،,;\s]+|[:\-—=،,;\s]+$/g, '')
    .replace(/^(?:هو|هي|وهو|وهي|في|فى|بـ?|لـ?|من|الى|إلى|ان|أن)\s+/gu, '')
    .replace(/^(?:المهمة|المهمه|التاسك|التسك)\s+/gu, '')
    .replace(/\s+(?:في|فى|بـ?|لـ?|من|الى|إلى|مع|على|عن)$/gu, '')
    .replace(/[:\-—=،,;\s]+$/g, '')
    .trim();
}

function parseDate(text) {
  if (!text) return '';
  const clean = text.trim();

  // Arabic relative date keywords
  if (/(?:النهارده|النهاردة|اليوم|today)/i.test(clean)) {
    return dayjs().format('YYYY-MM-DD');
  }
  if (/(?:بعد\s+بكرة|بعد\s+بكره|بعد\s+غد)/i.test(clean)) {
    return dayjs().add(2, 'day').format('YYYY-MM-DD');
  }
  if (/(?:بكرة|بكره|غدا|غداً|tomorrow)/i.test(clean)) {
    return dayjs().add(1, 'day').format('YYYY-MM-DD');
  }
  if (/(?:بعد\s+اسبوع|بعد\s+أسبوع|next\s+week)/i.test(clean)) {
    return dayjs().add(1, 'week').format('YYYY-MM-DD');
  }
  if (/(?:بعد\s+شهر|next\s+month)/i.test(clean)) {
    return dayjs().add(1, 'month').format('YYYY-MM-DD');
  }

  // Explicit date formats
  // Explicit date formats (supporting 1-4 digits per component and normalizes leading zeros like 011 -> 11)
  const patterns = [
    /(\d{4})[\/\-\.](\d{1,4})[\/\-\.](\d{1,4})/,
    /(\d{1,4})[\/\-\.](\d{1,4})[\/\-\.](\d{4})/,
    /(\d{1,4})\s+(\d{1,4})\s+(\d{4})/,
    /(\d{1,4})[\/\-](\d{1,4})/,
  ];

  for (const p of patterns) {
    const m = clean.match(p);
    if (m) {
      let y, mo, dNum;
      if (m[1].length === 4) {
        y = m[1];
        mo = String(parseInt(m[2], 10)).padStart(2, '0');
        dNum = String(parseInt(m[3], 10)).padStart(2, '0');
      } else if (m[3] && m[3].length === 4) {
        y = m[3];
        mo = String(parseInt(m[2], 10)).padStart(2, '0');
        dNum = String(parseInt(m[1], 10)).padStart(2, '0');
      } else if (!m[3]) {
        y = String(dayjs().year());
        mo = String(parseInt(m[2], 10)).padStart(2, '0');
        dNum = String(parseInt(m[1], 10)).padStart(2, '0');
      }
      const parsed = dayjs(`${y}-${mo}-${dNum}`);
      if (parsed && parsed.isValid()) return parsed.format('YYYY-MM-DD');
    }
  }
  return '';
}

// ─────────────────────────────────────────────
// Positional Segment Parser with Typo-Tolerance
// ─────────────────────────────────────────────
function parseTaskSegment(seg, projectsList, groupsList, usersList) {
  const matchItems = [];

  // 1. Primary Keyword Matching (Regex)
  for (const def of KW_DEFS) {
    const r = new RegExp(def.re);
    let m;
    while ((m = r.exec(seg)) !== null) {
      matchItems.push({
        field: def.field,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  // 2. Secondary Typo-Scanning Fallback for Missed Keywords
  const foundFields = new Set(matchItems.map(m => m.field));
  const tokenRegex = /[\w\u0600-\u06FF]+/gu;
  let tm;
  while ((tm = tokenRegex.exec(seg)) !== null) {
    const word = tm[0];
    const wStart = tm.index;
    const wEnd = tm.index + word.length;

    // Check if token overlaps an already matched keyword
    const overlaps = matchItems.some(m => !(wEnd <= m.start || wStart >= m.end));
    if (overlaps) continue;

    const normWord = normalizeToken(word);
    if (normWord.length < 3) continue;

    for (const def of KW_DEFS) {
      if (foundFields.has(def.field)) continue;

      for (const canon of def.canonical) {
        const normCanon = normalizeToken(canon);
        const dist = levenshtein(normWord, normCanon);
        const maxL = Math.max(normWord.length, normCanon.length);
        const sim = 1 - dist / maxL;

        if ((dist <= 1 && maxL >= 4) || sim >= 0.8) {
          // Preposition shift if "في" or "بـ" immediately preceded
          let actualStart = wStart;
          const before = seg.slice(0, wStart);
          const prepMatch = before.match(/(?:في|فى|بـ?|لـ?)\s*$/u);
          if (prepMatch) {
            actualStart = wStart - prepMatch[0].length;
          }

          matchItems.push({
            field: def.field,
            start: actualStart,
            end: wEnd,
            isFuzzy: true,
          });
          foundFields.add(def.field);
          break;
        }
      }
    }
  }

  matchItems.sort((a, b) => a.start - b.start);

  const rawFields = {};
  for (let i = 0; i < matchItems.length; i++) {
    const curr = matchItems[i];
    const nextStart = (i + 1 < matchItems.length) ? matchItems[i + 1].start : seg.length;
    const extracted = cleanValue(seg.slice(curr.end, nextStart));
    rawFields[curr.field] = extracted;
  }

  if (!rawFields.name && matchItems.length > 0 && matchItems[0].start > 0) {
    const preamble = cleanValue(seg.slice(0, matchItems[0].start));
    const cleanedPreamble = preamble
      .replace(/^(?:عاوز\s+اضيف|عايز\s+اضيف|عاوز\s+اعمل|عايز\s+اعمل|ضيف|اضف|اعمل|تاسك|مهمة)\s+/gu, '')
      .trim();
    if (cleanedPreamble && cleanedPreamble.length >= 2) {
      rawFields.name = cleanedPreamble;
    }
  }

  const nameVal = rawFields.name || '';
  const projectVal = rawFields.project || '';
  const groupVal = rawFields.group || '';
  const descVal = rawFields.description || '';
  const dateVal = parseDate(rawFields.date || '');
  const urgentDateVal = parseDate(rawFields.urgent_date || '');

  let matchedProject = fuzzyMatchProject(projectVal, projectsList);
  // Fallback: If project was not identified via keyword, scan segment for any known project
  if (!matchedProject && projectsList?.length) {
    for (const p of projectsList) {
      if (p.name && p.name.length >= 3) {
        const pRegex = new RegExp('(?:^|[\\s,.:;،؛_!؟\\-\\(\\)\\[\\]])' + p.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?=[\\s,.:;،؛_!؟\\-\\(\\)\\[\\]]|$)', 'iu');
        if (pRegex.test(seg) || similarity(seg, p.name) >= 0.75) {
          matchedProject = p;
          break;
        }
      }
    }
  }

  let matchedGroup = fuzzyMatchGroup(groupVal, groupsList, matchedProject?.id || null);
  // Fallback: If group was not identified via keyword, scan segment for any candidate group
  if (!matchedGroup && groupsList?.length) {
    const candidateGroups = (matchedProject?.id !== null && matchedProject?.id !== undefined && matchedProject?.id !== '')
      ? groupsList.filter(item => String(item.project_id) === String(matchedProject.id))
      : groupsList;

    for (const g of candidateGroups) {
      if (g.name && g.name.length >= 3) {
        const gRegex = new RegExp('(?:^|[\\s,.:;،؛_!؟\\-\\(\\)\\[\\]])' + g.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?=[\\s,.:;،؛_!؟\\-\\(\\)\\[\\]]|$)', 'iu');
        if (gRegex.test(seg) || similarity(seg, g.name) >= 0.75) {
          matchedGroup = g;
          break;
        }
      }
    }
  }

  // If group was matched and has project_id, but project wasn't matched from text, infer project from group
  const finalProjectId = matchedProject?.id || (matchedGroup?.project_id ? matchedGroup.project_id : '');
  const finalProjectName = matchedProject?.name || (finalProjectId ? (projectsList?.find(p => String(p.id) === String(finalProjectId))?.name || projectVal) : projectVal);

  const finalDate = dateVal || parseDate(rawFields.date) || parseDate(seg);
  const finalUrgentDate = urgentDateVal || parseDate(rawFields.urgent_date) || (seg.includes('عاجل') ? parseDate(seg) : '');

  // Assignees fuzzy detection from voice/text if present (@username, يوزر فلان, مهندس فلان, ليدر فلان)
  let assigneesIds = [];
  let assigneesNames = [];

  const userQuery = rawFields.user || rawFields.leader;
  if (userQuery && usersList?.length) {
    const matchedUser = fuzzyMatchUser(userQuery, usersList);
    if (matchedUser && !assigneesIds.includes(matchedUser.id)) {
      assigneesIds.push(matchedUser.id);
      assigneesNames.push(matchedUser.name);
    }
  }

  const mentionMatches = seg.match(/@([\w\u0600-\u06FF]+)/gu);
  if (mentionMatches && usersList?.length) {
    for (const mention of mentionMatches) {
      const cleanMention = mention.replace('@', '');
      const matchedUser = fuzzyMatchUser(cleanMention, usersList);
      if (matchedUser && !assigneesIds.includes(matchedUser.id)) {
        assigneesIds.push(matchedUser.id);
        assigneesNames.push(matchedUser.name);
      }
    }
  }

  return {
    _id: Date.now() + Math.random(),
    name: nameVal,
    project: finalProjectName,
    project_id: finalProjectId,
    group: matchedGroup?.name || groupVal,
    group_id: matchedGroup?.id || '',
    description: descVal,
    delivery_date: finalDate,
    date_urgent: finalUrgentDate,
    importanc_status: 'medium',
    status: 'pending',
    user_id: assigneesIds[0] || null,
    users_ids: assigneesIds,
    _assigneeNames: assigneesNames,
  };
}

function parseTasksFromText(text, projectsList, groupsList, usersList) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const taskStartIndices = [];
  let m;
  const r = new RegExp(TASK_START_REGEX);
  while ((m = r.exec(trimmed)) !== null) {
    taskStartIndices.push(m.index);
  }

  let segments = [];
  if (taskStartIndices.length > 1) {
    for (let i = 0; i < taskStartIndices.length; i++) {
      const start = taskStartIndices[i];
      const end = (i + 1 < taskStartIndices.length) ? taskStartIndices[i + 1] : trimmed.length;
      const seg = trimmed.slice(start, end).trim();
      if (seg) segments.push(seg);
    }
  } else {
    segments = [trimmed];
  }

  const results = [];
  for (const seg of segments) {
    const taskObj = parseTaskSegment(seg, projectsList, groupsList, usersList);
    if (taskObj.name || taskObj.project || taskObj.group || taskObj.description) {
      results.push(taskObj);
    }
  }

  return results;
}

// ─────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────
function ChatBubble({ message, isUser }) {
  return (
    <div className={`flex gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3 sm:mb-4`}>
      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold
        ${isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xs'
        }`}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div 
        dir="auto"
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm shadow-2xs whitespace-pre-line leading-relaxed
        ${isUser 
          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
          : 'bg-muted/70 text-foreground rounded-tl-sm border border-border/50'
        }`}>
        {message}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Task Card Inside Chat Panel (with date_urgent)
// ─────────────────────────────────────────────
function TaskCard({ task, index, usersList, projectsList, groupsList, onUpdate, onRemove }) {
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  // Fetch group users if group_id is selected (matching /admin/projects/:id/groups/:id/tasks behavior)
  const { data: groupUsersData } = useGet(task.group_id ? `/api/admin/projectGroup/${task.group_id}/users` : null);
  const groupUsers = groupUsersData?.users || groupUsersData?.data?.users || null;
  const activeUsersPool = (groupUsers && groupUsers.length > 0) ? groupUsers : usersList;

  const projectSuggestions = task.project
    ? projectsList
        .map(p => ({ ...p, score: similarity(task.project, p.name) }))
        .filter(p => p.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
    : projectsList.slice(0, 6);

  const scopedGroups = (task.project_id !== null && task.project_id !== undefined && task.project_id !== '')
    ? groupsList.filter(g => String(g.project_id) === String(task.project_id))
    : groupsList;

  const groupSuggestions = task.group
    ? scopedGroups
        .map(g => ({ ...g, score: similarity(task.group, g.name) }))
        .filter(g => g.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
    : scopedGroups.slice(0, 8);

  const filteredUsersForAssignee = activeUsersPool.filter(u =>
    u.name?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const isComplete = task.name && task.project_id && task.group_id && task.users_ids?.length > 0;

  return (
    <div className={`border rounded-2xl p-3.5 sm:p-4 mb-3 bg-background shadow-xs transition-all
      ${isComplete ? 'border-emerald-400/60 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-border'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete 
            ? <CheckCircle2 size={16} className="text-emerald-500" /> 
            : <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 animate-pulse" title="Incomplete task" />
          }
          <span className="text-xs font-bold text-foreground">
            Task #{index + 1}
          </span>
          {isComplete ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              Ready
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              Needs Details
            </span>
          )}
        </div>
        <button 
          type="button"
          onClick={() => onRemove(task._id)} 
          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
          title="Remove task"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Task Name */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            📝 Task Name *
          </label>
          <input
            className={`w-full text-xs sm:text-sm bg-muted/40 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50
              ${task.name ? 'border-border' : 'border-amber-400/80 bg-amber-50/20'}`}
            value={task.name}
            onChange={e => onUpdate(task._id, 'name', e.target.value)}
            placeholder="e.g. new task..."
          />
        </div>

        {/* Project + Group (Responsive Stack) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
          {/* Project */}
          <div className="relative">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              📁 Project *
            </label>
            <input
              className={`w-full text-xs sm:text-sm bg-muted/40 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50
                ${task.project_id ? 'border-emerald-400/70' : 'border-amber-400/80 bg-amber-50/20'}`}
              value={task.project}
              onChange={e => { onUpdate(task._id, 'project', e.target.value); setShowProjectSuggestions(true); }}
              onFocus={() => setShowProjectSuggestions(true)}
              onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 200)}
              placeholder="e.g. sportego..."
            />
            {task.project_id
              ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">✓ {task.project}</span>
              : task.project && <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">⚠️ Click below to select</span>
            }

            {showProjectSuggestions && projectSuggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase border-b border-border bg-muted/30">
                  Select Project
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {projectSuggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => {
                        onUpdate(task._id, '_projectSelect', { id: p.id, name: p.name });
                        setShowProjectSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted/80 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      {p.score !== undefined && (
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {Math.min(100, Math.round(p.score * 100))}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group */}
          <div className="relative">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>📂 Group *</span>
              {task.project_id && (
                <span className="text-[9px] text-primary lowercase font-medium">
                  where project_id
                </span>
              )}
            </label>
            <input
              className={`w-full text-xs sm:text-sm bg-muted/40 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50
                ${task.group_id ? 'border-emerald-400/70' : 'border-amber-400/80 bg-amber-50/20'}`}
              value={task.group}
              onChange={e => { onUpdate(task._id, 'group', e.target.value); setShowGroupSuggestions(true); }}
              onFocus={() => setShowGroupSuggestions(true)}
              onBlur={() => setTimeout(() => setShowGroupSuggestions(false), 200)}
              placeholder={task.project_id ? "Select/type group in this project..." : "e.g. clubs..."}
            />
            {task.group_id
              ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">✓ {task.group}</span>
              : task.group && <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">⚠️ Click below to select</span>
            }

            {showGroupSuggestions && (
              <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase border-b border-border bg-muted/30 flex items-center justify-between">
                  <span>Select Group</span>
                  {task.project_id && (
                    <span className="text-[9px] text-primary font-mono font-medium lowercase">
                      (project #{task.project_id})
                    </span>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {groupSuggestions.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onMouseDown={() => {
                        onUpdate(task._id, '_groupSelect', { id: g.id, name: g.name });
                        setShowGroupSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted/80 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span className="truncate font-medium">{g.name}</span>
                      {g.score !== undefined && (
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {Math.min(100, Math.round(g.score * 100))}%
                        </span>
                      )}
                    </button>
                  ))}
                  {groupSuggestions.length === 0 && (
                    <div className="text-center py-3 text-xs text-muted-foreground">
                      {task.project_id ? 'لا توجد مجموعات تابعة لهذا المشروع' : 'No groups found'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dates Row: delivery_date + date_urgent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
          {/* Delivery Date */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-primary" />
              <span>Delivery Date</span>
            </label>
            <input
              type="date"
              className="w-full text-xs sm:text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              value={task.delivery_date || ''}
              onChange={e => onUpdate(task._id, 'delivery_date', e.target.value)}
            />
          </div>

          {/* Urgent Date (date_urgent) */}
          <div>
            <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>Urgent Date (تاريخ العاجل)</span>
            </label>
            <input
              type="date"
              className="w-full text-xs sm:text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
              value={task.date_urgent || ''}
              onChange={e => onUpdate(task._id, 'date_urgent', e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            📄 Description
          </label>
          <textarea
            className="w-full text-xs sm:text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 resize-none"
            value={task.description}
            onChange={e => onUpdate(task._id, 'description', e.target.value)}
            placeholder="Optional task description..."
            rows={2}
          />
        </div>

        {/* Assign To (users_ids) */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Users size={13} className="text-primary" />
              <span>Assign To (المكلفين بالمهمة) *</span>
              {task.users_ids?.length === 0 ? (
                <span className="text-[10px] text-amber-500 font-semibold">(مطلوب)</span>
              ) : (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ({task.users_ids.length} محدد)
                </span>
              )}
            </label>
            {activeUsersPool?.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (task.users_ids?.length === activeUsersPool.length) {
                    onUpdate(task._id, '_assigneeClear');
                  } else {
                    onUpdate(task._id, '_assigneeSelectAll', activeUsersPool);
                  }
                }}
                className="text-[10px] font-semibold text-primary hover:underline transition-colors cursor-pointer"
              >
                {task.users_ids?.length === activeUsersPool.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </button>
            )}
          </div>

          {/* Selected assignees chips */}
          {task._assigneeNames?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {task._assigneeNames.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium">
                  @ {name}
                  <button
                    type="button"
                    onClick={() => {
                      const uid = task.users_ids[i];
                      onUpdate(task._id, '_assigneeRemove', uid);
                    }}
                    className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setShowAssigneePicker(!showAssigneePicker); setAssigneeSearch(''); }}
            className={`w-full text-xs sm:text-sm bg-muted/40 border rounded-xl px-3 py-2 text-left flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer
              ${task.users_ids?.length ? 'border-border' : 'border-amber-400/80 bg-amber-50/20'}`}
          >
            <div className="flex items-center gap-2 truncate">
              <Plus size={14} className="text-muted-foreground shrink-0" />
              <span className={task.users_ids?.length ? 'text-foreground font-medium truncate' : 'text-muted-foreground/60 truncate'}>
                {task.users_ids?.length
                  ? `تم تحديد ${task.users_ids.length} موظف (انقر للتعديل)`
                  : 'اختر الموظفين المكلفين بهذه المهمة...'}
              </span>
            </div>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {task.users_ids?.length > 1 && (
            <p className="text-[11px] text-primary/90 mt-1.5 font-medium bg-primary/5 p-2 rounded-xl border border-primary/20 flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>سيتم إنشاء مهمة منفصلة لكل موظف من الـ {task.users_ids.length} المحددين.</span>
            </p>
          )}

          {showAssigneePicker && (
            <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-border">
                <input
                  autoFocus
                  className="w-full text-xs bg-muted/40 rounded-lg px-3 py-1.5 focus:outline-none placeholder:text-muted-foreground/50"
                  placeholder="ابحث عن اسم الموظف..."
                  value={assigneeSearch}
                  onChange={e => setAssigneeSearch(e.target.value)}
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredUsersForAssignee.map(u => {
                  const isSelected = task.users_ids?.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onUpdate(task._id, '_assigneeToggle', { id: u.id, name: u.name });
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/80 flex items-center gap-2 transition-colors cursor-pointer
                        ${isSelected ? 'bg-primary/10 font-medium' : ''}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0
                        ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}`}>
                        {isSelected && <CheckCircle2 size={12} />}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="truncate flex-1">{u.name}</span>
                    </button>
                  );
                })}
                {filteredUsersForAssignee.length === 0 && (
                  <div className="text-center py-3 text-xs text-muted-foreground">لا يوجد موظفين بهذا الاسم</div>
                )}
              </div>
              <div className="p-2 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssigneePicker(false)}
                  className="text-xs text-primary font-bold px-3 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  تم
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Chat Page (Fully Responsive)
// ─────────────────────────────────────────────
const VoiceTaskChat = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role?.toLowerCase?.() || '';
  const isAdmin = isAdminRole(userRole);

  // Responsive mobile active tab ('chat' | 'preview')
  const [mobileTab, setMobileTab] = useState('chat');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  const { data: listsData } = useGet('/api/admin/tasks/lists');
  const projectsList = listsData?.projects_list || [];
  const groupsList = listsData?.groups_list || [];
  const usersList = listsData?.users_list || [];

  const { data: allUsersData } = useGet('/api/admin/user?limit=200');
  const allUsers = allUsersData?.users || usersList;

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '👋 مرحباً! أنا هنا أساعدك تضيف Tasks بالصوت أو الكتابة.\n\nقول أو اكتب مثلاً:\n"عاوز اضيف تاسك فى بروجيكت sportego فى جروب clubs اسمه new task"\n\nأو اضغط على زر الميكروفون وتكلم مباشرة! 🎙️'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, parsedTasks]);

  const { isListening, isSupported, start: startListening, stop: stopListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputText(transcript);
    },
    onError: (err) => {
      toast.error(`Microphone error: ${err}`);
    }
  });

  const addMessage = useCallback((type, content) => {
    setMessages(prev => [...prev, { id: Date.now(), type, content }]);
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    addMessage('user', text);
    setInputText('');

    const tasks = parseTasksFromText(text, projectsList, groupsList, usersList);

    if (tasks.length === 0) {
      addMessage('bot', '⚠️ مش قادر أفهم تفاصيل التاسك.\n\nجرّب مثلاً:\n"تاسك في بروجكت Sportego في جروب Clubs اسمه New Task"');
      return;
    }

    setParsedTasks(prev => [...prev, ...tasks]);
    setShowTaskPanel(true);
    // On small screen, automatically switch to preview tab so user sees the card
    if (window.innerWidth < 1024) {
      setMobileTab('preview');
    }

    const first = tasks[0];
    const projectDisplay = first.project ? `📁 المشروع: ${first.project}` : '';
    const groupDisplay = first.group ? `📂 الجروب: ${first.group}` : '';
    const nameDisplay = first.name ? `📝 الاسم: ${first.name}` : '';
    const dateDisplay = first.delivery_date ? `📅 التسليم: ${first.delivery_date}` : '';
    const urgentDisplay = first.date_urgent ? `⚠️ تاريخ العاجل: ${first.date_urgent}` : '';

    const details = [projectDisplay, groupDisplay, nameDisplay, dateDisplay, urgentDisplay].filter(Boolean).join('\n');

    addMessage(
      'bot', 
      `✅ تم التعرف على ${tasks.length} تاسك بنجاح!\n\n${details}\n\n👉 برجاء تحديد الموظفين المكلفين (Assign To) في الكارد، ثم اضغط زر "إرسال التاسكات" 🚀`
    );
  }, [inputText, projectsList, groupsList, usersList, addMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUpdateTask = useCallback((taskId, field, value) => {
    setParsedTasks(prev => prev.map(t => {
      if (t._id !== taskId) return t;

      if (field === '_assigneeToggle') {
        const already = t.users_ids?.includes(value.id);
        const newIds = already
          ? t.users_ids.filter(id => id !== value.id)
          : [...(t.users_ids || []), value.id];
        const newNames = already
          ? t._assigneeNames.filter(n => n !== value.name)
          : [...(t._assigneeNames || []), value.name];
        return {
          ...t,
          user_id: newIds[0] || null,
          users_ids: newIds,
          _assigneeNames: newNames,
        };
      }

      if (field === '_assigneeSelectAll') {
        const allIds = (value || []).map(u => u.id);
        const allNames = (value || []).map(u => u.name);
        return {
          ...t,
          user_id: allIds[0] || null,
          users_ids: allIds,
          _assigneeNames: allNames,
        };
      }

      if (field === '_assigneeClear') {
        return {
          ...t,
          user_id: null,
          users_ids: [],
          _assigneeNames: [],
        };
      }

      if (field === '_assigneeRemove') {
        const idx = t.users_ids.indexOf(value);
        const newIds = [...t.users_ids];
        const newNames = [...t._assigneeNames];
        if (idx !== -1) {
          newIds.splice(idx, 1);
          newNames.splice(idx, 1);
        }
        return { 
          ...t, 
          user_id: newIds[0] || null,
          users_ids: newIds, 
          _assigneeNames: newNames 
        };
      }

      if (field === '_projectSelect') {
        const newProjId = value.id;
        const stillValid = t.group_id && groupsList.some(g => String(g.id) === String(t.group_id) && String(g.project_id) === String(newProjId));
        let newGroupId = stillValid ? t.group_id : '';
        let newGroupName = stillValid ? t.group : '';
        if (!stillValid && t.group) {
          const reMatched = fuzzyMatchGroup(t.group, groupsList, newProjId);
          if (reMatched) {
            newGroupId = reMatched.id;
            newGroupName = reMatched.name;
          }
        }
        return { 
          ...t, 
          project: value.name, 
          project_id: newProjId, 
          group: newGroupName, 
          group_id: newGroupId 
        };
      }

      if (field === '_groupSelect') {
        const selectedGroup = groupsList.find(g => String(g.id) === String(value.id));
        const newProjId = (!t.project_id && selectedGroup?.project_id) ? selectedGroup.project_id : t.project_id;
        const newProjName = (!t.project_id && selectedGroup?.project_id)
          ? (projectsList.find(p => String(p.id) === String(selectedGroup.project_id))?.name || t.project)
          : t.project;
        return { 
          ...t, 
          group: value.name, 
          group_id: value.id,
          project: newProjName,
          project_id: newProjId,
        };
      }

      if (field === 'project') {
        const matched = fuzzyMatchProject(value, projectsList);
        const newProjId = matched?.id || '';
        const stillValid = t.group_id && groupsList.some(g => String(g.id) === String(t.group_id) && String(g.project_id) === String(newProjId));
        let newGroupId = stillValid ? t.group_id : '';
        let newGroupName = stillValid ? t.group : '';
        if (newProjId && !stillValid && t.group) {
          const reMatched = fuzzyMatchGroup(t.group, groupsList, newProjId);
          if (reMatched) {
            newGroupId = reMatched.id;
            newGroupName = reMatched.name;
          }
        }
        return { 
          ...t, 
          project: value, 
          project_id: newProjId,
          group: newGroupName,
          group_id: newGroupId,
        };
      }

      if (field === 'group') {
        const matched = fuzzyMatchGroup(value, groupsList, t.project_id || null);
        const newGroupId = matched?.id || '';
        let newProjId = t.project_id;
        let newProjName = t.project;
        if (!newProjId && matched?.project_id) {
          newProjId = matched.project_id;
          newProjName = projectsList.find(p => String(p.id) === String(matched.project_id))?.name || t.project;
        }
        return { 
          ...t, 
          group: value, 
          group_id: newGroupId,
          project: newProjName,
          project_id: newProjId,
        };
      }

      return { ...t, [field]: value };
    }));
  }, [projectsList, groupsList]);

  const handleRemoveTask = useCallback((taskId) => {
    setParsedTasks(prev => {
      const updated = prev.filter(t => t._id !== taskId);
      if (updated.length === 0) {
        setShowTaskPanel(false);
        setMobileTab('chat');
      }
      return updated;
    });
  }, []);

  const handleSubmitTasks = async () => {
    const errors = [];
    parsedTasks.forEach((t, i) => {
      if (!t.name) errors.push(`Task #${i + 1}: اسم التاسك مطلوب`);
      if (!t.project_id) errors.push(`Task #${i + 1}: لم يتم التعرف على المشروع (اختر من القائمة في الكارد)`);
      if (!t.group_id) errors.push(`Task #${i + 1}: لم يتم التعرف على الجروب (اختر من القائمة في الكارد)`);
      if (!t.users_ids?.length) errors.push(`Task #${i + 1}: يجب اختيار موظف واحد على الأقل (Assign To)`);
    });

    if (errors.length > 0) {
      addMessage('bot', `❌ يرجى استكمال البيانات التالية:\n${errors.map(e => `• ${e}`).join('\n')}`);
      if (window.innerWidth < 1024) setMobileTab('preview');
      return;
    }

    setIsSending(true);

    const payload = parsedTasks.map(t => ({
      name: t.name,
      project_id: t.project_id,
      group_id: t.group_id,
      delivery_date: t.delivery_date || null,
      date_urgent: t.date_urgent || null,
      description: t.description || null,
      importanc_status: t.importanc_status || 'medium',
      status: t.status || 'pending',
      user_id: t.users_ids?.[0] || null,
      users_ids: t.users_ids || [],
    }));

    try {
      const res = await apiClient.post('/api/admin/tasks/batch', { tasks: payload });
      const count = res?.data?.data?.count || parsedTasks.length;
      addMessage('bot', `🎉 تم إنشاء ${count} تاسك بنجاح في النظام! 🚀\n\nيمكنك الآن مراجعتهم مباشرة في صفحة المشاريع والمهام.`);
      toast.success(`${count} tasks created successfully!`);
      setParsedTasks([]);
      setShowTaskPanel(false);
      setMobileTab('chat');
    } catch (err) {
      const msg = err?.response?.data?.message || 'فشل في حفظ المهام';
      addMessage('bot', `❌ فشل الإرسال: ${msg}`);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-base font-bold mb-1">غير مسموح بالدخول</h2>
        <p className="text-xs text-muted-foreground mb-4">هذه الميزة مخصصة لمسؤولي النظام (Admin) فقط.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="text-xs bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl cursor-pointer hover:bg-primary/90 transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
      
      {/* ── Responsive Top Bar (Visible on mobile & tablet) ── */}
      <div className="flex lg:hidden items-center justify-between border-b border-border bg-card/80 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-2xs">
            <Bot size={15} />
          </div>
          <span className="font-bold text-xs">Voice Task Creator</span>
        </div>

        {/* Mobile Switcher Segmented Control */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mobileTab === 'chat'
                ? 'bg-background text-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer relative ${
              mobileTab === 'preview'
                ? 'bg-background text-foreground shadow-2xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListTodo size={13} />
            <span>Tasks</span>
            {parsedTasks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {parsedTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Responsive Content Area ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Chat Column ── */}
        <div 
          className={`flex flex-col flex-1 min-w-0 transition-all duration-300
            ${mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'}
            ${showTaskPanel ? 'lg:w-1/2' : 'lg:w-full'}
          `}
        >
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between px-5 py-3.5 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Bot size={18} />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  Voice Task Creator
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Admin</span>
                </h1>
                <p className="text-xs text-muted-foreground">تحدث أو اكتب لإنشاء التاسكات تلقائياً بالذكاء الاصطناعي</p>
              </div>
            </div>

            {parsedTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTaskPanel(!showTaskPanel)}
                className="flex items-center gap-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1.5 hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{parsedTasks.length} Tasks Preview</span>
              </button>
            )}
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-4 space-y-1">
            {messages.map(msg => (
              <ChatBubble
                key={msg.id}
                message={msg.content}
                isUser={msg.type === 'user'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Mobile Pill when tasks are ready */}
          {parsedTasks.length > 0 && mobileTab === 'chat' && (
            <div className="lg:hidden px-3 py-2 bg-primary/5 border-t border-primary/20 flex items-center justify-between">
              <span className="text-xs font-medium text-primary flex items-center gap-1.5">
                <Sparkles size={13} />
                {parsedTasks.length} تاسك جاهز للمعاينة
              </span>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className="text-xs font-bold text-primary-foreground bg-primary px-3 py-1 rounded-lg shadow-2xs cursor-pointer"
              >
                معاينة المهام ➔
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border bg-background/95 backdrop-blur-sm p-3 sm:p-4">
            <div className="flex items-end gap-2">
              {/* Mic Button */}
              {isSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer
                    ${isListening 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105 animate-pulse' 
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  dir="auto"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening 
                    ? '🎙️ جاري الاستماع...' 
                    : 'اكتب: "تاسك في بروجيكت sportego في جروب clubs اسمه new task" أو اضغط المايكروفون'
                  }
                  rows={2}
                  className="w-full bg-muted/50 border border-border rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
                />
                {isListening && (
                  <div className="absolute right-3 top-3 flex gap-0.5">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className="w-1 bg-red-500 rounded-full animate-bounce" 
                        style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} 
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs hover:shadow-md hover:shadow-primary/20 cursor-pointer"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </div>

            {!isSupported && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 text-center">
                ⚠️ Voice input not supported in this browser. Use Chrome or Edge.
              </p>
            )}
          </div>
        </div>

        {/* ── Tasks Preview Panel ── */}
        <div 
          className={`flex-col bg-background overflow-hidden border-border
            ${mobileTab === 'preview' ? 'flex w-full' : 'hidden'}
            ${showTaskPanel ? 'lg:flex lg:w-1/2 lg:border-l' : 'lg:hidden'}
          `}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-primary" />
              <h2 className="font-bold text-xs sm:text-sm">Tasks Preview</h2>
              <span className="text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-bold">
                {parsedTasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {parsedTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setParsedTasks([]); setShowTaskPanel(false); setMobileTab('chat'); }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10 cursor-pointer"
                >
                  Clear All
                </button>
              )}
              {/* Back to chat on mobile */}
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setMobileTab('chat');
                  } else {
                    setShowTaskPanel(false);
                  }
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted cursor-pointer"
                title="Close preview"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Task Cards Scrollable Container */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3.5 space-y-2">
            {parsedTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <ListTodo size={36} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm font-semibold">لا توجد تاسكات حالياً</p>
                <p className="text-xs mt-1">تكلم أو اكتب في الشات لاستخراج التاسكات تلقائياً</p>
                <button
                  type="button"
                  onClick={() => setMobileTab('chat')}
                  className="mt-4 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  الرجوع للشات 💬
                </button>
              </div>
            ) : (
              parsedTasks.map((task, i) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={i}
                  usersList={allUsers.length ? allUsers : usersList}
                  projectsList={projectsList}
                  groupsList={groupsList}
                  onUpdate={handleUpdateTask}
                  onRemove={handleRemoveTask}
                />
              ))
            )}
          </div>

          {/* Submit Action Bar */}
          {parsedTasks.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-border bg-card/60 backdrop-blur-sm">
              <div className="mb-2 text-[11px] text-muted-foreground text-center font-medium">
                {parsedTasks.filter(t => t.name && t.project_id && t.group_id && t.users_ids?.length).length} / {parsedTasks.length} tasks ready
              </div>
              <button
                type="button"
                onClick={handleSubmitTasks}
                disabled={isSending || parsedTasks.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-lg hover:shadow-primary/20 cursor-pointer active:scale-[0.99]"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>جاري إنشاء المهام...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>إرسال {parsedTasks.length} تاسك 🚀</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VoiceTaskChat;
