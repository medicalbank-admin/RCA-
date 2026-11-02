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
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  EyeOff,
  FileUp,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

type Exam = {
  id: string;
  title: string;
  description: string;
  pathway: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string;
  isPublished: boolean;
};

type Question = {
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

const importExample =
  "Which chamber pumps blood to the body?|Right atrium|Right ventricle|Left atrium|Left ventricle|D|The left ventricle pumps oxygenated blood into the aorta.\n" +
  "Which vessel carries blood from the heart to the lungs?|Aorta|Pulmonary artery|Pulmonary vein|Vena cava|B|The pulmonary artery carries blood to the lungs.";

export default function ExamsManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examPathway, setExamPathway] = useState(pathways[0]);
  const [duration, setDuration] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");
  const [instructions, setInstructions] = useState("");

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [questionMarks, setQuestionMarks] = useState("1");

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
      const [examSnapshot, questionSnapshot] = await Promise.all([
        getDocs(collection(db, "exams")),
        getDocs(collection(db, "examQuestions"))
      ]);

      setExams(
        examSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as Exam[]
      );

      setQuestions(
        questionSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as Question[]
      );
    } catch (err) {
      console.error(err);
      setError(
        "Could not load exams. Check that the exams and examQuestions Firestore rules have been published."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function resetExamForm() {
    setExamTitle("");
    setExamDescription("");
    setExamPathway(pathways[0]);
    setDuration("60");
    setTotalMarks("100");
    setInstructions("");
    setEditingExam(null);
    setShowExamForm(false);
  }

  function startEditExam(exam: Exam) {
    setEditingExam(exam);
    setExamTitle(exam.title);
    setExamDescription(exam.description || "");
    setExamPathway(exam.pathway);
    setDuration(String(exam.durationMinutes));
    setTotalMarks(String(exam.totalMarks));
    setInstructions(exam.instructions || "");
    setShowExamForm(true);
  }

  async function saveExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const minutes = Number(duration);
    const marks = Number(totalMarks);

    if (!examTitle.trim()) {
      setError("Enter an exam title.");
      return;
    }

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      setError("Exam duration must be between 1 and 600 minutes.");
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
        instructions: instructions.trim(),
        updatedAt: serverTimestamp()
      };

      if (editingExam) {
        await updateDoc(doc(db, "exams", editingExam.id), examData);
        setSuccess("Exam updated successfully.");
      } else {
        await addDoc(collection(db, "exams"), {
          ...examData,
          isPublished: false,
          createdAt: serverTimestamp()
        });
        setSuccess("Exam created as unpublished.");
      }

      resetExamForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the exam. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(exam: Exam) {
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "exams", exam.id), {
        isPublished: !exam.isPublished,
        updatedAt: serverTimestamp()
      });

      setSuccess(
        exam.isPublished ? "Exam unpublished." : "Exam published."
      );
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not update exam publication status.");
    }
  }

  async function removeExam(exam: Exam) {
    const related = questions.filter(
      (question) => question.examId === exam.id
    );

    if (
      !window.confirm(
        `Delete "${exam.title}" and its ${related.length} question(s)? This cannot be undone.`
      )
    ) return;

    setError("");
    setSuccess("");

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "exams", exam.id));

      related.forEach((question) => {
        batch.delete(doc(db, "examQuestions", question.id));
      });

      await batch.commit();

      if (selectedExam?.id === exam.id) {
        setSelectedExam(null);
      }

      setSuccess("Exam and its questions deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete this exam.");
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

  function startEditQuestion(question: Question) {
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
      setError("Select an exam first.");
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
          doc(db, "examQuestions", editingQuestion.id),
          questionData
        );
        setSuccess("Question updated successfully.");
      } else {
        await addDoc(collection(db, "examQuestions"), {
          ...questionData,
          order: questions.filter(
            (item) => item.examId === selectedExam.id
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

  async function removeQuestion(question: Question) {
    if (!window.confirm("Delete this question permanently?")) return;

    setError("");
    setSuccess("");

    try {
      await deleteDoc(doc(db, "examQuestions", question.id));
      setSuccess("Question deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete this question.");
    }
  }

  async function importQuestions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedExam) {
      setError("Select an exam first.");
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

    const parsed = lines.map((line, index) => {
      const fields = line.split("|").map((field) => field.trim());

      if (fields.length !== 7) {
        throw new Error(
          `Line ${index + 1}: expected exactly 7 fields separated by |.`
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
        !question ||
        !a || !b || !c || !d ||
        !["A", "B", "C", "D"].includes(normalizedAnswer)
      ) {
        throw new Error(
          `Line ${index + 1}: complete the question, four options, and a correct answer A, B, C, or D.`
        );
      }

      return {
        examId: selectedExam.id,
        question,
        options: [a, b, c, d],
        correctAnswer: normalizedAnswer,
        explanation: explanationText,
        marks: 1,
        order: questions.filter(
          (item) => item.examId === selectedExam.id
        ).length + index + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
    });

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const batch = writeBatch(db);

      parsed.forEach((question) => {
        const newQuestion = doc(collection(db, "examQuestions"));
        batch.set(newQuestion, question);
      });

      await batch.commit();

      setImportText("");
      setShowImport(false);
      setSuccess(`${parsed.length} question(s) imported successfully.`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not import questions."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const searchMatch =
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        exam.pathway.toLowerCase().includes(search.toLowerCase()) ||
        exam.description.toLowerCase().includes(search.toLowerCase());

      const pathwayMatch =
        pathwayFilter === "all" || exam.pathway === pathwayFilter;

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "published" && exam.isPublished) ||
        (statusFilter === "draft" && !exam.isPublished);

      return searchMatch && pathwayMatch && statusMatch;
    });
  }, [exams, search, pathwayFilter, statusFilter]);

  const selectedQuestions = selectedExam
    ? questions
        .filter((question) => question.examId === selectedExam.id)
        .sort((a, b) => a.order - b.order)
    : [];

  const publishedCount = exams.filter((exam) => exam.isPublished).length;
  const draftCount = exams.length - publishedCount;

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
                Exams Management
              </h1>
              <p className="text-sm text-slate-500">
                Create exams and manage MCQ question banks
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut(auth).then(() => {
              window.location.replace("/login");
            })}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <SummaryCard
            title="Total Exams"
            value={exams.length}
            icon={<ClipboardList size={22} />}
          />
          <SummaryCard
            title="Published Exams"
            value={publishedCount}
            icon={<Eye size={22} />}
          />
          <SummaryCard
            title="Draft Exams"
            value={draftCount}
            icon={<EyeOff size={22} />}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Exam Library</h2>
              <p className="text-sm text-slate-500">
                Organize exams by medical pathway.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => loadData()}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                onClick={() => {
                  resetExamForm();
                  setShowExamForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                <Plus size={17} />
                Create Exam
              </button>
            </div>
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
                placeholder="Search exams..."
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

        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <ClipboardList
              size={36}
              className="mx-auto text-slate-300 mb-3"
            />
            <h3 className="font-bold text-lg">No exams found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create an exam or adjust your search filters.
            </p>
          </div>
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
                      <h3 className="text-lg font-bold mt-3">
                        {exam.title}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
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

                  <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-bold">{exam.durationMinutes}</p>
                      <p className="text-xs text-slate-500">Minutes</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-bold">{exam.totalMarks}</p>
                      <p className="text-xs text-slate-500">Marks</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="font-bold">{count}</p>
                      <p className="text-xs text-slate-500">Questions</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <button
                      onClick={() => {
                        setSelectedExam(exam);
                        setShowQuestionForm(false);
                        setShowImport(false);
                      }}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
                    >
                      Manage MCQs
                    </button>

                    <button
                      onClick={() => startEditExam(exam)}
                      className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                      aria-label="Edit exam"
                    >
                      <Edit size={17} />
                    </button>

                    <button
                      onClick={() => togglePublished(exam)}
                      className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                      aria-label={exam.isPublished ? "Unpublish exam" : "Publish exam"}
                    >
                      {exam.isPublished ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                    <button
                      onClick={() => removeExam(exam)}
                      className="p-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      aria-label="Delete exam"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
                {selectedExam && (
          <section className="mt-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Question bank
                </p>
                <h2 className="text-xl font-bold mt-1">
                  {selectedExam.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedQuestions.length} question(s) in this exam
                </p>
              </div>

              <button
                onClick={() => {
                  resetQuestionForm();
                  setShowQuestionForm(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
              >
                <Plus size={17} />
                Add MCQ
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => {
                  setShowImport(!showImport);
                  setShowQuestionForm(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
              >
                <FileUp size={16} />
                Bulk Import MCQs
              </button>

              <button
                onClick={() => {
                  setSelectedExam(null);
                  setShowQuestionForm(false);
                  setShowImport(false);
                  resetQuestionForm();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
              >
                <X size={16} />
                Close Question Bank
              </button>
            </div>

            {showImport && (
              <form
                onSubmit={importQuestions}
                className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200"
              >
                <h3 className="font-bold">Bulk import questions</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Enter one question per line. Separate the seven fields with
                  the pipe character: question, options A–D, correct answer,
                  explanation.
                </p>

                <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 mb-2">
                    FORMAT EXAMPLE
                  </p>
                  <pre className="text-xs whitespace-pre-wrap break-words text-slate-700">
                    {importExample}
                  </pre>
                </div>

                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={8}
                  placeholder="Paste your pipe-separated MCQs here..."
                  className="w-full mt-3 p-3 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <FileUp size={16} />
                    {saving ? "Importing..." : "Import Questions"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowImport(false);
                      setImportText("");
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {showQuestionForm && (
              <form
                onSubmit={saveQuestion}
                className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
              >
                <h3 className="font-bold">
                  {editingQuestion ? "Edit MCQ" : "Add New MCQ"}
                </h3>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Question
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    rows={3}
                    required
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <label className="block text-sm font-semibold mb-1">
                        {option.label}
                      </label>
                      <input
                        value={option.value}
                        onChange={(event) => option.setter(event.target.value)}
                        required
                        className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                        placeholder={`Enter ${option.label}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Correct Answer
                    </label>
                    <select
                      value={correctAnswer}
                      onChange={(event) => setCorrectAnswer(event.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Marks
                    </label>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={questionMarks}
                      onChange={(event) => setQuestionMarks(event.target.value)}
                      required
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white"
                    placeholder="Explain why the correct answer is right..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Question"}
                  </button>

                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 space-y-3">
              {selectedQuestions.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300">
                  <ClipboardList
                    size={30}
                    className="mx-auto text-slate-300 mb-2"
                  />
                  <p className="font-semibold">No questions added yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Add MCQs individually or import them in bulk.
                  </p>
                </div>
              ) : (
                selectedQuestions.map((question, index) => (
                  <article
                    key={question.id}
                    className="p-4 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-700">
                          QUESTION {index + 1} · {question.marks} MARK(S)
                        </p>
                        <h4 className="font-semibold mt-1">
                          {question.question}
                        </h4>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEditQuestion(question)}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                          aria-label="Edit question"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => removeQuestion(question)}
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          aria-label="Delete question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {question.options.map((option, optionIndex) => {
                        const letter = ["A", "B", "C", "D"][optionIndex];
                        const isCorrect = letter === question.correctAnswer;

                        return (
                          <div
                            key={letter}
                            className={`p-2.5 rounded-lg text-sm border ${
                              isCorrect
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-slate-50 border-slate-100 text-slate-700"
                            }`}
                          >
                            <span className="font-bold mr-2">{letter}.</span>
                            {option}
                            {isCorrect && (
                              <CheckCircle2
                                size={15}
                                className="inline ml-2"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <p className="mt-3 text-sm text-slate-500">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>
    </div>
  );
                    }
