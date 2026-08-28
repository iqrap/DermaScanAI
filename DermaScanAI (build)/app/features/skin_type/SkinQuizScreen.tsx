import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Button, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../../../src/config/firebase";
import { saveSkinTypeResult, type SavedSkinTypeResult } from "../../../src/utils/storageUtils";
import { saveToFirestore, getLatestSkinResult } from "../../../src/utils/firestoreUtils";
import quizQuestionsData from "../../data/skin_quiz_questions.json";
import { apiService } from "../../../src/services/apiService";

const { width } = Dimensions.get("window");

interface Question {
  id: number;
  question: string;
  options: string[];
  weights?: {
    [key: string]: number | undefined;
  };
  tag?: string;
}

export default function QuizScreen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<{ [key: number]: { answer: string; questionIndex: number } }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const cardAnimation = useRef(new Animated.Value(0)).current;

  const baseQuestions: Question[] = quizQuestionsData.baseQuestions;
  const followUpPool: Question[] = quizQuestionsData.followUpQuestions;

  const signals = useMemo(() => {
    let oily = 0, dry = 0, sensitiveCount = 0, combo = 0, normal = 0;
    Object.entries(answers).forEach(([qId, answerData]) => {
      const questionId = parseInt(qId);
      const question = [...baseQuestions, ...followUpPool].find(q => q.id === questionId);
      if (question) {
        const answer = answerData.answer.toLowerCase();
        if (answer.includes("oily") || answer.includes("greasy") || answer.includes("shiny")) oily += 1;
        if (answer.includes("dry") || answer.includes("tight") || answer.includes("flaky")) dry += 1;
        if (answer.includes("red") || answer.includes("sensitive") || answer.includes("sting")) sensitiveCount += 1;
        if (answer.includes("t-zone") || answer.includes("combination")) combo += 1;
        if (answer.includes("balanced") || answer.includes("normal")) normal += 1;
      }
    });
    return { oily, dry, sensitive: sensitiveCount, combo, normal };
  }, [answers]);

  const maxFollowUps = 5;
  const dynamicFollowUps = useMemo(() => {
    const added: number[] = [];
    for (let p of [
      { tag: "oily", score: signals.oily },
      { tag: "dry", score: signals.dry },
      { tag: "sensitive", score: signals.sensitive },
      { tag: "combo", score: signals.combo },
    ].sort((a, b) => b.score - a.score)) {
      if (added.length >= maxFollowUps) break;
      if (p.score <= 0) continue;
      const candidates = followUpPool.filter(f => f.tag === p.tag && !added.includes(f.id));
      for (let c of candidates) {
        if (added.length >= maxFollowUps) break;
        added.push(c.id);
      }
    }
    if (added.length < maxFollowUps) {
      for (let f of followUpPool) {
        if (added.length >= maxFollowUps) break;
        if (!added.includes(f.id)) added.push(f.id);
      }
    }
    return added.map(id => followUpPool.find(f => f.id === id)!).filter(Boolean);
  }, [signals]);

  const dynamicQuestions = useMemo(() => {
    const followups = dynamicFollowUps.map(f => ({ id: f.id, question: f.question, options: f.options }));
    return [...baseQuestions, ...followups];
  }, [dynamicFollowUps]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progress = (answeredCount / dynamicQuestions.length) * 100;
  const progressBarAnimated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressBarAnimated, { toValue: progress, duration: 480, useNativeDriver: false }).start();
  }, [progress]);

  useEffect(() => {
    cardAnimation.setValue(0);
    Animated.timing(cardAnimation, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [currentQuestionIndex]);

  const progressWidth = progressBarAnimated.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const cardSlideStyle = {
    opacity: cardAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateX: cardAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [width * 0.5, 0],
        }),
      },
    ],
  };

  const handleSelect = useCallback((qId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { answer: option, questionIndex: 0 } }));
  }, []);

  // Icons for each question's options
  const getOptionIcons = (questionId: number): string[] => {
    const iconMap: Record<number, string[]> = {
      1: ['sunny', 'happy-outline', 'rainy', 'partly-sunny'],
      2: ['eye-off', 'scan', 'ellipse', 'alert-circle'],
      3: ['close-circle', 'warning', 'location', 'time'],
      4: ['flame', 'alert', 'shield-checkmark', 'water'],
      5: ['snow', 'thermometer', 'cloud', 'sunny'],
      6: ['sunny', 'water', 'partly-sunny', 'happy-outline'],
      7: ['sunny', 'moon', 'partly-sunny', 'sparkles'],
      8: ['sunny', 'rainy', 'partly-sunny', 'alert', 'happy-outline'],
      101: ['time', 'time', 'time', 'moon'],
      102: ['sad-outline', 'happy-outline', 'happy-outline', 'remove'],
      103: ['flame', 'alert', 'shield-checkmark', 'checkmark-circle'],
      104: ['water', 'layers', 'ellipse', 'sunny'],
    };
    return iconMap[questionId] || ['ellipse', 'ellipse', 'ellipse', 'ellipse'];
  };

  const handleNext = () => {
    const currentQId = dynamicQuestions[currentQuestionIndex]?.id;
    if (!answers[currentQId]?.answer) {
      Alert.alert("Required", "Please select an answer before proceeding.");
      return;
    }
    if (currentQuestionIndex < dynamicQuestions.length - 1)
      setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0)
      setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const currentQuestion = dynamicQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === dynamicQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const analyzeWithGroq = async (userAnswers: { question: string; answer: string }[]) => {
    try {
      const result = await apiService.analyzeSkinQuiz(userAnswers);
      return result;
    } catch (error) {
      console.log("GROQ API error:", error);
      throw error;
    }
  };

  const saveResultToStorage = async (result: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("User not authenticated, skipping save");
        return null;
      }

      const userId = user.uid;
      const timestamp = Date.now();
      
      const firestoreData = {
        skinType: result.skinType + " Skin",
        clinicalDescription: result.clinicalDescription,
        dailyRoutine: result.dailyRoutine,
        ingredients: result.ingredients,
        productTextures: result.productTextures,
        mistakes: result.mistakes,
        lifestyle: result.lifestyle,
        fromAI: true,
        timestamp: timestamp,
        resultId: `${userId}_${timestamp}`
      };
      
      const savedId = await saveToFirestore("skinTypeResults", firestoreData);
      console.log("✅ Saved to Firestore with ID:", savedId);
      
      await AsyncStorage.setItem(`lastFullResult_${userId}`, JSON.stringify(result));
      await AsyncStorage.setItem(`lastFirestoreId_${userId}`, savedId || "");
      
      const resultData: SavedSkinTypeResult = {
        id: timestamp.toString(),
        timestamp: timestamp,
        skinType: result.skinType + " Skin",
        description: result.clinicalDescription || result.description || "Your skin type analysis",
        sideEffects: [],
        avoid: result.ingredients?.avoid || result.avoid || [],
        tips: result.dailyRoutine?.morning || result.tips || [],
        recommendedIngredients: result.ingredients?.lookFor || [],
        
        clinicalDescription: result.clinicalDescription,
        dailyRoutine: result.dailyRoutine,
        ingredients: result.ingredients,
        productTextures: result.productTextures,
        mistakes: result.mistakes,
        lifestyle: result.lifestyle,
        
        firestoreId: savedId || undefined
      };
      
      await saveSkinTypeResult(resultData);
      console.log("✅ Result saved to AsyncStorage with 6 sections");
      
      return savedId;
    } catch (error) {
      console.log("Error saving result:", error);
      return null;
    }
  };

  const calculateSkinType = async () => {
    const baseAnswered = baseQuestions.every(q => answers[q.id]?.answer);

    if (!baseAnswered) {
      Alert.alert("Incomplete", "Please answer all core questions before submitting.");
      return;
    }

    setLoading(true);

    try {
      const userAnswers = Object.entries(answers).map(([qId, answerData]) => {
        const question = [...baseQuestions, ...followUpPool].find(q => q.id === parseInt(qId));
        return {
          question: question?.question || "",
          answer: answerData.answer
        };
      });

      const groqResult = await analyzeWithGroq(userAnswers);

      if (groqResult) {
        console.log("✅ Using Groq result with 6 sections");
        
        const firestoreId = await saveResultToStorage(groqResult);
        
        router.push({
          pathname: "/features/skin_type/SkinResultScreen",
          params: { 
            skinType: groqResult.skinType + " Skin",
            clinicalDescription: groqResult.clinicalDescription || "Your skin type analysis",
            dailyRoutine: JSON.stringify(groqResult.dailyRoutine || { morning: [], evening: [] }),
            ingredients: JSON.stringify(groqResult.ingredients || { lookFor: [], avoid: [] }),
            productTextures: JSON.stringify(groqResult.productTextures || {}),
            mistakes: JSON.stringify(groqResult.mistakes || []),
            lifestyle: JSON.stringify(groqResult.lifestyle || { diet: [], habits: [], sleep: "", water: "", exercise: "" }),
            description: groqResult.clinicalDescription,
            tips: JSON.stringify(groqResult.dailyRoutine?.morning || []),
            avoid: JSON.stringify(groqResult.ingredients?.avoid || []),
            firestoreId: firestoreId || "",
            fromAI: "true"
          },
        });
      }
    } catch (error) {
      console.log("Error in calculateSkinType:", error);
      Alert.alert(
        "Analysis Failed",
        "Unable to analyze your skin type at the moment. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <ActivityIndicator size="large" color="#006B5F" />
            <Text style={styles.loadingText}>Analyzing your skin type...</Text>
          </View>
        </View>
      </Modal>

      <LinearGradient
        colors={["#75a78fff", "#558d74ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.simpleHeader}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push("/"))}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextWrapper}>
          <Text style={styles.simpleHeaderTitle}>Skin Type Quiz</Text>
          <Text style={styles.simpleHeaderSubTitle}>Find your perfect skincare routine</Text>
        </View>
      </LinearGradient>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{answeredCount}/{dynamicQuestions.length} Answered</Text>

        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.animatedWrapper, { width: progressWidth }]}>
            <LinearGradient
              colors={["#A8E6CF", "#5c7a6cff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        <Card style={[styles.infoCard, styles.descriptionCard]}>
          <View style={styles.descHeaderRow}>
            <View style={styles.descIconCircle}>
              <Ionicons name="information-circle-outline" size={18} color="#0d5a47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.descBadge}>Quiz Instructions</Text>
            </View>
          </View>
          <Text style={styles.cardText}>
            Answer each question honestly to determine your skin type and get comprehensive skincare advice with 6 important sections.
          </Text>
        </Card>

        <Animated.View key={currentQuestion.id} style={[styles.questionCardContainer, cardSlideStyle]}>
          <Card style={styles.questionCard}>
            <Text style={styles.questionTitle}>
              Q{currentQuestionIndex + 1}. {currentQuestion.question}
            </Text>

            <View style={styles.optionGrid}>
              {currentQuestion.options.map((opt, i) => {
                const selected = answers[currentQuestion.id]?.answer === opt;
                const icons = getOptionIcons(currentQuestion.id);
                const icon = icons[i] || 'ellipse-outline';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.gridOption, selected && styles.gridOptionSelected]}
                    onPress={() => handleSelect(currentQuestion.id, opt)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.gridOptionIcon, selected && styles.gridOptionIconSelected]}>
                      {selected ? (
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      ) : (
                        <Ionicons name={icon as any} size={20} color="#4CAF50" />
                      )}
                    </View>
                    <Text style={[styles.gridOptionTitle, selected && styles.gridOptionTitleSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <View style={styles.navContainer}>
          <Button
            mode="outlined"
            onPress={handlePrevious}
            disabled={isFirstQuestion}
            labelStyle={{ color: isFirstQuestion ? "#A0A0A0" : "#006B5F", fontWeight: "600" }}
            style={[styles.navBtn, isFirstQuestion && styles.disabledBtn]}
          >
            <Ionicons name="arrow-back" size={16} color={isFirstQuestion ? "#A0A0A0" : "#006B5F"} /> Previous
          </Button>

          {isLastQuestion ? (
            <LinearGradient colors={["#75a78fff", "#558d74ff"]} style={styles.submitGradient}>
              <Button
                mode="contained"
                onPress={calculateSkinType}
                labelStyle={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                style={styles.submitBtn}
              >
                Get Results
              </Button>
            </LinearGradient>
          ) : (
            <Button
              mode="contained"
              onPress={handleNext}
              labelStyle={{ color: "#fff", fontWeight: "600" }}
              style={[styles.navBtn, { backgroundColor: answers[currentQuestion.id]?.answer ? "#006B5F" : "#A0A0A0", borderWidth: 0 }]}
              disabled={!answers[currentQuestion.id]?.answer}
            >
              Next <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f9f4", paddingTop: Platform.OS === "android" ? 25 : 0 },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 32,
    paddingBottom: 14,
    elevation: 3,
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  simpleHeaderSubTitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)" },
  progressContainer: { paddingHorizontal: 14, marginTop: 10, marginBottom: 6 },
  progressText: { fontSize: 11, color: "#006B5F", marginBottom: 4, fontWeight: "600" },
  progressBarBackground: { width: "100%", height: 8, backgroundColor: "#E6F6F1", borderRadius: 10, overflow: "hidden" },
  animatedWrapper: { height: "100%" },
  progressGradient: { flex: 1, borderRadius: 10 },
  questionCardContainer: { marginHorizontal: 10, marginVertical: 6 },
  questionCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, elevation: 4 },
  questionTitle: { fontSize: 15, fontWeight: "700", color: "#006B5F", marginBottom: 14 },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridOption: {
    width: '48%',
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E8F0EC',
  },
  gridOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  gridOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  gridOptionIconSelected: {
    backgroundColor: '#4CAF50',
  },
  gridOptionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    textAlign: 'left',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  gridOptionTitleSelected: {
    color: '#1B5E20',
  },
  gridOptionSubtitle: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  gridOptionSubtitleSelected: {
    color: '#2E7D32',
  },
  navContainer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, marginTop: 15, marginBottom: 10 },
  navBtn: { flex: 1, marginHorizontal: 4, borderRadius: 8, paddingVertical: 6 },
  disabledBtn: { borderColor: "#A0A0A0", opacity: 0.5 },
  submitGradient: { flex: 1, marginHorizontal: 4, borderRadius: 8 },
  submitBtn: { borderRadius: 8, backgroundColor: "transparent", paddingVertical: 6 },
  infoCard: {
    width: "92%",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    alignSelf: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  descriptionCard: {
    marginTop: 6,
    backgroundColor: "#E6F4EF",
    borderLeftWidth: 4,
    borderLeftColor: "#558d74ff",
  },
  descHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  descIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffffffcc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  descBadge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#558d74ff",
    marginBottom: 2,
  },
  cardText: { color: "#333", marginTop: 2, lineHeight: 18, fontSize: 12 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: 250,
    padding: 25,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    elevation: 6,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: "600",
    color: "#006B5F",
    textAlign: "center",
  },
});