import { useEffect, useRef } from "react"
import * as THREE from "three"
import { gsap } from "gsap";
import Button from "../../components/Buttons/Button.tsx";

export default function Hero() {
    const mountRef = useRef<HTMLDivElement | null>(null)
    const titleRef = useRef(null);
    const contentRef = useRef(null);
    

    // three
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

        const particlesCount = 1500

        const positions = new Float32Array(particlesCount * 3)
        const sizes = new Float32Array(particlesCount)
        const phases = new Float32Array(particlesCount)
        const colors = new Float32Array(particlesCount * 3)
        const alphas = new Float32Array(particlesCount)

        const starColors = [
            new THREE.Color("#e1e5f4"),
            new THREE.Color("#869fdd"),
            new THREE.Color("#aff3ca"),
            new THREE.Color("#C7B6FF"),
        ]

        const spawnRadiusMax = 42
        const spreadX = 28
        const spreadY = 16

        const tempColor = new THREE.Color()

        const respawnStar = (i: number, initial = false) => {
            positions[i * 3] = (Math.random() - 0.5) * spreadX
            positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY
            positions[i * 3 + 2] = initial
                ? camera.position.z - Math.random() * spawnRadiusMax
                : camera.position.z - spawnRadiusMax

            sizes[i] = Math.random() * 1.2 + 0.2
            phases[i] = Math.random() * Math.PI * 2
            alphas[i] = initial ? Math.random() : 0

            const roll = Math.random()
            const paletteIndex =
                roll < 0.08 ? 3 :
                    roll < 0.45 ? 0 :
                        roll < 0.75 ? 1 : 2

            tempColor.copy(starColors[paletteIndex])

            const brightness = 0.85 + Math.random() * 0.35
            tempColor.multiplyScalar(brightness)

            colors[i * 3] = tempColor.r
            colors[i * 3 + 1] = tempColor.g
            colors[i * 3 + 2] = tempColor.b
        }

        for (let i = 0; i < particlesCount; i++) {
            respawnStar(i, true)
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1))
        geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1))

        const textureLoader = new THREE.TextureLoader()
        const starTexture = textureLoader.load("../src/textures/star.png")

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: starTexture },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            },
            vertexShader: `
                attribute float aSize;
                attribute float aPhase;
                attribute vec3 aColor;
                attribute float aAlpha;

                uniform float uTime;
                uniform float uPixelRatio;

                varying float vTwinkle;
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                    float twinkle = 0.7 + 0.5 * sin(uTime * 2.2 + aPhase);
                    vTwinkle = twinkle;
                    vColor = aColor;
                    vAlpha = aAlpha;

                    gl_PointSize = aSize * twinkle * uPixelRatio * (220.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;

                varying float vTwinkle;
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vec4 tex = texture2D(uTexture, gl_PointCoord);

                    vec3 color = vColor * vTwinkle;
                    float alpha = tex.a * (0.75 + vTwinkle * 0.35) * vAlpha;

                    gl_FragColor = vec4(color, alpha);

                    if (gl_FragColor.a < 0.01) discard;
                }
            `,
            transparent: true,
            depthWrite: false,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
        })

        const particles = new THREE.Points(geometry, material)
        scene.add(particles)

        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: "#8FA7C4",
            wireframe: true,
            transparent: true,
            opacity: 0,
        })

        const sphere = new THREE.Mesh(
            new THREE.IcosahedronGeometry(2.8, 1),
            sphereMaterial
        )

        const baseSpherePos = { x: 18, y: 12, z: -8 }

        sphere.position.set(
            baseSpherePos.x,
            baseSpherePos.y,
            baseSpherePos.z
        )
        sphere.scale.set(0.2, 0.2, 0.2)
        scene.add(sphere)

        gsap.to(baseSpherePos, {
            x: 3.5,
            y: 0,
            z: -1,
            duration: 2.5,
            ease: "power3.out",
            delay: 0.3,
        })

        gsap.to(sphere.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1.8,
            ease: "back.out(1.7)",
            delay: 0.3,
        })

        gsap.to(sphereMaterial, {
            opacity: 0.18,
            duration: 1.2,
            ease: "power2.out",
            delay: 0.3,
        })

        let frameId = 0

        const mouse = { x: 0, y: 0 }
        const target = { x: 0, y: 0 }
        const current = { x: 0, y: 0 }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = mount.getBoundingClientRect()

            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

            target.x = mouse.x * 0.6
            target.y = mouse.y * 0.4
        }

        const clock = new THREE.Clock()
        const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute
        const alphaAttr = geometry.getAttribute("aAlpha") as THREE.BufferAttribute

        const animate = () => {
            frameId = requestAnimationFrame(animate)

            const elapsed = clock.getElapsedTime()
            material.uniforms.uTime.value = elapsed

            particles.rotation.y += 0.00035
            particles.rotation.x += 0.00012

            sphere.rotation.y += 0.01
            sphere.rotation.x += 0.01

            current.x += (target.x - current.x) * 0.05
            current.y += (target.y - current.y) * 0.05

            for (let i = 0; i < particlesCount; i++) {
                const i3 = i * 3

                positionAttr.array[i3 + 2] += 0.08
                alphaAttr.array[i] = Math.min(1, alphaAttr.array[i] + 0.02)

                if (positionAttr.array[i3 + 2] > camera.position.z + 6) {
                    respawnStar(i, false)
                }
            }

            positionAttr.needsUpdate = true
            alphaAttr.needsUpdate = true

            sphere.position.x = baseSpherePos.x + current.x * 2
            sphere.position.y = baseSpherePos.y + current.y * 2
            sphere.position.z = baseSpherePos.z

            renderer.render(scene, camera)
        }

        animate()

        const handleResize = () => {
            const el = mountRef.current
            if (!el) return

            camera.aspect = el.clientWidth / el.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(el.clientWidth, el.clientHeight)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
        }

        window.addEventListener("resize", handleResize)
        mount.addEventListener("mousemove", handleMouseMove)

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener("resize", handleResize)
            mount.removeEventListener("mousemove", handleMouseMove)

            geometry.dispose()
            material.dispose()
            sphere.geometry.dispose()
            sphereMaterial.dispose()
            starTexture.dispose()
            renderer.dispose()

            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement)
            }
        }
    }, [])


    //gsap
    useEffect(() => {
        gsap.fromTo(
            titleRef.current,
            {
                y: -100,
                opacity: 0,
                
            },
            {
                delay: 0.2,
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "bounce.out"
            }
        );
        
        gsap.fromTo(
            contentRef.current,
            {
                x: -200,      
                opacity: 0
            },
            {
                x: 0,         
                opacity: 1,
                duration: 2,
                ease: "power3.out"
            }
        );
    }, []);

    return (
        <section className="hero-section">
            <div className="hero-bg-base" />
            <div ref={mountRef} className="hero-background" />

            <div ref={contentRef} className="hero-content">
                <p className="hero-eyebrow">Game Developer Portfolio</p>

                <h1 ref={titleRef} className="hero-title">
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
                    <Button variant={"primary"}>Projects</Button>
                    <Button variant={"secondary"}>About me </Button>
                </div>
            </div>
        </section>
    )
}