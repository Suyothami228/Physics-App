from django.conf import settings
from django.db import models


class Chapter(models.Model):
    id = models.CharField(primary_key=True, max_length=8)
    title_en = models.CharField(max_length=200)
    title_ta = models.CharField(max_length=200)
    metadata = models.JSONField(default=dict)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.id} · {self.title_en}"


class Lesson(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="lessons")
    title_en = models.CharField(max_length=200)
    title_ta = models.CharField(max_length=200)
    position = models.PositiveSmallIntegerField()
    available = models.BooleanField(default=False)
    content_status = models.CharField(max_length=12, choices=[("draft", "Draft"), ("published", "Published")], default="draft")
    metadata = models.JSONField(default=dict)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return self.title_en


class Question(models.Model):
    # Existing style/variant identifiers remain stable through migration.
    id = models.CharField(primary_key=True, max_length=100)
    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT)
    style = models.CharField(max_length=60)
    variant = models.PositiveSmallIntegerField()
    family = models.CharField(max_length=60)
    content = models.JSONField()
    active = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["lesson", "style", "variant"], name="unique_question_variant")]

    def __str__(self):
        return self.id


class Attempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.PROTECT)
    # Snapshot protects history when an educator edits a question.
    prompt = models.TextField()
    answer = models.CharField(max_length=100, blank=True)
    correct = models.BooleanField(default=False)
    assisted = models.BooleanField(default=False)
    viewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["user", "question"], name="attempt_user_question")]
from django.core.exceptions import ValidationError


class LessonBlock(models.Model):
    KINDS = [('theory', 'Explanation'), ('example', 'Worked example'), ('activity', 'Interactive activity'), ('check', 'Quick check')]
    ACTIVITIES = [('', 'None'), ('units', 'Unit converter'), ('vernier', 'Vernier calliper'), ('uncertainty', 'Repeated measurements'), ('vectors', 'Vector components'), ('pendulum', 'Pendulum investigation'), ('particles', 'Ideal gas particles'), ('angles', 'Angle ratios'), ('dimension-builder', 'Dimension builder'), ('dimension-equations', 'Equation detective'), ('dimension-scaling', 'Pendulum scaling'), ('dimension-conversion', 'SI-CGS dimension converter'), ('error-target', 'Bias and scatter'), ('error-relative', 'Relative uncertainty'), ('error-propagation', 'Uncertainty propagation'), ('vernier-3d', '3D vernier caliper lab'), ('micrometer-3d', '3D micrometer lab'), ('spherometer-3d', '3D spherometer lab'), ('travelling-3d', '3D travelling microscope lab')]
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='blocks')
    key = models.SlugField(max_length=80, help_text='Stable identifier within this lesson, e.g. si-units.')
    instrument = models.CharField(max_length=30, blank=True, choices=[('', 'General lesson'), ('ruler', 'Metre rule'), ('vernier', 'Vernier caliper'), ('micrometer', 'Micrometer'), ('spherometer', 'Spherometer'), ('travelling', 'Travelling microscope'), ('balance', 'Balance'), ('stopwatch', 'Stopwatch'), ('thermometer', 'Thermometer')], help_text='For Measuring Instruments: choose the instrument page where this block belongs.')
    position = models.PositiveSmallIntegerField(default=1)
    kind = models.CharField(max_length=20, choices=KINDS, default='theory')
    published = models.BooleanField(default=True)
    title_en = models.CharField(max_length=200)
    title_ta = models.CharField(max_length=200)
    presentation = models.CharField(max_length=20, default='plain', choices=[('plain','Paragraphs'),('cards','Visual concept cards'),('process','Investigation cycle'),('approaches','Compare approaches'),('branches','Physics branches'),('table','Interactive reference table')])
    body_en = models.TextField(blank=True, help_text='For visual layouts: separate cards with a blank line. Each card starts with a short heading, then a new line and its explanation.')
    body_ta = models.TextField(blank=True)
    formula = models.CharField(max_length=300, blank=True)
    activity = models.CharField(max_length=30, choices=ACTIVITIES, blank=True)
    options_en = models.TextField(blank=True, help_text='For quick checks: one option per line, 2 to 5 options.')
    options_ta = models.TextField(blank=True)
    correct_option = models.PositiveSmallIntegerField(default=1, help_text='Correct option number, starting at 1.')
    explanation_en = models.TextField(blank=True)
    explanation_ta = models.TextField(blank=True)

    class Meta:
        ordering = ['position', 'id']
        constraints = [models.UniqueConstraint(fields=['lesson', 'key'], name='unique_lesson_block')]

    def clean(self):
        if self.presentation != 'plain':
            import re
            en=[x for x in re.split(r'\n\s*\n',self.body_en.strip()) if x.strip()]
            ta=[x for x in re.split(r'\n\s*\n',self.body_ta.strip()) if x.strip()]
            if not en or len(en) != len(ta) or any('\n' not in x.strip() for x in en+ta):
                raise ValidationError('Visual layouts need matching cards in both languages. Each card requires a heading, a newline and an explanation; separate cards with a blank line.')
            if self.presentation == 'table':
                sizes = [len(chunk.split('\n', 1)[1].split('|')) for chunk in en + ta]
                if len(en) < 2 or min(sizes) < 1 or len(set(sizes)) != 1:
                    raise ValidationError('Tables need a header and at least one row, with matching pipe-separated columns in both languages.')
        if self.kind == 'check':
            en = self.options_en.strip().splitlines()
            ta = self.options_ta.strip().splitlines()
            if not 2 <= len(en) <= 5 or len(en) != len(ta) or any(not x.strip() for x in en+ta):
                raise ValidationError('Quick checks require 2–5 non-empty options in each language, in matching order.')
            if not 1 <= self.correct_option <= len(en):
                raise ValidationError({'correct_option': 'Choose a valid option number.'})
            if not self.explanation_en or not self.explanation_ta:
                raise ValidationError('Add a worked explanation in both languages.')
        if self.kind == 'activity' and not self.activity:
            raise ValidationError({'activity': 'Select an interactive activity.'})

    def __str__(self):
        return f'{self.lesson_id} · {self.title_en}'




