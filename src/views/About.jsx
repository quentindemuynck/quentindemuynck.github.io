function About() {
  return (
    <section className="view view-about">
      <h2 className="view-heading" tabIndex={-1}>
        About Me
      </h2>
      <p>
        I'm driven by game development, writing elegant C++ code, and mastering new engines—and
        right now, my main focus is exploring AI applications in games.
      </p>

      <h2>Get In Touch</h2>
      <p className="contact-links">
        <a href="mailto:quentibiew@gmail.com">quentibiew@gmail.com</a>
        <span aria-hidden="true"> • </span>
        <a href="https://github.com/quentindemuynck" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span aria-hidden="true"> • </span>
        <a
          href="https://www.linkedin.com/in/quentin-demuynck-49a0a92a8/"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
        <span aria-hidden="true"> • </span>
        <a href="/docs/quentin_demuynck_resume.pdf" target="_blank" rel="noreferrer">
          Resume
        </a>
      </p>
    </section>
  )
}

export default About
