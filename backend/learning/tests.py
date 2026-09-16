import json
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client, TestCase
from .models import Chapter, Lesson, Question, Attempt


class LearningTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content', verbosity=0)
        cls.user = get_user_model().objects.create_user('learner', password='test-password-123')
        cls.other = get_user_model().objects.create_user('other', password='test-password-456')

    def setUp(self):
        self.client.force_login(self.user)

    def post(self, path, data):
        return self.client.post('/api/' + path + '/', data=json.dumps(data), content_type='application/json')

    def test_seed_is_idempotent_and_preserves_edits(self):
        Chapter.objects.filter(pk='01').update(title_ta='தமிழ் ஆசிரியர் திருத்தம்')
        call_command('seed_content', verbosity=0)
        self.assertEqual(Chapter.objects.count(), 11)
        self.assertEqual(Lesson.objects.count(), 72)
        self.assertEqual(Question.objects.count(), 90)
        self.assertEqual(Chapter.objects.get(pk='01').title_ta, 'தமிழ் ஆசிரியர் திருத்தம்')

    def test_curriculum_and_questions_have_no_answers(self):
        data = self.client.get('/api/curriculum/').json()
        self.assertEqual(len(data['chapters']), 11)
        self.assertEqual(data['total'], 72)
        q = self.client.get('/api/questions/').json()['questions'][0]
        for private in ['value', 'correct', 'explain', 'tolerance']:
            self.assertNotIn(private, q)

    def test_server_grades_and_ignores_forged_result(self):
        response = self.post('attempts', {'question': 'energy-1:0', 'answer': '30', 'correct': True, 'assisted': False, 'at': 1})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['attempt']['correct'])
        self.assertGreater(response.json()['attempt']['at'], 1)
        again = self.post('attempts', {'question': 'energy-1:0', 'answer': '60'})
        self.assertFalse(again.json()['attempt']['correct'])
        self.assertEqual(Attempt.objects.count(), 1)

    def test_solution_view_survives_session_and_excludes_answer(self):
        self.post('solutions', {'question': 'energy-1:0'})
        self.client.logout()
        self.client.force_login(self.user)
        response = self.post('attempts', {'question': 'energy-1:0', 'answer': '60'})
        self.assertTrue(response.json()['attempt']['assisted'])
        self.assertTrue(response.json()['attempt']['correct'])
        self.post('solutions', {'question': 'energy-1:0'})
        self.assertEqual(Attempt.objects.count(), 2)

    def test_users_cannot_read_or_clear_each_others_progress(self):
        self.post('attempts', {'question': 'energy-1:0', 'answer': '60'})
        self.client.force_login(self.other)
        self.assertEqual(self.client.get('/api/attempts/').json()['attempts'], [])
        self.client.delete('/api/attempts/')
        self.assertEqual(Attempt.objects.filter(user=self.user).count(), 1)

    def test_anonymous_and_invalid_payloads(self):
        for answer in ['', True, [], 'NaN', 'Infinity', None]:
            self.assertEqual(self.post('attempts', {'question': 'energy-1:0', 'answer': answer}).status_code, 400)
        self.assertEqual(self.post('attempts', []).status_code, 400)
        self.client.logout()
        self.assertEqual(self.client.get('/api/attempts/').status_code, 401)
        self.assertEqual(self.post('solutions', {'question': 'energy-1:0'}).status_code, 401)

    def test_session_login_requires_csrf_and_logout(self):
        client = Client(enforce_csrf_checks=True)
        client.get('/api/session/')
        data = json.dumps({'username': 'learner', 'password': 'test-password-123'})
        self.assertEqual(client.post('/api/session/', data=data, content_type='application/json').status_code, 403)
        token = client.cookies['csrftoken'].value
        login = client.post('/api/session/', data=data, content_type='application/json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()['user']['username'], 'learner')
        token = client.cookies['csrftoken'].value
        self.assertEqual(client.delete('/api/session/', HTTP_X_CSRFTOKEN=token).status_code, 200)
        self.assertIsNone(client.get('/api/session/').json()['user'])

    def test_invalid_choice_and_numeric_tolerance(self):
        choice = next(q for q in Question.objects.all() if q.content['type'] == 'choice')
        self.assertEqual(self.post('attempts', {'question': choice.id, 'answer': '0.5'}).status_code, 400)
        result = self.post('attempts', {'question': 'energy-1:0', 'answer': '60.01'})
        self.assertTrue(result.json()['attempt']['correct'])

class ContentTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content', verbosity=0)
        cls.admin=get_user_model().objects.create_superuser('editor',password='admin-test-only')

    def test_published_measurement_has_sections_but_drafts_do_not(self):
        from .models import LessonBlock
        lesson=Lesson.objects.get(pk='01/quantities')
        self.assertEqual(self.client.get('/api/lessons/01/quantities/').status_code,200)
        self.assertEqual(len(self.client.get('/api/lessons/01/quantities/').json()['blocks']),18)
        block=lesson.blocks.first()
        block.published=False
        block.save()
        self.assertEqual(len(self.client.get('/api/lessons/01/quantities/').json()['blocks']),17)
        lesson.content_status='draft'
        lesson.save()
        self.assertEqual(self.client.get('/api/lessons/01/quantities/').json()['blocks'],[])
        row=self.client.get('/api/curriculum/').json()['chapters'][0]['lessons'][1]
        self.assertFalse(row['available'])
        self.assertEqual(LessonBlock.objects.count(),98)

    def test_admin_forms_update_titles_and_descriptions_without_json(self):
        from .admin import ChapterForm
        chapter=Chapter.objects.get(pk='01')
        form=ChapterForm(data={'id':'01','title_en':'Measurement studio','title_ta':'அளவீட்டு மையம்','slug':'measurement','description_en':'Updated by educator','description_ta':'ஆசிரியர் திருத்தியது','formula':'L','color':'#5465ed','source':'https://e-thaksalawa.moe.gov.lk/lcms/course/view.php?id=263'},instance=chapter)
        self.assertTrue(form.is_valid(),form.errors)
        form.save()
        result=self.client.get('/api/curriculum/').json()['chapters'][0]
        self.assertEqual(result['en'],'Measurement studio')
        self.assertEqual(result['description']['ta'],'ஆசிரியர் திருத்தியது')
        self.assertIsNone(result['edit_url'])
        self.client.force_login(self.admin)
        result=self.client.get('/api/curriculum/').json()['chapters'][0]
        self.assertTrue(result['edit_url'].startswith('/admin/'))
        self.assertEqual(self.client.get(result['lessons'][1]['edit_url']).status_code,200)

    def test_invalid_checks_and_changed_lesson_slugs_are_rejected(self):
        from django.core.exceptions import ValidationError
        from .models import LessonBlock
        from .admin import LessonForm
        block=LessonBlock.objects.filter(kind='check').first()
        block.correct_option=9
        with self.assertRaises(ValidationError): block.full_clean()
        lesson=Lesson.objects.get(pk='01/quantities')
        form=LessonForm(data={'id':lesson.id,'chapter':'01','slug':'broken','title_en':lesson.title_en,'title_ta':lesson.title_ta,'position':2,'content_status':'published'},instance=lesson)
        self.assertFalse(form.is_valid())

    def test_seed_keeps_edited_and_removed_content(self):
        lesson=Lesson.objects.get(pk='01/quantities')
        block=lesson.blocks.first()
        block.body_en='Educator-owned text'
        block.save()
        call_command('seed_measurement',verbosity=0)
        block.refresh_from_db()
        self.assertEqual(block.body_en,'Educator-owned text')
        lesson.blocks.all().delete()
        lesson.content_status='draft'
        lesson.save()
        call_command('seed_measurement',verbosity=0)
        self.assertEqual(lesson.blocks.count(),0)
        lesson.refresh_from_db()
        self.assertEqual(lesson.content_status,'draft')


class QuantityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content', verbosity=0)

    def test_tables_reject_mismatched_columns(self):
        from .models import LessonBlock
        from django.core.exceptions import ValidationError
        block = LessonBlock.objects.get(lesson_id='01/quantities', key='qty-base')
        block.body_ta += ' | extra column'
        with self.assertRaises(ValidationError):
            block.full_clean()

    def test_upgrade_preserves_edits_and_is_repeatable(self):
        from .models import LessonBlock
        from django.conf import settings
        lesson = Lesson.objects.get(pk='01/quantities')
        baseline = json.loads((settings.BASE_DIR/'seed'/'quantities-v1.json').read_text(encoding='utf8'))
        for row in baseline:
            LessonBlock.objects.create(lesson=lesson, **row)
        edited = lesson.blocks.get(key='section-1')
        edited.body_en = 'Teacher edit'
        edited.save()
        call_command('upgrade_quantities', verbosity=0)
        edited.refresh_from_db()
        self.assertTrue(edited.published)
        self.assertFalse(lesson.blocks.get(key='section-2').published)
        count = lesson.blocks.count()
        call_command('upgrade_quantities', verbosity=0)
        self.assertEqual(lesson.blocks.count(), count)


class DimensionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content', verbosity=0)

    def test_dimensions_content_and_upgrade(self):
        from .models import LessonBlock
        from django.conf import settings
        lesson = Lesson.objects.get(pk='01/dimensions')
        blocks = self.client.get('/api/lessons/01/dimensions/').json()['blocks']
        self.assertEqual(len(blocks), 22)
        self.assertEqual(sum(b['kind']=='check' for b in blocks), 10)
        self.assertEqual(sum(b['kind']=='activity' for b in blocks), 4)
        baseline = json.loads((settings.BASE_DIR/'seed'/'dimensions-v1.json').read_text(encoding='utf8'))
        for row in baseline:
            LessonBlock.objects.create(lesson=lesson, **row)
        edited = lesson.blocks.get(key='section-1')
        edited.body_en = 'Teacher-owned dimension notes'
        edited.save()
        call_command('upgrade_dimensions', verbosity=0)
        edited.refresh_from_db()
        self.assertTrue(edited.published)
        self.assertFalse(lesson.blocks.get(key='section-2').published)
        count = lesson.blocks.count()
        call_command('upgrade_dimensions', verbosity=0)
        self.assertEqual(count, lesson.blocks.count())


class UncertaintyTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content', verbosity=0)

    def test_uncertainty_upgrade_keeps_teacher_edits(self):
        from .models import LessonBlock
        from django.conf import settings
        lesson = Lesson.objects.get(pk='01/uncertainty')
        data = self.client.get('/api/lessons/01/uncertainty/').json()['blocks']
        self.assertEqual(len(data), 19)
        self.assertEqual(sum(b['kind']=='activity' for b in data), 4)
        baseline = json.loads((settings.BASE_DIR/'seed'/'uncertainty-v1.json').read_text(encoding='utf8'))
        for row in baseline:
            LessonBlock.objects.create(lesson=lesson, **row)
        edited = lesson.blocks.get(key='section-1')
        edited.title_en = 'Educator-owned title'
        edited.save()
        call_command('upgrade_uncertainty', verbosity=0)
        edited.refresh_from_db()
        self.assertTrue(edited.published)
        self.assertFalse(lesson.blocks.get(key='section-2').published)
        count = lesson.blocks.count()
        call_command('upgrade_uncertainty', verbosity=0)
        self.assertEqual(lesson.blocks.count(), count)


class InstrumentTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content', verbosity=0)

    def test_instrument_upgrade_preserves_edits(self):
        from .models import LessonBlock
        from django.conf import settings
        lesson = Lesson.objects.get(pk='01/instruments')
        data = self.client.get('/api/lessons/01/instruments/').json()['blocks']
        self.assertEqual(len(data), 20)
        self.assertEqual([b['activity'] for b in data if b['kind']=='activity'], ['vernier-3d', 'micrometer-3d'])
        self.assertEqual(sum(b['instrument'] == 'vernier' for b in data), 9)
        self.assertEqual(sum(b['instrument'] == 'micrometer' for b in data), 11)
        baseline = json.loads((settings.BASE_DIR/'seed'/'instruments-v1.json').read_text(encoding='utf8'))
        for row in baseline:
            LessonBlock.objects.create(lesson=lesson, **row)
        edited = lesson.blocks.get(key='section-1')
        edited.title_en = 'Teacher instrument note'
        edited.save()
        call_command('upgrade_instruments', verbosity=0)
        edited.refresh_from_db()
        self.assertTrue(edited.published)
        self.assertFalse(lesson.blocks.get(key='section-2').published)
        count = lesson.blocks.count()
        call_command('upgrade_instruments', verbosity=0)
        self.assertEqual(lesson.blocks.count(), count)


class IntroductionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_content',verbosity=0)

    def test_intro_is_visual_has_two_simulations_and_seven_checks(self):
        data=self.client.get('/api/lessons/01/introduction/').json()['blocks']
        self.assertEqual(len(data),14)
        self.assertEqual(sum(b['kind']=='check' for b in data),7)
        self.assertEqual({b['activity'] for b in data if b['kind']=='activity'},{'pendulum','particles'})
        self.assertTrue(all(b['presentation']!='plain' for b in data if b['kind']=='theory'))

    def test_visual_layout_rejects_missing_translation(self):
        from .models import LessonBlock
        from django.core.exceptions import ValidationError
        block=LessonBlock.objects.get(lesson_id='01/introduction',key='intro-scope')
        block.body_ta=''
        with self.assertRaises(ValidationError): block.full_clean()

    def test_explicit_upgrade_archives_only_unchanged_starters(self):
        from .models import LessonBlock
        from django.conf import settings
        lesson=Lesson.objects.get(pk='01/introduction')
        baseline=json.loads((settings.BASE_DIR/'seed'/'introduction-v1.json').read_text(encoding='utf8'))
        for row in baseline: LessonBlock.objects.create(lesson=lesson,**row)
        edited=lesson.blocks.get(key='section-1');edited.body_en='An educator added this.';edited.save()
        custom=lesson.blocks.get(key='intro-scope');custom.title_en='My edited visual title';custom.save()
        call_command('upgrade_introduction',verbosity=0)
        edited.refresh_from_db();custom.refresh_from_db()
        self.assertTrue(edited.published)
        self.assertEqual(custom.title_en,'My edited visual title')
        self.assertFalse(lesson.blocks.get(key='section-2').published)
        count=lesson.blocks.count()
        call_command('upgrade_introduction',verbosity=0)
        self.assertEqual(lesson.blocks.count(),count)




