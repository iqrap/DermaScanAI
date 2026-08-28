import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  StatusBar,
  Keyboard,
  Alert,
  Modal,
  ListRenderItem,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService } from "../../../src/services/apiService"

const { width } = Dimensions.get('window')

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

type Suggestion = {
  icon: string
  text: string
}

const LIGHT_COLORS = {
  bgGradientTop: "#ffffffff",
  bgGradientBottom: "#cae2ceff",
  darkGreen: "#4e7565ff",
  mediumGreen: "#4A6B5D",
  lightGreenBorder: "#8EB29C",
  lightGreenFill: "rgba(230, 244, 235, 0.6)",
  white: "#FFFFFF",
  buttonGradientStart: "#558d74ff",
  buttonGradientEnd: "#3b6450ff",
  cardBorder: "#D1E3DA",
  cardBg: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.08)",
  accent: "#834f2c",
  userBubble: "#4e7565ff",
  botBubble: "#FFFFFF",
  text: "#333333",
  gray: "#A0A0A0",
  lightGray: "#F5F5F5",
  border: "#E0E0E0",
  background: "#FFFFFF",
}

const DARK_COLORS = {
  bgGradientTop: "#1a1a1a",
  bgGradientBottom: "#2d2d2d",
  darkGreen: "#6b8f7c",
  mediumGreen: "#8aa398",
  lightGreenBorder: "#4e7565",
  lightGreenFill: "rgba(46, 91, 72, 0.4)",
  white: "#2d2d2d",
  buttonGradientStart: "#3b6450ff",
  buttonGradientEnd: "#2d4a3aff",
  cardBorder: "#404040",
  cardBg: "#2d2d2d",
  cardShadow: "rgba(255, 255, 255, 0.08)",
  accent: "#a67c5c",
  userBubble: "#6b8f7c",
  botBubble: "#363636",
  text: "#FFFFFF",
  gray: "#808080",
  lightGray: "#333333",
  border: "#404040",
  background: "#1a1a1a",
}

