const courses = [
  {
    title: "MBBS & MD",
    description:
      "Structured medical education and academic support for medical students.",
    icon: "🩺",
    tag: "Medical Education"
  },
  {
    title: "NRE Preparation",
    description:
      "Focused preparation resources for the National Registration Examination.",
    icon: "📚",
    tag: "Licensing Exam"
  },
  {
    title: "USMLE Preparation",
    description:
      "Build your medical knowledge and prepare for your USMLE journey.",
    icon: "🌎",
    tag: "International Pathway"
  },
  {
    title: "PLAB Preparation",
    description:
      "Prepare for your professional medical licensing pathway in the UK.",
    icon: "🎓",
    tag: "International Pathway"
  },
  {
    title: "SMLE Preparation",
    description:
      "Study resources and exam preparation for the Saudi medical licensing exam.",
    icon: "🏥",
    tag: "Licensing Exam"
  },
  {
    title: "DHA, AMC & FCPS",
    description:
      "Explore additional professional medical examination pathways.",
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
    a: "Students will be able to register, choose a membership plan and access their enrolled courses through their dashboard."
  },
  {
    q: "Can I access my courses on mobile?",
    a: "The platform is being designed to work on mobile phones, tablets and desktop computers."
  }
];

export default function Home() {
  return (
    <main>
      {/* NAVIGATION */}
      <header style={{
        background: "#101d36",
        padding: "15px 0"
      }}>
        <nav className="container" style={{
          background: "white",
          borderRadius: "14px",
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <a href="/" style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#101d36",
            fontWeight: 900,
            fontSize: "20px"
          }}>
            <img
              src="/rcalogo.png"
              alt="RCA Logo"
              style={{
                width: "42px",
                height: "42px",
                objectFit: "contain"
              }}
            />
            RCA
          </a>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap"
          }}>
            <a className="nav-link" href="/">Home</a>
            <a className="nav-link" href="#courses">Courses</a>
            <a className="nav-link" href="#membership">Membership</a>
            <a className="nav-link" href="#demo">Demo</a>
            <a className="nav-link" href="/login">Login</a>
            <a className="primary-btn" href="/signup">
              Signup
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section style={{
        background: "linear-gradient(120deg,#101d36,#1b3154)",
        color: "white",
        padding: "85px 0"
      }}>
        <div className="container" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          alignItems: "center",
          gap: "45px"
        }}>
          <div>
            <span className="eyebrow">
              ROSE COACHING ACADEMY
            </span>

            <h1 style={{
              fontSize: "clamp(38px,6vw,62px)",
              lineHeight: 1.12,
              margin: "20px 0"
            }}>
              Start Your Medical Journey With{" "}
              <span style={{color:"#f06b7e"}}>
                RCA
              </span>
            </h1>

            <p style={{
              color: "#d5dbea",
              fontSize: "17px",
              lineHeight: 1.8,
              maxWidth: "540px"
            }}>
              Learn with purpose. Prepare with confidence.
              Build the knowledge and skills to take your
              medical career further.
            </p>

            <div style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginTop: "30px"
            }}>
              <a className="primary-btn" href="#membership">
                Get Started →
              </a>
              <a className="outline-btn" href="#courses">
                Explore Courses
              </a>
            </div>

            <p style={{
              color: "#b8c5da",
              fontSize: "13px",
              marginTop: "25px"
            }}>
              Medical Education · Exam Preparation · Professional Growth
            </p>
          </div>

          <div style={{
            minHeight: "320px",
            border: "1px solid #52627e",
            borderRadius: "25px",
            background: "rgba(255,255,255,.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
            textAlign: "center"
          }}>
            <div style={{fontSize:"105px"}}>🫀</div>
            <h2 style={{fontSize:"25px",margin:"10px 0"}}>
              The Science of Medicine
            </h2>
            <p style={{
              color:"#c5d0e1",
              lineHeight:1.7
            }}>
              Explore the knowledge behind every heartbeat.
            </p>
            <span style={{
              color:"#f06b7e",
              fontWeight:700,
              fontSize:"12px",
              letterSpacing:"2px"
            }}>
              LEARN · PRACTICE · EXCEL
            </span>
          </div>
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

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",
            gap:"22px"
          }}>
            {courses.map((course) => (
              <article className="course-card" key={course.title}>
                <div style={{fontSize:"35px"}}>
                  {course.icon}
                </div>
                <p className="eyebrow" style={{
                  fontSize:"10px",
                  marginTop:"20px"
                }}>
                  {course.tag}
                </p>
                <h3 style={{
                  color:"#101d36",
                  fontSize:"21px"
                }}>
                  {course.title}
                </h3>
                <p style={{
                  color:"#697386",
                  lineHeight:1.7,
                  fontSize:"14px"
                }}>
                  {course.description}
                </p>
                <a href="#membership" style={{
                  color:"#bd263d",
                  fontWeight:700,
                  fontSize:"14px"
                }}>
                  Explore Program →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP */}
      <section id="membership" className="section"
        style={{background:"#f8f7f4"}}>
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

      {/* TESTIMONIALS */}
      <section className="section"
        style={{background:"#f8f7f4"}}>
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">STUDENT COMMUNITY</span>
            <h2>Learning Together, Growing Together</h2>
            <p>
              A supportive learning environment built around
              medical education and professional development.
            </p>
          </div>
          <div style={{
            background:"white",
            borderRadius:"16px",
            padding:"30px",
            textAlign:"center",
            maxWidth:"700px",
            margin:"auto"
          }}>
            <h3 style={{color:"#101d36"}}>
              Your Success Story Starts Here
            </h3>
            <p style={{color:"#697386",lineHeight:1.8}}>
              Student testimonials will appear here as RCA
              welcomes its first learners.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container" style={{maxWidth:"800px"}}>
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
      <footer style={{
        background:"#101d36",
        color:"white",
        padding:"55px 0 20px"
      }}>
        <div className="container">
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",
            gap:"35px"
          }}>
            <div>
              <h2>RCA</h2>
              <p style={{color:"#bdc8d9",lineHeight:1.8}}>
                Rose Coaching Academy
              </p>
              <p style={{color:"#bdc8d9",lineHeight:1.8}}>
                Supporting your medical education and
                professional journey.
              </p>
            </div>

            <div>
              <h3>Quick Links</h3>
              <p><a href="#courses">Courses</a></p>
              <p><a href="#membership">Membership</a></p>
              <p><a href="#demo">Demo</a></p>
            </div>

            <div>
              <h3>Student Account</h3>
              <p><a href="/login">Login</a></p>
              <p><a href="/signup">Register</a></p>
            </div>

            <div>
              <h3>Contact</h3>
              <p style={{color:"#bdc8d9"}}>
                Contact information will be added here.
              </p>
            </div>
          </div>

          <hr style={{
            border:"0",
            borderTop:"1px solid #34435b",
            margin:"35px 0 20px"
          }}/>

          <p style={{
            textAlign:"center",
            color:"#bdc8d9",
            fontSize:"13px"
          }}>
            © {new Date().getFullYear()} Rose Coaching Academy.
            All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
      }
