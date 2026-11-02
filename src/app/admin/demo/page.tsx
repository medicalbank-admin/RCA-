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
  updateDoc
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
  isPublished: boolean;
  createdAt?: unknown;
};

type DemoExam = {
  id: string;
  title: string;
  description: string;
  pathway: string;
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
  "MBBS Year 1", "MBBS Year 2", "MBBS Year 3",
  "MBBS Year 4", "MBBS Year 5", "MBBS Year 6",
  "MD Year 1", "MD Year 2", "MD Year 3",
  "MD Year 4", "MD Year 5", "MD Year 6",
  "NRE", "USMLE", "PLAB", "SMLE", "DHA", "AMC", "FCPS"
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

        const { getDoc } = await import("firebase/firestore");
        const profile = await getDoc(doc(db, "users", currentUser.uid));

        if (!profile.exists() || profile.data().role !== "admin") {
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
        "Could not load demo content. Check the Firestore rules for demoContent, demoExams and demoQuestions."
      );
    } finally {
      setRefreshing(false);
    }
  }

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

  async function removeVideo(video: DemoVideo) {
    if (!window.confirm(`Delete demo video "${video.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "demoContent", video.id));
      setSuccess("Demo video deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete demo video.");
    }
}
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
        await updateDoc(doc(db, "demoExams", editingExam.id), examData);
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

  async function removeExam(exam: DemoExam) {
    const related = questions.filter(
      (question) => question.examId === exam.id
    );

    if (
      !window.confirm(
        `Delete "${exam.title}" and its ${related.length} question(s)?`
      )
    ) return;

    try {
      const { writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);

      batch.delete(doc(db, "demoExams", exam.id));

      related.forEach((question) => {
        batch.delete(doc(db, "demoQuestions", question.id));
      });

      await batch.commit();

      if (selectedExam?.id === exam.id) {
        setSelectedExam(null);
      }

      setSuccess("Demo exam and its questions deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete the demo exam.");
    }
  }

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
        setSuccess("Demo question updated.");
      } else {
        await addDoc(collection(db, "demoQuestions"), {
          ...questionData,
          order: questions.filter(
            (item) => item.examId === selectedExam.id
          ).length + 1,
          createdAt: serverTimestamp()
        });
        setSuccess("Demo question added.");
      }

      resetQuestionForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the demo question.");
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion(question: DemoQuestion) {
    if (!window.confirm("Delete this demo question permanently?")) return;

    try {
      await deleteDoc(doc(db, "demoQuestions", question.id));
      setSuccess("Demo question deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete this demo question.");
    }
  }

  async function importQuestions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedExam) {
      setError("Select a demo exam first.");
      return;
    }

    const lines = importText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError("Paste at least one question.");
      return;
    }

    if (lines.length > 400) {
      setError("Import is limited to 400 questions at a time.");
      return;
    }

    let parsed: Omit<DemoQuestion, "id">[];

    try {
      parsed = lines.map((line, index) => {
        const fields = line.split("|").map((field) => field.trim());

        if (fields.length !== 7) {
          throw new Error(
            `Line ${index + 1}: expected 7 fields separated by |.`
          );
        }

        const [
          question,
          a,
          b,
          c,
          d,
          answer,
          explanationText
        ] = fields;

        const normalizedAnswer = answer.toUpperCase();

        if (
          !question || !a || !b || !c || !d ||
          !["A", "B", "C", "D"].includes(normalizedAnswer)
        ) {
          throw new Error(
            `Line ${index + 1}: fill all fields and use A, B, C or D as the answer.`
          );
        }

        return {
          examId: selectedExam.id,
          question,
          options: [a, b, c, d],
          correctAnswer: normalizedAnswer,
          explanation: explanationText,
          marks: 1,
          order:
            questions.filter(
              (item) => item.examId === selectedExam.id
            ).length + index + 1
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid import format."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);

      parsed.forEach((question) => {
        const newQuestion = doc(collection(db, "demoQuestions"));
        batch.set(newQuestion, {
          ...question,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();

      setImportText("");
      setShowImport(false);
      setSuccess(`${parsed.length} demo question(s) imported.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not import demo questions.");
    } finally {
      setSaving(false);
    }
  }

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(search.toLowerCase()) ||
        video.pathway.toLowerCase().includes(search.toLowerCase());

      const matchesPathway =
        pathwayFilter === "all" || video.pathway === pathwayFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && video.isPublished) ||
        (statusFilter === "draft" && !video.isPublished);

      return matchesSearch && matchesPathway && matchesStatus;
    });
  }, [videos, search, pathwayFilter, statusFilter]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        exam.pathway.toLowerCase().includes(search.toLowerCase());

      const matchesPathway =
        pathwayFilter === "all" || exam.pathway === pathwayFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && exam.isPublished) ||
        (statusFilter === "draft" && !exam.isPublished);

      return matchesSearch && matchesPathway && matchesStatus;
    });
  }, [exams, search, pathwayFilter, statusFilter]);

  const selectedQuestions = selectedExam
    ? questions
        .filter((question) => question.examId === selectedExam.id)
        .sort((a, b) => a.order - b.order)
    : [];

  const publishedVideos = videos.filter((video) => video.isPublished).length;
  const publishedExams = exams.filter((exam) => exam.isPublished).length;
    const totalPublished =
    publishedVideos + publishedExams;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">
          Checking administrator access...
        </p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={19} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Demo Content Management
              </h1>
              <p className="text-sm text-slate-500">
                Manage free videos and demo examinations
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              signOut(auth).then(() => {
                window.location.replace("/login");
              })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-sm font-semibold"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <SummaryCard
            title="Total Videos"
            value={videos.length}
            icon={<Video size={22} />}
          />
          <SummaryCard
            title="Published Videos"
            value={publishedVideos}
            icon={<Eye size={22} />}
          />
          <SummaryCard
            title="Total Demo Exams"
            value={exams.length}
            icon={<ClipboardList size={22} />}
          />
          <SummaryCard
            title="Published Content"
            value={totalPublished}
            icon={<CheckCircle2 size={22} />}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Demo Library</h2>
              <p className="text-sm text-slate-500">
                Manage the free learning resources offered by RCA.
              </p>
            </div>

            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === "videos"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Video size={17} />
              Demo Videos
            </button>

            <button
              onClick={() => setActiveTab("exams")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === "exams"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <ClipboardList size={17} />
              Demo Exams
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search demo content..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <select
              value={pathwayFilter}
              onChange={(event) => setPathwayFilter(event.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">All pathways</option>
              {pathways.map((pathway) => (
                <option key={pathway} value={pathway}>
                  {pathway}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {activeTab === "videos" && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold">Demo Videos</h2>

              <button
                onClick={() => {
                  resetVideoForm();
                  setShowVideoForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                <Plus size={17} />
                Add Video
              </button>
            </div>

            {showVideoForm && (
              <form
                onSubmit={saveVideo}
                className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 space-y-4"
              >
                <h3 className="font-bold">
                  {editingVideo ? "Edit Demo Video" : "Add Demo Video"}
                </h3>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Video Title
                  </label>
                  <input
                    value={videoTitle}
                    onChange={(event) => setVideoTitle(event.target.value)}
                    required
                    className="w-full p-3 rounded-lg border border-slate-200"
                    placeholder="Enter video title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(event) =>
                      setVideoDescription(event.target.value)
                    }
                    rows={3}
                    className="w-full p-3 rounded-lg border border-slate-200"
                    placeholder="Describe this demo video"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    required
                    className="w-full p-3 rounded-lg border border-slate-200"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use a public or appropriately shared video link.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Medical Pathway
                  </label>
                  <select
                    value={videoPathway}
                    onChange={(event) => setVideoPathway(event.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                  >
                    {pathways.map((pathway) => (
                      <option key={pathway} value={pathway}>
                        {pathway}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Video"}
                  </button>

                  <button
                    type="button"
                    onClick={resetVideoForm}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {filteredVideos.length === 0 ? (
              <EmptyState message="No demo videos found." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredVideos.map((video) => (
                  <article
                    key={video.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                          {video.pathway}
                        </span>
                        <h3 className="font-bold text-lg mt-3">
                          {video.title}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          video.isPublished
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {video.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      {video.description || "No description provided."}
                    </p>

                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm font-semibold text-blue-700 underline break-all"
                    >
                      Open video link
                    </a>

                    <div className="flex flex-wrap gap-2 mt-5">
                      <button
                        onClick={() => startEditVideo(video)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
                      >
                        <Edit size={16} />
                        Edit
                      </button>

                      <button
                        onClick={() => toggleVideoPublished(video)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
                      >
                        {video.isPublished ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                        {video.isPublished ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        onClick={() => removeVideo(video)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "exams" && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold">Demo Exams</h2>

              <button
                onClick={() => {
                  resetExamForm();
                  setShowExamForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                <Plus size={17} />
                Create Demo Exam
              </button>
            </div>

            {showExamForm && (
              <form
                onSubmit={saveExam}
                className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 space-y-4"
              >
                <h3 className="font-bold">
                  {editingExam ? "Edit Demo Exam" : "Create Demo Exam"}
                </h3>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Exam Title
                  </label>
                  <input
                    value={examTitle}
                    onChange={(event) => setExamTitle(event.target.value)}
                    required
                    className="w-full p-3 rounded-lg border border-slate-200"
                    placeholder="Enter exam title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={examDescription}
                    onChange={(event) =>
                      setExamDescription(event.target.value)
                    }
                    rows={3}
                    className="w-full p-3 rounded-lg border border-slate-200"
                    placeholder="Describe this demo exam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Medical Pathway
                  </label>
                  <select
                    value={examPathway}
                    onChange={(event) => setExamPathway(event.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                  >
                    {pathways.map((pathway) => (
                      <option key={pathway} value={pathway}>
                        {pathway}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={examDuration}
                      onChange={(event) =>
                        setExamDuration(event.target.value)
                      }
                      required
                      className="w-full p-3 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={examMarks}
                      onChange={(event) => setExamMarks(event.target.value)}
                      required
                      className="w-full p-3 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Demo Exam"}
                  </button>

                  <button
                    type="button"
                    onClick={resetExamForm}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {filteredExams.length === 0 ? (
              <EmptyState message="No demo exams found." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredExams.map((exam) => {
                  const count = questions.filter(
                    (question) => question.examId === exam.id
                  ).length;

                  return (
                    <article
                      key={exam.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                            {exam.pathway}
                          </span>
                          <h3 className="font-bold text-lg mt-3">
                            {exam.title}
                          </h3>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            exam.isPublished
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {exam.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 mt-2">
                        {exam.description || "No description provided."}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                      <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xl font-bold text-slate-900">
                  {count}
                </p>
                <p className="text-xs text-slate-500">
                  Questions
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xl font-bold text-slate-900">
                  {exam.durationMinutes}
                </p>
                <p className="text-xs text-slate-500">
                  Minutes
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xl font-bold text-slate-900">
                  {exam.totalMarks}
                </p>
                <p className="text-xs text-slate-500">
                  Total Marks
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedExam(exam);
                  setShowQuestionModal(true);
                }}
                className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Manage Questions
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingExam(exam);
                  setExamTitle(exam.title);
                  setExamDescription(exam.description || "");
                  setExamPathway(exam.pathway);
                  setExamDuration(String(exam.durationMinutes));
                  setExamMarks(String(exam.totalMarks));
                  setShowExamForm(true);
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Edit size={16} />
              </button>

              <button
                type="button"
                onClick={() => toggleExamPublish(exam)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {exam.isPublished ? "Unpublish" : "Publish"}
              </button>

              <button
                type="button"
                onClick={() => removeExam(exam)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  )}

  {showQuestionModal && selectedExam && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Manage Questions
            </h2>
            <p className="text-sm text-slate-500">
              {selectedExam.title}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowQuestionModal(false);
              setSelectedExam(null);
            }}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Correct answers are stored in the question bank. Do not give
          students direct access to the examQuestions collection.
        </p>

        
        <div className="space-y-3">
          {questions
            .filter((question) => question.examId === selectedExam.id)
            .map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">
                      Question {index + 1}
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {question.question}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const isCorrect =
                          question.correctAnswer ===
                          String.fromCharCode(65 + optionIndex);

                        return (
                          <p
                            key={optionIndex}
                            className={
                              isCorrect
                                ? "rounded-lg bg-green-50 p-2 text-sm font-semibold text-green-700"
                                : "rounded-lg bg-slate-50 p-2 text-sm text-slate-600"
                            }
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </p>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <p className="mt-3 text-sm text-slate-500">
                        Explanation: {question.explanation}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    title="Delete question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

          {questions.filter(
            (question) => question.examId === selectedExam.id
          ).length === 0 && (
            <EmptyState message="No questions added to this exam yet." />
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setShowQuestionModal(false);
              setSelectedExam(null);
            }}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
</section>
</main>
);
}
function SummaryCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  message
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <FileText
        size={30}
        className="mx-auto mb-3 text-slate-400"
      />

      <p className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
        }
        
