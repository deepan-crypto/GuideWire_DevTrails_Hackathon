import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Bot, Send, Globe, Mic, Sparkles, Phone } from 'lucide-react-native';

const PB_NAVY = '#0F4C81';
const PRIMARY = '#0066CC';

const LANGUAGES = ['English', 'हिन्दी', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ', 'മലയാളം', 'বাংলা', 'मराठी'];

const QUICK_PROMPTS = [
  '🛡️ What plans are available?',
  '⚡ How do payouts work?',
  '🌡️ What triggers a claim?',
  '💰 Compare plan pricing',
  '📋 How to activate a policy?',
  '🔄 Can I change my plan?',
];

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const BOT_RESPONSES: Record<string, string> = {
  'what plans are available': `We offer 3 parametric micro-insurance plans:\n\n🟢 **Heat Shield Basic** — ₹95/day\n→ Heat trigger, ₹300/day payout\n\n🔵 **Rain Guard Plus** — ₹143/day\n→ Heat + Rain triggers, ₹500/day payout\n\n🟡 **Heat Shield Pro** — ₹218/day\n→ All weather triggers, ₹1000/day payout, priority payouts\n\nAll plans have zero paperwork and instant wallet payouts!`,
  'how do payouts work': `Payouts are 100% automatic! Here's how:\n\n1️⃣ Our IoT sensors monitor weather in your micro-zone 24/7\n2️⃣ When temperature exceeds 45°C or rainfall exceeds 80mm, a trigger is activated\n3️⃣ Our actuarial engine auto-approves the claim in ~2.8 seconds\n4️⃣ Money is credited directly to your wallet — no documents needed!\n\nAverage payout time: 2.8 seconds ⚡`,
  'what triggers a claim': `Claims are triggered automatically by weather events:\n\n🌡️ **Heat Trigger**: Temperature ≥ 45°C in your zone\n🌧️ **Rain Trigger**: Rainfall ≥ 80mm in your zone\n\nWe use satellite data + ground IoT sensors for accuracy. No human judgment involved — it's pure parametric insurance.\n\nBasic plans cover heat only. Standard covers heat + rain. Pro covers all weather events.`,
  'compare plan pricing': `Here's a quick comparison:\n\n| Plan | Daily Cost | Payout | Triggers |\n|------|-----------|--------|----------|\n| Basic | ₹95 | ₹300/day | Heat only |\n| Standard | ₹143 | ₹500/day | Heat + Rain |\n| Pro | ₹218 | ₹1000/day | All weather |\n\n💡 Pro tip: If you work in a coastal city (Mumbai, Chennai), Rain Guard Plus is recommended!`,
  'how to activate a policy': `Activating is super simple:\n\n1️⃣ Choose your plan on the Home tab\n2️⃣ Enter your age, city, name & phone\n3️⃣ We register you and activate the policy instantly\n\nNo documents needed! The entire process takes under 2 minutes. Your coverage starts immediately after activation.`,
  'can i change my plan': `Yes! You can upgrade or change your plan anytime.\n\nJust go to Profile → Policy Details → Change Plan.\n\nUpgrades take effect immediately. Downgrades apply from the next billing cycle.\n\nNo cancellation fees — we believe in flexibility for gig workers! 🤝`,
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key) || key.split(' ').every(w => lower.includes(w))) {
      return response;
    }
  }
  if (lower.includes('plan')) return BOT_RESPONSES['what plans are available'];
  if (lower.includes('payout') || lower.includes('money') || lower.includes('pay')) return BOT_RESPONSES['how do payouts work'];
  if (lower.includes('trigger') || lower.includes('claim') || lower.includes('weather')) return BOT_RESPONSES['what triggers a claim'];
  if (lower.includes('price') || lower.includes('cost') || lower.includes('compare')) return BOT_RESPONSES['compare plan pricing'];
  if (lower.includes('activate') || lower.includes('start') || lower.includes('sign')) return BOT_RESPONSES['how to activate a policy'];
  if (lower.includes('change') || lower.includes('upgrade') || lower.includes('cancel')) return BOT_RESPONSES['can i change my plan'];
  return `I can help you with:\n\n• Plan details & pricing\n• How payouts work\n• Claim triggers\n• Activation process\n• Plan changes\n\nTry asking one of these! Or tap a quick prompt below. 🤖`;
}

function getTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'bot',
    text: `👋 Hello! I'm RiskWire AI Assistant.\n\nI can help you understand our parametric micro-insurance plans, pricing, payouts, and more.\n\nAvailable in 8 languages! Tap 🌐 to switch.\n\nHow can I help you today?`,
    time: getTime(),
  },
];

export default function ExpertScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('English');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), time: getTime() };
    const botResponse = getBotResponse(text.trim());
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: botResponse, time: getTime() };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatar}>
            <Bot size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>RiskWire AI</Text>
            <View style={styles.headerStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Online · {lang}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowLangPicker(!showLangPicker)}>
            <Globe size={18} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language picker */}
      {showLangPicker && (
        <View style={styles.langPicker}>
          <Text style={styles.langTitle}>🌐 Select Language</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langChip, lang === l && styles.langChipActive]}
                onPress={() => { setLang(l); setShowLangPicker(false); }}
              >
                <Text style={[styles.langChipText, lang === l && styles.langChipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* AI badge */}
      <View style={styles.aiBadge}>
        <Sparkles size={12} color={PRIMARY} />
        <Text style={styles.aiBadgeText}>Powered by RiskWire AI · Multilingual · No human intervention</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            {msg.role === 'bot' && (
              <View style={styles.msgBotIcon}>
                <Bot size={14} color="#FFF" />
              </View>
            )}
            <View style={[styles.msgBubble, msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot]}>
              <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>{msg.text}</Text>
              <Text style={[styles.msgTime, msg.role === 'user' && styles.msgTimeUser]}>{msg.time}</Text>
            </View>
          </View>
        ))}

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <View style={styles.quickPrompts}>
            <Text style={styles.quickTitle}>Quick Questions</Text>
            {QUICK_PROMPTS.map(p => (
              <TouchableOpacity key={p} style={styles.quickBtn} onPress={() => sendMessage(p.slice(2).trim())}>
                <Text style={styles.quickBtnText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask about plans, pricing, payouts..."
          placeholderTextColor="#AAA"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
        >
          <Send size={18} color={input.trim() ? '#FFF' : '#CCC'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2F5' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00C37B' },
  headerSubtitle: { fontSize: 11, color: '#666' },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F7FF',
    alignItems: 'center', justifyContent: 'center',
  },

  langPicker: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  langTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#FFF',
  },
  langChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  langChipText: { fontSize: 12, fontWeight: '600', color: '#333' },
  langChipTextActive: { color: '#FFF' },

  aiBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 6, backgroundColor: '#EFF6FF', borderBottomWidth: 1, borderBottomColor: '#DBEAFE',
  },
  aiBadgeText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },

  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8 },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgBotIcon: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  msgBubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  msgBubbleBot: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  msgBubbleUser: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  msgText: { fontSize: 13, color: '#1A1A1A', lineHeight: 20 },
  msgTextUser: { color: '#FFFFFF' },
  msgTime: { fontSize: 9, color: '#999', marginTop: 4, textAlign: 'right' },
  msgTimeUser: { color: 'rgba(255,255,255,0.6)' },

  quickPrompts: { marginTop: 8, gap: 8 },
  quickTitle: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 4 },
  quickBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  quickBtnText: { fontSize: 13, color: PRIMARY, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E5E5',
  },
  textInput: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1A1A1A',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#E5E5E5' },
});
