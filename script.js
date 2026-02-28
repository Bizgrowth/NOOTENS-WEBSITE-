// The Stockton Collection - Website Logic

document.addEventListener("DOMContentLoaded", () => {

    // 1. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // 2. Preloader Animation
    const tlLoader = gsap.timeline();

    tlLoader.to(".loader-logo", {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power4.out"
    })
        .to(".loader-logo", {
            opacity: 0,
            duration: 0.5,
            delay: 0.5
        })
        .to(".loader", {
            yPercent: -100,
            duration: 1,
            ease: "power4.inOut",
            onComplete: () => {
                document.body.classList.remove("loading");
                initHeroAnimations();
            }
        });

    // 3. Navbar Scroll Effect
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    // 4. Hero Animations
    function initHeroAnimations() {
        gsap.from(".gsap-hero", {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });

        // Simple parallax on hero overlay
        gsap.to(".hero-content", {
            y: "30%",
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // 5. About Section Image Reveal & Parallax
    gsap.to(".image-reveal", {
        height: 0,
        ease: "power4.inOut",
        scrollTrigger: {
            trigger: ".about-image-wrapper",
            start: "top 80%",
            end: "bottom 80%",
            duration: 1.5
        }
    });

    gsap.to(".about-image", {
        y: "-20%",
        ease: "none",
        scrollTrigger: {
            trigger: ".about-image-wrapper",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.from(".experience-badge", {
        scale: 0,
        rotation: -45,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
            trigger: ".about-image-wrapper",
            start: "top 50%"
        }
    });

    // 6. Horizontal Scroll Portfolio Gallery
    const portfolioWrapper = document.querySelector(".horizontal-scroll-wrapper");
    if (portfolioWrapper) {
        let scrollerWidth = portfolioWrapper.scrollWidth - window.innerWidth;

        gsap.to(portfolioWrapper, {
            x: () => -scrollerWidth + "px",
            ease: "none",
            scrollTrigger: {
                trigger: ".portfolio",
                start: "top top",
                end: () => "+=" + scrollerWidth,
                pin: true,
                scrub: 1,
                // invalidateOnRefresh: true
            }
        });

        // Image Parallax inside Horizontal Scroll
        const parallaxImgs = gsap.utils.toArray('.parallax-img');
        parallaxImgs.forEach((img) => {
            gsap.to(img, {
                xPercent: -20,
                ease: "none",
                scrollTrigger: {
                    trigger: ".portfolio",
                    start: "top bottom",
                    end: () => "+=" + (scrollerWidth + window.innerHeight),
                    scrub: true
                }
            });
        });
    }

    // 7. General Fade Up for Sections
    const fadeElements = gsap.utils.toArray('.section-title, .section-subtitle, .about-text, .community-card, .btn-large');
    fadeElements.forEach(elem => {
        gsap.from(elem, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: elem,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // 8. Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const mobileBtnIcon = mobileBtn ? mobileBtn.querySelector('i') : null;

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navLinks.classList.contains('active')) {
                mobileBtnIcon.classList.remove('fa-bars');
                mobileBtnIcon.classList.add('fa-times');
            } else {
                mobileBtnIcon.classList.remove('fa-times');
                mobileBtnIcon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                if (mobileBtnIcon) {
                    mobileBtnIcon.classList.remove('fa-times');
                    mobileBtnIcon.classList.add('fa-bars');
                }
            });
        });
    }
});
