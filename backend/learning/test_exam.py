import tempfile
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Chapter, ExamQuestion, validate_exam_pdf

class ExamPrepTests(TestCase):
    def setUp(self):
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        settings = override_settings(MEDIA_ROOT=self.media.name)
        settings.enable()
        self.addCleanup(settings.disable)
        self.chapter = Chapter.objects.create(id='01',title_en='Measurement',title_ta='அளவீடு')
        self.question = ExamQuestion.objects.create(chapter=self.chapter,kind='mcq',year=2024,paper='Test paper',number='1',title_en='Test',title_ta='வினா',prompt_en='Which?',prompt_ta='எது?',options_en='A\nB',options_ta='அ\nஆ',correct_option=2,solution_en='B is correct',solution_ta='ஆ சரி',published=True)

    def test_drafts_and_answers_are_not_in_catalog_or_questions(self):
        draft = ExamQuestion.objects.create(chapter=self.chapter,kind='essay',year=2023,paper='Draft',number='2',title_en='Draft',title_ta='வரைவு')
        catalog = self.client.get('/api/exam/catalog/').json()
        self.assertEqual(catalog['counts'], [{'chapter_id':'01','kind':'mcq','total':1}])
        self.assertIsNone(catalog['admin_url'])
        data = self.client.get('/api/exam/questions/?chapter=01&kind=mcq').json()
        self.assertEqual(data['total'],1)
        for key in ['correct_option','solution','marking_pdf']:
            self.assertNotIn(key,data['questions'][0])
        self.assertEqual(self.client.get(f'/api/exam/solutions/{draft.pk}/').status_code,404)
        self.assertEqual(self.client.get(f'/api/exam/solutions/{self.question.pk}/').json()['correct_option'],2)
        self.assertEqual(self.client.post('/api/exam/catalog/').status_code,405)

    def test_filter_pagination_and_unpublication(self):
        for i in range(13):
            ExamQuestion.objects.create(chapter=self.chapter,kind='essay',year=2022,paper='Fixture',number=str(i),title_en='Essay',title_ta='வினா',published=True)
        data=self.client.get('/api/exam/questions/?chapter=01&kind=essay&year=2022&page=2').json()
        self.assertEqual(len(data['questions']),1)
        self.assertEqual(data['total'],13)
        self.assertEqual(data['years'],[2022])
        self.question.published=False
        self.question.save()
        self.assertEqual(self.client.get('/api/exam/questions/?chapter=01&kind=mcq').json()['total'],0)
        self.assertEqual(self.client.get('/api/exam/questions/?chapter=01&kind=mcq&year=invalid').status_code,400)

    def test_publishing_validation(self):
        self.question.full_clean()
        self.question.correct_option=5
        with self.assertRaises(ValidationError): self.question.full_clean()
        self.question.correct_option=1
        self.question.options_ta='Only one'
        with self.assertRaises(ValidationError): self.question.full_clean()
        self.question.published=False
        self.question.full_clean()
        with self.assertRaises(ValidationError):
            validate_exam_pdf(SimpleUploadedFile('bad.pdf',b'not a pdf'))

    def test_upload_and_private_draft_download(self):
        self.question.question_pdf=SimpleUploadedFile('paper.pdf',b'%PDF-1.4\nfixture')
        self.question.published=False
        self.question.save()
        api=f'/api/exam/files/{self.question.pk}/question/'
        media=self.question.question_pdf.url
        self.assertEqual(self.client.get(api).status_code,404)
        self.assertEqual(self.client.get(media).status_code,404)
        self.question.published=True
        self.question.save()
        response=self.client.get(api)
        self.assertEqual(response.status_code,200)
        self.assertTrue(response['Content-Disposition'].startswith('attachment'))
        self.assertEqual(b''.join(response.streaming_content),b'%PDF-1.4\nfixture')
        self.question.published=False
        self.question.save()
        staff=get_user_model().objects.create_superuser('editor','editor@example.test','test-password')
        self.client.force_login(staff)
        self.assertIsNotNone(self.client.get('/api/exam/catalog/').json()['admin_url'])
        response=self.client.get(media)
        self.assertEqual(response.status_code,200)
        self.assertEqual(self.client.get('/admin/learning/examquestion/add/').status_code,200)
        response.close()

    def test_admin_upload_publish_edit_and_unpublish(self):
        staff=get_user_model().objects.create_superuser('publisher','publisher@example.test','test-password')
        self.client.force_login(staff)
        fields={'confirm_review':'on','prompt_ta':'அமுக்கத்தை வரையறுக்க.', 'position':'0','accepted_options':'[]','chapter':'01','kind':'structured','year':'2024','paper':'Fixture paper','number':'4','title_en':'Uploaded question','title_ta':'பதிவேற்றிய வினா','marks':'10','minutes':'15','published':'on',
                'question_pdf':SimpleUploadedFile('question.pdf',b'%PDF-1.4\nquestion fixture'),
                'marking_pdf':SimpleUploadedFile('marking.pdf',b'%PDF-1.4\nmarking fixture')}
        response=self.client.post('/admin/learning/examquestion/add/',fields)
        self.assertEqual(response.status_code,302)
        q=ExamQuestion.objects.get(title_en='Uploaded question')
        self.assertEqual(self.client.get('/api/exam/questions/?chapter=01&kind=structured').json()['total'],1)
        fields.pop('question_pdf');fields.pop('marking_pdf');fields.pop('published')
        fields['title_en']='Updated draft'
        response=self.client.post(f'/admin/learning/examquestion/{q.pk}/change/',fields)
        self.assertEqual(response.status_code,302)
        q.refresh_from_db()
        self.assertEqual(q.title_en,'Updated draft')
        self.assertFalse(q.published)
        self.assertEqual(self.client.get('/api/exam/questions/?chapter=01&kind=structured').json()['total'],0)

    def test_import_81_section_order_images_answers_and_preserve_edits(self):
        from django.core.management import call_command
        call_command('import_measurement_mcq', verbosity=0)
        rows=ExamQuestion.objects.filter(import_key__startswith='measurement-mcq-v1-')
        self.assertEqual(rows.count(),81)
        self.assertEqual(list(rows.values_list('number',flat=True)),list(map(str,range(1,82))))
        q8=rows.get(number='8')
        self.assertEqual(q8.accepted_options,[3,5])
        self.assertEqual(self.client.get(f'/api/exam/solutions/{q8.pk}/').json()['accepted_options'],[3,5])
        data=self.client.get('/api/exam/questions/?chapter=01&kind=mcq&section=measurements-dimensions&page=7').json()
        self.assertEqual(data['total'],79)
        self.assertEqual(data['sections'][0]['total'],79)
        self.assertEqual(data['questions'][-1]['year'],1979)
        self.assertNotIn('image',data['questions'][-1])
        self.assertNotIn('paper',data['questions'][-1])
        first=self.client.get('/api/exam/questions/?chapter=01&kind=mcq&section=measurements-dimensions').json()
        self.assertEqual(first['questions'][0]['number'],'81')
        self.assertIn('பிளாங்க்',first['questions'][0]['options']['ta'][0])
        self.assertEqual(self.client.get(f'/api/exam/files/{q8.pk}/image/').status_code,404)
        self.assertFalse(rows.get(number='11').published)
        self.assertFalse(rows.get(number='68').published)
        q8.title_en='Educator edit';q8.save()
        call_command('import_measurement_mcq',verbosity=0)
        q8.refresh_from_db();self.assertEqual(q8.title_en,'Educator edit')
        self.assertEqual(rows.count(),81)

    def test_scan_or_placeholder_cannot_be_published(self):
        self.question.prompt_en='';self.question.prompt_ta=''
        self.question.question_pdf=SimpleUploadedFile('q.pdf',b'%PDF-1.4\nsource')
        with self.assertRaises(ValidationError): self.question.full_clean()
        self.question.prompt_ta='சக்தியின் அலகு எது?'
        self.question.options_ta='தெரிவு 1\nதெரிவு 2'
        with self.assertRaises(ValidationError): self.question.full_clean()
        self.question.options_en='';self.question.options_ta='N\nJ'
        self.question.full_clean()

    def test_admin_requires_review_and_includes_extraction_panel(self):
        from .admin import ExamQuestionForm
        user=get_user_model().objects.create_superuser('reviewer','reviewer@example.test','test-password')
        self.client.force_login(user)
        response=self.client.get('/admin/learning/examquestion/add/')
        self.assertContains(response,'ocr-extract')
        self.assertContains(response,'Private source photo')
        data={'chapter':'01','kind':'mcq','year':2024,'paper':'p','number':'1','title_en':'q','title_ta':'வினா','prompt_ta':'எது?','options_ta':'N\nJ','correct_option':2,'solution_en':'J','solution_ta':'J','marks':1,'minutes':2,'position':0,'published':True}
        form=ExamQuestionForm(data=data)
        self.assertFalse(form.is_valid())
        self.assertIn('confirm_review',form.errors)
        data['confirm_review']=True
        form=ExamQuestionForm(data=data)
        self.assertTrue(form.is_valid(),form.errors)

    def test_legacy_upgrade_preserves_educator_typed_edits(self):
        from django.core.management import call_command
        call_command('import_measurement_mcq',verbosity=0)
        q=ExamQuestion.objects.get(import_key='measurement-mcq-v1-01')
        q.prompt_en='Read the original Tamil question below and select the matching option number.'
        q.options_en='Option 1\nOption 2\nOption 3\nOption 4\nOption 5';q.save()
        call_command('import_measurement_mcq',upgrade_scans=True,verbosity=0)
        q.refresh_from_db();self.assertEqual(q.prompt_en,'');self.assertNotIn('தெரிவு 1',q.options_ta)
        q.prompt_ta='Educator typed edit';q.save()
        call_command('import_measurement_mcq',upgrade_scans=True,verbosity=0)
        q.refresh_from_db();self.assertEqual(q.prompt_ta,'Educator typed edit')
