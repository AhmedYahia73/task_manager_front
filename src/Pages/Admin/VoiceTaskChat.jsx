import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Plus, Trash2, CheckCircle2, Loader2, X, User, Users, Bot, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { useGet } from '@/hooks/useGet';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { isAdminRole } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// ─────────────────────────────────────────────
// Keyword maps (Arabic + English + fuzzy)
// ─────────────────────────────────────────────
const TASK_KEYWORDS = /\b(task|tasks|تاسك|تاسكات|مهمة|مهام|تسك)\b/i;
const NAME_KEYWORDS = /\b(name|named|called|الاسم|اسم|باسم|اسمها|اسمه)\b/i;
const PROJECT_KEYWORDS = /\b(project|projects|بروجيكت|مشروع|المشروع|البروجيكت)\b/i;
const GROUP_KEYWORDS = /\b(group|groups|جروب|مجموعة|الجروب|المجموعة)\b/i;
const DESC_KEYWORDS = /\b(description|desc|وصف|الوصف|ديسكربشن|وصفها|وصفه)\b/i;
const DATE_KEYWORDS = /\b(delivery|deadline|due|التسليم|وقت\s+التسليم|تاريخ\s+التسليم|الديدلاين)\b/i;
const LEADER_KEYWORDS = /\b(leader|ليدر|المسؤول|القائد|الليدر)\b/i;
const USER_KEYWORDS = /\b(user|users|يوزر|يوزرز|اليوزر|مستخدم|الموظف|موظف)\b/i;

