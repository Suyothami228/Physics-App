"""Export only the student-visible, published question bank for static review."""
import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from learning.models import ExamQuestion
from learning import exam_views


class Command(BaseCommand):
    help = 'Export published text questions and answers for the standalone educator preview'

    def add_arguments(self, parser):
        parser.add_argument('--output', default='public/review/exam-bank.json')

    def handle(self, *args, **options):
        rows = ExamQuestion.objects.filter(published=True)
        if rows.exclude(question_pdf='').exists() or rows.exclude(marking_pdf='').exists():
            raise CommandError('This text-only export cannot include PDF attachments. Supply typed questions and solutions first.')
        factory = RequestFactory()
        request = factory.get('/api/exam/catalog/')
        request.user = AnonymousUser()
        payload = {'catalog': json.loads(exam_views.catalog(request).content), 'collections': {}, 'solutions': {}}
        for chapter, kind in rows.order_by('chapter_id', 'kind').values_list('chapter_id', 'kind').distinct():
            params = {'chapter': chapter, 'kind': kind, 'page': 1}
            result = json.loads(exam_views.questions(factory.get('/', params)).content)
            questions = list(result['questions'])
            for page in range(2, result['pages'] + 1):
                params['page'] = page
                questions.extend(json.loads(exam_views.questions(factory.get('/', params)).content)['questions'])
            section_by_id = dict(rows.filter(chapter_id=chapter, kind=kind).values_list('id', 'section__slug'))
            for question in questions:
                question['section'] = section_by_id[question['id']]
                payload['solutions'][str(question['id'])] = json.loads(exam_views.solution(request, question['id']).content)
            result['questions'] = questions
            payload['collections'][f'{chapter}/{kind}'] = result
        output = Path(options['output'])
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        self.stdout.write(self.style.SUCCESS(f'Exported {rows.count()} published questions to {output} (no drafts, source images, or accounts).'))
