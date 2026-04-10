import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { useChatClient } from "./hooks/useChatClient";
import { getApiBaseUrl } from "./services/chatApi";
import { getSocketBaseUrl } from "./services/chatSocket";

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  if (!name || name === "Unknown") {
    return "??";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function App() {
  const {
    auth,
    connection,
    conversations,
    activeConversation,
    activeConversationId,
    activeMessages,
    logs,
    typing,
    helpers,
    actions,
  } = useChatClient();

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [recipientId, setRecipientId] = useState("");
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, typing]);

  const currentConversationUser = useMemo(() => {
    if (!activeConversation) {
      return null;
    }

    return helpers.getOtherParticipant(activeConversation, auth.userId);
  }, [activeConversation, auth.userId, helpers]);

  const onCredentialChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!credentials.email || !credentials.password) {
      setFormError("Enter both email and password.");
      return;
    }

    try {
      await actions.onLogin(credentials);
      actions.log("Logged in successfully", "success");
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleStartConversation = async (event) => {
    event.preventDefault();
    if (!recipientId.trim()) {
      return;
    }

    try {
      await actions.startConversation(recipientId.trim());
      setRecipientId("");
    } catch (error) {
      actions.log(`Cannot start conversation: ${error.message}`, "error");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeConversationId) {
      return;
    }

    try {
      await actions.sendMessage(content);
      setDraft("");
    } catch (error) {
      actions.log(`Message send failed: ${error.message}`, "error");
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      await actions.selectConversation(conversationId);
    } catch (error) {
      actions.log(`Failed to open conversation: ${error.message}`, "error");
    }
  };

  return (
    <div className="chat-app">
      <header className="app-header">
        <div>
          <h1>LMS React Chat</h1>
          <p>
            API: <span>{getApiBaseUrl()}</span> | Socket: <span>{getSocketBaseUrl()}</span>
          </p>
        </div>
        <div className={`connection-pill ${connection.socketConnected ? "online" : "offline"}`}>
          {connection.socketConnected ? "Connected" : "Disconnected"}
        </div>
      </header>

      <main className="app-layout">
        <aside className="left-panel card">
          <section className="section-block">
            <h2>Authentication</h2>
            {!auth.token ? (
              <form onSubmit={handleLogin} className="stack">
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={credentials.email}
                    onChange={onCredentialChange}
                    autoComplete="username"
                    placeholder="student@example.com"
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={onCredentialChange}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </label>
                {formError ? <p className="form-error">{formError}</p> : null}
                {connection.error ? <p className="form-error">{connection.error}</p> : null}
                <button type="submit" disabled={connection.loading}>
                  {connection.loading ? "Signing in..." : "Login"}
                </button>
              </form>
            ) : (
              <div className="stack">
                <p className="session-note">Signed in as {auth.email || auth.userId}</p>
                <button type="button" className="danger" onClick={actions.onLogout}>
                  Disconnect
                </button>
              </div>
            )}
          </section>

          <section className="section-block">
            <h2>Start Conversation</h2>
            <form onSubmit={handleStartConversation} className="inline-form">
              <input
                type="text"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                placeholder="Recipient user ID"
                disabled={!auth.token}
              />
              <button type="submit" disabled={!auth.token || !recipientId.trim()}>
                Start
              </button>
            </form>
          </section>

          <section className="section-block list-section">
            <div className="section-head">
              <h2>Conversations</h2>
              <button type="button" className="ghost" disabled={!auth.token} onClick={actions.loadConversations}>
                Refresh
              </button>
            </div>
            <div className="conversation-list">
              {conversations.length === 0 ? (
                <p className="empty-text">No conversations yet.</p>
              ) : (
                conversations.map((conversation) => {
                  const convId = helpers.asId(conversation._id);
                  const other = helpers.getOtherParticipant(conversation, auth.userId);
                  const name = helpers.conversationName(conversation, auth.userId);
                  const online = other?.status === "online";
                  const unread = conversation.unreadCount || 0;
                  const last = conversation.lastMessage?.content || "No messages yet";

                  return (
                    <button
                      key={convId}
                      type="button"
                      className={`conversation-item ${convId === activeConversationId ? "active" : ""}`}
                      onClick={() => handleSelectConversation(convId)}
                    >
                      <div className="avatar">{initials(name)}</div>
                      <div className="conv-text">
                        <p className="name">{name}</p>
                        <p className="preview">{last}</p>
                      </div>
                      <div className="conv-meta">
                        <span className={`status-dot ${online ? "online" : ""}`} />
                        <span className="time">{formatTime(conversation.lastMessageAt)}</span>
                        {unread > 0 ? <span className="badge">{unread}</span> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </aside>

        <section className="chat-panel card">
          <div className="chat-head">
            <h2>
              {activeConversation ? helpers.conversationName(activeConversation, auth.userId) : "Select a conversation"}
            </h2>
            {currentConversationUser ? (
              <p className={`presence ${currentConversationUser.status === "online" ? "online" : "offline"}`}>
                {currentConversationUser.status === "online" ? "Online" : "Offline"}
              </p>
            ) : null}
          </div>

          <div className="message-scroller">
            {!activeConversationId ? (
              <p className="empty-text">Pick a conversation from the left to start chatting.</p>
            ) : activeMessages.length === 0 ? (
              <p className="empty-text">No messages yet. Send the first one.</p>
            ) : (
              activeMessages.map((message) => {
                const isOwn = helpers.asId(message.sender) === String(auth.userId);
                return (
                  <article key={helpers.asId(message._id) || `${message.createdAt}-${message.content}`} className={`message ${isOwn ? "mine" : "theirs"}`}>
                    <p>{message.content}</p>
                    <time>{formatTime(message.createdAt)}</time>
                  </article>
                );
              })
            )}
            {typing ? <p className="typing">Other user is typing...</p> : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="composer" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                actions.sendTyping();
              }}
              placeholder={activeConversationId ? "Type a message" : "Select conversation first"}
              disabled={!activeConversationId || !auth.token}
            />
            <button type="submit" disabled={!activeConversationId || !draft.trim()}>
              Send
            </button>
          </form>
        </section>

        <aside className="log-panel card">
          <h2>Logs</h2>
          <div className="log-list">
            {logs.length === 0 ? (
              <p className="empty-text">Runtime logs will appear here.</p>
            ) : (
              logs.map((entry) => (
                <p key={entry.id} className={`log ${entry.level}`}>
                  [{formatTime(entry.ts)}] {entry.message}
                </p>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