from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator, MaxValueValidator

def validate_exam_pdf(value):
    if value.size > 20 * 1024 * 1024:
        raise ValidationError('PDF must be 20 MB or smaller.')
    was_closed = value.closed
    pos = value.tell()
    value.seek(0)
    signature = value.read(5)
    value.seek(pos)
    if was_closed:
        value.close()
    if signature != b'%PDF-':
        raise ValidationError('Upload a valid PDF file.')

def validate_exam_image(value):
    if value.size > 10 * 1024 * 1024:
        raise ValidationError('Image must be 10 MB or smaller.')
    was_closed = value.closed
    pos = value.tell()
    value.seek(0)
    signature = value.read(8)
    value.seek(pos)
    if was_closed:
        value.close()
    if not (signature == b'\x89PNG\r\n\x1a\n' or signature[:3] == b'\xff\xd8\xff'):
        raise ValidationError('Upload a PNG or JPEG image.')

class ExamSection(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.PROTECT, related_name='exam_sections')
    slug = models.SlugField()
    title_en = models.CharField(max_length=200)
    title_ta = models.CharField(max_length=200)
    class Meta:
        ordering = ['id']
        constraints = [models.UniqueConstraint(fields=['chapter','slug'], name='unique_exam_section')]
    def __str__(self):
        return f'{self.chapter_id} · {self.title_en}'

