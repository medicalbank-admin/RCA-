"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
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
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Video,
  X,
  Save,
  Eye,
  EyeOff,
  PlayCircle,
  GraduationCap,
  LogOut,
  ChevronDown
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

type Course = {
  id: string;
  title: string;
  description: string;
  pathway: string;
  isPublished: boolean;
  createdAt?: unknown;
};

type Lecture = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  order: number;
  createdAt?: unknown;
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

export default function CoursesManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);

  const [search, setSearch] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [coursePathway, setCoursePathway] = useState(pathways[0]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureDescription, setLectureDescription] = useState("");
  const [lectureVideoUrl, setLectureVideoUrl] = useState("");
  const [lectureOrder, setLectureOrder] = useState("1");

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
      const [courseSnapshot, lectureSnapshot] = await Promise.all([
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "lectures"))
      ]);

      setCourses(
        courseSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as Course[]
      );

      setLectures(
        lectureSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        })) as Lecture[]
      );
    } catch (err) {
      console.error(err);
      setError(
        "Could not load courses. Check that the courses and lectures Firestore rules have been published."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function resetCourseForm() {
    setCourseTitle("");
    setCourseDescription("");
    setCoursePathway(pathways[0]);
    setEditingCourse(null);
    setShowCourseForm(false);
  }

  function startEditCourse(course: Course) {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDescription(course.description);
    setCoursePathway(course.pathway);
    setShowCourseForm(true);
  }

  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseTitle.trim()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const courseData = {
        title: courseTitle.trim(),
        description: courseDescription.trim(),
        pathway: coursePathway,
        updatedAt: serverTimestamp()
      };

      if (editingCourse) {
        await updateDoc(doc(db, "courses", editingCourse.id), courseData);
        setSuccess("Course updated successfully.");
      } else {
        await addDoc(collection(db, "courses"), {
          ...courseData,
          isPublished: false,
          createdAt: serverTimestamp()
        });
        setSuccess("Course created successfully. It is currently unpublished.");
      }

      resetCourseForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the course. Please check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(course: Course) {
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "courses", course.id), {
        isPublished: !course.isPublished,
        updatedAt: serverTimestamp()
      });

      setSuccess(
        course.isPublished
          ? "Course unpublished."
          : "Course published."
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to change course publication status.");
    }
  }

  async function removeCourse(course: Course) {
    const courseLectures = lectures.filter(
      (lecture) => lecture.courseId === course.id
    );

    const confirmed = window.confirm(
      `Delete "${course.title}" and its ${courseLectures.length} lecture(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const batch = writeBatch(db);

      batch.delete(doc(db, "courses", course.id));

      courseLectures.forEach((lecture) => {
        batch.delete(doc(db, "lectures", lecture.id));
      });

      await batch.commit();

      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null);
      }

      setSuccess("Course and its lectures deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete the course and its lectures.");
    }
  }

  function resetLectureForm() {
    setLectureTitle("");
    setLectureDescription("");
    setLectureVideoUrl("");
    setLectureOrder("1");
    setEditingLecture(null);
    setShowLectureForm(false);
  }

  function startEditLecture(lecture: Lecture) {
    setEditingLecture(lecture);
    setLectureTitle(lecture.title);
    setLectureDescription(lecture.description);
    setLectureVideoUrl(lecture.videoUrl);
    setLectureOrder(String(lecture.order || 1));
    setShowLectureForm(true);
  }

  async function saveLecture(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCourse || !lectureTitle.trim()) return;

    if (!/^https?:\/\/\S+$/i.test(lectureVideoUrl.trim())) {
      setError("Enter a valid video URL beginning with https:// or http://.");
      return;
    }

    const order = Number(lectureOrder);

    if (!Number.isInteger(order) || order < 1) {
      setError("Lecture order must be a whole number greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const lectureData = {
        courseId: selectedCourse.id,
        title: lectureTitle.trim(),
        description: lectureDescription.trim(),
        videoUrl: lectureVideoUrl.trim(),
        order,
        updatedAt: serverTimestamp()
      };

      if (editingLecture) {
        await updateDoc(
          doc(db, "lectures", editingLecture.id),
          lectureData
        );
        setSuccess("Lecture updated successfully.");
      } else {
        await addDoc(collection(db, "lectures"), {
          ...lectureData,
          createdAt: serverTimestamp()
        });
        setSuccess("Lecture added successfully.");
      }

      resetLectureForm();
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not save the lecture. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  async function removeLecture(lecture: Lecture) {
    if (!window.confirm(`Delete lecture "${lecture.title}"?`)) return;

    try {
      await deleteDoc(doc(db, "lectures", lecture.id));
      setSuccess("Lecture deleted.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Could not delete this lecture.");
    }
  }

  const filteredCourses = useMemo(() => {
    const term = search.toLowerCase().trim();

    return courses.filter((course) => {
      const matchesSearch =
        !term ||
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.pathway.toLowerCase().includes(term);

      const matchesPathway =
        pathwayFilter === "all" || course.pathway === pathwayFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && course.isPublished) ||
        (statusFilter === "unpublished" && !course.isPublished);

      return matchesSearch && matchesPathway && matchesStatus;
    });
  }, [courses, search, pathwayFilter, statusFilter]);

  const selectedLectures = selectedCourse
    ? lectures
        .filter((lecture) => lecture.courseId === selectedCourse.id)
        .sort((a, b) => a.order - b.order)
    : [];

  const publishedCount = courses.filter((course) => course.isPublished).length;
  const unpublishedCount = courses.length - publishedCount;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
          <p>Loading course management...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={19} />
            </Link>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                Courses Management
              </h1>
              <p className="text-xs text-slate-400">
                Rose Coaching Academy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <p>{error}</p>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p>{success}</p>
            <button onClick={() => setSuccess("")} aria-label="Dismiss message">
              <X size={18} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SummaryCard label="Total Courses" value={courses.length} icon={<BookOpen />} />
          <SummaryCard label="Published" value={publishedCount} icon={<Eye />} />
          <SummaryCard label="Unpublished" value={unpublishedCount} icon={<EyeOff />} />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Course Library</h2>
              <p className="text-sm text-slate-400">
                Create courses and organize them by medical pathway.
              </p>
            </div>

            <button
              onClick={() => {
                resetCourseForm();
                setShowCourseForm(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
            >
              <Plus size={17} />
              Create Course
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm"
              />
            </div>

            <select
              value={pathwayFilter}
              onChange={(event) => setPathwayFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
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
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
            >
              <option value="all">All publication statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          {showCourseForm && (
            <form
              onSubmit={saveCourse}
              className="mt-5 space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4"
            >
              <h3 className="font-bold">
                {editingCourse ? "Edit Course" : "Create New Course"}
              </h3>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Course Title
                </label>
                <input
                  value={courseTitle}
                  onChange={(event) => setCourseTitle(event.target.value)}
                  required
                  maxLength={120}
                  placeholder="Example: Human Anatomy"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Medical Pathway
                </label>
                <select
                  value={coursePathway}
                  onChange={(event) => setCoursePathway(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
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
                  Course Description
                </label>
                <textarea
                  value={courseDescription}
                  onChange={(event) => setCourseDescription(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe the course and what students will learn..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Course"}
                </button>
                <button
                  type="button"
                  onClick={resetCourseForm}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
                    {filteredCourses.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <BookOpen size={32} className="mx-auto mb-3 text-slate-500" />
              <p className="font-semibold">No courses found</p>
              <p className="mt-1 text-sm text-slate-400">
                Create a course or change your search filters.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const count = lectures.filter(
                  (lecture) => lecture.courseId === course.id
                ).length;

                return (
                  <article
                    key={course.id}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words font-bold">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-cyan-300">
                          {course.pathway}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                          course.isPublished
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {course.isPublished ? "Published" : "Unpublished"}
                      </span>
                    </div>

                    <p className="mt-4 min-h-12 text-sm text-slate-400">
                      {course.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Video size={15} />
                      {count} lecture{count === 1 ? "" : "s"}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          resetLectureForm();
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
                      >
                        <Video size={16} />
                        Lectures
                      </button>

                      <button
                        onClick={() => startEditCourse(course)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                      >
                        <Edit size={15} />
                        Edit
                      </button>

                      <button
                        onClick={() => togglePublished(course)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                      >
                        {course.isPublished ? (
                          <>
                            <EyeOff size={15} />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye size={15} />
                            Publish
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => removeCourse(course)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6">
            <section className="my-auto w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              <header className="flex items-center justify-between gap-3 border-b border-slate-700 p-4 sm:p-5">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">
                    Course Lectures
                  </h2>
                  <p className="mt-1 break-words text-sm text-cyan-300">
                    {selectedCourse.title}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    resetLectureForm();
                  }}
                  className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
                  aria-label="Close lectures"
                >
                  <X size={19} />
                </button>
              </header>

              <div className="space-y-5 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Lecture Library</h3>
                    <p className="text-xs text-slate-400">
                      Add video lessons to this course.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      resetLectureForm();
                      setLectureOrder(String(selectedLectures.length + 1));
                      setShowLectureForm(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950"
                  >
                    <Plus size={16} />
                    Add Lecture
                  </button>
                </div>

                {showLectureForm && (
                  <form
                    onSubmit={saveLecture}
                    className="space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <h3 className="font-bold">
                      {editingLecture ? "Edit Lecture" : "New Lecture"}
                    </h3>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Lecture Title
                      </label>
                      <input
                        value={lectureTitle}
                        onChange={(event) =>
                          setLectureTitle(event.target.value)
                        }
                        required
                        maxLength={150}
                        placeholder="Example: Introduction to Anatomy"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Video URL
                      </label>
                      <input
                        type="url"
                        value={lectureVideoUrl}
                        onChange={(event) =>
                          setLectureVideoUrl(event.target.value)
                        }
                        required
                        placeholder="https://..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Add a video link from your approved hosting provider.
                        This field stores a URL; it does not upload a video file.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Lecture Description
                      </label>
                      <textarea
                        value={lectureDescription}
                        onChange={(event) =>
                          setLectureDescription(event.target.value)
                        }
                        rows={3}
                        maxLength={2000}
                        placeholder="What does this lecture cover?"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={lectureOrder}
                        onChange={(event) =>
                          setLectureOrder(event.target.value)
                        }
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save Lecture"}
                      </button>

                      <button
                        type="button"
                        onClick={resetLectureForm}
                        className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {selectedLectures.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
                    <Video
                      size={30}
                      className="mx-auto mb-3 text-slate-500"
                    />
                    <p className="font-semibold">No lectures added</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add the first video lesson to this course.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLectures.map((lecture) => (
                      <article
                        key={lecture.id}
                        className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                              <PlayCircle size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold">
                                {lecture.order}. {lecture.title}
                              </p>
                              <p className="mt-1 break-words text-xs text-slate-400">
                                {lecture.description || "No description"}
                              </p>
                              <a
                                href={lecture.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block break-all text-xs text-cyan-300 underline"
                              >
                                Open video link
                              </a>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              onClick={() => startEditLecture(lecture)}
                              title="Edit lecture"
                              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => removeLecture(lecture)}
                              title="Delete lecture"
                              className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <footer className="flex justify-end border-t border-slate-700 p-4">
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    resetLectureForm();
                  }}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </footer>
            </section>
          </div>
        )}

        <footer className="pb-5 text-center text-xs text-slate-500">
          Rose Coaching Academy · Courses Administration
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="text-cyan-300">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
                    }
