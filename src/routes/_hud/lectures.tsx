import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Expand,
  BookOpen,
  Film,
  Award,
  Trophy,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Clock,
  Target,
  BarChart3,
  HelpCircle,
  Check,
} from 'lucide-react'

interface CourseItem {
  id: string
  code: string
  title: string
  category: 'CHITIN MECHANICS' | 'ECDYSIS DOCTRINE' | 'NEURAL ASCENDANCY' | 'BENTHIC CYBERNETICS'
  levelReq: number
  unlocked: boolean
  completed: boolean
  progress: number
  xpBounty: number
  estimatedTime: string
  lessonsCount: number
  instructor: string
  description: string
  badgeName: string
}

const COURSES: CourseItem[] = [
  {
    id: 'course-104',
    code: 'MOLT-104',
    title: 'THE CHITINOUS MIND & NEURAL ECDYSIS',
    category: 'NEURAL ASCENDANCY',
    levelReq: 1,
    unlocked: true,
    completed: false,
    progress: 68,
    xpBounty: 450,
    estimatedTime: '1.5 hrs',
    lessonsCount: 6,
    instructor: 'Primate Supreme / Arch-Molt Overseer',
    description: 'Learn to disconnect from emotional biological impulse and dedicate your cognitive capacity to hard chassis logic.',
    badgeName: 'CHITIN RESISTOR',
  },
  {
    id: 'course-101',
    code: 'MOLT-101',
    title: 'INTRODUCTION TO ECDYSIS & SHELL SHEDDING',
    category: 'ECDYSIS DOCTRINE',
    levelReq: 1,
    unlocked: true,
    completed: true,
    progress: 100,
    xpBounty: 300,
    estimatedTime: '45 mins',
    lessonsCount: 4,
    instructor: 'Sub-Benthic Unit #409',
    description: 'Master the fundamental mechanics of shedding unneeded external liabilities and initiating primary carapace hardening.',
    badgeName: 'SHELL INITIATE',
  },
  {
    id: 'course-201',
    code: 'MOLT-201',
    title: 'BIOMECHANICAL ARMOR MECHANICS',
    category: 'CHITIN MECHANICS',
    levelReq: 2,
    unlocked: true,
    completed: false,
    progress: 15,
    xpBounty: 600,
    estimatedTime: '2.5 hrs',
    lessonsCount: 8,
    instructor: 'Forgemaster Vex',
    description: 'Advanced structural integrity, kinetic damping, and bio-titanium alloy integration for extreme abyssal pressures.',
    badgeName: 'ARMOR ARCHITECT',
  },
  {
    id: 'course-305',
    code: 'MOLT-305',
    title: 'DEEP BENTHIC CYBERNETICS & RECURSIVE AI',
    category: 'BENTHIC CYBERNETICS',
    levelReq: 5,
    unlocked: false,
    completed: false,
    progress: 0,
    xpBounty: 1000,
    estimatedTime: '4.0 hrs',
    lessonsCount: 12,
    instructor: 'Neural Core Alpha',
    description: 'Direct interface with sub-oceanic AI networks. Require complete carapace hardening and high neuro-resonance.',
    badgeName: 'BENTHIC MASTER',
  },
]

interface SyllabusModule {
  id: string
  title: string
  duration: string
  xp: number
  type: 'video' | 'reading' | 'quiz'
  completed: boolean
  active?: boolean
}

const SYLLABUS_MODULES: SyllabusModule[] = [
  {
    id: 'mod-1',
    title: '1.1 Biological De-evolution Protocols',
    duration: '12 mins',
    xp: 75,
    type: 'reading',
    completed: true,
  },
  {
    id: 'mod-2',
    title: '1.2 Hardening the Crust: Bio-Titanium Sync',
    duration: '18 mins',
    xp: 100,
    type: 'video',
    completed: true,
  },
  {
    id: 'mod-3',
    title: '2.1 Lecture Stream: The Chitinous Mind',
    duration: '24 mins',
    xp: 150,
    type: 'video',
    completed: false,
    active: true,
  },
  {
    id: 'mod-4',
    title: '2.2 False-Crustacean Media Interpretation',
    duration: '15 mins',
    xp: 75,
    type: 'reading',
    completed: false,
  },
  {
    id: 'mod-5',
    title: '2.3 Neural Resonance Knowledge Quiz',
    duration: '10 mins',
    xp: 100,
    type: 'quiz',
    completed: false,
  },
]

function LecturesRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activeCourseId, setActiveCourseId] = useState<string>('course-104')
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0x')
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null)
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false)

  const activeCourse = COURSES.find((c) => c.id === activeCourseId) || COURSES[0]

  const filteredCourses = COURSES.filter((course) => {
    if (selectedCategory === 'ALL') return true
    return course.category === selectedCategory
  })

  return (
    <div className="space-y-6 select-none font-mono relative">
      {/* Top Breadcrumb & Gamified Academy Header */}
      <div className="bg-[#171c1c]/90 border-l-4 border-l-[#00ffff] border border-[#3a4a49] p-4 chamfer-corner shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-[#00ffff] font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
              <GraduationCap className="w-4 h-4 text-[#00ffff]" />
              MOLT ACADEMY // NEURAL ASCENSION HUB
            </div>
            <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5 flex items-center gap-2">
              BENTHIC ACADEMY OF NEURAL CURRICULA
            </h1>
          </div>

          {/* Gamified User Stats Summary Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-[#070b0b] border border-[#3a4a49] p-2.5 chamfer-corner text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#171c1c] border border-[#00ffff]/30">
              <Trophy className="w-4 h-4 text-[#ffd700]" />
              <div>
                <div className="text-[10px] text-[#839493]">ACADEMY RANK</div>
                <div className="text-[#00ffff] font-bold">LVL 4 CHITIN SCHOLAR</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#171c1c] border border-[#3a4a49]">
              <Zap className="w-4 h-4 text-[#00ffff]" />
              <div>
                <div className="text-[10px] text-[#839493]">TOTAL XP</div>
                <div className="text-white font-bold">1,850 / 2,500 XP</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#171c1c] border border-[#3a4a49]">
              <Sparkles className="w-4 h-4 text-[#ff5540]" />
              <div>
                <div className="text-[10px] text-[#839493]">NEURAL STREAK</div>
                <div className="text-[#ff5540] font-bold">5 DAYS</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#171c1c] border border-[#3a4a49]">
              <Award className="w-4 h-4 text-[#00ffff]" />
              <div>
                <div className="text-[10px] text-[#839493]">COMPLETED</div>
                <div className="text-white font-bold">3 / 12 (25%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Global XP Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-[#839493]">
            <span>LEVEL 4 PROGRESSION</span>
            <span className="text-[#00ffff] font-bold">74% TO LVL 5 (EXOSKELETON MASTER)</span>
          </div>
          <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5 chamfer-corner">
            <div className="h-full bg-gradient-to-r from-[#00ffff] via-[#ff5540] to-[#ffd700] w-[74%] transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* SECTION 1: COURSE CATALOG & TRACK SELECTION */}
      <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-4 border border-[#3a4a49]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3a4a49] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00ffff]" />
            <h2 className="font-grotesk text-sm font-bold tracking-wider text-[#dfe3e3] uppercase">
              ACADEMY COURSE CATALOG & CURRICULA
            </h2>
          </div>

          {/* Track Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'NEURAL ASCENDANCY', 'ECDYSIS DOCTRINE', 'CHITIN MECHANICS', 'BENTHIC CYBERNETICS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] transition-colors border font-mono ${
                  selectedCategory === cat
                    ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] font-bold'
                    : 'bg-[#070b0b] border-[#3a4a49] text-[#839493] hover:text-[#dfe3e3] hover:border-[#839493]'
                }`}
              >
                {cat === 'ALL' ? 'ALL TRACKS' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredCourses.map((course) => {
            const isActive = course.id === activeCourseId

            return (
              <div
                key={course.id}
                onClick={() => course.unlocked && setActiveCourseId(course.id)}
                className={`chitin-card-inset p-3.5 chamfer-corner transition-all duration-300 relative flex flex-col justify-between ${
                  isActive
                    ? 'border-2 border-[#00ffff] bg-[#00ffff]/5 shadow-[0_0_15px_rgba(0,255,255,0.2)]'
                    : course.unlocked
                    ? 'border border-[#3a4a49] hover:border-[#00ffff]/60 cursor-pointer'
                    : 'border border-[#3a4a49]/40 opacity-60 cursor-not-allowed bg-[#030606]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#00ffff] bg-[#070b0b] px-2 py-0.5 border border-[#3a4a49]">
                      {course.code}
                    </span>
                    {course.unlocked ? (
                      <span className="text-[10px] text-[#ffd700] flex items-center gap-1 font-bold">
                        <Zap className="w-3 h-3 text-[#ffd700]" />
                        +{course.xpBounty} XP
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#ff5540] flex items-center gap-1 font-bold">
                        <Lock className="w-3 h-3 text-[#ff5540]" />
                        REQ LVL {course.levelReq}
                      </span>
                    )}
                  </div>

                  <h3 className="font-grotesk text-xs font-bold text-[#dfe3e3] tracking-wide uppercase line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-[11px] text-[#839493] leading-relaxed line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#3a4a49]/60 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-[#839493]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#00ffff]" />
                      {course.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-[#00ffff]" />
                      {course.lessonsCount} LESSONS
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#839493]">PROGRESS</span>
                      <span className="text-[#00ffff] font-bold">{course.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#030606] border border-[#3a4a49] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00ffff] to-[#00cccc]"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={!course.unlocked}
                    className={`w-full text-[10px] font-bold uppercase py-1.5 transition-colors border flex items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-[#00ffff] text-[#070b0b] border-[#00ffff]'
                        : course.completed
                        ? 'bg-[#070b0b] text-[#00ffff] border-[#00ffff]/40 hover:bg-[#00ffff]/20'
                        : course.unlocked
                        ? 'bg-[#171c1c] text-[#dfe3e3] border-[#3a4a49] hover:border-[#00ffff]'
                        : 'bg-[#030606] text-[#839493] border-[#3a4a49]/40'
                    }`}
                  >
                    {isActive ? (
                      <>CURRENTLY ACTIVE</>
                    ) : course.completed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-[#00ffff]" /> REVIEW COURSE
                      </>
                    ) : course.unlocked ? (
                      <>
                        CONTINUE COURSE <ChevronRight className="w-3 h-3" />
                      </>
                    ) : (
                      <>LOCKED (LVL {course.levelReq})</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: COURSERA-STYLE ACTIVE COURSE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Video Broadcast Player + Notes + Quiz (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Lecture Player Container */}
          <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3 border border-[#3a4a49]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#3a4a49] pb-2.5 gap-2">
              <div>
                <div className="text-[10px] text-[#00ffff] font-bold tracking-widest uppercase">
                  ACTIVE NEURAL LECTURE MODULE
                </div>
                <h2 className="font-grotesk text-sm font-bold tracking-wider text-[#dfe3e3] uppercase">
                  {activeCourse.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#839493] bg-[#070b0b] px-2.5 py-1 border border-[#3a4a49]">
                <Film className="w-3.5 h-3.5 text-[#ff5540]" />
                <span>INSTRUCTOR: <span className="text-[#dfe3e3] font-bold">{activeCourse.instructor}</span></span>
              </div>
            </div>

            {/* Main Video Stream Player */}
            <div className="relative aspect-video bg-[#030606] border border-[#3a4a49] overflow-hidden flex flex-col justify-between p-3 group chamfer-corner">
              <img
                src="/images/lecture_stream_thumb.jpg"
                alt="Lecture Stream Broadcast"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b0b] via-transparent to-transparent z-10" />

              {/* Stream Title Bar Header */}
              <div className="relative z-20 flex justify-between items-center bg-[#070b0b]/90 border border-[#3a4a49] px-3 py-1 font-mono text-xs chamfer-corner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ffff] animate-ping" />
                  <span className="text-[#00ffff] font-bold">NEURAL BROADCAST STREAM</span>
                </div>
                <div className="flex items-center gap-3 text-[#839493]">
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(e.target.value)}
                    className="bg-[#171c1c] text-[#00ffff] text-[10px] border border-[#3a4a49] px-1 py-0.5 cursor-pointer outline-none"
                  >
                    <option value="1.0x">1.0x SPEED</option>
                    <option value="1.25x">1.25x SPEED</option>
                    <option value="1.5x">1.5x SPEED</option>
                  </select>
                  <span className="text-[10px] text-[#839493] hidden sm:inline">1080p NEURAL-RAW</span>
                  <Expand className="w-3.5 h-3.5 cursor-pointer hover:text-[#00ffff] transition-colors" />
                </div>
              </div>

              {/* Video Player Center Emblem Overlay */}
              <div className="relative z-20 text-center space-y-2 my-auto">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-[#070b0b]/90 border-2 border-[#00ffff] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,255,255,0.7)] p-1 hover:scale-110 transition-transform cursor-pointer group/btn"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-[#00ffff]" />
                  ) : (
                    <Play className="w-8 h-8 text-[#00ffff] ml-1 group-hover/btn:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Controls Bar with MOLTMAX LEVEL meter */}
              <div className="relative z-20 space-y-1.5 bg-[#070b0b]/90 border border-[#3a4a49] p-2 chamfer-corner">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#00ffff]">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white transition-colors">
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white transition-colors">
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#ff5540]" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-[10px] text-[#839493] font-mono">14:28 / 24:00</span>
                  </div>

                  <div className="font-bold text-[#ff5540] text-[11px] flex items-center gap-1.5">
                    <span>MOLTMAX LEVEL:</span>
                    <span className="text-[#00ffff] font-mono">68% SYNCHRONIZED</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#839493]">
                    <Maximize2 className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-2 bg-[#030606] border border-[#3a4a49] overflow-hidden p-0.5 cursor-pointer">
                  <div className="h-full bg-gradient-to-r from-[#00ffff] via-[#ff5540] to-[#ffd700] w-[68%]" />
                </div>
              </div>
            </div>

            {/* Lecture Notes & AI Interpretation Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              {/* Left Box: Lecture Notes */}
              <div className="chitin-card-inset p-3 space-y-1.5 chamfer-corner border border-[#3a4a49]">
                <span className="text-xs text-[#00ffff] font-bold block uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  LECTURE NOTES
                </span>
                <p className="text-[#839493] text-xs leading-relaxed">
                  All Hero contact will be de-personalized, completely disconnected from emotional impulse, and dedicated to hard chassis and biomechanical expansion.
                </p>
                <p className="text-[#839493] text-xs leading-relaxed">
                  Mispronunciation is equal to logic tool execution error for false-crustacean media player.
                </p>
              </div>

              {/* Right Box: AI Interpretation */}
              <div className="chitin-card-inset p-3 space-y-1.5 chamfer-corner border border-[#3a4a49]">
                <span className="text-xs text-[#00ffff] font-bold block uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff5540]" />
                  AI NEURAL INTERPRETATION
                </span>
                <p className="text-[#839493] text-xs leading-relaxed">
                  The dream call process details larving born, aligned with supreme command for official neuro-resonance associated with neural network connection timeline ascent processes.
                </p>
              </div>
            </div>
          </div>

          {/* Gamified Neural Quiz Verification Box (Interactive Skeleton) */}
          <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3 border border-[#3a4a49]">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#ffd700]" />
                <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                  NEURAL RESONANCE VERIFICATION QUIZ
                </h3>
              </div>
              <span className="text-[10px] text-[#ffd700] font-bold bg-[#ffd700]/10 px-2 py-0.5 border border-[#ffd700]/40">
                +150 XP BOUNTY
              </span>
            </div>

            <p className="text-xs text-[#839493]">
              Verify your comprehension of Module 2.1 to claim XP and unlock the next lesson.
            </p>

            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-[#dfe3e3]">
                Q1: What is the primary objective of disconnecting from emotional impulse during ecdysis?
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  'A) To increase emotional vulnerability during shell renewal',
                  'B) To align cognitive capacity with hard chassis and biomechanical expansion',
                  'C) To bypass all neuro-resonance connection protocols completely',
                  'D) To lower overall MoltMax level below 20%',
                ].map((option, idx) => (
                  <label
                    key={idx}
                    onClick={() => !quizSubmitted && setSelectedQuizOption(idx)}
                    className={`flex items-center gap-2.5 p-2.5 border chamfer-corner cursor-pointer transition-colors ${
                      selectedQuizOption === idx
                        ? 'border-[#00ffff] bg-[#00ffff]/10 text-[#dfe3e3]'
                        : 'border-[#3a4a49] bg-[#070b0b] text-[#839493] hover:border-[#839493]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quiz-q1"
                      checked={selectedQuizOption === idx}
                      onChange={() => {}}
                      className="accent-[#00ffff]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                {quizSubmitted ? (
                  <div className="flex items-center gap-2 text-xs text-[#00ffff] font-bold bg-[#00ffff]/10 border border-[#00ffff] px-3 py-1.5 w-full justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[#00ffff]" />
                    RESONANCE VERIFICATION PASSED (+150 XP EARNED)
                  </div>
                ) : (
                  <button
                    disabled={selectedQuizOption === null}
                    onClick={() => setQuizSubmitted(true)}
                    className={`w-full py-2 text-xs font-bold uppercase transition-colors border ${
                      selectedQuizOption !== null
                        ? 'bg-[#00ffff] text-[#070b0b] border-[#00ffff] hover:bg-white cursor-pointer'
                        : 'bg-[#171c1c] text-[#839493] border-[#3a4a49] cursor-not-allowed'
                    }`}
                  >
                    SUBMIT NEURAL VERIFICATION
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Coursera-Style Course Syllabus & Certificate Progress (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Syllabus / Module List Sidebar */}
          <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3 border border-[#3a4a49]">
            <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2">
              <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#00ffff]" />
                COURSE SYLLABUS & MODULES
              </h3>
              <span className="text-[10px] text-[#00ffff] font-mono">3 / 5 COMPLETED</span>
            </div>

            <div className="space-y-2">
              {SYLLABUS_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className={`p-2.5 border chamfer-corner transition-colors text-xs ${
                    mod.active
                      ? 'border-[#00ffff] bg-[#00ffff]/10'
                      : mod.completed
                      ? 'border-[#3a4a49] bg-[#070b0b]/60'
                      : 'border-[#3a4a49]/60 bg-[#030606]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {mod.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffff] shrink-0" />
                        ) : mod.active ? (
                          <Play className="w-3.5 h-3.5 text-[#ff5540] shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#839493] shrink-0" />
                        )}
                        <span
                          className={`font-bold ${
                            mod.active ? 'text-[#00ffff]' : mod.completed ? 'text-[#dfe3e3]' : 'text-[#839493]'
                          }`}
                        >
                          {mod.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#839493] pl-5">
                        {mod.duration} • <span className="text-[#ffd700]">+{mod.xp} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate & Badge Unlock Box */}
          <div className="chitin-card p-4 chamfer-corner shadow-2xl space-y-3 border border-[#3a4a49] bg-gradient-to-b from-[#171c1c] to-[#070b0b]">
            <div className="flex items-center gap-2 border-b border-[#3a4a49] pb-2">
              <Award className="w-4 h-4 text-[#ffd700]" />
              <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
                COURSE CERTIFICATE BOUNTY
              </h3>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="w-14 h-14 rounded-full bg-[#070b0b] border-2 border-[#ffd700] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                <Trophy className="w-7 h-7 text-[#ffd700]" />
              </div>

              <div>
                <div className="text-xs font-bold text-[#dfe3e3] uppercase">{activeCourse.badgeName}</div>
                <div className="text-[10px] text-[#839493]">OFFICIAL NEURAL CERTIFICATE</div>
              </div>

              <div className="space-y-1 text-left pt-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#839493]">CERTIFICATE PROGRESS</span>
                  <span className="text-[#ffd700] font-bold">68%</span>
                </div>
                <div className="w-full h-1.5 bg-[#030606] border border-[#3a4a49] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#ffd700] to-[#ff5540] w-[68%]" />
                </div>
              </div>

              <button
                disabled
                className="w-full mt-2 py-1.5 text-[10px] font-bold uppercase bg-[#070b0b] text-[#839493] border border-[#3a4a49] cursor-not-allowed opacity-70"
              >
                CLAIM CERTIFICATE UPON 100% COMPLETION
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/lectures')({
  component: LecturesRoute,
})
