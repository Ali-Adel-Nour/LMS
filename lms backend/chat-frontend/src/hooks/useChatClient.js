import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchConversations,
  fetchMessages,
  fetchOrCreateConversation,
  login,
  postMessage,
} from "../services/chatApi";
import { createSocket } from "../services/chatSocket";

function parseUserIdFromJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload._id || payload.userId || null;
  } catch {
    return null;
  }
}

function asId(value) {
  if (!value) {
    return "";
  }
  return String(value._id || value);
}

function getOtherParticipant(conversation, currentUserId) {
  if (!conversation?.participants?.length) {
    return null;
  }

  return (
    conversation.participants.find((participant) => asId(participant) !== String(currentUserId)) ||
    conversation.participants[0]
  );
}

function conversationName(conversation, currentUserId) {
  const other = getOtherParticipant(conversation, currentUserId);
  if (!other) {
    return "Unknown";
  }
  const first = other.firstname || "";
  const last = other.lastname || "";
  return `${first} ${last}`.trim() || "Unknown";
}

function normalizeIncomingMessage(payload) {
  if (!payload) {
    return null;
  }

  if (payload.message && payload.conversationId) {
    return {
      message: payload.message,
      conversationId: payload.conversationId,
    };
  }

  if (payload.message?.conversation) {
    return {
      message: payload.message,
      conversationId: asId(payload.message.conversation),
    };
  }

  if (payload.conversation && payload.message) {
    return {
      message: payload.message,
      conversationId: asId(payload.conversation),
    };
  }

  return null;
}

