import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Send, Sprout, Volume2, VolumeX, Loader2, X, Camera, Play, Pause } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFarm } from "@/lib/farmContext";
import { t } from "@/lib/translations";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

const SUGGESTED = [
  "What disease is affecting my rice?",
  "When should I harvest?",
  "What is today's rice price?",
  "How to control stem borer?",
];

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function fmtDuration(s) {
  if (!isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// Waveform bar heights patterned like authentic voice messages
const WAVEFORM_BARS = [
  5, 9, 14, 11, 7, 16, 22, 17, 10, 19, 26, 21, 13, 23, 27, 19,
  12, 18, 24, 18, 11, 16, 22, 15, 9, 17, 23, 16, 10, 6
];

function VoiceMessageBubble({ audioUrl, content, initialDuration = 0, initialWaveform = null }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState(
    Array.isArray(initialWaveform) && initialWaveform.length > 0 ? initialWaveform : []
  );

  useEffect(() => {
    if (initialDuration && initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  // If initialWaveform changes, update immediately
  useEffect(() => {
    if (Array.isArray(initialWaveform) && initialWaveform.length > 0) {
      setWaveformBars(initialWaveform);
    }
  }, [initialWaveform]);

  // Decode real voice frequency/amplitude peaks from the audioUrl if not provided
  useEffect(() => {
    if (Array.isArray(initialWaveform) && initialWaveform.length > 0) return;
    if (!audioUrl) return;

    let active = true;
    const extractVoicePeaks = async () => {
      try {
        const res = await fetch(audioUrl);
        const arrayBuf = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(arrayBuf);
        const channel = decoded.getChannelData(0);
        const numBars = 30;
        const blockSize = Math.floor(channel.length / numBars);
        const peaks = [];

        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channel.length);
          for (let j = start; j < end; j++) {
            sum += Math.abs(channel[j]);
          }
          peaks.push(sum / Math.max(1, end - start));
        }
        ctx.close();

        const max = Math.max(...peaks, 0.005);
        const normalized = peaks.map((p) => {
          const ratio = Math.min(1, Math.max(0, p / max));
          // Non-linear sqrt scaling creates clear visible bars even for quiet speaking
          return Math.round(5 + Math.sqrt(ratio) * 21);
        });

        if (active && normalized.length === numBars) {
          setWaveformBars(normalized);
        }
      } catch (e) {
        console.warn("Waveform audio analysis note:", e);
      }
    };

    extractVoicePeaks();

    return () => {
      active = false;
    };
  }, [audioUrl, initialWaveform]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.muted = false;
      if (audioUrl) {
        audioRef.current.load();
      }
    }
  }, [audioUrl]);

  const playWithSpeech = () => {
    const textToSpeak = content && content !== "Voice Consultation" && content !== "ശബ്ദ സന്ദേശം"
      ? content
      : "";
    if (!textToSpeak || typeof window === "undefined" || !window.speechSynthesis) {
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.rate = 0.95;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    utter.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utter);
  };

  const toggle = (e) => {
    e.stopPropagation();
    if (playing) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (_) {}
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlaying(false);
      return;
    }

    if (audioRef.current && audioUrl) {
      if (audioRef.current.ended || audioRef.current.currentTime >= (duration || 1)) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.volume = 1.0;
      audioRef.current.muted = false;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio play rejected, falling back to speech synthesis:", err);
            playWithSpeech();
          });
      }
    } else {
      playWithSpeech();
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const effectiveDur = duration > 0 ? duration : (audioRef.current?.duration || 0);
    if (!audioRef.current || !effectiveDur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * effectiveDur;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const effectiveDuration = duration > 0 ? duration : (audioRef.current?.duration || 0);
  const progress = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;
  const barsToRender = waveformBars && waveformBars.length > 0 ? waveformBars : WAVEFORM_BARS;

  return (
    <div className="flex items-center gap-3 w-[230px] sm:w-[270px] select-none">
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && isFinite(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
        onError={() => {
          console.warn("Audio playback error encountered on voice note");
        }}
        preload="auto"
      />

      {/* Play / Pause button matching reference */}
      <button
        type="button"
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
        title={playing ? "Pause" : "Play voice note"}
      >
        {playing ? (
          <Pause className="w-4 h-4 text-white fill-white" />
        ) : (
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        )}
      </button>

      {/* Waveform container + Timestamps underneath */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        {/* Interactive Waveform with real voice vertical lines */}
        <div
          onClick={handleSeek}
          className="flex items-center gap-[2.5px] h-7 cursor-pointer group py-1"
          title="Click to seek"
        >
          {barsToRender.map((h, i) => {
            const barPct = i / barsToRender.length;
            const isPlayed = barPct <= progress;
            return (
              <div
                key={i}
                className={`w-[2.5px] sm:w-[3px] rounded-full transition-colors ${
                  isPlayed ? "bg-white" : "bg-[#003422]"
                }`}
                style={{ height: `${Math.max(4, h)}px` }}
              />
            );
          })}
        </div>

        {/* Timestamps: Elapsed on left, Total on right */}
        <div className="flex items-center justify-between text-[10px] text-[#E8F8F1] font-mono tracking-tight leading-none px-0.5">
          <span>{fmtDuration(currentTime)}</span>
          <span>{fmtDuration(effectiveDuration || initialDuration || 0)}</span>
        </div>
      </div>
    </div>
  );
}



export default function ChatPanel({ user, initialPrompt }) {
  const { farm, language } = useFarm();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [listening, setListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingStartTimeRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const speechBufferRef = useRef("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const isFinishingRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const liveVoiceSamplesRef = useRef([]);
  const sampleTimerRef = useRef(null);

  const crop = farm?.primary_crop || "Rice";
  const farmerContext = {
    crop,
    location: farm ? `${farm.location || "Varikoli"}, ${farm.state || "Kerala"}` : "Varikoli, Kerala",
    farmSize: farm?.farm_size || 1,
    farmSizeUnit: farm?.farm_size_unit || "Acre",
  };

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendRef = useRef(null);
  const speakRef = useRef(null);

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    const conv = await base44.entities.Conversation.create({
      title: "New Conversation",
      language,
    });
    setConversationId(conv.id);
    return conv.id;
  }, [conversationId, language]);

  const send = async (text, isVoice = false, audioUrl = null, audioDuration = null, waveform = null) => {
    const content = (text !== undefined ? text : input).trim();
    const currentImg = attachedImage;
    if ((!content && !currentImg && !audioUrl) || loading) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingStartTimeRef.current = null;
    setRecordingSeconds(0);

    // Abort recognition silently (not stop) so onend won't re-trigger send
    speechBufferRef.current = "";
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    // Clean up any lingering mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setListening(false);
    stopSpeaking();

    const defaultPrompt = language === "Malayalam"
      ? "ഈ വിളയുടെ ഫോട്ടോ പരിശോധിച്ച് രോഗലക്ഷണങ്ങളും പരിഹാരങ്ങളും പറയുക."
      : language === "Hindi"
      ? "कृपया इस फसल की फोटो देखकर रोग और उपचार बताएं।"
      : language === "Tamil"
      ? "இந்த பயிர் புகைப்படத்தை ஆய்வு செய்து நோய் மற்றும் தீர்வு சொல்லவும்."
      : "Please inspect this attached crop photo and recommend diagnosis and care.";

    const displayContent = content || defaultPrompt;

    setInput("");
    setAttachedImage(null);

    const userMsg = {
      role: "user",
      content: displayContent,
      image_url: currentImg || undefined,
      audioUrl: audioUrl || undefined,           // blob URL for voice bubble playback
      audioDuration: audioDuration || undefined, // seconds duration of voice note
      waveform: waveform || undefined,           // real voice vertical lines
      isVoice: isVoice && !!audioUrl,            // true = render as voice bubble
      created_date: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const convId = await ensureConversation();
      await base44.entities.Message.create({
        conversation_id: convId,
        role: "user",
        content: displayContent,
        image_url: currentImg || null,
        language,
      });

      const history = (messagesRef.current || messages).map((m) => ({ role: m.role, content: m.content }));

      const res = await base44.functions.invoke("askKisanMitra", {
        question: displayContent,
        image_url: currentImg || undefined,
        language,
        farmerContext,
        history,
      });

      const answer = res.data?.answer || "I'm sorry, I couldn't generate a response right now. Please try again.";
      const aiMsg = { role: "assistant", content: answer, created_date: new Date().toISOString() };
      // Compute index BEFORE setMessages (messagesRef includes user msg after the awaited ops above)
      const aiIdx = messagesRef.current.length;
      setMessages((m) => [...m, aiMsg]);

      // Auto-speak the reply when triggered by voice input — outside the updater to avoid stale closures
      if (isVoice) {
        setTimeout(() => speakRef.current?.(answer, aiIdx), 350);
      }

      await base44.entities.Message.create({
        conversation_id: convId,
        role: "assistant",
        content: answer,
        language,
      });

      const title = displayContent.slice(0, 40);
      await base44.entities.Conversation.update(convId, { title });
    } catch (e) {
      console.error("Chat send error:", e);
      const fallback =
        "I'm having trouble connecting to the AI service. Please check your crop for any visual symptoms or try again shortly.";
      const fbIdx = messagesRef.current.length;
      setMessages((m) => [...m, { role: "assistant", content: fallback, created_date: new Date().toISOString() }]);
      if (isVoice) {
        setTimeout(() => speakRef.current?.(fallback, fbIdx), 350);
      }
      toast({ title: "AI unavailable", description: "Showing a fallback response.", variant: "destructive" });
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  sendRef.current = send;

  useEffect(() => {
    if (initialPrompt) {
      send(initialPrompt);
      navigate("/dashboard", { replace: true });
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload JPG, PNG, or WEBP images.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 10MB.", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Uploading photo...", description: "Attaching image to chat." });
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res && res.file_url) {
        setAttachedImage(res.file_url);
        toast({ title: "Photo attached", description: "Leaf photo ready. Type a question or click Send." });
      }
    } catch (err) {
      toast({ title: "Upload failed", description: err.message || "Could not upload image.", variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };

  // abortListening: silently cancels recording and recognition without sending
  const abortListening = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingStartTimeRef.current = null;
    setRecordingSeconds(0);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (sampleTimerRef.current) {
      clearInterval(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    liveVoiceSamplesRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch (_) {}
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    speechBufferRef.current = "";
    setListening(false);
  }, []);

  // finishVoiceRecording: finalize recorded audio + transcribed text and send into chat
  const finishVoiceRecording = async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (sampleTimerRef.current) {
      clearInterval(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }

    const duration = recordingStartTimeRef.current
      ? Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000))
      : 1;
    recordingStartTimeRef.current = null;
    setRecordingSeconds(0);
    setListening(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    let audioUrl = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      audioUrl = await new Promise((resolve) => {
        const mr = mediaRecorderRef.current;
        const finalize = () => {
          try {
            const mime = mr.mimeType || "audio/webm";
            const blob = new Blob(audioChunksRef.current, { type: mime });
            if (blob.size > 0) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(null);
            }
          } catch (_) {
            resolve(null);
          }
        };

        mr.addEventListener("dataavailable", (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        });
        mr.addEventListener("stop", finalize, { once: true });

        try {
          if (mr.state === "recording") {
            try { mr.requestData(); } catch (_) {}
            mr.stop();
          } else {
            finalize();
          }
        } catch (_) {
          finalize();
        }
      });
    } else if (audioChunksRef.current.length > 0) {
      try {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) audioUrl = URL.createObjectURL(blob);
      } catch (_) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    // Calculate vertical lines matching the user's real voice volume patterns
    let computedWaveform = null;
    const samples = liveVoiceSamplesRef.current;
    if (samples && samples.length >= 6) {
      const numBars = 30;
      const blockSize = Math.floor(samples.length / numBars);
      const peaks = [];
      for (let i = 0; i < numBars; i++) {
        let blockSum = 0;
        const start = i * blockSize;
        const end = Math.min(start + blockSize, samples.length);
        for (let j = start; j < end; j++) {
          blockSum += samples[j];
        }
        peaks.push(blockSum / Math.max(1, end - start));
      }
      const maxVal = Math.max(...peaks, 8);
      computedWaveform = peaks.map((val) => {
        const ratio = Math.min(1, Math.max(0, val / maxVal));
        return Math.round(5 + Math.sqrt(ratio) * 21); // vertical heights between 5px and 26px
      });
    }
    liveVoiceSamplesRef.current = [];

    const capturedSpeech = speechBufferRef.current.trim();
    speechBufferRef.current = "";
    isFinishingRef.current = false;

    if (capturedSpeech || audioUrl) {
      const textToSend = capturedSpeech || (language === "Malayalam" ? "ശബ്ദ സന്ദേശം" : "Voice Consultation");
      if (sendRef.current) {
        sendRef.current(textToSend, true, audioUrl, duration, computedWaveform);
      } else {
        send(textToSend, true, audioUrl, duration, computedWaveform);
      }
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const startListening = async () => {
    stopSpeaking();
    isFinishingRef.current = false;

    // 1. Request microphone access without acoustic ducking for clear sound
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access in your browser to speak your question.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Microphone error",
          description: err.message || "Could not access microphone.",
          variant: "destructive",
        });
      }
      return;
    }

    // 2. Measure real-time voice amplitude using Web Audio API to match vertical lines
    liveVoiceSamplesRef.current = [];
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const actx = new AudioCtx();
        audioContextRef.current = actx;
        const source = actx.createMediaStreamSource(stream);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArr = new Uint8Array(analyser.frequencyBinCount);
        if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
        sampleTimerRef.current = setInterval(() => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) {
              sum += dataArr[i];
            }
            const avg = sum / dataArr.length;
            liveVoiceSamplesRef.current.push(avg);
          }
        }, 50);
      }
    } catch (e) {
      console.warn("Analyser setup error:", e);
    }

    // 3. Start MediaRecorder to capture audio for the chat voice bubble
    audioChunksRef.current = [];
    try {
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mimeType = "audio/webm;codecs=opus";
        else if (MediaRecorder.isTypeSupported("audio/webm")) mimeType = "audio/webm";
        else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/ogg")) mimeType = "audio/ogg";
      }
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      // Continuous recording without timeslice so the browser generates a valid container with EBML headers
      rec.start();
      mediaRecorderRef.current = rec;
    } catch (err) {
      console.warn("MediaRecorder start failed:", err);
    }

    recordingStartTimeRef.current = Date.now();
    setRecordingSeconds(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      if (recordingStartTimeRef.current) {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
      }
    }, 500);

    setListening(true);
    speechBufferRef.current = "";

    // 3. Start SpeechRecognition if available (Chrome/Edge) to transcribe speech in real-time
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition;

    if (SpeechRecognition) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        recognitionRef.current = null;
      }
      try {
        const rec = new SpeechRecognition();
        const langCode =
          language === "Malayalam"
            ? "ml-IN"
            : language === "Hindi"
            ? "hi-IN"
            : language === "Tamil"
            ? "ta-IN"
            : "en-IN";

        rec.lang = langCode;
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          const cleaned = transcript.trim();
          if (cleaned) {
            speechBufferRef.current = cleaned;
            setInput(cleaned);
          }
        };

        rec.onerror = (event) => {
          console.warn("[SpeechRecognition error]", event.error);
          // Don't stop recording on speech recognition error — audio is still being recorded
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            toast({
              title: "Microphone permission issue",
              description: "Please allow microphone access in your browser settings.",
              variant: "destructive",
            });
          }
        };

        rec.onend = () => {
          // When speech recognition ends (user finished speaking), automatically finalize & send
          finishVoiceRecording();
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("[SpeechRecognition start error]", err);
      }
    }
  };

  const toggleListening = () => {
    if (listening) {
      finishVoiceRecording();
    } else {
      startListening();
    }
  };

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIdx(null);
  }, []);

  const speak = (text, idx) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast({ title: "Speech unavailable", description: "Your browser does not support text-to-speech." });
      return;
    }

    if (speakingIdx === idx) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    // Clean markdown formatting for natural voice synthesis
    const cleanText = text
      .replace(/[*#_`~>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanText) return;

    const utter = new SpeechSynthesisUtterance(cleanText);
    const langCode =
      language === "Malayalam"
        ? "ml-IN"
        : language === "Hindi"
        ? "hi-IN"
        : language === "Tamil"
        ? "ta-IN"
        : "en-IN";
    utter.lang = langCode;

    // Curated matching for natural female voices across browsers/OS (Windows, Edge, Chrome, Mac, Android)
    const voices = window.speechSynthesis.getVoices() || [];
    const prefix = langCode.split("-")[0].toLowerCase();

    const isMale = (name) =>
      /\b(david|mark|ravi|hemant|valluvar|prabhat|george|guy|eric|stefan|male)\b/i.test(name) &&
      !/female/i.test(name);

    const isFemale = (name) =>
      /female|zira|neerja|heera|swara|kalpana|pallavi|sunita|jenny|aria|sonia|veena|samantha|karen|victoria|moira|libby|google us english|google uk english female|google हिन्दी/i.test(
        name
      );

    // 1. Language match + explicitly female
    let selectedVoice = voices.find(
      (v) =>
        (v.lang === langCode || v.lang.replace("_", "-") === langCode) &&
        isFemale(v.name) &&
        !isMale(v.name)
    );

    // 2. Language prefix match + female
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith(prefix) && isFemale(v.name) && !isMale(v.name)
      );
    }

    // 3. Indian English female voice (e.g. Neerja, Heera, Veena)
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) =>
          (v.lang === "en-IN" || v.lang === "en_IN") &&
          isFemale(v.name) &&
          !isMale(v.name)
      );
    }

    // 4. Any top-tier natural female voice (e.g. Jenny, Aria, Zira, Google UK/US Female, Samantha)
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => isFemale(v.name) && !isMale(v.name));
    }

    // 5. If still not found, any voice matching language that is NOT male
    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) =>
          (v.lang === langCode || v.lang.toLowerCase().startsWith(prefix)) &&
          !isMale(v.name)
      );
    }

    if (selectedVoice) {
      utter.voice = selectedVoice;
    }

    utter.rate = 0.93; // Gentle, clear speaking pace
    utter.pitch = 1.12; // Warm, natural female pitch

    utter.onend = () => {
      setSpeakingIdx(null);
    };

    utter.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("Speech synthesis error:", e);
      }
      setSpeakingIdx(null);
    };

    utteranceRef.current = utter;
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  };

  speakRef.current = speak;

  return (
    <div className="bg-white rounded-2xl border border-[#E1E8E4] shadow-sm overflow-hidden flex flex-col">
      {/* Top Header if messages exist */}
      {messages.length > 0 && (
        <div className="px-6 py-3.5 border-b border-[#E1E8E4] bg-[#E8F8F1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#005A3C] flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#17201C]">{t(language, "askKisanMitra")}</h2>
              <p className="text-[11px] text-[#66736D]">Active conversation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setMessages([]);
              setConversationId(null);
            }}
            className="text-xs text-[#005A3C] hover:underline font-medium cursor-pointer"
          >
            {t(language, "newConversation")}
          </button>
        </div>
      )}

      {/* Messages area */}
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="km-chat-scroll flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[380px] bg-[#F7F9F7]"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {m.image_url && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden ring-1 ring-border mb-1">
                    <Image src={m.image_url} alt={m.content || "Uploaded crop condition photo"} className="w-full h-full object-cover" fittingType="fill" />
                  </div>
                )}
                {m.audioUrl ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="rounded-2xl rounded-br-md p-2.5 sm:p-3 bg-[#005A3C] text-white shadow-sm border border-[#004A31]">
                      <VoiceMessageBubble
                        audioUrl={m.audioUrl}
                        content={m.content}
                        initialDuration={m.audioDuration}
                        initialWaveform={m.waveform}
                      />
                    </div>
                    {m.content && m.content !== "Voice Consultation" && m.content !== "ശബ്ദ സന്ദേശം" && (
                      <span className="text-[11px] text-[#66736D] max-w-[280px] text-right italic px-1">
                        "{m.content}"
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#005A3C] text-white rounded-br-md"
                        : "bg-white text-[#17201C] border border-[#E1E8E4] rounded-bl-md shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                )}
                {/* Replay / Stop pill — below the bubble, clearly visible */}
                {m.role === "assistant" && (
                  <div className="flex items-center gap-1 mt-1">
                    {speakingIdx === i ? (
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer shadow-xs"
                        title="Stop reading aloud"
                      >
                        <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => speak(m.content, i)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E8F8F1] text-[#005A3C] hover:bg-[#d0f0e0] transition-colors cursor-pointer shadow-xs"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Play</span>
                      </button>
                    )}
                  </div>
                )}
                <span className="text-[10px] text-[#66736D] px-1">{formatTime(m.created_date)}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E1E8E4] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-3 shadow-sm">
                <span className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-[#005A3C] animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-[#005A3C] animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-[#005A3C] animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input section */}
      <div className="p-4 sm:p-5 bg-white">
        {attachedImage && (
          <div className="mb-3 inline-flex items-center gap-2 bg-[#E8F8F1] border border-[#E1E8E4] rounded-xl p-1.5 pr-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <Image src={attachedImage} alt="Attached crop leaf sample" className="w-full h-full object-cover" fittingType="fill" />
            </div>
            <span className="text-xs text-[#005A3C] font-medium">Photo attached</span>
            <button onClick={() => setAttachedImage(null)} className="text-[#66736D] hover:text-[#17201C] cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#005A3C] flex items-center justify-center shrink-0 shadow-sm">
            <Sprout className="w-6 h-6 text-white" />
          </div>

          {listening ? (
            <div className="flex-1 flex items-center justify-between gap-2.5 bg-[#E8F8F1] border border-[#005A3C]/30 rounded-xl px-3.5 py-2 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#005A3C] animate-ping" />
                <span className="text-xs sm:text-sm font-semibold text-[#005A3C]">
                  Recording Voice Note...
                </span>
                <span className="text-xs font-mono font-bold text-[#005A3C] bg-white border border-[#005A3C]/20 px-2 py-0.5 rounded-full">
                  {fmtDuration(recordingSeconds)}
                </span>
              </div>
              <span className="text-[11px] text-[#005A3C]/80 hidden md:inline">Click mic or Stop to send</span>
            </div>
          ) : (
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={t(language, "askKisanMitra")}
                className="w-full pl-0 pr-2 py-2 text-sm sm:text-base font-medium text-[#17201C] placeholder:text-[#8C9B93] placeholder:font-normal bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileRef}
              onChange={handleUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-[#E1E8E4] flex items-center justify-center text-[#66736D] hover:bg-[#E8F8F1] hover:text-[#005A3C] transition-colors cursor-pointer"
              title="Attach crop/leaf photo"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={toggleListening}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                listening
                  ? "bg-[#005A3C] border-[#003F2B] text-white animate-pulse shadow-md ring-2 ring-[#005A3C]/40"
                  : "border-[#E1E8E4] text-[#66736D] hover:bg-[#E8F8F1] hover:text-[#005A3C]"
              }`}
              title={listening ? "Click to stop and send voice message" : "Record voice question"}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => send(input)}
              disabled={loading || (!input.trim() && !attachedImage)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#005A3C] hover:bg-[#003F2B] text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-md"
              title="Send question"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Suggested Prompts Pills */}
        <div className="mt-4 pt-3 border-t border-[#E1E8E4]/60 flex flex-wrap items-center gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="text-xs px-3.5 py-1.5 rounded-full border border-[#E1E8E4] bg-white text-[#17201C] hover:border-[#005A3C] hover:text-[#005A3C] hover:bg-[#E8F8F1] transition-all font-medium cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}