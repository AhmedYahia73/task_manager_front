import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { useRoleNames } from '@/context/RoleNameContext';
import { isAdminRole } from '@/utils/auth';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { isTaskDelayedCompleted } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  Mic,
  Square,
  Trash2,
  Download,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Layers,
  Send,
  Volume2,
  RotateCcw,
  Edit3,
  Loader2,
  UploadCloud,
  User,
  Sparkles,
  MessageSquare,
  Lock,
  AlarmClock
} from 'lucide-react';

dayjs.extend(relativeTime);

// 🎵 Professional Audio Player Component
const VoiceAudioPlayer = ({ voice, currentUserId, userRole, isTaskLeader, onDelete }) => {
  if (!voice || !voice.id) return null;

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voice.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
        toast.error('Unable to play audio recording');
      });
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const togglePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isAdmin = isAdminRole(userRole);
  const canDelete = isAdmin || isTaskLeader || voice.user_id === currentUserId;
  const isLeaderVoice = voice.is_leader || voice.role_at_time === 'leader' || voice.role_at_time === 'tester' || voice.user_role === 'tester';
  const isAdminVoice = voice.user_role === 'admin' || voice.user_role === 'super_admin';

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
      <audio ref={audioRef} src={voice.voice_url} preload="metadata" />

      {/* Top Header: Author Info & Role */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {voice.user_image ? (
            <img 
              src={voice.user_image} 
              alt={voice.user_name || 'User'} 
              className="h-9 w-9 rounded-full object-cover border border-border" 
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
              {voice.user_name ? voice.user_name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {voice.user_name || 'Team Member'}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isLeaderVoice 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : isAdminVoice
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {isLeaderVoice ? 'Team Leader' : isAdminVoice ? 'Admin' : 'Member'}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {voice.createdAt ? dayjs(voice.createdAt).format('MMM D, YYYY • h:mm A') : ''}
            </span>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={() => onDelete(voice.id)}
            className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer border-none"
            title="Delete Voice Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Audio Wave / Player Bar */}
      <div className="flex items-center gap-3 bg-muted/60 rounded-xl p-2.5 border border-border/60">
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-all cursor-pointer border-none"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Progress Slider */}
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed toggle */}
        <button
          onClick={togglePlaybackRate}
          className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
          title="Playback Speed"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};

// 🎙️ Voice Recorder Component (For Admin and Team Leader)
const VoiceRecorder = ({ taskId, onVoiceAdded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Voice recording is not supported in this browser environment');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      toast.error('Microphone access denied or not available');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const discardRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const uploadRecording = async (blobToUpload, customDuration) => {
    if (!blobToUpload) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      const ext = blobToUpload.type?.includes('mp4') ? 'm4a' : 'webm';
      formData.append('voice', blobToUpload, `voice_note_${Date.now()}.${ext}`);
      formData.append('duration', String(customDuration || recordingTime || 0));

      const res = await apiClient.post(`/api/admin/tasks/${taskId}/voices`, formData);

      if (res?.data?.success) {
        toast.success('Voice note added successfully');
        if (onVoiceAdded) onVoiceAdded(res.data.voice);
        discardRecording();
      } else {
        toast.error(res?.data?.message || 'Failed to upload voice note');
      }
    } catch (err) {
      console.error('Error uploading voice:', err);
      toast.error(err.response?.data?.message || 'Failed to upload voice note');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read audio duration
    const audioObj = new Audio();
    const tempUrl = URL.createObjectURL(file);
    audioObj.src = tempUrl;
    audioObj.onloadedmetadata = () => {
      const dur = Math.round(audioObj.duration) || 0;
      URL.revokeObjectURL(tempUrl);
      uploadRecording(file, dur);
    };
    audioObj.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      uploadRecording(file, 0);
    };

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
        className="hidden"
      />

      {!isRecording && !audioUrl && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Add Voice Note</p>
              <p className="text-xs text-muted-foreground">Record live audio or upload an audio clip</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 bg-card hover:bg-accent text-xs h-9 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Audio</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={startRecording}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Voice</span>
            </Button>
          </div>
        </div>
      )}

      {/* Active Recording State */}
      {isRecording && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-mono text-base font-bold text-foreground">
              {formatTimer(recordingTime)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {isPaused ? '(Paused)' : 'Recording voice note...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isPaused ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resumeRecording}
                className="gap-1 text-xs h-8 bg-card"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pauseRecording}
                className="gap-1 text-xs h-8 bg-card"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </Button>
            )}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={discardRecording}
              className="gap-1 text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5" /> Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={stopRecording}
              className="gap-1 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop & Review
            </Button>
          </div>
        </div>
      )}

      {/* Review / Preview Audio before sending */}
      {!isRecording && audioUrl && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Recording Preview ({formatTimer(recordingTime)})
            </span>
            <button
              onClick={discardRecording}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer border-none bg-transparent"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Discard & Retake
            </button>
          </div>

          <audio src={audioUrl} controls className="w-full h-10 rounded-lg" />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={discardRecording}
              disabled={isUploading}
              className="text-xs h-9 bg-card"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => uploadRecording(audioBlob, recordingTime)}
              disabled={isUploading}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Save Voice Note</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// 🌟 Main Single Task Page Component
