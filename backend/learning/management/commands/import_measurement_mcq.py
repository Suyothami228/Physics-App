import json
from pathlib import Path
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from learning.models import Chapter, ExamSection, ExamQuestion

class Command(BaseCommand):
    help = 'Import the 81 supplied Measurements and Dimensions MCQs, preserving existing educator edits.'
    def add_arguments(self, parser):
        parser.add_argument('--upgrade-scans', action='store_true', help='Replace only legacy scan placeholders with transcribed text; preserve educator edits.')
    @transaction.atomic
    def handle(self, *args, **kwargs):
        base = Path(__file__).resolve().parents[2] / 'data' / 'measurement_mcq'
        rows = json.loads((base/'questions.json').read_text(encoding='utf-8'))
        typed = {}
        for line in (base/'typed.tsv').read_text(encoding='utf-8').splitlines():
            number,prompt,options = line.split('\t')
            typed[int(number)] = (prompt.replace('\\n','\n'),options.replace('|','\n'))
        if set(typed) != set(range(1,82)):
            raise CommandError('Expected 81 typed question entries.')
        if [r['number'] for r in rows] != list(range(1,82)):
            raise CommandError('Expected exactly questions 1–81 in order.')
        chapter = Chapter.objects.get(pk='01')
        section,_ = ExamSection.objects.get_or_create(chapter=chapter,slug='measurements-dimensions',defaults={'title_en':'Measurements and Dimensions','title_ta':'அளவீடுகளும் பரிமாணங்களும்'})
        count=0
        for row in rows:
            n=row['number']; key=f'measurement-mcq-v1-{n:02}'
            existing=ExamQuestion.objects.filter(import_key=key).first()
            if existing:
                if kwargs['upgrade_scans'] and existing.prompt_en.startswith('Read the original Tamil question below') and existing.options_en.startswith('Option 1\n'):
                    existing.prompt_ta,existing.options_ta=typed[n]
                    existing.prompt_en='';existing.options_en=''
                    existing.published=bool(existing.options_ta)
                    existing.full_clean();existing.save();count+=1
                continue
            answers=row['answers']
            q=ExamQuestion(chapter=chapter,section=section,kind='mcq',year=row['year'],paper='S. R. Jeyakumar · Unit 1 collection',number=str(n),position=n,import_key=key,
                title_en=f'Question {n:02} · Measurements and Dimensions',title_ta=f'வினா {n:02} · அளவீடுகளும் பரிமாணங்களும்',
                prompt_en='',prompt_ta=typed[n][0],
                options_en='',options_ta=typed[n][1],
                correct_option=answers[0],accepted_options=answers if len(answers)>1 else [],
                solution_en='Supplied answer key: '+', '.join(map(str,answers))+'.'+(' Either option is accepted by the supplied key.' if len(answers)>1 else '')+' A worked explanation is not included in the supplied answer sheet.',
                solution_ta='வழங்கப்பட்ட விடைக்குறிப்பின்படி: '+', '.join(map(str,answers))+'.'+(' வழங்கப்பட்ட விடைக்குறிப்பில் இரு தெரிவுகளும் ஏற்கப்பட்டுள்ளன.' if len(answers)>1 else '')+' படிப்படியான விளக்கம் வழங்கப்பட்ட விடைத்தாளில் இல்லை.',
                marks=1,minutes=2,published=bool(typed[n][1]))
            with (base/row['image']).open('rb') as image:
                q.question_image.save(f'{key}.png',File(image),save=False)
            q.full_clean();q.save();count+=1
        self.stdout.write(self.style.SUCCESS(f'{count} questions imported/upgraded; {81-count} existing questions preserved. Q11 and Q68 require clearer source choices before publication.'))
