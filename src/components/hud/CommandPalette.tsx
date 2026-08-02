import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Search,
  Terminal,
  Activity,
  ShoppingBag,
  Zap,
  Flame,
  Shield,
  Layers,
  X,
  Command,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  category: 'Navigation' | 'Rituals' | 'System'
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleCustomOpen = () => setIsOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleCustomOpen)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleCustomOpen)
    }
  }, [isOpen])

  const commands: CommandItem[] = [
    {
      id: 'nav-hub',
      label: 'Open Portal Command Hub (Mainpage)',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-[#00ffff]" />,
      shortcut: 'G H',
      action: () => {
        navigate({ to: '/dashboard' })
        setIsOpen(false)
      },
    },
    {
      id: 'nav-lectures',
      label: 'Open Molt-Cycle Lectures Stream & Notes',
      category: 'Navigation',
      icon: <BookOpen className="w-4 h-4 text-[#00ffff]" />,
      shortcut: 'G L',
      action: () => {
        navigate({ to: '/lectures' })
        setIsOpen(false)
      },
    },
    {
      id: 'nav-market',
      label: 'Open Benthic Market & Transmutation Artifacts',
      category: 'Navigation',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
      shortcut: 'G M',
      action: () => {
        navigate({ to: '/market' })
        setIsOpen(false)
      },
    },
    {
      id: 'nav-pipeline',
      label: 'Inspect Transmutation Pipeline & Stages',
      category: 'Navigation',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      shortcut: 'G P',
      action: () => {
        navigate({ to: '/pipeline' })
        setIsOpen(false)
      },
    },
    {
      id: 'nav-landing',
      label: 'View Order Landing Portal',
      category: 'Navigation',
      icon: <Flame className="w-4 h-4 text-red-500" />,
      shortcut: 'G L',
      action: () => {
        navigate({ to: '/landing' })
        setIsOpen(false)
      },
    },
    {
      id: 'nav-support',
      label: 'Open Benthic Support Portal & System Changelog',
      category: 'Navigation',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G S',
      action: () => {
        navigate({ to: '/support' })
        setIsOpen(false)
      },
    },
    {
      id: 'ritual-purge',
      label: 'Initiate Purge Protocol (Clear Neural Cache)',
      category: 'Rituals',
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      shortcut: 'ALT P',
      action: () => {
        alert('PURGE RITUAL INITIATED: Neural Cache purged. Synapses recalibrated.')
        setIsOpen(false)
      },
    },
    {
      id: 'system-scan',
      label: 'Execute Benthic Telemetry Diagnostic Scan',
      category: 'System',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      shortcut: 'CTRL S',
      action: () => {
        alert('SYSTEM DIAGNOSTIC: 100% Structural Integrity. Chitin Hardness Optimal.')
        setIsOpen(false)
      },
    },
  ]

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDownMenu = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev === 0 ? filteredCommands.length - 1 : prev - 1
      )
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      filteredCommands[selectedIndex].action()
    }
  }

  return (
    <>
      {/* Modal Command Palette Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-[#0b0f0f] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden chamfer-corner-lg font-mono text-sm"
            onKeyDown={handleKeyDownMenu}
          >
            {/* Command Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/40 bg-[#0f1414]">
              <div className="flex items-center space-x-3 flex-1">
                <Search className="w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a command or search protocol (e.g. Market, Purge)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none w-full text-sm font-mono"
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-red-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Command List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs tracking-wider">
                  NO MATCHING COMMAND PROTOCOLS FOUND
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/60 border-l-2 border-cyan-400 text-cyan-200'
                          : 'text-gray-300 hover:bg-gray-900/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-[#0f1414] border border-cyan-900/40">
                          {cmd.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-xs tracking-wide">
                            {cmd.label}
                          </div>
                          <div className="text-[10px] text-cyan-600 uppercase tracking-widest">
                            {cmd.category}
                          </div>
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <span className="text-[10px] bg-black/60 border border-gray-800 text-gray-400 px-2 py-0.5 font-mono">
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Command Palette Footer */}
            <div className="px-4 py-2 bg-[#070b0b] border-t border-cyan-950 text-[10px] text-gray-500 flex justify-between items-center">
              <div>
                Navigation: <span className="text-cyan-400">↑ ↓</span> to move,{' '}
                <span className="text-cyan-400">↵</span> to select
              </div>
              <div className="text-red-500 font-semibold uppercase tracking-widest">
                SYNAPTIC PATH COMMAND CORE
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