export default function TaskDetails() {
  const { projectId, groupId, taskId: paramTaskId } = useParams();
  const effectiveTaskId = paramTaskId || useParams().id;
  const navigate = useNavigate();
  const { getRoleName } = useRoleNames();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role?.toLowerCase?.() || 'engineer';
  const isAdmin = isAdminRole(userRole);

  // Fetch Task Details
  const { data: taskData, loading, refresh } = useGet(`/api/admin/tasks/${effectiveTaskId}`);
  const task = taskData?.task || taskData?.data?.task;

  const taskUserRole = task?.user_role || (isAdmin ? 'admin' : 'engineer');
  const isLeaderOrAdmin = taskUserRole === 'leader' || isAdmin;

  const { mutate, loading: mutating } = useMutation();

  // State for editing Tester Note
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Voices list state for optimistic instant update
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (task) {
      setNoteContent(task.tester_note || '');
      const validVoices = Array.isArray(task.voices)
        ? task.voices.filter((v) => v && typeof v === 'object' && v.id)
        : [];
      setVoices(validVoices);
    }
  }, [task]);

  // Handle Status Change
  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    const res = await mutate({
      method: 'PUT',
      url: `/api/admin/tasks/${task.id}`,
      data: { status: newStatus }
    });
    if (res?.success) {
      refresh();
    }
  };

  // Handle Delete Documentation
  const handleDeleteDoc = async () => {
    if (!task?.documentation) return;
    if (!window.confirm('Are you sure you want to permanently delete this documentation file from the server and database?')) return;

    const res = await mutate({
      method: 'DELETE',
      url: `/api/admin/tasks/${task.id}/documentation`
    });

    if (res?.success) {
      toast.success('Documentation deleted successfully from server and database');
      refresh();
    }
  };

  // Handle Delete Voice Note
  const handleDeleteVoice = async (voiceId) => {
    if (!window.confirm('Are you sure you want to delete this voice note?')) return;

    const res = await mutate({
      method: 'DELETE',
      url: `/api/admin/tasks/${task.id}/voices/${voiceId}`
    });

    if (res?.success) {
      setVoices((prev) => prev.filter((v) => v.id !== voiceId));
      toast.success('Voice note deleted successfully');
    }
  };

  // Handle Save Tester Note
  const handleSaveNote = async () => {
    const res = await mutate({
      method: 'PUT',
      url: `/api/admin/tasks/${task.id}`,
      data: { tester_note: noteContent }
    });

    if (res?.success) {
      setIsEditingNote(false);
      refresh();
    }
  };

  // Handle View Documentation
  const handleViewDoc = (docString) => {
    if (!docString) return;
    try {
      if (docString.startsWith('data:')) {
        const arr = docString.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(docString, '_blank');
      }
    } catch (e) {
      console.error('Error opening documentation:', e);
      window.open(docString, '_blank');
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'done':
        return { color: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', label: 'Done' };
      case 'inprogress':
        return { color: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20', label: 'In Progress' };
      case 'pending':
        return { color: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', label: 'Pending' };
      case 'edit':
        return { color: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20', label: 'Needs Revision' };
      case 'approve':
        return { color: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20', label: 'Approved' };
      default:
        return { color: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground', label: status };
    }
  };

  const getImportanceStyles = (importance) => {
    switch (importance) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDeliveryDateStatus = (dateStr, status, taskObj) => {
    if (!dateStr) return { text: 'No deadline set', color: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' };
    const dateOnly = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
    const delivery = dayjs(dateOnly).endOf('day');
    const now = dayjs();
    const isCompleted = status === 'done' || status === 'approve';

    if (isCompleted) {
      const isDelayed = isTaskDelayedCompleted(taskObj || { delivery_date: dateStr, status });
      if (isDelayed) {
        return {
          text: `Delivered • ${dayjs(dateOnly).format('MMM DD, YYYY')}`,
          badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
          diffText: 'Completed (Delayed)',
          isDelayed: true
        };
      }
      return {
        text: `Delivered • ${dayjs(dateOnly).format('MMM DD, YYYY')}`,
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        diffText: 'Completed',
        isDelayed: false
      };
    }

    const diffDays = delivery.diff(now, 'day');
    if (diffDays < 0) {
      return {
        text: dayjs(dateOnly).format('MMM DD, YYYY'),
        badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse',
        diffText: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
      };
    } else if (diffDays === 0) {
      return {
        text: dayjs(dateOnly).format('MMM DD, YYYY'),
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        diffText: 'Due Today'
      };
    } else {
      return {
        text: dayjs(dateOnly).format('MMM DD, YYYY'),
        badge: 'bg-primary/10 text-primary border border-primary/20',
        diffText: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`
      };
    }
  };

  if (loading && !task) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold text-foreground">Task not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This task may have been removed or does not exist.</p>
        <Button onClick={() => navigate(-1)} className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
      </div>
    );
  }

  const statusStyle = getStatusStyles(task.status);
  const deliveryInfo = getDeliveryDateStatus(task.delivery_date, task.status, task);
  const assignedUsers = (Array.isArray(task.assigned_users) ? task.assigned_users : [])
    .filter((u) => u && typeof u === 'object' && u.id);
  const isAssigned = assignedUsers.some((u) => u.id === user?.id) || task?.user_id === user?.id;
  const canAddVoice = isLeaderOrAdmin || isAssigned;
  const displayVoices = (Array.isArray(voices) ? voices : [])
    .filter((v) => v && typeof v === 'object' && v.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* 🧭 Back / Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent p-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tasks</span>
        </button>

        <div className="flex items-center gap-2">
          {task.project_id && task.group_id && (
            <Link
              to={`/admin/projects/${task.project_id}/groups/${task.group_id}/tasks`}
              className="text-xs font-semibold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
            >
              View Group Board
            </Link>
          )}
        </div>
      </div>

      {/* 🌟 Top Prominent Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        {/* Left Color Accent Strip */}
        <div className={`absolute left-0 top-0 h-full w-2 ${statusStyle.color}`} />

        {/* 1️⃣ Prominent Delivery Date & Importance (معاد التسليم فوق فى مكان واضح) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery Deadline
              </span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                {deliveryInfo.text}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${deliveryInfo.badge}`}>
              <Clock className="w-3.5 h-3.5" />
              {deliveryInfo.diffText}
            </span>

            {task.date_urgent && (
              <span 
                title={`Urgent from: ${dayjs(task.date_urgent).format('MMM DD, YYYY')}`}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              >
                <AlarmClock className="w-3.5 h-3.5 text-rose-600" />
                Urgent Trigger: {dayjs(task.date_urgent).format('MMM DD, YYYY')}
              </span>
            )}

            <span className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold border capitalize ${getImportanceStyles(task.importanc_status)}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {task.importanc_status || 'medium'} Priority
            </span>
          </div>
        </div>

        {/* ⚠️ Delay Alert if completed late */}
        {deliveryInfo.isDelayed && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-red-500/10 dark:bg-red-950/40 p-3.5 border border-red-500/30 text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span className="text-xs font-bold">
                Delayed Completion: This task was completed after its delivery deadline.
              </span>
            </div>
            {task.done_date && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                Delivered on {dayjs(task.done_date).format('MMM DD, YYYY')}
              </span>
            )}
          </div>
        )}

        {/* 2️⃣ Hierarchy: Project Name -> Group Name -> Task Name */}
        <div className="space-y-3">
          {/* ابدا باسم project */}
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-muted-foreground">
            <FolderKanban className="w-4 h-4 text-primary" />
            <span>{task.project_name || 'Project'}</span>
          </div>

          {/* ثم الجروب بخط اصغر بلون مختلف */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 text-xs font-bold">
            <Layers className="w-3 h-3" />
            <span>{task.group_name || 'Group'}</span>
          </div>

          {/* ثم اسم task */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {task.name}
            </h1>
            <ProjectRoleBadge role={taskUserRole} />
          </div>
        </div>

        {/* 3️⃣ Status Changer & Assigned Members Row */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          {/* Status selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status:
            </span>
            {task.status === 'approve' && !isLeaderOrAdmin ? (
              <div 
                title="Approved task: Locked (Only Leader or Admin can request revision)"
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 cursor-not-allowed select-none"
              >
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Approved (Locked)</span>
              </div>
            ) : (
              <select
                value={task.status || 'pending'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`inline-flex appearance-none items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer ${statusStyle.badge}`}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="pending" className="bg-card text-foreground">Pending</option>
                <option value="inprogress" className="bg-card text-foreground">In Progress</option>
                <option value="done" className="bg-card text-foreground">Completed</option>
                <option 
                  value="edit" 
                  disabled={!isLeaderOrAdmin}
                  className="bg-card text-foreground"
                >
                  {isLeaderOrAdmin ? 'Need to Revision' : 'Need to Revision (Leader 🔒)'}
                </option>
                <option 
                  value="approve" 
                  disabled={!isLeaderOrAdmin}
                  className="bg-card text-foreground"
                >
                  {isLeaderOrAdmin ? 'Approved' : 'Approved (Leader 🔒)'}
                </option>
              </select>
            )}
          </div>

          {/* Assigned Members (الافراد اللى فيه) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Assigned:
            </span>
            {assignedUsers.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            ) : (
              <div className="flex items-center -space-x-2 overflow-hidden">
                {assignedUsers.map((u) => (
                  <div key={u.id} className="group/u relative" title={`${u.name || ''} (${getRoleName(u.role || 'engineer')})`}>
                    {u.image ? (
                      <img
                        src={u.image}
                        alt={u.name || 'User'}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-card object-cover"
                      />
                    ) : (
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs ring-2 ring-card">
                        {u.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                ))}
                {assignedUsers.length > 0 && (
                  <span className="pl-3 text-xs font-medium text-foreground">
                    {assignedUsers.map((u) => u.name).filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4️⃣ Task Description (و بعدها description) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Task Description</h2>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {task.description ? (
            task.description
          ) : (
            <p className="text-muted-foreground italic">No description provided for this task.</p>
          )}
        </div>
      </div>

      {/* 5️⃣ Documentation (ثم documentation) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Documentation</h2>
          </div>

          {task.documentation && isLeaderOrAdmin && (
            <button
              onClick={handleDeleteDoc}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg border border-destructive/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Delete documentation from server and database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Documentation</span>
            </button>
          )}
        </div>

        {task.documentation ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-muted/60 border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  Task Documentation File
                </span>
                <span className="text-xs text-muted-foreground">
                  Available for viewing and downloading
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleViewDoc(task.documentation)}
                className="gap-1.5 bg-card hover:bg-accent text-xs h-9 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open File</span>
              </Button>

              <a
                href={task.documentation}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-xs font-semibold shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">No documentation attached to this task</p>
          </div>
        )}
      </div>

      {/* 6️⃣ Voices Section (ثم voices بشكل احترافى) */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Voice Instructions & Notes</h2>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
              {displayVoices.length}
            </span>
          </div>
        </div>

        {/* Voice Recorder (for Admin, Team Leader and Assigned Members) */}
        {canAddVoice && (
          <div className="mb-6">
            <VoiceRecorder
              taskId={task.id}
              onVoiceAdded={(newVoice) => {
                if (newVoice && newVoice.id) {
                  setVoices((prev) => [newVoice, ...(Array.isArray(prev) ? prev : []).filter((v) => v && v.id !== newVoice.id)]);
                }
              }}
            />
          </div>
        )}

        {/* Voices List */}
        {displayVoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
            <Volume2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">No voice notes recorded yet</p>
            {canAddVoice && (
              <p className="text-xs text-muted-foreground mt-1">
                You can record a live voice note above to guide the team.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayVoices.map((voice) => (
              <VoiceAudioPlayer
                key={voice.id}
                voice={voice}
                currentUserId={user?.id}
                userRole={userRole}
                isTaskLeader={isLeaderOrAdmin}
                onDelete={handleDeleteVoice}
              />
            ))}
          </div>
        )}
      </div>

      {/* 7️⃣ Team Leader Notes (ثم فى الاخر team leader notes) */}
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-500/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-foreground">
              {getRoleName('tester')} Notes
            </h2>
          </div>

          {isLeaderOrAdmin && !isEditingNote && (
            <button
              onClick={() => setIsEditingNote(true)}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{task.tester_note ? 'Edit Note' : 'Add Note'}</span>
            </button>
          )}
        </div>

        {isEditingNote ? (
          <div className="space-y-3">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write feedback or guidance for the team..."
              className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNoteContent(task.tester_note || '');
                  setIsEditingNote(false);
                }}
                className="text-xs h-9 bg-card"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={mutating}
                className="text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Notes
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
            {task.tester_note ? (
              <div className="p-4 rounded-2xl bg-card border border-amber-500/20">
                {task.tester_note}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No {getRoleName('tester').toLowerCase()} notes provided yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
