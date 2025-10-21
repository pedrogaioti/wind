/* ===============================================
   Wind Airways - JavaScript
   Responsável por: Interatividade e animações dinâmicas
   =============================================== */

// Configuração inicial
const WindAirways = {
    // Dados das estatísticas
    stats: {
        totalFlights: 2847,
        flightHours: 18542,
        activePilots: 127,
        routes: 89
    },

    // Inicialização
    init() {
        this.setupSmoothScroll();
        this.setupObservers();
        this.setupExternalLinks();
        this.setupMobileMenu();
        this.setupNavHighlight();
    },

    // Scroll suave para links de navegação
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },

    // Animação de contadores
    animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString('pt-BR');
        }, 16);
    },

    // Configurar Intersection Observers
    setupObservers() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animar elementos com classe slide-in
                    if (entry.target.classList.contains('slide-in')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }

                    // Animar contadores na seção de estatísticas
                    if (entry.target.id === 'statistics') {
                        this.animateStatistics();
                        observer.unobserve(entry.target);
                    }

                    // Animar cards
                    if (entry.target.classList.contains('card-hover')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                }
            });
        }, observerOptions);

        // Observar elementos
        document.querySelectorAll('.slide-in, .card-hover').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease-out';
            observer.observe(el);
        });

        const statsSection = document.getElementById('statistics');
        if (statsSection) {
            observer.observe(statsSection);
        }
    },

    // Animar estatísticas
    animateStatistics() {
        const elements = {
            totalFlights: document.getElementById('totalFlights'),
            flightHours: document.getElementById('flightHours'),
            activePilots: document.getElementById('activePilots'),
            routes: document.getElementById('routes')
        };

        // Delay escalonado para cada contador
        setTimeout(() => this.animateCounter(elements.totalFlights, this.stats.totalFlights), 200);
        setTimeout(() => this.animateCounter(elements.flightHours, this.stats.flightHours), 400);
        setTimeout(() => this.animateCounter(elements.activePilots, this.stats.activePilots), 600);
        setTimeout(() => this.animateCounter(elements.routes, this.stats.routes), 800);
    },

    // Adicionar animação aos links externos
    setupExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            link.addEventListener('click', function(e) {
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-spin');
                    setTimeout(() => {
                        icon.classList.remove('fa-spin');
                    }, 1000);
                }
            });
        });
    },

    // Menu mobile (preparado para expansão futura)
    setupMobileMenu() {
        const mobileMenuButton = document.querySelector('[data-mobile-menu]');
        const mobileMenu = document.querySelector('[data-mobile-menu-content]');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                mobileMenuButton.classList.toggle('active');
            });

            // Fechar menu ao clicar em um link
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.classList.remove('active');
                });
            });
        }
    },

    // Destacar item de navegação ativo
    setupNavHighlight() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const highlightNav = () => {
            const scrollPosition = window.scrollY + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('text-sky-600');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('text-sky-600');
                        }
                    });
                }
            });
        };

        window.addEventListener('scroll', highlightNav);
        highlightNav(); // Executar na carga inicial
    },

    // Utilitários
    utils: {
        // Debounce para otimizar eventos
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Verificar se elemento está visível
        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }
    }
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WindAirways.init());
} else {
    WindAirways.init();
}

// Adicionar efeito parallax sutil ao scroll
window.addEventListener('scroll', WindAirways.utils.debounce(() => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
}, 10));

// Performance: remover animações em dispositivos com preferência reduzida
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('*').forEach(element => {
        element.style.animation = 'none';
        element.style.transition = 'none';
    });
}

// Exportar para uso global
window.WindAirways = WindAirways;