// All keywords combined - used to find where a field ends
const ALL_KEYWORDS = [
  TASK_KEYWORDS, NAME_KEYWORDS, PROJECT_KEYWORDS, GROUP_KEYWORDS,
  DESC_KEYWORDS, DATE_KEYWORDS, LEADER_KEYWORDS, USER_KEYWORDS
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Extract text between a start keyword and the next keyword (or end) */
function extractBetweenKeywords(text, startKeyword) {
  const match = startKeyword.exec(text);
  if (!match) return null;

  const afterKeyword = text.slice(match.index + match[0].length).trim();

  // Find the earliest next keyword
  let minIdx = afterKeyword.length;
  for (const kw of ALL_KEYWORDS) {
    const nextMatch = kw.exec(afterKeyword);
    if (nextMatch && nextMatch.index < minIdx) {
      minIdx = nextMatch.index;
    }
  }
  return afterKeyword.slice(0, minIdx).trim();
}

/** Fuzzy match a name against a list of {id, name} items */
function fuzzyMatch(query, list) {
  if (!query || !list?.length) return null;
  const q = query.toLowerCase().trim();
  // Exact match first
  const exact = list.find(item => item.name?.toLowerCase() === q);
  if (exact) return exact;
  // Startswith
  const starts = list.find(item => item.name?.toLowerCase().startsWith(q));
  if (starts) return starts;
  // Contains
  const contains = list.find(item => item.name?.toLowerCase().includes(q) || q.includes(item.name?.toLowerCase()));
  return contains || null;
}

/** Try to parse a date string from Arabic/English text and format as YYYY-MM-DD */
function parseDate(text) {
  if (!text) return '';
  // Try standard date formats
  const patterns = [
    // DD/MM/YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    // YYYY-MM-DD
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
    // DD MM YYYY (with spaces/Arabic months)
    /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let d;
      if (m[1].length === 4) {
        // YYYY-MM-DD
        d = dayjs(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`);
      } else {
        // DD/MM/YYYY
        d = dayjs(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
      }
      if (d.isValid()) return d.format('YYYY-MM-DD');
    }
  }
  return '';
}

// ─────────────────────────────────────────────
// Parse full text input into structured tasks
// ─────────────────────────────────────────────
function parseTasksFromText(text, projectsList, groupsList) {
  // Split into individual task blocks by "task/تاسك" keyword
  const parts = text.split(TASK_KEYWORDS).filter(p => p.trim().length > 0);
  
  const results = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Skip the keyword itself (alternating pattern from split)
    const raw = part.trim();
    if (!raw) continue;

    const nameVal = extractBetweenKeywords(raw, NAME_KEYWORDS) || '';
    const projectVal = extractBetweenKeywords(raw, PROJECT_KEYWORDS) || '';
    const groupVal = extractBetweenKeywords(raw, GROUP_KEYWORDS) || '';
    const descVal = extractBetweenKeywords(raw, DESC_KEYWORDS) || '';
    const dateRaw = extractBetweenKeywords(raw, DATE_KEYWORDS) || '';
    const dateVal = parseDate(dateRaw);

    const matchedProject = fuzzyMatch(projectVal, projectsList);
    const matchedGroup = fuzzyMatch(groupVal, groupsList);

    // Skip if no meaningful content detected
    if (!nameVal && !projectVal && !groupVal && raw.split(' ').length < 3) continue;

    results.push({
      _id: Date.now() + Math.random(),
      name: nameVal,
      project: projectVal,
      project_id: matchedProject?.id || '',
      group: groupVal,
      group_id: matchedGroup?.id || '',
      description: descVal,
      delivery_date: dateVal,
      importanc_status: 'medium',
      status: 'pending',
      user_id: '',   // leader
      users_ids: [], // assignees
      _leaderName: '',
      _assigneeNames: [],
    });
  }

  return results;
}

// ─────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────
function ChatBubble({ message, isUser }) {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        ${isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm'
        }`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm
        ${isUser 
          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
          : 'bg-muted/60 text-foreground rounded-tl-sm border border-border/40'
        }`}>
        {message}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Task Card inside chat
// ─────────────────────────────────────────────
function TaskCard({ task, index, usersList, onUpdate, onRemove }) {
  const [showLeaderPicker, setShowLeaderPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const filteredUsersForLeader = usersList.filter(u =>
    u.name?.toLowerCase().includes(leaderSearch.toLowerCase())
  );
  const filteredUsersForAssignee = usersList.filter(u =>
    u.name?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const isComplete = task.name && task.project_id && task.group_id && task.users_ids?.length > 0;

  return (
    <div className={`border rounded-2xl p-4 mb-3 bg-background shadow-xs transition-all
      ${isComplete ? 'border-emerald-400/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-border'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete 
            ? <CheckCircle2 size={16} className="text-emerald-500" /> 
            : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
          }
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Task #{index + 1}
          </span>
        </div>
        <button onClick={() => onRemove(task._id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Name */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            📝 Task Name *
          </label>
          <input
            className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
            value={task.name}
            onChange={e => onUpdate(task._id, 'name', e.target.value)}
            placeholder="Task name..."
          />
        </div>

        {/* Project + Group */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              📁 Project *
            </label>
            <input
              className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
              value={task.project}
              onChange={e => onUpdate(task._id, 'project', e.target.value)}
              placeholder="Project name..."
            />
            {task.project_id && (
              <span className="text-[10px] text-emerald-500 mt-0.5 block">✓ Matched</span>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              📂 Group *
            </label>
            <input
              className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
              value={task.group}
              onChange={e => onUpdate(task._id, 'group', e.target.value)}
              placeholder="Group name..."
            />
            {task.group_id && (
              <span className="text-[10px] text-emerald-500 mt-0.5 block">✓ Matched</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            📄 Description
          </label>
          <textarea
            className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 resize-none"
            value={task.description}
            onChange={e => onUpdate(task._id, 'description', e.target.value)}
            placeholder="Optional description..."
            rows={2}
          />
        </div>

        {/* Delivery Date */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            📅 Delivery Date
          </label>
          <input
            type="date"
            className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={task.delivery_date}
            onChange={e => onUpdate(task._id, 'delivery_date', e.target.value)}
          />
        </div>

        {/* Leader (user_id) */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            👑 Leader (user_id)
          </label>
          <button
            type="button"
            onClick={() => { setShowLeaderPicker(!showLeaderPicker); setLeaderSearch(''); }}
            className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 text-left flex items-center justify-between hover:border-primary/40 transition-colors"
          >
            <span className={task._leaderName ? 'text-foreground' : 'text-muted-foreground/50'}>
              {task._leaderName ? `@ ${task._leaderName}` : '@ Select leader...'}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {showLeaderPicker && (
            <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-border">
                <input
                  autoFocus
                  className="w-full text-sm bg-muted/40 rounded-lg px-3 py-1.5 focus:outline-none"
                  placeholder="Search users..."
                  value={leaderSearch}
                  onChange={e => setLeaderSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredUsersForLeader.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onUpdate(task._id, '_leaderSelect', { id: u.id, name: u.name });
                      setShowLeaderPicker(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span>{u.name}</span>
                    {task.user_id === u.id && <CheckCircle2 size={14} className="ml-auto text-emerald-500" />}
                  </button>
                ))}
                {filteredUsersForLeader.length === 0 && (
                  <div className="text-center py-3 text-sm text-muted-foreground">No users found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assignees (users_ids) */}
        <div className="relative">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
            👥 Assignees (users_ids) *
          </label>

          {/* Selected assignees chips */}
          {task._assigneeNames?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {task._assigneeNames.map((name, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1">
                  @ {name}
                  <button
                    onClick={() => {
                      const uid = task.users_ids[i];
                      onUpdate(task._id, '_assigneeRemove', uid);
                    }}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setShowAssigneePicker(!showAssigneePicker); setAssigneeSearch(''); }}
            className="w-full text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 text-left flex items-center gap-2 hover:border-primary/40 transition-colors"
          >
            <Plus size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground/50">Add assignee...</span>
          </button>

          {showAssigneePicker && (
            <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 border-b border-border">
                <input
                  autoFocus
                  className="w-full text-sm bg-muted/40 rounded-lg px-3 py-1.5 focus:outline-none"
                  placeholder="Search users..."
                  value={assigneeSearch}
                  onChange={e => setAssigneeSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredUsersForAssignee.map(u => {
                  const isSelected = task.users_ids.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onUpdate(task._id, '_assigneeToggle', { id: u.id, name: u.name });
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 flex items-center gap-2 transition-colors
                        ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                      {isSelected && <CheckCircle2 size={14} className="ml-auto text-emerald-500" />}
                    </button>
                  );
                })}
                {filteredUsersForAssignee.length === 0 && (
                  <div className="text-center py-3 text-sm text-muted-foreground">No users found</div>
                )}
              </div>
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => setShowAssigneePicker(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
                >
                  Done
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
// Main Chat Page
// ─────────────────────────────────────────────
const VoiceTaskChat = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role?.toLowerCase?.() || '';
  const isAdmin = isAdminRole(userRole);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  // Fetch lists (projects, groups, users)
  const { data: listsData } = useGet('/api/admin/tasks/lists');
  const projectsList = listsData?.projects_list || [];
  const groupsList = listsData?.groups_list || [];
  const usersList = listsData?.users_list || [];

  // Also fetch all users for assignment (includes engineers + testers + admins)
  const { data: allUsersData } = useGet('/api/admin/user?limit=200');
  const allUsers = allUsersData?.users || usersList;

  // Chat messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '👋 مرحباً! أنا هنا أساعدك تضيف Tasks بالصوت أو الكتابة.\n\nقول مثلاً:\n"تاسك اسم Fix Login Bug بروجيكت Website جروب Backend ديسكربشن إصلاح مشكلة الدخول التسليم 30/11/2026"\n\nأو اضغط على زر الميكروفون وتكلم! 🎙️'
    }
  ]);

  // Current input
  const [inputText, setInputText] = useState('');
  const [parsedTasks, setParsedTasks] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, parsedTasks]);

  // Speech recognition
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

  // Handle user sends text
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    addMessage('user', text);
    setInputText('');

    // Check if text contains task keywords
    if (!TASK_KEYWORDS.test(text)) {
      addMessage('bot', '🔍 لم أجد keyword "task" أو "تاسك".\n\nجرب: "تاسك اسم X بروجيكت Y جروب Z ..."');
      return;
    }

    // Parse tasks from text
    const tasks = parseTasksFromText(text, projectsList, groupsList);

    if (tasks.length === 0) {
      addMessage('bot', '⚠️ مش قادر أفهم التاسك. حاول تكتب بشكل أوضح.');
      return;
    }

    setParsedTasks(prev => [...prev, ...tasks]);
    setShowTaskPanel(true);

    const unmatched = tasks.filter(t => !t.project_id || !t.group_id);
    if (unmatched.length > 0) {
      addMessage('bot', `✅ عرفت ${tasks.length} تاسك!\n\n⚠️ بعض البروجيكت/جروب مش متعرف عليهم. راجع الكارد وتأكد منهم.\n\nبعد ما تحدد الليدر والموظفين، اضغط "إرسال التاسكات" 🚀`);
    } else {
      addMessage('bot', `✅ عرفت ${tasks.length} تاسك ومتطابق مع البروجيكت والجروب!\n\nاختار الليدر والموظفين لكل تاسك، ثم اضغط "إرسال التاسكات" 🚀`);
    }
  }, [inputText, projectsList, groupsList, addMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Update a task field
  const handleUpdateTask = useCallback((taskId, field, value) => {
    setParsedTasks(prev => prev.map(t => {
      if (t._id !== taskId) return t;

      if (field === '_leaderSelect') {
        return { ...t, user_id: value.id, _leaderName: value.name };
      }

      if (field === '_assigneeToggle') {
        const already = t.users_ids.includes(value.id);
        if (already) {
          return {
            ...t,
            users_ids: t.users_ids.filter(id => id !== value.id),
            _assigneeNames: t._assigneeNames.filter(n => n !== value.name),
          };
        } else {
          return {
            ...t,
            users_ids: [...t.users_ids, value.id],
            _assigneeNames: [...t._assigneeNames, value.name],
          };
        }
      }

      if (field === '_assigneeRemove') {
        const idx = t.users_ids.indexOf(value);
        const newIds = [...t.users_ids];
        const newNames = [...t._assigneeNames];
        newIds.splice(idx, 1);
        newNames.splice(idx, 1);
        return { ...t, users_ids: newIds, _assigneeNames: newNames };
      }

      // For project/group text changes, re-fuzzy match
      if (field === 'project') {
        const matched = fuzzyMatch(value, projectsList);
        return { ...t, project: value, project_id: matched?.id || '' };
      }
      if (field === 'group') {
        const matched = fuzzyMatch(value, groupsList);
        return { ...t, group: value, group_id: matched?.id || '' };
      }

      return { ...t, [field]: value };
    }));
  }, [projectsList, groupsList]);

  // Remove a task
  const handleRemoveTask = useCallback((taskId) => {
    setParsedTasks(prev => {
      const updated = prev.filter(t => t._id !== taskId);
      if (updated.length === 0) setShowTaskPanel(false);
      return updated;
    });
  }, []);

  // Validate and submit
  const handleSubmitTasks = async () => {
    const errors = [];
    parsedTasks.forEach((t, i) => {
      if (!t.name) errors.push(`Task #${i + 1}: Name is required`);
      if (!t.project_id) errors.push(`Task #${i + 1}: Project not matched (type exact project name)`);
      if (!t.group_id) errors.push(`Task #${i + 1}: Group not matched (type exact group name)`);
      if (!t.users_ids?.length) errors.push(`Task #${i + 1}: At least one assignee required`);
    });

    if (errors.length > 0) {
      addMessage('bot', `❌ في أخطاء:\n${errors.map(e => `• ${e}`).join('\n')}`);
      return;
    }

    setIsSending(true);

    const payload = parsedTasks.map(t => ({
      name: t.name,
      project_id: t.project_id,
      group_id: t.group_id,
      delivery_date: t.delivery_date || null,
      description: t.description || null,
      importanc_status: t.importanc_status || 'medium',
      status: t.status || 'pending',
      user_id: t.user_id || null,
      users_ids: t.users_ids,
    }));

    try {
      const res = await apiClient.post('/api/admin/tasks/batch', { tasks: payload });
      const count = res?.data?.data?.count || parsedTasks.length;
      addMessage('bot', `🎉 تم إنشاء ${count} تاسك بنجاح! 🚀\n\nيمكنك مشاهدتهم في صفحة المشاريع.`);
      toast.success(`${count} tasks created successfully!`);
      setParsedTasks([]);
      setShowTaskPanel(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create tasks';
      addMessage('bot', `❌ فشل الإرسال: ${msg}`);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* ── Chat Column ── */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${showTaskPanel ? 'w-1/2' : 'w-full'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">Voice Task Creator</h1>
            <p className="text-xs text-muted-foreground">Admin • AI-powered task creation</p>
          </div>
          {parsedTasks.length > 0 && (
            <button
              onClick={() => setShowTaskPanel(!showTaskPanel)}
              className="ml-auto flex items-center gap-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1.5 hover:bg-primary/15 transition-colors"
            >
              <CheckCircle2 size={14} />
              {parsedTasks.length} Tasks
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              message={msg.content}
              isUser={msg.type === 'user'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
          <div className="flex items-end gap-2">
            {/* Mic button */}
            {isSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isListening 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105 animate-pulse' 
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening 
                  ? '🎙️ جاري الاستماع...' 
                  : 'اكتب: "تاسك اسم X بروجيكت Y جروب Z ..." أو سجل بالميكروفون'
                }
                rows={2}
                className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
              />
              {isListening && (
                <div className="absolute right-3 top-3 flex gap-0.5">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-1 bg-red-500 rounded-full animate-bounce`} 
                      style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-primary/20"
            >
              <Send size={16} />
            </button>
          </div>

          {!isSupported && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
              ⚠️ Voice input not supported in this browser. Use Chrome or Edge.
            </p>
          )}
        </div>
      </div>

      {/* ── Task Panel ── */}
      {showTaskPanel && (
        <div className="w-1/2 border-l border-border flex flex-col bg-background overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/95">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" />
              <h2 className="font-bold text-sm">Tasks Preview</h2>
              <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">{parsedTasks.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setParsedTasks([]); setShowTaskPanel(false); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowTaskPanel(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Task cards */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {parsedTasks.map((task, i) => (
              <TaskCard
                key={task._id}
                task={task}
                index={i}
                usersList={allUsers.length ? allUsers : usersList}
                onUpdate={handleUpdateTask}
                onRemove={handleRemoveTask}
              />
            ))}
          </div>

          {/* Submit button */}
          <div className="p-4 border-t border-border bg-background/95">
            <div className="mb-2 text-xs text-muted-foreground text-center">
              {parsedTasks.filter(t => t.name && t.project_id && t.group_id && t.users_ids?.length).length} / {parsedTasks.length} tasks ready
            </div>
            <button
              onClick={handleSubmitTasks}
              disabled={isSending || parsedTasks.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg hover:shadow-primary/20"
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating tasks...
                </>
              ) : (
                <>
                  <Send size={16} />
                  إرسال {parsedTasks.length} تاسك 🚀
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceTaskChat;
