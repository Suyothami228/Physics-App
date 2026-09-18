/* Source images stay in the browser; OCR output is untrusted editable text. */
(function () {
  function splitQuestion(text) {
    // Only accept an unambiguous sequence 1..N. Never invent missing choices.
    const matches = [...text.matchAll(/(?:\(([1-5])\)|(?:^|\n)\s*([1-5])[.)])\s*/g)];
    const valid = matches.length >= 2 && matches.length <= 5 && matches.every((m, i) => Number(m[1] || m[2]) === i + 1);
    if (!valid) return { prompt: text.trim(), options: [], warning: 'Could not reliably separate the numbered choices. Enter the choices manually below.' };
    return {
      prompt: text.slice(0, matches[0].index).trim(),
      options: matches.map((m, i) => text.slice(m.index + m[0].length, matches[i + 1]?.index ?? text.length).trim().replace(/\s*\n\s*/g, ' ')),
      warning: '',
    };
  }
  if (typeof module !== 'undefined') module.exports = { splitQuestion };
  if (typeof document === 'undefined') return;
  const panel = document.getElementById('exam-ocr');
  if (!panel) return;
  const byId = id => document.getElementById(id);
  const status = message => { byId('ocr-status').textContent = message; };
  let worker, previewUrl, extractedLanguage, generation = 0;
  byId('ocr-extract').addEventListener('click', async () => {
    const file = byId('ocr-photo').files[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      status('Choose a PNG/JPEG question photo smaller than 10 MB.'); return;
    }
    const run = ++generation;
    const language = byId('ocr-language').value;
    byId('ocr-extract').disabled = true;
    byId('ocr-cancel').hidden = false;
    byId('ocr-apply').disabled = true;
    status('Loading OCR…');
    try {
      if (!window.Tesseract) throw new Error('OCR library unavailable');
      const current = await Tesseract.createWorker(language === 'ta' ? 'tam+eng' : 'eng', 1, {
        workerPath: panel.dataset.worker,
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        logger: m => { if (run === generation) status(`${m.status} ${Math.round((m.progress || 0) * 100)}%`); },
      });
      if (run !== generation) { await current.terminate(); return; }
      worker = current;
      const { data } = await current.recognize(file);
      if (run !== generation) return;
      if (!data.text.trim()) throw new Error('No text found');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      byId('ocr-preview').src = previewUrl;
      byId('ocr-text').value = data.text;
      extractedLanguage = language;
      byId('ocr-review').hidden = false;
      byId('ocr-apply').disabled = false;
      status('Text extracted. Review it against the photo before filling the draft.');
    } catch (e) {
      if (run === generation) status('Text extraction failed. Check your connection, try a clearer cropped photo, or type the question manually. Your form has not changed.');
    } finally {
      if (worker && run === generation) { await worker.terminate(); worker = null; }
      if (run === generation) { byId('ocr-extract').disabled = false; byId('ocr-cancel').hidden = true; }
    }
  });
  byId('ocr-cancel').addEventListener('click', () => {
    generation++;
    if (worker) { worker.terminate(); worker = null; }
    byId('ocr-extract').disabled = false; byId('ocr-cancel').hidden = true;
    status('Extraction cancelled. Your question fields have not changed.');
  });
  byId('ocr-apply').addEventListener('click', () => {
    const lang = extractedLanguage;
    const result = ['structured','essay'].includes(byId('id_kind').value)
      ? {prompt:byId('ocr-text').value.trim(), options:[], warning:''}
      : splitQuestion(byId('ocr-text').value);
    if (!result.prompt || result.options.some(x => !x)) { status('Enter the question text and complete every choice before transferring.'); return; }
    if ((byId(`id_prompt_${lang}`).value || byId(`id_options_${lang}`).value) && !window.confirm('Replace the existing question and choices in this language with the reviewed text?')) return;
    byId(`id_prompt_${lang}`).value = result.prompt;
    byId(`id_options_${lang}`).value = result.options.join('\n');
    byId('id_published').checked = false;
    byId('id_confirm_review').checked = false;
    // A new extracted question must never inherit an old question's answer key.
    byId('id_correct_option').value = '';
    byId('id_accepted_options').value = '[]';
    status(result.warning || 'Draft fields filled. Enter the correct answer and review all choices before publishing.');
    byId(`id_prompt_${lang}`).focus();
  });
  window.addEventListener('beforeunload', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); if (worker) worker.terminate(); });
})();