export default function SkinChatbotScreen() {
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const inputRef = useRef<TextInput>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '🌸 Hi! I\'m your Skin Care Assistant. Ask me about skincare, diet, products, or skin concerns!',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  const COLORS = darkMode ? DARK_COLORS : LIGHT_COLORS

  const suggestions: Suggestion[] = [
    { icon: "🔴", text: "Acne" },
    { icon: "✨", text: "Glowing skin" },
    { icon: "💧", text: "Dry skin" },
    { icon: "🌿", text: "Oily skin" },
    { icon: "☀️", text: "Sunscreen" },
    { icon: "🥗", text: "Diet" },
    { icon: "🌙", text: "Night routine" },
    { icon: "🧴", text: "Products" },
  ]

  useEffect(() => {
    loadThemePreference()
    loadChatHistory()

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start()

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      }
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode')
      if (savedTheme !== null) setDarkMode(JSON.parse(savedTheme))
    } catch (error) {
      console.log('Error loading theme:', error)
    }
  }

  const saveThemePreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(value))
      setDarkMode(value)
    } catch (error) {
      console.log('Error saving theme:', error)
    }
  }

  const loadChatHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('chatHistory')
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        setMessages(parsed)
      }
    } catch (error) {
      console.log('Error loading chat history:', error)
    }
  }

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('chatHistory', JSON.stringify(newMessages.slice(-50)))
    } catch (error) {
      console.log('Error saving chat history:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    saveChatHistory(newMessages)
    setInputText('')
    setLoading(true)
    setIsTyping(true)

    try {
      const botReply = await apiService.sendChatMessage(inputText, messages)
      
      let cleanedReply = botReply
      cleanedReply = cleanedReply.replace(/consult.*?dermatologist/gi, '')
      cleanedReply = cleanedReply.replace(/see.*?doctor/gi, '')
      cleanedReply = cleanedReply.replace(/dermatologist/gi, '')
      cleanedReply = cleanedReply.replace(/medical advice/gi, '')

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanedReply,
        sender: 'bot',
        timestamp: new Date().toISOString()
      }

      const updatedMessages = [...newMessages, botMessage]
      setMessages(updatedMessages)
      saveChatHistory(updatedMessages)

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Network Error: Unable to connect to the server. Please check your internet connection and try again.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      }
      
      const updatedMessages = [...newMessages, errorMessage]
      setMessages(updatedMessages)
      saveChatHistory(updatedMessages)
      
      Alert.alert(
        'Network Error',
        'Failed to get response. Please check your internet connection.',
        [{ text: 'OK' }]
      )
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  const handleSuggestion = (text: string) => {
    setInputText(text)
    inputRef.current?.focus()
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return ''
    }
  }

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            setMessages([
              {
                id: '1',
                text: '🌸 Hi! I\'m your Skin Care Assistant. Ask me about skincare, diet, products, or skin concerns!',
                sender: 'bot',
                timestamp: new Date().toISOString()
              }
            ])
            AsyncStorage.removeItem('chatHistory')
          }
        }
      ]
    )
  }

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    return (
      <Animated.View
        style={[
          styles.messageRow,
          item.sender === 'user' ? styles.userRow : styles.botRow,
        ]}
      >
        {item.sender === 'bot' && (
          <View style={[styles.botAvatar, { backgroundColor: COLORS.lightGreenFill, borderColor: COLORS.lightGreenBorder }]}>
            <Text style={styles.botAvatarText}>🌸</Text>
          </View>
        )}

        <View style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userBubble : styles.botBubble,
          { maxWidth: width * 0.7 },
          item.sender === 'user'
            ? { backgroundColor: COLORS.userBubble }
            : { backgroundColor: COLORS.botBubble, borderColor: COLORS.cardBorder }
        ]}>
          <Text style={[
            styles.messageText,
            fontSize === 'large' && styles.largeText,
            fontSize === 'small' && styles.smallText,
            { color: item.sender === 'user' ? COLORS.white : COLORS.text }
          ]}>
            {item.text}
          </Text>

          <Text style={[
            styles.timestamp,
            { color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : COLORS.gray }
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>

        {item.sender === 'user' && (
          <View style={[styles.userAvatar, { backgroundColor: COLORS.lightGreenFill, borderColor: COLORS.lightGreenBorder }]}>
            <Text style={styles.userAvatarText}>👤</Text>
          </View>
        )}
      </Animated.View>
    )
  }

  return (
    <ImageBackground
      source={require("../../../assets/images/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      <LinearGradient
        colors={[COLORS.bgGradientTop, COLORS.bgGradientBottom]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.buttonGradientStart, COLORS.buttonGradientEnd]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>
                  Skin Assistant
                </Text>
                <Text style={styles.headerSubtitle}>
                  Ask me anything! ✨
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.settingsButton}
              >
                <Ionicons name="settings-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <Animated.View
            style={[
              styles.messagesContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginBottom: keyboardHeight > 0 ? 0 : 0,
              }
            ]}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={renderMessage}
            />

            {isTyping && (
              <View style={styles.typingContainer}>
                <View style={[styles.typingAvatar, { backgroundColor: COLORS.lightGreenFill }]}>
                  <Text style={styles.typingAvatarText}>🌸</Text>
                </View>
                <View style={[styles.typingBubble, { backgroundColor: COLORS.botBubble, borderColor: COLORS.cardBorder }]}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, styles.typingDot1, { backgroundColor: COLORS.darkGreen }]} />
                    <View style={[styles.typingDot, styles.typingDot2, { backgroundColor: COLORS.darkGreen }]} />
                    <View style={[styles.typingDot, styles.typingDot3, { backgroundColor: COLORS.darkGreen }]} />
                  </View>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={[styles.suggestionsContainer, { backgroundColor: COLORS.cardBg, borderTopColor: COLORS.cardBorder }]}>
            <FlatList
              horizontal
              data={suggestions}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.text}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }: { item: Suggestion }) => (
                <TouchableOpacity
                  style={[styles.suggestionChip, { backgroundColor: COLORS.lightGreenFill, borderColor: COLORS.cardBorder }]}
                  onPress={() => handleSuggestion(item.text)}
                >
                  <Text style={styles.suggestionEmoji}>{item.icon}</Text>
                  <Text style={[styles.suggestionText, { color: COLORS.darkGreen }]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={[
            styles.inputArea,
            { 
              backgroundColor: COLORS.cardBg,
              borderTopColor: COLORS.cardBorder,
              paddingBottom: keyboardHeight > 0 ? keyboardHeight : 12,
            }
          ]}>
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, { backgroundColor: COLORS.lightGray, borderColor: COLORS.cardBorder }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: COLORS.text }]}
                  placeholder="Ask me anything..."
                  placeholderTextColor={COLORS.gray}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || loading) && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.darkGreen} />
                  ) : (
                    <Ionicons name="send" size={20} color={COLORS.darkGreen} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.accent} />
              <Text style={[styles.disclaimerText, { color: COLORS.accent }]}>
                Skin care tips only
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.darkGreen }]}>
                Settings
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGreen} />
              </TouchableOpacity>
            </View>

            <View style={[styles.settingItem, { borderBottomColor: COLORS.cardBorder }]}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>
                Dark Mode
              </Text>
              <TouchableOpacity
                style={[styles.settingToggle, { backgroundColor: darkMode ? COLORS.darkGreen : COLORS.gray }]}
                onPress={() => saveThemePreference(!darkMode)}
              >
                <View style={[styles.toggleCircle, darkMode && styles.toggleCircleActive]} />
              </TouchableOpacity>
            </View>

            <View style={[styles.settingItem, { borderBottomColor: COLORS.cardBorder }]}>
              <Text style={[styles.settingLabel, { color: COLORS.text }]}>
                Font Size
              </Text>
              <View style={styles.fontSizeOptions}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeOption,
                      fontSize === size && styles.fontSizeOptionActive,
                      { borderColor: COLORS.cardBorder },
                      fontSize === size && { backgroundColor: COLORS.lightGreenFill, borderColor: COLORS.darkGreen }
                    ]}
                    onPress={() => setFontSize(size)}
                  >
                    <Text style={[
                      styles.fontSizeText,
                      { color: COLORS.darkGreen },
                      fontSize === size && { fontWeight: '600' }
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.clearHistoryButton, { backgroundColor: '#dabfbf' }]}
              onPress={clearChat}
            >
              <Text style={[styles.clearHistoryText, { color: '#7e0606' }]}>Clear Chat History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 26 : 50,
    paddingBottom: 18,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  glowBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  glowEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  settingsButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  botAvatarText: {
    fontSize: 18,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  userAvatarText: {
    fontSize: 18,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  botBubble: {
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  largeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  smallText: {
    fontSize: 12,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  typingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingAvatarText: {
    fontSize: 18,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.5,
  },
  typingDot2: {
    opacity: 0.8,
  },
  typingDot3: {
    opacity: 1,
  },
  suggestionsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  suggestionsList: {
    paddingHorizontal: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  suggestionEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputArea: {
    width: '100%',
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 45,
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  disclaimerText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
  fontSizeOptions: {
    flexDirection: 'row',
  },
  fontSizeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
    borderWidth: 1,
  },
  fontSizeOptionActive: {
  },
  fontSizeText: {
    fontSize: 12,
  },
  clearHistoryButton: {
    marginTop: 20,
    marginBottom: 40,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearHistoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
})