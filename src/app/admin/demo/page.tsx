"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import {
  ArrowLeft,
  Video,
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Save,
  X,
  FileUp,
  FileText,
  CheckCircle2
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  pathway: string;
  duration?: string;
  isPublished: boolean;
  createdAt?: unknown;
};

type DemoExam = {
  id: string;
  title: string;
  description: string;
  pathway: string;
  duration?: number;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  createdAt?: unknown;
};

type DemoQuestion = {
  id: string;
  examId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  order: number;
};

const pathways = [
  "MBBS Year 1",
  "MBBS Year 2",
  "MBBS Year 3",
  "MBBS Year 4",
  "MBBS Year 5",
  "MBBS Year 6",
  "MD Year 1",
  "MD Year 2",
  "MD Year 3",
  "MD Year 4",
  "MD Year 5",
  "MD Year 6",
  "NRE",
  "USMLE",
  "PLAB",
  "SMLE",
  "DHA",
  "AMC",
  "FCPS"
];

const demoImportExample =
  "Which chamber pumps blood to the body?|Right atrium|Right ventricle|Left atrium|Left ventricle|D|The left ventricle pumps blood into the aorta.";

export default function DemoManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [exams, setExams] = useState<DemoExam[]>([]);
  const [questions, setQuestions] = useState<DemoQuestion[]>([]);

  const [activeTab, setActiveTab] = useState<"videos" | "exams">("videos");
  const [search, setSearch] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Video form state
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<DemoVideo | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPathway, setVideoPathway] = useState(pathways[0]);

  // Demo exam form state
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<DemoExam | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examPathway, setExamPathway] = useState(pathways[0]);
  const [examDuration, setExamDuration] = useState("30");
  const [examMarks, setExamMarks] = useState("30");

  // Question bank state
  const [selectedExam, setSelectedExam] = useState<DemoExam | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<DemoQuestion | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [questionMarks, setQuestionMarks] = useState("1");

  // Bulk import state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // Authentication and administrator verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.replace("/login");
        return;
      }

      try {
        await currentUser.reload();

        if (!currentUser.emailVerified) {
          await signOut(auth);
          window.location.replace("/login");
          return;
        }

        const profileSnapshot = await getDocs(
          collection(db, "users")
        );

        const profile = profileSnapshot.docs.find(
          (item) => item.id === currentUser.uid
        );

        if (!profile || profile.data().role !== "admin") {
          window.location.replace("/dashboard");
          return;
        }

        setUser(currentUser);
        await loadData();
      } catch (err) {
        console.error(err);
        setError("Unable to verify administrator access.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load all demo content
  async function loadData() {
    setRefreshing(true);
    setError("");

    try {
      const [videoSnapshot, examSnapshot, questionSnapshot] =
        await Promise.all([
          getDocs(collection(db, "demoContent")),
          getDocs(collection(db, "demoExams")),
          getDocs(collection(db, "demoQuestions"))
        ]);

      setVideos(
        videoSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as DemoVideo[]
      );

      setExams(
        examSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as DemoExam[]
      );

      setQuestions(
        questionSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as DemoQuestion[]
      );
    } catch (err) {
      console.error(err);
      setError(
        "Could not load demo content. Check Firestore rules for demoContent, demoExams and demoQuestions."
      );
    } finally {
      setRefreshing(false);
    }
  }

  // Video form helpers
  function resetVideoForm() {
    setVideoTitle("");
    setVideoDescription("");
    setVideoUrl("");
    setVideoPathway(pathways[0]);
    setEditingVideo(null);
    setShowVideoForm(false);
  }

  function startEditVideo(video: DemoVideo) {
    setEditingVideo(video);
    setVideoTitle(video.title);
    setVideoDescription(video.description || "");
    setVideoUrl(video.videoUrl);
    setVideoPathway(video.pathway);
    setShowVideoForm(true);
  }

  async function saveVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(videoUrl.trim());
    } catch {
      setError("Enter a valid video URL beginning with https://");
      return;
    }

    if (!["https:", "http:"].includes(parsedUrl.protocol)) {
      setError("Only HTTP or HTTPS video links are allowed.");
      return;
    }

    if (!videoTitle.trim()) {
      setError("Enter a video title.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const videoData = {
        title: videoTitle.trim(),
        description: videoDescription.trim(),
        videoUrl: videoUrl.trim(),
        pathway: videoPathway,
        updatedAt: serverTimestamp()
      };

      if (editingVideo) {
        await updateDoc(
          doc(db, "demoContent", editingVideo.id),
          videoData
        );

        setSuccess("Demo video updated successfully.");
      } else {
        await addDoc(collection(db, "demoContent"), {
          ...videoData,
          isPublished: false,
          createdAt: serverTimestamp()
        });

        setSuccess("Demo video added as unpublished.");
      }

      resetVideoForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the demo video.");
    } finally {
      setSaving(false);
    }
    }
    // Publish or unpublish a demo video
  async function toggleVideoPublished(video: DemoVideo) {
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "demoContent", video.id), {
        isPublished: !video.isPublished,
        updatedAt: serverTimestamp()
      });

      setSuccess(
        video.isPublished
          ? "Demo video unpublished."
          : "Demo video published."
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not change video publication status.");
    }
  }

  // Delete a demo video
  async function removeVideo(video: DemoVideo) {
    if (!window.confirm(`Delete demo video "${video.title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "demoContent", video.id));
      setSuccess("Demo video deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete demo video.");
    }
  }

  // Demo exam form helpers
  function resetExamForm() {
    setExamTitle("");
    setExamDescription("");
    setExamPathway(pathways[0]);
    setExamDuration("30");
    setExamMarks("30");
    setEditingExam(null);
    setShowExamForm(false);
  }

  function startEditExam(exam: DemoExam) {
    setEditingExam(exam);
    setExamTitle(exam.title);
    setExamDescription(exam.description || "");
    setExamPathway(exam.pathway);
    setExamDuration(String(exam.durationMinutes));
    setExamMarks(String(exam.totalMarks));
    setShowExamForm(true);
  }

  // Create or update a demo exam
  async function saveExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const minutes = Number(examDuration);
    const marks = Number(examMarks);

    if (!examTitle.trim()) {
      setError("Enter a demo exam title.");
      return;
    }

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      setError("Duration must be between 1 and 600 minutes.");
      return;
    }

    if (!Number.isFinite(marks) || marks <= 0) {
      setError("Total marks must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const examData = {
        title: examTitle.trim(),
        description: examDescription.trim(),
        pathway: examPathway,
        durationMinutes: minutes,
        totalMarks: marks,
        updatedAt: serverTimestamp()
      };

      if (editingExam) {
        await updateDoc(
          doc(db, "demoExams", editingExam.id),
          examData
        );

        setSuccess("Demo exam updated successfully.");
      } else {
        await addDoc(collection(db, "demoExams"), {
          ...examData,
          isPublished: false,
          createdAt: serverTimestamp()
        });

        setSuccess("Demo exam created as unpublished.");
      }

      resetExamForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the demo exam.");
    } finally {
      setSaving(false);
    }
  }

  // Publish or unpublish a demo exam
  async function toggleExamPublished(exam: DemoExam) {
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "demoExams", exam.id), {
        isPublished: !exam.isPublished,
        updatedAt: serverTimestamp()
      });

      setSuccess(
        exam.isPublished
          ? "Demo exam unpublished."
          : "Demo exam published."
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not change demo exam publication status.");
    }
  }

  // Delete an exam and all its associated questions
  async function removeExam(exam: DemoExam) {
    const related = questions.filter(
      (question) => question.examId === exam.id
    );

    if (
      !window.confirm(
        `Delete "${exam.title}" and its ${related.length} question(s)?`
      )
    ) {
      return;
    }

    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, "demoExams", exam.id));

      related.forEach((question) => {
        batch.delete(doc(db, "demoQuestions", question.id));
      });

      await batch.commit();

      if (selectedExam?.id === exam.id) {
        setSelectedExam(null);
        setShowQuestionModal(false);
      }

      setSuccess("Demo exam and its questions deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete the demo exam.");
    }
  }
    // Reset question form
  function resetQuestionForm() {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setExplanation("");
    setQuestionMarks("1");
    setEditingQuestion(null);
    setShowQuestionForm(false);
  }

  // Open form to edit a question
  function startEditQuestion(question: DemoQuestion) {
    setEditingQuestion(question);
    setQuestionText(question.question);
    setOptionA(question.options[0] || "");
    setOptionB(question.options[1] || "");
    setOptionC(question.options[2] || "");
    setOptionD(question.options[3] || "");
    setCorrectAnswer(question.correctAnswer);
    setExplanation(question.explanation || "");
    setQuestionMarks(String(question.marks || 1));
    setShowQuestionForm(true);
  }

  // Add or update a question
  async function saveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedExam) {
      setError("Select a demo exam first.");
      return;
    }

    const options = [
      optionA.trim(),
      optionB.trim(),
      optionC.trim(),
      optionD.trim()
    ];

    if (!questionText.trim() || options.some((option) => !option)) {
      setError("Enter the question and all four answer options.");
      return;
    }

    const marks = Number(questionMarks);

    if (!Number.isFinite(marks) || marks <= 0) {
      setError("Question marks must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const questionData = {
        examId: selectedExam.id,
        question: questionText.trim(),
        options,
        correctAnswer,
        explanation: explanation.trim(),
        marks,
        updatedAt: serverTimestamp()
      };

      if (editingQuestion) {
        await updateDoc(
          doc(db, "demoQuestions", editingQuestion.id),
          questionData
        );

        setSuccess("Question updated successfully.");
      } else {
        await addDoc(collection(db, "demoQuestions"), {
          ...questionData,
          order: questions.filter(
            (question) => question.examId === selectedExam.id
          ).length + 1,
          createdAt: serverTimestamp()
        });

        setSuccess("Question added successfully.");
      }

      resetQuestionForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the question.");
    } finally {
      setSaving(false);
    }
  }

  // Delete a question
  async function removeQuestion(questionId: string) {
    if (!window.confirm("Delete this question permanently?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "demoQuestions", questionId));
      setSuccess("Question deleted successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete the question.");
    }
  }

  // Parse bulk import lines
  function parseImportQuestions(text: string) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const fields = line.split("|").map((field) => field.trim());

        if (fields.length < 6) {
          throw new Error(
            `Line ${index + 1}: Expected at least 6 fields separated by |.`
          );
        }

        const [
          question,
          a,
          b,
          c,
          d,
          answer,
          explanationText = ""
        ] = fields;

        const normalizedAnswer = answer.toUpperCase();

        if (!question || !a || !b || !c || !d) {
          throw new Error(
            `Line ${index + 1}: Question and all four options are required.`
          );
        }

        if (!["A", "B", "C", "D"].includes(normalizedAnswer)) {
          throw new Error(
            `Line ${index + 1}: Correct answer must be A, B, C or D.`
          );
        }

        return {
          question,
          options: [a, b, c, d],
          correctAnswer: normalizedAnswer,
          explanation: explanationText,
          marks: 1,
          order: index + 1
        };
      });
  }

  // Import multiple questions into an exam
  async function importQuestions() {
    if (!selectedExam) {
      setError("Select an exam before importing questions.");
      return;
    }

    let parsedQuestions: ReturnType<typeof parseImportQuestions>;

    try {
      parsedQuestions = parseImportQuestions(importText);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The imported question format is invalid."
      );
      return;
    }

    if (parsedQuestions.length === 0) {
      setError("Paste at least one question to import.");
      return;
    }

    if (parsedQuestions.length > 450) {
      setError(
        "Please import no more than 450 questions at one time."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const batch = writeBatch(db);

      parsedQuestions.forEach((question) => {
        const questionRef = doc(collection(db, "demoQuestions"));

        batch.set(questionRef, {
          ...question,
          examId: selectedExam.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();

      setImportText("");
      setShowImport(false);
      setSuccess(
        `${parsedQuestions.length} question(s) imported successfully.`
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not import questions. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Filter demo videos
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(search.toLowerCase()) ||
        video.description.toLowerCase().includes(search.toLowerCase());

      const matchesPathway =
        pathwayFilter === "all" || video.pathway === pathwayFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && video.isPublished) ||
        (statusFilter === "draft" && !video.isPublished);

      return matchesSearch && matchesPathway && matchesStatus;
    });
  }, [videos, search, pathwayFilter, statusFilter]);

  // Filter demo exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        exam.description.toLowerCase().includes(search.toLowerCase());

      const matchesPathway =
        pathwayFilter === "all" || exam.pathway === pathwayFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && exam.isPublished) ||
        (statusFilter === "draft" && !exam.isPublished);

      return matchesSearch && matchesPathway && matchesStatus;
    });
  }, [exams, search, pathwayFilter, statusFilter]);

  // Statistics
  const publishedVideos = videos.filter(
    (video) => video.isPublished
  ).length;

  const publishedExams = exams.filter(
    (exam) => exam.isPublished
  ).length;

  const totalQuestions = questions.length;

  // Logout
  async function handleLogout() {
    await signOut(auth);
    window.location.replace("/login");
}
    return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Back to Admin Dashboard
            </Link>
            <h1 className="mt-1 text-xl font-bold">
              Demo Content Management
            </h1>
            <p className="text-xs text-slate-400">
              Rose Coaching Academy (RCA)
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Demo Library</h2>
            <p className="mt-1 text-sm text-slate-400">
              Manage free demo videos and practice exams for students.
            </p>
          </div>

          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Demo Videos</span>
              <FileText className="h-5 w-5 text-sky-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">{videos.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {publishedVideos} published
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Demo Exams</span>
              <FileText className="h-5 w-5 text-violet-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">{exams.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {publishedExams} published
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Questions</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">{totalQuestions}</p>
            <p className="mt-1 text-xs text-slate-500">
              Across all demo exams
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Draft Content</span>
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {videos.length - publishedVideos +
                exams.length - publishedExams}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Not yet published
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => {
              setActiveTab("videos");
              setSearch("");
              setError("");
              setSuccess("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === "videos"
                ? "bg-sky-500 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Demo Videos
          </button>

          <button
            onClick={() => {
              setActiveTab("exams");
              setSearch("");
              setError("");
              setSuccess("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === "exams"
                ? "bg-sky-500 text-white"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Demo Exams
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 md:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search demo ${activeTab}...`}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-sky-500"
          />

          <select
            value={pathwayFilter}
            onChange={(event) => setPathwayFilter(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
          >
            <option value="all">All Pathways</option>
            {pathways.map((pathway) => (
              <option key={pathway} value={pathway}>
                {pathway}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Demo videos */}
        {activeTab === "videos" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold">Demo Videos</h3>
                <p className="text-sm text-slate-400">
                  Add free preview lessons for prospective students.
                </p>
              </div>

              <button
                onClick={() => {
                  resetVideoForm();
                  setShowVideoForm(true);
                }}
                className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold hover:bg-sky-400"
              >
                + Add Demo Video
              </button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
                Loading demo videos...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 bg-slate-900 p-10 text-center">
                <FileText className="mx-auto mb-3 h-9 w-9 text-slate-500" />
                <p className="font-medium">No demo videos found</p>
                <p className="mt-1 text-sm text-slate-400">
                  Add a video or change your search filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredVideos.map((video) => (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
                  >
                    <div className="flex aspect-video items-center justify-center bg-slate-800">
                      <FileText className="h-12 w-12 text-slate-600" />
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{video.title}</h4>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                            video.isPublished
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {video.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="line-clamp-3 text-sm text-slate-400">
                        {video.description}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded-md bg-slate-800 px-2 py-1">
                          {video.pathway}
                        </span>
                        {video.duration && (
                          <span className="rounded-md bg-slate-800 px-2 py-1">
                            {video.duration}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                        <button
                          onClick={() => startEditVideo(video)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => toggleVideoPublished(video)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                        >
                          {video.isPublished ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          onClick={() => removeVideo(video)}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Demo exams */}
        {activeTab === "exams" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold">Demo Exams</h3>
                <p className="text-sm text-slate-400">
                  Create practice exams and manage their MCQs.
                </p>
              </div>

              <button
                onClick={() => {
                  resetExamForm();
                  setShowExamForm(true);
                }}
                className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold hover:bg-sky-400"
              >
                + Create Demo Exam
              </button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
                Loading demo exams...
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 bg-slate-900 p-10 text-center">
                <FileText className="mx-auto mb-3 h-9 w-9 text-slate-500" />
                <p className="font-medium">No demo exams found</p>
                <p className="mt-1 text-sm text-slate-400">
                  Create an exam or change your search filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredExams.map((exam) => {
                  const examQuestions = questions.filter(
                    (question) => question.examId === exam.id
                  );

                  return (
                    <article
                      key={exam.id}
                      className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold">
                            {exam.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-400">
                            {exam.description}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            exam.isPublished
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {exam.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded-md bg-slate-800 px-2 py-1">
                          {exam.pathway}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-1">
                          {examQuestions.length} Questions
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-1">
                          {exam.duration} Minutes
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        <button
                          onClick={() => {
                            setSelectedExam(exam);
                            setShowQuestionForm(false);
                            setShowImport(false);
                            setError("");
                            setSuccess("");
                          }}
                          className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold hover:bg-sky-400"
                        >
                          Manage Questions
                        </button>

                        <button
                          onClick={() => startEditExam(exam)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                        >
                          Edit Exam
                        </button>

                        <button
                          onClick={() => toggleExamPublished(exam)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                        >
                          {exam.isPublished ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          onClick={() => removeExam(exam)}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
                {/* Selected exam question manager */}
        {activeTab === "exams" && selectedExam && (
          <section className="space-y-5 rounded-2xl border border-sky-500/30 bg-slate-900 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-sky-400">
                  Question Manager
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  {selectedExam.title}
                </h3>
                <p className="text-sm text-slate-400">
                  {questions.filter(
                    (question) => question.examId === selectedExam.id
                  ).length}{" "}
                  questions added
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedExam(null);
                  resetQuestionForm();
                  setShowImport(false);
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
              >
                Close Question Manager
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  resetQuestionForm();
                  setShowQuestionForm(true);
                  setShowImport(false);
                }}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold hover:bg-sky-400"
              >
                + Add Question
              </button>

              <button
                onClick={() => {
                  setShowImport(true);
                  setShowQuestionForm(false);
                  setError("");
                }}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                <FileUp className="h-4 w-4" />
                Bulk Import
              </button>
            </div>

            {/* Question form */}
            {showQuestionForm && (
              <form
                onSubmit={saveQuestion}
                className="space-y-4 rounded-xl border border-white/10 bg-slate-950 p-5"
              >
                <h4 className="font-semibold">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h4>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Question
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-sky-500"
                    placeholder="Enter your MCQ question..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Option A",
                      value: optionA,
                      setter: setOptionA
                    },
                    {
                      label: "Option B",
                      value: optionB,
                      setter: setOptionB
                    },
                    {
                      label: "Option C",
                      value: optionC,
                      setter: setOptionC
                    },
                    {
                      label: "Option D",
                      value: optionD,
                      setter: setOptionD
                    }
                  ].map((option) => (
                    <div key={option.label}>
                      <label className="mb-2 block text-sm text-slate-300">
                        {option.label}
                      </label>
                      <input
                        value={option.value}
                        onChange={(event) =>
                          option.setter(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-sky-500"
                        placeholder={`${option.label} answer`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Correct Answer
                    </label>
                    <select
                      value={correctAnswer}
                      onChange={(event) =>
                        setCorrectAnswer(
                          event.target.value as "A" | "B" | "C" | "D"
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={questionMarks}
                      onChange={(event) =>
                        setQuestionMarks(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-sky-500"
                    placeholder="Explain why this answer is correct..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold hover:bg-sky-400 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingQuestion
                        ? "Update Question"
                        : "Save Question"}
                  </button>

                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="rounded-lg border border-white/10 px-5 py-2.5 text-sm hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Bulk import form */}
            {showImport && (
              <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950 p-5">
                <div>
                  <h4 className="font-semibold">Bulk Import Questions</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    Paste one question per line using the format below.
                  </p>
                </div>

                <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                  <p className="mb-2 text-xs font-semibold text-sky-300">
                    FORMAT
                  </p>
                  <code className="block break-all text-xs leading-6 text-slate-300">
                    Question | Option A | Option B | Option C | Option D |
                    Correct Answer | Explanation
                  </code>
                  <button
                    type="button"
                    onClick={() => GenUI.copy(demoImportExample)}
                    className="mt-3 text-xs font-medium text-sky-400 hover:text-sky-300"
                  >
                    Copy example
                  </button>
                </div>

                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={9}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-3 font-mono text-xs outline-none focus:border-sky-500"
                  placeholder={demoImportExample}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={importQuestions}
                    disabled={saving}
                    className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold hover:bg-sky-400 disabled:opacity-50"
                  >
                    {saving ? "Importing..." : "Import Questions"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowImport(false);
                      setImportText("");
                    }}
                    className="rounded-lg border border-white/10 px-5 py-2.5 text-sm hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Existing questions */}
            <div className="space-y-3">
              <h4 className="font-semibold">Exam Questions</h4>

              {questions.filter(
                (question) => question.examId === selectedExam.id
              ).length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No questions added to this exam yet.
                  </p>
                </div>
              ) : (
                questions
                  .filter(
                    (question) => question.examId === selectedExam.id
                  )
                  .map((question, index) => (
                    <article
                      key={question.id}
                      className="rounded-xl border border-white/10 bg-slate-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-sky-400">
                            Question {index + 1} · {question.marks || 1} mark(s)
                          </p>
                          <h5 className="mt-2 font-medium">
                            {question.question}
                          </h5>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => startEditQuestion(question)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => {
                          const letter = ["A", "B", "C", "D"][optionIndex];
                          const isCorrect =
                            letter === question.correctAnswer;

                          return (
                            <div
                              key={letter}
                              className={`rounded-lg border p-3 text-sm ${
                                isCorrect
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                  : "border-white/10 bg-slate-900 text-slate-400"
                              }`}
                            >
                              <span className="mr-2 font-semibold">
                                {letter}.
                              </span>
                              {option}
                              {isCorrect && (
                                <span className="ml-2 text-xs">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <div className="mt-3 rounded-lg bg-slate-900 p-3 text-sm text-slate-400">
                          <span className="font-semibold text-slate-300">
                            Explanation:{" "}
                          </span>
                          {question.explanation}
                        </div>
                      )}
                    </article>
                  ))
              )}
            </div>
          </section>
        )}

        {/* Video form modal */}
        {showVideoForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
            <form
              onSubmit={saveVideo}
              className="my-8 w-full max-w-xl space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingVideo ? "Edit Demo Video" : "Add Demo Video"}
                </h3>
                <button
                  type="button"
                  onClick={resetVideoForm}
                  className="text-2xl text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Video Title
                </label>
                <input
                  value={videoTitle}
                  onChange={(event) => setVideoTitle(event.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Description
                </label>
                <textarea
                  value={videoDescription}
                  onChange={(event) =>
                    setVideoDescription(event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500"
                  placeholder="Describe this demo lesson"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Pathway
                  </label>
                  <select
                    value={videoPathway}
                    onChange={(event) => setVideoPathway(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
                  >
                    {pathways.map((pathway) => (
                      <option key={pathway} value={pathway}>
                        {pathway}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Duration
                  </label>
                  <input
                    value={videoDuration}
                    onChange={(event) =>
                      setVideoDuration(event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
                    placeholder="e.g. 15 minutes"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={videoPublished}
                  onChange={(event) =>
                    setVideoPublished(event.target.checked)
                  }
                  className="h-4 w-4 accent-sky-500"
                />
                Publish this video immediately
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold hover:bg-sky-400 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingVideo
                      ? "Update Video"
                      : "Save Video"}
                </button>

                <button
                  type="button"
                  onClick={resetVideoForm}
                  className="rounded-lg border border-white/10 px-5 py-2.5 text-sm hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Exam form modal */}
        {showExamForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
            <form
              onSubmit={saveExam}
              className="my-8 w-full max-w-xl space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingExam ? "Edit Demo Exam" : "Create Demo Exam"}
                </h3>

                <button
                  type="button"
                  onClick={resetExamForm}
                  className="text-2xl text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Exam Title
                </label>

                <input
                  value={examTitle}
                  onChange={(event) => setExamTitle(event.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500"
                  placeholder="Enter exam title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Description
                </label>

                <textarea
                  value={examDescription}
                  onChange={(event) =>
                    setExamDescription(event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-sky-500"
                  placeholder="Describe the demo exam"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Pathway
                  </label>

                  <select
                    value={examPathway}
                    onChange={(event) =>
                      setExamPathway(event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
                  >
                    {pathways.map((pathway) => (
                      <option key={pathway} value={pathway}>
                        {pathway}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Duration (minutes)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={examDuration}
                    onChange={(event) =>
                      setExamDuration(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
                    placeholder="e.g. 30"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={examPublished}
                  onChange={(event) =>
                    setExamPublished(event.target.checked)
                  }
                  className="h-4 w-4 accent-sky-500"
                />
                Publish this exam immediately
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold hover:bg-sky-400 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingExam
                      ? "Update Exam"
                      : "Create Exam"}
                </button>

                <button
                  type="button"
                  onClick={resetExamForm}
                  className="rounded-lg border border-white/10 px-5 py-2.5 text-sm hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <footer className="border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          Rose Coaching Academy (RCA) · Demo Content Administration
        </footer>
      </main>
    </div>
  );
}
                