class ExamQuestion(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.PROTECT, related_name='exam_questions')
    section = models.ForeignKey(ExamSection, null=True, blank=True, on_delete=models.PROTECT, related_name='questions')
    position = models.PositiveSmallIntegerField(default=0)
    import_key = models.CharField(max_length=120, unique=True, null=True, blank=True, editable=False)
    question_image = models.FileField(upload_to='exam/images/', blank=True, validators=[FileExtensionValidator(['png','jpg','jpeg']), validate_exam_image])
    accepted_options = models.JSONField(default=list, blank=True, help_text='Optional list of accepted MCQ option numbers, e.g. [3, 5]. Leave empty for a single correct option.')
    kind = models.CharField(max_length=12, choices=[('mcq','MCQ'),('structured','Structured'),('essay','Essay')])
    year = models.PositiveSmallIntegerField(validators=[MinValueValidator(1970), MaxValueValidator(2100)])
    paper = models.CharField(max_length=120, help_text='For example: GCE A/L Physics Paper I, Tamil medium')
    number = models.CharField(max_length=30, help_text='Original question number, including subpart if applicable')
    title_en = models.CharField(max_length=200)
    title_ta = models.CharField(max_length=200)
    prompt_en = models.TextField(blank=True)
    prompt_ta = models.TextField(blank=True)
    question_pdf = models.FileField(upload_to='exam/questions/', blank=True, validators=[FileExtensionValidator(['pdf']), validate_exam_pdf])
    source_url = models.URLField(blank=True, help_text='Official source or original paper link')
    marks = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    minutes = models.PositiveSmallIntegerField(default=2, validators=[MinValueValidator(1)])
    options_en = models.TextField(blank=True, help_text='MCQ: one option per line, matching Tamil order')
    options_ta = models.TextField(blank=True)
    correct_option = models.PositiveSmallIntegerField(null=True, blank=True, help_text='MCQ correct option, starting at 1')
    solution_en = models.TextField(blank=True)
    solution_ta = models.TextField(blank=True)
    marking_pdf = models.FileField(upload_to='exam/marking/', blank=True, validators=[FileExtensionValidator(['pdf']), validate_exam_pdf])
    published = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position','-year','paper','number','id']

    def clean(self):
        if self.section_id and self.section.chapter_id != self.chapter_id:
            raise ValidationError({'section':'Choose a section belonging to this chapter.'})
        if self.accepted_options is None:
            self.accepted_options = []
        if not isinstance(self.accepted_options, list) or any(type(n) is not int or not 1 <= n <= 5 for n in self.accepted_options):
            raise ValidationError({'accepted_options':'Use a list of option numbers from 1 to 5.'})
        if not self.published:
            return
        if not (self.prompt_en.strip() or self.prompt_ta.strip()):
            raise ValidationError('Type the question before publishing. A source photo or PDF cannot replace question text.')
        if 'ஐந்து தெரிவுகளும் படத்தில் உள்ளன' in self.prompt_ta or 'Read the original Tamil question below' in self.prompt_en:
            raise ValidationError('Replace the scan instructions with the actual question before publishing.')
        if self.kind == 'mcq':
            en, ta = (self.options_en or self.options_ta).strip().splitlines(), (self.options_ta or self.options_en).strip().splitlines()
            if (self.prompt_en.strip() and not self.options_en.strip()) or (self.prompt_ta.strip() and not self.options_ta.strip()):
                raise ValidationError('Add actual answer choices in the question language.')
            if any(s.strip() in [f'Option {i}' for i in range(1,6)] + [f'தெரிவு {i}' for i in range(1,6)] for s in en + ta):
                raise ValidationError('Replace numbered placeholders with actual answer choices.')
            if not 2 <= len(en) <= 5 or len(en) != len(ta) or any(not s.strip() for s in en + ta):
                raise ValidationError('Published MCQs need 2–5 matching, non-empty options in each language.')
            if any(n > len(en) for n in self.accepted_options):
                raise ValidationError({'accepted_options':'An accepted option exceeds the number of choices.'})
            if self.accepted_options and self.correct_option not in self.accepted_options:
                raise ValidationError({'accepted_options':'Include the primary correct option.'})
            if self.correct_option is None or not 1 <= self.correct_option <= len(en):
                raise ValidationError({'correct_option':'Select a valid option number.'})
        if not self.marking_pdf and not (self.solution_en.strip() and self.solution_ta.strip()):
            raise ValidationError('Add both language solutions or a marking-scheme PDF before publishing.')

    def __str__(self):
        return f'{self.year} · {self.paper} · Q{self.number} · {self.title_en}'
