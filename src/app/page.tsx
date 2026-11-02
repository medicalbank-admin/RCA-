
"use client";

import dynamic from "next/dynamic";

const Heart3D = dynamic(
  () => import("./components/Heart3D"),
  {
    ssr: false,
    loading: () => (
      <div className="heart-3d-stage">
        <p className="heart-loading-text">
          Preparing 3D heart anatomy...
        </p>
      </div>
    )
  }
);

const courses = [
  {
    title: "MBBS & MD",
    description: "Structured medical education and academic support for medical students.",
    icon: "🩺",
    tag: "Medical Education"
  },
  {
    title: "NRE Preparation",
    description: "Focused preparation resources for the National Registration Examination.",
    icon: "📚",
    tag: "Licensing Exam"
  },
  {
    title: "USMLE Preparation",
    description: "Build your medical knowledge and prepare for your USMLE journey.",
    icon: "🌎",
    tag: "International Pathway"
  },
  {
    title: "PLAB Preparation",
    description: "Prepare for your professional medical licensing pathway in the UK.",
    icon: "🎓",
    tag: "International Pathway"
  },
  {
    title: "SMLE Preparation",
    description: "Study resources and exam preparation for the Saudi medical licensing exam.",
    icon: "🏥",
    tag: "Licensing Exam"
  },
  {
    title: "DHA, AMC & FCPS",
    description: "Explore additional professional medical examination pathways.",
    icon: "🔬",
    tag: "Advanced Preparation"
  }
];

const faqs = [
  {
    q: "What is Rose Coaching Academy?",
    a: "RCA is a medical coaching academy offering structured learning and exam preparation pathways."
  },
  {
    q: "Which courses can I study?",
    a: "Our pathways include MBBS, MD, NRE, USMLE, PLAB, SMLE, DHA, AMC and FCPS."
  },
  {
    q: "How can I access courses?",
    a: "Students can register, choose a membership plan and access enrolled courses through their dashboard."
  },
  {
    q: "Can I access my courses on mobile?",
    a: "RCA is designed to work on mobile phones, tablets and desktop computers."
  }
];

export default function Home() {
  return (
    <main>
      {/* NAVIGATION */}
      <header className="site-header">
        <nav className="container main-nav">
          <a href="/" className="brand">
            <img src="/rcalogo.png" alt="Rose Coaching Academy logo" />
            <span>RCA</span>
          </a>

          <details className="mobile-menu">
            <summary aria-label="Open navigation menu">
              <span />
              <span />
              <span />
            </summary>

            <div className="mobile-menu-panel">
              <a href="/">Home</a>
              <a href="#courses">Courses</a>
              <a href="#membership">Membership</a>
              <a href="#demo">Demo</a>
              <a href="/login">Login</a>
              <a href="/signup" className="mobile-signup">
                Signup
              </a>
            </div>
          </details>

          <div className="desktop-links">
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="#courses">Courses</a>
            <a className="nav-link" href="#membership">Membership</a>
            <a className="nav-link" href="#demo">Demo</a>
            <a className="nav-link" href="/login">Login</a>
            <a className="primary-btn nav-signup" href="/signup">
              Signup
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              ROSE COACHING ACADEMY
            </span>

            <h1>
              Start Your Medical Journey With <span>RCA</span>
            </h1>

            <p className="hero-description">
              Learn with purpose. Prepare with confidence.
              Build the knowledge and skills to take your
              medical career further.
            </p>

            <div className="hero-actions">
              <a className="primary-btn" href="#membership">
                Get Started →
              </a>

              <a className="outline-btn" href="#courses">
                Explore Courses
              </a>
            </div>

            <p className="hero-note">
              Medical Education · Exam Preparation · Professional Growth
            </p>
          </div>

          <Heart3D />
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">OUR PROGRAMS</span>
            <h2>Explore Your Medical Pathway</h2>
            <p>
              Choose a learning pathway that matches your
              academic goals and professional ambitions.
            </p>
          </div>

          <div className="course-grid">
            {courses.map((course) => (
              <article className="course-card" key={course.title}>
                <div className="course-icon">{course.icon}</div>
                <p className="eyebrow course-tag">{course.tag}</p>
                <h3>{course.title}</h3>
                <p className="course-description">
                  {course.description}
                </p>
                <a href="#membership" className="course-link">
                  Explore Program →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP */}
      <section id="membership" className="section section-cream">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">MEMBERSHIP</span>
            <h2>Invest in Your Medical Future</h2>
            <p>
              Access structured learning through a membership
              designed around your selected pathway.
            </p>
            <a className="primary-btn" href="/signup">
              View Membership Options
            </a>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">EXPERIENCE RCA</span>
            <h2>Explore Our Learning Experience</h2>
            <p>
              Discover the teaching approach and learning
              resources planned for RCA students.
            </p>
            <a className="primary-btn" href="/demo">
              Explore Demo
            </a>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">STUDENT COMMUNITY</span>
            <h2>Learning Together, Growing Together</h2>
            <p>
              A supportive learning environment built around
              medical education and professional development.
            </p>
          </div>

          <div className="community-card">
            <h3>Your Success Story Starts Here</h3>
            <p>
              Student testimonials will appear here as RCA
              welcomes its first learners.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container faq-container">
          <div className="section-heading">
            <span className="eyebrow">FAQ</span>
            <h2>Frequently Asked Questions</h2>
          </div>

          {faqs.map((faq) => (
            <details className="faq-item" key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="footer-logo">
                <img
                  src="/rcalogo.png"
                  alt="Rose Coaching Academy logo"
                />
                <span>Rose Coaching Academy</span>
              </a>

              <p>
                Empowering medical students through focused
                education, exam preparation and professional growth.
              </p>
            </div>

            <div>
              <h3>Explore RCA</h3>
              <a href="/">Home</a>
              <a href="#courses">Our Courses</a>
              <a href="#membership">Membership</a>
              <a href="#demo">Demo</a>
            </div>

            <div>
              <h3>Student Account</h3>
              <a href="/login">Student Login</a>
              <a href="/signup">Create Account</a>
            </div>

            <div>
              <h3>Our Academy</h3>
              <p>Rose Coaching Academy</p>
              <p>Medical Education · Exam Preparation</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} Rose Coaching Academy (RCA).
              All rights reserved.
            </p>
            <span>Learn · Practice · Excel</span>
          </div>
        </div>
      </footer>
    </main>
  );
                  }
