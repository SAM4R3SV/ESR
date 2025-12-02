/* ====== JS: interacción, validación y export ====== */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('examForm');
    const previewPdfBtn = document.getElementById('previewPdfBtn');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    const validateBtn = document.getElementById('validateBtn');

    // live remaining chars for textareas
    document.querySelectorAll('textarea[maxlength]').forEach(el => {
        const max = parseInt(el.getAttribute('maxlength') || '500', 10);
        const span = document.querySelector('.remaining[data-for="' + el.name + '"]');
        const update = () => { if (span) span.textContent = Math.max(0, max - el.value.length); };
        el.addEventListener('input', update);
        update();
    });

    // auto-expand textareas a medida que escriben (simple)
    document.querySelectorAll('textarea').forEach(t => {
        const expand = () => {
            t.style.height = 'auto';
            t.style.height = (t.scrollHeight) + 'px';
        };
        t.addEventListener('input', expand);
        expand();
    });

    function collectAnswers() {
        const fd = new FormData(form);
        const data = {
            meta: {
                discordUser: (fd.get('discordUser') || '').trim(),
                fullName: (fd.get('fullName') || '').trim(),
                rank: (fd.get('rank') || '').toString()
            },
            answers: {}
        };

        // 15 MCQ + 5 open
        for (let i = 1; i <= 15; i++) {
            data.answers['q' + i] = fd.get('q' + i) || null;
        }
        for (let i = 16; i <= 20; i++) {
            data.answers['q' + i] = (fd.get('q' + i) || '').trim();
        }
        data.timestamp = new Date().toISOString();
        return data;
    }

    // Validation: required fields + all questions answered
    function validateAll() {
        const data = collectAnswers();
        const missing = [];
        if (!data.meta.discordUser) missing.push('Usuario de Discord');
        if (!data.meta.fullName) missing.push('Nombre completo');
        const r = parseInt(data.meta.rank, 10);
        if (isNaN(r) || r < 1 || r > 8) missing.push('Rango (1-8 válido)');

        for (let i = 1; i <= 15; i++) if (!data.answers['q' + i]) missing.push('Pregunta ' + i + ' (selección única)');
        for (let i = 16; i <= 20; i++) {
            if (!data.answers['q' + i] || data.answers['q' + i].length === 0) missing.push('Pregunta abierta ' + i);
            else if (data.answers['q' + i].length > 500) missing.push('Pregunta abierta ' + i + ' (excede 500 caracteres)');
        }

        return { ok: missing.length === 0, missing, data };
    }

    validateBtn.addEventListener('click', (e) => {
        const res = validateAll();
        if (!res.ok) {
            alert('Faltan o hay errores en: \n- ' + res.missing.join('\n- '));
            return;
        }
        // previsualizar: genera JSON y alerta
        console.log('Datos válidos', res.data);
        alert('Formulario válido — puedes generar el PDF o descargar el JSON.');
    });

    // Generate a clean PDF-ready HTML from answers
    function buildPdfHtml(data) {
        const metaHtml = `
      <div><strong>Usuario Discord:</strong> ${escapeHtml(data.meta.discordUser)} </div>
      <div><strong>Nombre:</strong> ${escapeHtml(data.meta.fullName)} </div>
      <div><strong>Rango:</strong> ${escapeHtml(data.meta.rank)} </div>
      <div><strong>Fecha:</strong> ${new Date(data.timestamp).toLocaleString()} </div>
    `;
        const qHtml = [];
        for (let i = 1; i <= 15; i++) {
            qHtml.push(`<div style="margin-bottom:8px;"><strong>${i}.</strong> (Selección) Respuesta: ${escapeHtml(data.answers['q' + i] || '')}</div>`);
        }
        for (let i = 16; i <= 20; i++) {
            qHtml.push(`<div style="margin-top:12px;"><strong>${i}.</strong><div style="white-space:pre-wrap;margin-top:6px;border-left:3px solid #ffd400;padding-left:8px;padding-top:6px;padding-bottom:6px;">${escapeHtml(data.answers['q' + i] || '')}</div></div>`);
        }
        const html = `<div><div>${metaHtml}</div><hr>${qHtml.join('')}</div>`;
        return { metaHtml, bodyHtml: html };
    }

    // PDF export button
    previewPdfBtn.addEventListener('click', async () => {
        const res = validateAll();
        if (!res.ok) {
            alert('No se puede generar PDF — faltan datos o respuestas:\n- ' + res.missing.join('\n- '));
            return;
        }
        const data = res.data;
        const built = buildPdfHtml(data);
        // inject into hidden PDF area
        const pdfSource = document.getElementById('pdfSource');
        const content = document.getElementById('pdfContent');
        const meta = document.getElementById('pdfMeta');
        const questions = document.getElementById('pdfQuestions');
        meta.innerHTML = built.metaHtml;
        questions.innerHTML = built.bodyHtml;

        // show briefly (optional) then render
        const opt = {
            margin: [12, 12, 12, 12],
            filename: `${sanitizeFilename(data.meta.discordUser || 'examen')}_ESR_examen.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        // Convert and download
        try {
            await html2pdf().set(opt).from(content).save();
            alert('PDF generado y descargado. Envia tus resultados por mi MD en Discord.');
        } catch (err) {
            console.error(err);
            alert('Error generando PDF: ' + (err.message || err));
        }
    });

    // JSON download
    downloadJsonBtn.addEventListener('click', () => {
        const res = validateAll();
        if (!res.ok) {
            alert('No se puede descargar JSON — faltan datos o respuestas:\n- ' + res.missing.join('\n- '));
            return;
        }
        const data = res.data;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFilename(data.meta.discordUser || 'examen')}_ESR_respuestas.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    // Copy JSON to clipboard (para que lo peguen en Discord si quieren)
    copyJsonBtn.addEventListener('click', async () => {
        const res = validateAll();
        if (!res.ok) {
            alert('No se puede copiar JSON — faltan datos o respuestas:\n- ' + res.missing.join('\n- '));
            return;
        }
        const json = JSON.stringify(res.data, null, 2);
        try {
            await navigator.clipboard.writeText(json);
            alert('JSON copiado al portapapeles. Pueden pegarlo directamente en Discord o adjuntar el PDF.');
        } catch (e) {
            // fallback: show in new tab
            const w = window.open('', '_blank');
            w.document.write('<pre style="white-space:pre-wrap;">' + escapeHtml(json) + '</pre>');
            alert('No se pudo copiar automáticamente. Se abrió una ventana con el JSON para copiar manualmente.');
        }
    });

    // form submit (prevenir)
    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const res = validateAll();
        if (!res.ok) {
            alert('Faltan datos: \n- ' + res.missing.join('\n- '));
            return;
        }
        alert('Formulario válido. Usa los botones para exportar PDF/JSON o copiar JSON al portapapeles.');
    });

    function escapeHtml(s) {
        if (!s) return '';
        return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    }

    function sanitizeFilename(s) {
        return (s || 'examen').replace(/[^a-z0-9_\-\.]/ig, '_').slice(0, 120);
    }

});

// ==== LANGUAGE SYSTEM ====
const langSelector = document.getElementById("langSelector");
const langData = JSON.parse(document.getElementById("langData").innerHTML);

function applyLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");

    if (langData[lang] && langData[lang][key]) {
      el.textContent = langData[lang][key];
    }
  });

  localStorage.setItem("lang", lang); // remember
}

// initial load
const savedLang = localStorage.getItem("lang") || "es";
langSelector.value = savedLang;
applyLanguage(savedLang);

// change event
langSelector.addEventListener("change", e => {
  applyLanguage(e.target.value);
});
