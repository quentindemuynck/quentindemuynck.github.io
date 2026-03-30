import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function Hero() {
    const mountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(
            60,
            mount.clientWidth / mount.clientHeight,
            0.1,
            100
        )
        camera.position.z = 12

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(mount.clientWidth, mount.clientHeight)
        renderer.setClearColor(0x000000, 0)
        mount.appendChild(renderer.domElement)

        const particlesCount = 1000
        const positions = new Float32Array(particlesCount * 3)

        for (let i = 0; i < particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 24
            positions[i * 3 + 1] = (Math.random() - 0.5) * 12
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

        const material = new THREE.PointsMaterial({
            color: 0x7c9cff,
            size: 0.08,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })

        const particles = new THREE.Points(geometry, material)
        scene.add(particles)

        const sphere = new THREE.Mesh(
            new THREE.IcosahedronGeometry(2.8, 1),
            new THREE.MeshBasicMaterial({
                color: 0xa78bfa,
                wireframe: true,
                transparent: true,
                opacity: 0.2,
            })
        )
        sphere.position.set(3.5, 0, -1)
        scene.add(sphere)

        let frameId = 0

        const animate = () => {
            frameId = requestAnimationFrame(animate)

            particles.rotation.y += 0.0015
            particles.rotation.x += 0.0004

            sphere.rotation.x += 0.003
            sphere.rotation.y += 0.004

            renderer.render(scene, camera)
        }

        animate()

        const handleResize = () => {
            const el = mountRef.current
            if (!el) return

            camera.aspect = el.clientWidth / el.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(el.clientWidth, el.clientHeight)
        }

        window.addEventListener("resize", handleResize)

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener("resize", handleResize)

            geometry.dispose()
            material.dispose()
            renderer.dispose()

            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement)
            }
        }
    }, [])

    return (
        <section className="hero-section">
            <div className="hero-bg-base" />
            <div ref={mountRef} className="hero-background" />

            <div className="hero-content">
                <p className="hero-eyebrow">Game Developer Portfolio</p>

                <h1 className="hero-title">
                    Quentin <span>Demuynck</span>
                </h1>

                <p className="hero-description">
                    I am a passionate Game Developer who studied at{" "}
                    <a
                        href="https://www.digitalartsandentertainment.be/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Digital Arts and Entertainment (DAE)
                    </a>
                    , where I built a strong foundation in gameplay programming,
                    interactive experiences, and game production.
                </p>

                <div className="hero-actions">
                    <a href="#projects" className="hero-button primary">
                        View Projects
                    </a>
                    <a href="#contact" className="hero-button secondary">
                        Contact Me
                    </a>
                </div>
            </div>
        </section>
    )
}