import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  sendMessage,
  uploadDocument
} from './copilotSlice';
import {
  setCopilotCollapsed,
  setEmailModalOpen,
  showToast
} from '../ui/uiSlice';
import { Icon } from '../../components/Icon';
import { CopilotMark } from '../../components/UI';

export const CopilotPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, status } = useAppSelector((state) => state.copilot);
  const collapsed = useAppSelector((state) => state.ui.copilotCollapsed);
  const isDraft = !useAppSelector((state) => state.investigation.current.incident?.title);

  const [input, setInput] = useState('');
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'loading';

  // Auto-scroll on new messages or loading state
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      dispatch(sendMessage({ message: trimmed }));
      setInput('');
    }
  };

  const handleQuickPromptClick = (promptText: string) => {
    // Fill the composer without auto-sending, per prompt requirements
    setInput(promptText);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      dispatch(showToast({ text: 'Please select a PDF document to continue.', error: true }));
      return;
    }
    // Max 10 MB validation per instructions
    if (file.size > 10 * 1024 * 1024) {
      dispatch(
        showToast({ text: 'File exceeds 10 MB limit. Please select a smaller PDF.', error: true })
      );
      return;
    }
    dispatch(uploadDocument({ file }));
  };

  if (collapsed) {
    return (
      <button
        type="button"
        className="collapsed-copilot"
        onClick={() => dispatch(setCopilotCollapsed(false))}
        aria-label="Expand AIVOA Copilot panel"
      >
        <CopilotMark small />
        <span>AIVOA Copilot</span>
        <Icon name="panel" size={17} />
      </button>
    );
  }

  return (
    <aside
      className={`copilot ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) {
          handleFileUpload(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Header */}
      <div className="copilot-header">
        <CopilotMark />
        <div>
          <h2>AIVOA Copilot</h2>
          <span>
            <i />
            {isLoading ? 'Analyzing your case' : 'Your investigation partner'}
          </span>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Collapse copilot"
          title="Collapse copilot panel"
          onClick={() => dispatch(setCopilotCollapsed(true))}
        >
          <Icon name="panel" size={17} />
        </button>
      </div>

      {/* Context Status */}
      <div className="copilot-context">
        <Icon name="network" size={13} />
        <span>
          {isDraft ? 'Ready for a new investigation' : 'Context: Root Cause Analysis'}
        </span>
        <span className="context-dot" />
      </div>

      {/* Message Thread */}
      <div className="chat-thread">
        <div className="chat-date">TODAY</div>

        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`message ${isUser ? 'message-user' : 'message-ai'} animate-in`}
            >
              {!isUser && (
                <div className="message-author">
                  <CopilotMark small />
                  <span>AIVOA</span>
                  <span className="message-time">{m.timestamp}</span>
                </div>
              )}

              <div className="message-bubble">
                <p>{m.content}</p>

                {/* File chip for attached document */}
                {m.fileName && (
                  <div className="chat-file">
                    <span className="file-type">
                      <Icon name="file" size={17} />
                    </span>
                    <span>
                      {m.fileName}
                      <small>PDF document · Attached</small>
                    </span>
                    <Icon name="check-circle" size={14} />
                  </div>
                )}

                {/* Changes List */}
                {m.changes && m.changes.length > 0 && (
                  <div className="changes-list">
                    <div className="changes-heading">
                      <Icon name="check" size={12} />
                      WHAT I UPDATED
                    </div>
                    {m.changes.map((c, idx) => (
                      <div className="change" key={idx}>
                        <span>{c.field}</span>
                        <div>
                          <del>{c.from}</del>
                          <Icon name="arrow" size={10} />
                          <strong>{c.to}</strong>
                        </div>
                      </div>
                    ))}
                    <span className="changes-link">
                      <Icon name="check-circle" size={11} />
                      Updated on your case canvas
                    </span>
                  </div>
                )}
              </div>

              {isUser && (
                <span className="user-message-meta">
                  You · {m.timestamp} <Icon name="check" size={11} />
                </span>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="typing-indicator">
            <CopilotMark small />
            <span />
            <span />
            <span />
            <small>Reviewing the evidence…</small>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Bottom Composer Area */}
      <div className="copilot-bottom">
        {/* Quick Prompts */}
        <div className="quick-prompts">
          {[
            { text: 'Suggest root causes', icon: 'network' as const },
            { text: 'Generate CAPA', icon: 'target' as const },
            { text: 'Log a new incident', icon: 'plus' as const }
          ].map((p) => (
            <button
              key={p.text}
              type="button"
              onClick={() => handleQuickPromptClick(p.text)}
              disabled={isLoading}
            >
              <Icon name={p.icon} size={12} />
              {p.text}
              <Icon name="arrow" size={11} />
            </button>
          ))}
        </div>

        {/* Textarea Composer */}
        <div className="composer">
          <textarea
            aria-label="Message AIVOA Copilot"
            placeholder="Ask, describe, or paste an incident…"
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <div className="composer-toolbar">
            <button
              type="button"
              aria-label="Attach a PDF"
              title="Attach a PDF (Max 10 MB)"
              disabled={isLoading}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="attach" size={16} />
            </button>

            <button
              type="button"
              aria-label="Paste an email"
              title="Paste an email"
              disabled={isLoading}
              onClick={() => dispatch(setEmailModalOpen(true))}
            >
              <Icon name="mail" size={16} />
            </button>

            <span>↵ to send</span>

            <button
              type="button"
              className="send-button"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              onClick={handleSend}
            >
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>

        {/* Drop Zone */}
        <button
          type="button"
          className="drop-zone"
          disabled={isLoading}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="upload" size={12} />
          Drop a PDF here, or <strong>browse files</strong>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
            e.target.value = '';
          }}
        />

        <p className="copilot-disclaimer">
          <Icon name="shield" size={11} />
          AI can be wrong. Review before confirming.
        </p>
      </div>

      {dragging && (
        <div className="drag-overlay">
          <Icon name="upload" size={35} />
          <strong>Drop your PDF to investigate</strong>
        </div>
      )}
    </aside>
  );
};