export function useChatClient() {
  const [auth, setAuth] = useState({ token: "", userId: "", email: "" });
  const [connection, setConnection] = useState({
    socketConnected: false,
    loading: false,
    error: "",
  });
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [logs, setLogs] = useState([]);

  const socketRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);

  const log = useCallback((message, level = "info") => {
    setLogs((prev) => {
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, message, level, ts: new Date().toISOString() }];
      return next.slice(-100);
    });
  }, []);

  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const connectSocket = useCallback(
    (token, userId) => {
      cleanupSocket();
      const socket = createSocket(token);
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnection((prev) => ({ ...prev, socketConnected: true, error: "" }));
        log("Socket connected", "success");
      });

      socket.on("disconnect", () => {
        setConnection((prev) => ({ ...prev, socketConnected: false }));
        log("Socket disconnected", "error");
      });

      socket.on("connect_error", (error) => {
        setConnection((prev) => ({ ...prev, socketConnected: false, error: error.message }));
        log(`Socket error: ${error.message}`, "error");
      });

      socket.on("typing:update", (payload) => {
        if (!payload?.conversationId || String(payload.userId) === String(userId)) {
          return;
        }

        setTypingByConversation((prev) => ({
          ...prev,
          [payload.conversationId]: payload.isTyping,
        }));
      });

      socket.on("message:new", (payload) => {
        const incoming = normalizeIncomingMessage(payload);
        if (!incoming?.message || !incoming?.conversationId) {
          return;
        }

        setMessagesByConversation((prev) => {
          const existing = prev[incoming.conversationId] || [];
          const duplicate = existing.some((msg) => asId(msg._id) === asId(incoming.message._id));
          if (duplicate) {
            return prev;
          }
          return {
            ...prev,
            [incoming.conversationId]: [...existing, incoming.message],
          };
        });

        setConversations((prev) => {
          const next = prev.map((conv) => {
            if (asId(conv._id) !== incoming.conversationId) {
              return conv;
            }

            const senderId = asId(incoming.message.sender);
            const unread = senderId === String(userId) ? conv.unreadCount || 0 : (conv.unreadCount || 0) + 1;

            return {
              ...conv,
              lastMessage: incoming.message,
              lastMessageAt: incoming.message.createdAt,
              unreadCount: unread,
            };
          });

          next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
          return next;
        });
      });

      socket.on("user:online", (payload) => {
        if (!payload?.userId) {
          return;
        }
        setConversations((prev) =>
          prev.map((conv) => ({
            ...conv,
            participants: conv.participants?.map((participant) =>
              asId(participant) === String(payload.userId)
                ? { ...participant, status: "online" }
                : participant,
            ),
          })),
        );
      });

      socket.on("user:offline", (payload) => {
        if (!payload?.userId) {
          return;
        }
        setConversations((prev) =>
          prev.map((conv) => ({
            ...conv,
            participants: conv.participants?.map((participant) =>
              asId(participant) === String(payload.userId)
                ? { ...participant, status: "offline" }
                : participant,
            ),
          })),
        );
      });
    },
    [cleanupSocket, log],
  );

  const loadConversations = useCallback(async () => {
    if (!auth.token) {
      return;
    }

    const data = await fetchConversations(auth.token);
    setConversations(data.conversations || []);
  }, [auth.token]);

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!auth.token || !conversationId) {
        return;
      }

      const data = await fetchMessages(auth.token, conversationId);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: data.messages || [],
      }));

      // Mark unread messages as read locally and notify other users.
      setConversations((prev) =>
        prev.map((conv) =>
          asId(conv._id) === conversationId
            ? {
                ...conv,
                unreadCount: 0,
              }
            : conv,
        ),
      );

      if (socketRef.current) {
        const unreadIds = (data.messages || [])
          .filter((msg) => asId(msg.sender) !== String(auth.userId))
          .map((msg) => msg._id)
          .filter(Boolean);

        if (unreadIds.length) {
          socketRef.current.emit("message:read", {
            conversationId,
            messageIds: unreadIds,
          });
        }
      }
    },
    [auth.token, auth.userId],
  );

  const selectConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        return;
      }

      if (socketRef.current && activeConversationId && activeConversationId !== conversationId) {
        socketRef.current.emit("conversation:leave", activeConversationId);
      }

      setActiveConversationId(conversationId);
      if (socketRef.current) {
        socketRef.current.emit("conversation:join", conversationId);
      }
      await loadMessages(conversationId);
    },
    [activeConversationId, loadMessages],
  );

  const onLogin = useCallback(
    async ({ email, password }) => {
      setConnection((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const data = await login(email, password);
        if (!data.accessToken) {
          throw new Error("Login response did not include access token");
        }

        const userId = parseUserIdFromJwt(data.accessToken);
        if (!userId) {
          throw new Error("Could not read user ID from token");
        }

        const token = data.accessToken;
        const normalizedUserId = String(userId);

        setAuth({ token, userId: normalizedUserId, email });
        connectSocket(token, normalizedUserId);

        const conversationsData = await fetchConversations(token);
        setConversations(conversationsData.conversations || []);

        log("Authenticated successfully", "success");
      } catch (error) {
        setConnection((prev) => ({ ...prev, error: error.message }));
        log(`Login failed: ${error.message}`, "error");
        throw error;
      } finally {
        setConnection((prev) => ({ ...prev, loading: false }));
      }
    },
    [connectSocket, log],
  );

  const onLogout = useCallback(() => {
    cleanupSocket();
    setAuth({ token: "", userId: "", email: "" });
    setConnection({ socketConnected: false, loading: false, error: "" });
    setConversations([]);
    setActiveConversationId("");
    setMessagesByConversation({});
    setTypingByConversation({});
    setLogs([]);
  }, [cleanupSocket]);

  const startConversation = useCallback(
    async (recipientId) => {
      if (!auth.token || !recipientId) {
        return;
      }

      const data = await fetchOrCreateConversation(auth.token, recipientId);
      const conversation = data.conversation;

      if (!conversation) {
        throw new Error("Conversation was not returned by API");
      }

      setConversations((prev) => {
        const exists = prev.some((conv) => asId(conv._id) === asId(conversation._id));
        const next = exists
          ? prev.map((conv) => (asId(conv._id) === asId(conversation._id) ? conversation : conv))
          : [conversation, ...prev];
        return next;
      });

      await selectConversation(asId(conversation._id));
    },
    [auth.token, selectConversation],
  );

  const sendMessage = useCallback(
    async (content) => {
      if (!auth.token || !activeConversationId) {
        return;
      }

      const data = await postMessage(auth.token, activeConversationId, content);
      if (data.message) {
        setMessagesByConversation((prev) => {
          const current = prev[activeConversationId] || [];
          const duplicate = current.some((msg) => asId(msg._id) === asId(data.message._id));
          if (duplicate) {
            return prev;
          }

          return {
            ...prev,
            [activeConversationId]: [...current, data.message],
          };
        });
      }

      setConversations((prev) => {
        const next = prev.map((conv) =>
          asId(conv._id) === activeConversationId
            ? {
                ...conv,
                lastMessage: data.message,
                lastMessageAt: data.message?.createdAt || new Date().toISOString(),
              }
            : conv,
        );

        next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        return next;
      });

      if (socketRef.current) {
        socketRef.current.emit("typing:stop", { conversationId: activeConversationId });
      }
    },
    [activeConversationId, auth.token],
  );

  const sendTyping = useCallback(() => {
    if (!socketRef.current || !activeConversationId) {
      return;
    }

    socketRef.current.emit("typing:start", { conversationId: activeConversationId });

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }

    typingStopTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("typing:stop", { conversationId: activeConversationId });
      }
    }, 1500);
  }, [activeConversationId]);

  useEffect(() => {
    return () => {
      cleanupSocket();
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }
    };
  }, [cleanupSocket]);

  const activeConversation = useMemo(
    () => conversations.find((conv) => asId(conv._id) === activeConversationId) || null,
    [activeConversationId, conversations],
  );

  const activeMessages = useMemo(
    () => messagesByConversation[activeConversationId] || [],
    [activeConversationId, messagesByConversation],
  );

  return {
    auth,
    connection,
    conversations,
    activeConversation,
    activeConversationId,
    activeMessages,
    logs,
    typing: Boolean(typingByConversation[activeConversationId]),
    helpers: {
      asId,
      getOtherParticipant,
      conversationName,
    },
    actions: {
      loadConversations,
      loadMessages,
      selectConversation,
      onLogin,
      onLogout,
      startConversation,
      sendMessage,
      sendTyping,
      log,
    },
  };
}
