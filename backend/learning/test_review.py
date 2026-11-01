import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.management import call_command
from learning.models import Chapter, Lesson, LessonBlock, ExamQuestion, ContentRevision, EducatorFeedback


class EducatorReviewTests(TestCase):
    def setUp(self):
        call_command('setup_review_roles')
        from django.contrib.auth.models import Group
        self.educator=get_user_model().objects.create_user('teacher',password='test-only-pass')
        self.educator.groups.add(Group.objects.get(name='Educators'))
        self.student=get_user_model().objects.create_user('student')
        self.root=get_user_model().objects.create_superuser('root',password='test-only-pass')
        self.chapter=Chapter.objects.create(id='01',title_en='Measurements',title_ta='அளவீடுகள்',metadata={'slug':'measurements'})
        self.lesson=Lesson.objects.create(id='01/test',chapter=self.chapter,title_en='Test',title_ta='பாடம்',position=1,content_status='published',metadata={'slug':'test'})
        self.block=LessonBlock.objects.create(lesson=self.lesson,key='test',title_en='Velocity',title_ta='வேகம்',body_en='Before',body_ta='முன்பு')
        self.target=f'block:{self.block.pk}'
        self.client.force_login(self.educator)

    def get_content(self,target=None):
        return self.client.get('/api/review/content/',{'target':target or self.target}).json()

    def post(self,url,data):
        return self.client.post(url,data=json.dumps(data),content_type='application/json')

    def edit(self,fields,version=None,target=None):
        return self.post('/api/review/content/',{'target':target or self.target,'version':version or self.get_content(target)['version'],'fields':fields,'reason':'Terminology correction'})

    def test_publish_visible_to_student_and_audited(self):
        self.assertEqual(self.edit({'body_ta':'திருத்திய சொல்'}).status_code,200)
        self.client.force_login(self.student)
        data=self.client.get('/api/lessons/01/test/').json()
        self.assertIn('no-store',self.client.get('/api/lessons/01/test/')['Cache-Control'])
        self.assertEqual(data['blocks'][0]['body_ta'],'திருத்திய சொல்')
        row=ContentRevision.objects.get()
        self.assertEqual(row.author,self.educator)
        self.assertEqual(row.before['body_ta'],'முன்பு')
        self.assertGreater(self.client.get('/api/review/clock/').json()['revision'],0)

    def test_students_cannot_read_editor_or_write(self):
        self.client.force_login(self.student)
        self.assertEqual(self.client.get('/api/review/content/',{'target':self.target}).status_code,403)
        self.assertEqual(self.post('/api/review/content/',{}).status_code,403)
        self.assertEqual(self.client.get('/api/review/feedback/').status_code,403)
        self.client.logout()
        self.assertEqual(self.client.get('/api/review/content/').status_code,403)

    def test_no_technical_fields_and_no_stale_overwrite(self):
        version=self.get_content()['version']
        self.assertEqual(self.edit({'activity':'relative-ships'},version).status_code,400)
        self.assertEqual(self.edit({'title_en':'Corrected'},version).status_code,200)
        self.assertEqual(self.edit({'body_en':'Stale'},version).status_code,409)
        self.block.refresh_from_db()
        self.assertEqual(self.block.body_en,'Before')
        self.assertEqual(ContentRevision.objects.count(),1)

    def test_admin_edits_also_cause_conflict(self):
        version=self.get_content()['version']
        self.block.formula='v=u+at';self.block.save()
        self.assertEqual(self.edit({'body_en':'Stale'},version).status_code,409)

    def test_validation_does_not_publish_or_audit(self):
        self.assertEqual(self.edit({'title_en':''}).status_code,400)
        self.assertEqual(ContentRevision.objects.count(),0)
        self.block.refresh_from_db();self.assertEqual(self.block.title_en,'Velocity')

    def test_rollback_requires_superuser_and_preserves_history(self):
        self.edit({'body_en':'Changed'})
        pk=ContentRevision.objects.get().pk
        version=self.get_content()['version']
        self.assertEqual(self.post(f'/api/review/rollback/{pk}/',{'version':version}).status_code,403)
        self.client.force_login(self.root)
        self.assertEqual(self.post(f'/api/review/rollback/{pk}/',{'version':version}).status_code,200)
        self.block.refresh_from_db();self.assertEqual(self.block.body_en,'Before')
        self.assertEqual(ContentRevision.objects.count(),2)

    def test_feedback_reply_and_status_permissions(self):
        result=self.post('/api/review/feedback/',{'target':self.target,'category':'technical','message':'Reverse the arrow','timestamp':8})
        self.assertEqual(result.status_code,201)
        pk=result.json()['id']
        self.assertEqual(self.post(f'/api/review/feedback/{pk}/',{'message':'Please check','status':'resolved'}).status_code,403)
        self.assertEqual(self.post(f'/api/review/feedback/{pk}/',{'message':'Please check'}).status_code,200)
        self.client.force_login(self.root)
        self.assertEqual(self.post(f'/api/review/feedback/{pk}/',{'message':'Fixed','status':'resolved'}).status_code,200)
        self.assertEqual(EducatorFeedback.objects.get().replies.count(),2)

    def test_structured_answers_text_only(self):
        q=ExamQuestion.objects.create(chapter=self.chapter,kind='structured',paper='Paper',number='1',title_en='Test',title_ta='பாடம்',prompt_en='Explain',prompt_ta='விளக்குக',solution_en='Answer',solution_ta='விடை',structured_parts=[{'id':'a','prompt':{'en':'Why','ta':'ஏன்'},'answer':{'en':'Because','ta':'காரணம்'}}],published=True)
        target=f'exam:{q.pk}'
        self.assertEqual(self.edit({'structured_parts.0.answer.ta':'திருத்திய விடை'},target=target).status_code,200)
        self.assertEqual(self.edit({'structured_parts.0.image':'https://bad.test'},target=target).status_code,400)
        q.refresh_from_db();self.assertEqual(q.structured_parts[0]['answer']['ta'],'திருத்திய விடை')

    def test_builtin_captions_editable_without_changing_timing(self):
        self.block.explainer='relative-observer';self.block.save()
        self.assertIn('video_steps.0.ta',self.get_content()['fields'])
        self.assertEqual(self.edit({'video_steps.0.ta':'திருத்திய வசனம்'}).status_code,200)
        self.block.refresh_from_db()
        self.assertEqual(self.block.video_steps[1]['time'],4)

    def test_csrf_and_account_management(self):
        client=Client(enforce_csrf_checks=True);client.force_login(self.educator)
        self.assertEqual(client.post('/api/review/content/',data='{}',content_type='application/json').status_code,403)
        self.educator.is_staff=True;self.educator.save()
        self.assertEqual(self.client.get('/admin/auth/user/').status_code,403)
