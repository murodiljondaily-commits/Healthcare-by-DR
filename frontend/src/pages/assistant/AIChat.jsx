import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { StatusPill } from "../../components/StatusPill.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { api } from "../../services/api.js";

export function AIChat({ go }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState([{ role: "assistant", text: t("ai.greeting") }]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("Demo AI");
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const quickPrompts = [t("ai.q1"), t("ai.q2"), t("ai.q3")];

  const send = async (value = text) => {
    const clean = value.trim();
    if (!clean || loading) return;
    const next = [...messages, { role: "user", text: clean }];
    setMessages(next);
    setText("");
    setLoading(true);
    try {
      const res = await api.aiChat({
        messages: next,
        locale,
        context: {
          name: user?.name,
          age: user?.age,
          city: user?.city,
          healthScore: 88,
          medicationAdherence: 94,
        },
      });
      setProvider(res.provider === "deepseek" ? t("ai.provider.deepseek") : t("ai.provider.demo"));
      setMessages((cur) => [...cur, { role: "assistant", text: res.text }]);
    } catch (err) {
      setProvider("Offline");
      setMessages((cur) => [...cur, { role: "assistant", text: `${t("ai.error")} (${err.message})` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("ai.title")}
        subtitle={t("ai.subtitle")}
        icon={Bot}
        go={go}
        action={
          <StatusPill tone="teal">
            <Sparkles size={14} /> {provider}
          </StatusPill>
        }
      />

      <div className="filter-row">
        {quickPrompts.map((prompt) => (
          <button className="chip" type="button" key={prompt} onClick={() => send(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <section className="chat-shell">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((message, index) => (
            <div className={`chat-bubble ${message.role === "user" ? "user" : ""}`} key={`${message.role}-${index}`} style={{ whiteSpace: "pre-wrap" }}>
              {message.text}
            </div>
          ))}
          {loading ? (
            <div className="chat-bubble">
              <span className="typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          ) : null}
        </div>
        <form
          className="chat-input"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder={t("ai.placeholder")} />
          <Button type="submit" disabled={loading}>
            <Send size={17} /> {loading ? t("ai.thinking") : t("common.send")}
          </Button>
        </form>
      </section>
    </div>
  );
}
