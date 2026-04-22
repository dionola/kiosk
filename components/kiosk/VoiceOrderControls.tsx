interface VoiceOrderControlsProps {
  input: string
  loading: boolean
  isRecording: boolean
  isTranscribing: boolean
  speechError: string | null
  mediaRecorderSupported: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (event: React.KeyboardEvent) => void
  onMicToggle: () => void
  onSend: () => void
}

export function VoiceOrderControls({
  input,
  loading,
  isRecording,
  isTranscribing,
  speechError,
  mediaRecorderSupported,
  textareaRef,
  onInputChange,
  onKeyDown,
  onMicToggle,
  onSend,
}: VoiceOrderControlsProps) {
  return (
    <div className="p-8 border-t border-gray-100 bg-white">
      <div className="max-w-4xl mx-auto flex gap-4 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Message"
            rows={1}
            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:outline-none focus:border-jollibee-red focus:bg-white transition-all text-lg text-gray-900 placeholder:text-gray-400 caret-jollibee-red resize-none no-scrollbar pr-6 max-h-40"
            style={{ minHeight: '60px' }}
            disabled={loading}
          />
        </div>
        {mediaRecorderSupported && (
          <button
            type="button"
            onClick={onMicToggle}
            disabled={loading || isTranscribing}
            aria-label={isRecording ? 'Stop recording voice order' : 'Start recording voice order'}
            className={`w-[60px] h-[60px] rounded-[2rem] flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              isRecording
                ? 'bg-jollibee-yellow text-red-700 shadow-yellow-100'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${loading || isTranscribing ? 'opacity-30 grayscale' : ''}`}
          >
            <span className="text-2xl">{isRecording ? '◼' : '🎤'}</span>
          </button>
        )}
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="w-[60px] h-[60px] bg-jollibee-red text-white rounded-[2rem] flex items-center justify-center hover:bg-red-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-red-100 active:scale-90"
        >
          <span className="text-2xl font-bold">↑</span>
        </button>
      </div>
      <div className="min-h-[1.25rem] mt-3 px-1">
        {isRecording && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-jollibee-red">
            Recording... tap stop when you are done
          </p>
        )}
        {!isRecording && isTranscribing && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-jollibee-red">
            Transcribing your order...
          </p>
        )}
        {!isRecording && !isTranscribing && speechError && (
          <p className="text-xs font-bold text-red-500">{speechError}</p>
        )}
        {!isRecording && !isTranscribing && !speechError && mediaRecorderSupported && (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
            Tap the mic, speak your order, then tap stop
          </p>
        )}
      </div>
      <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-4 font-black">
        Powered by Jollibee AI • Multilingual Support
      </p>
    </div>
  )
}
