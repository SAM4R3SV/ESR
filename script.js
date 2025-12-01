/* ====== JS: Interacciones del menú de inicio ESR ======
   - Botón Recargar: refresca la página.
   - Botón Acerca de: muestra información breve del proyecto.
   - Botón Proximamente: efecto Matrix de lluvia de caracteres (5 segundos).
=============================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos interactivos
  const refreshBtn = document.getElementById('refreshBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const matrixBtn = document.getElementById('matrixBtn');
  const matrixCanvas = document.getElementById('matrixCanvas');

  /**
   * handleRefresh
   * Acción: Recarga la página actual desde el servidor
   */
  function handleRefresh() {
    window.location.reload(true);
  }

  /**
   * handleAbout
   * Acción: Muestra un cuadro de diálogo con detalles del proyecto.
   */
  function handleAbout() {
    const msg = [
      'E.S.R. — Menú de Inicio',
      '• Estética: elegante con tipografía Playfair Display y Lato.',
      '• Diseño responsivo: se adapta a cualquier tamaño de pantalla.',
      '• Secciones: Exámenes y Tabla de puntos.',
      '• Colores armoniosos: oro y tonos neutros.',
      '',
      'Créditos: @samaresv juez supremo de ESR'
    ].join('\n');
    alert(msg);
  }

  /**
   * Matrix Rain Effect
   * Crea un efecto de lluvia de caracteres tipo Matrix en pantalla completa
   */
  class MatrixRain {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resizeCanvas();
      this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      this.columns = Math.floor(this.canvas.width / 20);
      this.drops = Array(this.columns).fill(0);
      this.speed = 2;
      this.opacity = 1;
      this.startTime = Date.now();
      this.duration = 5000; // 5 segundos
    }

    resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    draw() {
      const elapsed = Date.now() - this.startTime;
      const progress = elapsed / this.duration;

      // Fade out en los últimos 500ms
      if (progress > 0.9) {
        this.opacity = Math.max(0, 1 - (progress - 0.9) / 0.1);
      }

      // Fondo semi-transparente
      this.ctx.fillStyle = `rgba(10, 10, 10, 0.1)`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Estilo del texto
      this.ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
      this.ctx.font = 'bold 20px monospace';
      this.ctx.textAlign = 'center';

      // Dibujar caracteres
      for (let i = 0; i < this.columns; i++) {
        const char = this.chars[Math.floor(Math.random() * this.chars.length)];
        const x = i * 20 + 10;
        const y = this.drops[i] * 20;

        this.ctx.fillText(char, x, y);

        // Reiniciar columna si llega al final
        if (y > this.canvas.height && Math.random() > 0.975) {
          this.drops[i] = 0;
        }

        this.drops[i] += this.speed;
      }

      return progress < 1;
    }
  }

  /**
   * handleMatrix
   * Acción: Inicia el efecto Matrix por 5 segundos
   */
  function handleMatrix() {
    matrixCanvas.style.display = 'block';
    const matrix = new MatrixRain(matrixCanvas);

    const animate = () => {
      const shouldContinue = matrix.draw();
      if (shouldContinue) {
        requestAnimationFrame(animate);
      } else {
        matrixCanvas.style.display = 'none';
      }
    };

    animate();
  }

  // Enlaces de eventos
  if (refreshBtn) refreshBtn.addEventListener('click', handleRefresh);
  if (aboutBtn) aboutBtn.addEventListener('click', handleAbout);
  if (matrixBtn) matrixBtn.addEventListener('click', handleMatrix);

  // Redimensionar canvas si es necesario
  window.addEventListener('resize', () => {
    if (matrixCanvas.style.display !== 'none') {
      const matrix = new MatrixRain(matrixCanvas);
    }
  });
});
