"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, ExternalLink, Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";

const SECTIONS = ["home", "about", "experience", "projects", "contact"];

function useInViewLocal(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, visible] = useInViewLocal();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}s` }}>
      {children}
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 500, background: "#f0f0f0", color: "#555", marginRight: 6, marginBottom: 6, letterSpacing: 0.2 }}>{label}</span>;
}

function Navbar({ active }: { active: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  const navStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: scrolled ? "rgba(250,250,250,0.72)" : "transparent",
    backdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
    WebkitBackdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
    borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
    transition: "all 0.35s ease",
  };

  const linkStyle = (id: string): React.CSSProperties => ({
    fontSize: 13, fontWeight: 500, letterSpacing: 0.3, cursor: "pointer",
    color: active === id ? "#000" : "#888",
    borderBottom: active === id ? "1.5px solid #000" : "1.5px solid transparent",
    paddingBottom: 2, transition: "all 0.25s", textTransform: "capitalize",
  });

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => scrollTo("home")} style={{ fontSize: 22, fontWeight: 700, cursor: "pointer", letterSpacing: -0.5, color: "#111" }}>SM.</span>
        <div className="nav-desktop" style={{ display: "flex", gap: 28 }}>
          {SECTIONS.map(s => <span key={s} onClick={() => scrollTo(s)} style={linkStyle(s)}>{s}</span>)}
        </div>
        <button className="nav-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          {menuOpen ? <X size={22} color="#111" /> : <Menu size={22} color="#111" />}
        </button>
      </div>
      {menuOpen && (
        <div style={{ background: "rgba(250,250,250,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "12px 24px 20px", borderTop: "1px solid rgba(0,0,0,0.05)" }} className="nav-mobile-menu">
          {SECTIONS.map(s => <div key={s} onClick={() => scrollTo(s)} style={{ padding: "12px 0", fontSize: 15, fontWeight: 500, cursor: "pointer", color: active === s ? "#000" : "#777", textTransform: "capitalize", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>{s}</div>)}
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <section id="home" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative" }}>
      <FadeIn>
        <p style={{ fontSize: 14, fontWeight: 500, letterSpacing: 2.5, textTransform: "uppercase", color: "#999", marginBottom: 20 }}>Sophia Morales</p>
      </FadeIn>
      <FadeIn delay={0.1}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.1, color: "#111", maxWidth: 720, margin: "0 auto 24px", letterSpacing: -1.5 }}>
          Building at the intersection of tech, culture &amp; storytelling.
        </h1>
      </FadeIn>
      <FadeIn delay={0.2}>
        <p style={{ fontSize: 17, color: "#666", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.65 }}>
          Founder, economist, and creative — currently building Seira, an AI travel platform, and writing a feature screenplay in Los Angeles.
        </p>
      </FadeIn>
      <FadeIn delay={0.3}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => scrollTo("contact")} style={{ padding: "13px 32px", borderRadius: 9999, background: "#111", color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-1px)"; (e.target as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }} onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; (e.target as HTMLElement).style.boxShadow = "none"; }}>Get in touch</button>
          <button onClick={() => scrollTo("projects")} style={{ padding: "13px 32px", borderRadius: 9999, background: "transparent", color: "#111", fontSize: 14, fontWeight: 600, border: "1.5px solid #ccc", cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e => (e.target as HTMLElement).style.borderColor = "#111"} onMouseLeave={e => (e.target as HTMLElement).style.borderColor = "#ccc"}>View my work</button>
        </div>
      </FadeIn>
      <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", animation: "bobble 2s ease-in-out infinite" }}>
        <ChevronDown size={20} color="#bbb" />
      </div>
    </section>
  );
}

function About() {
  const languages = [
    { lang: "Spanish", level: "Native" }, { lang: "English", level: "Native" },
    { lang: "French", level: "Proficient" }, { lang: "Italian", level: "Learning" }, { lang: "Portuguese", level: "Learning" },
  ];
  return (
    <section id="about" style={{ padding: "100px 24px", maxWidth: 900, margin: "0 auto" }}>
      <FadeIn><p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "#999", marginBottom: 12 }}>About</p></FadeIn>
      <FadeIn delay={0.05}><h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#111", lineHeight: 1.2, marginBottom: 28, letterSpacing: -0.8 }}>A bit about me.</h2></FadeIn>
      <FadeIn delay={0.1}>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.75, marginBottom: 16 }}>
          I&apos;m an economics graduate from San Diego State University with a deep curiosity for how technology reshapes culture and commerce. I earned my A.A. in Economics with Distinction from Riverside City College — concurrently with my high school diploma — and went on to complete my B.A. at SDSU in Fall 2025.
        </p>
      </FadeIn>
      <FadeIn delay={0.15}>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.75, marginBottom: 32 }}>
          Right now I&apos;m building Seira, an AI-powered platform that helps people plan complete trips around live events, and writing a feature-length screenplay. I&apos;m passionate about film, sports, entertainment, and technology — and I&apos;m always looking for the next great story to tell or problem to solve.
        </p>
      </FadeIn>
      <FadeIn delay={0.2}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginBottom: 40 }}>
          <div style={{ flex: "1 1 260px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 12 }}>Education</p>
            <p style={{ fontSize: 15, color: "#333", marginBottom: 4, fontWeight: 600 }}>B.A. Economics — San Diego State University</p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>Fall 2025</p>
            <p style={{ fontSize: 15, color: "#333", marginBottom: 4, fontWeight: 600 }}>A.A. Economics, with Distinction — Riverside City College</p>
            <p style={{ fontSize: 13, color: "#888" }}>Earned concurrently with high school diploma</p>
          </div>
          <div style={{ flex: "1 1 260px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 12 }}>Languages</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {languages.map(l => (
                <span key={l.lang} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 9999, background: "#f0f0f0", fontSize: 13, color: "#444" }}>
                  {l.lang} <span style={{ fontSize: 11, color: "#999" }}>· {l.level}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.25}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 14 }}>Skills</p>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>Creative & Coordination</p>
            <div style={{ display: "flex", flexWrap: "wrap" }}>{["Event Logistics", "Meeting Coordination", "Project Tracking", "Production Support", "Asset Management"].map(s => <Pill key={s} label={s} />)}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>Technical</p>
            <div style={{ display: "flex", flexWrap: "wrap" }}>{["Microsoft Office", "SharePoint", "Asana", "Canva", "Adobe Acrobat", "CapCut"].map(s => <Pill key={s} label={s} />)}</div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 8 }}>Strengths</p>
            <div style={{ display: "flex", flexWrap: "wrap" }}>{["Bilingual Communicator", "Digital Storytelling", "Sports Culture", "Client Service", "Fast-Paced Environments"].map(s => <Pill key={s} label={s} />)}</div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

const EXPERIENCE = [
  { title: "Founder & CEO", company: "Seira", location: "Los Angeles, CA", date: "October 2025 – Present", bullets: ["AI-powered platform for event-driven travel — helping people plan complete trips around concerts, games, and festivals.", "Designed product vision, UX flows, and system architecture.", "Developed AI prompting systems and trip intelligence logic."] },
  { title: "Partnerships & Events Intern", company: "CLD Public Relations", location: "Los Angeles, CA", date: "March 2025 – June 2025", bullets: ["Assisted Director of Partnerships with client outreach, asset delivery, and post-campaign reporting.", "Coordinated between events and partnerships teams.", "Prepared decks, agendas, and recap documents. Managed trackers in Asana."] },
  { title: "Assistant to Event & Sports Coordinator", company: "City of Riverside", location: "Riverside, CA", date: "August 2024 – May 2025", bullets: ["Oversaw guest experience and logistics for 300+ person public events and city-run sports leagues.", "Coordinated multi-site youth sports scheduling.", "Supported internal planning sessions with structured documentation."] },
  { title: "Social Media Intern", company: "SPORTSISH", location: "New York, NY · Remote", date: "August 2024 – December 2024", bullets: ["Created weekly sports content (soccer, motorsports) contributing to 30,000-follower growth in four months.", "Collaborated with CEO on brand messaging.", "Monitored ESPN and sports media trends."] },
];

function ExperienceSection() {
  return (
    <section id="experience" style={{ padding: "100px 24px", maxWidth: 900, margin: "0 auto" }}>
      <FadeIn><p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "#999", marginBottom: 12 }}>Experience</p></FadeIn>
      <FadeIn delay={0.05}><h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#111", lineHeight: 1.2, marginBottom: 48, letterSpacing: -0.8 }}>Where I&apos;ve contributed.</h2></FadeIn>
      <div style={{ position: "relative", paddingLeft: 32 }}>
        <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #ddd, #eee)", borderRadius: 2 }} />
        {EXPERIENCE.map((exp, i) => (
          <FadeIn key={i} delay={0.08 * i}>
            <div style={{ position: "relative", marginBottom: i < EXPERIENCE.length - 1 ? 48 : 0 }}>
              <div style={{ position: "absolute", left: -32, top: 6, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "2.5px solid #111", zIndex: 2 }} />
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#aaa", marginBottom: 6 }}>{exp.date}</p>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 2 }}>{exp.title}</h3>
              <p style={{ fontSize: 14, color: "#777", marginBottom: 14 }}>{exp.company} · {exp.location}</p>
              {exp.bullets.map((b, j) => (
                <p key={j} style={{ fontSize: 14.5, color: "#555", lineHeight: 1.7, marginBottom: 4, paddingLeft: 14, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, color: "#ccc" }}>–</span>{b}
                </p>
              ))}
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

interface Project {
  title: string;
  subtitle: string;
  description: string;
  link?: string;
  tags: string[];
}

const PROJECTS: Project[] = [
  { title: "Seira", subtitle: "Startup · AI Travel", description: "AI-powered platform helping people plan complete trips around concerts, games, and festivals.", link: "https://www.seira.global", tags: ["AI", "Travel", "Events", "Product Design"] },
  { title: "SPORTSISH Growth", subtitle: "Social Media · Content", description: "Drove 30K follower growth in four months through weekly sports content across soccer and motorsports.", tags: ["Social Media", "Sports", "Content Strategy", "Growth"] },
  { title: "Screenplay", subtitle: "Film · Writing", description: "Currently writing a feature-length screenplay — exploring narrative, character, and visual storytelling.", tags: ["Film", "Screenwriting", "Storytelling"] },
  { title: "Event Production", subtitle: "Operations · City of Riverside", description: "Managed guest experience and logistics for 300+ person public events with multi-site coordination.", tags: ["Events", "Operations", "Sports", "Logistics"] },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <FadeIn delay={0.08 * index} className="project-card-wrap">
      <div
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #eee",
          transition: "transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.03)",
          display: "flex", flexDirection: "column", height: "100%", cursor: "default",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 2 }}>{project.title}</h3>
            <p style={{ fontSize: 13, color: "#999", fontWeight: 500 }}>{project.subtitle}</p>
          </div>
          {project.link && (
            <a href={project.link} target="_blank" rel="noreferrer" style={{ color: "#111", flexShrink: 0, marginLeft: 12, marginTop: 2, transition: "transform 0.2s", transform: hovered ? "translate(2px,-2px)" : "none" }}>
              <ArrowUpRight size={18} />
            </a>
          )}
        </div>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65, marginBottom: 18, flex: 1 }}>{project.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {project.tags.map(t => <Pill key={t} label={t} />)}
        </div>
      </div>
    </FadeIn>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <FadeIn><p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "#999", marginBottom: 12 }}>Projects</p></FadeIn>
      <FadeIn delay={0.05}><h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#111", lineHeight: 1.2, marginBottom: 48, letterSpacing: -0.8 }}>Things I&apos;m working on.</h2></FadeIn>
      <div className="projects-grid">
        {PROJECTS.map((p, i) => <ProjectCard key={i} project={p} index={i} />)}
      </div>
    </section>
  );
}

function ContactSection() {
  const items = [
    { icon: <Mail size={18} />, label: "sophiamoral09@gmail.com", href: "mailto:sophiamoral09@gmail.com" },
    { icon: <Phone size={18} />, label: "(951) 783-8475", href: "tel:9517838475" },
    { icon: <MapPin size={18} />, label: "Los Angeles, CA · Open to relocation", href: null as string | null },
  ];
  return (
    <section id="contact" style={{ padding: "100px 24px 80px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      <FadeIn><p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "#999", marginBottom: 12 }}>Contact</p></FadeIn>
      <FadeIn delay={0.05}><h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: "#111", lineHeight: 1.2, marginBottom: 16, letterSpacing: -0.8 }}>Let&apos;s connect.</h2></FadeIn>
      <FadeIn delay={0.1}><p style={{ fontSize: 16, color: "#666", lineHeight: 1.7, marginBottom: 36 }}>I&apos;m always open to new opportunities, collaborations, and conversations. Don&apos;t hesitate to reach out.</p></FadeIn>
      <FadeIn delay={0.15}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          {items.map((it, i) => {
            const inner = (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 12, background: "#fff", border: "1px solid #eee", fontSize: 15, color: "#333", transition: "border-color 0.2s", cursor: it.href ? "pointer" : "default" }}>
                <span style={{ color: "#999" }}>{it.icon}</span> {it.label}
              </div>
            );
            return it.href
              ? <a key={i} href={it.href} style={{ textDecoration: "none" }}>{inner}</a>
              : <div key={i}>{inner}</div>;
          })}
        </div>
      </FadeIn>
    </section>
  );
}

function PortfolioFooter() {
  return (
    <footer style={{ padding: "32px 24px", textAlign: "center", borderTop: "1px solid #eee" }}>
      <p style={{ fontSize: 13, color: "#bbb" }}>© {new Date().getFullYear()} Sophia Morales. Built with intention.</p>
    </footer>
  );
}

export default function Portfolio() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const handler = () => {
      const offsets = SECTIONS.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, top: 99999 };
        return { id, top: Math.abs(el.getBoundingClientRect().top - 120) };
      });
      offsets.sort((a, b) => a.top - b.top);
      setActive(offsets[0].id);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif", background: "#fafafa", color: "#111", minHeight: "100vh", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @keyframes bobble {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        .nav-mobile-btn { display: none; }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
          .projects-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-btn { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
        ::selection { background: rgba(0,0,0,0.08); }
        a { color: inherit; }
      `}</style>
      <Navbar active={active} />
      <Hero />
      <About />
      <ExperienceSection />
      <ProjectsSection />
      <ContactSection />
      <PortfolioFooter />
    </div>
  );
}
