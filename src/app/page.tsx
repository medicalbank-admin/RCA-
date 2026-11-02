
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
    a: "Our planned pathways include MBBS, MD, NRE, USMLE, PLAB, SMLE, DHA, AMC and FCPS."
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

function AnimatedHeart() {
  return (
    <div className="heart-stage">
      <div className="heart-glow" />

      <div className="heart-illustration">
        <svg
          viewBox="0 0 420 440"
          role="img"
          aria-label="Anatomical illustration of the human heart"
          className="heart-svg"
        >
          <defs>
            <linearGradient id="heartBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff9297" />
              <stop offset="45%" stopColor="#e83d58" />
              <stop offset="100%" stopColor="#8e102d" />
            </linearGradient>
            <linearGradient id="heartLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffb0a8" />
              <stop offset="100%" stopColor="#d92c50" />
            </linearGradient>
            <linearGradient id="vessel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff9b92" />
              <stop offset="100%" stopColor="#bd263d" />
            </linearGradient>
            <filter id="heartShadow">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          {/* Heart shadow */}
          <ellipse
            cx="210"
            cy="380"
            rx="105"
            ry="17"
            fill="#000"
            opacity=".24"
            filter="url(#heartShadow)"
          />

          {/* Aorta */}
          <path
            d="M205 125 C184 75 189 31 221 22 C252 14 270 42 261 72
               C256 88 241 98 230 109"
            fill="none"
            stroke="#9e1935"
            strokeWidth="30"
            strokeLinecap="round"
          />
          <path
            d="M205 125 C184 75 189 31 221 22 C252 14 270 42 261 72"
            fill="none"
            stroke="url(#vessel)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Aorta branches */}
          <path d="M203 57 C174 37 165 21 169 7" fill="none"
            stroke="#e94d60" strokeWidth="13" strokeLinecap="round" />
          <path d="M225 43 C225 20 235 12 248 5" fill="none"
            stroke="#ed6370" strokeWidth="12" strokeLinecap="round" />
          <path d="M245 56 C272 36 285 39 295 26" fill="none"
            stroke="#bd263d" strokeWidth="13" strokeLinecap="round" />

          {/* Pulmonary artery */}
          <path
            d="M180 135 C155 95 119 90 101 111 C85 130 99 157 124 160
               L174 170"
            fill="none"
            stroke="#ed6577"
            strokeWidth="25"
            strokeLinecap="round"
          />

          {/* Main heart body */}
          <path
            d="M207 134
               C177 105 130 116 111 153
               C79 215 118 286 192 355
               C204 368 214 379 221 386
               C246 352 306 292 326 226
               C349 156 304 117 261 122
               C237 124 222 139 207 158 Z"
            fill="url(#heartBody)"
            stroke="#ff8992"
            strokeWidth="5"
          />

          {/* Right atrium */}
          <path
            d="M130 160 C112 181 119 220 151 230
               C169 235 183 219 185 194
               C184 166 154 145 130 160Z"
            fill="#f77b84"
            stroke="#a51b37"
            strokeWidth="4"
          />

          {/* Left atrium */}
          <path
            d="M222 151 C245 128 285 137 294 166
               C302 192 276 211 248 205
               C229 201 215 177 222 151Z"
            fill="#ff9b99"
            stroke="#a51b37"
            strokeWidth="4"
          />

          {/* Right ventricle */}
          <path
            d="M147 231 C161 215 185 218 200 235
               C215 253 207 312 190 348
               C165 321 133 281 135 254
               C135 244 139 236 147 231Z"
            fill="#d82e4d"
            stroke="#a51b37"
            strokeWidth="4"
          />

          {/* Left ventricle */}
          <path
            d="M205 231 C226 204 267 210 283 236
               C301 267 263 329 221 377
               C208 348 195 293 198 260
               C199 248 201 238 205 231Z"
            fill="url(#heartLight)"
            stroke="#a51b37"
            strokeWidth="4"
          />

          {/* Heart septum */}
          <path
            d="M205 164 C196 207 196 257 214 348"
            fill="none"
            stroke="#8e1833"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Coronary artery details */}
          <path
            d="M132 205 C155 193 166 203 174 225
               M174 225 C161 244 163 260 174 276
               M254 208 C269 224 265 243 252 256"
            fill="none"
            stroke="#ffb0a8"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Highlight */}
          <path
            d="M125 177 C137 153 157 153 169 166"
            fill="none"
            stroke="#ffd0c8"
            strokeWidth="7"
            strokeLinecap="round"
            opacity=".8"
          />
        </svg>
      </div>

      <span className="heart-label label-aorta">
        <i /> Aorta
      </span>
      <span className="heart-label label-atria">
        <i /> Left atrium
      </span>
      <span className="heart-label label-right">
        <i /> Right ventricle
      </span>
      <span className="heart-label label-left">
        <i /> Left ventricle
      </span>
      <span className="heart-label label-pulmonary">
        <i /> Pulmonary artery
      </span>

      <div className="heart-caption">
        <span className="eyebrow">ANATOMY IN MOTION</span>
        <h2>The Science of the Human Heart</h2>
        <p>Understand the structures that keep life moving.</p>
        <span className="heart-caption-bottom">
          LEARN · PRACTICE · EXCEL
        </span>
      </div>
    </div>
  );
}

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
              <a href="/signup" className="mobile-signup">Signup</a>
            </div>
          </details>

          <div className="desktop-links">
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="#courses">Courses</a>
            <a className="nav-link" href="#membership">Membership</a>
            <a className="nav-link" href="#demo">Demo</a>
            <a className="nav-link" href="/login">Login</a>
            <a className="primary-btn nav-signup" href="/signup">Signup</a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">ROSE COACHING ACADEMY</span>
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

          <AnimatedHeart />
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
                <p className="course-description">{course.description}</p>
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

      {/* STUDENT COMMUNITY */}
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
                <img src="/rcalogo.png" alt="Rose Coaching Academy logo" />
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
            
